# value-weighting-2: is an NPC's value importance applied by Jev or by code?

Experiment material, not strata's design: Schwartz's ten values and the 0 to 4 importance scale exist only for this
test. The rule was fixed in `prereg.md`: the scoring and split in 5a70b71, before any arm existed, and the arms
frozen in 7bf3479, before any held-out run. Raw calls stay local under `corpus/runs/value-weighting-2/`. The
scorer's held-out output is committed as `heldout-final.score.md` and `heldout-secondary.score.md`.

## How this run differs from the first

- **Real world, real shapes.** Every case is a script of real actions and clock steps, driven through
  `Engine.act` and `Engine.step` on `world/` (`build.ts`). Each NPC reads the case through its own engine copies,
  rendered field by field (`render.ts`): a bystander gets no whisper words, and only the mover gets an arrive's
  `present`. The role comes from `encountersOf`, and the holder's earlier copies are its relationship history
  (1 to 8 lines, median 6). The profiles are 9 variants, 3 each of Rogue, Glitch and Mux. All 9 kinds of target
  event appear, with both roles.
- **Each arm at its best.** Each arm had its own author (opus), told to make it as good as it could be, with 12
  variants and up to 1,500 dev calls, tuned on dev only.
  - O1's final presents each value as how this person judges others, in prose tiered by importance, with no
    numbers. It asks one five-step question.
  - O2's final asks per value about the holder's stake (personal values) or the other's conduct (social
    values), adds one "beyond routine?" gate, and weights the answers in code.
- **Nothing primed, roles separate.**
  - The labeller (opus) wrote the variants, scenarios and verdicts from the rendered views. It never saw the
    arms or any formula, and was never told what importance does.
  - The scorer (sonnet) wrote `score.ts` from the pre-registration without opening the arms.
  - This session wrote the builder, renderer and runner, and no arm, label or scoring code.
  - The labeller split its 64 cases into two sets of matching make-up. A coin it never saw (the first hex digit
    of its labels' sha256) made B dev and A held out. A stayed outside the repository until the freeze, and its
    sha256 matched on entry.

## Verdict by the pre-registered rule: none. Both arms are disqualified

Step 1 disqualifies an arm that holds fewer than half the opposite pairs. On the held-out split, **O1 holds 3 of
7 and O2 holds 3 of 7**, so both are out, and the rule names no winner. The rule was written so that an arm unable
to tell profiles apart can't win on other metrics, and neither final shows that it can, at this bar.

## Held-out results (32 cases, 5 reps, finals)

| metric | O1 `lens-late-s5` | O2 `C-hyb-top-sig2` |
|---|---|---|
| M1 direction (mean score) | 20 / 26 | 19 / 26 |
| M1 per rep | 20, 19, 20, 19, 20 | 20, 19, 19, 19, 20 |
| M2 Spearman ρ, all / within build / within detract | **0.77** / 0.53 / 0.66 | 0.55 / 0.19 / 0.31 |
| M3 opposite pairs held | 3 / 7 ✗ | 3 / 7 ✗ |
| M4 conflict direction | 6 / 8 | 6 / 8 |
| M5 three-way | 20 / 32 | 22 / 32 |
| neutral cases read neutral | 1 / 6 | **6 / 6** |
| directional cases read neutral (false neutral) | 2 / 26 | 5 / 26 |
| neutral cases' \|score\|, median / max | 0.34 / 1.04 (band 0.1) | 0.007 / 0.017 (band 0.03) |
| M6 rerun spread, median / max | 0.11 / 0.43 | 0.03 / 0.10 |
| M6 per-rep M5 range | 18 to 20 | 22 to 23 |
| M7 calls / questions per judgment | 1 / 1 | 1 / 21 |
| M7 USD per judgment | 4.3e-5 | 1.8e-4 |
| M7 median ms | 198 | 209 |

The comparison steps below step 1 never ran. Computed for context only, O1 is right and O2 wrong on 5 cases, and
the reverse on 7, for M5 (exact McNemar p ≈ 0.77). Neither arm is close to separating on accuracy.

Dev (32 other cases, for comparison):

| | M1 | M3 | M5 | ρ |
|---|---|---|---|---|
| O1 | 21/26 | 5/7 | 21/32 | 0.58 |
| O2 | 20/26 | 4/7 | 23/32 | 0.67 |

Both arms lost pairs on new scenarios, as tuning on 7 dev pairs would predict.

**Secondary run: every non-final variant on held-out, 3 reps (never decides).**

| variant | M1 | M3 | M5 | neutral hits | ρ | USD |
|---|---|---|---|---|---|---|
| O1 tiers-c3 (catalogue tiers, closest to the first run) | 18/26 | 1/7 | 20/32 | 3/6 | 0.52 | 3.4e-5 |
| O1 tiers-s5 | 17/26 | 2/7 | 20/32 | 4/6 | 0.60 | 3.9e-5 |
| O1 outlook-s5 | 19/26 | 4/7 | 20/32 | 2/6 | 0.71 | 4.0e-5 |
| O1 outlook-nouls | 21/26 | 4/7 | 21/32 | 0/6 | 0.70 | 3.5e-5 |
| O1 lens-s5 | 19/26 | 3/7 | 18/32 | 2/6 | 0.70 | 4.2e-5 |
| O1 lens-ext-s5 | 19/26 | 3/7 | 20/32 | 2/6 | 0.70 | 4.0e-5 |
| O1 lens-c3 | 17/26 | 3/7 | 18/32 | 2/6 | 0.71 | 4.0e-5 |
| O1 lens-show-s5 | 19/26 | 4/7 | 21/32 | 2/6 | 0.69 | 4.3e-5 |
| O1 lens-late-gate | 19/26 | 3/7 | 20/32 | 2/6 | 0.76 | 4.4e-5 |
| O1 lens-late-reads | 18/26 | 3/7 | 20/32 | 2/6 | 0.74 | 4.4e-5 |
| O1 lens-late-ens | 20/26 | 3/7 | 21/32 | 2/6 | 0.77 | 5.1e-5 |
| O2 F-lin-gate (first run's shape, real context) | 16/26 | 3/7 | 19/32 | 3/6 | 0.61 | 8.3e-5 |
| O2 P-lin-sig | 16/26 | 2/7 | 18/32 | 3/6 | 0.54 | 1.0e-4 |
| O2 P-top-sig | 18/26 | 3/7 | 22/32 | 5/6 | 0.64 | 1.0e-4 |
| O2 P-above-sig | 17/26 | 3/7 | 21/32 | 4/6 | 0.65 | 1.0e-4 |
| O2 P2-top-sig | 19/26 | 3/7 | 20/32 | 4/6 | 0.64 | 1.1e-4 |
| O2 P3-top-sig | 19/26 | 3/7 | 21/32 | 3/6 | 0.67 | 1.3e-4 |
| O2 P4-top-sig | 18/26 | 3/7 | 20/32 | 4/6 | 0.63 | 1.1e-4 |
| O2 C-hyb-top-sig | 20/26 | 3/7 | 22/32 | 6/6 | 0.58 | 1.8e-4 |
| O2 E-top-sig | 18/26 | 3/7 | 21/32 | 4/6 | 0.54 | 1.1e-4 |

Three O1 variants reach 4 of 7 pairs on held-out (`outlook-s5`, `outlook-nouls`, `lens-show-s5`), and no O2
variant does. Those three would have passed step 1, but they were not the finals the authors chose on dev, so they
decide nothing. Every variant lands between 18
and 22 on M5.

## What the failures show (post hoc, not pre-registered)

- **Both arms order every pair right and miss on where zero sits.** Within each opposite pair, O1 scores the
  build case above the detract case in 7 of 7 pairs, and O2 in 6 of 7 (a04 is a tie: −0.190 against −0.185).
  The pairs fail because both cases land on the same side of zero. The profiles shift the score, and the event's
  ordinary reading sets its sign.
  - The first run's "O1 ignores the profile" does not hold once O1 gets the values as lenses. O1's median gap
    within a pair is 1.57 on a scale where the median directional score is 1.06. The flat tier wording
    (`tiers-c3`) still holds only 1 of 7.
- **The three pairs both arms lose share one shape.** In each, the build side needs an inference past the
  event's surface:
  - a03-mux-b: a hustler sees Glitch taking Rogue's job as a runner who will pay for cells.
  - a04-rogue-a: Rogue reads an offer left to lapse as restraint ("will not burn your grid").
  - a06-arr-rogue-b: a thrill-seeking Rogue reads walking back in during a corp sweep as nerve.

  Both arms score all three negative. The O1 and O2 authors each reported the same kind of miss on dev:
  indirect consequences, and what an act shows about the other's character.
- **Neutral is O2's real advantage.** Its gate puts routine arrivals, departures and an unheard whisper at
  |score| ≤ 0.017, and all 6 neutral cases read neutral. O1 reads 1 of 6 as neutral. O1 gives a confident
  reading to things the labeller called nothing:
  - Rogue reads a whisper right after her rent threat as conspiracy (−1.04).
  - A departure and an arrival read at 0.31 and −0.44.

  O1's own gate variant (`lens-late-gate`) did not fix this: it still reads only 2 of 6 as neutral. O2 pays for
  its gate in weak directional cases. It reads 5 directional cases as neutral, against O1's 2.
- **Magnitude and noise pull in opposite directions.** O1 ranks strength better (ρ 0.77 against 0.55, and
  within direction 0.53 and 0.66 against 0.19 and 0.31). O2 is steadier (median rerun spread 0.03 against 0.11).

## Cost

Each arm makes one `decide` call per judgment.

| | questions | USD per judgment | median ms |
|---|---|---|---|
| O1 | 1 | 4.3e-5 | 198 |
| O2 | 21 | 1.8e-4 | 209 |

All runs together, dev plus both held-out runs, made 4,611 calls with 0 refused, for 0.36 USD. That is under the
pre-registered ceiling of 0.52 USD.

## Limits, including where this still departs from the final system

- **One labeller.** Every verdict is one agent's reading, and several of the deciding cases rest on inferences a
  second designer could fairly reject (a03-mux-b, a04-rogue-a, a09-rogue-b). Without a second blind labeller,
  the ceiling is unknown, so it is unknown whether 20 of 26 is good.
- **Small held-out set.** It has 32 cases and 7 pairs. Step 1 turns on a single pair (3 against the bar of 4),
  and the McNemar steps could detect only a large difference.
- **Pairs were tuned on 7 dev pairs.** Both finals were chosen partly on dev M3, and both lost 1 to 2 pairs on
  held-out.
- **The encounter rule is the one shipped, not the one decided.** `encountersOf` gives an encounter with the
  actor and targets only. D33, under which arriving in a room is an encounter with everyone present, isn't built
  yet. So no case judges the holder's own arrival, a depart or an arrive from the mover's side, or a direct say.
- **History is one scenario.** History is the holder's copies within one short scenario. It carries no stored
  standing, no earlier judgments and no memory from earlier days. The final system's history will be longer and
  partly rolled up.
- **The renderer is this experiment's.** The engine has no NPC-facing renderer yet. `render.ts` writes the
  copy's fields as lines, and the final system's wording will differ.
- **One call per judgment, fixed by the contract.** Both authors said a fair final system might use two calls:
  first what the event means for this person, then the judgment. That is the shared failure above, and it was
  not tested.
- **The identities add one fact the world files lack:** Mux rents the Back Room from Rogue. Several scenarios
  rely on it.
- **Some wording is the authors' own, fixed per value:** O1's "warm to / resent" lines and O2's PVQ-style cues.
  They are general, but each author wrote them while looking at the dev cases.
- **Blinding was by instruction for files inside the repository.** The held-out split was physically outside the
  repository until the freeze. Nothing else was.
- **Some dev logs carry an earlier band.** A few dev calls logged a band from an earlier draft of a module. The
  freeze addendum rescored dev at the frozen bands.
- **The values are experiment material.** The ten values, the 0 to 4 scale and the 9 variants are not strata's
  design.

## Recommendation

This run does not settle O1 against O2, and nothing in it supports re-deciding D38 either way.
- Neither arm tells the profiles apart at the pre-registered bar.
- Each wins a different metric: O1 on magnitude and cost, O2 on neutral handling and steadiness.
- On accuracy they are within noise.

What it does show is that both arms fail at the same step. They read what the event plainly is, and they miss
what it means for this particular person once that takes an inference about consequences or character. Where
the weighting happens is downstream of that step.

The next unit should test that step directly. For each arm, a two-call variant asks first what the event means
for this person, then makes the judgment. Before that, a second blind labeller should label this held-out set,
so the ceiling is known. The 32 held-out cases are now spent and must not be reused for tuning.
