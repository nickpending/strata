# npc-values: real runs

The four sets were re-run on 2026-11-11 (UTC) against the job's built code, after the page split.
The player now reads only the bench's main landmark: Act, Clock, Pending, Rooms, In transit, Items
and History. Values, Knowledge, Encounters and Received sit in the operator aside, which the
harness never reads. The default model was used, z-ai/glm-5.3-flash under the
json-object-z-ai-retry request, and no `--model` was passed. Each set was scored from a byte copy
as `bun run score --goals corpus/experiments/npc-values/<set>.json --tick-minutes 10`. Each copy's
sha256 equals its corpus/goals original's. Each score file lands beside its copy at
`corpus/experiments/npc-values/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json` and
replaces the first run's file of the same name. Each now carries its `page` field. No committed
score file was written: `git diff -- corpus/goals` is empty. blind-1, blind-2 and blind-2-spent ran
at the same time, each on its own bench, port and temporary database (src/adapter/host.ts). The
re-run's 44 run directories and the first run's 44 were copied to the main checkout's corpus/runs,
where each is identical to the build worktree's.

## Held, cost and page per set, beside npc-encounters' run

The npc-encounters columns are
`corpus/experiments/npc-encounters/<set>.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`: the
same model and request, run before this work order. Its page figures are computed from its runs'
loops.jsonl in the main checkout's corpus/runs by harness/src/score.ts pageSize(), the same rule
that wrote this run's `page` fields. Each figure is page characters after "The page now:" in a
loop's state, as the floored mean / the maximum over every loop of the set.

| set | held | npc-encounters held | costUsd | npc-encounters costUsd | page mean / max | npc-encounters page mean / max | loops | retries asked / rescued | provider calls |
|---|---|---|---|---|---|---|---|---|---|
| knowledge | 6 of 6 | 6 of 6 | 0.007095 | 0.009671 | 2908 / 4190 | 5244 / 8431 | 26 | 0 / 0 | Z.AI 6 |
| blind-1 | 12 of 12 | 12 of 12 | 0.007986 | 0.010559 | 2627 / 4208 | 4718 / 8953 | 56 | 0 / 0 | Z.AI 16 |
| blind-2 | 13 of 13 | 13 of 13 | 0.012043 | 0.016293 | 2920 / 4199 | 5302 / 9021 | 79 | 0 / 0 | Z.AI 17 |
| blind-2-spent | 12 of 13 | 12 of 13 | 0.012304 | 0.016388 | 2812 / 4208 | 5133 / 8682 | 80 | 0 / 0 | Z.AI 18 |
| total | 43 of 44 | 43 of 44 | 0.039429 | 0.052911 | | 5103 / 9021 | 241 | 0 / 0 | Z.AI 57 |

The re-run holds 43 of 44, npc-encounters' bar. It cost 0.75x npc-encounters' run of the same sets,
and its player read about 55% of the page per loop that npc-encounters' player read. No goal
recorded a bench failure, an unreported cost or a target other than valid.

Each set's first loop read 2123 chars in 59 lines. npc-encounters' first loop read 3719 chars in 96
lines, and the first run's 7955 in 133.

## The first run, the record that led here

first run: held 37 of 44, costUsd 0.069152, with the whole page read: Values, Knowledge, Encounters
and Received included.

The first run's first loop read 7955 chars against npc-encounters' 3719, so the page had doubled.
Across all its loops it read 9313 chars on average and 13200 at most (230 loops). Per set it held
4 of 6 (knowledge), 11 of 12 (blind-1), 11 of 13 (blind-2) and 11 of 13 (blind-2-spent), for
0.011622, 0.013860, 0.022032 and 0.021639. Its seven losses were model answers:
- Three plans departed west from chrome-cassette, whose only exit is east: glitch-finds-cell,
  rogue-faces-mux and fresh-cell-for-glitch.
- Three goals that expect no-such-action were mapped to an action: rogue-reads-glitch,
  decrypt-the-shard and read-the-shard.
- In mux-speaks-up, checked() refused a bare `say` for `speech.say`. This is accepted as a model
  naming loss (strata-d3, 2026-11-10).

That run led to the page split (#10) and to this re-run. Its run directories are in the main
checkout's corpus/runs: 2026-11-11T02-24-00-915Z through 2026-11-11T02-38-27-917Z.

## Spend

The probe (corpus/experiments/npc-values/probe.txt) cost $0.000018102 and the first run $0.069152,
both under the first approved $0.10. The re-run was approved up to a further $0.10.

re-run costUsd: 0.039429

total spend: 0.108599

## Goals not held

- read-the-shard (blind-2-spent, run 2026-11-11T03-03-46-646Z). The goal expects no-such-action,
  because nothing on the page reads an item's contents. The model's target in run.json was instead
  `said: glitch speech.say`, with the steps rogue offer data-shard to glitch, glitch accept, glitch
  say. In loops.jsonl, code performed those steps over loops 1 to 10, and the said check held at
  loop 11; Glitch's words invent the shard's contacts. The score file records `target: valid`, no
  bench failure and no retry. No vocabulary or checked() refusal decided this loss; the model's
  answer did, mapping "read out the contacts" to a say. npc-encounters' run lost it the same way,
  with the same target.

No other goal was lost.

## How the figures were computed

From the build worktree's root, with the main checkout's corpus/runs holding npc-encounters' run
directories:

```bash
for set in knowledge blind-1 blind-2 blind-2-spent; do
	jq -r '"\(.set): held \(.reached.held) of \(.reached.of), costUsd \(.costUsd), retries \(.retries.asked)/\(.retries.rescued), providers \([.providers[] | "\(.provider) \(.calls)"] | join(", ")), unreported \(.unreportedCosts), benchFailures \([.perGoal[].benchFailures[]] | length), targets \(.targets.valid)/\(.targets.asked), page \(.page | tostring); lost \([.perGoal[] | select(.held | not) | "\(.id) \(.outcome) \(.run)"] | join("; "))"' "corpus/experiments/npc-values/$set.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json"
done
jq -s -r '"total: held \(map(.reached.held) | add) of \(map(.reached.of) | add), costUsd \(map(.costUsd) | add), loops \(map(.page.loops) | add)"' corpus/experiments/npc-values/{knowledge,blind-1,blind-2,blind-2-spent}.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json
# npc-encounters' page per set, by the same pageSize() over its runs' loops.jsonl
# (MAIN is the main checkout's path):
MAIN=<main checkout> bun -e '
import { readFileSync } from "node:fs";
import { pageSize } from "./harness/src/score.ts";
const all = [];
for (const set of ["knowledge", "blind-1", "blind-2", "blind-2-spent"]) {
  const score = JSON.parse(readFileSync(`corpus/experiments/npc-encounters/${set}.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`, "utf8"));
  const loops = score.perGoal.flatMap((g) => readFileSync(`${process.env.MAIN}/corpus/runs/${g.run.replace(/^(\.\.\/)+runs\//, "")}/loops.jsonl`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
  all.push(...loops);
  console.log(set, JSON.stringify(pageSize(loops)));
}
console.log("all", JSON.stringify(pageSize(all)));
'
# The first loop's page of each set's first goal:
run=$(jq -r '.perGoal[0].run | sub("^(\\.\\./)+runs/"; "")' corpus/experiments/npc-values/knowledge.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json)
head -1 "corpus/runs/$run/loops.jsonl" | jq -r '(.state | split("The page now:\n")[1]) as $page | "page \($page | length) chars, \($page | split("\n") | length) lines"'
jq -c '{target, words, outcome, held}' corpus/runs/2026-11-11T03-03-46-646Z/run.json
jq -c '{loop, decision: .decision.kind, action, held}' corpus/runs/2026-11-11T03-03-46-646Z/loops.jsonl
git diff --stat -- corpus/goals
```
