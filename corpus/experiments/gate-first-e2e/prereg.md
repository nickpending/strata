# Pre-registration: gate-first-e2e

Written 2026-11-12, before any label, any challenger arm or any held-out run exists. Experiment material, not
strata's design: the values are `world/values.toml`'s ten, and importance is 0 to 4 as in `world/people/`. Every Jev
question follows `docs/jev.md`; an arm names any rule it bends and why.

## The question

Design B (D43) reads a relationship judgment in two parts: a per-value stage, where Jev says per value and channel
whether the encounter moved it and which way, and a size step; then a combine in code, weighted by the holder's
importance. value-weighting-4 measured it end to end on held-out cases at pooled ρ 0.55, 0.32 within build and 0.17
within detract (`../value-weighting-4/report.md`). gate-direction found that the per-value stage loses mainly at the
gate: its 40 up and down nouls fire on values the event never touched (gate AUC 0.74 against a 0.93 ceiling), and a
gate asked as its own question lifts that to 0.88 to 0.90 (`../gate-direction/report.md`).

1. **How much of design B's case-level loss does a gate-first per-value stage recover?**
2. **Does importance squared help, on fresh labels?** gate-direction's step 1 found +0.09 ρ on v4's held-out but
   −0.03 on dev, chosen after seeing held-out.

## Arms

Every arm is a module in `arms/` satisfying `contract.ts`. An arm owns only the per-value stage. It never sees an
importance or a label. The combine is the contract's, the same for every arm: design B's, as v4's B computes it.

- **B-lin, the baseline: v4's B as shipped.** `arms/b.ts`, variant `as-is`, scored with linear weights. It is v3's
  `d4` ask (41 nouls including touches, then a chained 3-level strength score for every statement at 0.4 or above),
  ported to `harness/src/jev.ts`. `check-b.ts` verified the port before this file was committed: on all 432 of v4's
  logged B `lin` judgments (dev and held-out), every one of 23,170 questions matches v4's logged text character for
  character, and the contract's combine over the port's readings reproduces v4's logged scores to 1e-15.
- **G: B with a gate-first per-value stage** in place of the 40 up and down nouls. A separate opus author
  (`briefs/author.md`) writes `arms/g.ts` on the dev split:
  - **The per-value stage** is gate-direction's arm B shape: per value and channel a gate noul (touched, main-ness,
    or both read as the lower), then a chained direction choice for what passes the gate. The wording is
    gate-direction's B, unchanged. The author chooses which gate and the threshold, by dev lift on this file's
    deciding metric (E3), ties within 0.02 going to fewer questions.
  - **The same size step:** v3's strength score (`arms/b.ts` `strength4`, the same levels), asked for every item the
    gate passed, on the statement of the direction the choice picked, chained after the direction step.
  - **The same touches:** v3's touches noul (`arms/b.ts` `TOUCHES`), asked as its own step on the same state.
  - **Its reading:** r = gate-direction B's reading (the gate probability signed by the pick, 0 below the
    threshold); effect = r × L, L the size level 1 to 3.
  - **The same linear weights and combine:** the contract's.
- **G-sq: G with importance squared.** G's final, its own answers, scored with w = importance². It asks nothing of
  its own: it is G's judgments under the contract's `sq` combine, so G-sq − G isolates the weighting exactly.
- **C, optional: gate-direction's C wording** (`cw3-z50`, concrete one-sided statements read as P(up) − P(down),
  zeroed under 0.5) in G's place, with the same size step, touches, weights and combine. Only if the author argues
  for it from dev, named at the freeze or not at all.

Secondary, scored for free from logged answers and never deciding: **B-sq** (B's answers, w = importance², v4's
`sq` contender), and up to 3 author contenders of G (3 reps).

## Roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | world/, the engine's rules, events and encounter rule, `../size-judgment/build.ts`, `../value-weighting-2/render.ts` (`briefs/labeller.md`) | docs/, any arm, any experiment's labels, reports or briefs, this file |
| second labeller | opus | the held-out cases rendered, the identities, each holder variant's importances, the catalogue (`briefs/labeller2.md`) | the first labels, any arm, this file |
| G author | opus | the dev split, contract.ts, run.ts, arms/b.ts, docs/jev.md, gate-direction's and v4's reports and arms (`briefs/author.md`) | the held-out split |
| scorer | sonnet | this file, contract.ts, the labels' shape, the dev labels (`briefs/scorer.md`) | the arm modules' source, held-out until the freeze |
| orchestrator (this worker) | opus | everything; writes this file, contract.ts, run.ts, the B port and its check, the briefs, the report | writes no label, no challenger, no scoring code |

## Material

- **Real world, engine-built.** Cases are built by `../size-judgment/build.ts`, unchanged: real actions through
  `Engine.act` and `Engine.step` on `world/`, each case its holder's own received copies with history, rendered by
  `../value-weighting-2/render.ts`, the role from the engine's encounter rule.
- **People and variants.** Rogue, Glitch and Mux, each with one fresh identity, and three importance variants per
  person: `<person>-w`, the world's own table copied from `world/people/<person>.toml`, and `-s` and `-t`, written by
  the labeller to differ sharply.
- **Three sets, A, B and C, of the same make-up**, a scenario's cases always in one set. Per set 40 cases: 12
  opposite pairs (24 cases), 5 conflict, 5 neutral, 6 plain, the plain ones forming 3 size pairs. At least 6
  character cases, 2 of them in opposite pairs; at least 5 exposure cases; every build and detract magnitude 1 to 5
  used at least twice within each direction; every verb, both roles, all 9 variants.
- **Case labels:** `direction` build, detract or neutral; `magnitude` 1 to 5 (0 for neutral), anchored in words
  (`briefs/labeller.md`); `kind`, `pair`, `size_pair`, `character`, `exposure`, `set`, rationale. The signed label is
  ±magnitude, 0 for neutral: 11 points.
- **Per-value labels:** for every case and every value, `stake` and `deed` each `up`, `down` or `none`, judged
  without regard to the variant's importances (what the event did, not how much it matters to this variant).
- **Second labeller,** after the split, labels every held-out case blind on both: case direction and magnitude, and
  the 20 per-value items. It measures the ceiling and never changes a verdict.

## Split

One set is dev, two are held out. The coin is the sha256 of `labels.json` as delivered, read as an integer, mod 3: 0
makes A dev, 1 B, 2 C. The labeller never sees this rule. The held-out files stay outside the repository until the
arms are frozen; their sha256 is recorded here before any arm is written. Held out: 80 cases, 24 opposite pairs.

**Done, before any challenger arm was written.** `labels.json` as delivered has sha256 `864b1e60…7e102fb9` (material
`01a6c809…5362ba`). As an integer mod 3 it is 1, so **B is dev**: 28 scenarios, 40 cases, in `dev-material.json` and
`dev-labels.json`. **A and C are held out**: 56 scenarios, 80 cases, 24 opposite pairs.
- Every set has 40 cases: 12 opposite pairs, 5 conflict, 5 neutral and 6 plain cases forming 3 size pairs. Every
  build and detract magnitude 1 to 5 appears at least twice per set. `character` cases number 7 (A), 9 (B) and 13 (C).
- All 120 cases build through the engine with no error, and no scenario spans two sets. The `-w` variants equal the
  world's tables.
- In all 36 opposite pairs, the two cases carry identical per-value labels, as the brief asked.
- Security and power lead stake touches in every set. Conformity and benevolence are thin (stake benevolence 1 to 5
  per set).
- The held-out files, kept outside the repository until the freeze, have these sha256:
  - `heldout-material.json` `e04f6d9e578e4d0a5d4428fc91692c6b31267293da9cf431f6eda3516f578fcc`
  - `heldout-labels.json` `69e854c64b079dba384e5b8b5daaf00d597ae1b3e7f5ddfb59abf5a629304558`
- `score.ts` was written by the sonnet scorer before any challenger arm existed. On a dev run of arm B (2 reps, 0.020
  USD), its E1 (26/35) and E3 (0.515) match an independent recomputation.

## Jev

Every request goes through `harness/src/jev.ts` `decide`. A refused request makes the judgment refused.

## Scoring (held-out split; per scored arm; a case's score is the mean over its reps)

The case **label** y is the first labeller's signed label (−5 to 5). The per-value **label** is +1 up, −1 down, 0
none; an item is touched when it is not 0.

Case level, primary:
- **E1 direction.** Over build and detract cases, the share whose mean score has the label's sign. A score of exactly
  0 is wrong. Also per rep.
- **E2 opposite pairs held.** Pairs where both cases are right by E1.
- **E3 pooled ρ (decides).** Spearman between mean score and y over all held-out cases, neutrals included.
- **E4 within-direction ρ.** Spearman between score and magnitude over build cases, and between −score and magnitude
  over detract cases. With magnitude 1 to 5 used across the range, these are measurable here as v4's 1 to 3 was not.

Case level, reported: **E5** three-way accuracy at band 0.05 (v4's), neutral |score| median and max; **E6** conflict
direction, character direction, exposure direction, size pairs ordered; **E7** rerun spread (median and max over
cases of max − min score over reps); **E8** requests, questions, USD and median ms per judgment.

Per-value stage, primary (gate-direction's freeze addendum: with most labels 0, item ρ is capped, so it is not
used):
- **P1 gate AUC.** AUC of |r| (mean over reps), touched against untouched items, ties counting half. Overall and per
  channel.
- **P2 direction among fired.** Over touched items whose |r| ≥ 0.5, the share with the label's sign, and how many
  fired. Also direction over all touched items, a reading of 0 counting wrong (gate-direction's M2), reported.
- **P3 per value.** P1 and P2 per value, both channels pooled, with the n of touched items. Conformity and
  benevolence are reported whatever their n.

Ceiling: the second labeller scored as an arm. Case: its signed label as the score, E1 to E4 against the first.
Per value: its labels as r, P1 and P2. Also the consensus subset (cases where both labellers give the same
direction), with E1 and E3 per arm over it.

## Stage attribution, decided now (bounds from logged answers; no Jev; never decides)

For B-lin and G (and C if frozen), E1, E3 and E4 recomputed on held-out with one stage swapped for the labels:
- **gate oracle:** effect := 0 on every item labelled none;
- **direction oracle:** on every touched item, effect := y_item × |effect|;
- **gate and direction oracle:** both;
- **no touches:** touches := 1;
- **labels only:** effect := 2 × y_item on every item, touches := 1, with linear and with squared weights. It uses
  no Jev answer: the combine's own ceiling on these labels.

The report states the share of B-lin's gap that G recovers, (E3_G − E3_B) / (E3_ceiling − E3_B), with the ceiling
taken both as the second labeller's E3 and as B's gate-and-direction oracle.

## Comparisons, decided now

1. **Gate fix:** G against B-lin. **Squared:** G-sq against G. If C is frozen, **C against B-lin** too. k is the
   number of comparisons (2 or 3).
2. Each is decided on **E3** by a paired scenario bootstrap: 10,000 resamples of held-out scenarios with replacement,
   seeded 20261112, the statistic the difference of E3 over the resampled cases. The interval is 1 − 0.05/k. The
   challenger **wins** when the lower bound is above 0, **loses** when the upper bound is below 0, and otherwise
   **ties**.
3. E1, E2 and E4 are reported for each comparison as description: E1 and E2 with exact two-sided McNemar tests, E4
   with the same bootstrap. They never change a verdict.
4. **Recommendation:** if G wins, G replaces B's per-value stage. Squared replaces linear only if G-sq wins against G.
   If C is frozen and both C and G win against B-lin, the one with the higher E3 is recommended; within 0.02, the one
   with fewer questions.

The secondary run, B-sq, the attribution swaps and the consensus subset never change a verdict.

## Tuning

The G author tunes on the dev split only, with at most 10 variants, dev spend at most 0.40 USD. It names one final
and up to 3 contenders. Wording is gate-direction's, unchanged; nothing names a dev case, scenario, variant or a
fact only a dev scenario holds.

## Runs and cost, named before spending

| run | judgments | at most |
|---|---|---|
| author dev tuning | as needed | 0.40 USD |
| held-out finals: B and G (and C), 80 cases × 5 reps, one run, order rotated per rep | 800 (1,200) | 0.54 USD |
| secondary: up to 3 G contenders, 80 × 3 reps | up to 720 | 0.33 USD |
| **ceiling** | | **1.27 USD** |

Basis: v4's B costs 2.3e-4 USD per judgment and gate-direction's `mg3-45` 2.5e-4 before the touches and size steps;
each bound assumes 4.5e-4. Agent work besides: two opus labellers, one opus author, one sonnet scorer. Raw judgments
stay local under `corpus/runs/gate-first-e2e/` (gitignored).
