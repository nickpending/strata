# value-weighting-3: is an NPC's value importance applied by Jev or by code?

Experiment material, not strata's design: Schwartz's ten values and the 0 to 4 importance scale exist only for this
test. The rule was fixed in `prereg.md` before any label existed. The scorer, split and material were committed in
8134a10 before any arm existed, and the arms were frozen in bdebbe5 before any held-out run. Raw judgments stay
local under `corpus/runs/value-weighting-3/`. The scorer's held-out output is committed as `heldout-final.score.md`
and `heldout-secondary.score.md`.

## How this run differs from v2

- **Jev used as docs/jev.md says.**
  - Importance reaches O1 only as bucket words.
  - Neither arm reads a choice's or a score's expectation as a magnitude.
  - Each question asks one literal thing about what the holder received.
  - Each request's state is a small named JSON object.
  - A judgment may chain requests.
  - Score questions go through `jev3.ts`, which posts with the harness's own `postJson`, because
    `harness/src/jev.ts` `decide` parses only noul and choice answers and sends state as a string.
- **Fresh material.** A new opus labeller wrote new identities, nine new variants (three each of Rogue, Glitch and
  Mux), 43 scenarios and 88 cases. Each is driven through `Engine.act` and `Engine.step` on `world/` by v2's
  builder, unchanged. A coin made B dev and A held out. Each set has 14 opposite pairs, 6 conflict, 6 neutral and
  4 plain cases, with every event kind and both roles.
- **A second blind labeller** labelled the 44 held-out cases before the freeze, never seeing the first
  labeller's labels.
- **Separate roles.**
  - Two opus authors, one per arm, each told to make its arm as strong as it honestly could, tuned on dev only.
  - A sonnet scorer wrote `score.ts` from the pre-registration and never saw the arms.
  - This session wrote the client, contract, runner, pre-registration and this report, and no arm, label or
    scoring code.

## The two finals

- **O1 `nogate-sides-sq`: Jev applies importance.**
  - One request per value the holder holds; values rated "does not matter" are left out.
  - The state carries the identity, history, event, the other's name, and `value: {what, how_much}`, where
    `how_much` is the bucket in words.
  - `dir` is a choice (`serves` / `harms` / `neither`, with literal per-value criteria), read by one option's
    probability ≥ 0.6.
  - `care` is a 4-level score of how much the holder cares what the event does to that value; Jev applies the
    importance here. It is read by its most probable level, weighted [0, 1, 4, 9].
  - The values are summed with equal weights.
- **O2 `d4-top`: code applies importance.**
  - Request one is 41 nouls on one state. For each value there are two channels: what the act does to the
    holder's own stake, and whether the other's deed was for or against the value. Each channel has a one-sided
    "advanced" and a one-sided "set back" noul. Reverie's touches noul is the 41st.
  - Request two, chained, asks a 3-level strength score for each statement at 0.4 or above, read by its most
    probable level.
  - Code takes, per value, the sum of sign × P(noul) × level, then the weighted mean over values, times
    P(touches). The weight is 1 for importance 3 or 4, else 0.

## Verdict by the pre-registered rule: a tie on accuracy (step 5)

Both arms pass step 1: **O1 holds 8 of 14 opposite pairs, O2 holds 9 of 14.** Neither McNemar test comes close:
- M5: O1 right and O2 wrong on 4 cases, the reverse on 5, p = 1.0.
- M1: 2 against 5, p = 0.45.

ρ differs by 0.03, under the 0.10 bar. By the rule the recommendation rests on cost and structure, below.

## Held-out results (44 cases, 5 reps, finals)

| metric | O1 `nogate-sides-sq` | O2 `d4-top` |
|---|---|---|
| M1 direction (case mean) | 28 / 38 | **31 / 38** |
| M1 per rep | 26, 26, 26, 28, 27 | 30, 31, 30, 30, 31 |
| M2 ρ, all / within build / within detract | 0.66 / 0.57 / **0.52** | **0.69** / 0.54 / 0.11 |
| M3 opposite pairs held | 8 / 14 | 9 / 14 |
| pairs ordered right (build case above detract case, post hoc) | 13 / 14 | 13 / 14 |
| M4 conflict direction | 2 / 6 | **5 / 6** |
| M5 three-way | 31 / 44 | 32 / 44 |
| neutral cases read neutral | **6 / 6** | 4 / 6 |
| directional cases read neutral (false neutral) | 7 / 38 | 4 / 38 |
| M6 per-rep M5 range | 30 to 30 | 31 to 32 |
| M7 requests / questions per judgment | 8.0 / 16.1 | 2.0 / 53.7 |
| M7 USD per judgment | 2.6e-4 | 2.3e-4 |
| M7 median ms per judgment | 239 (requests in parallel) | 412 (two chained) |

M6's spread is not comparable across the arms. O1's score is an integer sum on a scale of about ±35, O2's a
weighted mean of about ±3. Jev was close to deterministic across reps for both.

Dev, for comparison (44 other cases, 2 reps): O1 27/38, 6/14 pairs, M5 29/44; O2 30/38, 10/14, 33/44. O1 gained
2 pairs on held-out and O2 lost 1. That is the size of the noise in a 14-pair count.

## Second labeller (reported, never decides)

- **Agreement.** The two labellers agree on direction for **41 of 44** held-out cases (Spearman 0.93 between
  signed labels), and on all 6 neutrals. They disagree on a03-4, a05-3 and a17-1; the first labeller had named a03-4 and a05-3 among its least sure.
- **Ceiling.** Two careful readers agree about 93% of the time on direction. The arms reach 74% (O1) and 82%
  (O2) on M1.
- **Consensus subset.** On the 41 cases where both labellers agree:

  | | M1 | M3 | M5 |
  |---|---|---|---|
  | O1 | 27/35 | 8/13 | 30/41 |
  | O2 | 29/35 | 9/13 | 31/41 |

  Nothing changes.

## Secondary run: each arm's contenders on held-out, 3 reps (never decides)

| variant | M1 | M3 | M5 | neutral hits | ρ | USD |
|---|---|---|---|---|---|---|
| O1 `gate-sides-sq` (gated final shape) | 25/38 | 6/14 | 31/44 | 6/6 | 0.62 | 2.3e-4 |
| O1 `gate-sides-lin` | 26/38 | 7/14 | 30/44 | 6/6 | 0.62 | 2.3e-4 |
| O1 `gate-generic-sq` | 26/38 | 6/14 | 31/44 | 6/6 | 0.59 | 2.3e-4 |
| O1 `gate-sides-nouls-sq` (nouls for direction) | 23/38 | 4/14 | 27/44 | 6/6 | 0.57 | 2.2e-4 |
| O2 `d4-lin` (importance × contribution) | 31/38 | 8/14 | 33/44 | 4/6 | 0.68 | 2.3e-4 |
| O2 `d4-sq` (importance² weight) | 31/38 | 8/14 | **34/44** | 4/6 | **0.73** | 2.3e-4 |
| O2 `d4-sq-thr` (nouls thresholded at 0.5) | 31/38 | 8/14 | **34/44** | 4/6 | 0.67 | 2.3e-4 |
| O2 `gc-top` (the brief's gate, choice, score shape) | 30/38 | 9/14 | 31/44 | 2/6 | 0.69 | 2.8e-4 |

Every O2 variant reads direction on 30 or 31 of 38 cases. The O1 contenders read 23 to 26, with 4 to 7 pairs, so
three of the four would fail step 1. O2's result holds across four weightings and two question shapes. O1's
depends on the ungated wording its author picked.

## What the failures show (post hoc, not pre-registered)

- **Both arms still order pairs and miss on where zero sits.** Each arm puts the build case above the detract
  case in 13 of 14 pairs. Pairs fail when both cases land on one side of zero, as in v2. The profiles move the
  score; the event's surface reading still sets the sign.
- **The eight cases both finals miss share v2's shape.** Each needs a reading past the event's surface.
  - Four are what an act shows about the other's character:
    - a01-5: refusing a gang job as decency.
    - a12-3: setting a gang on another man as cold.
    - a13-2: taking a shard on his own terms as overreach.
    - a05-2: shaming a friend in public as not hers to do.
  - One is a consequence: a02-2, a tenant's night stall during a sweep as risk to her house.
  - Two of the eight are cases the second labeller read the other way (a03-4, a17-1), and a15-1 is the one the
    second labeller called hardest.
  - Splitting meaning into literal questions removed v2's two-hop questions. It did not supply the inference.
- **O2's step weight cost one major case.** a19-1 is a direct threat to burn Mux alive (detract 3). O2's final
  scores it +0.04 because that Mux variant rates only benevolence at 3 or above. Security, rated 2 ("matters"),
  gets weight 0 even though "danger brought closer" read 0.88. The linear and squared weightings score it −0.96 and −0.90. The cause is visible and fixable in code, which is the structural argument below.
- **Neutral handling flipped from v2.** O1 now reads 6 of 6 neutrals right with no gate, because each value's
  choice can say `neither`. O2 reads 4 of 6: a routine order (a18-1) and a routine errand (a09-1) score +0.20 and
  +0.06, just over its band. In v2, O2 led on neutrals.
- **Conflict cases favour O2,** 5 of 6 against 2 of 6. O2 sums many small, signed per-value readings. O1's
  per-value choice must clear 0.6 for one side, which likely drops the weaker side of a conflict (not measured).

## Which docs/jev.md rules each arm leans on

| rule or shape | O1 `nogate-sides-sq` | O2 `d4-top` |
|---|---|---|
| 1 one judgment per question | direction and care asked apart, one request per value | one direction per noul, 40 per encounter |
| 2 literal reading | each choice option a literal per-value statement | concrete surface statements ("bring danger closer to you") |
| 3 no indirection | event judged against the value, not a trait | stake questions about what the other did; deed questions about the act |
| 4 semantic, not numeric | importance as bucket words, the arm's core | no importance reaches Jev |
| 5 no math | code sums | code combines |
| 6 typed reads | one option's probability ≥ 0.6; score by its most probable level | nouls as probabilities; strength by its most probable level |
| 7 small named state | **bent**: identity and history in every request (the author measured it worse without them) | five named fields, one state for 41 nouls |
| 8 aligned criteria | high always means yes | yes always means the statement holds |
| 9 no structural identities | not relied on | up and down nouls asked as separate absolutes |
| 10 hostile text | not addressed | not addressed |
| one noul per candidate | **bent**: a 3-way choice with generic keys (the noul form did worse) | kept |
| composite scoring | per-value answers summed | the core: gate, direction and strength per value, weights in code |
| gate first / chaining | contenders only (a gate only zeroes cases, so it cost pairs) | the touches gate, plus a chained strength request |

## Cost

| | requests | questions | USD per judgment | median ms |
|---|---|---|---|---|
| O1 | 8.0 | 16.1 | 2.6e-4 | 239 |
| O2 | 2.0 | 53.7 | 2.3e-4 | 412 |

O1's request count grows with the number of values the holder holds; O2's stays at two. All v3 runs, dev plus
both held-out runs, made 4,533 judgments with 0 refused, for **1.11 USD**, under the 1.95 ceiling named before
spending. Smoke calls added about 0.0001.

## Limits, including where this still departs from the final system

- **Small held-out set.** It has 44 cases and 14 pairs. Only 9 (M5) and 7 (M1) cases are discordant between the
  arms, so McNemar could detect only a large difference. Pair counts moved by 1 to 2 between dev and held-out.
- **One labeller decides.** The second agrees on 41 of 44, so labels are not the bottleneck. They are still two
  readings of one hand's scenarios.
- **The arms were tuned on 44 dev cases.** O1's final held fewer than half the dev pairs (6 of 14) and passed on
  held-out (8 of 14), within the noise above.
- **Deviations named at the freeze.**
  - O2's step weight, where the prereg says "multiplies".
  - O1's identity and history in every request (rule 7).
  - O1's 3-way choice.
  - O1's [0, 1, 4, 9] map on Jev's care level.
- **The encounter rule is the one shipped, not D33.** `encountersOf` gives the actor and targets only, so no case
  judges the holder's own arrival.
- **Short history.** History is one short scenario, with no stored standing and no memory. The labeller added
  three standing facts to the identities (rent, a debt, three weeks' cover).
- **The renderer is the experiment's own,** and the final system's wording will differ.
- **Jev is close to deterministic.** Five reps measure Jev's own rerun noise, not how far the wording generalizes.
- **Unverified author check.** The O1 author reports a dev-only check: weighting by the true importance in code,
  in place of Jev's `care`, held the same pairs, and dropping importance cut pair ordering. That says Jev does
  apply importance, and that reading the event, not weighting it, is the bottleneck. This session did not rerun
  it.
- **The values are experiment material:** the ten values, the 0 to 4 scale and the nine variants.

## Recommendation

**O2, code applies importance, by the rule's step 5 (cost and structure).** Accuracy does not separate the arms,
and this recommendation does not claim it does.

- **Structure.**
  - It is the split docs/jev.md keeps: "Jev picks; code computes" (line 16). Composite scoring, "weights held in
    code", is one of its measured shapes (line 45).
  - O2's Jev answers carry no importance, so its weighting is code that can be read, tested and retuned on logged
    answers with no new Jev call. Its author compared about 300 weightings that way. a19-1 shows it at work: the
    miss is one line of weighting, visible in the log, and the linear weighting fixes it.
  - O1's weighting sits inside Jev's `care` answer, so every change to it costs a new run. Its request count grows
    with the values held. Its result leaned on one wording: three of its four contenders would fail step 1.
- **Cost.** About equal: 2.3e-4 against 2.6e-4 USD per judgment.
- **What O2 gives up**, measured on held-out:
  - Neutrals: 4 of 6 against O1's 6 of 6.
  - Magnitude within detract cases: ρ 0.11 against 0.52.
  - Latency: 412 ms against 239, because its two requests are chained while O1's run in parallel.
  None of these clears a pre-registered bar. The neutral gap is the one to watch, since standing should not move on
  routine moments.
- **A premise this run assumes, not decides.** The question presupposes a per-NPC importance for each value.
  Whether values are ranked per NPC at all is still open (`docs/explorations/npc-relationships.md:96`). If they
  are not, the comparison is moot.
- **What does not decide but points the same way.**
  - Every O2 variant is at or above every O1 variant on M1.
  - O2 is at or above O1 on both labellers' consensus set.

Two things for the next unit, neither settled here:
1. **The weight function.** `top` dropped a "matters" value and missed a death threat. Linear or squared weighting
   should be chosen on fresh blind labels, not on this held-out set, which is now spent.
2. **The shared failure.** Both arms miss what an act shows about the other's character and its indirect
   consequences: 8 shared misses, 6 of them labelled the same way by both labellers. That step comes before weighting.
   Attacking it means literal questions about the other's conduct and its plain consequences, chained into the
   per-value questions, and it should be tested on its own.
