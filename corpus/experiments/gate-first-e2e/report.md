# gate-first-e2e: does a better per-value gate recover design B's case-level loss?

The commits came in this order, before anything that could bias them:
- **ed51ebb:** the rule, the runner, the B port and its check, and the briefs, before any label existed.
- **6f47b5f:** the labels, the coin split (B is dev), the scorer and the held-out hashes, before any challenger arm.
- **6ca98ab:** arms B and G frozen, with G's dev result and the second labeller's hash, before any held-out run.

The scorer's output is `heldout-final.score.md` (finals) and `heldout-secondary.score.md` (finals plus contenders).
Its E1 and E3 for all four final rows match an independent recomputation from the raw logs. Raw judgments stay local
under `corpus/runs/gate-first-e2e/`.

## Answer

**The gate-first stage fixes the per-value gate on fresh labels, but it recovers little of design B's case-level loss.
By the pre-registered rule it ties B. Importance squared also ties.**

- **The gate fix replicates.** Gate AUC (P1) rises from 0.71 to 0.83, against a labeller ceiling of 0.87. Stake
  rises from 0.66 to 0.81, and deed from 0.75 to 0.85.
- **Case-level ρ moves only a little.** Pooled ρ (E3) goes from 0.597 to 0.633, a difference of +0.037. Its 97.5%
  interval is [−0.074, 0.160], so G **ties**.
  - That is 14% of the gap to the second labeller (0.859).
  - It is 20% of the gap to B's own gate-and-direction oracle (0.783).
- **G leads B on every case metric** except within-build ρ. None of these leads is significant:

  | | E1 direction | E2 pairs | E3 pooled ρ | E4 build / detract | three-way |
  |---|---|---|---|---|---|
  | B-lin | 47/70 | 8/24 | 0.597 | 0.568 / 0.412 | 49/80 |
  | **G** `m3-45` | 51/70 | 11/24 | 0.633 | 0.465 / 0.621 | 53/80 |
  | G-sq | 50/70 | 10/24 | 0.652 | 0.451 / 0.600 | 56/80 |
  | second labeller | 58/70 | 15/24 | 0.859 | 0.691 / 0.840 | 68/80 |

  - On E1, G is right on 8 cases where B is wrong, and B on 4 where G is wrong (McNemar p 0.39).
  - On E2, G holds 6 pairs B drops, and B holds 3 that G drops (p 0.51).
  - The E4 difference is +0.05, interval [−0.10, 0.21].
- **Squared:** G-sq − G = +0.019 on E3, interval [−0.028, 0.062]: a **tie**.
- **Dev went the other way.** On dev, G read 0.447 against B's 0.515, and the author found no gate or threshold above B
  there (freeze addendum). Across the two splits the gate-first stage shows no reliable case-level gain.
- **Recommendation, by the rule:** keep B's per-value stage, and keep linear weights.

## Why a better gate buys so little (post hoc, decides nothing)

- **B's false fires were already mostly harmless at case level.** Zeroing every item the labels call untouched (the
  gate oracle) lifts B only from 0.597 to 0.638. B's noise on untouched items is low-amplitude, and the weighted mean
  dilutes it.
- **The loss is in gate and direction together, on the touched items.** Giving B both the true gate and the true
  direction lifts it to 0.783, far more than either alone (0.638 and 0.669). B's soft up-and-down readings on touched
  items are often weak or cancel. They become useful only once the noise around them is also gone.
- **G trades one error for another.** On the 233 touched items:

  | | right sign | wrong sign | read as 0 (gate miss) |
  |---|---|---|---|
  | B-lin | 203 | 29 | 1 |
  | G | 175 | 23 | 35 |

  - G's hard gate removes B's diffuse noise and makes 6 fewer sign errors.
  - It also drops 35 touched items to exactly 0. Most of what G gains at the gate it gives back as misses.
  - G's own gate-and-direction oracle reaches 0.760, close to B's 0.783. So at this case scale the two stages carry
    about the same recoverable loss.
- **The combine is not the bottleneck.** Exact per-value labels, at a fixed size, through the same linear combine
  ("labels only") reach E3 0.822 and E1 65/70. That is near the labeller ceiling.
  - Within direction, labels-only reads only 0.20. Magnitude within a direction comes from the size step and
    importance, not from which values moved. So E4 says nothing about the gate.
- **Contenders.** These come after seeing held-out, so they decide nothing.
  - `g3-40` (the touched gate at 0.40, which loses fewer touched items to zero) reads E3 0.664. Its squared form reads
    0.695, the highest of any row, with E1 53/70.
  - B-sq, v4's own `sq` contender, reads 0.659 against B-lin's 0.597. Squared weighting has now led linear on B's
    held-out twice: v4's (+0.09, step 1's rescore) and this run's (+0.06). On G's final it gains only +0.02.

## Per value (P3; both channels pooled)

| value | touched n | B-lin P1 | G P1 | ceiling P1 | B dir among fired | G dir among fired |
|---|---|---|---|---|---|---|
| **conformity** | 23 | 0.667 | 0.644 | 0.898 | 8/8 | 11/15 |
| **benevolence** | 38 | 0.737 | 0.856 | 0.912 | 13/15 | 28/31 |
| power | 50 | 0.684 | 0.625 | 0.679 | 16/16 | 24/26 |
| security | 61 | 0.700 | 0.865 | 0.871 | 21/21 | 48/56 |
| self_direction | 13 | 0.791 | 0.844 | 0.897 | 6/6 | 10/10 |
| universalism | 16 | 0.836 | 0.833 | 0.969 | 8/8 | 13/13 |
| stimulation, hedonism, achievement, tradition | 5 to 10 each | 0.65 to 0.88 | 0.64 to 0.99 | 0.71 to 0.99 | all right | all right |

- **Benevolence:** the gate fix works here. G lifts its gate from 0.74 to 0.86, near the ceiling of 0.91, and fires
  clearly on twice as many touched items.
- **Conformity** stays the weakest value in both arms (0.67 and 0.64, against a ceiling of 0.90). G also reads its
  direction worst there: 11 right of 15 fired.
- **Power** is hard for the labellers too: their ceiling AUC is 0.68, and the second labeller agrees on direction for
  only 44% of power items. G's power direction is the largest share of its direction loss (29 of 50 touched read
  right).

## Material

- **The two labellers.** A blind opus labeller wrote 120 engine-built cases on the real world: Rogue, Glitch and Mux,
  each with the world's own importance table (`-w`) and two written variants.
  - The 120 cases fall in 84 scenarios across sets A, B and C, each set holding 12 opposite pairs, 5 conflict, 5
    neutral and 3 size pairs.
  - Case labels have a 1 to 5 magnitude, with each magnitude used in each direction. Per-value stake and deed labels
    cover every value.
  - Held out are 80 cases in 56 scenarios: 36 build, 34 detract and 10 neutral, with 233 touched items out of 1,600.
  - A second blind opus labeller relabelled all 80 held-out cases at both levels.
- **Ceiling.**
  - **Case level:** the second labeller's pooled ρ against the first is 0.86, and 0.69 and 0.84 within direction.
    They agree on direction for 68 of 80 cases.
  - **Per value:** gate AUC 0.87. Direction among items both labellers mark is right on 99%.
- **Consensus subset (68 cases).**

  | | B-lin | G | G-sq | B-sq |
  |---|---|---|---|---|
  | E3 | 0.692 | 0.716 | 0.722 | 0.755 |
  | E1 | 43/58 | 47/58 | 46/58 | 47/58 |

  The order is unchanged.

## Cost

| run | judgments | USD |
|---|---|---|
| B dev | 80 | 0.020 |
| author dev tuning | as logged | 0.195 |
| held-out finals, B and G × 5 reps | 800 | 0.214 |
| held-out contenders, 3 × 3 reps | 720 | 0.229 |
| **total** | 0 refused | **0.658** |

- **Against the ceilings:** the ceiling named before spending was 1.27 USD, and the brief's line was 3 USD.
- **Per judgment:**
  - B costs 2.6e-4 USD, 57 questions in 2 requests, 362 ms median.
  - G costs 2.8e-4 USD, 36 questions in 4 requests, 525 ms median.
- **Agent work:** two opus labellers, one opus author and one sonnet scorer.

## Limits

- **Power.** The intervals are wide: 80 cases in 56 scenarios, ±0.11 on E3. A real gain of 0.04 to 0.06 can't show
  here. Dev and held-out disagree in sign.
- **Rep noise grows with a hard gate.** G's largest spread across reps is 0.69, against B's 0.40, because an item near
  the 0.45 threshold flips in or out.
- **Opposite pairs share their per-value answers.** The two cases of a pair share one event, so Jev answers them alike
  and only importance splits them. Both arms hold under half (8 and 11 of 24). Labels-only holds most of them, since
  the true per-value labels with the variants' importances split them right.
- **One hand wrote the material.** Security and power carry most stake touches in every set. Stake benevolence has
  1 to 5 touches per set, and stimulation, hedonism, achievement and tradition are thin everywhere.
- **G's wording was not retuned.** The prereg fixed it to gate-direction's B, so the direction choice's power and
  conformity misses are that wording's.

## What this means for design B

1. **Keep B's per-value stage for now.** Gate-first wins at its own stage (gate AUC 0.71 to 0.83) and doesn't
   measurably win end to end.
2. **The recoverable loss is still in the per-value stage, not the combine.** True per-value labels through the same
   combine reach 0.82, against 0.60 to 0.63 from Jev. What is needed is gate and direction right together on the
   touched items. A hard gate alone loses those items as misses.
3. **The untested candidates,** all post hoc:
   - a softer, two-sided gate that misses fewer touched items (`g3-40` read 0.66 to 0.70 here);
   - squared weighting, which has now led linear on B's held-out twice without ever winning a pre-registered test.
   - Either needs its own fresh-label run with a pre-registered comparison to count.
