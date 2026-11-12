## The job

Write `corpus/experiments/gate-direction/score.ts`, the scorer for the gate-direction experiment, from its
specification alone. Read `corpus/experiments/gate-direction/prereg.md` ("Scoring" and "Comparison, decided now") and
`corpus/experiments/gate-direction/contract.ts`, and the judgment line format written by
`corpus/experiments/gate-direction/run.ts` (its `appendFileSync` call). Never open `arms/`, `corpus/runs/` or any
labels or material file's contents beyond what you need to check their shape against this brief.

Labels (`labels.json`, and the second labeller's `labels2.json`): `{ "cases": [ { "id", "stake": { <value>: "up" |
"down" | "none" }, "deed": { ... } , ... } ] }`. Item key `<channel>__<value>`, label +1 / -1 / 0.

## Requirements

- usage: `bun score.ts --calls a.jsonl[,b.jsonl] --labels labels.json [--labels2 labels2.json] [--seed 1]
  [--resamples 10000]`; Markdown to stdout.
- Every metric of "Scoring" (M1 to M8, the ceiling and the consensus subset), per (arm, variant), finals first.
- The comparison of "Comparison, decided now", steps 1 to 4, printing each step's numbers and a final VERDICT line,
  the recommendation and the grade.
- A header: judgments, refusals per (arm, variant), reps, cases, scenarios, items, touched items per channel and
  direction.
- A short comment block at the top listing every choice you made where the spec is silent (plain reading), as
  `../size-judgment/score.ts` does. Spearman with average ranks for ties; an exact Spearman, not an approximation.
  Seeded resampling (mulberry32).
- Self-check it on synthetic input you build in a temp directory (a fake labels file and a fake judgments file with
  known answers, including a perfect arm, a random arm and a sign-flipped arm), and confirm M1, M2 and M3 come out as
  you derive by hand. Delete the synthetic files afterwards.

## Reply with

The path, the plain-reading choices, and the self-check results. Under 200 words.
