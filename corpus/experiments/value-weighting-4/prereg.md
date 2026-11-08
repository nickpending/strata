# Pre-registration: value-weighting-4

Written 2026-11-08, before any label, arm or held-out run exists. Experiment material, not strata's design:
Schwartz's ten values (`../value-weighting-3/catalogue.json`) and the 0 to 4 importance scale exist only for this
test. Every Jev question follows `docs/jev.md`; an arm names any rule it bends and why.

## The question

value-weighting-3 recommended O2, code applies importance (`../value-weighting-3/report.md`). Its final held 9 of 14
pairs and missed eight cases that both arms missed, four of them readings of what an act shows about the other's
character. Does adding a **congruence channel** to O2 close that gap, over O2 with two measured fixes alone?

- **Congruence**: per value, a direct question about the actor: does what the other did show that they care about
  this value, and does it show them acting against it. An actor showing a value the holder holds builds; violating
  it detracts. Code weighs it by the holder's importance.
- **The two fixes**, in every arm: a weighting that does not zero a value rated "matters" (v3's `top` step zeroed a
  death threat on a19-1), and a gate threshold on the touches noul so routine acts read neutral (v3's O2 read 4 of
  6 neutrals).

**A finding before design, checked against the code.** v3's O2 already has an actor channel. Its `deed` nouls ask
whether the other acted for or against each value ("Did {o} protect someone from danger or trouble?"), and its
header cites value-similarity as the reason (`../value-weighting-3/arms/o2.ts:20-23`). So the gap is not that O2
never asks about the actor. On the missed cases the deed nouls did fire: a01-5 `deed__universalism__up` 0.62 on a
value rated 2, weighted 0 by `top` and then multiplied by touches 0.19; a12-3 `deed__universalism__down` 0.52
against `stake__benevolence__up` 0.85 (v3 held-out log, O2 final, rep 0). What this run tests is a different
question: a value-level reading of the actor ("shows they care about <value description>") in place of, or beside,
deed's concrete act descriptions, with weighting and gating that let it count. The congruence question is closer to
docs/jev.md rule 3's warned shape ("Does a lapsed offer show restraint?") than deed is; the C author measures it, and
names the bend if kept.

## Arms

Every arm is a module in `arms/` satisfying `contract.ts`: each variant is v3's `O2Variant`, so Jev never sees an
importance and only `score` (code) reads them.

- **B, baseline: v3's O2 with the two fixes.** The questions are v3's `d4` family, unchanged (imported from
  `../value-weighting-3/arms/o2.ts`). The author chooses, each by measured dev lift: the weight function of
  importance (linear, as the brief starts from, or another chosen on v3's logged answers and this run's dev, but
  never one that gives weight 0 to importance 2 or more); the touches gate threshold τ (score 0 when P(touches) < τ);
  whether P(touches) still multiplies the score; the band.
- **C, B plus congruence.** B's final, frozen, with one added channel: per value, a noul that the other's act shows
  them caring about the value and a mirror noul that it shows them acting against it, worded under docs/jev.md (one
  literal judgment each; value descriptions from the catalogue or the author's literal paraphrase; never an
  importance). They join B's request or a chained one. Code combines them with the holder's importance and with B's
  score in one plain weighted combination. The author tunes the wording, the combination weight, whether B's gate
  and touches multiplier apply to the channel, and the band, and justifies each knob by measured dev lift.
- **C2, optional,** only if the C author's dev data argues for it (for example, congruence only on the holder's
  highest-importance values). Named at the freeze, before the held-out run, or not at all.

## Material and roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | world/, the engine's rules, events and encounter rule, `../value-weighting-2/build.ts` and `render.ts`, the catalogue (`briefs/labeller.md`) | docs/, any arm, any earlier experiment's material, labels, report or scoring, this file |
| second labeller | opus | the held-out material, rendered, with identities and importances | the first labeller's labels, kinds, pairs and `character` flags; the arms; this file |
| B author | opus | the dev split, v3's material, labels and logs, contract.ts, jev3.ts, run.ts, score.ts, docs/jev.md, v3's report and arms | the held-out split, the C module |
| C author | opus | the same, plus the frozen B module | the held-out split |
| scorer | sonnet | this file, judgments, labels, v3's score.ts | the arm modules' source |
| orchestrator (this session) | opus | everything; writes contract.ts, run.ts, this file, the briefs, the report | writes no arm, no label and no scoring code |

- **Real world, engine-produced copies.** Cases are built by `../value-weighting-2/build.ts`, unchanged, driving
  real actions through `Engine.act` and `Engine.step` on `world/`. Each case is what its holder received, rendered by
  `../value-weighting-2/render.ts`; the role comes from `encountersOf`.
- **Fresh material.** v3's held-out set is spent. The labeller writes new identities, nine new variants (`-s`, `-t`,
  `-u` of Rogue, Glitch and Mux), new scenarios and labels in three sets A, B and C of matching make-up, a scenario's
  cases always in one set. Per set: 12 opposite pairs, 4 conflict, 4 neutral, 4 plain (36 cases); at least 6 cases
  flagged `character` (the label rests mainly on what the act says about the other, not what it does to the holder),
  at least 2 of them opposite pairs. Every verb and both roles appear in every set.
- **Labels**: direction, magnitude 1 to 3 (0 neutral), kind, opposite partner, set, `character`, rationale. The
  labeller is told nothing about what will be judged against the labels or how; it is told to include character
  cases, described by what decides the label, never by any mechanism.
- **Second labeller.** After the split, it labels every held-out case (direction, magnitude) blind. It measures the
  ceiling and never changes the verdict.

## Split

One set is dev, two are held out. The coin is the sha256 of `labels.json` as delivered, read as an integer, mod 3:
0 makes A dev, 1 makes B dev, 2 makes C dev. The labeller never sees this rule. The held-out material and labels stay
outside the repository until the arms are frozen, and their sha256 is recorded here before any arm exists. Held out:
72 cases, 24 opposite pairs, 8 conflict, 8 neutral, at least 12 character cases.

**Done, before any arm was written.** `labels.json` as delivered has sha256 `48e0db33…c0499ea` (material
`d79eb38f…3781`); as an integer mod 3 it is 2, so **C is dev** (12 scenarios, 36 cases: `dev-material.json`,
`dev-labels.json`) and **A and B are held out** (24 scenarios, 72 cases). Each set has 12 opposite pairs, 4 conflict,
4 neutral and 4 plain cases, 15 build and 17 detract; `character` cases number 14 (A), 12 (B) and 15 (C). All 108
cases build through the engine with no error, every set uses all nine variants and both roles, and no scenario spans
two sets. The held-out files, kept outside the repository until the freeze, have these sha256:

- `heldout-material.json` `72e5cf1bcfa7abd9ad0839de2fd02b67364f0209c86a7b63be7d0485352435ed`
- `heldout-labels.json` `3befa7faf2bac769735aec2b04d6ba5ebcbeea1458449f99ef11ef949e85ec03`

## Jev

Every request goes through `../value-weighting-3/jev3.ts`, unchanged (strata#15 covers the harness client's gap).
A judgment may chain requests. A refused request makes the judgment refused.

## Tuning

Dev split only, plus v3's 88 labelled cases and their logged answers (dev and held-out, both now spent for any
verdict). At most 12 variants per module. Dev spend at most 0.20 USD for B, 0.60 USD for C. Each author names one
`final` and up to 4 `contenders`, a `band` per variant, and the docs/jev.md rules the final leans on and bends.
Wording is per value or per channel; nothing names a dev case, scenario, variant or a fact only a dev scenario holds.

## Runs and cost, named before spending

| run | judgments | at most |
|---|---|---|
| B dev | as needed | 0.20 USD |
| C dev | as needed | 0.60 USD |
| held-out finals: B, C (and C2), 72 cases x 5 reps, one run, order rotated per rep | 720 (1,080) | 0.43 USD |
| secondary: each module's contenders, 72 x 3 reps | up to 1,728 | 0.69 USD |
| **ceiling** | | **1.92 USD** |

Basis: v3's O2 cost 2.3e-4 USD per judgment; each bound assumes 4e-4. Raw judgments stay local under
`corpus/runs/value-weighting-4/` (gitignored).

## Scoring (per arm and variant, held-out split; case score = the mean over its reps)

v3's M1 to M7 (`../value-weighting-3/prereg.md`, "Scoring"), unchanged in meaning:
- **M1** direction on build and detract cases, on the mean and per rep. **M2** Spearman ρ against the signed label,
  all cases, within build and within detract. **M3** opposite pairs held. **M4** conflict direction. **M5** three-way
  accuracy with the arm's band, plus neutral hits, false neutrals, and the neutral cases' |score| median and max.
  **M6** rerun spread. **M7** requests, questions, USD and median ms per judgment.
- **M8 character (new, reported).** M1 restricted to the labeller's `character` cases that are build or detract, and
  the character opposite pairs held. An exact McNemar between the two arms on M8 is printed and never decides.
- **Second labeller,** as in v3: agreement, Spearman, and M1, M3, M5 on the consensus subset. Never decides.

## Comparison, decided now

Each challenger (C, and C2 if frozen) is compared with B on its own:
1. An arm holding fewer than half the opposite pairs (M3) is disqualified. One disqualified, the other wins; both,
   no verdict.
2. Otherwise **M5** decides when the arms differ by an exact two-sided McNemar test over held-out cases, p < 0.05.
3. If not, **M1** decides by the same test over build and detract cases.
4. If not, an **M2** difference above 0.10 decides.
5. Otherwise they tie on accuracy, and B is recommended: it asks fewer questions.

**Congruence moved the needle** when C (or C2) wins at step 2, 3 or 4. Otherwise the report says it did not, and gives
the differences on every metric, M8 included, as description. With C2 there are two comparisons against B; the
report names that, and a C2 win at p between 0.025 and 0.05 is reported as not surviving a Bonferroni correction.

The secondary run and the consensus subset never change a verdict.
