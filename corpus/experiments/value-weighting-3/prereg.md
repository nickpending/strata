# Pre-registration: value-weighting-3

Written 2026-11-07, before any label, arm or held-out run exists. Experiment material, not strata's design:
Schwartz's ten values (`catalogue.json`) and the 0 to 4 importance scale exist only for this test.

## The question

When an encounter touches an NPC's values, is the NPC's per-value importance applied by Jev (O1) or by code (O2)?
The two earlier runs (`../value-weighting/`, `../value-weighting-2/`) decided nothing because they broke
`docs/jev.md` (6d7293d): bare importance numbers, one five-way choice read by its expectation, two-hop
interpretation questions, one large state sent to every question. This run builds both arms at their best under
`docs/jev.md` and changes nothing else that v2 got right.

## Material and roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | world/, the engine's rules, events and encounter rule, `../value-weighting-2/build.ts` and `render.ts`, catalogue.json | any arm, docs/jev.md, bench-automation.md, any earlier experiment's material, labels, report or scoring, this file |
| second labeller | opus | the held-out material, rendered | the first labeller's labels, kinds and pairs; the arms; this file |
| O1 author | opus | the dev split, v2's 64 cases and labels (optional extra dev), contract.ts, jev3.ts, run.ts, score.ts, docs/jev.md, bench-automation.md, v2's report, TypeSafe's docs | the held-out split, the O2 module |
| O2 author | opus | the same | the held-out split, the O1 module |
| scorer | sonnet | this file, judgments.jsonl, labels, v2's score.ts | the arm modules' source |
| orchestrator (this session) | opus | everything; writes jev3.ts, contract.ts, run.ts, this file, the report | writes no arm, no label and no scoring code |

- **Real world, engine-produced copies.** Cases are built by `../value-weighting-2/build.ts`, unchanged: every
  scenario is a script of real actions and clock steps driven through `Engine.act` and `Engine.step` on `world/`,
  and each case is what its holder received, rendered field by field by `../value-weighting-2/render.ts`. The
  role (direct or witnessed) comes from `encountersOf`. The holder's earlier copies in the scenario are its short
  history (1 to 8 lines).
- **Fresh material.** v2's held-out set is spent. The labeller writes new identities, nine new variants (three
  each of Rogue, Glitch and Mux, ids `-p`, `-q`, `-r`), new scenarios and labels, in two sets A and B of matching
  make-up, a scenario's cases always in one set. Per set: 14 opposite pairs, 6 conflict, 6 neutral, 4 plain (44
  cases). Every target event kind and both roles appear across the sets.
- **Labels**: direction build, detract or neutral; magnitude 1 to 3 (0 for neutral); kind plain, opposite,
  conflict or neutral; the opposite partner; the set; a rationale. The labeller judges from the rendered view,
  the identity and the variant's importances, and is told nothing about what importance does or how anything
  will judge.
- **Second labeller.** After the split, a second opus labeller labels the held-out cases (direction and
  magnitude) from the same view, blind to the first labeller's labels, kinds and pairs. Its labels measure the
  ceiling. They never change the verdict.

## Split

The coin is the first hex digit of the sha256 of `labels.json` as delivered: even means A is dev, odd means B is
dev. The labeller never sees this rule. The held-out set's material and labels stay outside the repository until
both arms are frozen, and their sha256 is recorded here before any arm exists.

**Done, before any arm was written.** `labels.json` as delivered has sha256 `5bd13fad…f9c7c480aa` (material
`7dd999da…7fc81c`): first digit `5`, odd, so **B is dev** (24 scenarios, 44 cases: `dev-material.json`,
`dev-labels.json`) and **A is held out** (19 scenarios, 44 cases). Each set has 14 opposite pairs, 6 conflict, 6
neutral and 4 plain cases; every event kind and all nine variants appear in both. The labeller added three standing
facts to the identities: Mux rents the Back Room from Rogue, Glitch owes Mux for his last two cells, and Glitch has
lain low in the bar for three weeks on Rogue's leave. The held-out files, kept outside the repository until the
freeze, have these sha256:

- `heldout-material.json` `d6bf01bc8d8e0f754cc89cb2dc01779ab14742381bff17a1fc6094a3f5a7b2b5`
- `heldout-labels.json` `619e1b025a14463e7ee1f5a11b22a97168d9ac1e34cf3e2a8f9f37a0d2b0704f`

## Jev

Every request goes through `jev3.ts`: the harness's `postJson`, key resolution, model id and cost reading,
unchanged, with a JSON-object state and the score type, which `harness/src/jev.ts` `decide` does not parse. A
judgment is one or more requests, each a named step, and a later step's state may carry earlier answers
(docs/jev.md, "Chaining"). A refused request makes the judgment refused.

## The arms

Each arm is a module (`arms/o1.ts`, `arms/o2.ts`) satisfying `contract.ts`, written by its own author, told to
make it as good as it can be under `docs/jev.md`. Rules for both:
- **Literal questions.** Interpretation is reduced to direct, literal questions about what is visible in the
  event from the holder's side (docs/jev.md rules 1 to 3). Where meaning needs a hop, it is split into a further
  literal question or a chained step, combined in code.
- **Small named state.** Each request's state is a JSON object holding only the fields its questions need, and
  the instructions name the fields (rule 7).
- **Answers used as typed.** A noul's probability may be thresholded or used as a probability. A choice is used
  by its chosen option, or one option's probability against a threshold. A score is used by its most probable
  level, or its value against a threshold. No magnitude comes from a choice's or a score's expectation or from a
  weighted average of options (rule 6).
- No number from an importance ever reaches Jev (rule 4).

**O1, Jev applies importance.** Importance reaches Jev only as named words in a state ("central to who you are",
"matters a lot", ...). Code may leave out values whose bucket is "does not matter". Nothing else may depend on
an importance: not which questions are asked, not which steps run, and not the score, whose type receives none.

**O2, code applies importance.** Jev never sees an importance. Per value: a gate (did this encounter touch it at
all), a direction (advanced or set back) and a strength, each asked as the question type that fits; strength is
used only as a bucket or against a threshold. Code multiplies by the holder's importance and combines. The
starting candidate is a noul gate, a noul or choice for direction and a score bucket for strength; reverie's
touches-plus-change nouls (bench-automation finding 3) are the precedent to beat. Chaining, such as a gate
request first, is allowed.

**Tuning.** Each author tunes on the dev split only (v2's 64 cases may be added as extra dev), with at most 12
variants and at most 0.60 USD of dev calls, names one `final` and up to 4 `contenders`, and reports which
docs/jev.md rules the final leans on.

## Runs

- Dev: whatever each author runs within the budget, tagged `dev-o1-*` or `dev-o2-*`.
- Held-out, after the freeze commit: both finals, 5 reps per case, in one
  `run.ts --arms o1,o2 --variants final --reps 5` run with the order rotated per rep. Then each arm's named
  contenders, 3 reps, as a secondary run that never decides.
- Raw judgments stay local under `corpus/runs/value-weighting-3/`.
- **Cost, named before spending.** Dev at most 0.60 USD per arm (1.20). Held-out finals 44 cases x 5 reps x 2
  arms = 440 judgments, at most 5e-4 USD each (0.22). Secondary at most 8 variants x 44 x 3 = 1,056 judgments
  (0.53). Ceiling about 1.95 USD. Measured so far: a 3-question request costs about 1.9e-5 USD, a 1-question
  request about 1.4e-5.

## Scoring (per arm and variant, held-out split; case score = mean over its reps)

As v2, with M7 widened for chained requests.
- **M1 direction.** On build and detract cases, the sign of the case score matches the label. Reported on the
  mean and per rep.
- **M2 magnitude.** Spearman ρ between case score and signed label (+magnitude build, −magnitude detract, 0
  neutral) over all cases; also within build and within detract, reported only.
- **M3 opposite pairs.** A pair holds when both of its cases get the right sign.
- **M4 conflict.** M1 restricted to conflict cases that are build or detract.
- **M5 three-way.** A case reads neutral when |score| < the arm's band, else by sign. Accuracy over all cases;
  also neutral hits, false neutrals, and the neutral cases' |score| median and max.
- **M6 noise.** Per case, the spread of scores over reps (max − min), median and max; the range of per-rep M1
  and M5 counts.
- **M7 cost.** Requests per judgment, questions per judgment, mean USD per judgment, median ms per judgment.
- **Second labeller (reported, never decides).** Direction agreement with the first labeller over held-out cases,
  and Spearman between their signed labels. M1, M3 and M5 again on the consensus subset: cases where both
  labellers give the same direction (a pair counts only when both its cases are in the subset).

## Comparison, decided now

1. An arm holding fewer than half the opposite pairs (M3) is disqualified: telling profiles apart is the point.
   One disqualified, the other wins; both, no verdict.
2. Otherwise, **M5** decides when the arms differ significantly on it: an exact two-sided McNemar test over
   held-out cases, p < 0.05.
3. If not, **M1** decides by the same test over build and detract cases.
4. If not, an **M2** difference above 0.10 decides.
5. Otherwise the arms tie on accuracy, and the recommendation rests on cost and structure, named as such.

The secondary run and the consensus subset are reported to show how much each arm depends on its wording and on
one labeller. They never change the verdict.
