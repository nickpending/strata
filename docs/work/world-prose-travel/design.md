---
type: design
date: 2026-11-03
title: "Design: world-prose-travel"
description: "world/ is authored for play and no longer bent for a test. Its room and item descriptions are atmosphere only and restate no exit, direction or person's whereabouts, and every exit takes 1 tick. The offer window stays at 2. The tests that need a walk longer than a tick, or an arrive and a lapse due on the same tick, run on a small fixture world. A test over every committed world keeps descriptions free of the typed facts it can name. The bench prints a one-tick exit as '(1 tick)'. A re-score shows whether the default player still holds the goal sets on the changed page, without touching a committed score file."
purpose: "The recorded design of the world-prose-travel work order, read by its plan and its builders."
producer: cli:shape
---

# Design: world-prose-travel

## Purpose

world/ is authored for play and no longer bent for a test. Its room and item descriptions are atmosphere only and restate no exit, direction or person's whereabouts, and every exit takes 1 tick. The offer window stays at 2. The tests that need a walk longer than a tick, or an arrive and a lapse due on the same tick, run on a small fixture world. A test over every committed world keeps descriptions free of the typed facts it can name. The bench prints a one-tick exit as '(1 tick)'. A re-score shows whether the default player still holds the goal sets on the changed page, without touching a committed score file.

## Form

Two world edits, one fixture world, the tests moved onto it or onto the 1-tick walk, one guard test, the exit line's plural and one re-score.

1. world/ (`world/rooms/back-room.toml`, `world/rooms/chrome-cassette.toml`). Each description keeps its atmosphere sentence and drops the sentences that restate typed data. back-room becomes `description = "A dim room stacked with crates and dead screens."`, dropping 'The bar is back west, past a jammed door.' (the west exit owns the way and the connection). chrome-cassette becomes `description = "A cramped bar thick with smoke and bass."`, dropping 'A fixer works the corner booth.' (Rogue's location owns who is there) and 'The back room is east.' (the east exit owns it). back-room's exit becomes `west = { to = "chrome-cassette", travel_ticks = 1 }`. Nothing else in world/ changes: chrome-cassette's east exit is already 1, `world/world.toml` keeps `offer_window_ticks = 2`, the three item descriptions restate nothing (sweep-world.txt lines 6 to 8), and tie notes belong to the relationships work (npc-relationships.md:37).

2. The fixture world (`tests/worlds/two-tick/`, new). It is a complete world in world/'s layout, booted by `boot()`/`loadWorld()` unchanged. `world.toml` has `[rules] offer_window_ticks = 2`. Two rooms: `rooms/yard.toml` (id yard, name Yard, description 'A bare yard under a flickering lamp.', exits `north = { to = "hall", travel_ticks = 2 }`) and `rooms/hall.toml` (id hall, name Hall, description 'A long hall that smells of rain.', exits `south = { to = "yard", travel_ticks = 2 }`). Its travel is symmetric too, at 2 ticks, the length the tests need. Three people, each with `places = ["hall", "yard"]` and `ties = []`: `people/<name>.toml` (location yard), `people/bo.toml` and `people/cy.toml` (location hall). One item, `items/token.toml` (id token, name token, description 'A worn brass token.', holder bo). The neutral yard and hall names follow harness/test/fixtures.ts:61.

3. Tests that needed the 2-tick walk.
- `tests/clock.test.ts` C8, both tests, boot the fixture. <name> departs north (arrivesAt 2) and Bo offers Cy the token (until 2), so the schedule is `[[2, physical.arrive], [2, exchange.lapse]]`. The first step fires nothing but the tick, and the second fires tick, arrive, lapse in that order with consecutive seqs. In the second test, `fired` gives the arrive's `present` as `["bo", "cy"]` and the lapse as scheduled, and nothing is due at tick 1. Every assertion the two tests make today is kept, restated in the fixture's ids.
- `tests/player.test.ts`, 'a walk then a say-to', runs on the fixture through play()'s `--world tests/worlds/two-tick` flag, with the target steps <name> depart north, then <name> say-to bo. It keeps both wait loops and every assertion on loops, actions and history, restated in the fixture's ids. It is the only player test with consecutive waits (tests/player.test.ts:407).
- These stay on world/ and walk Mux west in one step: knowledge.test.ts muxToBar (one step to the arrive) and the two K3 tests that step before the arrive; driver.test.ts K7's muxWalksIn; page.test.ts K9 (the first /api/step holds the arrive). Every expected tick or row derived from the walk is re-derived by hand for a 1-tick walk, for example K2's lapse test reads `[offer.tick, lapse.tick, snapshot tick]` as `[1, 3, 3]`. No assertion is dropped.
- `tests/driver.test.ts` C1 and C11 run seed 7 with `--actions 800` and assert `steps: 160`. They keep every assertion on subkinds, codes, checks and world/ untouched, because seed 7 at 400 actions misses two codes on the changed world and reaches all 8 at 800 (probe-seeds.txt).

4. The guard (`tests/world-prose.test.ts`, new). It reads every committed world (`world/` and each directory under `tests/worlds/`) with `loadWorld`. For each room and each item description, it asserts that the description matches none of the world's typed words, as whole words and ignoring case. The typed words are every exit key of every room; and the id, the id with hyphens read as spaces, and the name of every room, person and item other than the thing described. The failure names the world, the file's thing, the description and the word it matched. On 412eb53's world/ it fails on back-room ('west') and chrome-cassette ('east', 'back room'). The engine and the schema are unchanged: a boot rule on description text would be code deciding on prose (strata-layered-world-engine.md:129).

5. The exit line's plural (`bench/panels/world.js:113`). The line renders `${exit} -> ${to.to} (${n} tick)` when `n` is 1 and `(${n} ticks)` otherwise, so with symmetric travel every world/ exit reads '(1 tick)'. `tests/page.test.ts` gains one test that hosts world/ through hostBench and reads the page: it expects 'west -> chrome-cassette (1 tick)' and 'east -> back-room (1 tick)', and expects no line to contain '1 ticks'. It then hosts tests/worlds/two-tick and expects 'north -> hall (2 ticks)'. On 412eb53's world.js it fails on '1 ticks'. `harness/test/fixtures.ts` PAGE, the harness's copy of the page text, changes its '(1 ticks)' lines to '(1 tick)' to keep mirroring the page. The harness's exit parse reads only `<exit> -> ` (harness/src/target.ts:118), so the vocabulary is unchanged.

6. The re-score (`corpus/experiments/world-prose-travel/`, new). It holds byte copies of `corpus/goals/{knowledge,blind-1,blind-2,blind-2-spent}.json`. A test in the pattern of tests/experiment-copies.test.ts pins each copy's sha256 to its original. After the code passes the gate, each copy runs once with the default model (z-ai/glm-5.3-flash, json-object-z-ai-retry) as `bun run score --goals corpus/experiments/world-prose-travel/<set>.json --tick-minutes 10`, 44 goals in all. Each score file lands beside its copy, and new run directories land in corpus/runs, so no committed run or score file is written. calibration is not run, because it is the rule author's set and score refuses it without --sweep. `docs/work/world-prose-travel/real-runs.md` reports, per set, held of goals and costUsd against the committed `corpus/goals/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json` (44 of 44, $0.047271). It names every goal not held with its cause, read from its run's loops.jsonl and run.json. A loss that a code path decided is a defect fixed before merge, and a loss in the model's or Jev's answers is reported as such (D17 replaced the per-set pass bar with this loss report). The estimate is $0.05, and the orchestrator's ceiling is $0.20.

Acts on the cause: It removes the condition itself. world/'s descriptions no longer carry directions or who-is-where, and its west exit is 1 tick. The one test that needed a same-tick arrive and lapse now gets them from a fixture world whose own times make them coincide. So nothing in world/ is authored for a test, and no prose there can contradict an exit or a location.

## Commitments

- No room or item description in any committed world names an exit key, or the id or name of another room, person or item, and a test over every committed world fails when one does.
- Every exit in world/ takes 1 tick, and world/'s offer window is 2 ticks.
- The bench's exit line reads '(1 tick)' for a one-tick exit and '(n ticks)' otherwise, and a page test fails on '1 ticks'.
- An arrive and a lapse due on the same tick fire after the tick in the order they were scheduled, tested on tests/worlds/two-tick, never on world/.
- Every assertion of the twelve tests the change breaks is kept, restated for the 1-tick walk or the fixture's ids; none is deleted to pass.
- The plan's repeated wait is still tested with two consecutive wait loops, on the fixture world.
- The default player's re-score of knowledge, blind-1, blind-2 and blind-2-spent writes no committed run or score file. It names every goal not held with its cause, and it costs under $0.20.

## Sacrifices

- The guard catches only names, ids and exit keys, so prose that restates a fact without naming it (a role noun such as 'a fixer', a door between two rooms) is kept out by authoring alone. (1 of 3 docs/work/world-prose-travel/shape/sweep-world.txt (world/ at 412eb53))
- C1's claim that the driver reaches every refusal code is held for seed 7 at 800 actions, not for every seed: seed 2 at 800 still misses already-offered. (1 of 12 docs/work/world-prose-travel/shape/probe-seeds.txt)
- On world/ no walk is longer than one tick, so transit across several ticks and the plan's repeated wait are tested only on the fixture world. (not a case: After the ruling world/ has no exit longer than a tick, so no play on world/ can reach a multi-tick transit; the cost falls only on what tests can show there.)
- blind-2's fix-the-door goal names a jammed door that world/ no longer describes; its expectation, no-such-action, is unchanged and the goal file is not edited. (1 of 53 docs/work/world-prose-travel/shape/goal-prose.txt)
- Atmosphere in any committed world may not use an exit key or another thing's id or name, even innocently ('a west wind'), because the guard refuses it. (0 of 8 docs/work/world-prose-travel/shape/design.json form sections 1 and 2 (2 room and 3 item descriptions in world/, 3 in the fixture))

## Risk

If C8 stayed on world/ by timing its offer a tick later, the test would still depend on world/'s travel time equalling the offer window minus one, so it moves to a fixture that owns its own times. If the guard were a boot rule, the engine would refuse a world over prose, which the founding rule forbids; it is a test over committed worlds. If the twelve broken tests were fixed by dropping assertions, the walk, present and knowledge checks would silently weaken; every assertion is kept and re-derived. If C1 dropped its every-code assertion, the driver's coverage claim would weaken unseen; it raises the action count instead. If the re-score scored corpus/goals in place, it would overwrite npc-knowledge's committed score files; it scores byte copies under corpus/experiments.

## Licensed by

docs/explorations/npc-relationships.md:38
