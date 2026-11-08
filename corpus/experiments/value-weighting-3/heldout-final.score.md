# value-weighting-3 scoring

## Header

- judgments: 440
- refusals: 0
  - O1/nogate-sides-sq (final): 0 of 220
  - O2/d4-top (final): 0 of 220
- reps: 5 (0, 1, 2, 3, 4)
- cases: 44
- opposite pairs: 14
  - by kind: conflict 6, neutral 6, opposite 28, plain 4
  - by direction: build 20, detract 18, neutral 6

## O1/nogate-sides-sq (final)

band 2; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 28/38 = 0.737
  - per rep: rep 0: 26/38 = 0.684; rep 1: 26/38 = 0.684; rep 2: 26/38 = 0.684; rep 3: 28/38 = 0.737; rep 4: 27/38 = 0.711
- **M2 magnitude** (Spearman, score vs signed label): rho 0.663; within build 0.571; within detract 0.521 (build 20, detract 18)
- **M3 opposite pairs**: 8/14 = 0.571
- **M4 conflict** (build/detract conflict cases): 2/6 = 0.333
- **M5 three-way**: accuracy 31/44 = 0.705; neutral read neutral 6/6 = 1; false neutrals (directional read neutral) 7/38 = 0.184; neutral |score| median 0, max 1.800
- **M6 noise**: spread (max-min over reps, 44 cases with >=2 scored reps) median 3, max 12; per-rep M1 correct range 26..28 (n 38,38,38,38,38); per-rep M5 correct range 30..30 (n 44,44,44,44,44)
- **M7 cost**: requests per judgment 8.045; questions per judgment 16.091; mean USD per judgment 0.000255147 (220 of 220 ok judgments report cost, 0 lacking); median ms per judgment 238.500

## O2/d4-top (final)

band 0.050; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 31/38 = 0.816
  - per rep: rep 0: 30/38 = 0.789; rep 1: 31/38 = 0.816; rep 2: 30/38 = 0.789; rep 3: 30/38 = 0.789; rep 4: 31/38 = 0.816
- **M2 magnitude** (Spearman, score vs signed label): rho 0.692; within build 0.535; within detract 0.106 (build 20, detract 18)
- **M3 opposite pairs**: 9/14 = 0.643
- **M4 conflict** (build/detract conflict cases): 5/6 = 0.833
- **M5 three-way**: accuracy 32/44 = 0.727; neutral read neutral 4/6 = 0.667; false neutrals (directional read neutral) 4/38 = 0.105; neutral |score| median 0.043, max 0.202
- **M6 noise**: spread (max-min over reps, 44 cases with >=2 scored reps) median 0.072, max 0.380; per-rep M1 correct range 30..31 (n 38,38,38,38,38); per-rep M5 correct range 31..32 (n 44,44,44,44,44)
- **M7 cost**: requests per judgment 2; questions per judgment 53.709; mean USD per judgment 0.000230343 (220 of 220 ok judgments report cost, 0 lacking); median ms per judgment 411.500

## Comparison

O1 = O1/nogate-sides-sq, O2 = O2/d4-top

1. Disqualification (fewer than half the opposite pairs): O1 holds 8 of 14, ok; O2 holds 9 of 14, ok
2. M5 (McNemar over all cases):
   M5: O1 right/O2 wrong b=4, O1 wrong/O2 right c=5, n=9, exact two-sided p=1.0000
   p >= 0.05: not decided
3. M1 (McNemar over build and detract cases):
   M1: O1 right/O2 wrong b=2, O1 wrong/O2 right c=5, n=7, exact two-sided p=0.4531
   p >= 0.05: not decided
4. M2 rho difference: O1 0.663, O2 0.692, O1 - O2 = -0.029 (decides when |diff| > 0.10)
   not decided
5. Tie on accuracy; the recommendation rests on cost and structure.
   mean USD per judgment: O1 0.000255147, O2 0.000230343; requests per judgment: O1 8.045, O2 2; questions per judgment: O1 16.091, O2 53.709

VERDICT: tie on accuracy (step 5); decide on cost and structure

## Second labeller (reported only; never affects the Comparison)

- direction agreement: 41/44 = 0.932
- confusion (rows = first labeller, columns = second):

| first \ second | build | detract | neutral |
|---|---|---|---|
| build | 19 | 1 | 0 |
| detract | 2 | 16 | 0 |
| neutral | 0 | 0 | 6 |

- Spearman between signed labels (44 cases): 0.929
- consensus subset: 41 cases (35 build/detract), 13 of 14 pairs

- O1/nogate-sides-sq (final): M1 27/35 = 0.771; M3 8/13 = 0.615; M5 30/41 = 0.732
- O2/d4-top (final): M1 29/35 = 0.829; M3 9/13 = 0.692; M5 31/41 = 0.756

## Per case

| case | kind | pair | label | O1/nogate-sides-sq (final) | O2/d4-top (final) |
|---|---|---|---|---|---|
| a01-1 | neutral |  | neutral | 0 [0, 0, 0, 0, 0] | -0.044 [-0.032, -0.050, -0.053, -0.038, -0.045] |
| a01-2 | opposite | a01-3 | build 2 | 18.200 [20, 11, 20, 20, 20] | 0.965 [0.932, 0.943, 0.955, 0.969, 1.027] |
| a01-3 | opposite | a01-2 | detract 3 | -8.600 [-5, -14, -14, -5, -5] | -0.850 [-0.782, -0.775, -0.969, -0.801, -0.924] |
| a01-4 | opposite | a01-5 | detract 2 | -1 ✗ [-1, -1, -1, -1, -1] | -0.127 [-0.132, -0.132, -0.121, -0.129, -0.121] |
| a01-5 | opposite | a01-4 | build 2 | -1.800 ✗ [0, 0, 0, -9, 0] | 0.038 ✗ [0.038, 0.040, 0.038, 0.040, 0.034] |
| a02-1 | opposite | a02-2 | build 1 | 2 [2, 2, 2, 2, 2] | 0.182 [0.178, 0.175, 0.195, 0.191, 0.171] |
| a02-2 | opposite | a02-1 | detract 2 | 1 ✗ [1, 1, 1, 1, 1] | 0.156 ✗ [0.125, 0.203, 0.116, 0.132, 0.203] |
| a03-1 | opposite | a03-2 | build 2 | 19 [20, 17, 21, 17, 20] | 1.648 [1.759, 1.426, 1.786, 1.772, 1.496] |
| a03-2 | opposite | a03-1 | detract 2 | 1 ✗ [1, 1, 1, 1, 1] | -0.569 [-0.569, -0.561, -0.603, -0.535, -0.576] |
| a03-3 | opposite | a03-4 | build 2 | 18.600 [18, 22, 22, 18, 13] | 0.483 [0.430, 0.513, 0.494, 0.496, 0.482] |
| a03-4 | opposite | a03-3 | detract 1 | 17 ✗ [17, 17, 17, 17, 17] | 0.306 ✗ [0.278, 0.296, 0.294, 0.300, 0.364] |
| a04-1 | opposite | a04-2 | build 2 | 11 [13, 8, 13, 13, 8] | 0.789 [0.782, 0.766, 0.916, 0.743, 0.736] |
| a04-2 | opposite | a04-1 | detract 2 | -13.400 [-18, -13, -9, -18, -9] | -0.338 [-0.395, -0.369, -0.314, -0.315, -0.300] |
| a05-1 | opposite | a05-2 | build 2 | 19 [19, 19, 19, 19, 19] | 0.915 [0.913, 0.885, 0.951, 0.927, 0.900] |
| a05-2 | opposite | a05-1 | detract 2 | 4 ✗ [4, 4, 4, 4, 4] | 1.208 ✗ [1.171, 1.193, 1.150, 1.317, 1.210] |
| a05-3 | conflict |  | detract 1 | -6.800 [-14, -5, -5, -5, -5] | -1.605 [-1.431, -1.660, -1.811, -1.549, -1.575] |
| a06-1 | opposite | a06-2 | build 3 | 33.800 [35, 35, 32, 32, 35] | 1.597 [1.537, 1.548, 1.792, 1.511, 1.596] |
| a06-2 | opposite | a06-1 | detract 2 | -9.600 [-9, -12, -9, -9, -9] | -2.732 [-2.821, -2.727, -2.667, -2.684, -2.762] |
| a07-1 | opposite | a07-2 | build 2 | 12 [12, 12, 12, 12, 12] | 2.075 [2.068, 2.103, 2.090, 2.032, 2.082] |
| a07-2 | opposite | a07-1 | detract 2 | -17.200 [-18, -17, -17, -17, -17] | -2.459 [-2.448, -2.470, -2.435, -2.448, -2.495] |
| a08-1 | plain |  | build 2 | 34.200 [39, 33, 33, 33, 33] | 1.489 [1.467, 1.523, 1.518, 1.481, 1.458] |
| a08-2 | neutral |  | neutral | 1.800 [2, 1, 2, 2, 2] | 0.032 [0.034, 0.033, 0.031, 0.032, 0.029] |
| a09-1 | neutral |  | neutral | 0 [0, 0, 0, 0, 0] | 0.055 ✗ [0.061, 0.052, 0.054, 0.058, 0.052] |
| a09-2 | opposite | a09-3 | build 2 | 11 [11, 11, 11, 11, 11] | 0.010 ✗ [0.029, 0.029, 0.007, -0.022, 0.007] |
| a09-3 | opposite | a09-2 | detract 2 | -10.600 [-10, -10, -13, -10, -10] | -1.600 [-1.678, -1.433, -1.601, -1.672, -1.617] |
| a09-4 | conflict |  | detract 1 | 0.200 ✗ [0, 0, 4, -1, -2] | -0.776 [-0.846, -0.616, -0.828, -0.818, -0.771] |
| a10-1 | neutral |  | neutral | -1 [-1, -1, -1, -1, -1] | -0.043 [-0.041, -0.044, -0.048, -0.039, -0.040] |
| a10-2 | plain |  | build 2 | 8 [7, 8, 8, 10, 7] | 0.677 [0.689, 0.692, 0.670, 0.661, 0.675] |
| a11-1 | opposite | a11-2 | build 2 | 14.800 [15, 15, 15, 14, 15] | 1.209 [1.044, 1.218, 1.171, 1.347, 1.264] |
| a11-2 | opposite | a11-1 | detract 1 | -4 [-9, -1, -8, -1, -1] | -0.525 [-0.520, -0.534, -0.503, -0.551, -0.515] |
| a11-3 | conflict |  | detract 1 | 6.400 ✗ [14, 4, 4, 5, 5] | -0.220 [-0.204, -0.222, -0.196, -0.232, -0.247] |
| a12-1 | neutral |  | neutral | 0 [0, 0, 0, 0, 0] | 0.028 [0.034, 0.028, 0.024, 0.025, 0.029] |
| a12-2 | opposite | a12-3 | build 2 | 25.400 [23, 22, 28, 27, 27] | 1.471 [1.399, 1.467, 1.405, 1.609, 1.473] |
| a12-3 | opposite | a12-2 | detract 2 | 17 ✗ [15, 20, 15, 15, 20] | 0.228 ✗ [0.176, 0.260, 0.277, 0.216, 0.211] |
| a13-1 | opposite | a13-2 | build 2 | 9 [7, 8, 7, 7, 16] | 0.505 [0.320, 0.541, 0.561, 0.573, 0.529] |
| a13-2 | opposite | a13-1 | detract 2 | -1 ✗ [1, 1, 1, -9, 1] | 0.110 ✗ [0.090, 0.105, 0.121, 0.100, 0.136] |
| a14-1 | opposite | a14-2 | build 2 | 0.600 ✗ [0, 0, 0, 0, 3] | 0.837 [0.777, 0.832, 0.748, 0.974, 0.855] |
| a14-2 | opposite | a14-1 | detract 3 | -14 [-14, -14, -14, -14, -14] | -2.118 [-2.128, -2.131, -2.086, -2.088, -2.159] |
| a15-1 | conflict |  | build 1 | -34.600 ✗ [-28, -37, -36, -36, -36] | -1.055 ✗ [-0.961, -0.970, -1.181, -1.194, -0.970] |
| a16-1 | conflict |  | build 1 | 11.400 [11, 11, 11, 12, 12] | 0.852 [0.842, 0.848, 0.846, 0.854, 0.868] |
| a17-1 | conflict |  | build 1 | -13.200 ✗ [-13, -14, -14, -14, -11] | 0.012 ✗ [-0.000, 0.011, -0.011, 0.034, 0.025] |
| a18-1 | neutral |  | neutral | 0 [0, 0, 0, 0, 0] | 0.202 ✗ [0.123, 0.134, 0.253, 0.246, 0.252] |
| a18-2 | plain |  | build 2 | 8 [8, 11, 11, 11, -1] | 1.201 [1.225, 1.190, 1.174, 1.197, 1.216] |
| a19-1 | plain |  | detract 3 | -25 [-25, -25, -25, -25, -25] | 0.044 ✗ [0.036, 0.037, 0.037, 0.046, 0.064] |

