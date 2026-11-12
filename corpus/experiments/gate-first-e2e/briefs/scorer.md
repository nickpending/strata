## The job

Write `corpus/experiments/gate-first-e2e/score.ts`, the scorer for the gate-first-e2e experiment, from its
specification alone. Read `corpus/experiments/gate-first-e2e/prereg.md` ("Scoring", "Stage attribution, decided now"
and "Comparisons, decided now") and `corpus/experiments/gate-first-e2e/contract.ts` (`combine`, `WEIGH`, `itemKey`),
and the judgment line format written by `corpus/experiments/gate-first-e2e/run.ts` (its `appendFileSync` call). Never
open `arms/` or `corpus/runs/`. Open a labels or material file only to check its shape against this brief.

Inputs:
- Judgments (`judgments.jsonl`, one or more files): one line per judgment with `case`, `scenario`, `arm`, `variant`,
  `final`, `rep`, `ok`, `readings` (per item key `{ r, effect }`), `touches`, `scores` (`{ lin, sq }`), `calls`,
  `questionCount`, `costUsd`, `ms`, `requests`.
- Material (`material.json`): build.ts's `Material`; you need each case's scenario and holder `variant`, and each
  variant's `importance`, to recompute scores under the attribution swaps with the contract's `combine` (import it;
  don't re-implement it).
- Labels (`labels.json`): `{ "cases": [ { "id", "set", "direction": "build" | "detract" | "neutral", "magnitude": 0
  to 5, "kind", "pair", "size_pair", "character", "exposure", "stake": { <value>: "up" | "down" | "none" }, "deed": {
  ... }, "rationale" } ] }`. Signed case label = +magnitude for build, −magnitude for detract, 0 for neutral. Item key
  `<channel>__<value>`, item label +1 / −1 / 0.
- Second labeller (`labels2.json`): `{ "cases": [ { "id", "direction", "magnitude", "stake", "deed" } ] }`.

Scored arms: the prereg names them. A scored arm is (arm module, variant, weighting): `B-lin` is arm `B`'s final with
`lin`, `B-sq` the same judgments with `sq`, `G` arm `G`'s final with `lin`, `G-sq` the same judgments with `sq`, `C`
arm `C`'s final with `lin` if present. Every non-final variant in the input is scored as `<arm>/<variant>` with `lin`
(and `sq`), secondary. Read the scores from the logged `scores` and check they equal `combine` over the logged
readings and touches with the material's importance (fail loudly if not).

## Requirements

- usage: `bun score.ts --calls a.jsonl[,b.jsonl] --material material.json --labels labels.json [--labels2
  labels2.json] [--seed 20261112] [--resamples 10000]`; Markdown to stdout.
- A header: judgments and refusals per (arm, variant), reps, cases, scenarios, items, case labels per direction and
  magnitude, touched items per channel and direction.
- Every metric of "Scoring" (E1 to E8, P1 to P3, the ceiling, the consensus subset), per scored arm, finals first.
  P3 per value for every value (n shown), conformity and benevolence always.
- Every swap of "Stage attribution", for each final arm (B, G, and C if present): E1, E3, E4 under each, and the
  labels-only rows; then the recovery shares the prereg names.
- The comparisons of "Comparisons, decided now", printing each one's E3 difference, interval and verdict, the
  descriptive E1/E2 McNemar and E4 bootstrap numbers, and a final RECOMMENDATION line.
- A short comment block at the top listing every choice you made where the spec is silent (plain reading). Spearman
  with average ranks for ties; exact Spearman, not an approximation; Spearman over fewer than 3 distinct values is
  reported as n/a. Seeded resampling (mulberry32). The bootstrap resamples scenarios; a pair of cases always shares a
  scenario.
- Self-check it on synthetic input you build in a temp directory (fake material, labels and judgments with known
  answers, including a perfect arm, a random arm and a sign-flipped arm), and confirm E1, E3, P1 and P2 come out as
  you derive by hand. Delete the synthetic files afterwards.
- Run it once on the real dev split as a smoke test when the orchestrator gives you a dev judgments file; it may have
  only arm B.

## Reply with

The path, the plain-reading choices, and the self-check results. Under 250 words.
