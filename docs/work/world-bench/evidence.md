---
type: work-note
date: 2026-10-30
title: "world-bench post-merge walk"
description: "What the C10 walk showed on the merged bench at 50ee2c6, launched with --tick-minutes 10 and driven through every route the world panel uses."
purpose: "The record of the C10 walk, read by whoever next touches the bench's routes or its world panel."
producer: assistant
---

# Evidence: world-bench

## C10 walk, on 50ee2c6

Launched from the main checkout with `bun run src/server/main.ts --tick-minutes 10` (the tick length is the
operator's pick, recorded at the gate). The server printed `strata bench on http://127.0.0.1:4800/ (one tick =
10 minutes)`. The database was the default `./strata.sqlite`, gitignored.

No browser automation was available in the session that ran the walk, so the panel's rendering was not watched
in a browser here. Each route the panel calls was driven in the order the panel would, with the same JSON
bodies `bench/app.js` sends; the panel's own rendering of these responses, including the inline refusal and
the per-person received view, is proven by `tests/server.test.ts`, which mounts `bench/panels/world.js`
against a live server under a minimal DOM and drives its form, selects and buttons. The server was left running
for the operator to open the page.

What the routes showed:

- **Files.** `GET /` 200 `text/html`; `GET /bench/app.js` and `GET /bench/panels/world.js` 200 `text/javascript`.
- **Verbs.** `GET /api/verbs` listed seven, each with its fields from the action schema: depart (exit), say
  (words), say-to (target, words), whisper (target, words), offer (target, item), accept (item), refuse (item).
- **Boot.** `POST /api/reset` then `GET /api/snapshot`: tick 0, game minute 0; Glitch and Rogue in the Chrome
  Cassette, Mux in the Back Room; stimpak held by glitch, charge-cell by mux, data-shard by rogue; each person's
  authored tie present (rogue→glitch wary tolerance, glitch→rogue lying low on her tolerance, mux→glitch a
  regular for parts); nothing in transit, no offers, nothing due; the history empty.
- **Depart.** Glitch departs east: `physical.depart` e1 at tick 0 with to back-room, travelTicks 1, arrivesAt 1,
  cause operator. The snapshot then showed Glitch in transit and absent from both rooms, and the schedule holding
  the arrive due at tick 1 with cause e1.
- **Step.** `POST /api/step`: `time.tick` e2 at tick 1, then `physical.arrive` e3 with cause e1, in that order.
  The clock read tick 1, game minute 10. Glitch was present in the Back Room with Mux; the schedule was empty.
- **Whisper.** Glitch whispers to Mux "the shard is hot": `speech.whisper` e4 with visibility place and words
  narrowed to participants. `GET /api/received/<person>`: Glitch and Mux hold the copy with the words; Rogue,
  in the other room, holds no copy of it and still holds her copy of the depart.
- **Give.** Mux offers the charge-cell to Glitch: `exchange.offer` e5 with until 3 (tick 1 plus the authored
  window of 2), the holder still mux, the lapse due at tick 3 with cause e5. Glitch accepts: `exchange.accept`
  e6; the holder moved to glitch, the offer cleared, nothing due.
- **Forbidden action.** Rogue departs west from the Chrome Cassette: 422 with
  `{"refused":{"code":"no-such-exit","message":"chrome-cassette has no exit \"west\""}}`; the history unchanged.
- **History.** `GET /api/events?since=0`: e1 depart, e2 tick, e3 arrive (cause e1), e4 whisper, e5 offer,
  e6 accept, consecutive seqs, ticks 0 then 1.
- **Reset.** `POST /api/reset` returned the boot snapshot; the history read empty afterwards.
- **Boundary.** A `text/plain` POST got 415, a GET with `Host: evil.example:4800` got 403, a JSON POST with
  `Origin: http://evil.example` got 403.

## Out of scope, as the work order recorded it

- No resume: a restart boots afresh from the definitions and replaces the previous run's database.
- No push channel: the page refetches after each action or step; a second viewer would see changes only on its
  own next action.
- Rooms carry no live part in this block; the first block that gives rooms state adds the first room part.
- No voice prose in the definitions yet.
- The witness rule reads presence after the event is applied, plus actor and targets, and in this block no test
  can tell that from reading presence before: only the actor's own location changes and the actor is always a
  witness. The rule earns its mutation test in the first block whose event moves someone other than its actor.
