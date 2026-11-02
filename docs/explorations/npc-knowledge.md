---
type: exploration
date: 2026-11-02
title: "NPC knowledge: what each NPC knows, as of when"
description: "What an NPC knows in strata's second block: authored baseline plus what it experiences, all true, each fact as of the tick that taught it, and how the block is played on the bench."
purpose: "The record of the knowledge block's scope and settled shape, read by its shape and by the gossip, memory and mind blocks that build on it."
producer: skill
---

# NPC knowledge: what each NPC knows, as of when

## Problem

The founding exploration ([strata-layered-world-engine](strata-layered-world-engine.md):168) deferred knowledge as "the next thread after the first block": NPCs know the world beyond their room (places, people, facts, each with a source and certainty). Later blocks depend on it. Daily plans may name only places and people an NPC knows (line 116), and trade waits on knowing what someone has (line 172).

The first block already records what each person experienced. Every event is copied to each witness, redacted per field (`src/engine/engine.ts:164`, `src/engine/events.ts:126`). Nothing turns those copies into standing knowledge, and nothing says what an NPC knows at boot.

Reverie showed the failure to avoid. Its gig engine kept NPC knowledge as a third source of truth beside game state and dialogue, reconciled by hand in each command handler. The three drifted apart, and NPCs invented world state (reverie `docs/explorations/autonomous-npc-world-loop.md:16`).

## Journey

1. **Where knowledge comes from.** Three sources were named: what an NPC witnesses, what is authored for it, and what it is told. Reverie's desync narrowed this at once. Knowledge is never a hand-kept record. It is derived from events, with authored facts allowed only as boot state, which the founding decisions already require of every part (line 99).
2. **Experienced, not witnessed.** rudy corrected the word. An NPC experiences the world: it both sees and does. Received copies already include the NPC's own acts, since its copy names it as actor, so "experienced" is already in the data.
3. **Two more kinds were named: told and inferred.** Being told carries a claim, not a fact, so it can be wrong or a lie. Pursuing it would turn knowledge into belief: source, certainty, rumor. rudy asked whether the founding exploration went there. It did not: it mentions "source and certainty" once and lists gossip as a separate later block (line 176). Taking belief on here was the scope spiral the founding journey warns about (item 3). Chosen: baseline plus experienced, all true. Told, belief, rumor and lies wait for the gossip block.
4. **True is not current (rudy).** Every fact carries the tick it was learned. Mux seeing Rogue in the bar at tick 3 stays true as of tick 3 after she leaves at tick 5. It is stale, not false, and needs no belief machinery.
5. **Where the facts an event teaches are declared.** Per event kind, in the registry, derived from each person's own redacted copy. This is the same one-place pattern as visibility and pending states. Redaction already limits what a witness learns: a bystander to a whisper learns that a whisper happened, not its words. A person's own acts teach it too.
6. **Many facts about one subject (relayed from the reverie session, at rudy's direction).** Each fact is kept as its own as-of row rather than overwritten, and a reader asks for the latest per subject. Rows are written when the event lands, in the same transaction as the copy, so knowledge is a projection kept current as events land, never re-derived by replay (founding journey item 5). A subject is a fact kind plus a thing, such as Rogue's location or the shard's holder.
7. **Baseline contents (rudy).** The founding decisions settle the form: typed definitions, live state starting as a copy and changing only through events, no prose character state (lines 69, 95–99). They leave open what goes in. rudy's rule is that knowledge never restates a fact another part already owns:
   - Ties count as knowing a person; an authored "knows Glitch" fact would say the same thing twice and drift.
   - Places are a short authored list per NPC.
   - What a person holds, and where it is, are read from the inventory and location parts.
8. **How the block is played (rudy).**
   - A Knowledge panel per NPC.
   - A god's-eye stale marker.
   - Knowledge goals the Jev player drives and scores.

   One detail was pinned down: a "learn where Rogue is" goal holds only when the NPC's latest fact matches the current world. Any fact would let a stale one pass, the same free-pass hole as an already-held end state (#4).

## Decisions

**Scope**
- The knowledge block is baseline (authored) plus experienced knowledge, all true.
- Being told, belief, rumor and lies wait for the gossip block.

**Facts**
- Every fact carries the tick that taught it: the teaching event's tick, or boot for authored facts. An NPC knows things as of a time. A fact can be stale, never false.
- Facts are append-only as-of rows, written in the same transaction as the person's received copy. A reader asks for the latest per subject, a subject being a fact kind plus a thing. The history of what someone knew stays derivable from events, and nothing is a second hand-kept record.
- The facts an event teaches are declared per event kind in the registry, and derived from each person's own redacted copy.

**Contents**
- Known people derive from ties plus anyone the NPC has experienced.
- Known places are a short authored list per NPC in its definition, as of boot.
- An NPC's own location and holdings are read from the location and inventory parts.
- Knowledge stores only experienced facts about other things. Nothing in knowledge restates a fact another part owns.

**Bench and player**
- A Knowledge panel per NPC lists each fact with the tick it was learned and its source: the teaching event, or "authored".
- A stale marker shows wherever an NPC's latest fact about something no longer matches the world's current state. It is the operator's view; NPCs never see it.
- Knowledge goals can be driven and scored by the Jev player by end state. "Mux knows where Rogue is" holds only when Mux's latest fact on Rogue's location matches where she is now.
- The harness reads knowledge over a bench route, never the engine.
- Every control and fact line carries a clear label for the player.

## Candidate features

- **NPCs have no standing knowledge.** An NPC's experience exists only as received event copies, and nothing it knows at boot beyond its ties is defined. Nobody can see or test what an NPC knows, or when it learned it. So no later block (plans that name only known places and people, trade, memory, minds) has a record of what an NPC knows. The operator cannot watch the fog between what an NPC knows and the world as it is, and the Jev player cannot drive or score a goal about what someone learns.

## Deferred

- **Being told, belief, rumor, lies and certainty**: the gossip block.
- **Inferred knowledge** (Rogue left east, so she is probably in the back room): a reasoning question, for the mind block.
- **Forgetting**: the memory block.
- **How knowledge feeds what an NPC decides** (its share of the snapshot, what a plan may name): the mind and plan blocks.
- **Shared canon** (reverie's "world everyone can know", `reverie_data/game/canon.toml:7`) and per-NPC expertise: they wait until the world is bigger than two rooms.
