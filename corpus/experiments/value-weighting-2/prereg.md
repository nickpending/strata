# Pre-registration: value-weighting-2

Written 2026-11-07, before any arm exists and before any held-out run. Experiment material, not strata's
design: Schwartz's ten values (`catalogue.json`) and the 0 to 4 importance scale exist only for this test.

## The question

When an encounter touches an NPC's values, does Jev apply the NPC's importance weights (O1), or does code (O2)?
This reruns `../value-weighting/` (2c42917, f831fcd), whose O1 was a bare number list in one phrasing, whose
labeller was told importance is an amplifier, and whose arms and scoring came from one agent.

## Material and roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | world/, the engine's rules and events, catalogue.json, build.ts, render.ts | the arms, this file's arm section, any formula, the first run |
| O1 author | opus | the dev split (cases and labels), contract.ts, run.ts, score.ts | the held-out split, the O2 module |
| O2 author | opus | the same | the held-out split, the O1 module |
| scorer | sonnet | this file, calls.jsonl, labels | the arm modules' source |
| orchestrator (this session) | opus | everything; writes build.ts, render.ts, contract.ts, run.ts, this file | writes no arm, no label and no scoring code |

- **The world is strata's own.** Every case is a script of real actions (`depart`, `say`, `say-to`, `whisper`,
  `offer`, `accept`, `refuse`) and clock steps (`arrive`, `lapse`) driven through `Engine.act` and `Engine.step`
  on `world/` (build.ts). Each case is what its holder received: its own copies, rendered by `render.ts` from the
  copy's envelope and payload only (a bystander's whisper has no words, an arrive's `present` reaches the mover
  alone). The target encounter's role (direct or witnessed) is `encountersOf` from `src/engine/encounters.ts`.
  The holder's earlier copies in the scenario are its relationship history.
- **Profiles are variants of Rogue, Glitch and Mux**, three each, written by the labeller: one identity per
  person (role and circumstance, no values) and one importance vector per variant.
- **Labels** (`labels.json`): direction build, detract or neutral; magnitude 1 to 3 (0 for neutral); kind plain,
  opposite, conflict or neutral; the opposite pair; set A or B. The labeller judged from the rendered view.

## Split

The labeller wrote two sets, A and B, of similar make-up, a scenario's cases always in one set. Which set is dev
and which is held out is decided by a coin the labeller never saw: the first hex digit of the sha256 of
`labels.json` as delivered, even means A is dev. The held-out set's material stays outside the repository
until both arms are frozen, and its sha256 is recorded in the freeze addendum below before its first run.

**Done, before any arm was written.** `labels.json` as delivered has sha256 `f17c05ee…85b519b1`: first digit `f`
(15), odd, so **B is dev** (13 scenarios, 32 cases: `dev-material.json`, `dev-cases.json`, `dev-labels.json`) and
**A is held out** (12 scenarios, 32 cases). Each set has 7 opposite pairs, 8 conflict, 6 neutral and 4 plain
cases. The held-out files, kept outside the repository until the freeze, have these sha256:

- `heldout-material.json` `d936156ded299943fc80e857c08a5df994c40f849ff847684b12bef38f70415a`
- `heldout-cases.json` `c826e11b99481f583ef615fc2de13a10d02aa9f92bfe0c6355e7e636ce2d0a20`
- `heldout-labels.json` `d60302ddaaf8a410554fd341b7b0ff5a7a66b208de0c8d36227643c4547c6ebd`

## The arms

Each arm is a module (`arms/o1.ts`, `arms/o2.ts`) satisfying `contract.ts`, written by its own author, who is told
to make that arm as good as it can be. Every judgment is one Jev `decide` call through harness/src/jev.ts,
unchanged.

- **O1, Jev applies importance.** The state presents the holder as the final system would: identity, what it
  cares about in words derived from its importances (never a bare number list), the relationship so far and the
  encounter. Its score is a code mapping of Jev's answers to a signed number, with no importance in it.
- **O2, code applies importance.** The state carries the same identity, history and encounter, and no
  importance. Its questions are per value; its score is code that weights Jev's per-value answers by the
  holder's importances, with a touched question or a gate so an untouched value contributes nothing.
- Each author tunes wording, questions, score mapping and neutral band (`band`: |score| under it reads as
  neutral) on the dev split only, with at most 12 variants and at most 1,500 dev calls, and names one `final`
  variant. Only the dev labels and dev runs inform that choice.

## Runs

- Dev: whatever each author runs within the budget, tagged `dev-o1-*` or `dev-o2-*`.
- Held-out, after the freeze commit: both finals, 5 reps per case, in one `run.ts --arms o1,o2 --variants final`
  run with the order rotated per rep. Then every non-final variant of both arms, 3 reps, as a secondary run
  that never decides.
- Raw calls stay local under `corpus/runs/value-weighting-2/`.
- Cost estimate before spending: dev at most 3,000 calls, held-out about 32 cases × (10 final + about 3 × 20
  other) ≈ 2,200 calls. At the first run's 2.3e-5 to 3.7e-5 USD per call, with headroom to 1e-4 for longer
  states and more questions, the ceiling is about 0.52 USD.

## Scoring (per arm, held-out split, final variant; case score = mean over its reps)

- **M1 direction.** On build and detract cases, the sign of the case score matches the label. Reported on the
  mean and per rep.
- **M2 magnitude.** Spearman ρ between case score and signed label (+magnitude build, −magnitude detract, 0
  neutral) over all cases. Also Spearman within build cases and within detract cases, reported only.
- **M3 opposite pairs.** A pair holds when both of its cases get the right sign.
- **M4 conflict.** M1 restricted to conflict cases that are build or detract.
- **M5 three-way.** A case reads neutral when |score| < the arm's declared band, else by sign. Accuracy over all
  cases. Also reported: neutral cases read neutral (hits / neutral cases), directional cases read neutral
  (false neutral), and the neutral cases' |score| median and max.
- **M6 noise.** Per case, the score's spread over reps (max − min), median and max; and the range of per-rep M1
  and M5 counts.
- **M7 cost.** Calls per judgment, questions per call, mean reported USD per judgment, median ms.

## Comparison, decided now

1. An arm holding fewer than half the opposite pairs (M3) is disqualified: telling profiles apart is the point.
2. Otherwise, **M5** decides when the arms differ significantly on it: an exact two-sided McNemar test over
   held-out cases (correct under one arm and wrong under the other), p < 0.05.
3. If not, **M1** decides by the same test over build and detract cases.
4. If not, an **M2** difference above 0.10 decides.
5. Otherwise the arms tie on accuracy, and the recommendation rests on cost and structure, named as such.

The secondary held-out run of non-final variants is reported per variant (M1, M3, M5) to show how much each
arm depends on its wording. It never changes the verdict.

## Freeze addendum

(Filled after tuning and before the held-out run: each arm's final variant and band, the dev scores that chose
them, the commit holding the arm modules, and the held-out split's sha256.)
