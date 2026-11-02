# npc-knowledge: real runs

All four sets ran on 2026-11-02 with the default model, z-ai/glm-5.3-flash under the
json-object-z-ai-retry request. No `--model` was passed. Each set was run as
`bun run score --goals corpus/goals/<set>.json --tick-minutes 10` against the job's built code.
The four score files are new, at `corpus/goals/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`.
No score file committed before the job was written; `git diff -- corpus` is empty.

## Held and cost per set

| set | held | costUsd | retries asked / rescued | provider calls |
|---|---|---|---|---|
| knowledge | 6 of 6 | 0.008477 | 0 / 0 | Z.AI 6 |
| blind-1 | 12 of 12 | 0.010465 | 0 / 0 | Z.AI 16 |
| blind-2 | 13 of 13 | 0.014655 | 0 / 0 | Z.AI 17 |
| blind-2-spent | 13 of 13 | 0.013674 | 0 / 0 | Z.AI 17 |
| total | 44 of 44 | 0.047271 | 0 / 0 | Z.AI 56 |

The run list was named at about $0.04 and cost $0.0473. The overrun is the larger page and the
longer target prompt on the blind sets (see the comparison below).

## Goals not held

None: every goal in every set held, so there is no loss to explain and none a code path decided.
How each knowledge goal was reached, from its run's run.json target and loops.jsonl decisions:

- mux-finds-rogue (run 2026-11-02T22-53-29-727Z): the plan was mux depart west. Code waited out the
  walk with two Steps, and the arrive's `present` taught Mux where Rogue is. Reached at loop 5.
- rogue-finds-mux (2026-11-02T22-53-43-351Z): rogue depart east, then one Step. Arriving in the Back
  Room taught Rogue where Mux is. Reached at loop 4.
- glitch-finds-cell (2026-11-02T22-53-53-174Z): the plan was glitch depart east, mux offer
  charge-cell to glitch, glitch refuse. The offer taught Glitch that Mux holds the cell, so the run
  was reached at loop 6, before the refuse.
- mux-sees-glitch (2026-11-02T22-54-32-908Z): mux depart west and two Steps. Reached at loop 5.
- mux-finds-shard (2026-11-02T22-54-44-735Z): rogue depart east, then rogue offer data-shard to
  mux. The offer taught Mux that Rogue holds the shard. Reached at loop 8.
- rogue-reads-glitch (2026-11-02T22-55-04-697Z): no-such-action, as expected. The model said no end
  state makes one person know another's thoughts.

## The blind sets against arm F of corpus/experiments/glm-request

Arm F is the same model and request before this change, run three times (r1 to r3) over the same
blind sets.

| set | this run | arm F r1 | arm F r2 | arm F r3 | costUsd this run / arm F mean |
|---|---|---|---|---|---|
| blind-1 | 12 of 12 | 12 of 12 | 12 of 12 | 12 of 12 | 0.010465 / 0.007219 (1.45x) |
| blind-2 | 13 of 13 | 11 of 13 | 13 of 13 | 13 of 13 | 0.014655 / 0.009952 (1.47x) |
| blind-2-spent | 13 of 13 | 13 of 13 | 12 of 13 | 12 of 13 | 0.013674 / 0.010345 (1.32x) |

Arm F's losses were stimpak-for-mux and rogue-faces-mux (blind-2, r1) and read-the-shard
(blind-2-spent, r2 and r3). This run held all three. Held goals show no cost from the larger page
or the longer target prompt. Spend does: each blind set cost 1.3x to 1.5x arm F's mean, because
every loop now reads the Knowledge section and every target prompt carries the two knows end states
and the sentence on how people learn.

## How the figures were computed

From the repository root:

```bash
for set in knowledge blind-1 blind-2 blind-2-spent; do
	jq -r '"\(.set): held \(.reached.held) of \(.reached.of), costUsd \(.costUsd), retries asked \(.retries.asked) rescued \(.retries.rescued), providers \([.providers[] | "\(.provider) \(.calls)"] | join(", ")); not held: \([.perGoal[] | select(.held | not) | .id] | if length == 0 then "none" else join(", ") end)"' "corpus/goals/$set.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json"
done
jq -s -r '"total: held \(map(.reached.held) | add) of \(map(.reached.of) | add), costUsd \(map(.costUsd) | add)"' corpus/goals/{knowledge,blind-1,blind-2,blind-2-spent}.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json
for set in blind-1 blind-2 blind-2-spent; do
	for rep in r1 r2 r3; do
		jq -r --arg rep "$rep" '"arm F \($rep) \(.set): held \(.reached.held) of \(.reached.of), costUsd \(.costUsd); not held: \([.perGoal[] | select(.held | not) | .id] | if length == 0 then "none" else join(", ") end)"' "corpus/experiments/glm-request/F/$rep/$set.z-ai_glm-5.3-flash.json-schema-retry.score.json"
	done
	jq -s -r '"\(.[0].set): this run costUsd \(.[0].costUsd); arm F mean costUsd \(.[1:] | map(.costUsd) | add / length); ratio \(.[0].costUsd / (.[1:] | map(.costUsd) | add / length))"' "corpus/goals/$set.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json" corpus/experiments/glm-request/F/r{1,2,3}/"$set".z-ai_glm-5.3-flash.json-schema-retry.score.json
done
```
