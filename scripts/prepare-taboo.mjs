// Prepare Taboo Data for Build
// Converts taboo-generated.json to simplified format for use in the app
// If generated file doesn't exist, falls back to taboo.json

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const generatedPath = path.join(projectRoot, 'src', 'data', 'taboo-generated.json');
const outputPath = path.join(projectRoot, 'src', 'data', 'taboo.json');

// Taboo Card Schema - simplified format for the app
const TabooCardSchema = {
  target: '', // The main word to be described
  forbidden: [], // Array of 4-5 words that should not be said
  category: '', // The category of the target word
};

/**
 * Normalize a card to the simplified format
 * Strips any extra fields like 'analysis' that aren't needed by the app
 */
function normalizeCard(card) {
  return {
    target: card.target,
    forbidden: Array.isArray(card.forbidden) ? card.forbidden : [],
    category: card.category || 'general',
  };
}

/**
 * Load cards from a file
 */
async function loadCards(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    const cards = JSON.parse(data);
    if (!Array.isArray(cards)) {
      console.warn(`File ${filePath} does not contain an array, returning empty array`);
      return [];
    }
    return cards;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`File not found: ${filePath}`);
      return [];
    }
    throw error;
  }
}

/**
 * Main function to prepare taboo data
 */
async function main() {
  console.log('=== Preparing Taboo Data ===\n');

  // Try to load from generated file first
  let cards = [];
  let sourceFile = '';

  if (generatedPath.includes('taboo-generated')) {
    try {
      const generatedCards = await loadCards(generatedPath);
      if (generatedCards.length > 0) {
        cards = generatedCards;
        sourceFile = 'taboo-generated.json';
        console.log(`Loaded ${cards.length} cards from ${sourceFile}`);
      }
    } catch (error) {
      console.warn(`Could not load ${generatedPath}: ${error.message}`);
    }
  }

  // Fallback to basic taboo.json if no generated cards
  if (cards.length === 0) {
    const fallbackPath = path.join(projectRoot, 'src', 'data', 'taboo.json');
    const fallbackCards = await loadCards(fallbackPath);
    if (fallbackCards.length > 0) {
      cards = fallbackCards;
      sourceFile = 'taboo.json (fallback)';
      console.log(`Loaded ${cards.length} cards from ${sourceFile}`);
    }
  }

  // Normalize cards to simplified format
  const normalizedCards = cards.map(normalizeCard);

  // Write to output
  await writeFile(outputPath, `${JSON.stringify(normalizedCards, null, 2)}\n`, 'utf8');

  console.log(`\nPrepared ${normalizedCards.length} cards`);
  console.log(`Output: ${outputPath}`);
  console.log(`Source: ${sourceFile}`);
  console.log('\nDone.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
