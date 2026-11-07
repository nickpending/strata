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

## Thresholds

Every threshold on a Jev answer comes from labels written blind, by someone who saw neither the questions nor the code, under a rule pre-registered before the run. It is measured on a held-out split. An experiment models the final system's real inputs (engine-produced copies of the real world), with each arm at its best.

## Sources

- TypeSafe docs: `docs.typesafe.ai`. The pages are model-jaggedness/jev-1.13, primitives, primitives/{noul,choice,score}, concepts/state, concepts/system-one and patterns/composite-scoring.
- The Jev research readout, kept in the operator's knowledge store: claims on question types, deciding outright, and division of labour.
- [docs/explorations/bench-automation.md](explorations/bench-automation.md), findings 3 and 6.
