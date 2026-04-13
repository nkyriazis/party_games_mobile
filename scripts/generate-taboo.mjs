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
Return a JSON array with {count} objects. Each object must have:
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

Greek words only (modern Greek, not ancient). Return exactly {count} cards with full analysis.
`;

// Generate cards using LangChain with structured output
async function generateCards(llm, count, timestamp) {
  let systemPrompt = TABOO_PROMPT;

  // Add timestamp for stochasticity at the top
  const randomStr = timestamp ? `Current timestamp: ${timestamp}` : `Random seed: ${Math.random().toString(36).substring(7)}`;
  systemPrompt = systemPrompt.replace('{randomness}', randomStr);

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', `Generate exactly {count} unique taboo cards.`],
  ]);

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

// Main function to generate and append cards
async function generateAndAppend(targetCount, outputPath, llm) {
  // Load existing cards
  let existingCards = [];
  try {
    if (fs.existsSync(outputPath)) {
      const data = fs.readFileSync(outputPath, 'utf8');
      existingCards = JSON.parse(data);
      if (!Array.isArray(existingCards)) existingCards = [];
    }
  } catch (e) {
    console.warn(`Could not load existing cards: ${e.message}`);
  }

  // Initialize file if it doesn't exist
  if (existingCards.length === 0 && !fs.existsSync(outputPath)) {
    fs.writeFileSync(outputPath, '[\n');
  }

  let newCards = [];
  let attempt = 1;
  const maxAttempts = 10;

  console.log(`\n=== Taboo Card Generator ===`);
  console.log(`Target: ${targetCount} new cards`);
  console.log(`Found ${existingCards.length} existing cards\n`);

  while (newCards.length < targetCount && attempt <= maxAttempts) {
    const remaining = targetCount - newCards.length;
    const timestamp = new Date().toISOString();

    console.log(`--- Attempt ${attempt} ---`);
    console.log(`Generating ${remaining} cards`);

    const batch = await generateCards(llm, remaining + 5, timestamp);
    console.log(`  Raw output: ${batch.length} cards`);

    // Deduplicate within this batch
    const seenTargets = new Set(newCards.map(c => c.target));
    const validCards = [];

    for (const card of batch) {
      if (!seenTargets.has(card.target)) {
        validCards.push(card);
        seenTargets.add(card.target);
      } else {
        console.log(`  [SKIP] Duplicate: "${card.target}"`);
      }
    }

    console.log(`  Valid: ${validCards.length} unique cards`);

    // Append to file immediately
    for (const card of validCards) {
      if (newCards.length < targetCount) {
        newCards.push(card);
        const isSecondOrLater = newCards.length > 1;
        const comma = isSecondOrLater ? ',' : '';
        fs.appendFileSync(outputPath, `${comma}\n${JSON.stringify(card, null, 2)}`);
        console.log(`  [APPENDED] "${card.target}"`);
      }
    }

    console.log(`  Total new: ${newCards.length}/${targetCount}\n`);
    attempt++;
  }

  // Close the JSON array
  fs.appendFileSync(outputPath, '\n]');

  console.log(`=== Complete ===`);
  console.log(`Total cards: ${existingCards.length + newCards.length}`);
  console.log(`New in this run: ${newCards.length}`);
  console.log(`Saved to: ${outputPath}`);

  return [...existingCards, ...newCards];
}

async function main() {
  const outputPath = '/home/kyriazis/work/tick_tack_boom/src/data/taboo-generated.json';

  const args = process.argv.slice(2);
  const targetCount = parseInt(args[0], 10) || 10;

  const llm = new ChatOllama({
    model: 'qwen3-coder-256k',
    baseUrl: 'http://139.91.185.101:11434',
    temperature: 0.7,
  });

  console.log(`\nGenerating ${targetCount} taboo cards...`);
  console.log(`Model: ${llm.model}\n`);

  const cards = await generateAndAppend(targetCount, outputPath, llm);

  if (cards.length > 0) {
    console.log('\nLast card:');
    console.log(JSON.stringify(cards[cards.length - 1], null, 2));
  }
}

main().catch(console.error);

export { generateCards, generateAndAppend };
