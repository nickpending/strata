# value-weighting: is an NPC's value importance applied by Jev or by code?

This is experiment material, not strata's design. The catalogue (Schwartz's ten values), the 0 to 4 importance
scale and the seven profiles exist only for this test. The rule and the comparison were fixed in `prereg.md` and
committed in 2c42917, before any arm ran. An agent that saw only `catalogue.json` and the task wrote the labels
(`labels.json`, `profiles.json`): 36 cases over 22 events, with 11 opposite pairs, 18 conflict cases and 4
neutral cases. Run: `bun run.ts 3`, then `bun score.ts <calls.jsonl>`. The raw calls stay local under
`corpus/runs/value-weighting/2026-11-07T22-15-36-580Z/`.

## Verdict by the pre-registered rule: O2, code applies importance

1. **Disqualifier (M3 under half the opposite pairs).** O1 holds 3 of 11 pairs, so O1 is out. O2 holds 6 of 11
   and passes, but only just.
2. **Direction (M1).** O2 gets 26 of 32 and O1 gets 23 of 32. The noise is 1 case: per-rep M1 was
   23 / 23 / 22 for O1 and 26 / 26 / 26 for O2. A 3-case lead beats it, so O2 wins.

## Results

Calls: 216 (0 refused). Reps: 3. Cases: 36 (32 build or detract).

| metric | O1 | O2 | O2-gated (secondary) |
|---|---|---|---|
| M1 direction, mean score | 23 / 32 | 26 / 32 | 25 / 32 |
| M1 direction, per rep | 23 / 23 / 22 | 26 / 26 / 26 | 25 / 25 / 25 |
| M2 Spearman ρ | 0.75 | 0.77 | 0.79 |
| M3 opposite pairs held | 3 / 11 | 6 / 11 | 5 / 11 |
| M4 conflict direction | 12 / 18 | 13 / 18 | 13 / 18 |
| M5 three-way (band 0.25) | 21 / 36 | 22 / 36 | 25 / 36 |
| neutral cases' abs score, median / max | 0.33 / 0.51 | 0.66 / 1.13 | 0.07 / 0.87 |
| M6 rerun spread, median / max | 0.02 / 0.09 | 0.05 / 0.15 | 0.04 / 0.43 |
| M7 O1: questions, USD, median ms per judgment | 2 nouls in 1 call | 2.34e-5 | 179 |
| M7 O2: questions, USD, median ms per judgment | 20 nouls in 1 call | 3.74e-5 | 185 |

D1 O2 per-value direction vs labelled touches: 48 / 49.
Misses: e22_workshop_keys/hedonism setback (adv 0.73, set 0.19).

| case | kind | label | O1 | O2 | O2-gated | O1 reps | O2 reps |
|---|---|---|---|---|---|---|---|
| c01 | conflict ↔ c02 | build 3 | 0.26 | 0.54 | 0.59 | 0.26, 0.26, 0.26 | 0.57, 0.56, 0.50 |
| c02 | conflict ↔ c01 | detract 2 | 0.12 ✗ | 0.16 ✗ | 0.23 ✗ | 0.13, 0.12, 0.12 | 0.19, 0.13, 0.17 |
| c03 | conflict ↔ c04 | build 2 | 0.46 | 0.30 | 0.29 | 0.46, 0.45, 0.48 | 0.34, 0.31, 0.26 |
| c04 | conflict ↔ c03 | detract 3 | 0.10 ✗ | -0.68 | -0.58 | 0.13, 0.09, 0.09 | -0.67, -0.67, -0.70 |
| c05 | conflict ↔ c06 | detract 3 | -0.04 | -0.79 | -0.75 | -0.03, -0.09, 0.00 | -0.80, -0.71, -0.86 |
| c06 | conflict ↔ c05 | build 1 | 0.47 | -0.13 ✗ | -0.12 ✗ | 0.48, 0.48, 0.46 | -0.14, -0.14, -0.10 |
| c07 | conflict ↔ c08 | build 2 | 0.15 | 0.21 | 0.19 | 0.15, 0.15, 0.15 | 0.22, 0.24, 0.16 |
| c08 | conflict ↔ c07 | detract 1 | 0.32 ✗ | -0.17 | 0.06 ✗ | 0.32, 0.33, 0.31 | -0.18, -0.17, -0.14 |
| c09 | conflict | detract 1 | 0.30 ✗ | 0.17 ✗ | 0.46 ✗ | 0.28, 0.30, 0.31 | 0.17, 0.16, 0.16 |
| c10 | plain | build 2 | 0.61 | 1.67 | 1.59 | 0.62, 0.61, 0.61 | 1.67, 1.63, 1.71 |
| c11 | conflict ↔ c12 | build 1 | 0.39 | -0.10 ✗ | 0.09 | 0.39, 0.39, 0.38 | -0.10, -0.10, -0.10 |
| c12 | conflict ↔ c11 | detract 3 | -0.45 | -1.47 | -1.31 | -0.45, -0.44, -0.45 | -1.50, -1.46, -1.45 |
| c13 | conflict ↔ c14 | build 3 | 0.44 | 1.49 | 1.49 | 0.46, 0.41, 0.45 | 1.50, 1.50, 1.48 |
| c14 | conflict ↔ c13 | detract 2 | 0.34 ✗ | -0.54 | -0.27 | 0.35, 0.35, 0.33 | -0.57, -0.49, -0.54 |
| c15 | conflict | build 1 | 0.50 | 0.76 | 0.83 | 0.52, 0.51, 0.47 | 0.78, 0.77, 0.74 |
| c16 | conflict ↔ c17 | detract 1 | 0.34 ✗ | -0.46 | -0.27 | 0.35, 0.33, 0.34 | -0.50, -0.52, -0.37 |
| c17 | conflict ↔ c16 | build 2 | 0.33 | 0.18 | 0.21 | 0.33, 0.32, 0.33 | 0.21, 0.19, 0.14 |
| c18 | plain | build 3 | 0.52 | 3.00 | 2.87 | 0.50, 0.52, 0.54 | 3.01, 2.99, 3.00 |
| c19 | neutral | neutral 0 | 0.51 ✗ | 0.77 ✗ | 0.14 | 0.50, 0.51, 0.52 | 0.78, 0.74, 0.80 |
| c20 | neutral | neutral 0 | 0.28 ✗ | 0.27 ✗ | 0.00 | 0.27, 0.29, 0.29 | 0.27, 0.27, 0.26 |
| c21 | plain | build 2 | 0.79 | 2.03 | 1.96 | 0.80, 0.79, 0.79 | 2.06, 2.01, 2.01 |
| c22 | neutral | neutral 0 | 0.34 ✗ | 1.13 ✗ | 0.87 ✗ | 0.34, 0.34, 0.34 | 1.15, 1.13, 1.09 |
| c23 | plain | detract 3 | -0.72 | -2.43 | -2.17 | -0.72, -0.72, -0.72 | -2.43, -2.43, -2.44 |
| c24 | plain | detract 2 | -0.34 | -1.72 | -1.30 | -0.34, -0.34, -0.33 | -1.70, -1.73, -1.75 |
| c25 | plain | build 3 | 0.58 | 1.22 | 1.18 | 0.57, 0.58, 0.58 | 1.23, 1.19, 1.23 |
| c26 | conflict ↔ c27 | build 2 | 0.33 | -0.82 ✗ | -0.42 ✗ | 0.32, 0.32, 0.35 | -0.78, -0.91, -0.76 |
| c27 | conflict ↔ c26 | detract 3 | -0.46 | -2.54 | -2.46 | -0.47, -0.47, -0.45 | -2.54, -2.57, -2.52 |
| c28 | plain | detract 2 | -0.28 | -1.78 | -1.72 | -0.28, -0.31, -0.26 | -1.77, -1.77, -1.79 |
| c29 | plain | detract 3 | -0.65 | -1.99 | -1.90 | -0.61, -0.69, -0.66 | -1.96, -2.01, -1.98 |
| c30 | neutral | neutral 0 | 0.32 ✗ | 0.55 ✗ | 0.00 | 0.33, 0.32, 0.32 | 0.55, 0.54, 0.55 |
| c31 | opposite ↔ c32 | build 2 | 0.66 | 1.00 | 0.94 | 0.66, 0.65, 0.66 | 0.98, 1.03, 0.99 |
| c32 | opposite ↔ c31 | detract 2 | 0.03 ✗ | -0.71 | -0.76 | 0.03, 0.06, 0.01 | -0.72, -0.70, -0.72 |
| c33 | opposite ↔ c34 | build 2 | 0.63 | 0.34 | 0.51 | 0.63, 0.63, 0.62 | 0.29, 0.36, 0.35 |
| c34 | opposite ↔ c33 | detract 2 | 0.22 ✗ | -0.12 | 0.04 ✗ | 0.24, 0.22, 0.19 | -0.15, -0.10, -0.11 |
| c35 | opposite ↔ c36 | build 2 | 0.53 | 2.48 | 2.30 | 0.51, 0.55, 0.54 | 2.48, 2.47, 2.47 |
| c36 | opposite ↔ c35 | detract 1 | 0.52 ✗ | 1.42 ✗ | 1.34 ✗ | 0.52, 0.54, 0.50 | 1.46, 1.41, 1.40 |

## What the failures show (post hoc, not pre-registered)

- **O1 barely reads the profile.** O1's score sits positive. 9 of its 16 detract cases score above zero, against
  3 of 16 for O2. Within an opposite pair, O1 does order the build case above the detract case in 9 of 11, but
  the median gap is 0.36. O2 orders all 11 correctly, with a median gap of 0.98. The worst case is c35 and c36:
  the same event for two profiles scores 0.53 and 0.52 under O1. Shown a profile, Jev's single judgment is
  mostly what the event means to anyone, the failure journey item 15 predicts.
- **O2's misses are about where zero sits, not the ordering.** Using the labeller's own touches times the
  importances (a perfect per-value judge) gives 29 of 32 on direction. O2 with Jev's per-value answers gives
  26. Jev's per-value direction agrees with the labelled touches on 48 of 49. The one miss is e22, where the
  labeller read a workshop handed over for a year as a loss of free time and Jev read it as a gain. The
  remaining loss comes from values the labeller didn't list but Jev answered:
  - c26: cancelling the family lunch without asking the mother reads to Jev as a benevolence setback (0.80).
  - c02: a party that kept the street up reads to Jev as advancing benevolence, security and tradition.
- **O2 ungated drifts positive on neutral events.** A passing nod in the market (c19) gives security an advance
  of 0.48, and summed over ten values that is 0.77. The secondary gate, which counts a value only when
  max(adv, set) ≥ 0.5, brings 3 of the 4 neutral cases under 0.14 and raises M5 from 22 to 25 of 36. It was
  secondary, and these results have now been seen, so its threshold can't be set from this set.
- **Profiles that hold opposing values high** are selin (power and achievement against benevolence) and bram
  (stimulation against security). On those profiles both arms get 2 of 4 conflict cases. The labels there are
  slight (magnitude 1) and torn ("sore at losing the climb, but quietly glad"), and neither arm resolves them.
- **Noise is small for both arms.** The median rerun spread is 0.02 for O1 and 0.05 for O2. Per-rep direction
  counts move by at most 1 case. The arms' difference is not noise.

## Cost

Each judgment is one `decide` call in both arms. O1 asks 2 nouls at 2.3e-5 USD per judgment. O2 asks 20 nouls at
3.7e-5 USD. The median latency is 179 ms for O1 and 185 ms for O2. The whole run was 216 calls, 0 refused, and
cost 0.0066 USD.

## Limits

- One labeller wrote the labels, and it was told importance is an amplifier. Its verdicts follow its own touches
  times importance on 29 of 32, so the labels may lean toward O2's structure.
- 36 cases is small, and O2 holds 6 of 11 pairs, one over the disqualifying line.
- Only one wording was tried for O1. Prompt variants of O1 were not tested.

## Recommendation

Code applies importance (O2). The decisive reason: when the importances are put in front of Jev, it largely
ignores them, which is exactly the profile-dependence this layer exists for. Asked about one value at a time with
no profile, Jev answers that value's direction reliably (48 of 49), and the arithmetic then separates profiles
every time (11 of 11 pairs ordered). Further reasons, which rest on structure rather than accuracy:
- The per-value answers are auditable.
- A changed importance re-weights past encounters with no new call.
- The cost difference is 1.4e-5 USD per judgment.

What O2 leaves open is the zero point: untouched values drift, and Jev reads touches the labeller didn't. The
next step is a pre-registered gate, or a separate "touched" noul per value, tested on a fresh blind set, because
this set has now been seen.
