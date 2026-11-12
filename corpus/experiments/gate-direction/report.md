# gate-direction: where design B loses direction and magnitude

Step 1 rescores value-weighting-4's logged design-B answers stage by stage, at no Jev cost. `rescore.ts` reads the
local logs under `corpus/runs/value-weighting-4/` and v4's committed labels and material, and writes `step1.md`;
every number below comes from `step1.md`. The baseline reproduces v4's report exactly: held-out ρ 0.55, within build
0.31, within detract 0.17, M1 49/64.

## Answer (step 1)

**Design B loses most where it reads the direction, in the per-value stake and deed nouls. No code stage (the touches
multiplier, the denominator, the size step or a threshold) costs more than 0.05 ρ.** The within-direction magnitude
loss can't be pinned to a stage with v4's labels, because they are too coarse and too few to measure it.

- **Direction is the largest loss.** Giving each case its labelled sign lifts pooled ρ from 0.58 to 0.85, and
  held-out from 0.55 to 0.84.
  - On held-out, 9 of the 15 misses are cases where both labellers agree. Fixing those 9 alone gives 0.74. The other
    6 misses are cases where the second labeller disagrees with the first. Fixing them gives 0.64, and that part is
    label disagreement, not Jev.
  - The 9 are the cases v4 already named: six turn on consequences and exposure (A02b, A05a, A07c, A11a, B03c, B06b),
    and three are character cases (A08a, A08c, B04a).
- **Code stages, one swapped at a time (pooled ρ / M1; baseline 0.58 / 72 of 96):**

  | stage | swap | pooled | held-out | dev |
  |---|---|---|---|---|
  | touches multiplier | not multiplied | 0.60 / 72 | 0.57 / 49 | 0.68 / 23 |
  | touches multiplier | oracle (0 on neutrals) | 0.60 / 72 | 0.58 / 49 | 0.68 / 23 |
  | denominator | plain sum | 0.58 / 72 | 0.55 / 49 | 0.66 / 23 |
  | denominator | over fired values only | 0.58 / 72 | 0.55 / 49 | 0.65 / 23 |
  | size step (`how`) | every level 1 | 0.56 / 68 | 0.55 / 47 | 0.57 / 21 |
  | threshold | noul ≥ 0.5 counts 1 | 0.58 / 68 | 0.57 / 46 | 0.63 / 22 |
  | weighting | importance squared | 0.63 / 75 | 0.64 / 53 | 0.63 / 22 |
  | weighting | max(0, importance − 1) | 0.64 / 71 | 0.64 / 50 | 0.63 / 21 |
  | weighting | none (every value 1) | 0.14 / 52 | 0.14 / 35 | 0.14 / 17 |

  - Touches, the denominator and the size step each move ρ by 0.02 or less, and the direction of the move flips
    between the two splits.
  - The denominator is a constant for each holder (the sum of its importances). It rescales every case for that holder
    the same way, so it barely moves a rank.
  - The touches multiplier helps v4's three-way accuracy (v4's B author measured that). It costs at most 0.02 ρ.
- **Importance carries the direction.** Without it, M1 falls to 52 of 96. B's nouls see no importance. The two
  variants in an opposite pair share one identity, one history and one event, so Jev gives both the same answers,
  and only the weighting can split them.
- **Within the nouls, only the holder's top values carry the signal** (AUC of the per-band net P(up) − P(down),
  build against detract, pooled):

  | values the holder rates | stake | deed |
  |---|---|---|
  | 3 to 4 | 0.79 | 0.76 |
  | 1 to 2 | 0.45 | 0.49 |
  | 0 | 0.32 | 0.26 |

  - On the holder's top values the nouls are right about three times in four.
  - Values rated 1 or 2 carry no signal. Linear weighting still gives them a quarter to half the weight of a top
    value. Scored with only the 1-to-2 band, B reads 49 of 96 directions, which is chance.
  - Values rated 0 point the wrong way, by v4's design: an opposite pair's other variant cares about them. They get
    weight 0, so they cost nothing.
- **Channels.** Stake and deed each carry the signal, and neither is noise. Stake alone reads 66 of 96 and deed alone
  64. Together they read 72. On 17 of the 24 misses, both channels point the wrong way, so a miss is not one channel
  overruling the other. Deed alone has no magnitude signal within detract (ρ −0.02 pooled).
- **The gate fires on everything, and it leans up.** Each judgment's summed P(up) beats its summed P(down) by 1.2 to
  1.9, whatever the label, neutrals included (5.2 against 3.5). A larger weight on down only trades build hits for
  detract hits: at ×1.5, held-out M1 stays 49, while dev goes from 23 to 24.
- **Within-direction magnitude can't be localised with these labels.**
  - v4's magnitude runs 1 to 3 with importance folded in, and build uses only 1 and 2. On 30 build cases that is
    close to a binary label.
  - The second labeller reaches only 0.56 within build and 0.70 within detract. On cases where both labellers agree
    the direction, they reach 0.33 within build.
  - B's held-out within-direction 95% intervals run from about −0.1 to 0.6 (build) and −0.2 to 0.5 (detract). On dev
    the same arm reads 0.62 and 0.54.
  - Dropping every statement that points against the case's label lifts within-detract from 0.25 to 0.40 pooled. That
    is the only swap that moves it.
  - So comparing v4's 0.32 and 0.17 with size-judgment's 0.64 to 0.69 says little. The labels differ in scale,
    folding and n.

## What step 1 could not measure

The brief asked for gate recall and false fires per value and per channel, and for direction given a fired value.
Those need the labeller's touched values and their directions. **v4's labels don't have them.** Each case has only
`direction`, `magnitude` (1 to 3), `kind`, `pair`, `set`, `character` and a prose `rationale`; the second labeller
has only `direction` and `magnitude`. Every "truth" above is therefore the case's own label, and the per-value split
between gate (does a value fire at all) and direction (which way it fires) stays open. In design B those are the
same 40 nouls: each one asks whether the event moved one value one way, so one statement settles both.

The table in `step1.md` that counts fires "against the case label" (34% on build cases, 55% on detract) doesn't
measure false fires. A pair shares its answers, so a statement that is against one variant's label is for the
other's.

## The code change that recovers the most

**Importance squared (or max(0, importance − 1)) in place of linear weights.** On the logged answers it lifts pooled
ρ from 0.58 to 0.63 (or 0.64) and M1 from 72 to 75 (or 71). The gain sits on held-out (+0.09 ρ, +4 M1); dev goes
the other way (−0.03 ρ, −1 M1). v4's B author measured the same split, and v4's held-out secondary run had `sq` as a
contender. The mechanism is measured: values rated 1 to 2 carry no direction signal here. The size of the gain isn't
measured, because it was chosen after seeing held-out. It needs fresh held-out labels to count. It also has to stay
within v3's bar (no weight of 0 for a value rated 2 or more), which both forms meet.

It recovers about a fifth of what the direction oracle shows. The rest sits in the nouls on the holder's top values.

## Step 2

Step 1 names a Jev question stage, the per-value stake and deed nouls, as the main loss, so step 2 isolates it. See
"Step 2" below once it runs.

## Limits (step 1)

- **No per-value truth** (above).
- **n.** 72 held-out and 36 dev cases. Dev was the split B's knobs were tuned on, so the pooled figures lean
  slightly toward the final.
- **Post hoc.** Every swap is chosen after seeing held-out, so none decides anything. The oracles are bounds, not
  arms.
- **The statement-level oracle is generous.** It drops every statement against the case label, including real
  conflict, which the labeller weighed too.
