---
type: reference
date: 2026-11-07
title: "Jev: how strata asks it, and where it fails"
description: "The reference for every use of Jev in strata: its three question types, the rules from TypeSafe's own docs, the shapes measured to hold, and the mistakes strata's experiments made."
purpose: "Required reading for any work order, brief or experiment that asks Jev anything, so no worker designs a Jev question from scratch."
producer: assistant
---

# Jev: how strata asks it, and where it fails

Read this before designing any Jev question. Every brief that touches Jev cites it.

Jev (`typesafe/jev-1.13`, on OpenRouter) is a **System One** model. It makes fast, calibrated judgments and returns typed answers with probabilities. It never generates text. strata calls it through `harness/src/jev.ts`.

The split strata keeps (founding exploration, line 113): **code does structure, Jev does meaning.** Jev picks; code computes.

## The three question types

| Type | Answers | Use it when |
|---|---|---|
| **Noul** | `noul`: the probability of yes, 0 to 1 | A clean yes/no where the probability is the signal. It is absolute: each noul can be low for every option. |
| **Choice** | `choice`, a probability per option, and `confidence` | One of a known, unordered set. It is relative: it settles *which* option, never *whether* any applies. |
| **Score** | `score` (a position between levels), a probability per level, and `confidence` | A position on a spectrum whose levels you can describe in words: 2 to 10 ordered levels, low to high. |

All questions in one request see the same state and are answered independently. Batch every question that uses the same state into one request; extra questions barely change the latency.

## The rules (TypeSafe's jev-1.13 docs, "jaggedness")

1. **One snap judgment per question.** Ask what a knowledgeable person would judge in a second. If the judgment depends on several factors, ask about each one separately and combine them in code. Never hide several judgments inside one question.
2. **Literal reading.** Jev answers the words you wrote, not what you meant. State the exact condition, and put boundary cases in the criteria. Where interpretation is unavoidable, split it into two literal questions and combine them in code.
3. **No indirection.** Double negatives, a property of a property, and anything needing several hops of reasoning all cost accuracy. "Does a lapsed offer show restraint?" is two hops. Ask something closer to the surface, such as "Did Rogue let the offer lapse rather than take the shard?", and let code or a further question carry the meaning.
4. **Semantic, not numeric.** Jev reads words better than numbers. Convert in code and pass a named bucket ("matters a lot", "doesn't matter"), never a 0 to 4 rating.
5. **No math, counting or date arithmetic.** Jev is not a calculator. Count in code by asking one question per item.
6. **Don't compute magnitude from a score's or choice's expectation.** Score levels are weakly calibrated numerically. Use a score's value against a threshold or a bucket only, never by interpolating between levels or taking a weighted average of choice options.
7. **Small, relevant state.** Unrelated detail is a distractor, and accuracy falls as state grows (context rot). Filter in code and send only the fields each question needs. Use a structured JSON object with named fields, and name the field in the instruction: "Does `event.text` ...".
8. **Align instructions and criteria.** Never invert a noul's yes and no. Write it so an average reader understands it at once.
9. **No structural identities.** P(noul) and 1 − P(its negation) do not sum to 1. A noul and a choice on the same question answer differently. A threshold tuned on one form never carries to another.
10. **Hostile text steers it.** State is data, but wording inside the state can move the answer.
11. **Choice option order can lean the answer.** Jev leans toward the first option. Reorder the options and check that the answer holds (model-jaggedness, "Choice option order").

## Shapes measured to hold

- **Narrow nouls, combined in code** (reverie npc-mind-frame round 5, recomputed in [bench-automation](explorations/bench-automation.md) finding 3). A `touches` noul plus a `change` noul, with a pre-registered rule (touches ≥ 0.80 and change ≥ 0.55), held 30 of 32 blind moments over 3 reps, with a rerun spread of at most 0.04. This is the closest measured precedent for judging whether an event matters to an NPC.
- **One noul per candidate, never one choice over candidates** (same source). Reverie's choice question flipped when text in the state named its own option key. strata's player asks a noul per control for this reason.
- **Composite scoring** (TypeSafe pattern). Break a complex judgment into independent dimensions, score each separately, and combine them with weights held in code.
- **Gate first.** A noul that asks whether a thing applies at all, before the questions about how, keeps neutral cases at zero. A choice alone always picks something.
- **Chaining.** Answers are typed values. When one judgment depends on another, run a first request, then put its answer into the state of a follow-up request. Multi-step is normal.

## Mistakes strata already made

The value-weighting experiments (2026-11-07, `corpus/experiments/value-weighting*/`) broke these rules, so their verdicts don't stand:
- They passed importance as ten bare numbers (rule 4).
- They asked one five-way choice and computed magnitude from its expectation (rules 6 and 9; the choice-flip finding).
- They asked Jev to interpret events that need two hops (rule 3).
- They sent identity, history and values in one large state to every question (rule 7).
- The briefs carried none of this document.

## Building state

State is the content Jev judges. Questions are the judgments about it (concepts/state, "Separate content from questions"). Rule 7 says to keep state small and relevant. This section says how, from every concept, primitive, pattern, demo and cookbook page in TypeSafe's docs (read 2026-11-12, `docs.typesafe.ai/llms.txt`). Page names below are paths under `docs.typesafe.ai/`.

### What goes in

- **The content, plus the records and policy the judgment is made against.** For a refund: "the customer's message, the relevant transactions, and the refund policy" (concepts/system-one). "Put your proprietary content, records, and reference material in the `state` field" (models). Rules and boundary cases go in the questions' `instructions` and `criteria`, not in state (models, "Customizing Jev").
- **Context that changes the answer goes in every request.** "Whether a message is a spoiler or backseat advice ... depends on which game is being played, so the stream title and game go into every request" (cookbooks/twitch_chat_filter).
- **Jev sees only what you send.** "Each Jev request sees only the state you send it" (cookbooks/basic_memory). "Do not rely on knowledge stored in model weights when current information can come from your own knowledge base" (concepts/how-to-build-with-system-one, step 2). A question can't judge what the state doesn't hold. The spoiler check "cannot tell whether this viewer or the streamer already knows them" without the streamer's progress in state (twitch_chat_filter).
- **Put related parts together when the judgment compares them.** A support thread, its order and the refund policy are one state "when the decision requires comparing those parts" (concepts/state). The query and the passage go in together "so every question is about the pair" (cookbooks/classifying_rag_passages). The same holds for both entities of a pair (cookbooks/entity_alignment).

### What stays out

- **Anything unrelated to the questions.** "Include only the context relevant to the current questions. This helps the model avoid distractions and context rot" (concepts/how-to-build-with-system-one, step 2). "Give each question only the context it needs" (same page). "Accuracy falls as the state grows with content unrelated to the decision" (model-jaggedness, "Large state full of irrelevant detail").
- **What code can compute.** "Keep deterministic work in code" (how-to-build, step 1). Code computes `days_overdue` and never asks. Dates become a computed phrase, `given_before_departure: "about 5 years"`, never two raw dates (cookbooks/reading_scanned_documents).
- **Labels, scores and the answer being checked against.**
  - The verifier "never sees a correct answer" (cookbooks/sde_cascade).
  - `known_same_as` stays out (entity_alignment).
  - The retrieval `similarity` score is computed but not sent (classifying_rag_passages).
  - SIC codes and ids stay out of the filing state (cookbooks/classification_using_confidence).
- **The part of a document the judgment isn't about.**
  - A filing is trimmed to Item 1, "the only part an industry code is about" (classification_using_confidence).
  - A citation check sends only the section that holds the quote, not the 58,365-character RFC (cookbooks/citation_check).
  - A dose check leaves out the scan: "so the answer is only about the dose" (reading_scanned_documents).

### Structure and naming

- **Use an object with named parts.** "Use an object for most requests so each part of the state has a descriptive name and its relationships remain clear. A string is suitable when the use case is simple" (concepts/state). "Use nested JSON for the `state`" (how-to-build, step 3).
- **Nest by entity, and type what is typed.** The docs' examples nest by thing: `ticket`, `order`, `customer`, `policy`.
  - Records carry typed fields: `{"amount_usd": 49, "status": "captured"}`.
  - A policy is a prose string, and a conversation is `messages: [{from, text}]` (concepts/state, primitives).
  - The claim states mix typed values with prose. Money is a float, coverage is a boolean, dates are ISO strings, and `police_report_required_over: 2000.00` puts its unit in the key. Only `description` and the adjuster notes are prose (cookbooks/consistency_noul_cookbook).
  - "When a value comes from a database, put it in its own field instead of splicing it into a string template" (how-to-build, step 5).
- **Name keys the way the questions say them.** The message goes under `message` "because the questions refer to it as 'the message'" (cookbooks/autoresearch_feature_discovery). The model reads key names along with values, so use "short names that label what follows" (primitives/choice, on structured criteria).
- **Lists of like items: give each an id, keep source order.**
  - Lines carry `L014| ` ids that questions and answers use (cookbooks/semantic_find, cookbooks/autoformat).
  - Entries are `row-1`… in page order (reading_scanned_documents).
  - Frames are "oldest first" with `seconds_ago` (images).
- **Don't nest old state inside new.** The memory's `request` key "holds the state from before memories were added, so old memories never end up nested inside new ones" (basic_memory).

### Pointing questions at fields

- **Name the field in the instruction, with a backticked dot-and-index path.** "Point questions at specific values when that removes ambiguity, and include the backtick characters around each path" (how-to-build, step 3).
  - The example: "Does `ticket.messages[0].text` request a refund?" (primitives, "Reference specific fields").
  - Indirection: "When possible, identify the relevant parts of state by name" (model-jaggedness).
- **Structured instructions can list paths.** The triage example puts `inspect: "ticket.message"` and `compare: ["ticket.sender.display_name", "ticket.sender.email"]` beside the `question` (how-to-build; primitives/advanced).
- **Pointing can also exclude.** "`jev_answered` shows how the ticket was routed ...: do not count anything it says or implies" (basic_memory). Without that rule, an earlier answer outweighed a real fact.
- **Quote the exact item when an id alone is a search.** The stitch question "quotes both lines, so the model judges the exact text in question rather than finding it by id among 28 lines" (autoformat).

### Shared state or one per question

- **One state, many questions, one request, is the default.** "Send every question that uses the same state in one request" (primitives).
  - Each question is evaluated independently, so "adding more questions does not create context-rot" (introduction).
  - Measured: 13 questions batched against 13 single calls gave the same answers within 0.004, 12.2 times cheaper (cookbooks/parallel_questions).
- **A different state earns a separate request only when the judgment needs different content.**
  - A separate request is worth it for "a bigger state", a slower model or a person (patterns/noul-screen).
  - A second request is real only when code "needs the answer to fetch more data for the state, to decide what the state is made of, or to pick the next question's options" (primitives, "When one question depends on another").
  - "Two requests are the exception, not the rule" (same page).
  - Note what this does *not* say: no page puts unrelated content in one state to save a request. Batching is for questions that use the same state.
- **Per-item data can ride in the question instead.**
  - The record to compare goes in each Noul's `instructions.potential_duplicate`, and state stays `{"resume"}` (primitives/noul).
  - Plots go in each film's Noul, and state is the request alone (cookbooks/infinite_cardinality_choice).
  - Shared material goes in state once. Material only one question uses goes in that question (images, "Instructions").

### Filtering and gating

- **Filter in code first.** "Retrieve and filter in code first, and send only the fields the question needs" (model-jaggedness).
  - Code drops delivered orders before building state (how-to-build).
  - Embeddings keep 12 of 81 passages (classifying_rag_passages).
  - BM25 keeps 30 of 3,565 (cookbooks/rerank_typesafe).
- **Where code can't filter, a Noul can.** "When it's not possible to filter in state, you can use a Noul to filter for relevance" (model-jaggedness).
  - The worked example asks `is_relevant` per passage, one request each, and code drops those under 0.45 (classifying_rag_passages).
  - basic_memory names the same fix for a growing memory list: "A relevance question can select a smaller set once the list gets long."
- **Screen on a small state, then build the bigger one only for what passes.** "Ask one Noul question first, with a small state such as the input on its own" (patterns/noul-screen). The customer record is fetched only for the triage that needs it.
- **Shortlist, then read the survivors with fuller context.**
  - Films are read short, then long for the top 80 (infinite_cardinality_choice).
  - Listings are read at 300 characters, then 1,500 for the top 50 (demos/airbnb-listing-search).
  - Skills are read by their 60-character descriptions, then the full text of the top 3 (cookbooks/skill_suggestion).

### Chaining

- **An answer can be put into the state of a follow-up request** (primitives, "What comes back"). Most cookbooks chain into the next *questions* instead: a shortlist, a tree level, or found items removed from the options. The state stays unchanged (hierarchical_classification, cart_from_primitives, feeder_watch, intelliprompter, skill_suggestion).
- **When chaining into state, send the readings as typed values, without the source.** reading_scanned_documents reads each dose from the image, then checks it in a text-only request: `{"context": ..., "entries": [{id, vaccine, year_given, given_before_departure}]}`. It leaves out rows whose year was unreadable. autoformat merges lines from pass 1, then re-tags them as blocks for pass 2's state.
- **A chained wrong answer carries forward.** "A saved ticket keeps its answer ... so a wrong inference can carry forward" (basic_memory).

### Measured effects of what is in state

The docs have few measured comparisons of state, and none of shape or size alone. These are all of them:

- **Missing context.** Routing went from 3 of 6 to 6 of 6 with the customer's earlier tickets added to state. Answers that were already right rose from 0.53 to 0.68 to between 0.98 and 1.00 (basic_memory). Each saved memory moved only the answers it was relevant to.
- **The fact must be in state.** `repeat_contact` read 0.99 with previous contacts in the record and 0.05 without (patterns/noul-screen).
- **The same check on two states.** An in-date check on the raw scan passed an unreadable date and an expired dose. On a text state of chained readings it scored the expired dose 0.38, against 0.50 on the image (reading_scanned_documents, appendix).
- **Longer text for the shortlist.** Re-reading the top 20 films with a 600-word plot instead of a 100-word one lifted right-first from 73% to 78%, and top-20 recall from 82 to 88 of 100. That text sat in the questions (infinite_cardinality_choice).
- **No numbers anywhere** for context rot itself (state padded with irrelevant material), prose against typed values, or field references against none. The jaggedness page states the rot effect without a figure. The research readout found no outside measurement either: its claims rest on TypeSafe's page alone (claims.md, claim on failure modes, "convergence 1").

### From the operator's research

The Jev research readout (`jev-decision-model-yhaa/`) holds no measured state finding of its own. It records three rules other projects adopted:
- ember's conditions for a Jev step include **S2, "one filtered item"**, and **S5, "truth is in the state"** (project-map.md, ember section).
- bench's 2026-09-23 eval of 157 decisions failed on "does task T deliver criterion C", "because the answer depended on an allocation no text carried" (pass1-readout.md, bench daemon). That is the same failure as a fact missing from state.
- prismis scores summaries, not full bodies, to stay under the limit and avoid context rot (pass1-readout.md).

### What this means for strata

Every relationship experiment since v3 sent one state, `{you, who_you_are, earlier, now, your_part}`, whole, to all 41 questions (`corpus/experiments/gate-direction/arms/a.ts` `stateOf`). Against the guidance above:
- **Prose where the engine has typed data.** The engine copy has a subkind, actor, targets, place, item and words. strata renders it to a sentence (`value-weighting-2/render.ts`) and sends the sentence. Identity is a paragraph, not facts.
- **Unfiltered.** A deed question about what the other did gets the holder's whole biography and every earlier line. A stake question about one value gets the facts for all ten.
- **Field references are generic.** The preamble names all five fields for every question. No question points at the fact it turns on.
- **The holder's known facts are never sent.** The engine's knowledge rows (who holds what, who is where, who it knows) and its encounters are not in state.

Build a Jev state for strata this way:
- Send the event as typed fields from the engine copy, and keep the words as text where speech carries them.
- Send identity as typed facts where the facts can be typed.
- Give each question, or group of questions, the fields its judgment turns on.
- Name those fields in the instruction.

`corpus/experiments/jev-state/` tests whether this moves design B's per-value reading.

## Thresholds

Every threshold on a Jev answer comes from labels written blind, by someone who saw neither the questions nor the code, under a rule pre-registered before the run. It is measured on a held-out split. An experiment models the final system's real inputs (engine-produced copies of the real world), with each arm at its best.

## Sources

- TypeSafe docs: `docs.typesafe.ai`. The pages are model-jaggedness (model-jaggedness/jev-1.13 now redirects there), primitives, primitives/{noul,choice,score}, concepts/state, concepts/system-one and patterns/composite-scoring. "Building state" read, on 2026-11-12, every page `llms.txt` lists outside the SDK, API and legal references: concepts, primitives (including advanced and box), images, confidence, models, all patterns, all 27 cookbooks and all demos. Several pattern and primitive examples are Playground widgets whose state is not in the page text.
- The Jev research readout, kept in the operator's knowledge store (`~/.local/state/bench/knowledge/research/jev-decision-model-yhaa/`): claims on question types, deciding outright, and division of labour. For state, it has `readout.md`, `claims.md`, `pass1-readout.md`, `project-map.md` and `typesafe-primary-docs.md`.
- [docs/explorations/bench-automation.md](explorations/bench-automation.md), findings 3 and 6.
