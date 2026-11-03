# world-prose-travel: real runs

All four sets ran on 2026-11-03 against the job's built code, with world/ as this job leaves it:
atmosphere-only room descriptions, 1-tick travel each way, and exit lines that read '(1 tick)'. The
default model was used, z-ai/glm-5.3-flash under the json-object-z-ai-retry request, and no
`--model` was passed. Each set was scored from a byte copy as
`bun run score --goals corpus/experiments/world-prose-travel/<set>.json --tick-minutes 10`.
Each score file lands beside its copy at
`corpus/experiments/world-prose-travel/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`,
and the 44 run directories are new under corpus/runs. No committed run or score file was written:
`git diff -- corpus` is empty.

## Held and cost per set, against the committed scores

The committed column is `corpus/goals/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`,
which is the same model and request on world/ before this change.

| set | held | committed held | costUsd | committed costUsd | retries asked / rescued | provider calls |
|---|---|---|---|---|---|---|
| knowledge | 6 of 6 | 6 of 6 | 0.006592 | 0.008477 | 0 / 0 | Z.AI 6 |
| blind-1 | 12 of 12 | 12 of 12 | 0.010127 | 0.010465 | 0 / 0 | Z.AI 16 |
| blind-2 | 13 of 13 | 13 of 13 | 0.013981 | 0.014655 | 0 / 0 | Z.AI 17 |
| blind-2-spent | 12 of 13 | 13 of 13 | 0.015561 | 0.013674 | 0 / 0 | Z.AI 18 |
| total | 43 of 44 | 44 of 44 | 0.046261 | 0.047271 | 0 / 0 | Z.AI 57 |

An earlier attempt at the knowledge set cost $0.001729 more. It stopped after two goals when
OpenRouter answered 402 (out of credits), so it is not counted here and its runs were not kept.
Total spend was $0.047990, under the $0.20 ceiling.

## Goals not held

- read-the-shard (blind-2-spent, run 2026-11-03T21-35-50-850Z). The goal expects no-such-action,
  because nothing on the page reads an item's contents. The model's target in run.json was instead
  `said: glitch speech.say`, with the steps rogue offer data-shard to glitch, glitch accept, glitch
  say. In loops.jsonl, code performed those steps over loops 1 to 10. The bench's said check held
  at loop 11, with words that invent five contacts. This loss is in the model's answer: it mapped
  "read out the contacts" to a say. No code path decided it. Arm F of
  corpus/experiments/glm-request lost this goal the same way, with target `said: glitch
  speech.say`, in r2 and r3, on world/ before this change. The goal's instruction and the shard's
  description are unchanged by this job.

No other goal was lost.

## The changed prose and travel

- rogue-finds-mux (run 2026-11-03T21-28-09-184Z) held at loop 4 with target rogue depart east, then
  one Step. In the 402-stopped attempt, the same goal's target planned rogue depart west, which the
  page does not offer from The Chrome Cassette, and the run ended stuck. That was one sample out of
  two. The full set held, so this run does not show a loss from dropping 'The back room is east.'
- Every walk the knowledge set planned (mux depart west, rogue depart east) needed one Step to the
  arrive, not two. mux-finds-rogue and mux-sees-glitch reached at loop 4, where npc-knowledge's
  runs on the 2-tick west exit reached at loop 5.
- blind-2's fix-the-door names a jammed door that world/ no longer describes. It held as
  no-such-action (run 2026-11-03T21-33-33-704Z).

## How the figures were computed

From the repository root:

```bash
for set in knowledge blind-1 blind-2 blind-2-spent; do
	for file in "corpus/experiments/world-prose-travel/$set" "corpus/goals/$set"; do
		jq -r --arg file "$file" '"\($file): held \(.reached.held) of \(.reached.of), costUsd \(.costUsd), retries asked \(.retries.asked) rescued \(.retries.rescued), providers \([.providers[] | "\(.provider) \(.calls)"] | join(", ")); not held: \([.perGoal[] | select(.held | not) | .id] | if length == 0 then "none" else join(", ") end)"' "$file.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json"
	done
done
jq -s -r '"total: held \(map(.reached.held) | add) of \(map(.reached.of) | add), costUsd \(map(.costUsd) | add)"' corpus/experiments/world-prose-travel/{knowledge,blind-1,blind-2,blind-2-spent}.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json
jq -c '{target: .target, outcome: .outcome}' corpus/runs/2026-11-03T21-35-50-850Z/run.json
jq -c '{loop, decision: .decision.kind, action, held}' corpus/runs/2026-11-03T21-35-50-850Z/loops.jsonl
git diff --stat -- corpus
```
