---
type: exploration
date: 2026-10-30
title: "Driving and testing the bench automatically"
description: "Whether and how the bench is driven without a hand on the form: a model-free fuzzer whose oracle is replay-equals-state plus the world invariants, a Jev player choosing from the verb list by nouls combined in code, and Jev as a page checker."
purpose: "The record of what was weighed before building the bench driver, the oracles and the Jev player, and why the page checker waits."
producer: skill
---

# Driving and testing the bench automatically

## Problem

The first block, world-bench, is a world driven from a web page by hand: the operator picks an actor
and a verb, fills the fields, steps the clock and reads the panel. Every criterion is proven by a
test whose sequence someone wrote, and the post-merge walk was a person at the routes. Two things
are missing. Nothing exercises the engine beyond the sequences people thought of, so a part that
drifts from its events on an unplanned sequence goes unseen until a later block reads the wrong
state. And nothing produces histories at volume: the mind blocks to come (relationships,
perception, minds) need labelled moments, and reverie's Jev evidence shows those are made by
labelling what happened to a character, which needs many coherent histories to label.

The question: how is the bench driven and checked without a hand on the form, and what does each
driver prove?

## Journey

1. **The invariants named first were already structural.** The side-quest named four invariants
   for a fuzzer to check after each step: an item held in one place, a person in one room or in
   transit, a whisper's words never in a non-participant's copy, the log holding only validated
   events. Read against the code, each is held by construction: an item's holder is one scalar
   (`src/engine/things.ts` holderPart), a person's location is one part that is a room or a
   transit (locationPart), `Engine.record` parses every payload against its subkind's schema
   before appending, and redaction is code (`redact` in `src/engine/engine.ts`). A fuzzer
   asserting those re-proves the types.
2. **The oracle nothing holds: replay equals state.** Live state is a projection kept current by
   reducers as events land (the founding exploration's bank-balance answer). No test checks that
   replaying the log from the booted definitions lands exactly on the state rows. That is the
   invariant a part drifting from its events would break, it needs no model, and it stays true for
   every later block's parts. The fuzzer's job became: random legal and illegal actions, then
   replay-equals-state plus the world invariants (as a second, cheaper check of the same rows)
   after every action and step.
3. **Jev as player: one choice question is suggestible.** The actions carry free text (the words
   of a say or whisper), and a player reads those words in the snapshot and in its received
   copies. Reverie measured the failure in its npc-mind-frame rounds: a choice question flipped
   when text named its own option key. A player picking the next verb by one choice question is
   steered by whatever was last said. The shape that held there was narrow noul questions combined
   in code: on a blind set of 32 moments the pre-registered rule (touches ≥ 0.80 and change ≥ 0.55)
   held on 30, three reps each, rerun spread at most 0.04, median 235 ms
   (`reverie/docs/work/npc-mind-frame/evidence/jev_round5_results.json`, recomputed here). So the
   player asks one noul per candidate action and combines them in code, with thresholds from
   labels written blind by someone else and the rule pre-registered before it is tested.
4. **Why a player now.** Random legality plus the replay oracle already test the engine; the
   player adds plausibility, which the world engine does not need. Its reason is the corpus: the
   histories a plausible player produces are what the mind blocks label. The operator confirmed
   both, together, with the player's histories as the labelled corpus.
5. **Jev as page checker.** Jev takes text, not pixels, and the page's text is exactly what the
   server test already reads deterministically through its DOM mount. Whether the panel shows a
   thing is structure, which code decides; the only question Jev could add is a holistic "does
   this screen read as a sane world", and the published browser-driving numbers are self-reported
   (readout G28, claim 39). Left until there are labelled screens to measure it on.
6. **Known Jev limits carried into the design.** Counting, negation, multi-hop reasoning and padded
   state are weak; answers are not deterministic by design; there is no defence against steering
   text. So the state a question sees is rendered small and typed by code, counts are computed in
   code, and nothing hostile reaches a question in this block (the operator is the only author).

## Decisions

- The fuzzer's oracle is replay-equals-state: after every action and step, the log replayed from
  the booted definitions must equal the state rows; the world invariants are checked on the same
  rows as a second, cheaper oracle, and a refused action must leave both unchanged.
- The fuzzer fires random legal and illegal actions from the verb list the engine serves, with no
  model anywhere in it.
- The Jev player asks one noul per candidate action and combines the answers in code; it never
  asks one choice question over the verbs. Thresholds come from labels written blind by someone
  other than the author, and the rule is pre-registered before the blind set is run.
- The player's histories are the labelled corpus for the mind blocks; the engine's log and
  received copies are the record they are labelled from.
- Both are built now, together.
- The player drives the bench through a real browser (Playwright, TypeScript), not only the API,
  because strata is web-based and the operator wants to learn the mechanics. The harness owns every
  step: load the page, read it as text (each control's label, value and enabled state), ask Jev one
  noul per candidate control plus whether the goal is reached, perform the winner, loop. A language
  model only turns an instruction into a target and writes free-text words; Jev never writes text.
  An instruction with no matching action ends in no-such-action, never an invented one. Every
  strata control carries a clear label from now on. Built inside strata; it moves into its own tool
  only when a second project needs it. Every loop's request and answer are shown.
- A thing's own acts are never new to it (recorded in the founding exploration, Events).

## Candidate features

- **Bench driver with a model-free oracle.** Nothing exercises the engine beyond the sequences
  people wrote, so a part that drifts from its events on an unplanned sequence goes unseen until a
  later block reads wrong state. A driver that fires random legal and illegal actions through the
  engine and checks, after each one, that the log replayed from boot equals the live state and
  that the world invariants hold, would catch that drift with no model.
- **A Jev player whose histories are the labelled corpus.** The mind blocks need labelled moments
  made from coherent histories, and no history exists beyond what a person types into the form. A
  player that works the bench page in a real browser toward an instruction, choosing each step by
  narrow noul questions combined in code, with thresholds set from a goal set written by someone
  else, and records the histories it produces, would supply that corpus and show, measured by the
  goals it reaches, how well it drives the page.

## Deferred

- Jev as a page checker: a yes/no over the rendered page's text in place of hand-written
  selectors. Waits until labelled bench screens exist to measure it on; the DOM-mount test holds
  the structural checks meanwhile.
- A browser-driven walk: no browser automation was available in the session that walked C10.
