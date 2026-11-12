# gate-direction scoring

judgments: 1185 lines (0 ignored, case unlabelled); cases 79; scenarios 28; items 1580; seed 1, resamples 10000
touched items: stake up 39, stake down 61, deed up 68, deed down 20; untouched: stake 690, deed 702
values with 8+ touched items: achievement, benevolence, conformity, power, security, self_direction

| arm / variant | final | judgments | refused | reps | refused per rep |
|---|---|---|---|---|---|
| A / as-is | yes | 395 | 0 | 5 | 0, 0, 0, 0, 0 |
| B / mg3-45 | yes | 395 | 0 | 5 | 0, 0, 0, 0, 0 |
| C / cw3-z50 | yes | 395 | 0 | 5 | 0, 0, 0, 0, 0 |

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

## Ceiling: second labeller as an arm
- items labelled by both: 1580 of 1580
- overall: M1 0.744, M2 0.878, M3 0.925
- stake: M1 0.773, M2 0.840, M3 0.926
- deed: M1 0.725, M2 0.920, M3 0.925

## Consensus subset (both labellers agree): 1481 items, 165 touched
- A/as-is (final): M1 0.340, M2 0.868, M3 0.753
- B/mg3-45 (final): M1 0.494, M2 0.812, M3 0.905
- C/cw3-z50 (final): M1 0.474, M2 0.753, M3 0.867

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
