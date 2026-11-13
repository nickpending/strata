# Pre-registration: jev-state

Written 2026-11-12, after `docs/jev.md` gained "Building state" (385736c) and before any label, any challenger arm or
any held-out run exists. Experiment material, not strata's design: the values are `world/values.toml`'s ten, and
importance is 0 to 4 as in `world/people/`. Every Jev question follows `docs/jev.md`; an arm names any rule it bends
and why.

## The question

Design B (D43) reads a relationship judgment in a per-value stage (Jev: per value and channel, did the encounter move
it and which way, and how much) and a combine in code weighted by the holder's importance. On gate-first-e2e's fresh
held-out labels it reached pooled ρ 0.60 against a second-labeller ceiling of 0.86, while the true per-value labels
through the same combine reach 0.82 (`../gate-first-e2e/report.md`). The loss is in Jev's per-value reading.

Every experiment since v3 sent one state, `{you, who_you_are, earlier, now, your_part}` (`../gate-direction/arms/a.ts`
`stateOf`): prose, whole, to all 41 questions, with none of the holder's known facts. `docs/jev.md` "Building state"
says state should be typed where the data is typed, filtered to what each judgment turns on, and named in the
instructions, and that Jev can only judge what the state holds.

1. **Does a structured state recover design B's loss, with the questions fixed?**
2. **Does a filtered state, per question or per value group, recover it?**
3. **Optional: does adding the holder's known facts as typed state help?**

## Arms

Every arm is a module in `arms/` satisfying `contract.ts`: gate-first-e2e's contract, its judge taking a `TypedCase`
(`build.ts`). An arm owns only the per-value stage, never sees an importance or a label, and the combine is the
contract's (design B's, linear).

**What every arm keeps, so only the state differs** (B's ask, `../gate-first-e2e/arms/b.ts`):
- the 40 statements, `statement(value, other, channel, direction)` from `../gate-direction/arms/a.ts`, character for
  character, each asked as one noul;
- the touches noul, its words unchanged except the names of the fields it points at;
- the size step: for every statement whose noul reached 0.4, the 3-level strength score, `STAKE_LEVELS` and
  `DEED_LEVELS` unchanged, its instruction `<preamble> Asked: "<statement>" If so, how big is it?` (stake) or `...
  If so, how plainly does <the event field> show it?` (deed), chained after its noul, over the same state its noul
  was asked over;
- the readings: r = P(up) − P(down); effect = P(up)·L(up) − P(down)·L(down), L = 1, 2, 3 by the strength's most
  probable level, 1 when none was asked (`levelOf`); touches = P(touches).

**What an arm may change:** the state each question is asked over, and the preamble before each statement (B's
`READ`), which names the fields to read. Nothing else in a question's words. No arm sees anything a B case does not
hold, except arm K.

- **B, the baseline: design B as shipped.** `arms/b.ts`, gate-first-e2e's `arms/b.ts` imported unchanged. That port
  was verified against v4's logs (`../gate-first-e2e/check-b.ts`). `check-build.ts` verifies that a `TypedCase`
  carries every `BuiltCase` field exactly as `../size-judgment/build.ts` builds it, so B sends gate-first-e2e's
  requests. Two requests: `gate` (41 nouls) and `how` (chained strength).
- **S, state-structured.** The same requests, with one state rebuilt per the guidance:
  - the event as typed fields from the engine copy: kind, actor, target, item, room, with ids resolved to the
    names the holder reads (`TypedCase.copy`, `.names`), plus its words as text where the event is speech;
  - the earlier events in the same form;
  - the identity as typed facts where the prose states them;
  - the role as a field;
  - the preamble names the fields each question turns on.
  
  A separate opus author designs it on dev (`briefs/author-s.md`). The author may write a few state shapes and
  preambles as variants.
- **F, state-filtered.** Per question or per value group, the state holds only what that judgment turns on, drawn
  from what a B case holds (event, history, identity, role), in any shape. It may take several requests and chain
  them. It may add relevance nouls, whose answers only decide what a later state holds and never enter a reading.
  A separate opus author designs it on dev (`briefs/author-f.md`).
- **K, optional: S plus the holder's known facts.** S's final state plus, as typed fields, the engine's knowledge
  rows as of the target and the holder's encounters (`TypedCase.knowledge`, `.encounters`; `world.ties`). The S
  author writes it only if dev argues it adds something S doesn't, in numbers; otherwise S's header says why not.

**Typed identity facts.** Each person has one identity, the same in every set, so an author may write that person's
typed facts once from the identity text on dev. Every fact names the sentence it comes from and states nothing that
sentence doesn't. The orchestrator checks this at the freeze. Tags such as which value a fact bears on are design
and are allowed, each justified from the fact's own words, never from a label.

## Roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | world/, the engine's rules, events and encounter rule, `../size-judgment/build.ts`, `../value-weighting-2/render.ts` (`briefs/labeller.md`, gate-first-e2e's unchanged) | docs/, any arm, any experiment's labels, reports or briefs, this file |
| second labeller | opus | the held-out cases rendered, the identities, each holder variant's importances, the catalogue (`briefs/labeller2.md`, unchanged) | the first labels, any arm, this file |
| S author | opus | the dev split, contract.ts, build.ts, run.ts, arms/b.ts and what it imports, docs/jev.md, gate-first-e2e's and gate-direction's reports (`briefs/author-s.md`) | the held-out split, arm F |
| F author | opus | the same (`briefs/author-f.md`) | the held-out split, arm S |
| scorer | sonnet | this file, contract.ts, the labels' shape, the dev labels, `../gate-first-e2e/score.ts` to adapt (`briefs/scorer.md`) | the arm modules' source, held-out until the freeze |
| orchestrator (this worker) | opus | everything; writes this file, contract.ts, build.ts and its check, run.ts, arms/b.ts, the briefs, the report | writes no label, no challenger, no scoring code |

## Material

As gate-first-e2e's, with fresh labels:
- **Real world, engine-built.** Cases come from `../size-judgment/build.ts` as `build.ts` extends it: real actions
  through `Engine.act` and `Engine.step` on `world/`, each case its holder's own received copies, typed and rendered.
- **People and variants.** Rogue, Glitch and Mux, each with one fresh identity, and three importance variants each:
  `-w` (the world's table), `-s` and `-t` (written to differ sharply).
- **Three sets, A, B and C**, each of 40 cases: 12 opposite pairs, 5 conflict, 5 neutral, 6 plain in 3 size pairs.
  The labeller brief's make-up is unchanged.
- **Case labels:** direction, magnitude 1 to 5, kind, pair, size pair, character, exposure, set, rationale.
- **Per-value labels:** stake and deed, each up, down or none, for every value.
- **Second labeller**, after the split, labels every held-out case blind on both levels.

## Split

One set is dev, two are held out. The coin is the sha256 of `labels.json` as delivered, read as an integer, mod 3:
0 makes A dev, 1 B, 2 C. The held-out files stay outside the repository until the arms are frozen. Their sha256 is
recorded here before any challenger arm is written.

## Jev

Every request goes through `harness/src/jev.ts` `decide`. A refused request makes the judgment refused.

## Scoring (held-out split; per scored arm; a case's score is its mean over reps)

As gate-first-e2e's "Scoring", unchanged: E1 direction, E2 opposite pairs held, **E3 pooled ρ**, E4 within-direction
ρ, E5 three-way, E6 conflict, character, exposure and size pairs, E7 rerun spread, E8 requests, questions, USD and ms;
**P1** gate AUC (|r| over reps, touched against untouched), **P2** direction among fired (|r| ≥ 0.5) and over all
touched items, **P3** per value. The ceiling is the second labeller scored as an arm. The consensus subset is reported
too.

The primaries are E3, E1, P1 and P2. **E3 decides the recommendation.** P1 gets its own pre-registered verdict for the
per-value stage. E1 and P2 are reported with their tests and decide nothing.

## Stage attribution (bounds from logged answers; no Jev; never decides)

For every final arm, E1, E3 and E4 are recomputed on held-out with one stage swapped for the labels: gate oracle,
direction oracle, gate and direction oracle, no touches, and labels only (lin), exactly as gate-first-e2e's prereg
defines them. The report states each challenger's share of B's gap, (E3_X − E3_B) / (E3_ceiling − E3_B), with the
ceiling taken both as the second labeller's E3 and as B's gate-and-direction oracle. It also states how much of each
arm's own gap the gate and the direction oracles close.

## Comparisons, decided now

1. **Structured:** S against B. **Filtered:** F against B. If K is frozen, **knowledge:** K against B. k is the number
   of these comparisons (2 or 3).
2. **Case level.** Each comparison is decided on **E3** by a paired scenario bootstrap: 10,000 resamples of held-out
   scenarios with replacement, seeded 20261113, the statistic the difference of E3. The interval is 1 − 0.05/k. The
   challenger **wins** when the lower bound is above 0, **loses** when the upper bound is below 0, and **ties**
   otherwise.
3. **Per-value stage.** The same bootstrap and rule on the difference of **P1** (all items, both channels), the same
   seed and the same resamples.
4. Described, never deciding: E1 and E2 by exact two-sided McNemar tests, E4 and P2 (direction among touched, a 0
   counting wrong) by the same bootstrap. Also K against S and F against S, the same bootstrap, to separate content
   from form.
5. **Recommendation.** If no challenger wins on E3, B's state stays. If one wins, it replaces B's state. If several
   win, the one with the highest E3 is recommended, and within 0.02 the one with the lower USD per judgment. A
   challenger that wins on P1 but not on E3 is reported as a per-value gain that doesn't reach the case.

## Tuning

Each author tunes on the dev split only. Limits per author:
- at most 8 variants, including any K;
- dev spend at most 0.40 USD;
- a final, plus at most 1 contender per arm.

Each final costs at most 8e-4 USD per judgment on dev, and at most 6 requests in sequence. Nothing names a dev
case, scenario or variant, or a fact only a dev scenario holds. The S and F authors work in parallel and never see
each other's arm.

## Runs and cost, named before spending

| run | judgments | at most |
|---|---|---|
| B on dev, 40 cases × 2 reps | 80 | 0.03 USD |
| S author's dev tuning (with K) | as needed | 0.40 USD |
| F author's dev tuning | as needed | 0.40 USD |
| held-out finals: B, S, F (and K), 80 cases × 5 reps, one run, order rotated per rep | 1,200 (1,600) | 1.07 USD |
| secondary: at most 1 contender per challenger, 80 × 3 reps | up to 720 | 0.58 USD |
| **ceiling** | | **2.48 USD** |

Basis: B costs 2.6e-4 USD per judgment (gate-first-e2e). Each challenger is capped at 8e-4. Agent work besides:
two opus labellers, two opus authors and one sonnet scorer. Raw judgments stay local under `corpus/runs/jev-state/`
(gitignored).

## Split, done before any challenger arm was written

- **Coin:** `labels.json` as delivered has sha256 `4a810f2d54a8feeb701b3b38e2a95184e4809b930daec00f52735f033ecbf9c2`
  (material `a703075aac4b8039c2ab4e19b4ca4e19790e2f4972495bdb0214d1af6132a2cc`). As an integer mod 3 it is 0, so
  **A is dev**: 28 scenarios and 40 cases, in `dev-material.json` and `dev-labels.json`.
- **Held out:** B and C, 56 scenarios, 80 cases, 24 opposite pairs.
- **Checks:**
  - every set has the make-up;
  - all 120 cases build through the engine with no error;
  - `check-build.ts` passes on both splits;
  - the `-w` variants equal the world's tables;
  - in all 36 opposite pairs the two cases share their 20 value labels.
- **Held-out files,** outside the repository until the freeze:
  - `heldout-material.json` `36bbd815dac897171946322af282732ba0d000d7dede255bb42608da627cf3fe`
  - `heldout-labels.json` `1a739704f0a4971424725af15a4e902430ab305d8b42015d663c02ea63c0dacb`
- **B on dev** (2 reps, 80 judgments, 0 refused) cost 0.019 USD. Its log is
  `corpus/runs/jev-state/2026-11-13T00-28-48-558Z-dev-b/judgments.jsonl`.
- **The labeller's own notes:**
  - Security leads stake touches in every set (20 to 24 of about 50), and at least five values reach four touches
    in each.
  - It was least sure of A07b and A13 on dev.
  - Some opposite pairs carry the holder's own earlier line in their shared history.

## Freeze addendum

Written after tuning and before any held-out run. `arms/b.ts`, `arms/s.ts` and `arms/f.ts` are frozen in the commit
that adds this addendum; nothing in `arms/` changes after it.

- **Questions kept.** `check-arms.ts` runs each final and contender on every dev and held-out case against a stub Jev
  (no call, no label). It confirms:
  - the 40 statements are asked once each, character for character;
  - touches is asked once, in TOUCHES' words up to field names;
  - each strength score keeps its levels and words after the preamble, chained after its noul over that noul's
    state.

  It passes for `b:as-is`, `s:t5`, `s:t1`, `f:g4-prose` and `f:pv`.
- **Identity facts.**
  - The orchestrator read S's typed facts against the three identity texts. Each states only what its quoted
    sentence states. Each person's facts are pinned to the identity text's sha256, which the held-out cases share.
  - F's final sends the identity's own sentences, chosen by tags, and checks every source sentence against the
    case's text at run time.
- **S final: `t5`.**
  - State: B's five fields. `now` and `earlier` are typed compact events (act, by, to, item, room, speech words as
    text), with offer windows in words. `who_you_are` holds typed facts nested by topic. `your_part` is the role.
  - Preamble: B's `READ`, unchanged.
  - Requests: 2. Cost: 2.6e-4 USD per judgment.
  - Dev, 4 reps: E1 28/35, E2 8/12, E3 0.700, P1 0.745. B read E3 0.631 and P1 0.773. Against B, E3 is +0.069
    [−0.070, 0.187], a tie.
  - Contender `t1`: the same typed state, with a preamble naming the sub-fields. Dev E3 0.677, 3.5e-4 USD.
- **No arm K.** The S author's probe `k1` was t5 plus locations, holders and the holder's authored ties. On dev it
  read E3 0.666 against t5's 0.693 in the same run, E1 26 against 28, and P1 0.741 against 0.744. The known rows
  mostly repeat `earlier` and `now`. So only two comparisons are made: k = 2, with 97.5% intervals.
- **F final: `g4-prose`.**
  - Stake goes in four groups: safety (security, power, achievement), self (self_direction, stimulation,
    hedonism), norms (conformity, tradition) and people (benevolence, universalism). Each group's state holds the
    identity sentences tagged for it, the event, the earlier lines with the other, and the role.
  - All 20 deed nouls share one state: the event, the lines with the other, and the identity sentences that name
    the other.
  - Touches is asked over the full stake state.
  - Requests: 10.3 per judgment, 2 in sequence. Cost: 4.0e-4 USD.
  - Dev, 4 reps: E1 29/35, E2 8/12, E3 0.582, P1 0.745.
  - Contender `pv`: one typed stake state per value. Dev E3 0.576, 6.5e-4 USD.
  - Its header records that the typed form read stake P1 0.03 to 0.07 lower than the same content in prose on dev,
    so the final bends "typed fields". It also records that relevance-noul selection (`rel`) read lowest, E3 0.480.
- **On dev, no challenger beat B on E3 or P1 outside noise.** S leads on E3 and F trails, and both trail on P1. The
  held-out run tests the pre-registered question as written. The dev result is recorded here so the report can't
  read it otherwise.
- **Second labeller.** It labelled all 80 held-out cases blind before this freeze. `labels2.json` has sha256
  `51c87d63ac41cf96ad521c4146ff483e39bf767f0c87a646c0fb901b5e0f3bb7`. It marks more items touched than the first
  labeller: stake 144 of 800, against 115.
- **Spend so far:** 0.579 USD. That is B dev 0.019, S author 0.207 and F author 0.353.
- **Held-out next:**
  - finals B, S and F, 80 cases × 5 reps = 1,200 judgments, about 0.36 USD;
  - secondary, `s:t1` and `f:pv`, 80 × 3 reps = 480 judgments, about 0.24 USD.
