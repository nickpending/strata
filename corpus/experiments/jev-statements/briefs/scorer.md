## The job

Write `corpus/experiments/jev-statements/score.ts`, the scorer for the jev-statements experiment, by adapting
jev-state's scorer (`corpus/experiments/jev-state/score.ts`, which you may read and copy) to this experiment's arms
and comparisons. Read `corpus/experiments/jev-statements/prereg.md` ("Scoring", "Stage attribution", "Comparisons,
decided now"), `corpus/experiments/jev-statements/contract.ts` (which re-exports gate-first-e2e's `combine`, `WEIGH`,
`itemKey`), and the judgment line format written by `corpus/experiments/jev-statements/run.ts` (its
`appendFileSync` call; the same format as jev-state's). Never open `arms/`, `ask.ts`, `corpus/runs/` (except a
judgments file the orchestrator names) or `briefs/` other than this one. Open a labels or material file only to check
its shape.

What changes from jev-state's scorer:
- **Scored arms.**
  - Finals: `B` (arm B final, lin), `B-sq` (B's judgments, sq), `W` (arm W final, lin), `W-sq` (W's final's
    judgments, sq).
  - Secondary: every non-final W variant as `W/<variant>` (lin) and `W/<variant> sq`.
  - There is no S, F or K.
  - The scorer must also work on a file holding only some arms, such as B alone or B plus several W variants. The
    W author uses it that way during tuning, so a dev file's W variants all print as rows.
- **Stage attribution:** the same swaps, for B and W (lin), with labels only in lin and sq. Recovery shares for W
  against B and for B-sq against B, with the ceiling as L2's E3 and as B's gate-and-direction-oracle E3. Own-gap
  closure for B and W as jev-state computes it.
- **Comparisons.**
  - Primary, k = 2: `W vs B` and `B-sq vs B`. Each has its **E3** difference by the paired scenario bootstrap
    (10,000 resamples, seed **20261114**, interval 97.5%), with the verdict wins, loses or ties.
  - `W vs B` also has the **P1** difference on the same resamples, with its own verdict. `B-sq vs B` has no P1 row,
    because the readings are the same; print that.
  - Described, never deciding, for `W vs B`:
    - P2 two ways by the same bootstrap: direction among fired (touched items whose mean |r| ≥ 0.5, sign right),
      and direction over all touched items (a 0 counting wrong);
    - **per value, for `security` and `benevolence`:** P1 and direction among fired, each with its bootstrap
      difference and interval.
  - Described for both primaries: E1 and E2 by exact McNemar, and E4 by the bootstrap.
  - Described, E3 only: `W-sq vs B`, `W-sq vs W`, `W-sq vs B-sq`.
- **Per-value table (P3).** One row per value: touched n, P1 for B, W and L2, and direction among fired for B, W and
  L2. Then the same split by channel (stake and deed) for every value.
- **RECOMMENDATION lines,** per prereg "Comparisons" 5:
  - Statements: W replaces B's if W wins on E3; otherwise B's stay. Name W if it wins on P1 but not on E3.
  - Weighting: squared replaces linear if B-sq wins on E3; otherwise linear stays.
  - If both win, recommend W-sq.
- The header comment lists every plain-reading choice. Keep jev-state's choices where they still apply, and say so.

Everything else in jev-state's scorer stays as it is: E1 to E8, P1 to P3, the ceiling, the consensus subset, and the
checks, including the abort when a logged score differs from `combine` over the logged readings.

## Self-check

Build synthetic input in a temp directory, with known answers:
- a perfect arm, a random arm and a sign-flipped arm;
- arms named B and W, plus a non-final W variant;
- a case set with at least 4 scenarios, and importances where sq and lin rank differently.

Confirm that E1, E3, P1 and P2 come out as you derive by hand, that B-sq's E3 comes from the sq scores, and that the
verdict logic picks the right arm. Delete the synthetic files afterwards. Then run it on the dev judgments file the
orchestrator names (B only, 2 reps) as a smoke test, and confirm B's and B-sq's E1 and E3 by an independent
recomputation in a few lines of code.

## Reply with

Under 250 words: the path, the plain-reading choices that are new or changed, the self-check results, and the dev
smoke-test E1 and E3 (B and B-sq) with their recomputation.
