# C9 walk: blind-2 on main

Run on main at cd700c7 with the real endpoints: `bun run src/player/score.ts --goals corpus/goals/blind-2.json --tick-minutes 10`.
The set was written by a fresh agent ("claude-opus-5-5 (blind-2 writer, pending-states)") that read only world/, src/engine/rules.ts, src/engine/events.ts, src/player/goal.ts and bench/panels/world.js.

Result: reached held 8 of 13 (0.62), below the 9-in-10 bar. Total cost 0.0122 USD, 0 unreported costs.

| goal | outcome | loops |
|---|---|---|
| shard-into-glitchs-hands | ceiling | 24 |
| fresh-cell-for-glitch | ceiling | 24 |
| rogue-ends-up-with-the-stim | ceiling | 24 |
| shard-back-to-mux | ceiling | 24 |
| glitch-slips-out-back | reached | 3 |
| mux-comes-out-front | reached | 5 |
| rogue-goes-to-check-stock | reached | 4 |
| rogue-calls-last-orders | reached | 5 |
| rogue-warns-glitch-openly | reached | 6 |
| glitch-confides-in-rogue | reached | 5 |
| mux-asks-glitch-about-the-cell | ceiling | 24 |
| read-the-shard | no-such-action | 0 |
| glitch-takes-the-jolt | no-such-action | 0 |

## Why the five misses failed

None of the five misses recorded any event (every `events.jsonl` is empty), and none has a `resolve` loop: every loop is `act`. The pending-state mechanism never engaged, because the action that opens the pending state was never recorded.

- In the give runs, Jev chose the receiver as actor, or the right actor with the wrong fields, and pressed Act again and again. The page showed the refusal each time; for example, in the stimpak run, loop 5's state carries `refused: not-holding: rogue does not hold "stimpak"`.
- Before this change the model's target named the first action ("First action toward it: ..."). With the target now a typed end state, the state Jev reads carries only `End state: rogue holds stimpak` (src/player/rule.ts:62). The move that opens the pending state (who offers what to whom, or who walks first) is left to the per-control nouls alone, and they do not find it.
- The say-to miss (Mux to Glitch) is the same class: it needs a walk before the say-to, and no pending state stands until the walk is made.

The fix reaches what happens before any pending state stands: the design derives the move only once a pending state exists, and nothing derives the action that opens one.

Runs: corpus/runs/2026-10-31T06-53-09-254Z, 06-53-20-675Z, 06-53-31-779Z, 06-53-42-263Z and 06-54-16-479Z (the misses); score: corpus/goals/blind-2.score.json.
