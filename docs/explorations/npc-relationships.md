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

## Decisions

**Settled**
- A relationship is two independent directed edges. Each NPC knows only its own edge. Authored and generated edges share one shape.
- An encounter, such as a purchase, is not a relationship. It leaves memory, not an edge.
- History is derived from the log. Memory is its own block.
- The smallest isolated slice is built first.
- Build order: encounters (role and kind), then motivations, then the Jev measurement of encounters against motivations, then standing.
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
- The standing calculation.
- Fading over time.
- Asymmetry: whether one betrayal outweighs many favors.
- Personality as a lens on the weighting.
- How the kind of relationship (friend, rival, client) emerges.
- Whether a conversation is one encounter or many.
- When the summary is generated.

Proposed smallest first slice: encounters only, recorded and visible on the bench, with nothing rolled up yet.
