# item-size: does a size the gate doesn't scale beat probability × level?

The commits came in this order, before anything that could bias them:
- **13179ae:** the rule, the arms in code (`readings.ts`), the readings check, `rescore.ts`, the runner and the
  briefs. This was before any label, and before any X arm was scored on any labelled data.
- **3022e31:** the scorer, written by the sonnet scorer, and the post-hoc rescores of three held-out sets that had
  already been seen. This was before any fresh label was read.
- **eba4b39:** the fresh material's and labels' hashes, before the Jev run on them.

The scorer's output is `heldout.score.md`. Raw judgments stay local under
`corpus/runs/item-size/2026-11-13T02-09-32-490Z-heldout/`. The material and labels delivered match the recorded
hashes. The second labels are `heldout-labels2.json`, sha256 `d21b03094393889e…`.

## Answer

**No. With Jev's real gate, no size reading that drops the probability beats design B's probability × level. All
three tie, and B's reading stays by the pre-registered rule.** The reason is the gate, not the size:
- **Once the gate and direction are right, B's own size reading is the weakest of the four arms.** With the labels'
  gate and direction swapped in, X1 reads E3 0.789, X2 0.764 and X3 0.817, against B's 0.644.
- **With the real gate, the probability acts as a soft gate.** It damps items Jev fires on wrongly. A hard gate at
  0.4 gives those false fires full size, and that cancels what a better size reading gains.

| arm | E1 direction | E2 pairs | **E3 pooled ρ** | E4 build / detract | E3 with true gate and direction |
|---|---|---|---|---|---|
| **B** P × level | 77/105 | 19/36 | **0.467** | 0.051 / 0.229 | 0.644 |
| **X1** fixed size | 75/105 | 15/36 | 0.453 | 0.192 / 0.212 | 0.789 |
| **X2** level once fired | 75/105 | 16/36 | 0.455 | 0.193 / 0.230 | 0.764 |
| **X3** stake level, deed fixed | 73/105 | 14/36 | 0.445 | 0.206 / 0.223 | **0.817** |
| second labeller | 87/105 | 20/36 | 0.822 | 0.570 / 0.772 | |

- **The rule.** Each comparison uses a 98.33% paired scenario bootstrap: k = 3, 84 scenarios, seed 20261112.
  - X1 − B = −0.014, interval [−0.127, 0.097]: a tie.
  - X2 − B = −0.013, interval [−0.108, 0.084]: a tie.
  - X3 − B = −0.022, interval [−0.123, 0.078]: a tie.
  - None wins and none loses, so **B's reading stays.**
- **Secondaries (described, never deciding).**
  - **Within build, every X arm ranks better than B:** +0.14, +0.14 and +0.16 in E4. X3's interval is [0.006,
    0.347]; X1's and X2's lower bounds sit at −0.000.
  - Within detract, the X arms equal B.
  - Direction accuracy is about the same. McNemar p is 0.80, 0.77 and 0.42, with B right alone on 9, 7 and 9 cases
    against 7, 5 and 5 for X1, X2 and X3.
- **Level against fixed size.** X2 − X1 = +0.001 [−0.054, 0.053], and X3 − X2 = −0.010 [−0.042, 0.021]. Once
  probability is out, Jev's level adds nothing at the case level here.
- **Consensus subset (102 cases).** E3 is B 0.507, X1 0.500, X2 0.500, X3 0.499. The order is unchanged.

## Why the gain doesn't reach the case (post hoc, decides nothing)

- **The X arms gain much more from a correct gate than B does.**
  - The gate oracle alone lifts B from 0.467 to 0.474 (own-gap closure 0.02). It lifts X1 from 0.453 to 0.545
    (0.25).
  - With both gate and direction true, the X arms close 84% to 99% of their gap to the second labeller. B closes
    50%.
  - B's probability already does part of the gate's job, so a true gate adds little to B, and a hard gate without it
    pays for every false fire.
- **The gate is the binding constraint on this material.**
  - P1 (gate AUC) is 0.684, against the second labeller's 0.870. On jev-statements' held-out it was 0.760.
  - On items the first labeller marks untouched, B's 0.4 threshold fires in 5,687 of 10,065 item-reps (57%).
  - Most of each arm's total |effect| sits on untouched items: 74% for B and 77% for X1.
- **jev-statements' attribution, 0.804 against 0.881, replicates here as a conditional fact:** 0.644 against 0.789
  to 0.817. It holds only when the gate is right. It was read as "about 0.08 sits in the per-item size". That
  overstated what a size change alone could recover, because the probability in B's product also carries the gate.

## On W's statements (described)

| | W | WX1 | WX2 | WX3 |
|---|---|---|---|---|
| E3 | 0.439 | 0.461 | 0.443 | 0.455 |
| against W | | +0.022 [−0.048, 0.093] | +0.004 [−0.055, 0.062] | +0.016 [−0.041, 0.076] |

- W's gate is better: P1 0.765 against B's 0.684. W's P1 gain over B replicates on fresh material, +0.08 here
  against +0.07 in jev-statements.
- With W's better gate, the X arms lean ahead of W rather than behind. That fits the mechanism, but every
  difference is a tie.
- W − B on E3 = −0.028 [−0.147, 0.083]. Again a better gate doesn't reach the case.

## Post-hoc rescores of seen held-out sets (decide nothing)

The same arms and scorer, on logs whose results were already reported (`posthoc-*.score.md`):

| set | B | X1 | X2 | X3 |
|---|---|---|---|---|
| jev-statements (80 cases) | 0.671 | 0.595 | 0.616 | 0.597 |
| jev-state (80) | 0.548 | 0.595 | 0.594 | 0.592 |
| gate-first-e2e (80) | 0.597 | 0.568 | 0.575 | 0.554 |
| **item-size, fresh (120)** | **0.467** | **0.453** | **0.455** | **0.445** |

Every X − B interval in all four sets includes 0, and the sign changes from set to set. Four sets agree that removing
the probability, with the gate as it is, doesn't move the case level.

## Squared (described)

- B-sq − B is −0.010 [−0.071, 0.039]. This is **the first held-out set where squared trails linear**, after leads of
  +0.09, +0.06, +0.065 and +0.024.
- The X arms gain from squared by +0.009 to +0.015, all ties.

## Material

- **The labellers.** A fresh blind opus labeller wrote 120 engine-built cases in 84 scenarios. They are three sets of
  40, all held out, with fresh identities for Rogue, Glitch and Mux and nine variants. A second blind opus labeller
  labelled all 120 at both levels.
- **Checks.** The labeller's validator passes the make-up, and `../jev-state/check-build.ts` passes. No scenario
  spans two sets.
- **The ceiling.** The second labeller's E3 is 0.822, against 0.943 in jev-statements, and its gate AUC is 0.870.
  The labellers agree on direction in 102 of 120 cases.
- **Harder material.** B's E3 is 0.467 here, against 0.55 to 0.67 on the earlier sets. The labels-only bound is
  0.812 here, against 0.881 in jev-statements. Both the arms and the labels' own internal consistency are lower on
  this material.
- **Value mix.** Security leads stake touches in every set (24, 23 and 28), as in jev-statements, and power is
  second.

## Cost

| run | judgments | USD |
|---|---|---|
| smoke, 1 dev case × B and W | 2 | 0.0005 |
| held-out, B and W, 120 × 5 reps | 1,200, 0 refused | 0.292 |
| X arms, squared, post-hoc rescores | 0 | 0 |
| **total** | | **0.292** |

The ceiling named before spending was 0.40 USD. Agent work: two opus labellers and one sonnet scorer.

## Deviations and limits

- **No coin split.** The brief asked for one. All 120 cases were held out, because the arms are frozen code that
  tunes nothing. The scorer was developed on jev-statements' already-seen held-out set instead. This is stated in
  the prereg (13179ae).
- **Power.** The intervals are about ±0.10 to ±0.11. A real difference of 0.03 to 0.05 can't show.
- **The touches multiplier is untested as a soft gate.** It stays a probability at the case level in every arm.
  "No touches" moves E3 by under 0.003 here.
- **One threshold.** X uses B's 0.4. A hard gate tuned for precision might change the picture. That would be a
  threshold chosen on labels, which `docs/jev.md` "Thresholds" says needs its own pre-registered test.

## What this means for design B

1. **Keep probability × level, by the rule.** It breaks the spirit of `docs/jev.md` rule 6, but with today's gate it
   does real work: the probability is the only thing that damps false fires.
2. **Fix the gate before the size.** A size reading that drops the probability is worth 0.12 to 0.17 E3, but only
   behind a correct gate. On this material B's gate AUC is 0.68, against the labeller's 0.87. W's statements lift
   it to 0.77. The case-level ceiling of any size change is set by how many false fires reach the combine.
3. **Rule 6 can be met without losing the soft gate.** Make the gate's job explicit. That means a separate,
   pre-registered gate stage whose threshold comes from blind labels, followed by a size that doesn't scale with
   probability (X3 read best behind a true gate). Each stage is then testable on its own. That is a design change
   for shaping, not something this run decides.
