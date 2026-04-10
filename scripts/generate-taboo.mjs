// LLM-Powered Taboo Card Generator
// Uses LangChain with structured outputs to generate high-quality Greek taboo cards

import { z } from 'zod';
import { ChatOllama } from '@langchain/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import fs from 'fs';

// Taboo Card Schema - the LLM will generate cards matching this structure
const TabooCardSchema = z.object({
  target: z.string().describe('The main word to be described in the game (in Greek)'),
  forbidden: z.array(z.string()).describe('4-5 Greek words that would make describing the target TOO EASY'),
  category: z.string().describe('The Greek category of the target word (e.g., "φαγητό", "οικογένεια", "αθλητισμός")'),
  analysis: z.string().describe('A first-person narrative of playing the game with this word, describing the thought process that leads to these forbidden words'),
});

const TabooCardsSchema = z.array(TabooCardSchema);

// Prompt template teaching the LLM to think like a Taboo player
const TABOO_PROMPT = `
You are designing cards for a Greek Taboo party game. Before you design each card, PLAY THE GAME IN YOUR MIND.

THE PLAYER'S JOURNEY (READ THIS FIRST):
----------------------------------------
When a player draws a card, their mind does this:
1. They see the TARGET word at the top
2. Their brain immediately starts forming sentences to describe it
3. The FIRST words that pop into their head are the FORBIDDEN words
4. These are words they would BLURT OUT before remembering NOT to say them

The game is about catching yourself in the act of almost saying the forbidden word.
It's NOT about synonyms - it's about what pops into your head FIRST.

CHAIN-OF-THOUGHT FOR EACH CARD:
1. Imagine you are the player seeing this word for the first time
2. What are the FIRST 4-5 words that come to mind?
3. These are the words you would say BEFORE catching yourself
4. These become the forbidden words

RULES FOR GOOD TABOO CARDS:

1. TARGET WORD:
   - Must be a concrete, commonly used Greek word (2-4 syllables)
   - Prefer nouns, verbs, or adjectives
   - Must NOT be a name or proper noun

2. THE FORBIDDEN WORD TEST (ASK YOURSELF):
   - If I say this word, would the team immediately know the target?
   - Is this the FIRST word that pops into my head when I see the target?
   - If YES to either, it belongs in forbidden

3. WHAT MAKES A GOOD FORBIDDEN WORD:
   - The WORD ITSELF gives away the answer (not just context)
   - It's the first word your brain says before your mouth catches up
   - Examples that work:
     * "Marco" -> "Polo" immediately follows "Marco" in the mind
     * "Coffee" -> "drink" is the first category that comes to mind
     * "Run" -> "fast" or "move" are the first verbs that come to mind
   - Examples that DON'T work:
     * "Coffee" -> "bean" (not the first thing people think)
     * "Coffee" -> "espresso" (too specific, not the first thing)
     * "Coffee" -> "morning" (context, not the word itself)

4. WHAT TO AVOID:
   - Words that need explanation to connect to the target
   - Words that are too obscure or unrelated
   - Words from completely different domains
   - The target word itself
   - Duplicate words in the forbidden list

5. CARD QUALITY:
   - 4-5 forbidden words per card (no more, no less)
   - All forbidden words should feel like natural, first-thought responses
   - Category should be meaningful, accurate, and in Greek only
   - ALL words in the forbidden list MUST be Greek (no English words)

ANALYSIS FORMAT (IMPORTANT - WRITE LIKE THE PLAYER IS THINKING):
Start with: "Όταν δω τη λέξη '[target]', πρώτο πράγμα που μου έρχεται στο μυαλό είναι..."
Then list: "Μετά μου έρχεται στο μυαλό [forbidden word]..."
Keep it fully in Greek, conversational, like you're narrating your own thought process

OUTPUT FORMAT:
Return a JSON array with 10 objects. Each object must have:
- target: the Greek word
- forbidden: array of 4-5 Greek constraint words
- category: Greek category
- analysis: first-person narrative of the thought process

ΠΑΡΑΔΕΙΓΜΑΤΑ (ΠΑΙΖΟΝΤΑΣ ΤΟ ΠΑΙΧΝΙΔΙ ΣΤΟ ΜΥΑΛΟ ΜΟΥ):
---------------------------------------

Στόχος: "ΜΑΡΚΟ"
Η σκέψη μου: "Όταν δω το 'Μαρκο', το πρώτο που μου έρχεται στο μυαλό είναι... Πόλο! Αυτό είναι αυτόματο. Μετά μου έρχεται στο μυαλό 'απάντηση', μετά 'συνέχεια', 'κάλεσμα', 'απάντηση' - όλα τα πράγματα που ακολουθούν το 'Μαρκο' στο μυαλό μου. Αν πω κάποια από αυτά, η ομάδα το ξέρει αμέσως."
Απαγορευμένες: ["Πόλο", "απάντηση", "συνέχεια", "κάλεσμα", "απάντηση"]

Στόχος: "ΚΑΦΕΣ"
Η σκέψη μου: "Όταν δω τον 'Καφέ', το πρώτο που μου έρχεται στο μυαλό είναι... 'ποτό' - αυτή είναι η κατηγορία. Μετά μου έρχεται στο μυαλό 'καφεΐνη' - αυτό είναι αυτό που το κάνει. Μετά 'πρωί' - αυτή την ώρα το πίνω. Μετά 'εσπρέσο' - αυτό είναι ένα είδος. Αν πω 'ποτό', το ξέρουν αμέσως."
Απαγορευμένες: ["ποτό", "καφεΐνη", "πρωί", "εσπρέσο"]

Στόχος: "ΤΡΕΧΩ"
Η σκέψη μου: "Όταν δω το 'Τρέχω', το πρώτο που μου έρχεται στο μυαλό είναι... 'κίνηση' - αυτή είναι η βασική ενέργεια. Μετά μου έρχεται στο μυαλό 'γρήγορα' - αυτό είναι το τρέξιμο. Μετά 'σπριντ' - αυτό είναι τρέξιμο σκληρά. Μετά 'τρέλα' - αυτό είναι τρέξιμο αργά. Αν πω 'κίνηση', το καταλαβαίνουν."
Απαγορευμένες: ["κίνηση", "γρήγορα", "σπριντ", "τρέλα"]

Στόχος: "ΜΑΜΑ"
Η σκέψη μου: "Όταν δω τη 'Μάμα', το πρώτο που μου έρχεται στο μυαλό είναι... 'μαμάκι' - αυτή είναι η λέξη. Μετά 'γονέας' - πολύ γενικό. Μετά 'οικογένεια' - είναι μέρος της οικογένειας. Μετά 'γέννα' - αυτή είναι η πρώτη της εισαγωγή. Αν πω 'μαμάκι', το ξέρουν αμέσως."
Απαγορευμένες: ["μαμάκι", "γονέας", "οικογένεια", "γέννα"]

Greek words only (modern Greek, not ancient). Return exactly 10 cards with full analysis.

IMPORTANT: You MUST NOT reuse target words from previous cards. Each card must have a UNIQUE target word.`;

// Generate cards using LangChain with structured output
async function generateCards(llm, count = 10, excludedTargets = []) {
  let systemPrompt = TABOO_PROMPT;

  if (excludedTargets.length > 0) {
    const excludedStr = `\n\nIMPORTANT EXCLUSION LIST - DO NOT USE ANY OF THESE AS TARGET WORDS:\n${excludedTargets.map(w => `- ${w}`).join('\n')}\n\nEach new card MUST have a target word NOT in this list. Be extra careful to choose completely different words.`;
    systemPrompt += excludedStr;
  }

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', `Generate {count} taboo cards. Make sure target words are NOT in the exclusion list above.`],
  ]);

  // Use withStructuredOutput to enforce the schema on the model
  const structuredLlm = llm.withStructuredOutput(TabooCardsSchema);

  const chain = prompt.pipe(structuredLlm);

  const result = await chain.invoke({ count });

  // Deduplicate by target word
  const deduped = Array.from(new Map(result.map((c) => [c.target, c])).values());
  // Also deduplicate forbidden words within each card
  return deduped.map(card => ({
    target: card.target,
    forbidden: Array.from(new Set(card.forbidden)),
    category: card.category,
    analysis: card.analysis
  }));
}

// Load previously generated cards to track used targets
function loadExistingCards(path) {
  try {
    if (fs.existsSync(path)) {
      const data = fs.readFileSync(path, 'utf8');
      const cards = JSON.parse(data);
      return Array.isArray(cards) ? cards : [];
    }
  } catch (e) {
    console.warn(`Could not load existing cards from ${path}: ${e.message}`);
  }
  return [];
}

// Generate cards in batches with exclusion tracking
async function generateBatches(llm, totalCount, batchSize, outputPath) {
  const existing = loadExistingCards(outputPath);
  const existingTargets = new Set(existing.map(c => c.target));

  let allCards = [...existing];
  let batchNumber = 1;
  let generatedInThisRun = 0;

  console.log(`Starting batch generation: ${totalCount} total, ${batchSize} per batch`);
  console.log(`Found ${existingTargets.size} existing target words to exclude\n`);

  while (generatedInThisRun < totalCount) {
    const remaining = totalCount - generatedInThisRun;
    const currentBatchSize = Math.min(batchSize, remaining);

    console.log(`--- Batch ${batchNumber} ---`);
    console.log(`Generating ${currentBatchSize} cards (batch ${batchNumber})...`);
    console.log(`Excluding ${existingTargets.size} previously used targets\n`);

    const excludedList = Array.from(existingTargets).sort();
    const newCards = await generateCards(llm, currentBatchSize, excludedList);

    // Validate no duplicates with existing targets
    const validatedCards = newCards.filter(card => {
      if (existingTargets.has(card.target)) {
        console.log(`  [SKIP] Duplicate target: "${card.target}"`);
        return false;
      }
      return true;
    });

    if (validatedCards.length === 0) {
      console.log('No valid new cards generated, stopping.');
      break;
    }

    // Track new targets and add to allCards
    let newUnique = 0;
    for (const card of validatedCards) {
      existingTargets.add(card.target);
      allCards.push(card);
      newUnique++;
      generatedInThisRun++;
    }

    console.log(`Batch ${batchNumber} result: ${newUnique} new unique targets`);
    console.log(`Total accumulated: ${allCards.length} cards\n`);

    // Save after each batch
    fs.writeFileSync(outputPath, JSON.stringify(allCards, null, 2));
    console.log(`Saved to ${outputPath}\n`);

    batchNumber++;
  }

  console.log(`=== Generation Complete ===`);
  console.log(`Total cards: ${allCards.length}`);
  console.log(`New cards in this run: ${generatedInThisRun}`);

  return allCards;
}

async function main() {
  const outputPath = '/home/kyriazis/work/tick_tack_boom/src/data/taboo-generated.json';

  // Parse command line arguments: node script.mjs <totalCount> <batchSize>
  const args = process.argv.slice(2);
  const totalCount = parseInt(args[0], 10) || 10;
  const batchSize = parseInt(args[1], 10) || 5;

  // Initialize LLM with Ollama
  const llm = new ChatOllama({
    model: 'qwen3-coder-256k',
    baseUrl: 'http://139.91.185.101:11434',
    temperature: 0.7,
  });

  console.log(`\nGenerating ${totalCount} taboo cards in batches of ${batchSize}...`);
  console.log(`Model: ${llm.model}\n`);

  const cards = await generateBatches(llm, totalCount, batchSize, outputPath);

  // Show first card
  if (cards.length > 0) {
    console.log('First card:');
    console.log(JSON.stringify(cards[0], null, 2));
  }
}

main().catch(console.error);

export { generateCards };
