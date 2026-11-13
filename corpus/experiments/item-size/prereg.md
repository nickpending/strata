# Pre-registration: item-size

Written 2026-11-12, before any label of this experiment exists, before any X arm has been scored on any labelled
data, and before any of this experiment's Jev runs. Experiment material, not strata's design. Every Jev question here
is an existing frozen one; this experiment designs none.

## The question

Design B (D43) turns each item's two answers, the direction noul and the strength level, into an amount by
multiplying them: effect = P(up)·L(up) − P(down)·L(down) (`../gate-first-e2e/arms/b.ts`, `../jev-statements/ask.ts`).
That treats Jev's confidence as if it were size. `docs/jev.md` rule 6 says never to compute a magnitude from a
score's or choice's expectation; a probability times a level is close to that.

jev-statements' stage attribution (post hoc, `../jev-statements/report.md`, "Why a better gate still doesn't reach the
case") put a figure on it. With the true gate and direction but Jev's own |effect|, B reads E3 0.804. With the true
labels at a fixed size, it reads 0.881. size-judgment found that the size question alone ranks sizes at ρ 0.71
against a ceiling of 0.89 (`../size-judgment/report.md`).

**Does reading a touched item at a size the gate does not scale (a fixed size, or Jev's level once the gate says
touched) beat B's probability × level at the case level, on fresh labels?**

## Arms

Code only, in `readings.ts`. Every arm reads the same logged answers of the same judgment: the `gate` request's 40
direction nouls and the touches noul, and the `how` request's strength scores. B asks the strength score for a
direction whose noul reached 0.4. `check-readings.ts` confirms, on 2,000 logged jev-statements judgments, that
`readingsOf("B")` reproduces every logged reading exactly and that every logged `how` asks exactly the keys at or
above 0.4. It read no label and printed no metric.

Per item (channel, value), with P_up and P_down the two nouls and L_up and L_down the most probable strength level
(1, 2 or 3; ties to the lower; 1 when not asked):

- **B, as shipped.** effect = P_up·L_up − P_down·L_down.
- **X1, a fixed size.** The item fires when max(P_up, P_down) ≥ 0.4, B's own threshold for asking the size. Its
  direction d is the sign of P_up − P_down (a tie reads 0). effect = 2·d when fired, else 0. No probability
  multiplier.
- **X2, Jev's level once touched.** Fired and d as X1. effect = d·L_d, the most probable level of the winning
  direction's strength score. The level applies only once the gate says touched; the probability never scales it.
- **X3, stake sized, deed fixed.** X2 on stake items, X1 on deed items. Justified before any held-out data, from the
  question text alone: the deed levels grade how plainly `now` shows the act ("Faintly: it only hints at it",
  "Clearly: it plainly shows it", "Strongly: a bold or costly act that shows it beyond doubt"). That is mostly a
  confidence, which is what X removes. The stake levels grade a size ("Slight", "Clear", "Big"), and only they were
  tested in isolation (size-judgment, "Only the stake channel is tested").

**The single step that differs between the arms is the per-item effect.** `r` (P_up − P_down) and `touches` are B's
in every arm, so P1 to P3 are shared. The combine is the contract's, unchanged: touches × Σ w(imp)·effect / Σ
w(imp). Its touches multiplier is a probability at the case level; it is not tested here (jev-statements measured it
moving E3 by under 0.01).

The arms run on two sets of logs of the same cases:
- **B's statements** (jev-statements' arm B, `as-is`): `B`, `X1`, `X2`, `X3`. These decide.
- **W's statements** (jev-statements' arm W, final `w4`): `W`, `WX1`, `WX2`, `WX3`. Described only.

`rescore.ts` writes these eight arms from the logs, in the runner's line format, with `combine`'s scores linear and
squared. jev-statements' `arms/b.ts`, `arms/w.ts`, `ask.ts` and `run.ts` are used as frozen at 5b67160; nothing in
`../jev-statements/` changes.

## Material

Fresh, engine-built, blind:
- **Labeller:** a new opus agent, `briefs/labeller.md`: jev-statements' brief unchanged except its output directory.
  It writes fresh identities, nine holder variants, three sets A, B and C of 40 cases each (12 opposite pairs, 5
  conflict, 5 neutral, 6 plain in 3 size pairs per set), case labels and per-value labels.
- **Second labeller:** a new opus agent, `briefs/labeller2.md`, jev-statements' brief unchanged, labels every case
  blind on both levels.
- **All 120 cases are held out.** There is no dev split and no coin. A dev split exists to tune arms, and these arms
  are frozen in this commit and tune nothing. Holding all three sets out gives the paired bootstrap about 1.5 times
  jev-statements' 56 scenarios. The scorer is developed on jev-statements' held-out logs, which are already seen.
- **Holding the files.** The labellers write outside the repository. The labels' sha256 is recorded in an addendum
  here before the Jev run is scored. Material and labels are committed with the report.

## Jev runs

jev-statements' runner, copied as `run.ts` with only the log directory changed (`corpus/runs/item-size/`, gitignored)
and its arm imports pointed at `../jev-statements/arms/`. Arms B (`as-is`) and W (`w4`), finals, 120 cases × 5 reps,
order rotated per rep, one run. A refused judgment is refused in every X arm read from it.

## Scoring (per scored arm; a case's score is its mean over reps)

jev-statements' scorer adapted by a sonnet scorer (`briefs/scorer.md`) to these arms. Kept unchanged: E1 direction,
E2 opposite pairs held, **E3 pooled ρ**, E4 within-direction ρ, E5 three-way, E6, E7 rerun spread, E8 cost, P1 to P3,
the ceiling (second labeller scored as an arm), the consensus subset, and the abort when a logged score differs from
`combine` over its readings.

## Comparisons, decided now

1. **Primary, k = 3:** X1 against B, X2 against B, X3 against B, each linear, on B's logs.
2. **On E3,** by a paired scenario bootstrap: 10,000 resamples of scenarios with replacement, seeded **20261112**,
   the statistic the difference of E3, restarted per comparison. The interval is 1 − 0.05/3, so **98.33%**
   (Bonferroni). The challenger **wins** when the lower bound is above 0, **loses** when the upper bound is below 0,
   and **ties** otherwise.
3. **Secondaries, described, never deciding,** for each primary comparison:
   - E4 within-direction ρ, build and detract and their mean, by the same bootstrap;
   - E1 direction accuracy, by an exact two-sided McNemar test.
4. **Also described, E3 only, same bootstrap and width:**
   - X2 against X1 (does the level add over a fixed size), X3 against X2;
   - on W's logs: WX1, WX2 and WX3 against W, and W against B;
   - squared: each of B, X1, X2, X3 squared against its own linear row.
5. **Stage attribution (never decides):** jev-statements' swaps (gate oracle, direction oracle, both, no touches,
   labels only lin and sq) applied to B, X1, X2 and X3, linear.
6. **Recommendation.**
   - If no X arm wins, B's reading stays.
   - If one or more win, the recommendation is the winner with the highest held-out E3.
   - An X arm that loses is named as such.
   - Nothing on W's logs or squared decides anything.

## Post-hoc rescore (reported, decides nothing)

The same arms through the same scorer on logs whose held-out results are already seen and reported:
- jev-statements' held-out finals (B and W; `../../runs/jev-statements/2026-11-13T01-36-18-961Z-heldout-final/`),
  with its labels and second labels;
- jev-state's held-out finals, arms B and S (`../../runs/jev-state/2026-11-13T00-47-02-133Z-heldout-final/`;
  `check-readings.ts` passes on both. Its arm F splits its requests by step and is not read);
- gate-first-e2e's held-out final B (`../../runs/gate-first-e2e/2026-11-12T21-22-19-984Z-heldout-final/`; passes).

The report marks every one of these as post-hoc: the arms were chosen after jev-statements' attribution was read.

## Order of work

1. This file, `readings.ts`, `check-readings.ts`, `rescore.ts`, `run.ts` and the briefs, committed before any label.
2. The labeller and second labeller, in parallel with the scorer. The scorer works on jev-statements' held-out
   logs only.
3. The scorer committed; then the labels' hashes in an addendum; then the Jev run; then scoring and the report.

## Runs and cost, named before spending

| run | judgments | at most |
|---|---|---|
| B and W, 120 cases × 5 reps | 1,200 | 0.40 USD |
| X arms, squared, post-hoc rescores | 0 (rescored) | 0 |
| **ceiling** | | **0.40 USD** |

Basis: B 2.42e-4 and W 2.34e-4 USD per judgment on jev-statements' held-out, so about 0.29 USD expected. Agent work
besides: two opus labellers and one sonnet scorer.

## Addendum: fresh material delivered, before any Jev run on it

- The scorer was committed at 3022e31, with the post-hoc rescores of the three seen held-out sets. Those decide
  nothing.
- The labeller delivered 120 cases in 84 scenarios: three sets of 40, each with 12 opposite pairs, 5 conflict, 5
  neutral and 6 plain in 3 size pairs. Its validator passes on every make-up rule. No scenario spans two sets.
  `../jev-state/check-build.ts` passes ("120 cases: typed builder equals size-judgment's; 446 known facts, none after
  its target").
- `material.json` sha256 `14d6a1ac97ec6b938754ae73fa2ef438ac12927ffcb2f1cece06ca8281b5c71d`.
- `labels.json` sha256 `4a822c31f5cad19eeea8a5abaa4ddaca6c2be483fba3867dd3b08e7a66954420`.
- Both stay outside the repository until the run is scored.
- Security is the most-touched stake value in every set: 24, 23 and 28 of about 62 to 69 stake touches, as in
  jev-statements.
- The second labeller is labelling all 120 cases from `cases2.ts`'s rendering, in parallel with the Jev run.
