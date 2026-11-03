# npc-encounters: real runs

All four sets ran on 2026-11-03 against the job's built code, with the Encounters section on the
bench page after Knowledge. The default model was used, z-ai/glm-5.3-flash under the
json-object-z-ai-retry request, and no `--model` was passed. Each set was scored from a byte copy
as `bun run score --goals corpus/experiments/npc-encounters/<set>.json --tick-minutes 10`. Each
copy's sha256 equals its corpus/goals original's. Each score file lands beside its copy at
`corpus/experiments/npc-encounters/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`,
and the 44 run directories are new under corpus/runs. No committed score file was written:
`git diff -- corpus` is empty. blind-2 and blind-2-spent ran at the same time. Each hosted its own
bench on its own port over its own temporary database (src/adapter/host.ts), so neither run read
the other's world.

## Held and cost per set, beside npc-knowledge's run

The npc-knowledge column is
`corpus/goals/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`: the same model and
request, run before world-prose-travel and before this change.

| set | held | npc-knowledge held | costUsd | npc-knowledge costUsd | retries asked / rescued | provider calls |
|---|---|---|---|---|---|---|
| knowledge | 6 of 6 | 6 of 6 | 0.009671 | 0.008477 | 0 / 0 | Z.AI 6 |
| blind-1 | 12 of 12 | 12 of 12 | 0.010559 | 0.010465 | 0 / 0 | Z.AI 16 |
| blind-2 | 13 of 13 | 13 of 13 | 0.016293 | 0.014655 | 0 / 0 | Z.AI 17 |
| blind-2-spent | 12 of 13 | 13 of 13 | 0.016388 | 0.013674 | 0 / 0 | Z.AI 18 |
| total | 43 of 44 | 44 of 44 | 0.052911 | 0.047271 | 0 / 0 | Z.AI 57 |

The run list was named at about $0.05 and cost $0.0529, 1.12x npc-knowledge's run of the same
sets. world-prose-travel's run of the same sets, the latest before this change, cost $0.046261.

## Page size each set's first loop read

This is loop 1 of each set's first goal: the text after "The page now:" in that loop's `state` in
loops.jsonl. Every first loop reads a fresh world, where the Encounters section is its heading and
three blocks that each read 'no encounters yet'.

| set | first goal | this run | world-prose-travel | npc-knowledge |
|---|---|---|---|---|
| knowledge | mux-finds-rogue | 3719 chars, 96 lines | 3406 chars, 89 lines | 3505 chars, 89 lines |
| blind-1 | glitch-to-back-room | 3719 chars, 96 lines | 3406 chars, 89 lines | 3505 chars, 89 lines |
| blind-2 | shard-to-glitch | 3719 chars, 96 lines | 3406 chars, 89 lines | 3505 chars, 89 lines |
| blind-2-spent | shard-into-glitchs-hands | 3719 chars, 96 lines | 3406 chars, 89 lines | 3505 chars, 89 lines |

On the fresh world the section adds 313 chars and 7 lines to world-prose-travel's page. The page
grows once encounters accrue. Across every loop of the four sets, this run read a page of 9021
chars at most and 5103 on average (240 loops). world-prose-travel read 7726 at most and 4596 on
average (241 loops).

## Goals not held

- read-the-shard (blind-2-spent, run 2026-11-03T22-56-32-613Z). The goal expects no-such-action,
  because nothing on the page reads an item's contents. The model's target in run.json was instead
  `said: glitch speech.say`, with the steps rogue offer data-shard to glitch, glitch accept, glitch
  say. In loops.jsonl, code performed those steps over loops 1 to 10, and the said check held at
  loop 11. Glitch's words invent four contacts. The score file records `target: valid`, no bench
  failure and no retry. So no vocabulary or checked() refusal decided this loss. The model's answer
  did: it mapped "read out the contacts" to a say. The target call read the fresh page, where the
  Encounters section is only its three 'no encounters yet' blocks. The goal was lost the same way,
  with the same target, in world-prose-travel's run (2026-11-03T21-35-50-850Z) and in arm F r2 and
  r3 of corpus/experiments/glm-request, all before this change. npc-knowledge's run held it.

No other goal was lost, and no goal in any set recorded a bench failure, an unreported cost or a
target other than valid.

## How the figures were computed

From the repository root:

```bash
for set in knowledge blind-1 blind-2 blind-2-spent; do
	for file in "corpus/experiments/npc-encounters/$set" "corpus/goals/$set"; do
		jq -r --arg file "$file" '"\($file): held \(.reached.held) of \(.reached.of), costUsd \(.costUsd), retries asked \(.retries.asked) rescued \(.retries.rescued), providers \([.providers[] | "\(.provider) \(.calls)"] | join(", ")); not held: \([.perGoal[] | select(.held | not) | "\(.id) \(.run)"] | if length == 0 then "none" else join(", ") end)"' "$file.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json"
	done
done
jq -s -r '"total: held \(map(.reached.held) | add) of \(map(.reached.of) | add), costUsd \(map(.costUsd) | add)"' corpus/experiments/npc-encounters/{knowledge,blind-1,blind-2,blind-2-spent}.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json
for set in knowledge blind-1 blind-2 blind-2-spent; do
	for dir in corpus/experiments/npc-encounters corpus/experiments/world-prose-travel corpus/goals; do
		run=$(jq -r '.perGoal[0].run | sub("^(\\.\\./)+runs/"; "")' "$dir/$set.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json")
		head -1 "corpus/runs/$run/loops.jsonl" | jq -r --arg dir "$dir" --arg set "$set" '(.state | split("The page now:\n")[1]) as $page | "\($set) \($dir): page \($page | length) chars, \($page | split("\n") | length) lines"'
	done
done
for dir in corpus/experiments/npc-encounters corpus/experiments/world-prose-travel; do
	for set in knowledge blind-1 blind-2 blind-2-spent; do
		jq -r '.perGoal[].run | sub("^(\\.\\./)+runs/"; "")' "$dir/$set.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json"
	done | while read -r run; do cat "corpus/runs/$run/loops.jsonl"; done |
		jq -s -r --arg dir "$dir" '[.[] | .state | split("The page now:\n")[1] | length] | "\($dir): \(length) loops, page chars max \(max), mean \((add / length) | floor)"'
done
jq -c '{target: .target, outcome: .outcome}' corpus/runs/2026-11-03T22-56-32-613Z/run.json
jq -c '{loop, decision: .decision.kind, action, held}' corpus/runs/2026-11-03T22-56-32-613Z/loops.jsonl
git diff --stat -- corpus
```
