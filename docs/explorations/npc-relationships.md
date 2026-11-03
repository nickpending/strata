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

## Decisions

**rudy's model, the basis for this exploration**
- A relationship has content, strength and each side's feeling.
- Each side's feeling is that character's personality applied to the other entity, so one connection reads differently from each end.
- An encounter, such as a purchase, is not a relationship. It leaves memory, not an edge.
- An edge forms from accumulated encounters, or from one that mattered a lot.
- Whether an edge exists, its strength and its feeling are separate ("a regular, but a prick").
- Kind, count and quality are distinct measures. Quality is not good-or-bad.
- Standing is stored per edge, as raw numbers and perhaps generated prose for prompts. History is derived from the log. Memory is its own block.
- The smallest isolated slice is built first.

**Rejected as reverie baggage**
- Reverie's disposition, trust and obligation axes, and their decay table.
- The tie shape (`target`, `kind`, prose `note`) copied from reverie.
- "Trust, liking, fear, debt" as a starting set.

## Candidate features

None yet. The exploration is open.

## Deferred

Open, still being explored:
- Which entity types an edge can point at: people, organizations, the world.
- What turns encounters into an edge.
- What standing holds.
- Who generates the prose, and when.
