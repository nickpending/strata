---
type: exploration
date: 2026-11-03
title: "NPC relationships: what connects two characters, and how each side holds it"
description: "What a relationship is in strata: content, strength and each side's feeling; when an edge forms; what standing holds; built from rudy's model, with reverie's shapes rejected as baggage."
purpose: "The open record of the relationships exploration, so its model and rejections survive until it closes and its block is shaped."
producer: skill
---

# NPC relationships: what connects two characters, and how each side holds it

## Problem

The founding exploration ([strata-layered-world-engine](strata-layered-world-engine.md)) set strata out to make NPCs whose attitude toward someone evolves (line 14). It orders relationships before perception, because whether someone notices you depends on who you are to each other (line 66). It makes attitudes private mind state (line 102). It never says what a relationship is.

Today strata has only static authored `ties` per person: `target`, a free-text `kind`, and a prose `note`. Nothing changes them. That shape was carried over from reverie without vetting.

The question: what a relationship is, how one forms, what it holds, and the smallest isolated slice to build first.

## Journey

1. **Anchor.** The founding exploration is the anchor. A relationship is a part of a person: it changes only through events, its facts are typed, prose is voice only, and an NPC's own acts are never stimuli.
2. **Which entities.** The first question was what an edge can point at: another NPC, a player character, an organization, the world. It is still open. Today a tie may name only a person.
3. **The character is not the relationship (rudy).** Every character has a base personality, a mind and life experience. That lens is separate from the relationship, and it colors how each side holds it. The relationship itself has content, strength and each side's feeling.
4. **Two views of one connection.** The existing ties already show it: Rogue → Glitch is "wary tolerance", while Glitch → Rogue is "lying low on her tolerance". Each side's feeling is that character's personality applied to the other, so one connection reads differently from each end.
5. **An encounter is not a relationship (rudy).** Buying something is an encounter. It leaves memory, not an edge. Reverie created a relationship on every contact and seeded a fresh one per code path (founding line 31), so its edges meant nothing.
6. **What forms an edge (rudy).** Kind, count and quality are distinct measures of encounters. Many low-quality encounters can add up to an edge, and so can one that mattered a lot. Quality is not good-or-bad. Whether an edge exists, its strength and its feeling are separate: "a regular, but a prick" is an established edge with a bad feeling. "A regular for parts" is an attribute of the content, and the prose is a roll-up summary.
7. **Reverie's axes were raised and rejected.** Reverie scored disposition, trust and obligation from -10 to 10, each decaying at its own half-life and moved by a fixed table of event deltas (`reverie_npc/domain/affect.py:20-28`). rudy did not take them as a basis.
8. **Stored, derived, separate.** A direction was proposed and kept, with one point corrected:
   - Standing is stored per edge, as raw numbers and perhaps generated prose for prompts. It is kept current as events land, like location, and never recomputed from the log.
   - History is derived from the log.
   - Memory is its own block.
   - The open part of the proposal is per-encounter Jev judgments (how much it mattered, better or worse) feeding standing.
9. **Smallest slice first (rudy).** Keep the relationship isolated from the rest of the engine as far as possible: relationships that exist and are visible but do not change yet, or edge formation alone. Authoring standing at boot first needs a decision on what standing holds.
10. **Reverie carry-over found (rudy).** TOML and the tie shape were chosen in the world-bench shape without a decision from rudy, and the tie shape and its three ties were re-authored from reverie (`docs/work/world-bench/design.md:22`). Ties are to be designed from a blank slate here, and the rest of strata is audited for other carry-overs. The audit came back with rudy's rulings (issue #11):
    - **Kept:** the world, the items as test content, TOML, the person file minus ties, the map, the speech kinds and consensual give.
    - **Redone:** ties, here.
    - **Light redo:** descriptions are atmosphere only and never restate a fact the typed data owns.
    - **Travel:** symmetric at 1 tick each way. The test that needed the asymmetry gets its own fixture world.
    - **Offer window:** stays at 2 ticks as a placeholder.
11. **A relationship is two directed edges (rudy).** There is no shared object that each side keeps a copy of. Mux → Glitch is Mux's edge, and Glitch → Mux is Glitch's, and either may not exist. Each NPC knows only its own edge and never how the other feels. Authored and generated edges have the same shape. Even the encounters behind an edge are one side's: only what that NPC received.
12. **"Content, strength, feeling" dropped (rudy, worked through with the reverie session).** It was a summary label, not his model, and it pulled prose back in. His working model is in Decisions below. It is exploratory, not decided.

13. **Motivations come before standing (rudy).** Measuring an encounter against each want and value needs wants and values, and strata's people have none. rudy set the order, calling it a real dependency, not scope growth: standing cannot be computed from encounters that were never measured.
    1. Encounters, with role and kind only. They need no motivations and are built now.
    2. Motivations: each NPC's typed wants and values in its definition. Each has an id that code can track and a description Jev reads for meaning. Code never decides on the description.
    3. The Jev measurement of each encounter against those motivations, how much and in which direction. Thresholds come from labelled examples written blind, under a pre-registered rule.
    4. Standing, calculated from measured encounters.

14. **Two things were mixed (rudy).** Establishment, where encounters build up until a relationship exists, is separate from standing on an established relationship, where each new encounter builds on it or detracts from it. A single minor encounter never moves standing directly.
15. **The mind is the lens, not "motivations" (rudy).** There is far more to a person than what motivates them. Whether an encounter builds or detracts is judged from that NPC's point of view, so the same event can build for one NPC and detract for another. Judging from the encounter alone would give what most people think, which is wrong. A minimal slice of the mind has to come first.
16. **Values: a fixed, comprehensive catalogue (rudy).** It is one list for the world that every NPC draws on. Values may conflict, and conflicts are to be tested both when an NPC holds conflicting values and when one event touches both. The starting point is Schwartz's theory of basic human values: ten broad values, arranged so that neighbours fit together and opposites conflict. A refined version has 19.
17. **Beliefs sit a layer below values (rudy).** "Cops are the enemy" is not a value. It is a specific stance a layer down, and rudy named that layer belief. Gossip's told-and-maybe-false content, which the knowledge exploration called belief, is renamed claim. Sources to model on: real psychology, game theory (repeated games, where trust builds or breaks over many exchanges) and tabletop RPGs (D&D's ideals, bonds and flaws; Burning Wheel's Beliefs).

18. **Who applies importance: four experiments (corpus/experiments/value-weighting*).** The first two misused Jev, which led to `docs/jev.md`. The third, run under docs/jev.md, tied on accuracy and favoured code-applied importance on robustness. The fourth tested an extra "what the act shows about the actor" question. It added nothing, because the deed questions already covered it and the earlier misses came from weighting. Design B was settled (rudy). Jev asks, per value and without seeing importances, whether the encounter helped or hurt the NPC's own stake, whether the other acted for or against the value, and whether it touched the NPC at all, with a follow-up strength score. Code weights the answers by the NPC's importance. Measured on fresh held-out cases, direction was right on 77%, and on 83% where both labellers agree; the labellers themselves agree on 86 to 93%. Most remaining misses turn on what an act exposes the NPC to (heat, debt). They need the NPC's knowledge in the judgment's state, and the world does not yet carry such facts.
19. **Values on NPCs (rudy).** Importance is 0 to 4, "for now". The values of Rogue, Glitch and Mux are drafted by the assistant as experiment-grade content.

20. **Ten experiments on the judgment (corpus/experiments: value-weighting-3 and -4, size-judgment, gate-direction, gate-first-e2e, jev-state, jev-statements, item-size).**
    - The combine is sound: true per-value answers through it reach 0.81 to 0.88.
    - The size step holds in isolation.
    - Jev's state shape is not the lever.
    - The loss is Jev's per-value gate, which fires on untouched values. B's confidence × size product acts as a soft gate on those false fires.
    - W's concrete, rewritten statements improve the gate on two fresh sets (+0.07 and +0.08), with no case-level loss.
    - Squared weighting never won a pre-registered test.
    - Every case-level comparison tied, partly because 56 to 84 scenarios leave intervals of about ±0.1.
21. **Adopted (rudy, 2026-11-13):** design B with W's statements, and linear weights. An explicit gate stage, with a threshold from blind labels and size not scaled by probability, waits for one powered run (issue #17).

22. **Standing (rudy, 2026-11-13).**
    - **What it holds:** one running tally per value, toward one other person. Weights are applied when it is read, so "a prick, but I need him" survives as two separate tallies.
    - **What moves it:** each encounter adds Jev's per-value effect, weighted by role (direct counts more than witnessed). Decisions read the numbers. Speech reads one generated summary line.
    - **Its starting value** is authored as typed per-value tallies plus a summary line for voice only. That replaces the rejected ties, and a boot relationship starts formed.
    - **No fading for now.** If standing ever fades, it fades glacially toward stranger. Memory fading belongs to the memory block.
    - **Formation is one familiarity total per pair:** every encounter adds a fixed amount plus the size of its weighted effect, good or bad, and the relationship forms when the total crosses a line. Familiarity only grows; good and bad live in the tallies. Before formation the tallies still update, but nothing that reads relationships sees the pair. The fixed amount, the line and the role weights are rudy's numbers, required with no default.

## Decisions

**Settled**
- A relationship is two independent directed edges. Each NPC knows only its own edge. Authored and generated edges share one shape.
- An encounter, such as a purchase, is not a relationship. It leaves memory, not an edge.
- History is derived from the log. Memory is its own block.
- The smallest isolated slice is built first.
- The build order through motivations is superseded by journey items 14 to 17. Relationships split into establishment and standing. The judgment is build-or-detract from the NPC's point of view, made through its mind. The mind's first layers are values, a fixed catalogue with Schwartz as the starting point, and beliefs below them. "Claim" replaces "belief" for gossip's told content.
- An encounter is formed with every other person who received the same event (rudy, 2026-11-03: any entity you experience in an event is an encounter). That covers arriving into a room with people in it, speaking to the room, and watching as a bystander, with no special cases. npc-encounters (#14) shipped a narrower rule, the event's actor and targets only, which misses the people present at an arrival and a room speech's listeners. The corrected rule is carried into the next relationships work order.

**rudy's working model (exploratory, not decided)**
- **Encounter.** One thing that happened between two people, from one side's view, derived from an event that NPC received. It carries:
  - **Role:** direct, as actor or target, or witnessed, as a bystander. It is read from the copy.
  - **Kind:** the event's existing subkind, so it is typed with no new list.
  - **What it did to each motivation:** for each of that NPC's wants and values, how much the encounter mattered and in which direction, advanced or set back. Jev judges this with narrow nouls against the NPC's motivations. "A prick, but I need him" means his help advances Mux's business while his manner sets back Mux's comfort.
- **Standing:** the rolled-up current state of one side toward the other, a calculation over that side's encounters.
- **Formed:** the point where standing crosses a threshold, so that it is a relationship rather than encounters.
- **Summary:** generated prose of standing, for voice only.

**Dropped:** "content, strength, feeling", a summary label rather than rudy's model.

**Rejected as reverie baggage**
- Reverie's disposition, trust and obligation axes, and their decay table.
- The tie shape (`target`, `kind`, prose `note`) copied from reverie.
- "Trust, liking, fear, debt" as a starting set.

## Candidate features

None yet. The exploration is open.

## Deferred

Open, still being explored:
- Which entity types an edge can point at: people, organizations, the world.
- Asymmetry: whether one betrayal outweighs many favors.
- Personality as a lens on the weighting.
- How the kind of relationship (friend, rival, client) emerges.
- Whether a conversation is one encounter or many.
- When the summary is generated.
- Whether beliefs join values in the first mind slice.

Proposed smallest first slice: encounters only, recorded and visible on the bench, with nothing rolled up yet.
