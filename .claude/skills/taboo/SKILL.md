---
name: taboo
description: Generate Greek taboo cards for the party game
---

# /taboo - Generate Taboo Cards

Generate Greek taboo cards and append them to the game's data file.

**CRITICAL: This skill must APPEND to the file, not replace it.**

## Usage

```
/taboo <count> [category/theme]
```

Where:
- `<count>` is the number of cards to generate (e.g., `/taboo 10`)
- `[category/theme]` is an optional influencing factor to guide generation (e.g., `/taboo 10 φαγητό`, `/taboo 5 παιχνίδια`, `/taboo 8 οικογένεια`)

## Card Structure

Each card has:
- **target**: A concrete Greek word (2-4 syllables, noun/verb/adjective)
- **forbidden**: 4-5 Greek words that would make describing the target TOO EASY
- **category**: Greek category (e.g., "φαγητό", "οικογένεια", "αθλητισμός")
- **analysis**: First-person narrative of the thought process

## The Player's Journey (How Forbidden Words Are Determined)

**READ THIS FIRST** - The game is about catching yourself in the act of almost saying the forbidden word.

When a player draws a card, their mind does this:
1. They see the TARGET word at the top
2. Their brain immediately starts forming sentences to describe it
3. The FIRST words that pop into their head are the FORBIDDEN words
4. These are words they would BLURT OUT before remembering NOT to say them

### Chain-of-Thought for Each Card

1. Imagine you are the player seeing this word for the first time
2. What are the FIRST 4-5 words that come to mind?
3. These are the words you would say BEFORE catching yourself
4. These become the forbidden words

### What Makes a Good Forbidden Word

- **The WORD ITSELF gives away the answer** (not just context)
- **It's the first word your brain says before your mouth catches up**

**Examples that work:**
| Target | Forbidden | Why |
|--------|-----------|-----|
| Marco | Polo | Immediately follows "Marco" in the mind |
| Coffee | drink | First category that comes to mind |
| Run | fast/move | First verbs that come to mind |

**Examples that DON'T work:**
| Target | Bad Forbidden | Why |
|--------|---------------|-----|
| Coffee | bean | Not the first thing people think |
| Coffee | espresso | Too specific, not the first thing |
| Coffee | morning | Context, not the word itself |

### Rules for Good Taboo Cards

1. **TARGET WORD:**
   - Must be a concrete, commonly used Greek word (2-4 syllables)
   - Prefer nouns, verbs, or adjectives
   - Must NOT be a name or proper noun

2. **FORBIDDEN WORD TEST (ASK YOURSELF):**
   - If I say this word, would the team immediately know the target?
   - Is this the FIRST word that pops into my head when I see the target?
   - If YES to either, it belongs in forbidden

3. **WHAT TO AVOID:**
   - Words that need explanation to connect to the target
   - Words that are too obscure or unrelated
   - Words from completely different domains
   - The target word itself
   - Duplicate words in the forbidden list

4. **CARD QUALITY:**
   - 4-5 forbidden words per card (no more, no less)
   - All forbidden words should feel like natural, first-thought responses
   - Category should be meaningful, accurate, and in Greek only
   - ALL words in the forbidden list MUST be Greek (no English words)

## Influencing Generation

You can influence the generated cards by specifying a category or theme:

- **By category**: `/taboo 10 φαγητό` - generates food-related cards
- **By theme**: `/taboo 5 παιχνίδια` - generates game-related cards
- **By concept**: `/taboo 8 οικογένεια` - generates family-related cards
- **Mixed**: `/taboo 12 καιρός` - generates weather/time-related cards

If no category is specified, cards will be generated across various themes.

## Analysis Format (How to Write the Analysis)

The analysis should read like the player is narrating their own thought process:

**Start with:** "Όταν δω τη λέξη '[target]', πρώτο πράγμα που μου έρχεται στο μυαλό είναι..."

**Then list:** "Μετά μου έρχεται στο μυαλό [forbidden word]..."

Keep it fully in Greek, conversational, like you're narrating your own thought process.

## Examples (Playing the Game in My Mind)

### Example 1: "ΜΑΡΚΟ"
**Analysis:** "Όταν δω το 'Μαρκο', το πρώτο που μου έρχεται στο μυαλό είναι... Πόλο! Αυτό είναι αυτόματο. Μετά μου έρχεται στο μυαλό 'απάντηση', μετά 'συνέχεια', 'κάλεσμα', 'απάντηση' - όλα τα πράγματα που ακολουθούν το 'Μαρκο' στο μυαλό μου. Αν πω κάποια από αυτά, η ομάδα το ξέρει αμέσως."

**Forbidden:** ["Πόλο", "απάντηση", "συνέχεια", "κάλεσμα"]

### Example 2: "ΚΑΦΕΣ"
**Analysis:** "Όταν δω τον 'Καφέ', το πρώτο που μου έρχεται στο μυαλό είναι... 'ποτό' - αυτή είναι η κατηγορία. Μετά μου έρχεται στο μυαλό 'καφεΐνη' - αυτό είναι αυτό που το κάνει. Μετά 'πρωί' - αυτή την ώρα το πίνω. Μετά 'εσπρέσο' - αυτό είναι ένα είδος. Αν πω 'ποτό', το ξέρουν αμέσως."

**Forbidden:** ["ποτό", "καφεΐνη", "πρωί", "εσπρέσο"]

### Example 3: "ΤΡΕΧΩ"
**Analysis:** "Όταν δω το 'Τρέχω', το πρώτο που μου έρχεται στο μυαλό είναι... 'κίνηση' - αυτή είναι η βασική ενέργεια. Μετά μου έρχεται στο μυαλό 'γρήγορα' - αυτό είναι το τρέξιμο. Μετά 'σπριντ' - αυτό είναι τρέξιμο σκληρά. Μετά 'τρέλα' - αυτό είναι τρέξιμο αργά. Αν πω 'κίνηση', το καταλαβαίνουν."

**Forbidden:** ["κίνηση", "γρήγορα", "σπριντ", "τρέλα"]

### Example 4: "ΜΑΜΑ"
**Analysis:** "Όταν δω τη 'Μάμα', το πρώτο που μου έρχεται στο μυαλό είναι... 'μαμάκι' - αυτή είναι η λέξη. Μετά 'γονέας' - πολύ γενικό. Μετά 'οικογένεια' - είναι μέρος της οικογένειας. Μετά 'γέννα' - αυτή είναι η πρώτη της εισαγωγή. Αν πω 'μαμάκι', το ξέρουν αμέσως."

**Forbidden:** ["μαμάκι", "γονέας", "οικογένεια", "γέννα"]

## Implementation Rules (READ THIS FIRST)

**IMPORTANT: How to properly append to the file:**

1. **READ the existing file first** (`/home/kyriazis/work/tick_tack_boom/src/data/taboo-generated.json`)
2. **PARSE the JSON** to understand its structure (it's an array of card objects)
3. **APPEND your new cards** to the array (before the closing `]`)
4. **WRITE the entire updated array** back to the file

**DO NOT:**
- Use `Write` to create a new file from scratch
- Start with an empty array `[]`
- Replace the entire file content
- Forget to read the existing content first

**DO:**
- Use `Read` first to get the existing content
- Parse the JSON, add your new cards to the array
- Keep the existing cards intact
- Write the combined array back

## Validation

After writing, always validate the JSON is correct:
```
python3 -m json.tool /home/kyriazis/work/tick_tack_boom/src/data/taboo-generated.json > /dev/null 2>&1 && echo "Valid JSON" || echo "Invalid JSON"
```

Also check for duplicate targets by counting:
```
grep -c '"target":' /home/kyriazis/work/tick_tack_boom/src/data/taboo-generated.json
```
This should equal the expected count (original + new cards).

## Examples

```
/taboo 20
```
Generate 20 cards across various themes.

```
/taboo 10 φαγητό
```
Generate 10 food-related cards (category: φαγητό/food).

```
/taboo 5 παιχνίδια
```
Generate 5 game-related cards (theme: παιχνίδια/games).
