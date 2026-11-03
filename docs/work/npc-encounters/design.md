---
type: design
date: 2026-11-03
title: "Design: npc-encounters"
description: "Every person's encounters with each other person, read from its own received copies: one per other participant of each copy, with a direct or witnessed role and the event's subkind as its kind, tied to the event and tick it came from; served on a bench route and shown, per person and grouped by the other person, in a labelled Encounters section, with nothing rolled up."
purpose: "The recorded design of the npc-encounters work order, read by its plan and its builders."
producer: cli:shape
---

# Design: npc-encounters

## Purpose

Every person's encounters with each other person, read from its own received copies: one per other participant of each copy, with a direct or witnessed role and the event's subkind as its kind, tied to the event and tick it came from; served on a bench route and shown, per person and grouped by the other person, in a labelled Encounters section, with nothing rolled up.

## Form

Encounters derived on read from the witnessed copies, by one rule over the copy's envelope, served on one route and shown in one panel section.

1. The rule (`src/engine/encounters.ts`, new). `type Role = "direct" | "witnessed"`; `type Encounter = { with: string; role: Role; subkind: Subkind; tick: number; event: string }`; `type EncountersView = { person: string; name: string; encounters: Encounter[] }`. `encountersOf(copies: Copy[], holder: string, isPerson: (id: string) => boolean): Encounter[]` walks the holder's copies in the order given (event order, as store.ts:158 returns them) and, for each copy, takes its participants, the actor then the targets in envelope order (events.ts:180 reads the same pair), drops the holder and any id that is not a person, drops repeats within the copy, and yields one encounter per remaining id: `with` that id, `role` direct when the holder is the copy's actor or among its targets and witnessed otherwise, `subkind` the copy's subkind, `tick` and `event` the copy's tick and id. It reads only the envelope (actor, targets, subkind, tick, id) and never the payload, so an arrive's `present` names nobody met and a narrowed field changes nothing. It reads no registry entry: a subkind added later yields encounters from its envelope with no change here (strata-layered-world-engine.md:138). The key (event, holder, with) is unique per encounter and never changes, since copies are append-only (store.ts:21). Nothing is stored: no table, no column, no write in record().

2. Knowledge's people read from it (`src/engine/knowledge.ts`). peopleOf() (knowledge.ts:116-128) keeps each tie target first, as of tick 0 with source authored, and then, instead of walking each copy's actor and targets itself, takes `encountersOf(copies, person, (id) => Object.hasOwn(snapshot.people, id))` and adds each encounter's `with` not already known, with that encounter's tick, event as source, and subkind, so the first encounter with a person is when it was first experienced. The list it returns is the same as before for every world and log, so who a copy is with has one home, encountersOf.

3. The reader (`src/engine/engine.ts`). `Engine.encounters(person): EncountersView` throws on a non-person as knowledge() does (engine.ts:131-133) and returns `{ person, name: def.name, encounters: encountersOf(this.store.received(person), person, (id) => this.isPerson(id)) }`. Nothing in act(), step() or record() calls it.

4. The route (`src/server/routes.ts`). `EncountersBody = EncountersView`; PERSON_ROUTES (routes.ts:95) gains `/api/encounters/`, answered with `this.engine.encounters(person) satisfies EncountersBody`, with the same 404 naming a non-person and 400 on malformed percent-encoding as its siblings (routes.ts:156-160). bench/app.js's api gains `encounters(thing)`. No harness file declares or reads the body.

5. The panel (`bench/panels/encounters.js`, new; `bench/panels/world.js`). world.js's state gains `encounters`, every person's body read in refresh() beside knowledge, in the snapshot's person order; render() places `encountersSection(h, state.encounters)` right after the Knowledge section. The section is an h2 `Encounters`, then per person a block headed at level 3 `What has passed between <name> and others`, with no parentheses in any heading, so vocabulary()'s room pattern (target.ts:117) never reads it. Under it, a person with no encounters shows one line `no encounters yet`; otherwise one list item per other person, in the order of that person's first encounter, reading `with <id>`, and under it a nested list with one line per encounter in event order: `role direct (actor or target), kind <subkind>, tick <n>, event <id>` or `role witnessed (bystander), kind <subkind>, tick <n>, event <id>`. No line has the form `<id>: held by` (target.ts:116) or contains `exits:` or ` -> `, and the section adds no control, so it adds no candidate and no unlabeled control.

6. Tests. Engine (`tests/encounters.test.ts`, new), on world/ driven only through Engine.act and Engine.step, each case from its own fresh boot: a fresh boot gives every person no encounters; with mux walked to the bar, rogue whisper glitch gives rogue one direct encounter with glitch, glitch one direct with rogue, and mux two witnessed, with rogue then glitch, each kind speech.whisper with that event's tick and id; glitch say gives glitch none and every other person in the room one witnessed with glitch; glitch depart east gives glitch none and rogue one witnessed with glitch, and the arrive gives mux, in the back room, one witnessed with glitch and glitch none with mux, though its copy's present names mux; rogue offer data-shard to glitch then glitch accept give rogue and glitch one direct each with the other per event and a bystander one witnessed with each of the two per event; an offer left to lapse after the giver walked out gives giver and receiver one direct exchange.lapse encounter with each other; a person in the other room gets no encounter from an event it holds no copy of; a refused action (mux offer stimpak to rogue) and an invalid one (verb fly) leave every person's encounters unchanged; a step whose only event is time.tick adds none. Knowledge (`tests/knowledge.test.ts`): its people tests pass unchanged, at base and at head. Server (`tests/server.test.ts`): the route's body equals Engine.encounters(), 404 for a non-person, 400 for malformed percent-encoding. Page (`tests/page.test.ts`): on the fresh world and after the whisper and accept above, the page has the same controls as before the section and no unlabeled control, vocabulary() gives exactly the world's people, items, rooms and exits, and the Encounters section shows each line as the panel defines it.

7. Real runs, after the code passes the gate, with the default model (z-ai/glm-5.3-flash, json-object-z-ai-retry), the list and its cost sent to the orchestrator before any is spent: corpus/goals/knowledge.json, blind-1.json, blind-2.json and blind-2-spent.json copied unchanged to corpus/experiments/npc-encounters/, and `bun run score --goals corpus/experiments/npc-encounters/<set>.json --tick-minutes 10` for each (44 goals, named at about $0.05 from npc-knowledge's $0.047 for the same 44), so the score files land beside the copies and overwrite no committed file, as a check that the larger page costs the existing sets no held goal. The baseline is npc-knowledge's run of the same sets (corpus/goals/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json). docs/work/npc-encounters/real-runs.md reports held and costUsd per set against that baseline, names every goal not held with its cause from its run's loops.jsonl and run.json, and records the page size each set's first loop read, as a data point for #10. A loss a code path decided (a vocabulary or checked() refusal) is a defect fixed before merge; a loss in the model's or Jev's answers is reported as such.

Acts on the gap: It supplies the record the gap names: every person's encounters, one per other participant of each copy it holds, each with role and kind and the event and tick, read from its own copies and shown per other person on the bench, with nothing rolled up.

## Commitments

- Each copy a person holds yields exactly one encounter per other person among its actor and targets, and none when it names no other person.
- An encounter's role is direct exactly when its holder is the copy's actor or a target, and witnessed otherwise.
- An encounter's kind is its event's subkind; no other list of kinds exists.
- Every encounter names its event's id and tick, and a person's encounters come only from copies it holds.
- Encounters are read from the witnessed copies on every request and are never stored, so they cannot drift from the copies.
- Who a copy is with is computed in one place, encountersOf, and knowledge's experienced people are read from it.
- Encounters read only the copy's envelope, never its payload and never a registry entry, so a new subkind needs no change to yield them.
- Nothing in the engine's rules or apply path reads encounters.
- The bench serves each person's encounters on one route and shows them per person, grouped by the other person, in an Encounters section whose every line is labelled, adding no control and no text the target's vocabulary reads.
- No motivation, measurement, standing, edge or summary is built.
- Real runs use the default model, overwrite no committed score file, and their cost is named to the orchestrator before any is spent.

## Sacrifices

- An actor's own act with no other participant (a depart, an arrive, a say to the room) makes no encounter for it, though each bystander who received it holds a witnessed encounter with the actor. (1295 of 4786 corpus/runs/**/received.jsonl: copies naming no participant but their holder, of all copies)
- An arriver holds no encounter with the people its copy's present names; they each hold a witnessed one with it. (544 of 544 corpus/runs/**/received.jsonl: physical.arrive events some non-mover holds a copy of, of all arrive events)
- A speaker saying something to the room holds no encounter with its listeners. (127 of 207 corpus/runs/**/received.jsonl: speech.say events some non-speaker holds a copy of, of all say events)
- Each line of a conversation is its own encounter; whether a conversation is one encounter or many stays deferred. (490 of 3579 corpus/runs/**/received.jsonl: direct speech.say-to and speech.whisper encounters, of all encounters)
- A lapse is a direct encounter between giver and receiver even when they are apart and neither acted at its tick. (6 of 3579 corpus/runs/**/received.jsonl: direct exchange.lapse encounters (an upper bound on those between people apart), of all encounters)
- Every loop's page text, read by Jev and by the target call, grows by the Encounters section. (7924 of 7924 corpus/runs/**/loops.jsonl: loops, each of which reads the page)

## Risk

If the witnessed encounter took the actor alone, the engine's choice of actor would decide which of two people a bystander's view feeds; it takes every participant. If role were read as 'is the actor', a target of a whisper or an offer would be called a bystander; role is direct for actor or target. If encounters were read from the event log instead of the holder's copies, a person in another room would meet people it never saw; they come from received() only. If the rule read the payload, an arrive's present would make the arriver meet the room, a choice not made; it reads the envelope only. If encounters were stored, they could drift from the copies and would restate them; they are derived on read. If a heading or line matched vocabulary()'s item, room or exit patterns, every target would be offered false names; the lines avoid them and a page test pins the vocabulary. If the regression scores were written to committed paths they would overwrite history; the sets are copied to a new experiment folder.

## Licensed by

docs/explorations/npc-relationships.md:60
