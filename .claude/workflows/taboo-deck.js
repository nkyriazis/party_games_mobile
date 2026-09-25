export const meta = {
  name: 'taboo-deck',
  description: 'Build the Greek taboo deck: audit legacy cards, plan unique targets, then write + critique cards in serial batches',
  whenToUse: 'Growing the Greek taboo deck. To add N cards: args {mode: "grow", planTarget: N}. Other modes: all|audit|plan|generate. Optional: batches, batchSize, batchOffset, batchReserve. Add a "+Nk" budget to cap spend; run ~10 batches (100 cards) per invocation for pacing',
  phases: [
    { title: 'Audit', detail: 'review legacy cards, keep and fix the good ones' },
    { title: 'Plan', detail: 'choose unique, validated targets upfront' },
    { title: 'Generate', detail: 'serial batches: writer, then independent critic who commits' },
  ],
}

const A = args || {}
const MODE = A.mode || 'all'
const PLAN_TARGET = A.planTarget || 100 // targets to have pending after planning (= new cards to add)
const BATCH_SIZE_ = A.batchSize || 10
const BATCHES = A.batches || Math.ceil(PLAN_TARGET / BATCH_SIZE_)
const BATCH_SIZE = BATCH_SIZE_
const OFFSET = A.batchOffset || 0 // numbering for chunked runs, so labels and scratch files don't collide
const WORK = A.workDir || '.taboo-work'
const LEGACY_TOTAL = 160 // taboo-legacy.json (110) + taboo-backup.json (50)
const AUDIT_CHUNK = 20
const BATCH_RESERVE = A.batchReserve || 60000 // output tokens kept in reserve for one writer+critic pair

const SKILL = 'First read .claude/skills/taboo/SKILL.md and follow it exactly: it defines the card rules, the review rubric and the validator commands. Work from the repo root.'

const CARD = {
  type: 'object',
  properties: {
    target: { type: 'string' },
    forbidden: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 5 },
    category: { type: 'string' },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
  },
  required: ['target', 'forbidden', 'category', 'difficulty'],
}
const DROPPED = {
  type: 'array',
  items: { type: 'object', properties: { target: { type: 'string' }, reason: { type: 'string' } }, required: ['target', 'reason'] },
}

const runAudit = MODE === 'all' || MODE === 'audit'
const runPlan = MODE === 'all' || MODE === 'plan' || MODE === 'grow'
const runGenerate = MODE === 'all' || MODE === 'generate' || MODE === 'grow'

// ---------------------------------------------------------------- Audit
if (runAudit) {
  phase('Audit')
  const chunks = []
  for (let s = 0; s < LEGACY_TOTAL; s += AUDIT_CHUNK) chunks.push([s, Math.min(s + AUDIT_CHUNK, LEGACY_TOTAL)])

  const audited = await parallel(chunks.map(([s, e]) => () => agent(
    `${SKILL}

Task: audit legacy cards ${s}..${e - 1}. Print them with:
node -e "const a=[...require('./src/data/taboo-legacy.json'),...require('./src/data/taboo-backup.json')];console.log(JSON.stringify(a.slice(${s},${e}),null,1))"

Apply the review rubric strictly to each card. Many legacy targets are invented words or have random forbidden words.
- reject: the target is bad (not a real common word, proper noun, too vague). Drop it.
- accept / revise: convert to the new format (lowercase accented target in dictionary form, exactly 5 forbidden words chosen by the skill's rules, category from the skill's list, difficulty). Rewriting all 5 forbidden words is fine; the legacy card is only a seed.
Write your kept cards to ${WORK}/audit-${s}.json (mkdir -p ${WORK}) and run \`node scripts/validate-taboo.mjs cards ${WORK}/audit-${s}.json\` (never --append). Fix every error except "duplicate target" (another chunk or the deck may already have it; keep yours anyway, the commit step resolves it).
Return the kept cards and the dropped targets with a short reason.`,
    {
      label: `audit ${s}-${e - 1}`,
      phase: 'Audit',
      effort: 'high',
      schema: { type: 'object', properties: { cards: { type: 'array', items: CARD }, dropped: DROPPED }, required: ['cards', 'dropped'] },
    }
  )))

  const kept = audited.filter(Boolean).flatMap((r) => r.cards)
  const dropped = audited.filter(Boolean).flatMap((r) => r.dropped)
  log(`Audit: kept ${kept.length}, dropped ${dropped.length} of ${LEGACY_TOTAL} legacy cards`)

  if (kept.length) {
    const commit = await agent(
      `Commit audited taboo cards to the deck. Write exactly this JSON array to ${WORK}/audit-all.json (mkdir -p ${WORK}), then run \`node scripts/validate-taboo.mjs cards ${WORK}/audit-all.json --append\`.
Duplicate-target rejections are expected (the legacy deck had duplicates; first one wins). Do not fix or retry them. Return the validator's appended count and rejected list.

${JSON.stringify(kept)}`,
      {
        label: 'commit audit',
        phase: 'Audit',
        effort: 'low',
        schema: {
          type: 'object',
          properties: { appended: { type: 'number' }, rejected: { type: 'array', items: { type: 'object', properties: { target: { type: 'string' }, errors: { type: 'array', items: { type: 'string' } } } } } },
          required: ['appended', 'rejected'],
        },
      }
    )
    log(`Audit committed: ${commit ? commit.appended : 0} cards appended`)
  }
}

// ---------------------------------------------------------------- Plan
if (runPlan) {
  phase('Plan')
  let pending = 0
  for (let round = 0; round < 8; round++) {
    const need = PLAN_TARGET - pending
    if (round > 0 && need <= 0) break
    const ask = Math.min(round === 0 ? 120 : need + 20, 120)
    const r = await agent(
      `${SKILL}

Task: plan new taboo targets (round ${round + 1}). Do NOT write cards, only choose target words.
1. Run \`node scripts/validate-taboo.mjs status\` and read the deck and plan (src/data/taboo-generated.json, src/data/taboo-plan.json) so you know what already exists.
2. Propose ${ask} new targets, each {target, category, difficulty}, following the skill's "Choosing targets" rules: words every adult Greek speaker knows, dictionary form, lowercase with accents. Balance: fill underrepresented categories from the skill's list, the 40/40/20 easy/medium/hard mix, and the 65/20/15 concrete/verbs-adjectives/abstract mix. The difficulty is your prediction; the card writer may change it.
   For variety, walk through scenes of Greek daily life: home, kitchen, λαϊκή, school, office, καφετέρια, ταβέρνα, beach, village, πανηγύρι, γάμος, βάφτιση, Πάσχα, army, hospital, sports, holidays, family, emotions, weather, nature, city, transport, technology.
3. Write them to ${WORK}/plan-${round}.json (mkdir -p ${WORK}) and run \`node scripts/validate-taboo.mjs targets ${WORK}/plan-${round}.json --append\`.
4. Fix rejected entries (usually a missing accent or a non-dictionary form) and re-run with only the fixed ones. For each "similar to existing target" warning, decide: if it's truly the same concept (μπάσκετ/μπασκέτα), remove it with \`node scripts/validate-taboo.mjs skip <target> "near-duplicate of X"\`.
Return how many targets you added and the plan's pending count (from \`status\`).`,
      {
        label: `plan round ${round + 1}`,
        phase: 'Plan',
        effort: 'high',
        schema: { type: 'object', properties: { added: { type: 'number' }, pending: { type: 'number' } }, required: ['added', 'pending'] },
      }
    )
    if (!r) break
    pending = r.pending
    log(`Plan round ${round + 1}: +${r.added}, pending ${pending}/${PLAN_TARGET}`)
    if (r.added === 0) break
  }
}

// ---------------------------------------------------------------- Generate
const totals = { appended: 0, revised: 0, rejected: 0, skipped: 0 }
if (runGenerate) {
  phase('Generate')
  let lessons = []
  for (let b = 0; b < BATCHES; b++) {
    const i = b + OFFSET
    // Pacing: with a "+Nk" budget, stop while there's still room for a full writer+critic pair.
    if (budget.total && budget.remaining() < BATCH_RESERVE) {
      log(`Budget guard: ${Math.round(budget.remaining() / 1000)}k tokens left, stopping before batch ${i + 1}. Resume later with mode "generate".`)
      break
    }
    const lessonText = lessons.length
      ? `\nThe critic flagged these recurring mistakes in earlier batches. Avoid them:\n${lessons.map((l) => `- ${l}`).join('\n')}\n`
      : ''

    const w = await agent(
      `${SKILL}

Task: write taboo batch ${i + 1}.
1. Run \`node scripts/validate-taboo.mjs next ${BATCH_SIZE}\` to get your targets. If it prints [], return empty cards and skipped.
2. For a target that turns out to be bad (not common, a near-duplicate of a deck target, impossible to describe fairly), run \`node scripts/validate-taboo.mjs skip <target> "<reason>"\` and don't write it.
3. Write one card per remaining target, following "Choosing the 5 forbidden words" and "Difficulty". Take your time on each card: name the way of describing it that each forbidden word blocks, run the core test and the fairness check.
4. Write the cards to ${WORK}/batch-${i}.json (mkdir -p ${WORK}) and run \`node scripts/validate-taboo.mjs cards ${WORK}/batch-${i}.json\` (NOT --append; the critic commits). Fix every error; resolve or consciously accept each warning.
${lessonText}
Return the cards and the skipped targets.`,
      {
        label: `write batch ${i + 1}`,
        phase: 'Generate',
        effort: 'high',
        schema: { type: 'object', properties: { cards: { type: 'array', items: CARD }, skipped: DROPPED }, required: ['cards', 'skipped'] },
      }
    )
    if (!w) { log(`Batch ${i + 1}: writer failed, stopping`); break }
    totals.skipped += w.skipped.length
    if (!w.cards.length) {
      if (!w.skipped.length) { log('Plan exhausted; stopping'); break }
      continue
    }

    const c = await agent(
      `${SKILL}

You are the critic for taboo batch ${i + 1}. Someone else wrote these cards. Be strict: a bad card ruins a round, and rejecting one costs nothing.
Apply the review rubric to every card. For each, actually play it: what is the first thing you'd say? Is it forbidden? Would a teammate guess the target from the 5 forbidden words alone?
- accept as-is, revise (fix forbidden words / difficulty / category), or reject (bad target).
Then:
1. Write the accepted and revised cards to ${WORK}/batch-${i}-final.json and run \`node scripts/validate-taboo.mjs cards ${WORK}/batch-${i}-final.json\`. Fix any errors, then re-run with --append.
2. For each rejected card, run \`node scripts/validate-taboo.mjs skip <target> "<reason>"\`.
3. Name up to 3 general, reusable lessons about the writer's mistakes (e.g. "puts two action verbs on one card"). Skip one-off issues. Return [] if the batch was clean.

Cards:
${JSON.stringify(w.cards, null, 1)}`,
      {
        label: `critique batch ${i + 1}`,
        phase: 'Generate',
        effort: 'high',
        schema: {
          type: 'object',
          properties: {
            accepted: { type: 'number' },
            revised: { type: 'number' },
            rejected: DROPPED,
            appended: { type: 'number' },
            deckSize: { type: 'number' },
            lessons: { type: 'array', items: { type: 'string' } },
          },
          required: ['accepted', 'revised', 'rejected', 'appended', 'lessons'],
        },
      }
    )
    if (!c) { log(`Batch ${i + 1}: critic failed, stopping (cards in ${WORK}/batch-${i}.json were not committed)`); break }
    totals.appended += c.appended
    totals.revised += c.revised
    totals.rejected += c.rejected.length
    lessons = [...c.lessons, ...lessons].filter((l, k, arr) => arr.indexOf(l) === k).slice(0, 8)
    log(`Batch ${i + 1} (${b + 1}/${BATCHES} this run): +${c.appended} (accepted ${c.accepted}, revised ${c.revised}, rejected ${c.rejected.length}), deck ${c.deckSize ?? '?'}`)
  }
}

return { mode: MODE, totals }
