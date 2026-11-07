# Pre-registration: value-weighting

Written 2026-11-07 before the labels were seen and before any arm ran. Experiment material only, not strata's
design. The question: when an encounter touches an NPC's values, is the NPC's importance applied by Jev (O1) or by
code (O2)?

## Material

- `catalogue.json`: Schwartz's ten values with descriptions, and the importance scale 0 to 4.
- `profiles.json`, `labels.json`: written by an agent that saw only the catalogue and the task, never this file,
  the arms' questions or their code.

## The state both arms see

```
You are {name}.
You have known {other} for a long time.
{O1 only: the importance block}
What just happened: {text}
```

O1's importance block lists all ten values, in catalogue order, as `- {description}: {importance}` under the line
"How much each of these matters to you, from 0 (not at all) to 4 (central to who you are):". O2 sees no importances.

## The arms

Every question is a noul. Neither arm asks a choice question. Each judgment is one `decide` call
(harness/src/jev.ts), unchanged.

- **O1, Jev applies importance.** Two nouls:
  - `builds`: "Judged by what matters to you, does what just happened build on your relationship with {other}?"
  - `detracts`: "Judged by what matters to you, does what just happened detract from your relationship with {other}?"
  - score₁ = builds − detracts, in [−1, 1].
- **O2, code applies importance.** Twenty nouls, two per value v:
  - `adv_v`: "Does what just happened advance this for you: {description}?"
  - `set_v`: "Does what just happened set this back for you: {description}?"
  - score₂ = Σ_v importance_v · (adv_v − set_v) / 4. One value at importance 4, fully advanced, gives 1.
  - Secondary, from the same answers: O2-gated counts a value only when max(adv_v, set_v) ≥ 0.5. It is reported
    and never decides.

## Runs

There are 3 reps for every case in every arm. The order is case by case, with both arms run inside each rep and
the arm order alternating, so drift over time hits both arms. Raw calls go to `corpus/runs/value-weighting/`, which
stays local.

## Scoring (case score = mean of its 3 reps)

- **M1 direction:** on build and detract cases, whether the sign of the score matches the label. Reported for the
  mean and for each rep.
- **M2 magnitude:** Spearman ρ between the score and the signed label (+magnitude for build, −magnitude for
  detract, 0 for neutral), over all cases.
- **M3 opposite pairs:** a pair holds when both of its cases get the right sign.
- **M4 conflict:** M1 restricted to conflict cases.
- **M5 three-way:** neutral when |score| < 0.25, else the sign. Accuracy over all cases. The neutral cases' |score|
  is reported.
- **M6 noise:** per case, the spread of the score across reps (max − min). The median and the maximum are reported.
- **M7 cost:** calls, reported USD and latency per judgment.
- **D1, an O2 diagnostic only:** against the labeller's `touches`, a labelled advance should come out with
  adv > set, and a labelled setback with set > adv.

## Comparison, decided now

1. An arm that holds fewer than half the opposite pairs (M3) is disqualified, because telling profiles apart is
   the point.
2. Otherwise, an arm wins on direction when its M1 (on the mean score) beats the other's by more than the noise.
   The noise is the larger of the two arms' per-rep M1 ranges, and it is at least 1 case.
3. If M1 is within the noise, an M2 difference above 0.10 decides.
4. Otherwise the arms tie on accuracy, and the recommendation rests on cost and structure, which are named as
   such.
