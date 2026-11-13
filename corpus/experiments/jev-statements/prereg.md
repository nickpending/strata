# Pre-registration: jev-statements

Written 2026-11-12, before any label, any challenger arm or any held-out run exists. Experiment material, not
strata's design: the values are `world/values.toml`'s ten, and importance is 0 to 4 as in `world/people/`. Every Jev
question follows `docs/jev.md`; an arm names any rule it bends and why.

## The question

Design B (D43) reads a relationship judgment in a per-value stage (Jev: per value and channel, did the encounter move
it and which way, and how much) and a combine in code weighted by the holder's importance. Across three runs the loss
sits in Jev's per-value reading, not the combine. True per-value labels through the combine reach pooled ρ 0.82 to
0.84, against B's 0.55 to 0.60 (`../gate-first-e2e/report.md`, `../jev-state/report.md`). The state's shape doesn't
move that reading (jev-state). Security's gate reads about 0.62 against the labellers' 0.80, and benevolence's about
0.53 against 0.83, even with the threat in a typed safety field (jev-state, "What moved").

Design B's 40 statements are v3's, unchanged in every end-to-end run since. They ask the Schwartz description ("make
you safer, or keep danger or trouble away from you"). `docs/jev.md` rule 3 says a question should sit close to the
surface and point at what is visible. The one earlier rewording, gate-direction's arm C, lifted the item-level gate
AUC from 0.74 to 0.84 on gate-direction's held-out. It was read with a hard zero, and it was never run through
design B's combine (`../gate-direction/report.md`, step 2).

Squared weighting led linear on design B's held-out three times out of three, by +0.09, +0.06 and +0.065 E3 (v4 in
gate-direction step 1, gate-first-e2e, jev-state). Each lead was read after seeing held-out, and none was
pre-registered.

1. **Statements:** with B's state, preamble, size step and readings held, do statements rewritten to point at the
   concrete thing each judgment turns on recover design B's case-level loss?
2. **Weighting:** on fresh labels, does importance squared beat linear in design B's combine?

## Arms

Every arm is a module in `arms/` satisfying `contract.ts`: jev-state's contract (gate-first-e2e's combine, readings
and item keys), with each variant carrying its statement table. An arm owns only its statements. It never sees an
importance or a label.

- **B, the baseline: design B as shipped.** `arms/b.ts`, gate-first-e2e's `arms/b.ts` `as-is` imported unchanged,
  as jev-state's B was. That port was verified against v4's logs (`../gate-first-e2e/check-b.ts`). Two requests:
  `gate` (41 nouls) and `how` (the chained strength scores).
- **B-sq.** B's logged judgments through the contract's `combine` with importance squared. No Jev call.
- **W, statements rewritten.** `ask.ts` `judgeWith(table)`: B's ask with the statement table as its only parameter.
  `check-ask.ts` shows that `judgeWith` with B's table sends B's requests exactly, request for request and reading for
  reading. It passed on jev-state's 120 cases before this file was committed. W keeps, from B:
  - the state, `stateOf`: `{you, who_you_are, earlier, now, your_part}`;
  - the preamble `READ` before every statement;
  - the touches noul;
  - the size step. Every statement whose noul reaches 0.4 gets B's strength score, with B's levels and words, and
    W's statement in the place of B's quoted one;
  - the readings: r = P(up) − P(down); effect = P(up)·L(up) − P(down)·L(down); touches = P(touches).

  **W changes only the 40 statements**, one per value, channel and direction. A separate opus author writes them on
  dev (`briefs/author-w.md`). The constraints:
  - **The channel's meaning is kept.** Stake asks whether the event advanced (up) or set back (down) the holder's own
    share of the value. Deed asks whether the other, in this act, acted for (up) or against (down) it. Yes means the
    statement holds (rule 8).
  - **Each statement points at the concrete, visible thing the judgment turns on in strata's world,** rather than
    the Schwartz description: who did what to whom in `now` and `earlier`, and what it does to the holder's
    situation as `who_you_are` states it. The brief's example is security, stake down: "Does what {o} did bring people
    who could hurt you closer to you, or put you at risk of harm, arrest, or losing your place?"
  - **Every value is rewritten,** not only security and benevolence.
  - **Within `docs/jev.md`:** literal, one judgment, no double negatives, no property of a property. A list of
    instances of one judgment is allowed, as B's statements and C's have. So is a boundary clause ("Answer no if
    ...", rule 2). Backticked names of B's state fields are allowed.
  - **Generic to any holder in strata's world.** No person, room or item name, and no fact only one identity or a
    dev scenario holds. A statement receives only the value, the other's name, the channel and the direction.
- **W-sq.** W's final's logged judgments through `combine` with importance squared. No Jev call.

The single step that differs between B and W is the statement table. The single step that differs between B and
B-sq, and between W and W-sq, is the weighting.

## Roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | world/, the engine's rules, events and encounter rule, `../size-judgment/build.ts`, `../value-weighting-2/render.ts` (`briefs/labeller.md`, jev-state's and gate-first-e2e's unchanged) | docs/, any arm, any experiment's labels, reports or briefs, this file |
| second labeller | opus | the held-out cases rendered, the identities, each holder variant's importances, the catalogue (`briefs/labeller2.md`, unchanged) | the first labels, any arm, this file |
| W author | opus | the dev split, contract.ts, ask.ts, run.ts, arms/b.ts and what it imports, gate-direction's `arms/c.ts`, docs/jev.md, world/, the engine's rules and events, jev-state's, gate-first-e2e's and gate-direction's reports (`briefs/author-w.md`) | the held-out split, labels2, any other experiment's labels or material |
| scorer | sonnet | this file, contract.ts, the labels' shape, the dev labels, `../jev-state/score.ts` to adapt (`briefs/scorer.md`) | the arm modules' source, held-out until the freeze |
| orchestrator (this worker) | opus | everything; writes this file, contract.ts, ask.ts and its check, check-arms.ts, run.ts, arms/b.ts, the briefs, the report | writes no label, no statement, no scoring code |

## Material

As jev-state's, with fresh labels from a fresh labeller:
- **Real world, engine-built.** Cases come from `../jev-state/build.ts` `buildTyped` (whose BuiltCase fields equal
  `../size-judgment/build.ts`'s): real actions through `Engine.act` and `Engine.step` on `world/`, each case its
  holder's own received copies, rendered.
- **People and variants.** Rogue, Glitch and Mux, each with one fresh identity, and three importance variants each:
  `-w` (the world's table), `-s` and `-t`.
- **Three sets, A, B and C**, each of 40 cases: 12 opposite pairs, 5 conflict, 5 neutral, 6 plain in 3 size pairs.
- **Case labels:** direction, magnitude 1 to 5, kind, pair, size pair, character, exposure, set, rationale.
- **Per-value labels:** stake and deed, each up, down or none, for every value.
- **Second labeller,** after the split, labels every held-out case blind on both levels.

## Split

One set is dev, two are held out. The coin is the sha256 of `labels.json` as delivered, read as an integer, mod 3:
0 makes A dev, 1 B, 2 C. The held-out files stay outside the repository until the arms are frozen. Their sha256 is
recorded here before any challenger arm is written.

## Jev

Every request goes through `harness/src/jev.ts` `decide`. A refused request makes the judgment refused.

## Scoring (held-out split; per scored arm; a case's score is its mean over reps)

As jev-state's "Scoring", unchanged: E1 direction, E2 opposite pairs held, **E3 pooled ρ**, E4 within-direction ρ, E5
three-way, E6 conflict, character, exposure and size pairs, E7 rerun spread, E8 requests, questions, USD and ms;
**P1** gate AUC (|r| over reps, touched against untouched), **P2** direction among fired (|r| ≥ 0.5) and over all
touched items, **P3** per value. The ceiling is the second labeller scored as an arm. The consensus subset is reported
too. P1 to P3 depend only on the readings, so B and B-sq share them, as do W and W-sq.

**E3 decides.** P1 and P2 for W against B are the secondary primaries: P1 gets its own pre-registered verdict for the
per-value stage, and P2, with per value P1 and direction among fired for security and benevolence, is reported with
its interval and decides nothing. E1 and E2 are reported with their tests and decide nothing.

## Stage attribution (bounds from logged answers; no Jev; never decides)

For B and W, linear, E1, E3 and E4 are recomputed on held-out with one stage swapped for the labels: gate oracle,
direction oracle, gate and direction oracle, no touches, and labels only (lin and sq), exactly as jev-state's prereg
defines them. The report states:
- each challenger's share of B's gap, (E3_X − E3_B) / (E3_ceiling − E3_B), for W and for B-sq, with the ceiling taken
  both as the second labeller's E3 and as B's gate-and-direction oracle;
- how much of B's and W's own gap the gate oracle, the direction oracle and both close.

## Comparisons, decided now

1. **Statements:** W against B, both linear. **Weighting:** B-sq against B, on B's judgments. k = 2.
2. **Case level.** Each is decided on **E3** by a paired scenario bootstrap: 10,000 resamples of held-out scenarios
   with replacement, seeded 20261114, the statistic the difference of E3. The interval is 1 − 0.05/2, so 97.5%. The
   challenger **wins** when the lower bound is above 0, **loses** when the upper bound is below 0, and **ties**
   otherwise.
3. **Per-value stage.** W against B on the difference of **P1** (all items, both channels), the same rule, seed and
   resamples. B-sq against B has no per-value comparison: their readings are the same.
4. **Described, never deciding.**
   - W against B: P2 (direction among fired, and over all touched items, a 0 counting wrong) by the same bootstrap.
     P1 and direction among fired per value, for security and benevolence, also by the bootstrap. Every other value
     is given as a point estimate.
   - E1 and E2 by exact two-sided McNemar tests, and E4 by the bootstrap, for both primary comparisons.
   - W-sq against B, W-sq against W, and W-sq against B-sq on E3, by the same bootstrap, to show whether the two
     changes add.
5. **Recommendation.**
   - **Statements:** if W wins on E3, W's statements replace B's. Otherwise B's stay. If W wins on P1 but not on
     E3, that is reported as a per-value gain that doesn't reach the case.
   - **Weighting:** if B-sq wins on E3, squared replaces linear. Otherwise linear stays.
   - If both win, the recommendation is both changes together (W-sq). W-sq against B is then reported, and it
     decides nothing more.

## Tuning

The W author tunes on the dev split only. Limits:
- at most 8 variants, each a complete table of 40;
- dev spend at most 0.40 USD;
- a final, plus at most 1 contender.

**The final is the variant with the highest dev P1. Within 0.01 of that, the one with the higher dev E3 (linear)
wins.** P1, not E3, chooses because W changes only the per-value questions, and P1 is what they move directly. Dev
P1 rests on 800 items per rep, while dev E3 rests on 40 cases with a ±0.13 interval (jev-state's S on dev: +0.069,
[−0.070, 0.187]). E3 still decides on held-out.

The final costs at most 5e-4 USD per judgment on dev (B costs 2.4e-4). Nothing names or special-cases a dev case,
scenario or variant, or a fact only a dev scenario or one identity holds. `check-arms.ts` enforces that W's requests
differ from B's only in the statements, and that no statement names a person, room or item. The orchestrator reads
every statement at the freeze for any fact one identity or a dev scenario holds.

## Runs and cost, named before spending

| run | judgments | at most |
|---|---|---|
| B on dev, 40 cases × 2 reps | 80 | 0.03 USD |
| W author's dev tuning | as needed | 0.40 USD |
| held-out finals: B and W, 80 cases × 5 reps, one run, order rotated per rep | 800 | 0.31 USD |
| secondary: W's contender, if named, 80 × 3 reps | up to 240 | 0.12 USD |
| B-sq and W-sq | 0 (rescored) | 0 |
| **ceiling** | | **0.86 USD** |

Basis: B costs 2.4e-4 USD per judgment (jev-state), and W is capped at 5e-4. Agent work besides: two opus labellers,
one opus author and one sonnet scorer. Raw judgments stay local under `corpus/runs/jev-statements/` (gitignored).

## Split, done before any challenger arm was written

- **Coin:** `labels.json` as delivered has sha256 `93181daf41a67d090c7c5396b0b7e3fcfefde76d9259a4d9d796bf8eb21b67b4`
  (material `5ade12d0bba3b6cdad487617a20c4d6771be4e25ed343e353df891bf8d3cced2`). As an integer mod 3 it is 0, so
  **A is dev**: 28 scenarios and 40 cases, in `dev-material.json` and `dev-labels.json`.
- **Held out:** B and C, 56 scenarios, 80 cases, 24 opposite pairs.
- **Checks:**
  - the labeller's validator found every set meets the make-up, the `-w` variants equal the world's tables, and every
    `pair` and `size_pair` points both ways;
  - no scenario spans two sets, and in all 36 opposite pairs the two cases share their 20 value labels;
  - `../jev-state/check-build.ts` passes on both splits;
  - `check-ask.ts` passes on all 120 cases.
- **Held-out files,** outside the repository until the freeze:
  - `heldout-material.json` `f62d01e843e14a83db2efbfe76a287a900f2fea04e7aebe0d2be516cf0430ed3`
  - `heldout-labels.json` `d27b1a64a1de483ab7f46d17799a28fc6c760afa700351f12a9ef032e0096f89`
- **B on dev** (2 reps, 80 judgments, 0 refused) cost 0.020 USD. Its log is
  `corpus/runs/jev-statements/2026-11-13T01-18-32-465Z-dev-b/judgments.jsonl`.
- **The labeller's own notes:**
  - Security is about 45% of stake touches in every set (25 to 27 of about 57). At least five values reach four
    stake touches in each set, so the make-up's rule holds, but security dominates more than in jev-state (about a
    third).
  - Least sure: A10 and A22 on dev; B11, B14, C02 and C22 held out.

## Freeze addendum

Written after tuning and before any held-out run. `arms/b.ts` and `arms/w.ts` are frozen in the commit that adds this
addendum; nothing in `arms/` changes after it.

- **Only the statements differ.** `check-arms.ts` runs W's final and contender on all 120 dev and held-out cases
  against a stub Jev, beside B (no call, no label). For `w:w4` and `w:w1` it confirms the same steps over B's state,
  the same keys, touches unchanged, `READ` unchanged, and the strength levels and words unchanged, with only the
  statement swapped. No statement names a person, room or item, and none holds a double quote.
- **W final: `w4`.**
  - Stake asks "Does what {o} did ...?" and deed asks "In `now`, did {o} ...?". Each statement lists the concrete acts
    or changes the judgment turns on: orders, debts, shelter, threats brought closer or kept away, help given at the
    other's own cost. Several carry a boundary clause, such as "other than yourself", "Count only danger that {o}'s
    act adds" or "rather than only asking someone else to take the risk".
  - Dev, 4 reps, against B's 2-rep dev run:

    | | E1 | E2 | E3 | E4 build / detract | P1 | P2 among fired | security P1 | benevolence P1 |
    |---|---|---|---|---|---|---|---|---|
    | B | 27/35 | 5/12 | 0.661 | 0.266 / 0.221 | 0.750 | 42/43 | 0.748 | 0.511 |
    | `w4` | 31/35 | 8/12 | 0.781 | 0.262 / 0.186 | 0.893 | 62/62 | 0.768 | 0.890 |

  - Requests: 2. Questions: 48.7 per judgment, against B's 55.3. Cost: 2.35e-4 USD per judgment.
  - The selection follows "Tuning": w5 had the best P1 (0.896), w3 (0.894) and w4 (0.893) sat within 0.01, and w4
    had the highest E3 (0.781 against 0.754 and 0.761). The orchestrator rescored that run with `score.ts` and got
    the same figures.
- **Contender: `w1`**, the first wording, written before any W answer was read. Dev, 2 reps: E1 28/35, E3 0.710,
  P1 0.844. It bounds how much of `w4` is fitted to dev.
- **Read at the freeze.** The orchestrator read all 40 of `w4`'s statements. None names a fact only one identity
  holds. Some list kinds of things these identities also contain:
  - "rent" appears in two of the three identities, which held-out shares. It also appears in jev-state's
    independently written identities.
  - "a run" and "stim" come from world/.
  - "a raid", "arrest" and "shelter" appear in neither world/ nor the identities.

  Listing "rent" among the holds a person can use is a kind of thing in this world, not one person's fact. It may
  still help held-out a little, because held-out shares these identities. The report names this as a limit.
- **Seen on dev but deciding nothing:** `w4` squared reads E3 0.859, against B-sq's 0.705. W-sq is described only.
- **Second labeller.** It labelled all 80 held-out cases blind before this freeze. `labels2.json` has sha256
  `6609d1b78537dc2d91dbf93954c07d216cb25ac08c637518e5470bb0dba95462`.
- **Spend so far: 0.227 USD.** That is B dev 0.020 and the W author's tuning 0.207.
- **Held-out next:**
  - finals B and W, 80 cases × 5 reps = 800 judgments, about 0.19 USD;
  - secondary, `w:w1`, 80 × 3 reps = 240 judgments, about 0.06 USD.
