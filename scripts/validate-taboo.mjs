// Taboo deck validator and bookkeeping CLI.
//
// Deck:  src/data/taboo-generated.json  (source of truth, appended to in batches)
// Plan:  src/data/taboo-plan.json       (targets chosen upfront, consumed by batches)
//
// Usage:
//   node scripts/validate-taboo.mjs cards <file.json> [--append]   check candidate cards (and append the clean ones)
//   node scripts/validate-taboo.mjs replace <file.json>            replace deck cards that have the same target (validated)
//   node scripts/validate-taboo.mjs remove <target> <reason>       remove a card from the deck
//   node scripts/validate-taboo.mjs targets <file.json> [--append] check planned targets (and add the clean ones to the plan)
//   node scripts/validate-taboo.mjs next <n>                       print the next n pending plan entries
//   node scripts/validate-taboo.mjs skip <target> <reason>         mark a plan entry as skipped
//   node scripts/validate-taboo.mjs status                         deck/plan counts by category and difficulty
//   node scripts/validate-taboo.mjs deck                           re-check the whole deck
//
// Every command prints JSON. Errors block a card/target; warnings are for a human (or critic) to judge.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DECK_PATH = path.join(projectRoot, 'src', 'data', 'taboo-generated.json');
const PLAN_PATH = path.join(projectRoot, 'src', 'data', 'taboo-plan.json');
const WORDLIST_PATH = path.join(projectRoot, 'public', 'greek_wordlist.txt');
// Real, everyday words missing from the wordlist (mostly recent loanwords). One per line; # comments allowed.
const EXTRA_WORDS_PATH = path.join(projectRoot, 'src', 'data', 'taboo-extra-words.txt');

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const FORBIDDEN_COUNT = 5;

// Strip accents/diaeresis, lowercase, unify final sigma.
export const norm = (w) =>
  w.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ς/g, 'σ').trim();

const commonPrefix = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

// Same word family: long shared prefix, or one contains the other.
// ψωμί/ψωμάκι, καφές/καφεΐνη, πόρτα/πορτάκι.
export const sharesRoot = (a, b) => {
  const x = norm(a);
  const y = norm(b);
  if (x === y) return true;
  const shorter = Math.min(x.length, y.length);
  if (shorter >= 4 && (x.includes(y) || y.includes(x))) return true;
  return commonPrefix(x, y) >= Math.max(3, Math.min(4, shorter - 1));
};

// Looser test for "these two targets are probably the same concept" (warning only).
const nearTarget = (a, b) => {
  const x = norm(a);
  const y = norm(b);
  return commonPrefix(x, y) >= Math.max(4, Math.min(x.length, y.length) - 2);
};

let wordlist;
const inWordlist = (w) => {
  if (!wordlist) {
    const lines = (p) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n') : []);
    wordlist = new Set(
      [...lines(WORDLIST_PATH), ...lines(EXTRA_WORDS_PATH).map((l) => l.replace(/#.*/, ''))].map((l) => l.trim())
    );
  }
  return wordlist.has(w);
};

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);
const writeJson = (p, data) => writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
const out = (data) => console.log(JSON.stringify(data, null, 2));

const checkTargetWord = (target, errors) => {
  if (typeof target !== 'string' || !target.trim()) {
    errors.push('target missing');
    return false;
  }
  if (/\s/.test(target.trim())) errors.push('target must be a single word');
  if (target !== target.toLowerCase()) errors.push('target must be lowercase with accents (e.g. "ψωμί")');
  else if (!inWordlist(target)) errors.push(`target "${target}" not in greek_wordlist.txt or taboo-extra-words.txt (typo, missing accent, or not a real word)`);
  return true;
};

// Compare a target against existing targets; exact duplicates are errors, near ones warnings.
const checkAgainst = (target, existing, errors, warnings) => {
  const n = norm(target);
  for (const other of existing) {
    if (norm(other) === n) errors.push(`duplicate target: "${other}" already exists`);
    else if (nearTarget(target, other)) warnings.push(`similar to existing target "${other}"`);
  }
};

const checkCard = (card, existingTargets) => {
  const errors = [];
  const warnings = [];
  if (!checkTargetWord(card.target, errors)) return { errors, warnings };

  const f = card.forbidden;
  if (!Array.isArray(f) || f.length !== FORBIDDEN_COUNT) {
    errors.push(`forbidden must have exactly ${FORBIDDEN_COUNT} words`);
  } else {
    const seen = new Set();
    f.forEach((w, i) => {
      if (typeof w !== 'string' || !w.trim()) return errors.push(`forbidden[${i}] empty`);
      if (w !== w.toLowerCase()) errors.push(`forbidden "${w}" must be lowercase`);
      for (const token of w.trim().split(/\s+/)) {
        if (!inWordlist(token.toLowerCase())) errors.push(`forbidden "${w}": "${token}" not in greek_wordlist.txt or taboo-extra-words.txt`);
      }
      if (sharesRoot(w, card.target)) errors.push(`forbidden "${w}" shares a root with the target (already implicitly banned)`);
      if (seen.has(norm(w))) errors.push(`forbidden "${w}" repeated`);
      seen.add(norm(w));
    });
    for (let i = 0; i < f.length; i++)
      for (let j = i + 1; j < f.length; j++)
        if (typeof f[i] === 'string' && typeof f[j] === 'string' && norm(f[i]) !== norm(f[j]) && sharesRoot(f[i], f[j]))
          warnings.push(`forbidden "${f[i]}" and "${f[j]}" look like the same word family (wasted slot?)`);
  }

  if (typeof card.category !== 'string' || !card.category.trim()) errors.push('category missing');
  if (!DIFFICULTIES.includes(card.difficulty)) errors.push(`difficulty must be one of ${DIFFICULTIES.join('/')}`);

  checkAgainst(card.target, existingTargets, errors, warnings);
  return { errors, warnings };
};

const loadDeck = () => readJson(DECK_PATH, []);
const loadPlan = () => readJson(PLAN_PATH, []);

const pendingPlan = (deck = loadDeck(), plan = loadPlan()) => {
  const done = new Set(deck.map((c) => norm(c.target)));
  return plan.filter((p) => !p.skipped && !done.has(norm(p.target)));
};

const commands = {
  cards(file, flag) {
    const candidates = readJson(file);
    const deck = loadDeck();
    const existing = deck.map((c) => c.target);
    const accepted = [];
    const report = { accepted: [], rejected: [], warnings: [] };
    for (const card of candidates) {
      const { errors, warnings } = checkCard(card, existing);
      if (warnings.length) report.warnings.push({ target: card.target, warnings });
      if (errors.length) {
        report.rejected.push({ target: card.target, errors });
      } else {
        accepted.push({
          target: card.target,
          forbidden: card.forbidden,
          category: card.category.trim(),
          difficulty: card.difficulty,
        });
        existing.push(card.target); // catches duplicates within the batch too
        report.accepted.push(card.target);
      }
    }
    if (flag === '--append' && accepted.length) {
      writeJson(DECK_PATH, [...deck, ...accepted]);
      report.appended = accepted.length;
      report.deckSize = deck.length + accepted.length;
    }
    out(report);
  },

  targets(file, flag) {
    const candidates = readJson(file);
    const plan = loadPlan();
    const existing = [...loadDeck().map((c) => c.target), ...plan.map((p) => p.target)];
    const accepted = [];
    const report = { accepted: [], rejected: [], warnings: [] };
    for (const entry of candidates) {
      const errors = [];
      const warnings = [];
      if (checkTargetWord(entry.target, errors)) checkAgainst(entry.target, existing, errors, warnings);
      if (!DIFFICULTIES.includes(entry.difficulty)) errors.push(`difficulty must be one of ${DIFFICULTIES.join('/')}`);
      if (typeof entry.category !== 'string' || !entry.category.trim()) errors.push('category missing');
      if (warnings.length) report.warnings.push({ target: entry.target, warnings });
      if (errors.length) report.rejected.push({ target: entry.target, errors });
      else {
        accepted.push({ target: entry.target, category: entry.category.trim(), difficulty: entry.difficulty });
        existing.push(entry.target);
        report.accepted.push(entry.target);
      }
    }
    if (flag === '--append' && accepted.length) {
      writeJson(PLAN_PATH, [...plan, ...accepted]);
      report.appended = accepted.length;
      report.pending = pendingPlan().length;
    }
    out(report);
  },

  replace(file) {
    const updates = readJson(file);
    const deck = loadDeck();
    const report = { replaced: [], rejected: [], warnings: [] };
    for (const card of updates) {
      const idx = deck.findIndex((c) => norm(c.target) === norm(card.target ?? ''));
      if (idx === -1) {
        report.rejected.push({ target: card.target, errors: ['not in deck'] });
        continue;
      }
      const others = deck.filter((_, i) => i !== idx).map((c) => c.target);
      const { errors, warnings } = checkCard(card, others);
      if (warnings.length) report.warnings.push({ target: card.target, warnings });
      if (errors.length) report.rejected.push({ target: card.target, errors });
      else {
        deck[idx] = { target: card.target, forbidden: card.forbidden, category: card.category.trim(), difficulty: card.difficulty };
        report.replaced.push(card.target);
      }
    }
    if (report.replaced.length) writeJson(DECK_PATH, deck);
    out(report);
  },

  remove(target, ...reason) {
    const deck = loadDeck();
    const idx = deck.findIndex((c) => norm(c.target) === norm(target ?? ''));
    if (idx === -1) return out({ error: `"${target}" not in deck` });
    const [card] = deck.splice(idx, 1);
    writeJson(DECK_PATH, deck);
    out({ removed: card.target, reason: reason.join(' '), deckSize: deck.length });
  },

  next(n = '10') {
    out(pendingPlan().slice(0, Number(n)));
  },

  skip(target, ...reason) {
    const plan = loadPlan();
    const entry = plan.find((p) => norm(p.target) === norm(target ?? ''));
    if (!entry) return out({ error: `"${target}" not in plan` });
    entry.skipped = reason.join(' ') || 'skipped';
    writeJson(PLAN_PATH, plan);
    out({ skipped: entry.target, reason: entry.skipped });
  },

  status() {
    const deck = loadDeck();
    const plan = loadPlan();
    const count = (items, key) =>
      Object.fromEntries(
        Object.entries(items.reduce((acc, x) => ((acc[x[key]] = (acc[x[key]] || 0) + 1), acc), {})).sort(
          (a, b) => b[1] - a[1]
        )
      );
    const pending = pendingPlan(deck, plan);
    out({
      deck: { size: deck.length, byCategory: count(deck, 'category'), byDifficulty: count(deck, 'difficulty') },
      plan: {
        size: plan.length,
        pending: pending.length,
        skipped: plan.filter((p) => p.skipped).length,
        pendingByCategory: count(pending, 'category'),
      },
    });
  },

  deck() {
    const deck = loadDeck();
    const problems = [];
    deck.forEach((card, i) => {
      const earlier = deck.slice(0, i).map((c) => c.target);
      const { errors, warnings } = checkCard(card, earlier);
      if (errors.length || warnings.length) problems.push({ target: card.target, errors, warnings });
    });
    out({ size: deck.length, withErrors: problems.filter((p) => p.errors.length).length, problems });
  },
};

const [cmd, ...rest] = process.argv.slice(2);
if (!commands[cmd]) {
  console.error('Usage: validate-taboo.mjs cards|targets <file> [--append] | replace <file> | remove <target> <reason> | next <n> | skip <target> <reason> | status | deck');
  process.exit(2);
}
commands[cmd](...rest);
