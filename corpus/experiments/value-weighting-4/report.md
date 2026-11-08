# value-weighting-4: does a congruence channel close O2's character gap?

Experiment material, not strata's design: Schwartz's ten values and the 0 to 4 importance scale exist only for this
test. The rule was fixed in `prereg.md` before any label existed. The material, coin split, scorer and runner were
committed in e0ae605 before any arm existed. B was frozen in d585958 before the C author began, and both arms in
4aecfdf before any held-out run. The scorer's output is committed as `heldout-final.score.md` and
`heldout-secondary.score.md`. Raw judgments stay local under `corpus/runs/value-weighting-4/`.

## Answer

**Congruence did not move the needle.** By the pre-registered rule, C and B tie on accuracy (step 5), so B is
recommended because it asks fewer questions. On the cases congruence was built for, C's final got 19 of 26 held-out
character cases right, and B got 20.

## The arms

- **B `lin`: v3's O2 with the fixes.** v3's `d4` questions, unchanged: 41 nouls for stake and deed, up and down per
  value, plus touches. A chained strength score follows. Code weights each value linearly by importance and
  multiplies by P(touches).
  - **The neutral-gate fix is not in it.** No touches threshold lifted on dev or on v3's 88 logged cases. Neutrals'
    touches read 0.13 to 0.58, and real character cases read as low as 0.17, so a threshold that zeroes the neutrals
    also zeroes character cases.
- **C `put-rt`: B plus congruence.** B's final, plus one parallel request on `you`, `earlier` and `now`:
  - per value, "In what {o} did, did they put X first?" and its mirror, "...set X aside for something else?";
  - a gate noul, "Does what {o} did tell you something about what kind of person {o} is?".
  - Code: B + [P(reveal) ≥ 0.7] × (1 − P(touches)) × Σ imp·(P(up) − P(down)) / Σ imp.
  - Your starting wording, "show that they care about <description>", is the contender `care-rt`. It was the weakest
    on dev.
- **No C2.** Neither top-importance-only nor squared congruence lifted on dev.

## Held-out results (72 cases, 24 pairs, 5 reps, finals)

| metric | B `lin` | C `put-rt` |
|---|---|---|
| M1 direction | **49/64** | 48/64 |
| M1 per rep | 49, 48, 47, 48, 49 | 47, 49, 48, 48, 48 |
| M3 opposite pairs | 14/24 | 14/24 |
| M4 conflict | 4/8 | 4/8 |
| M5 three-way | 44/72 | **48/72** |
| neutrals read neutral | 5/8 | 5/8 |
| false neutrals | 15/64 | **10/64** |
| M2 ρ: all / within build / within detract | 0.55 / 0.32 / 0.17 | 0.56 / 0.25 / 0.14 |
| **M8 character cases (direction)** | **20/26** | 19/26 |
| M8 character pairs held | 10/18 | 10/18 |
| M6 spread, median / max | 0.05 / 0.27 | 0.06 / 0.28 |
| requests / questions per judgment | 2 / 53.8 | 3 / 74.8 |
| USD per judgment | 2.3e-4 | 3.0e-4 |
| median ms per judgment | 399 | 405 (cong request runs in parallel) |

**The rule, step by step.** Neither arm is disqualified (14 of 24 pairs each). M5: B right and C wrong on 1 case, the
reverse on 5, p = 0.22. M1: 1 against 0, p = 1.0. ρ differs by 0.01. So step 5 applies: a tie, and B is recommended.
C's M5 edge is five false neutrals pushed to the right side, not better direction.

## Second labeller (reported, never decides)

- **Agreement.** The two labellers agree on direction for 62 of 72 cases (86%); Spearman 0.90. v3's pair agreed on
  93%. All 8 neutrals agree. The 10 disagreements include 6 where one labeller says neutral.
- **Consensus subset** (62 cases): B M1 45/54, M3 12/17, M5 43/62; C M1 45/54, M3 12/17, M5 45/62. Nothing changes.
- **Misses the labellers dispute.** Of B's 15 direction misses, 6 are cases the second labeller labelled differently;
  for C it is 7 of 16. On consensus cases both arms reach 83% M1, against a labeller ceiling of 86% to 93%.

## Why congruence did not help (post hoc, not pre-registered)

- **On held-out, congruence carries no information B lacks on character cases.**
  - The raw congruence term alone has the right sign on 19 of 26 character cases. B already gets 20, through v3's
    `deed` nouls and the stake nouls.
  - On dev it looked different: congruence 13 of 15 character cases against deed's 8. That gap did not carry to fresh
    scenarios.
- **The final's damping makes the channel small.**
  - Where the reveal gate fired on character cases, (1 − touches) averaged 0.54, and the added term averaged 0.11 in
    absolute size. B's scores on the misses are often larger and of the wrong sign (A08c +1.30, A05a +1.64).
  - The reveal gate itself works. It fired on 58 of 72 cases and on none of the 8 neutrals.
- **A contender points elsewhere and is reported, not counted.** `put-r` doubles the channel's weight and drops the
  (1 − touches) damping.
  - It reads M5 56/72 and M1 52/64, 16 of 24 pairs. Against B's final: M5 14 vs 2 discordant (p = 0.004); M1 6 vs 3
    (p = 0.51).
  - Its gain is again false neutrals, not character: M8 19/26, and against B on character cases 2 vs 3.
  - B's own contender `sq` (importance squared) reads M1 52/64 and 16/24 pairs, with no extra questions. Against B's
    final: M5 7 vs 3 (p = 0.34), M1 4 vs 1 (p = 0.38).
  - So the post-hoc lift, if real, comes from weighting and scale near zero, not from reading character.
  - All of this is chosen after seeing held-out, so it decides nothing here.
- **The 15 misses both finals share.**
  - Undisputed character cases (3): A08a (wiping a hunted kid's debt as decency), A08c (safety bought by selling
    strangers) and B04a (running toward hunters for a friend). In A08a and B04a both arms sit near zero (−0.01 to
    −0.05). In A08c both read +1.3, because the holder's own safety dominates.
  - Consequence and exposure cases (6): A02b, A05a, A07c, A11a, B03c and B06b. Each turns on what the act exposes the
    holder to: corp heat, hunters, deeper debt, a relay hack in her bar.
  - Disputed (6): A09b, A10c, B01a, B05b, B11c and B12b. The second labeller reads each differently. Three of them
    (B01a, B05b, B12b) are character cases.

## The two fixes you asked for

- **Severity (weighting).** Linear weighting replaced v3's `top` step, which zeroed a death threat on a value rated
  2. No held-out case tests that miss again directly. The squared contender did better than linear on held-out (see
  above), within noise.
- **Neutrals (touches gate).** A threshold didn't help. The thresholded contenders read neutrals 5/8 (`lin-g22`)
  and 2/8 (`lin-g20-flat`). Both lost pairs (13 against 14). The final reads 5/8 neutrals with no threshold, and a
  routine case scores up to +0.61. Touches doesn't separate routine from character. C's reveal gate, a different
  question, is the one measured device that never fired on a neutral.

## Which docs/jev.md rules each arm bends

| | B `lin` | C `put-rt` |
|---|---|---|
| rule 1, one judgment | touches joins four things (v3's) | the same, plus some X name two or three things |
| rule 3, no indirection | kept (deed asks about the act) | **bent**: reveal judges character outright; "put X first" reads a priority off an act |
| rule 7, small state | **bent** (v3's): identity and history in all 41 nouls | the cong request drops identity; the author measured it worse with it |
| rule 9, no identities | up and down asked as separate absolutes | the same for the mirror pair |
| composite scoring, chaining | kept | kept; the added request runs in parallel |

## Cost

All runs made 2,448 held-out judgments plus dev, with 0 refused.

| | USD |
|---|---|
| B dev | 0.097 |
| C dev | 0.263 |
| held-out finals (720) | 0.191 |
| held-out contenders (1,728) | 0.460 |
| **total** | **1.01** |

That is under the 1.92 ceiling named before spending.

## Limits

- **Power.** 72 cases, with 6 discordant on M5 and 1 on M1. McNemar can find only large differences. A 14-to-2 split
  like `put-r`'s would count, but it was not pre-registered.
- **One labeller for both material and the character flag.** The flag says whether a label rests on the actor. The
  labeller was asked to include such cases, described by what decides the label and not by any mechanism. Asking for
  them may still have shaped how they were written. The second labeller agreed on 86%, lower than v3's 93%. Six of
  its ten disagreements are a call of neutral.
- **The dev and held-out results disagree on congruence.** On dev, C led on character cases by 2 (11 against 9 of 15).
  On held-out it trailed by 1. Thirty-six dev cases were enough to choose wording, but not enough to show the channel
  generalizes.
- **The engine's encounter rule is the one shipped** (actor and targets), not D33. The history is the scenario only,
  with no stored standing or memory. The renderer belongs to the experiment.
- **Jev is close to deterministic.** Five reps measure rerun noise (median spread 0.05), not how far the wording
  generalizes.
- **The values are experiment material.**

## Recommendation

Keep **B**, v3's O2 with linear weighting and no touches threshold. Don't add the congruence channel. On fresh
labels it didn't improve direction, pairs or the character cases it was built for. It costs 30% more per judgment.

Two things for the next unit, neither settled here:
1. **Scale near zero, not character, is the open lever.** Post hoc, the two strongest variants on held-out (`put-r` on
   M5, `sq` on M1 and pairs) gain by moving cases out of the neutral band or by weighting, not by reading the actor.
   Testing that needs fresh labels and a pre-registered comparison of B `lin`, B `sq`, and a congruence-at-full-weight
   arm.
2. **The shared misses are about consequence and exposure**: what the act lets happen to the holder (corp heat,
   hunters at the door), and a few character readings where the holder's own stake points the other way. Literal
   questions about what the act exposes the holder to are the untested candidate.
