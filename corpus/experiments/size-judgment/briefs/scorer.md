## The job

Write `corpus/experiments/size-judgment/score.ts` (repository /Users/rudy/development/projects/strata), a Bun
script that scores Jev's size judgments against blind labels, exactly as the pre-registration specifies.

## Read, and only these

- `corpus/experiments/size-judgment/prereg.md`, sections "Scoring" and "Comparison, decided now": your spec.
- `corpus/experiments/size-judgment/contract.ts` and `run.ts`: what a judgment line in `judgments.jsonl` holds (one
  JSON object per line: `case`, `scenario`, `arm`, `variant`, `final`, `rep`, `ok`, `items` with each item's `key`,
  `value`, `direction`, `level` and `mapped`, `levels`, `toLabel`, `calls`, `questionCount`, `costUsd`, `ms`,
  `requests`).
- `corpus/experiments/value-weighting-4/score.ts` for house style only.

Never open anything under `corpus/experiments/size-judgment/arms/` or any material or labels file other than ones
you create for testing.

## Inputs

- `--calls a.jsonl[,b.jsonl]`: judgment lines.
- `--labels labels.json`: `{ "cases": [ { "id", "set", "items": [ { "value", "direction", "size", "rationale" } ] } ],
  "pairs": [ { "a", "b", "value", "direction" } ] }`. An item is keyed by case id and `value__direction`.
- `--labels2 labels2.json` (optional): the second labeller, `{ "cases": [ { "id", "items": [ ... size ... ] } ] }`,
  no pairs.
- `--cases id,id` (optional) to restrict, and `--seed` (default 1), `--resamples` (default 10000).

## What it prints (markdown, to stdout)

Per (arm, variant): M1 (per rep and mean, plus SD over reps), M2 (up, down, and each value with 8 or more items in
the scored set), M3 (ordered / tied / reversed mean over reps, and pairs ordered in at least 4 of 5 reps, or a
majority of reps when there are fewer than 5), M4 exact and exact-or-adjacent, M5 (mean distinct levels per item,
share of items whose level changes across reps), M6 (requests, questions, USD, median ms per judgment), refused
count. Then the ceiling (second labeller against the first, as the prereg lists) and every arm's M1 and M3 on the
consensus subset, when `--labels2` is given. Then the comparison: each non-A final against A's final, the paired
cluster bootstrap over scenarios with Bonferroni over the number of non-A finals present, the interval, and the
outcome (beats A / A beats / tie); the recommended wording by the prereg's step 2; the "good enough" grade by step 3
(ceiling ρ from `--labels2`; without it, print that (a) cannot be judged). Only judgments with `final: true` enter
the comparison; contenders get the descriptive metrics only.

Where the spec is silent, choose the plain reading and list every such choice in the file's header comment, as
v4's scorer does. Spearman uses average ranks for ties; a constant input gives NaN, printed as such. A refused
judgment drops its items for that rep only.

## Test it

Write a small synthetic labels file and a synthetic judgments file under `corpus/runs/size-judgment/scorer-test/`
(gitignored) with two arms (A and B), a few scenarios, two reps, and one pair, whose correct outputs you derive by
hand; check the script reproduces them, including one tie case for Spearman and one tied pair.
Keep it under about 500 lines.

## Reply with

The path; the spec-silent choices; the hand-checked test and its result. Under 250 words.
