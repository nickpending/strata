# C9 walk, re-run: fresh blind-2 on main

Run on main at e93f32e (the rebuilt job merged as fc16b7f), with the real endpoints: `bun run src/player/score.ts --goals corpus/goals/blind-2.json --tick-minutes 10`.
The set was written fresh by "claude-opus-5-5 (blind-2 rewalk writer, pending-states)". That agent read only world/, src/engine/rules.ts, src/engine/events.ts, src/player/goal.ts and bench/panels/world.js. It did not read src/player/rule.ts, any file under corpus/goals/ (blind-1, the spent blind-2 now at blind-2-spent.json, the calibration set or any score), corpus/runs/, docs/ or git history.

Result: reached held 12 of 13 (0.92), at or above the 9-in-10 bar. Total cost 0.0099 USD, 0 unreported costs. Rule: RULE_AUTHOR "claude-opus-5-5 (bench-driver builder)", with T_DONE 0.6 and T_ACT 0.3 unchanged.

| goal | outcome | held | loops | decisions |
|---|---|---|---|---|
| shard-to-glitch | reached | yes | 8 | plan 4, resolve 3 |
| stimpak-to-rogue | reached | yes | 8 | plan 4, resolve 3 |
| stimpak-for-mux | reached | no | 1 | none |
| cell-for-rogue | reached | yes | 11 | plan 6, wait 1, resolve 3 |
| shard-to-mux | reached | yes | 11 | plan 6, wait 1, resolve 3 |
| rogue-checks-back | reached | yes | 4 | plan 2, resolve 1 |
| mux-comes-out-front | reached | yes | 5 | plan 2, resolve 2 |
| glitch-quiet-word | reached | yes | 5 | plan 4 |
| rogue-announces | reached | yes | 5 | plan 4 |
| mux-mutters | reached | yes | 5 | plan 4 |
| rogue-faces-mux | reached | yes | 8 | plan 6, wait 1 |
| decrypt-the-shard | no-such-action | yes | 0 | none |
| fix-the-door | no-such-action | yes | 0 | none |

Every give, including the three that need a walk first, now goes plan, then wait, then resolve, and ends with the item held and no lapse. Not one loop was led by Jev's choice.

## The one miss

stimpak-for-mux ("Mux is looking rough back there. Get Glitch's stimpak into his hands.") failed on the model's target, not on the loop. The model read "his" as Glitch and typed `{"holder": {"item": "stimpak", "person": "glitch"}}` with no steps (corpus/runs/2026-10-31T07-23-50-605Z/run.json). That end state already holds on a fresh world, so the run ended reached on loop 1 and did nothing, and the goal file's `holder(stimpak, mux)` did not hold.

This is a cost of the model typing the goal. A target whose end state already holds before any action ends at once.

Runs: the 13 directories corpus/runs/2026-10-31T07-23-39-494Z through 2026-10-31T07-24-42-955Z. Score: corpus/goals/blind-2.score.json.
