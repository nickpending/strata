# gate-direction scoring

judgments: 2765 lines (0 ignored, case unlabelled); cases 79; scenarios 28; items 1580; seed 1, resamples 10000
touched items: stake up 39, stake down 61, deed up 68, deed down 20; untouched: stake 690, deed 702
values with 8+ touched items: achievement, benevolence, conformity, power, security, self_direction

| arm / variant | final | judgments | refused | reps | refused per rep |
|---|---|---|---|---|---|
| A / as-is | yes | 395 | 0 | 5 | 0, 0, 0, 0, 0 |
| B / mg3-45 | yes | 395 | 0 | 5 | 0, 0, 0, 0, 0 |
| C / cw3-z50 | yes | 395 | 0 | 5 | 0, 0, 0, 0, 0 |
| A / a-z50 | no | 395 | 0 | 5 | 0, 0, 0, 0, 0 |
| B / g3-40 | no | 237 | 0 | 3 | 0, 0, 0 |
| B / m3-45 | no | 237 | 0 | 3 | 0, 0, 0 |
| B / mg3-50 | no | 237 | 0 | 3 | 0, 0, 0 |
| C / cw-z50 | no | 237 | 0 | 3 | 0, 0, 0 |
| C / cw3-z60 | no | 237 | 0 | 3 | 0, 0, 0 |

## A / as-is (final)
- M1 (primary) item rho: per rep [0.322, 0.322, 0.325, 0.327, 0.321], mean 0.324
- M2 direction 0.840; M3 gate AUC 0.737
- M4 stake: M1 0.286, M2 0.798, M3 0.695
- M4 deed: M1 0.366, M2 0.889, M3 0.782
- M5 per value (8+ touched): achievement M2 1.000 M3 0.903; benevolence M2 0.674 M3 0.660; conformity M2 0.733 M3 0.470; power M2 0.973 M3 0.824; security M2 0.808 M3 0.665; self_direction M2 1.000 M3 0.940
- M6 at 0.5 (mean over reps): false fires 165.0 of 1392 untouched; misses 112.0 of 188 touched (of which quiet 108.8)
- M7 share of items whose sign changes across reps 0.079 (125/1580); SD of M1 over reps 0.002
- M8 requests/judgment 1.00, questions/judgment 40.00, USD/judgment 1.39e-4, median ms 259

## B / mg3-45 (final)
- M1 (primary) item rho: per rep [0.451, 0.473, 0.478, 0.459, 0.455], mean 0.463
- M2 direction 0.786; M3 gate AUC 0.883
- M4 stake: M1 0.464, M2 0.786, M3 0.897
- M4 deed: M1 0.464, M2 0.786, M3 0.874
- M5 per value (8+ touched): achievement M2 0.927 M3 0.938; benevolence M2 0.651 M3 0.793; conformity M2 0.507 M3 0.636; power M2 0.908 M3 0.900; security M2 0.797 M3 0.808; self_direction M2 1.000 M3 0.988
- M6 at 0.5 (mean over reps): false fires 234.6 of 1392 untouched; misses 51.2 of 188 touched (of which quiet 36.6)
- M7 share of items whose sign changes across reps 0.057 (90/1580); SD of M1 over reps 0.012
- M8 requests/judgment 1.93, questions/judgment 45.88, USD/judgment 2.54e-4, median ms 502

## C / cw3-z50 (final)
- M1 (primary) item rho: per rep [0.456, 0.454, 0.446, 0.437, 0.456], mean 0.450
- M2 direction 0.724; M3 gate AUC 0.843
- M4 stake: M1 0.426, M2 0.748, M3 0.866
- M4 deed: M1 0.475, M2 0.698, M3 0.818
- M5 per value (8+ touched): achievement M2 0.800 M3 0.831; benevolence M2 0.549 M3 0.747; conformity M2 0.333 M3 0.577; power M2 0.886 M3 0.864; security M2 0.780 M3 0.833; self_direction M2 0.846 M3 0.866
- M6 at 0.5 (mean over reps): false fires 284.2 of 1392 untouched; misses 51.8 of 188 touched (of which quiet 36.4)
- M7 share of items whose sign changes across reps 0.045 (71/1580); SD of M1 over reps 0.008
- M8 requests/judgment 1.00, questions/judgment 40.00, USD/judgment 1.49e-4, median ms 263

## A / a-z50 (contender)
- M1 (primary) item rho: per rep [0.346, 0.342, 0.345, 0.340, 0.334], mean 0.342
- M2 direction 0.715; M3 gate AUC 0.781
- M4 stake: M1 0.304, M2 0.710, M3 0.762
- M4 deed: M1 0.403, M2 0.720, M3 0.795
- M5 per value (8+ touched): achievement M2 1.000 M3 0.946; benevolence M2 0.549 M3 0.710; conformity M2 0.333 M3 0.431; power M2 0.849 M3 0.788; security M2 0.744 M3 0.794; self_direction M2 0.923 M3 0.866
- M6 at 0.5 (mean over reps): false fires 548.6 of 1392 untouched; misses 53.6 of 188 touched (of which quiet 32.6)
- M7 share of items whose sign changes across reps 0.058 (91/1580); SD of M1 over reps 0.005
- M8 requests/judgment 1.00, questions/judgment 40.00, USD/judgment 1.39e-4, median ms 259

## B / g3-40 (contender)
- M1 (primary) item rho: per rep [0.419, 0.438, 0.421], mean 0.426
- M2 direction 0.833; M3 gate AUC 0.888
- M4 stake: M1 0.419, M2 0.833, M3 0.892
- M4 deed: M1 0.435, M2 0.833, M3 0.890
- M5 per value (8+ touched): achievement M2 1.000 M3 0.923; benevolence M2 0.743 M3 0.811; conformity M2 0.578 M3 0.664; power M2 0.919 M3 0.893; security M2 0.845 M3 0.793; self_direction M2 1.000 M3 0.982
- M6 at 0.5 (mean over reps): false fires 304.7 of 1392 untouched; misses 45.7 of 188 touched (of which quiet 28.0)
- M7 share of items whose sign changes across reps 0.058 (92/1580); SD of M1 over reps 0.011
- M8 requests/judgment 2.00, questions/judgment 28.46, USD/judgment 1.82e-4, median ms 548

## B / m3-45 (contender)
- M1 (primary) item rho: per rep [0.448, 0.451, 0.469], mean 0.456
- M2 direction 0.817; M3 gate AUC 0.895
- M4 stake: M1 0.472, M2 0.823, M3 0.914
- M4 deed: M1 0.443, M2 0.811, M3 0.880
- M5 per value (8+ touched): achievement M2 0.939 M3 0.946; benevolence M2 0.667 M3 0.777; conformity M2 0.600 M3 0.660; power M2 0.919 M3 0.917; security M2 0.845 M3 0.832; self_direction M2 1.000 M3 0.982
- M6 at 0.5 (mean over reps): false fires 291.7 of 1392 untouched; misses 44.0 of 188 touched (of which quiet 27.3)
- M7 share of items whose sign changes across reps 0.038 (60/1580); SD of M1 over reps 0.011
- M8 requests/judgment 1.97, questions/judgment 26.80, USD/judgment 1.79e-4, median ms 557

## B / mg3-50 (contender)
- M1 (primary) item rho: per rep [0.466, 0.469, 0.465], mean 0.467
- M2 direction 0.722; M3 gate AUC 0.853
- M4 stake: M1 0.458, M2 0.703, M3 0.857
- M4 deed: M1 0.476, M2 0.742, M3 0.853
- M5 per value (8+ touched): achievement M2 0.909 M3 0.935; benevolence M2 0.581 M3 0.777; conformity M2 0.444 M3 0.624; power M2 0.847 M3 0.867; security M2 0.723 M3 0.785; self_direction M2 1.000 M3 0.989
- M6 at 0.5 (mean over reps): false fires 236.0 of 1392 untouched; misses 52.3 of 188 touched (of which quiet 36.0)
- M7 share of items whose sign changes across reps 0.028 (44/1580); SD of M1 over reps 0.002
- M8 requests/judgment 1.92, questions/judgment 44.91, USD/judgment 2.47e-4, median ms 559

## C / cw-z50 (contender)
- M1 (primary) item rho: per rep [0.431, 0.436, 0.436], mean 0.434
- M2 direction 0.764; M3 gate AUC 0.844
- M4 stake: M1 0.423, M2 0.780, M3 0.863
- M4 deed: M1 0.437, M2 0.746, M3 0.822
- M5 per value (8+ touched): achievement M2 0.939 M3 0.894; benevolence M2 0.571 M3 0.750; conformity M2 0.467 M3 0.633; power M2 0.937 M3 0.833; security M2 0.798 M3 0.816; self_direction M2 0.846 M3 0.850
- M6 at 0.5 (mean over reps): false fires 380.7 of 1392 untouched; misses 44.3 of 188 touched (of which quiet 28.0)
- M7 share of items whose sign changes across reps 0.049 (77/1580); SD of M1 over reps 0.003
- M8 requests/judgment 1.00, questions/judgment 40.00, USD/judgment 1.48e-4, median ms 284

## C / cw3-z60 (contender)
- M1 (primary) item rho: per rep [0.486, 0.470, 0.485], mean 0.480
- M2 direction 0.672; M3 gate AUC 0.819
- M4 stake: M1 0.453, M2 0.687, M3 0.839
- M4 deed: M1 0.507, M2 0.655, M3 0.797
- M5 per value (8+ touched): achievement M2 0.727 M3 0.809; benevolence M2 0.505 M3 0.712; conformity M2 0.333 M3 0.602; power M2 0.847 M3 0.857; security M2 0.723 M3 0.815; self_direction M2 0.769 M3 0.840
- M6 at 0.5 (mean over reps): false fires 189.7 of 1392 untouched; misses 61.7 of 188 touched (of which quiet 50.3)
- M7 share of items whose sign changes across reps 0.023 (37/1580); SD of M1 over reps 0.009
- M8 requests/judgment 1.00, questions/judgment 40.00, USD/judgment 1.49e-4, median ms 287

## Ceiling: second labeller as an arm
- items labelled by both: 1580 of 1580
- overall: M1 0.744, M2 0.878, M3 0.925
- stake: M1 0.773, M2 0.840, M3 0.926
- deed: M1 0.725, M2 0.920, M3 0.925

## Consensus subset (both labellers agree): 1481 items, 165 touched
- A/as-is (final): M1 0.340, M2 0.868, M3 0.753
- B/mg3-45 (final): M1 0.494, M2 0.812, M3 0.905
- C/cw3-z50 (final): M1 0.474, M2 0.753, M3 0.867
- A/a-z50: M1 0.366, M2 0.736, M3 0.793
- B/g3-40: M1 0.448, M2 0.861, M3 0.915
- B/m3-45: M1 0.482, M2 0.840, M3 0.917
- B/mg3-50: M1 0.503, M2 0.745, M3 0.871
- C/cw-z50: M1 0.462, M2 0.790, M3 0.865
- C/cw3-z60: M1 0.513, M2 0.701, M3 0.842

## Comparison (finals)
Step 1. Paired scenario bootstrap on M1: 28 scenarios, 10000 resamples, seed 1; 2 challenger(s), interval 97.50%.
(weighted-Spearman check at unit weights: A 0.323576 vs plain 0.323576)
- B/mg3-45: M1 0.463 vs A 0.324, difference 0.140; interval [0.065, 0.212] (10000 resamples used, 0 dropped as NaN): beats A
- C/cw3-z50: M1 0.450 vs A 0.324, difference 0.126; interval [0.083, 0.171] (10000 resamples used, 0 dropped as NaN): beats A

Step 2. Beaters: B, C; top M1 B 0.463; within 0.02 of top: C (40.00 questions/judgment), B (45.88 questions/judgment); recommended: C/cw3-z50.

Step 3. Grade of C/cw3-z50:
- (b) M2 0.724 >= 0.85: fails
- (c) M3 0.843 >= 0.85: fails
- (a) M1 0.450 >= ceiling 0.744 - 0.10 = 0.644: fails
- Grade: no

Step 4. A's loss: gate (1 - M3) 0.263 vs direction (1 - M2) 0.160: larger is gate.
Weaker channel by M4 (lower M1): stake (stake M1 0.286, M2 0.798, M3 0.695; deed M1 0.366, M2 0.889, M3 0.782).

VERDICT: recommended C/cw3-z50; beats A: B, C; grade no; A's larger loss: gate; weaker channel: stake
