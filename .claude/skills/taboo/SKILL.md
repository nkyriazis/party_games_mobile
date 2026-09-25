---
name: taboo
description: Create, review, or audit Greek Taboo cards for the party game. Use when the user wants new taboo cards (e.g. "/taboo 10 φαγητό"), wants existing cards checked or fixed, or when a workflow agent is writing or critiquing a batch of cards.
---

# Greek Taboo cards

A card is one **target** word plus **exactly 5 forbidden words**. The describer must get their team to say the target without saying the target itself, any form of it, or any forbidden word.

A great card is **hard but fair**. The forbidden words take away the obvious ways to describe the target, but a clever player can still get there in about 30 seconds.

## Files and commands

| What | Where |
|---|---|
| Deck (source of truth, append-only) | `src/data/taboo-generated.json` |
| Planned targets | `src/data/taboo-plan.json` |
| Approved words missing from the wordlist | `src/data/taboo-extra-words.txt` |
| Validator | `scripts/validate-taboo.mjs` |

`src/data/taboo.json` is built from the deck by `npm run taboo:prepare`. Never edit it by hand.

```bash
node scripts/validate-taboo.mjs cards <file.json>            # check candidate cards, change nothing
node scripts/validate-taboo.mjs cards <file.json> --append   # append the error-free cards to the deck
node scripts/validate-taboo.mjs targets <file.json> [--append]  # check / add planned targets
node scripts/validate-taboo.mjs next 10                      # next 10 pending planned targets
node scripts/validate-taboo.mjs skip <target> "<reason>"     # drop a planned target
node scripts/validate-taboo.mjs status                       # counts by category / difficulty
node scripts/validate-taboo.mjs deck                         # re-check the whole deck
```

Only change the deck through `cards --append`. Never rewrite the file by hand. The validator enforces the mechanical rules: format, exactly 5 words, every word must appear in `public/greek_wordlist.txt` (or the extra-words list), no word may share a root with the target, and no duplicate targets. **Errors** block a card. **Warnings** are for you to judge. Everything below is the judgment the validator cannot do.

## Card format

```json
{ "target": "ομπρέλα", "forbidden": ["βροχή", "ήλιος", "παραλία", "ανοίγω", "αδιάβροχο"], "category": "Αντικείμενα", "difficulty": "easy" }
```

- Write every word **lowercase with accents** (`ψωμί`, not `ΨΩΜΙ`). The build uppercases targets for display.
- Use dictionary forms. Nouns: nominative singular (use the plural only when the word normally is plural, e.g. `γενέθλια`). Verbs: first person present (`τρέχω`). Adjectives: masculine singular (`κουρασμένος`).

## Choosing targets

A good target is a word **every adult Greek speaker knows and uses**. Test: would a 14-year-old and a 70-year-old at the same table both know it right away? If not, skip it.

- **Yes:** everyday objects, food, places, jobs, animals, activities, feelings, customs, well-known concepts (`ομπρέλα`, `σουβλάκι`, `λαϊκή`, `γιαγιά`, `ξενύχτι`, `ζήλια`, `κέρασμα`, `πανηγύρι`).
- **No:** proper nouns, brands, acronyms, technical or scientific terms, rare formal words (`αρτοποιΐα`), regional slang, crude or offensive words, and words so generic they can't be described (`πράγμα`, `κάνω`).
- **Aim for a mix:** about 65% concrete nouns, 20% verbs and adjectives, 15% abstract ideas and customs.
- **Greek culture is a bonus.** `τσίπουρο`, `γιορτή`, `λαϊκή`, `κουμπάρος`, `φραπές` make better cards than words that only exist because they were translated.
- **Only add a target near an existing one if it's truly a different concept.** `καφές` and `καφετέρια` can both exist. `μπάσκετ` and `μπασκέτα` cannot. When the validator warns "similar to existing target", decide which case you're in.

## Choosing the 5 forbidden words

Play the card in your head. Look at the target and note the first things you would say to describe it. Those are the forbidden words.

**The core test:** show a teammate only the 5 forbidden words and they should guess the target almost at once. If they wouldn't, at least one word is weak.

**Each word should block a different way of describing the target.** Choose from:

1. **Category / synonym:** what it *is* (`φρούτο` for πορτοκάλι, `ποτό` for τσίπουρο)
2. **Function / action:** what it *does* or what you *do* with it (`ανοίγω` for ομπρέλα, `κόβω` for μαχαίρι)
3. **Place / occasion:** where or when it happens (`παραλία`, `πρωί`, `κουζίνα`)
4. **Defining part or property:** (`κεριά` for τούρτα, `ουρά` for γάτα)
5. **Set phrase / partner word:** the word that always goes with it (`χρόνια` for γενέθλια because of *χρόνια πολλά*, `πιρούνι` for μαχαίρι)
6. **Opposite / pair:** (`κρύο` for ζέστη)

**Weak forbidden words (replace them):**
- **Loosely related:** `ρύζι` for ψωμί (a teammate wouldn't guess bread from it)
- **Random:** `καρκίνος` for μπάσκετ
- **Too specific or rare:** `εσπρέσο` for καφές is fine, but `αρτοποιΐα` for ψωμί is not something anyone says
- **Wrong:** `κίτρινο` for πορτοκάλι (the fruit is orange)
- **Redundant:** a second word covering the same route (`βροχή` + `βρέχει`), which wastes a slot
- **Same root as the target:** `ψωμάκι`, `καφεΐνη`, `πορτοκαλάδα`. These are already banned, so they waste a slot (the validator rejects them).

**Fairness check:** with all 5 words blocked, can you still describe the target in two different ways? If you can't, the card is unplayable. Swap the least essential forbidden word for a weaker one, or drop the target.

## Difficulty

Rate the card as a whole, *after* choosing the forbidden words:

- **easy:** a very common concrete word. Even with the 5 words blocked, many clear descriptions remain (`γάτα`, `γενέθλια`, `ομπρέλα`).
- **medium:** common, but the forbidden words block the natural ways to describe it, so the player needs a detour (`διακοπές`, `πορτοκάλι`, `κουμπάρος`).
- **hard:** an abstract idea, a verb or adjective, or a word with few ways left to describe it. Still known to everyone (`νοσταλγία`, `ζήλια`, `ξενύχτι`, `βαριέμαι`).

Aim for about 40% easy, 40% medium, 20% hard across the deck.

## Categories

Reuse one of these exact names. Add a new one only when none fits:

`Φαγητό & ποτό` · `Σπίτι` · `Αντικείμενα` · `Ρούχα & αξεσουάρ` · `Σώμα & υγεία` · `Ζώα` · `Φύση & καιρός` · `Μέρη & πόλη` · `Μεταφορές` · `Επαγγέλματα & άνθρωποι` · `Οικογένεια & σχέσεις` · `Σχολείο & γνώση` · `Αθλητισμός` · `Τεχνολογία` · `Διασκέδαση & τέχνες` · `Γιορτές & έθιμα` · `Συναισθήματα & ιδιότητες` · `Ενέργειες` · `Χρόνος & έννοιες`

## Examples

### Good

| Target | Forbidden | Diff. | Why it works |
|---|---|---|---|
| ομπρέλα | βροχή, ήλιος, παραλία, ανοίγω, αδιάβροχο | easy | Blocks weather, beach, action and synonym; "you carry it folded, it has a handle, you forget it on the bus" still works |
| γενέθλια | τούρτα, κεριά, δώρο, πάρτι, χρόνια | easy | `χρόνια` blocks *χρόνια πολλά*, the first thing everyone would say |
| πορτοκάλι | φρούτο, χυμός, στύβω, μανταρίνι, βιταμίνη | medium | Blocks the category, the juice route and its closest relative; the colour is still available but it's also a colour word |
| διακοπές | καλοκαίρι, θάλασσα, ξενοδοχείο, άδεια, βαλίτσα | medium | Every natural route is gone; the player has to detour ("not working, you go away…") |
| νοσταλγία | παρελθόν, αναμνήσεις, πατρίδα, μελαγχολία, ξενιτιά | hard | Abstract; `ξενιτιά` catches the very Greek association |

### Bad (from the old deck) and the fix

| Card | Problem | Fix |
|---|---|---|
| ΠΟΡΤΑ: [πόρτα] | Forbidden word is the target itself; only one word | πόρτα: κλειδί, ανοίγω, χτυπάω, είσοδος, πόμολο |
| ΨΩΜΙ: φαγητό, ρύζι, ψωμάκι, αρτοποιΐα, κρούστα | `ψωμάκι` shares the root; `ρύζι` is loosely related; `αρτοποιΐα` is rare; `φαγητό` is too broad | ψωμί: φούρνος, αλεύρι, φραντζόλα, σάντουιτς, τοστ |
| ΜΠΑΣΚΕΤΑ: καλάθι, μπάλα, αγώνας, καρκίνος, κράτα | Target isn't a word (it's `μπάσκετ`); `καρκίνος` and `κράτα` are random | μπάσκετ: καλάθι, μπάλα, ομάδα, πόντοι, ψηλός |
| ΜΠΟΥΣΤΟ, ΚΟΥΦΑΡΙΣΜΑ | Not real words | Never invent words; the wordlist check catches this |

## Writing cards (standalone `/taboo <count> [theme]`)

1. Choose targets. Run `node scripts/validate-taboo.mjs status` to see what the deck already covers. With a theme, stay inside it. Without one, pick categories that are underrepresented.
2. Write each card with the rules above. Spend real thought on each one. For every forbidden word, name which way of describing the target it blocks. If two words block the same way, replace one.
3. Review your own cards with the rubric below, as if someone else wrote them. Fix or drop weak cards. Fewer great cards beat more mediocre ones.
4. Write the cards to a scratch file and run `cards <file>`. Fix every error (for example, swap a same-root word for another clue). Resolve every warning or deliberately accept it.
5. Run `cards <file> --append`, then report what was added and anything you dropped.

Keep batches to about **10 cards**. Beyond that the forbidden lists get generic.

## Growing the deck (many cards)

For more than about 20 cards, use the saved `taboo-deck` workflow instead of writing cards inline. Planning picks unique targets first, then a writer and an independent critic handle each batch of 10:

```
Workflow taboo-deck  args: {"mode": "grow", "planTarget": 100}
```

- `planTarget` is how many new cards to add. Planning tops up `src/data/taboo-plan.json` until that many targets are pending, then generation writes them.
- Pace it at about 100 cards (10 batches, ~1M tokens, ~25 min) per run. Check `status` and sample the new cards between runs.
- If a run stops early, use `{"mode": "generate", "batches": N}` to finish the pending targets without planning more. Skipped targets are never retried.
- Afterwards, run `node scripts/validate-taboo.mjs deck` and `npm run taboo:prepare`, then commit the deck, plan and extra-words files together.

## Review rubric (for critics and audits)

Judge each card on its own. Verdicts:

- **accept:** it passes everything below.
- **revise:** the target is good but some forbidden words or the difficulty are off. Return the corrected card.
- **reject:** the target itself is bad (not a real word, not common, a proper noun, near-duplicate of an existing target, or too vague to describe).

Check, in order:

1. **Target:** a real, common word everyone knows, in dictionary form, not a proper noun, not a near-duplicate.
2. **Core test:** would a teammate who sees only the 5 forbidden words guess the target quickly?
3. **Missing obvious clue:** what is the *first* thing you'd say to describe it? If it isn't forbidden, the card is too easy. Swap it in for the weakest word.
4. **Weak words:** replace any that are loosely related, random, too specific, wrong, redundant or same-root.
5. **Fairness:** with all 5 blocked, are there still at least two ways to describe it?
6. **Difficulty and category:** correct label, and a category from the list.

Be strict. Rejecting a card costs nothing, but a bad card ruins a round.
