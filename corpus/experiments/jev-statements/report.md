# jev-statements: do rewritten statements, or squared weighting, recover design B's loss?

The commits came in this order, before anything that could bias them:
- **5d7ea47:** the rule, the shared ask (`ask.ts`) and its check, `check-arms.ts`, the runner, B and the briefs,
  before any label existed.
- **2fa4a9e:** the labels, the coin split (A is dev), the held-out hashes and B's dev run, before any challenger
  arm.
- **9151f97:** the scorer, written by the sonnet scorer before any challenger arm.
- **5b67160:** arms B and W frozen (final `w4`, contender `w1`), with the dev results and the second labeller's hash,
  before any held-out run.

The scorer's output is `heldout-final.score.md` (finals) and `heldout-secondary.score.md` (finals plus `w1`). The
orchestrator recomputed E1, E3 and P1 for B, B-sq, W and W-sq from the raw logs, and they match: E3 0.671, 0.695,
0.665 and 0.683, and P1 0.760 and 0.829 against the scorer's 0.830. Raw judgments stay local under
`corpus/runs/jev-statements/`. The held-out files' sha256 matched the recorded ones before the run.

## Answer

**No, on both counts. The rewritten statements improve the per-value gate significantly, but the gain doesn't reach
the case. Squared weighting leads linear for a fourth time, by less, and ties. B's statements and linear weights
stay, by the pre-registered rule.**

| | E1 direction | E2 pairs | E3 pooled ρ | E4 build / detract | P1 gate AUC | P2 among fired | over all touched | USD / judgment |
|---|---|---|---|---|---|---|---|---|
| B | 55/70 | 13/24 | 0.671 | 0.242 / 0.787 | 0.760 | 94/102 | 193/237 | 2.4e-4 |
| B-sq | 57/70 | 13/24 | 0.695 | 0.292 / 0.766 | (B's) | (B's) | (B's) | 2.4e-4 |
| **W** `w4` | 53/70 | 11/24 | 0.665 | 0.219 / 0.759 | **0.830** | 95/99 | 199/237 | 2.3e-4 |
| W-sq | 54/70 | 12/24 | 0.683 | 0.224 / 0.742 | (W's) | (W's) | (W's) | 2.3e-4 |
| second labeller | 63/70 | 18/24 | 0.943 | 0.765 / 0.831 | 0.870 | 189/189 | | |

- **W against B, E3:** the difference is −0.006, interval [−0.090, 0.060]. That is a **tie**.
- **W against B, P1:** the difference is +0.069, interval [0.015, 0.123]. **W wins.** The rewrite closes 63% of B's
  gate gap to the second labeller (0.760 to 0.830, against 0.870).
- **B-sq against B, E3:** the difference is +0.024, interval [−0.045, 0.083]. That is a **tie**.
- **Recommendation (scorer, by the rule):** B's statements stay. W is a per-value gain that doesn't reach the case.
  Linear stays.
- **Described only:**
  - E1: W is right on 1 case where B is wrong, and B on 3 where W is wrong (McNemar p 0.63). B-sq against B is 3 to
    1 (p 0.63).
  - P2: direction among fired differs by +0.038 [−0.045, 0.126], and direction over all touched by +0.025
    [−0.020, 0.069].
  - W-sq against W: +0.019 [−0.010, 0.052]. W-sq against B: +0.012. W-sq against B-sq: −0.012. All ties.
  - The contender `w1`, the first wording, written before any W answer was read: E3 0.638, and 0.672 squared.
- **Consensus subset (73 cases).** E3: B 0.680, W 0.682, B-sq 0.709, W-sq 0.699. The order is unchanged.
- **Dev went the other way, again.** On dev, `w4` read E3 0.781 against B's 0.661, and P1 0.893 against 0.750. The
  P1 gain held on held-out at about half its size. The E3 gain didn't. Six variants were tried on 40 dev cases, so
  dev E3 carries selection noise. The untuned `w1` is the lower bound on dev fitting, and it reads below `w4` on
  held-out too.

## Per value (secondary primaries; both channels pooled)

| value | touched n | B P1 | W P1 | L2 P1 | B among fired | W among fired |
|---|---|---|---|---|---|---|
| **security** | 71 | 0.806 | 0.728 | 0.758 | 24/32 | 25/29 |
| **benevolence** | 39 | 0.620 | 0.788 | 0.869 | 12/12 | 13/13 |
| stimulation | 36 | 0.819 | 0.854 | 0.833 | 20/20 | 16/16 |
| power | 20 | 0.863 | 0.826 | 0.946 | 7/7 | 9/9 |
| conformity | 16 | 0.568 | 0.709 | 0.760 | 4/4 | 6/6 |
| hedonism | 15 | 0.574 | 0.915 | 0.920 | 4/4 | 5/5 |
| achievement | 12 | 0.731 | 0.749 | 0.761 | 3/3 | 2/2 |
| self_direction | 11 | 0.720 | 0.773 | 0.983 | 7/7 | 7/7 |
| universalism | 11 | 0.826 | 0.919 | 0.993 | 7/7 | 7/7 |
| tradition | 6 | 0.996 | 1.000 | 1.000 | 6/6 | 5/5 |

- **Benevolence moves most among the large values.** Its P1 goes from 0.620 to 0.788, a difference of +0.168
  [−0.019, 0.342]. That is a lead, not significant at 97.5%. Stake goes from 0.546 to 0.857, and deed from 0.667 to
  0.792.
- **Security goes down at the gate and up in direction.**
  - P1 goes from 0.806 to 0.728, a difference of −0.078 [−0.177, 0.012], almost all on stake (0.866 to 0.794).
  - Direction among fired goes from 24/32 to 25/29, +0.112 [−0.094, 0.421].
  - On stake, B fires 22 touched security items and gets 8 of them backwards. W fires 18 and gets 2 backwards.
  - W's "Count only danger that {o}'s act adds" stops the down statement firing on a danger that was already there.
    The cost is that it fires on fewer touched items.
- **The premise about security didn't replicate on this material.** In jev-state, B's security gate read 0.62. Here
  it reads 0.806, above the second labeller's 0.758. Security is 30% of the touched items here (71 of 237), and B's
  loss on it is direction (8 of 22 fired stake items backwards), not the gate.
- **Hedonism, conformity and universalism gain the most** (+0.34, +0.14, +0.09), on 11 to 16 items each.

## Why a better gate still doesn't reach the case (post hoc, decides nothing)

- **The gate isn't where the case-level loss is, on this material.** B's gate oracle lifts E3 from 0.671 to only
  0.675, and W's from 0.665 to 0.667. That closes 1% of each arm's gap to the second labeller. gate-first-e2e found
  the same: B's false fires are low in amplitude and the weighted mean dilutes them. So a gain at the gate has
  little at the case level to recover.
- **Direction on touched items closes about a third.** The direction oracle lifts B to 0.755 and W to 0.769, which
  closes 31% and 38% of each one's gap. W gets 5 more touched items right among the values the holder rates 3 or 4
  (104/119 against 99/119). On 80 cases that is not enough to move E3.
- **About 0.08 sits in the per-item size.** Swapping both gate and direction for the labels, while keeping Jev's own
  |effect| (P × strength level) and touches, reaches 0.804 for B and 0.796 for W. The labels with a fixed size reach
  0.881 linear and 0.911 squared. Touches alone moves E3 by under 0.01, so most of that 0.08 is the per-item
  magnitude: the noul's probability times the strength level. This run is the first to put a figure on it.
- **W's gain is spread across importance bands** (P1, B to W): 0.772 to 0.823 on values rated 3 or 4, 0.721 to
  0.762 on values rated 1 or 2, and 0.777 to 0.888 on values rated 0. The weighting gives the 0 band nothing, so part
  of the gain is spent on values that don't count.

## Squared weighting, four held-out runs

| run | B-sq − B on E3 | pre-registered |
|---|---|---|
| v4 (gate-direction step 1 rescore) | +0.09 | no |
| gate-first-e2e | +0.06 | no |
| jev-state | +0.065 | no |
| **jev-statements** | **+0.024, [−0.045, 0.083]** | **yes: tie** |

- Squared has never been below linear on held-out, but the one pre-registered test is a tie, with the smallest lead.
- It also helps the labels-only bound, from 0.881 to 0.911, so squared is a better combine for true per-value
  labels too.
- On W's answers it gains +0.019. On dev it gained +0.044 for B and +0.078 for W.
- **Power for a gain of 0.03.** The interval's half-width here is about 0.064. Detecting 0.03 with 80% power at
  97.5% needs it near 0.022, so about 8 times these 56 scenarios, if the width scales as one over the square root of
  n. Pooling the four runs' paired differences is not a pre-registered test, and three of them were chosen after
  seeing held-out.

## Material

- **The two labellers.** A blind opus labeller wrote 120 engine-built cases on the real world: Rogue, Glitch and
  Mux, with fresh identities and three variants each.
  - Held out: 80 cases in 56 scenarios, with 237 touched items out of 1,600.
  - A second blind opus labeller relabelled all 80 held-out cases at both levels.
- **Ceiling.** Case level: pooled ρ 0.943, direction 63 of 70. Per value: gate AUC 0.870. The second labeller marks
  many more items touched: stake 112 and deed 156 of 800 each.
- **Value mix.** Security takes about 45% of stake touches in every set, against about a third in jev-state.
  Conformity and universalism have no stake touches on held-out.

## Cost

| run | judgments | USD |
|---|---|---|
| B dev | 80 | 0.020 |
| W author's dev tuning (6 variants) | 880 | 0.207 |
| held-out finals, B and W × 5 reps | 800 | 0.190 |
| held-out contender `w1` × 3 reps | 240 | 0.058 |
| **total** | 0 refused | **0.475** |

- The ceiling named before spending was 0.86 USD, and the brief's line was 3 USD.
- W costs slightly less than B per judgment (48.4 questions against 55.0), because fewer of its nouls cross 0.4 and
  ask a strength score.
- Agent work: two opus labellers, one opus author and one sonnet scorer.

## Limits

- **Power.** 80 cases in 56 scenarios. The E3 intervals are about ±0.06 to ±0.08, so a real gain of 0.02 to 0.03
  (squared's size here) can't show.
- **One author, and dev-selected.** Six variants on 40 dev cases. The dev E3 lead (+0.12) didn't hold. P1 was the
  pre-registered selection metric, and its held-out gain holds at about half the dev size.
- **Shared identities.** The author saw the three identities, which held-out shares. Two `w4` statements list
  "rent", which two identities contain (it is also in jev-state's independently written identities). A statement
  that lists a kind of thing the held-out identities mention may help held-out a little. It didn't produce a
  case-level gain to explain away.
- **Security dominates the material**, and its result is the opposite of the premise. B's security gate was strong
  on this set.
- **W kept B's reading.** It kept B's soft P(up) − P(down) and B's size step on purpose. The per-item magnitude, now
  the visible residual, was held fixed.

## What this means for design B

1. **Keep B's statements and linear weights, by the rule.** W's statements are a measured per-value improvement
   (P1 +0.07, significant), with no case-level effect. If the per-value readings are used anywhere outside the
   combine (speech, the standing summary), W's wording is the better reading of them.
2. **The case-level loss is no longer in the gate, on this material.** A gate oracle closes about 1% of the gap.
   What is left is direction on touched items (about a third of the gap) and the per-item size (P × strength level,
   about 0.08 E3).
3. **The next test with signal is the per-item magnitude.** Read a touched item at a fixed size instead of P ×
   level. The labels-only bound and this run's attribution both point there. It needs no new Jev call: it can be
   pre-registered as a rescore of logged answers on fresh labels, as squared should have been.
4. **Squared stays unproven.** It has led four times out of four, and the one pre-registered test is a tie. Adopt it
   only if a later run is powered for a gain of 0.03, or if the design wants it for the labels-only reason above:
   true per-value labels read 0.03 better squared.
