# Pre-registration: size-judgment

Written 2026-11-11, before any label, arm or held-out run exists. Every Jev question follows `docs/jev.md`; an arm
names any rule it bends and why. The values are the world's (`world/values.toml`, D44).

## The question

Design B (D43) judges an encounter per value: a noul for whether it advanced or set back the holder's stake, then a
chained `how` score of its size (slight, clear, big), read by its most probable level. Code multiplies by
importance. End to end, B's magnitude agreement was weak: ρ 0.55 overall, 0.32 within build cases and 0.17 within
detract cases (`../value-weighting-4/report.md`). That number mixes the gate, the direction nouls, the weighting and
the three coarse levels.

This run isolates the size step. **Given the right value and the right direction, can Jev judge how far an
encounter moved that value for its holder, from the holder's side?** Which wording does it best? Is it good enough
to drive standing (`docs/explorations/npc-relationships.md` items 14 and 18)?

### What "size" means here, and what is left out

- **Size is how far the encounter moved the holder's own stake in the value**, read from the holder's situation:
  their identity, what happened before, and what is at stake for them. It is **not how much the holder cares about
  the value**. Under D43 code applies importance, so Jev's size must exclude it. Neither labellers nor arms see an
  importance.
- **Only the stake channel is tested.** Design B's `how` also scores `deed` statements (how plainly the other's act
  showed a value). That is a different question. This run does not test it, and the report says so.
- **Direction and value are given**, from the first labeller's labels. No gate, direction noul or weighting is in
  play.

## Material (a blind opus labeller, `briefs/labeller.md`)

- **Real world, engine-built.** Scenarios are scripts of real actions driven through `Engine.act` and `Engine.step`
  on `world/` by `build.ts`. It is v2's builder with one change. v2's builder calls `encountersOf` with its
  pre-D33 signature and crashes at HEAD, so this one reads the engine's own encounter rule through
  `Engine.encounters`: every other recipient of the same event. Each case is what its holder received, rendered by
  `../value-weighting-2/render.ts`, with the holder's earlier copies as history.
- **Per case, the given items.** Each case spec carries `touched`: one or two `{value, direction}` pairs, direction
  `up` (advanced) or `down` (set back). The labels give each item a **size from 1 to 5**:
  - 1, trivial: barely registers;
  - 2, small;
  - 3, moderate;
  - 4, major;
  - 5, life-changing: life, livelihood, home or a closest bond on the line.

  The labeller's brief gives the full scale.
- **Size pairs.** Two cases with the same holder, the same value, the same direction and the same kind of event
  (same verb, same sort of act) at sizes at least 2 apart. Examples are a passing slight against public
  humiliation, or a scuffle against a death threat.
- **Make-up.** There are three sets, A, B and C, of matching make-up. A scenario's cases always sit in one set.
  Each set has:
  - at least 18 cases and 28 items;
  - 6 size pairs;
  - every size at least 3 times;
  - each direction at least 10 times;
  - at least 5 values with 4 or more items each, each spanning at least 3 sizes;
  - at least 4 cases with two items;
  - both roles (direct and witnessed);
  - at least 5 different verbs as target events.
- **The labeller is told nothing** about what will be judged against its labels, or how. It never sees `docs/`, any
  experiment's arms or reports, or this file.

## Split

The coin is the sha256 of `labels.json` as delivered, read as an integer mod 3: 0 makes A dev, 1 makes B dev, 2
makes C dev. The other two sets are held out. The held-out material and labels stay outside the repository, in the
orchestrator's scratchpad, until the arms are frozen. Their sha256 is recorded here before any arm exists.

## Second labeller (opus, `briefs/labeller2.md`)

After the split and before the freeze, a second opus labeller sizes every held-out item blind. It sees the rendered
cases, the identities, each item's value and direction, and the same 1 to 5 scale. It never sees the first labels,
the pairs or any arm. Its labels measure the ceiling and never change the verdict.

## Arms (one separate opus author, `briefs/author.md`, tuned on dev only)

Each arm is a module in `arms/` that satisfies `contract.ts`. Per case, an arm receives the built case, the given
items and the world's value catalogue, and never an importance or a label. Per item it returns one level, the most
probable level of a score answer (`contract.ts` `mostProbable`, rule 6). It never reads a score's expectation or
interpolates between levels.

- **A, the baseline, as is.** v3/v4 design B's `how` question for a stake statement, verbatim:
  - the same five-field state (`you`, `who_you_are`, `earlier`, `now`, `your_part`);
  - the same READ preamble;
  - `Asked: "<the value's stake up or down statement>" If so, how big is it?`;
  - the three levels "Slight: small or passing." / "Clear: real, something you would notice and remember." / "Big:
    large or lasting, about as much as one moment could do.".

  The orchestrator checks A's wording, by script, against the `how` questions logged in
  `corpus/runs/value-weighting-4/`. The author sets only A's `toLabel`, on dev.
- **B, more levels.** 4 or 5 levels, each described as a concrete situation.
- **C, levels anchored per value.** What each level means for this value (security against achievement, and so
  on). The number of levels is the author's choice.
- **D, optional.** A chained or comparative form, only if the author argues for it under docs/jev.md, at the
  freeze, or not at all.

The author names, per module, one `final` and up to 3 `contenders`, with a `toLabel` per variant chosen on dev.
Wording is general: per value, per direction or per level. Nothing names a dev case, a dev scenario or a fact only
a dev scenario holds. The author may reuse A's state or argue for another under rule 7.

## Scoring (a separate sonnet scorer, `briefs/scorer.md`, who never sees the arms)

The unit is an item, a (case, value, direction) triple. Each rep's level for an item is taken as given. No level is
averaged inside a rep.

- **M1 pooled ρ.** Spearman ρ, with average ranks for ties, between the item's level index and its label size, over
  all held-out items. It is computed per rep and then averaged over reps. **This is the primary metric.**
- **M2 within ρ.** M1 restricted to:
  - each direction (up items, down items);
  - each value with 8 or more held-out items.
- **M3 size pairs.** Per pair and rep, the bigger-labelled item's level is strictly higher (ordered), equal (tied)
  or lower (reversed). The report gives counts, averaged over reps, and the number of pairs ordered in at least 4 of
  5 reps.
- **M4 level accuracy.** Per item and rep, `toLabel[level]` against the label: exact, and exact-or-adjacent (|d| ≤
  1). The report gives the mean over reps. Both metrics depend on the variant's own mapping, so they describe and
  never decide.
- **M5 spread.** Per item:
  - the number of distinct levels across reps;
  - the share of items whose level changes across reps;
  - the standard deviation of M1 over the reps.
- **M6 cost.** Requests, questions, USD and median ms per judgment (one case).
- **Ceiling.** The second labeller is scored with the same metrics where they apply:
  - ρ against the first labeller (pooled, within direction, within value);
  - exact and exact-or-adjacent agreement;
  - size pairs that the second labeller orders the same way.

  On the **consensus subset** (items where the two labellers are within 1), M1 and M3 are reported for every arm.

## Comparison, decided now

1. **Each challenger against A on M1.** The test is a paired cluster bootstrap over held-out scenarios: 10,000
   resamples, seed 1, M1 recomputed per resample for both arms on the same resampled items. With m challengers
   frozen (3 or 4), the interval is the two-sided (1 − 0.05/m) percentile interval of ρ_X − ρ_A (Bonferroni).
   - The challenger **beats A** when the interval lies above 0.
   - A **beats the challenger** when it lies below 0.
   - Otherwise they **tie**.
2. **Recommended wording.**
   - If no challenger beats A, A is recommended: it changes nothing in design B.
   - If one or more beat A, the one with the highest M1 is recommended. A rival within 0.02 of it is resolved in
     favour of fewer questions per judgment, then fewer levels.
3. **Good enough to drive standing**, judged on the recommended final. The verdict has three grades:
   - **yes** when all three of these hold:
     - (a) M1 ≥ ceiling ρ − 0.10;
     - (b) size pairs ordered (M3, mean over reps) ≥ 80%;
     - (c) M2 within each direction ≥ 0.5.
   - **partly** when (b) holds but (a) or (c) fails. Jev orders same-kind events, but its scale does not track
     the labels across kinds.
   - **no** otherwise.

   These bars are this run's convention, fixed before any data. Standing adds up effects across an edge's
   encounters, so the bars ask two things. Bigger events of a kind must score bigger. Sizes must rank across
   encounter kinds about as well as two careful readers rank them. The 0.5 floor sits well above v4's
   end-to-end within-direction ρ of 0.32 and 0.17.

The secondary run (contenders), the consensus subset and M4 never change a verdict.

## Runs and cost, named before spending

| run | judgments | at most |
|---|---|---|
| author dev tuning (all arms) | as needed | 0.30 USD |
| held-out finals: A, B, C (and D), all held-out cases × 5 reps, one run, order rotated per rep | about 800 | 0.25 USD |
| secondary: each module's contenders, × 3 reps | up to about 1,400 | 0.25 USD |
| **ceiling** | | **0.80 USD** |

Basis: v4's `how` request, 20 score questions on a state of about 950 chars, cost 1.3e-4 USD. A judgment here asks
1 to 2 score questions (a chained arm asks 2 to 4), so each bound assumes at most 1.5e-4 per judgment. Raw
judgments stay local under `corpus/runs/size-judgment/` (gitignored).

## Roles (separate agents, explicit models)

| role | model | sees | never sees |
|---|---|---|---|
| labeller | opus | `world/`, the engine's rules, events and encounter rule, `build.ts` and v2's renderer | `docs/`, any arm, any experiment's labels, reports or scoring, this file |
| second labeller | opus | the held-out cases as rendered, the identities, the items and the scale | the first labels, the pairs, arms, this file |
| author | opus | the dev split, this file, `contract.ts`, `run.ts`, `docs/jev.md`, v3/v4 reports and arms, v4's logged `how` answers | the held-out split, both labellers' briefs, the second labels |
| scorer | sonnet | this file, `contract.ts`, the judgment log format, the labels' format | the arm modules' source |
| orchestrator (this session) | opus | everything; writes `contract.ts`, `run.ts`, this file, the briefs and the report | writes no arm, no label and no scoring code |
