# gate-direction: where design B loses direction and magnitude

Two steps. Step 1 rescores value-weighting-4's logged design-B answers stage by stage, at no Jev cost. `rescore.ts` reads the
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

## Step 2: the per-value stage in isolation

The rule, the material and the arms were committed in order before anything that could bias them:
- 10cb83a: the rule, the runner and the briefs, before any label.
- 86fd60c: the labels, the coin split (B is dev) and the scorer, before any arm.
- ac471a7: the arms frozen, before any held-out run.

The scorer's output is `heldout-final.score.md` and `heldout-secondary.score.md`. Its M1, M2 and M3 for all three
finals match an independent recomputation from the raw logs to three places.

**Material.** Fresh engine-built cases from a blind opus labeller: 115 cases in 40 scenarios. Each case carries a
three-way label (up, down, none) for all ten values on both channels. Held out are 79 cases, 28 scenarios and 1,580
items. Of those items, 188 are touched: stake 39 up and 61 down, deed 68 up and 20 down.

**Arms.**
- **A `as-is`:** design B's 40 stake and deed nouls, checked word for word against v4's logs. Its reading is
  P(up) − P(down).
- **B `mg3-45`:** a gate first, then direction. Two gate nouls per value and channel, then a direction choice for
  what passes.
- **C `cw3-z50`:** A's shape, with each statement reworded as a concrete situation with an "Answer no if ..."
  boundary, and weak items read as 0.

### Answer

**In design B the per-value stage loses mainly at the gate. Most of its nouls fire on values the event never
touched, and the up and down nouls cancel each other on the values it did touch. Once an item fires clearly, the
direction it gives is almost always right.**

- **A's gate is its larger loss.** The gate AUC (M3) is 0.74, against the second labeller's 0.93. Direction on
  touched items (M2) is 0.84, against 0.88. The prereg's step 4 names gate (1 − M3 = 0.26 against 1 − M2 = 0.16),
  and stake as the weaker channel (stake M3 0.70, deed 0.78).
- **Direction is fine wherever A fires.** On the 79 touched items where |P(up) − P(down)| ≥ 0.5 (case means), the
  sign is right on 76. That is post hoc, from the logged readings.
- **The noise is on items nobody touched.** On 505 of the 1,392 untouched items, at least one of A's two nouls
  reaches 0.5. Subtracting P(down) from P(up) hides most of that: only 159 untouched items keep |r| ≥ 0.5. But the
  subtraction also flattens the touched items: only 79 of 188 reach that level. That flattening is step 1's
  diffuse firing and up-lean, seen per value.
- **Both challengers beat A by the rule** (M1, item ρ; paired scenario bootstrap; 97.5% intervals):
  - B: 0.463 against 0.324, difference +0.14, interval [0.065, 0.212];
  - C: 0.450 against 0.324, difference +0.13, interval [0.083, 0.171].

  They sit within 0.02 of each other, so **C is recommended**: it asks 40 questions per judgment to B's 46, and it
  costs 1.5e-4 USD to B's 2.5e-4.
- **Grade: no.** C's M2 is 0.72 (bar 0.85), M3 0.84 (bar 0.85), and M1 0.45 (bar: ceiling 0.74 − 0.10 = 0.64).
- **The lead comes from the wording, not from reading weak items as 0.** That zeroing was fixed at the freeze as a
  control: A's own answers read by C's rule (A-z50) give M1 0.342, so zeroing alone adds +0.02 of the challengers'
  +0.13 to +0.14.

### Held-out finals (5 reps) and the reported comparisons

| | A `as-is` | B `mg3-45` | C `cw3-z50` | A-z50 (A's answers, C's rule) | second labeller |
|---|---|---|---|---|---|
| **M1 item ρ** | 0.324 | **0.463** | 0.450 | 0.342 | 0.744 |
| M2 direction on touched | **0.840** | 0.786 | 0.724 | 0.715 | 0.878 |
| M3 gate AUC | 0.737 | **0.883** | 0.843 | 0.781 | 0.925 |
| stake M1 / M2 / M3 | 0.29 / 0.80 / 0.70 | 0.46 / 0.79 / 0.90 | 0.43 / 0.75 / 0.87 | 0.30 / 0.71 / 0.76 | 0.77 / 0.84 / 0.93 |
| deed M1 / M2 / M3 | 0.37 / 0.89 / 0.78 | 0.46 / 0.79 / 0.87 | 0.48 / 0.70 / 0.82 | 0.40 / 0.72 / 0.80 | 0.73 / 0.92 / 0.93 |
| touched with \|r\| ≥ 0.5, sign right | 76/79 | 134/144 | 132/144 | 131/151 | |
| untouched with \|r\| ≥ 0.5 | 159 / 1,392 | 225 / 1,392 | 253 / 1,392 | 505 / 1,392 | |
| questions, USD per judgment | 40, 1.4e-4 | 46, 2.5e-4 | 40, 1.5e-4 | 0 extra | |

- **M2 understates the challengers.** M2 counts a reading of 0 as wrong. Among items they fire on clearly, B is right
  on 93% and C on 92%. A is right on 96%, but it fires clearly on far fewer.
- **The consensus subset** (1,481 items both labellers agree on) changes nothing: A 0.34, B 0.49, C 0.47 M1.
- **Weakest values** (M5): conformity (A M3 0.47, B 0.64) and benevolence (A 0.66, B 0.79) are the hardest for
  every arm. Achievement, power and self-direction are read well.

### Secondary (contenders, 3 reps; never decides)

| variant | what changes | M1 | M2 | M3 | questions |
|---|---|---|---|---|---|
| B `g3-40` | B's "does it change X, either way" gate alone | 0.426 | **0.833** | 0.888 | **28** |
| B `m3-45` | B's "is X one of the main ways" gate alone | 0.456 | 0.817 | **0.895** | 27 |
| B `mg3-50` | the final, with a threshold of 0.50 | 0.467 | 0.722 | 0.853 | 45 |
| C `cw-z50` | C's wording before any dev answer was read | 0.434 | 0.764 | 0.844 | 40 |
| C `cw3-z60` | the final, zeroed at 0.60 | 0.480 | 0.672 | 0.819 | 40 |

- **C fits its dev only a little.** Its untuned wording reaches 0.434 against the final's 0.450.
- **B's single-gate contenders lead on M2 and M3** with about 27 questions. That is post hoc, so it decides nothing.
  It points the same way as the main result: a gate asked as its own question is what lifts this stage.

### What this means for design B

- **The fix belongs at the gate.** Design B asks "did it advance X" and "did it set X back" as two absolute nouls
  and subtracts them, so untouched values carry soft noise into every case. Importance weighting then amplifies that
  noise on the holder's top values. Step 1 put that loss at about 0.27 of case-level ρ.
- **A separate "does this touch X at all" question removes much of the noise.** B and its single-gate contenders
  lift gate AUC from 0.74 to 0.88 to 0.90.
- **No arm reaches the ceiling.** The labellers separate touched from untouched at 0.93, and the best arm at 0.90.
  Direction among fired items is already near the ceiling. Conformity and benevolence stay weak in every arm.
- **Next isolation, unmeasured here.** Swap a gate-first stage (B's shape, or `m3-45` with fewer questions) into
  design B's code combine. Then measure case-level direction and magnitude on fresh case labels with a pre-registered
  rule, against B `lin` as shipped. Importance squared from step 1 belongs in the same test as its own arm. Only that
  run shows how much of v4's case-level loss the better gate recovers.

### A flaw in the rule, named before held-out (freeze addendum)

M1 (item ρ) has a structural cap when about 88% of labels are 0. A reading with no exact zeros cannot score much above
0.56 even with a perfect ranking. So M1 mixes "asks better" with "outputs exact zeros". The registered rule decided
the verdict unchanged. A-z50 was fixed at the freeze as a control and shows the mix is small here. A later prereg on
this kind of label should make M3 (gate) and M2 (direction among fired) the primaries, or use a measure that does not
reward ties.

### Cost

| | judgments | USD |
|---|---|---|
| author dev tuning | as logged | 0.196 |
| held-out finals | 1,185 | 0.214 |
| held-out contenders | 1,185 | 0.215 |
| **total** | 0 refused | **0.625** |

The ceiling named before spending was 1.44 USD, and the brief's line was 2 USD. Agent work: two opus labellers, one
opus author and one sonnet scorer.

### Limits (step 2)

- **Value mix.** Security holds about 40% of stake touches. Stimulation, hedonism, tradition and universalism are
  rare as touched items, so their gate is measured mostly on untouched items.
- **Deed `down` is thin.** It has 20 held-out items.
- **One hand wrote the material.** The second labeller measures label noise (M1 0.74 against the first), not how
  far other writers' scenarios would generalize.
- **The author tuned on 12 dev scenarios**, after reading which items fired falsely. The untuned contender
  `cw-z50` bounds that fitting at about 0.02 M1.
- **Post-hoc figures decide nothing.** The "sign right among fired" counts, the per-value notes and the contender
  reading are all post hoc.

## Limits (step 1)

- **No per-value truth** (above).
- **n.** 72 held-out and 36 dev cases. Dev was the split B's knobs were tuned on, so the pooled figures lean
  slightly toward the final.
- **Post hoc.** Every swap is chosen after seeing held-out, so none decides anything. The oracles are bounds, not
  arms.
- **The statement-level oracle is generous.** It drops every statement against the case label, including real
  conflict, which the labeller weighed too.
