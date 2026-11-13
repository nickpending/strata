## The job

Write `corpus/experiments/item-size/score.ts`, the scorer for the item-size experiment, by adapting jev-statements'
scorer (`corpus/experiments/jev-statements/score.ts`, which you may read and copy) to this experiment's arms and
comparisons. Read `corpus/experiments/item-size/prereg.md` ("Arms", "Scoring", "Comparisons, decided now",
"Post-hoc rescore"), `corpus/experiments/jev-statements/contract.ts` (which re-exports gate-first-e2e's `combine`,
`WEIGH`, `itemKey`), and `corpus/experiments/item-size/rescore.ts`, whose output lines are your input. Never open
`readings.ts`, `arms/`, `ask.ts` or `briefs/` other than this one; you score lines, you don't read how they were
made. Open a labels or material file only to check its shape, except the development files named below.

## Input

`rescore.ts` writes lines in jev-statements' judgment format, without `requests`, one per (logged judgment, arm). Arm
names: `B`, `X1`, `X2`, `X3` (from B's logs) and `W`, `WX1`, `WX2`, `WX3` (from W's logs). For the post-hoc rescores
of older experiments other prefixes occur (`S`, `SX1`, ... from jev-state's arm S). Every line is a final
(`final: true`). Treat any arm name the file holds as a scored arm; the comparisons below print `skipped` when an arm
is absent.

## What changes from jev-statements' scorer

- **Scored arms.** Every arm in the input, linear, as its own row, plus each one squared as `<arm>-sq` (same
  judgments, sq scores), described. No W/variant rows, no W-final logic.
- **P1 to P3.** `r` is the same for B, X1, X2 and X3 (and for W and WX*), so print P1 to P3 once per statement set:
  for B (labelled "B, X1, X2, X3") and for W (labelled "W, WX1, WX2, WX3"), and for any other prefix the same way.
  Check that it is so: abort if any X arm's r or touches differs from its base arm's for the same case and rep.
- **Primary, k = 3:** `X1 vs B`, `X2 vs B`, `X3 vs B`, each linear, on **E3** by the paired scenario bootstrap:
  10,000 resamples, seed **20261112** restarted per comparison, interval 1 − 0.05/3 (98.33%). Verdict: wins when the
  lower bound > 0, loses when the upper bound < 0, ties otherwise.
- **Secondaries for each primary, described:** E4 (build, detract, mean) by the same bootstrap; E1 by exact two-sided
  McNemar.
- **Described, E3 only, same bootstrap and width:** `X2 vs X1`, `X3 vs X2`; `WX1 vs W`, `WX2 vs W`, `WX3 vs W`,
  `W vs B`; and each of `B`, `X1`, `X2`, `X3` squared against its own linear row.
- **Stage attribution:** jev-statements' swaps (none, gate oracle, direction oracle, gate and direction oracle, no
  touches) for B, X1, X2 and X3, linear, applied to each arm's own logged readings, plus labels only (lin and sq)
  once. No recovery shares. Own-gap closure per arm, as jev-statements computes it.
- **RECOMMENDATION lines,** per prereg "Comparisons" 6: no X wins → B's reading stays; otherwise the winner with the
  highest E3; name every X that loses. Nothing else decides.
- Keep E1 to E8, the ceiling (second labeller), the consensus subset, the header tables and the abort when a logged
  score differs from `combine` over its readings. The header comment lists every plain-reading choice: keep
  jev-statements' where they apply and say so; list what is new.

## Self-check

Build synthetic input in a temp directory with known answers: a perfect arm, a random arm and a sign-flipped arm
under names B, X1, X2, X3; at least 4 scenarios; importances where sq and lin rank differently. Confirm E1, E3 and the
verdicts come out as you derive by hand, and that the r/touches check aborts when an X line's r differs. Delete the
synthetic files.

## Development run

Then run it on jev-statements' held-out logs, already seen and reported, which the orchestrator rescored:
`bun corpus/experiments/item-size/score.ts --calls {DEV_CALLS} --material
corpus/experiments/jev-statements/heldout-material.json --labels corpus/experiments/jev-statements/heldout-labels.json
--labels2 corpus/experiments/jev-statements/heldout-labels2.json`. Confirm that B's E1 (55/70), E3 (0.671) and B-sq's
E3 (0.695), and W's E3 (0.665) and P1 (0.830) match jev-statements' report. Confirm X1's and X2's E1 and E3 by an
independent recomputation in a few lines of code from the input lines. Write the output to
`corpus/experiments/item-size/posthoc-jev-statements.score.md`.

## Reply with

Under 250 words: the path, the plain-reading choices that are new or changed, the self-check results, and the
development run's E3 for every linear arm with your recomputation of X1 and X2.
