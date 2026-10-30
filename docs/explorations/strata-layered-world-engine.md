---
type: exploration
date: 2026-10-30
title: "Strata: a layered, event-driven world engine for living NPCs"
description: "Why reverie's NPC behaviour cascaded on every change, and the event-backbone, part-per-thing architecture a new repo (strata) builds bottom-up, each block playable in a UI bench."
purpose: "The founding record of strata: what was learned from reverie, what is settled, what is open, and the first block's scope."
producer: skill
---

# Strata: a layered, event-driven world engine for living NPCs

## Problem

Reverie set out to make NPCs that remember players and whose attitude evolves. By October 2026
every change to its NPC behaviour cascaded. One prompt refactor (the npc-mind-frame work order)
exposed that NPC autonomy had only been held off by a biased prompt. A Jev gate built to replace
it produced an endless NPC-to-NPC whisper loop. The loop traced to a missing idea of a
conversation, which traced to the constitution keying all NPC state per NPC-player pair.

A dependency map of reverie's code (game.py, npc_service.py, storage and every model call's
inputs, read 2026-10-28) explained the cascade:

- There are no layers. Seventeen verb handlers in `game.py` (1383 lines) each hand-wire their
  own slice of hearing, memory writes and model calls through `npc_service.py` (1560 lines).
- "What happened" is written into eight separate records, each by its own code path:
  the room trail, the whisper inbox, `_last_answerer`, `conv_turns`, working memory, overheard
  memories, episodes and relationship affect. A give writes a fake empty transcript line; an
  overheard interjection or a give reaction writes nothing at all.
- Who heard something is decided four different ways (hearing roll, bystander pass, no pass for
  whispers, no pass for gives).
- The NPC's mind is assembled per path. Its own turn gets a freshly seeded relationship, no
  transcript and no grounding facts, so it invents things.
- NPC-to-NPC exists only in deals and pacts, while the constitution forbids it everywhere else.

The question: what architecture lets capabilities be built as small, modular, dependent layers,
each playable on its own, so that a change to one stops at its boundary.

## Journey

1. **Patching the act gate.** First proposals were a switch to turn NPC autonomy off, then
   dropping the act gate from S2. Rejected by the operator: both park the symptom, and the cause
   (no representation of a conversation) stays.
2. **Conversation as the missing piece.** A conversation exists in reverie only as per-pair
   memory, never as something happening now with participants, turns and an end. A barge-in was
   framed as a one-time bid to join, with membership earned when someone engages. Group
   conversations turned out to be forbidden by reverie's constitution (Article II).
3. **The scope spiral was named.** Each turn the assistant found a real gap one layer down and
   made it the next must-do. The operator called it; the assistant owned it as a process failure.
4. **Pivot to layers.** A first layer list (conversation, memory, deeds, room, initiative)
   only restated reverie's features and was called out. The real difference is structural: fused
   seams, no per-layer harness, a missing conversation object. The operator asked to imagine
   bigger than existing capabilities and to understand how the whole system depends before
   layering.
5. **Events as the backbone.** One record of what happened, with perception, memory,
   conversation and mind as readers of it. The operator challenged it twice:
   - Deriving an NPC's current feeling by walking an event stream is fragile. Answer: state is
     kept current as events land, like a bank balance (a projection), never re-derived by replay.
   - Things do read shared state (the world, the room). Answer: two kinds of state, public world
     state and private mind state.
6. **Things as bundles of parts.** One NPC is several state machines (location, inventory,
   conversation, combat, mind, knowledge), each listening only for the events that concern it and
   talking to the others only through events.
7. **One snapshot for decisions.** When an NPC acts, the whole state must be known. Reverie's
   weird failures came from each path building its own partial snapshot. One snapshot builder,
   with each question taking its own view of it; too much context degrades a small model and Jev.
8. **Relationships before perception.** You can only score whether someone notices something if
   you know who they are to each other, so the relational model comes before perception.
9. **A new repo.** Reverie's code and data carry baggage; everything in the new space is vetted
   first. Character state in prose files was rejected: definitions are typed.
10. **Time.** Pure event-driven decisions freeze time (moods never fade, plans never move); pure
    per-tick decisions bring back the random roll. Chosen: the world ticks as an event source and
    NPCs decide only on events that reach them.
11. **What moves the world.** NPC wants become daily plans, written by a model as typed steps
    and run by code; grounded world generators (schedules, brownouts, patrols) emit events with a
    recorded cause.
12. **The event schema.** It became the core contract, worked through kind by kind (movement,
    speech, give), which produced per-field visibility, the action-versus-event split and
    consent for gives.

## Decisions

**Repository and scope**
- Strata is a new repository. Reverie is frozen as reference: its npc-mind-frame lane stays
  halted with its worktree kept, and nothing is copied over unvetted.
- The first world is two rooms (the Chrome Cassette with Rogue and Glitch, the Back Room with
  Mux), three NPCs, and events authored by hand.
- Every block is runnable on its own and driven from a UI: one local web page that grows a panel
  per block.

**State**
- Every thing (person, room, item, conversation) is a bundle of parts, each owning one kind of
  state and listening only for the events that concern it. Parts never reach into each other;
  they communicate through events.
- Three layers of character data:
  - **Definitions:** typed, schema-checked, versioned in git, never changed at runtime.
  - **Live state:** owned by the engine and stored in its database. It starts as a copy of the
    definition and changes only through events.
  - **Prose:** for voice only, never a source of fact.
- Every part of every thing has a real working state at boot, authored, never invented history.
  Events are only what happens after the first tick.
- Live state can be changed from the UI only through authored events; definitions never change.
- World state (rooms, presence, items) is public; mind state (mood, attitudes, memory, plans) is
  private to each NPC.
- A conversation is a thing in its own right, shared by its participants, with its own states.

**Decisions and time**
- One snapshot builder: an NPC's whole current situation is read from current values, never
  replayed from events, and every decision reads its own view of the same snapshot.
- The world ticks, and the clock is an event source. NPCs decide only when an event they noticed
  or a tick that concerns them reaches them; with nothing new and nothing due, nothing runs.
- The clock keeps a schedule of future events (arrivals, plan steps due, conversation timeouts,
  world schedules).
- Code does structure (who could witness an event, what kind it is); Jev does meaning (does it
  matter to this NPC, is it a reason to act). Jev thresholds are calibrated on labelled moments.
- NPC plans are written once a game day by a model as typed steps (world verbs, time windows,
  done-when conditions), naming only places and people the NPC knows. Code runs them; Jev
  handles small deviations; big breaks trigger a re-plan.
- A step's done-when is a typed condition from a closed set (located, holds, happened, after),
  checked by code against world state and the event log, never claimed by a model. Fuzzy goals
  stay wants, not steps.
- World generators emit events from typed world rules and authored schedules, and record why
  each fired. Visibility decides whether anyone learns the cause.

**Events**
- Every event shares one envelope: id, tick, kind, subkind, actor, targets, place, visibility,
  cause, and a typed payload.
- Kind is the family (physical, speech, exchange, time, world, authored); subkind is the specific
  event (physical.give, speech.whisper, world.brownout).
- Typed fields carry the facts; prose is description only, and code never decides on prose.
- Visibility is per field: an event has a default audience and may narrow individual fields
  (a whisper's words to its target). Each witness receives a redacted copy, so secrecy is
  enforced by code, not by a prompt.
- An action is a request; the world's rules validate it into an event or refuse it to the actor
  alone. The event log records only what actually happened.
- A thing's own acts are never new to it: its received copy names it in the actor field, and no
  reader treats an event it caused as a stimulus. Reverie's whisper loop came from NPCs treating
  their own lines as new input.
- Adding an event kind never changes existing readers.
- Movement is two events, depart and arrive, linked by cause. The mover is in transit until a
  clock-scheduled arrive; each exit has a typed travel time in ticks.
- A give is consensual: an offer, then accept or refuse, pending on the clock's schedule. An
  NPC's answer is one Jev question.

**The first block's event kinds**
- Movement: depart, arrive.
- Speech: say, say-to, whisper.
- Give: offer, accept, refuse.
- Time: tick, plus what the schedule fires.
- Authored: the operator's hand-made events from the UI.

## Candidate features

- **A world that can be changed by events and watched.** There is no world in which the operator
  can boot a small authored starting state (two rooms, three NPCs, their items and relationships),
  author movement, speech and give events by hand, step the clock, and see exactly how each
  event changes the state of every thing in it. Without that backbone, every later layer
  (perception, relationships, minds, conversation, speech, memory, plans) has nothing reliable to
  stand on, and reverie showed what building without it costs.

## Deferred

- **How long a tick is in game time.** A pacing number only the operator can set; it is required
  configuration, never a silent default.
- **Prose in events:** whether an event carries one neutral description and where per-NPC
  wording lives. Events come from many sources; this waits until several real kinds exist.
- **Temperament:** carried as both numbers and prose; which engine reads which is decided once
  the mind layer is built.
- **Knowledge:** NPCs know the world beyond their room (places, people, facts, each with a source
  and certainty). Its shape is the next thread after the first block.
- **Plant (reverse pickpocket):** a rules-resolved subkind with success/failure and
  noticed/unnoticed; waits for a skills part.
- **Trade:** waits until there is a way to know what someone has to trade, which is a knowledge
  question.
- **Later blocks**, each its own exploration or shape when its turn comes: relationships,
  perception, mind state from rules, Jev judgment, conversation as a thing, the snapshot and
  speech, memory, initiative and plans, world generators, combat, gossip, factions, the dream
  cycle, NPC-to-NPC.
- **Whether a plan's daily output needs operator approval in the UI** before it runs, at least
  early on.
