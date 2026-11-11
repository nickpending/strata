# size-judgment: given the value and the direction, can Jev judge how big?

The commits came in this order, before anything that could bias them:
- **345954f:** the rule, the runner, the builder and the briefs, before any label existed.
- **14168e1:** the labels, the coin split (B is dev) and the scorer, before any arm existed.
- **261732d:** the three arms frozen, before any held-out run.

The scorer's output is committed as `heldout-final.score.md` and `heldout-secondary.score.md`. Raw judgments stay
local under `corpus/runs/size-judgment/`.

## Answer

**Jev's size judgment is decent in isolation, and it is not the main weak link in design B. It is not yet good
enough by the bar fixed before the run.**

- **On held-out, v3/v4's own wording (A) reaches ρ 0.71 against blind labels.** The ceiling, the two labellers'
  agreement, is 0.89.
  - Within direction A reaches 0.64 (up) and 0.69 (down). End to end, v4 read 0.32 within build and 0.17 within
    detract.
  - It orders 10 of the 12 same-kind size pairs.
- **By the pre-registered rule neither new wording beats A,** so A stays. Per-value anchored levels (C) reach 0.77
  and five shared concrete levels (B) reach 0.75. Both are ahead on every rank metric, but neither bootstrap interval
  excludes zero.
- **Grade: partly.** Pairs (83%) and the within-direction floor (0.5) hold. Pooled ρ 0.71 misses the bar of ceiling
  − 0.10 = 0.79.

The comparison with v4 is suggestive, not like for like. v4's labels were overall build or detract strength from 1
to 3, with importance folded in. Here the labels are the size of the effect on one given value. Still, given the right
value and direction, the size step ranks within each direction at 0.64 to 0.69. So most of v4's end-to-end loss
within direction comes from upstream: the gate, the direction nouls, the deed channel or the weighting.

## Held-out results (49 cases, 65 items, 12 pairs, 23 scenarios; 5 reps; finals)

| metric | A `as-is` (v3's `how`) | B `b5c-given` | C `c5-given` |
|---|---|---|---|
| levels | 3 | 5 | 5 |
| **M1 pooled ρ** (mean of reps) | 0.713 | 0.752 | **0.771** |
| M1 per rep | 0.707 to 0.727 | 0.745 to 0.756 | 0.754 to 0.781 |
| M2 ρ up / down | 0.644 / 0.686 | 0.683 / 0.748 | 0.692 / 0.788 |
| M2 ρ security / power / benevolence / achievement / self-direction | 0.73 / 0.72 / 0.82 / 0.80 / 0.54 | 0.77 / 0.82 / 0.74 / 0.69 / 0.67 | 0.74 / 0.85 / 0.93 / 0.64 / 0.46 |
| M3 pairs ordered / tied / reversed | 10 / 1 / 1 | 11 / 0.2 / 0.8 | 11 / 0.8 / 0.2 |
| M4 exact / ±1 (by its own toLabel) | 0.41 / 0.97 | 0.44 / 0.95 | 0.47 / 0.95 |
| M5 items whose level changes across reps | 4 / 65 | 5 / 65 | 6 / 65 |
| M6 requests, USD per judgment | 1, 3.3e-5 | 1, 4.5e-5 | 1, 3.9e-5 |

- **The rule, step by step.** There are two challengers, so each paired scenario bootstrap is a 97.5% interval.
  - B − A = +0.039, interval [−0.043, 0.132]: a tie.
  - C − A = +0.058, interval [−0.032, 0.155]: a tie.
  - No challenger beats A, so A is recommended (step 2).
  - Step 3 on A: (b) 0.83 ≥ 0.80 holds; (c) 0.64 and 0.69 ≥ 0.5 holds; (a) 0.71 < 0.79 fails. The grade is
    **partly**.
- **The ceiling.** The second labeller agrees with the first at ρ 0.89 (0.87 within each direction), exact on
  44/65, within one on 64/65, and orders all 12 pairs the same way. On the consensus subset (64 items) nothing
  changes: A 0.72, B 0.76, C 0.78.
- **Dev overstated the gap.** On 32 dev items C led A by 0.84 to 0.56. On held-out the lead is 0.77 to 0.71. A was
  weak on dev, not strong on held-out: dev holds one value (security) in 13 of 32 items.

## Where the levels go (held-out label size against each final's level, cases by modal level over reps)

| label | A: slight / clear / big | C: L1 / L2 / L3 / L4 / L5 |
|---|---|---|
| 1 | 5 / 1 / 0 | 2 / 4 / 0 / 0 / 0 |
| 2 | 7 / 11 / 0 | 2 / 4 / 11 / 1 / 0 |
| 3 | 2 / 12 / 4 | 0 / 1 / 9 / 7 / 1 |
| 4 | 1 / 6 / 8 | 0 / 1 / 2 / 10 / 2 |
| 5 | 0 / 0 / 8 | 0 / 0 / 0 / 2 / 6 |

- **A's loss is where its levels sit, not how many there are.** The best possible 3-level reading of these labels
  scores ρ 0.97, so three levels are not the cap. A's "Clear" takes most of sizes 2, 3 and part of 4 (29 of 51), and
  separates them poorly. "Big" catches every size 5 and 8 of 15 size 4s.
- **C's levels sit one low in the middle.** Size 2 lands mostly on its L3, and size 3 splits between L3 and L4.
  The ranks hold anyway, which is what ρ and standing need.

## The misses (post hoc)

- **The two pairs A misses** have word-for-word identical target events, where size rides entirely on history:
  - **C01 against C04.** "Rogue refused the stimpak from you." For Glitch, security is set back at size 2 (a stand-in
    for a day-late cut) against size 4 (his life in her hands). A reads clear against slight (reversed); C reads L2
    for both (tied).
  - **C08 against C10.** "Glitch / Mux left ... heading for Back Room." For Rogue, power goes up at size 1 (a runner
    fetching glasses) against size 3 (a tenant who just announced his defection obeys her order). A reads slight for
    both; C orders them.
  - A and C order the other 10 pairs in every rep or nearly every rep (M3).
- **The weakest value is self-direction** (A 0.54, C 0.46). The labellers agree on it at only 0.49. The labels
  themselves are uncertain there.

## Secondary run (contenders, 3 reps; never decides)

| variant | what changes | M1 | up / down | pairs |
|---|---|---|---|---|
| B `b5c-asked` | B's levels, A's "Asked ... If so" question | 0.770 | 0.76 / 0.76 | 11 / 1 / 0 |
| B `b5c-given-st` | B plus "judge it by what rides on it for you" | 0.768 | 0.71 / 0.76 | 11 / 0 / 1 |
| B `b4-given` | four levels | 0.735 | 0.67 / 0.72 | 11 / 1 / 0 |
| C `c5-given-st` | C plus the stakes clause | **0.814** | 0.71 / 0.84 | 11 / 0.3 / 0.7 |
| C `c5-asked` | C's levels, A's question | 0.754 | 0.70 / 0.76 | 11 / 1 / 0 |
| C `c4-given` | four anchored levels | 0.764 | 0.69 / 0.76 | 11 / 0.7 / 0.3 |

- **`c5-given-st` is the only variant over the (a) bar** (0.814 ≥ 0.79). That reading comes after seeing held-out, and its
  stakes clause showed no lift on dev (0.82 against 0.83), so it decides nothing.
- **Levels or question form.** B and C each changed both their levels and their question form against A. Keeping
  A's question with the new levels (`*-asked`) gives 0.77 and 0.75. Stating the direction as fact adds little on
  held-out (B −0.02, C +0.02). The levels carry most of the gain over A.

## Which docs/jev.md rules each final bends (from the module headers)

| | A `as-is` | B `b5c-given` | C `c5-given` |
|---|---|---|---|
| 1, one judgment | "If so, how big" lets doubt about direction leak into size | size folds what is at stake with how far it moved | the same, with anchors naming what is moved per value |
| 6, read a level | most probable level only | the same | the same |
| 7, small state | identity and history in every question (v3's) | the same | the same; the levels each question sees are its own value's only |
| 4, no importance | none reaches Jev | the same | the same |

## Cost

| | judgments | USD |
|---|---|---|
| author dev tuning | 1,104 | 0.046 |
| held-out finals | 735 | 0.029 |
| held-out contenders | 882 | 0.037 |
| **total** | 2,721, 0 refused | **0.111** |

The ceiling named before spending was 0.80. Agent work: two opus labellers, one opus author, one sonnet scorer.

## Limits

- **Power.** 65 items in 23 scenarios. The bootstrap intervals are about ±0.09 wide, so a gain of 0.04 to 0.06 cannot
  show. Pairs number 12.
- **Value mix.** Security holds 39 of the 97 items. Stimulation, conformity, tradition and universalism are barely
  present, so C's anchors for them are untested.
- **Only the stake channel is tested.** Design B's `how` also scores `deed` statements, and this run says nothing
  about those.
- **The arms saw the scale.** The author read the prereg's five size words, and C's anchors echo size 5's wording.
  That aligns B and C with the labels in a way A's older wording is not.
- **One hand wrote the material.** The second labeller sized the same scenarios. Its agreement (0.89) measures
  label noise, not how far scenarios from another writer would generalize.
- **The builder.** v2's builder calls `encountersOf` with its pre-D33 signature and crashes at HEAD, so this run
  uses `build.ts`, which reads the engine's own encounter rule. Earlier experiments' builders need the same fix
  before they can be rerun.
- **Rep spread.** Jev is close to deterministic: 4 to 6 of 65 items change level across reps, and the SD of M1 over
  reps is 0.005 to 0.012.

## Recommendation

1. **Keep A**, design B's current `how` wording, by the rule. Size is not where design B mainly loses.
2. **To lift size toward the bar,** run C `c5-given-st` against A on fresh labels with a pre-registered rule. Make
   the set larger (about 150 held-out items, with more values than security) so that a 0.05 to 0.10 gain can show.
   It is the strongest post-hoc variant, and per-value anchors led on every held-out rank metric.
3. **Look for the end-to-end loss upstream.** Within direction, the size step alone reads 0.64 to 0.69. v4's design
   B read 0.32 and 0.17 end to end. The next isolation is the direction and gate step: given the value only, does
   Jev pick the direction, and which deed or stake statements fire. Rescoring v4's logs with labelled true
   directions could localise it at no Jev cost.
4. **Same-surface events are the residual size failure.** In both pairs A misses, the event text is identical and
   the size rides on history. Any size wording has to read `earlier` rather than the event alone.
