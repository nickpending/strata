# Pre-registration: gate-direction step 2

Written 2026-11-12, before any label, arm or held-out run exists. Step 1 (`report.md`, `step1.md`, commit 1da5f32)
named design B's per-value stake and deed nouls as the main loss, but v4's labels carry no per-value truth, so it
could not say whether the loss is the gate (a value fires that the event did not touch, or a touched value stays
quiet) or the direction (a touched value fires the wrong way). This run isolates that one stage. Every Jev question
follows `docs/jev.md`; an arm names any rule it bends and why.

## The question

Given a case (the holder's identity, what it received before, the encounter, its part in it) and one value, does
Jev's reading say whether the encounter touched that value for the holder, and which way? Per channel:
- **stake:** did the encounter advance (`up`) or set back (`down`) the holder's own share of the value, or neither
  (`none`);
- **deed:** did the other, in this act, act for the value (`up`) or against it (`down`), or neither (`none`).

No importance, no size, no touches gate and no weighting is in play. Those are code stages, and step 1 measured
them.

## Material (a blind opus labeller, `briefs/labeller.md`)

- **Real world, engine-built.** Scenarios are scripts of real actions driven through `Engine.act` and `Engine.step`
  on `world/` by `../size-judgment/build.ts`, unchanged. It reads the engine's own encounter rule (`Engine.encounters`).
  Each case is what its holder received, rendered by `../value-weighting-2/render.ts`.
- **Labels.** Per case, every one of the ten values in `world/values.toml`, on both channels: `up`, `down` or `none`.
  That is 20 items per case.
- **Three sets, A, B and C, of the same make-up.** A scenario's cases are all in one set. Per set:
  - at least 24 cases in at least 8 scenarios;
  - all three people as holders, both roles, at least 5 different verbs as target events;
  - stake: at least 12 `up` and 12 `down` items; deed: at least 10 `up` and 10 `down`;
  - at least 5 values touched on stake at least 4 times each;
  - at least 6 cases whose stake label turns on what the act exposes the holder to or lets happen to them later;
  - at least 6 cases where what the act says about the other differs from what it does to the holder's stake;
  - at least 4 cases where two values move opposite ways;
  - at least 3 routine cases that touch nothing for the holder on either channel.

  These are described to the labeller by what decides a label, never by any mechanism. It is told nothing about what
  will be judged against the labels, or how.
- **The labeller never sees** `docs/`, any experiment's arms, labels, reports or briefs, this file, or `corpus/runs/`.

## Split

The coin is the sha256 of `labels.json` as delivered, read as an integer, mod 3: 0 makes A dev, 1 makes B dev, 2
makes C dev. The labeller never sees this rule. The held-out material and labels stay outside the repository until
the arms are frozen; their sha256 is recorded here before any arm exists.

## Second labeller (opus, `briefs/labeller2.md`)

After the split and before the freeze, a second opus labeller labels every held-out item blind. It sees the rendered
cases (scenario ids removed), the identities and the catalogue. It never sees the first labels or any arm. Its labels
measure the ceiling and never change the verdict.

## Arms (`contract.ts`)

An arm sees the built case and the catalogue, never a label and never an importance. Per case it returns one
**reading** per item (`<channel>__<value>`, all 20), a number from −1 to 1: its sign is the direction, and its
absolute value is how clearly the item fired. Code computes a reading from Jev answers. Nouls may be used as
probabilities; a score or choice is read by its most probable level or option only (rule 6).

- **A, `as-is`: design B's gate request, unchanged.** It is the 40 stake and deed nouls of value-weighting-3's `d4`
  family (`../value-weighting-3/arms/o2.ts`, `S` and `READ`), in one request on the same five-field state. Reading =
  P(up) − P(down). The author ports it character for character, and the orchestrator checks every question's text
  against v4's logged requests before the freeze. The touches noul and the `how` step aren't part of this stage, so
  they are dropped.
- **B and C: challengers** by a separate opus author (`briefs/author.md`), each one wording or shape of this stage.
  The author chooses them by measured dev lift and names the docs/jev.md rules each leans on and bends. Up to 12
  variants per module, one `final` and up to 3 `contenders`.

## Roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | world/, the engine's rules, events and encounter rule, `../size-judgment/build.ts`, `../value-weighting-2/render.ts` | docs/, any arm, any experiment's labels, reports or briefs, this file |
| second labeller | opus | the held-out cases, rendered; the identities; the catalogue | the first labels; any arm; this file |
| arm author | opus | the dev split, contract.ts, run.ts, docs/jev.md, step 1's report, v3's and v4's arms and reports, v4's logs | the held-out split |
| scorer | sonnet | this file, contract.ts, the labels' shape | the arm modules' source |
| orchestrator (this session) | opus | everything; writes this file, contract.ts, run.ts, the briefs, the report | writes no label, no challenger, no scoring code |

## Jev

Every request goes through `harness/src/jev.ts` `decide`. A refused request makes the judgment refused.

## Scoring (held-out split; per arm and variant; every metric per rep, then the mean over reps)

The **reading** r is the arm's number; the **label** y is +1 (`up`), −1 (`down`) or 0 (`none`). An item is
**touched** when y ≠ 0.

- **M1 (primary): item ρ.** Spearman between r and y over all held-out items, both channels.
- **M2 direction.** Over touched items, the share with sign(r) = y. A reading of exactly 0 counts as wrong.
- **M3 gate.** AUC of |r|, touched against untouched items (ties count half).
- **M4 per channel.** M1, M2 and M3 for stake and for deed apart.
- **M5 per value.** M2 and M3 for each value with 8 or more touched held-out items.
- **M6 false fires and misses at 0.5.** Untouched items with |r| ≥ 0.5, and touched items with |r| < 0.5 or the wrong
  sign. This is reported only; no threshold decides anything.
- **M7 noise.** The share of items whose sign(r) changes across reps; the SD of M1 over reps.
- **M8 cost.** Requests, questions, USD and median ms per judgment (one case).
- **Ceiling.** The second labeller's labels scored as an arm (r = its label): M1, M2 and M3, overall and per channel.
  There is also a consensus subset (items where both labellers agree), with M1 and M2 per arm over it.

## Comparison, decided now

1. Each challenger's final is compared with A's final on M1 by a paired scenario bootstrap: 10,000 resamples of
   held-out scenarios with replacement, seeded. The statistic is the difference of mean-over-reps M1. There are two
   challengers, so the interval is 97.5% (Bonferroni). A challenger **beats A** when its interval's lower bound is
   above 0.
2. The recommended arm is the beater with the highest M1. If both beat A and sit within 0.02 of each other, the one
   with fewer questions per judgment wins. With no beater, A is recommended.
3. **Grade** of the recommended arm:
   - (a) M1 ≥ ceiling M1 − 0.10;
   - (b) M2 ≥ 0.85;
   - (c) M3 ≥ 0.85.

   All three hold: **yes**. (a) fails but (b) and (c) hold: **partly**. Otherwise: **no**.
4. **The stage localises** whichever way the arms come out. For A, the report names gate or direction as the larger
   loss by comparing (1 − M3) with (1 − M2) on held-out, and names the weaker channel by M4.

The secondary run (contenders, 3 reps) and the consensus subset never change a verdict.

## Runs and cost, named before spending

| run | judgments | at most |
|---|---|---|
| author dev tuning | as needed | 0.40 USD |
| held-out finals: A, B, C, about 48 cases × 5 reps, one run, order rotated per rep | about 720 | 0.30 USD |
| secondary: up to 3 contenders per challenger, about 48 × 3 reps | up to 864 | 0.35 USD |
| **ceiling** | | **1.05 USD** |

The basis is v4's B: 2.3e-4 USD per judgment for 54 questions in two requests. Each bound assumes 4e-4. Raw judgments
stay local under `corpus/runs/gate-direction/` (gitignored).

## Split, done before any arm was written

`labels.json` as delivered has sha256 `eceb3f59…6f41c8bf3` (material `2dff7420…829a7910`). As an integer mod 3 it is
1, so **B is dev**: 12 scenarios, 36 cases, 720 items, in `dev-material.json` and `dev-labels.json`. **A and C are
held out**: 28 scenarios, 79 cases, 1,580 items.
- Held-out stake has 39 `up` and 61 `down`; deed has 68 `up` and 20 `down`.
- Set C came in larger than the make-up's minimum (43 cases, against 36 for A and B). Every set meets every minimum.
- All 115 cases build through the engine with no error, and no scenario spans two sets.
- The labeller noted that security takes about 40% of stake touches in each set.

The held-out files stay outside the repository until the freeze. Their sha256:

- `heldout-material.json` `a9d4237416e53de319dd3212419377202b49d25adbff3d0f472142b2a04eac36`
- `heldout-labels.json` `11f00944de36f9be01e0c3639756e3d869e10033d04d1e3176543090fed50b09`

**Cost, restated for 79 held-out cases.** This is before any spend.

| run | at most |
|---|---|
| author dev | 0.40 USD |
| finals: 79 × 5 × 3 = 1,185 judgments | 0.47 USD |
| contenders: up to 79 × 3 × 6 = 1,422 judgments | 0.57 USD |
| **ceiling** | **1.44 USD** |

That stays under the 2 USD line the brief set. The scorer (`score.ts`, sonnet, written from this file with no labels
in hand) is committed with this split.

## Freeze addendum

This addendum was written after tuning and before any held-out run. The arms are frozen in the commit that adds it,
and nothing in `arms/` changes after that commit. The orchestrator checked these things:
- A's 40 question texts and its five-field state match v4's logged gate request (case A01a) key for key. That is 40
  of 40, with no mismatch.
- No arm imports a label, and no `judge` receives an importance.
- No challenger's wording names a proper noun or fact from a dev scenario. A script scanned the string literals
  against dev text not found in the identities or `world/`, and found only generic words.

**Finals.** Dev figures are 36 cases × 2 reps, as M1 / M2 / M3, and dev spend was 0.196 USD.
- **A `as-is`:** 0.380 / 0.882 / 0.743.
- **B `mg3-45`:** 0.585 / 0.876 / 0.898. Per value and channel, two gate nouls ("does it change X, either way" and
  "is X one of the main ways"), read as their minimum G. A direction choice is chained where G ≥ 0.45. The reading is
  G signed by the choice, else 0. Contenders: `m3-45`, `g3-40`, `mg3-50`.
- **C `cw3-z50`:** 0.603 / 0.906 / 0.926. A's shape of one-sided up and down nouls, each reworded as a concrete
  situation with an "Answer no if ..." boundary. The reading is the stronger noul signed by its side, and 0 when it is
  under 0.5. Contenders: `cw3-z60`, `cw-z50`. `cw-z50` is the wording written before any dev answer was read, kept as
  a check on fitting.

**A flaw in M1, found on dev and named before held-out.**
- About 88% of items are untouched (y = 0). Under that mix, a reading with no exact zeros cannot reach a Spearman
  much above 0.56, even with a perfect ranking.
- B and C each read weak items as exactly 0, so part of their M1 lead over A comes from that zeroing, which is a code
  choice, not from how they ask.
- **The rule above stands unchanged and decides the verdict.** Changing it now would be a change made after seeing
  dev results.
- To separate wording from zeroing, one analysis is fixed now. It is reported and never decides: **A-z50**, A's own
  held-out answers rescored with C's reading rule, at no Jev cost. The reading is sign × max(P(up), P(down)) when
  that max is ≥ 0.5, else 0, with the sign + when P(up) ≥ P(down).
- The report compares B and C with A-z50 on M1, M2 and M3, and names how much of each challenger's M1 lead the
  zeroing alone recovers.
- M2 and M3, which are threshold-free on wording, are reported beside M1 throughout.

**Second labeller.** It labelled all 79 held-out cases blind under opaque ids before this freeze.
`heldout-labels2.json` has sha256 `0c640adc5cffa7883405fb3bb9d3fc64c79c4abf2e9c4681a3f4a57c7f8b1534`. The arm author
never saw it.

**Held-out runs, named now.**
- **Finals:** `--arms a,b,c --variants final --reps 5`, 79 × 5 × 3 = 1,185 judgments.
- **Secondary:** `--arms b,c --variants contenders --reps 3`, 79 × 3 × 5 = 1,185 judgments.
