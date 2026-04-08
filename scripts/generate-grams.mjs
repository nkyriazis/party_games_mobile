import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VOWELS = new Set(['Α', 'Ε', 'Η', 'Ι', 'Ο', 'Υ', 'Ω']);
const ALLOWED_BIGRAM_CLUSTERS = new Set([
  'ΒΓ', 'ΒΔ', 'ΒΛ', 'ΒΡ', 'ΓΔ', 'ΓΚ', 'ΓΛ', 'ΓΝ', 'ΓΡ', 'ΔΡ', 'ΘΛ', 'ΘΡ',
  'ΚΛ', 'ΚΝ', 'ΚΡ', 'ΚΤ', 'ΜΝ', 'ΜΠ', 'ΝΤ', 'ΠΛ', 'ΠΝ', 'ΠΡ', 'ΣΒ', 'ΣΓ',
  'ΣΔ', 'ΣΘ', 'ΣΚ', 'ΣΛ', 'ΣΜ', 'ΣΝ', 'ΣΠ', 'ΣΤ', 'ΣΦ', 'ΣΧ', 'ΤΖ', 'ΤΜ',
  'ΤΡ', 'ΤΣ', 'ΦΘ', 'ΦΛ', 'ΦΡ', 'ΧΘ', 'ΧΛ', 'ΧΝ', 'ΧΡ'
]);

const RULES = [
  {
    size: 2,
    minWordCount: 500,
    maxWordCount: 60000,
    isAllowed: (gram) => containsVowel(gram) || ALLOWED_BIGRAM_CLUSTERS.has(gram),
  },
  {
    size: 3,
    minWordCount: 3000,
    maxWordCount: 12000,
    isAllowed: (gram) => containsVowel(gram),
  },
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const wordListPath = path.join(projectRoot, 'public', 'greek_wordlist.txt');
const outputPath = path.join(projectRoot, 'src', 'data', 'grams.json');
const greekCollator = new Intl.Collator('el', { sensitivity: 'base' });

function normalizeGreek(word) {
  return word
    .trim()
    .toLocaleUpperCase('el-GR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^Α-Ω]/g, '');
}

function containsVowel(gram) {
  return [...gram].some((letter) => VOWELS.has(letter));
}

function collectSupportedWords(text) {
  const words = text
    .split(/\r?\n/)
    .map(normalizeGreek)
    .filter((word) => word.length >= 2);

  return [...new Set(words)];
}

function countWordSupport(words, size) {
  const counts = new Map();

  for (const word of words) {
    if (word.length < size) {
      continue;
    }

    const seenInWord = new Set();
    for (let index = 0; index <= word.length - size; index += 1) {
      const gram = word.slice(index, index + size);
      if (/^[Α-Ω]+$/.test(gram)) {
        seenInWord.add(gram);
      }
    }

    for (const gram of seenInWord) {
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
    }
  }

  return counts;
}

function selectGrams(counts, rule) {
  return [...counts.entries()]
    .filter(([, count]) => count >= rule.minWordCount && count <= rule.maxWordCount)
    .map(([gram, count]) => ({ gram, count }))
    .filter(({ gram }) => rule.isAllowed(gram))
    .sort((left, right) => greekCollator.compare(left.gram, right.gram));
}

function formatSummary(selectedByRule) {
  return selectedByRule
    .map(({ rule, selected }) => `${rule.size}-grams=${selected.length}`)
    .join(', ');
}

async function main() {
  const wordList = await readFile(wordListPath, 'utf8');
  const words = collectSupportedWords(wordList);

  const selectedByRule = RULES.map((rule) => {
    const counts = countWordSupport(words, rule.size);
    const selected = selectGrams(counts, rule);
    return { rule, selected };
  });

  const grams = selectedByRule
    .flatMap(({ selected }) => selected.map(({ gram }) => gram));

  await writeFile(outputPath, `${JSON.stringify(grams, null, 2)}\n`, 'utf8');

  console.log(
    `Generated ${grams.length} grams from ${words.length} normalized words (${formatSummary(selectedByRule)}).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});