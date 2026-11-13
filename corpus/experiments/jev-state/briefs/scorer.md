## The job

Write `corpus/experiments/jev-state/score.ts`, the scorer for the jev-state experiment, by adapting gate-first-e2e's
scorer (`corpus/experiments/gate-first-e2e/score.ts`, which you may read and copy) to this experiment's arms and
comparisons. Read `corpus/experiments/jev-state/prereg.md` ("Scoring", "Stage attribution", "Comparisons, decided
now"), `corpus/experiments/jev-state/contract.ts` (which re-exports gate-first-e2e's `combine`, `WEIGH`, `itemKey`),
and the judgment line format written by `corpus/experiments/jev-state/run.ts` (its `appendFileSync` call; the same
format as gate-first-e2e's). Never open `arms/`, `corpus/runs/` (except a judgments file the orchestrator names) or
`briefs/` other than this one. Open a labels or material file only to check its shape.

What changes from gate-first-e2e's scorer:
- **Scored arms.**
  - Finals: `B` (arm B final, lin), `S` (arm S final, lin), `F` (arm F final, lin), and `K` (arm K final, lin)
    when present.
  - Secondary: `B-sq` (B's judgments, sq), and every non-final variant as `<arm>/<variant>` (lin), and
    `<arm>/<variant> sq`.
  - There is no `G`, `G-sq` or `C`.
  - The scorer must also work on a dev file holding only some arms, such as B plus one challenger's variants.
    Authors use it that way during tuning.
- **Stage attribution:** the same swaps, for every final arm present. Recovery shares are computed for each
  challenger final against B. Also, for each final arm, the share of its own gap to the second labeller that its gate
  oracle, its direction oracle and both close: (E3_oracle − E3_arm) / (E3_ceiling − E3_arm).
- **Comparisons:**
  - The primary comparisons are `S vs B`, `F vs B` and `K vs B`, the last only when K is present. k is the number
    present.
  - For each: the **E3** difference with its paired scenario bootstrap (10,000 resamples, seed **20261113**,
    interval 1 − 0.05/k, verdict wins, loses or ties), and the **P1** difference on the same resamples with its own
    verdict.
  - Described: E1 and E2 McNemar, the E4 and P2 bootstrap (P2 here is direction over all touched items, a 0 counting
    wrong).
  - Described too, never deciding: `K vs S` and `F vs S`, by the same bootstrap.
- **RECOMMENDATION line** per prereg "Comparisons" 5:
  - If no challenger wins on E3, B's state stays.
  - If one wins, it replaces B's state.
  - If several win, the highest E3 is recommended; within 0.02, the lower mean USD per judgment.
  - Also name any challenger that wins on P1 but not on E3.
- The header comment lists every plain-reading choice. Keep gate-first-e2e's choices where they still apply, and say
  so.

Everything else in gate-first-e2e's scorer stays as it is: E1 to E8, P1 to P3, the ceiling, the consensus subset, and
the checks.

## Self-check

Build synthetic input in a temp directory, with known answers:
- a perfect arm;
- a random arm;
- a sign-flipped arm;
- arms named B, S and F;
- a case set with at least 4 scenarios.

Confirm that E1, E3, P1 and P2 come out as you derive by hand, and that the verdict logic picks the right arm. Delete
the synthetic files afterwards. Then run it on the dev judgments file the orchestrator names (B only, 2 reps) as a
smoke test, and confirm its E1 and E3 by an independent recomputation in a few lines of code.

## Reply with

Under 250 words: the path, the plain-reading choices that are new or changed, the self-check results, and the dev
smoke-test E1 and E3 with their recomputation.
