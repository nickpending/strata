# value-weighting-2 scoring

## Header

- calls: 320
- refusals: 0
  - O1/lens-late-s5 (final): 0 of 160
  - O2/C-hyb-top-sig2 (final): 0 of 160
- reps: 5 (0, 1, 2, 3, 4)
- cases: 32
- opposite pairs: 7
  - by kind: conflict 8, neutral 6, opposite 14, plain 4
  - by direction: build 14, detract 12, neutral 6

## O1/lens-late-s5 (final)

band 0.100; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 20/26 = 0.769
  - per rep: rep 0: 20/26 = 0.769; rep 1: 19/26 = 0.731; rep 2: 20/26 = 0.769; rep 3: 19/26 = 0.731; rep 4: 20/26 = 0.769
- **M2 magnitude** (Spearman, score vs signed label): rho 0.765; within build 0.526; within detract 0.658 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 6/8 = 0.750
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 1/6 = 0.167; false neutrals (directional read neutral) 2/26 = 0.077; neutral |score| median 0.340, max 1.042
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.110, max 0.430; per-rep M1 correct range 19..20 (n 26,26,26,26,26); per-rep M5 correct range 18..20 (n 32,32,32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.000042532875000000006 (160 of 160 ok calls report cost); median ms 198

## O2/C-hyb-top-sig2 (final)

band 0.030; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 20/26 = 0.769; rep 1: 19/26 = 0.731; rep 2: 19/26 = 0.731; rep 3: 19/26 = 0.731; rep 4: 20/26 = 0.769
- **M2 magnitude** (Spearman, score vs signed label): rho 0.554; within build 0.191; within detract 0.307 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 6/8 = 0.750
- **M5 three-way**: accuracy 22/32 = 0.688; neutral read neutral 6/6 = 1; false neutrals (directional read neutral) 5/26 = 0.192; neutral |score| median 0.007, max 0.017
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.027, max 0.101; per-rep M1 correct range 19..20 (n 26,26,26,26,26); per-rep M5 correct range 22..23 (n 32,32,32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 21; mean USD per judgment 0.00017904600000000014 (160 of 160 ok calls report cost); median ms 209

## Comparison

O1 = O1/lens-late-s5, O2 = O2/C-hyb-top-sig2

1. Disqualification (fewer than half the opposite pairs): O1 holds 3 of 7, DISQUALIFIED; O2 holds 3 of 7, DISQUALIFIED

VERDICT: no verdict, both arms disqualified (step 1)

## Per case

| case | kind | pair | label | O1/lens-late-s5 (final) | O2/C-hyb-top-sig2 (final) |
|---|---|---|---|---|---|
| a01-rogue-a | opposite | a01-rogue-b | detract 3 | -1.930 [-1.960, -1.940, -1.920, -1.940, -1.890] | -0.497 [-0.479, -0.542, -0.475, -0.536, -0.455] |
| a01-rogue-b | opposite | a01-rogue-a | build 2 | 0.254 [0.180, 0.070, 0.120, 0.400, 0.500] | -0.257 ✗ [-0.241, -0.249, -0.286, -0.274, -0.236] |
| a01-rogue-c | conflict |  | detract 1 | -1.350 [-1.220, -1.380, -1.280, -1.320, -1.550] | -0.206 [-0.188, -0.215, -0.251, -0.150, -0.226] |
| a02-glitch-a | opposite | a02-glitch-b | build 2 | 1.178 [1.150, 1.180, 1.090, 1.280, 1.190] | 0.295 [0.301, 0.294, 0.285, 0.305, 0.290] |
| a02-glitch-b | opposite | a02-glitch-a | detract 2 | -1.468 [-1.510, -1.450, -1.510, -1.430, -1.440] | -0.337 [-0.366, -0.347, -0.314, -0.323, -0.335] |
| a02-glitch-c | conflict |  | build 1 | 0.032 ✗ [0.090, -0.030, 0.060, -0.000, 0.040] | 0.099 [0.097, 0.102, 0.091, 0.100, 0.105] |
| a03-arr-glitch-b | neutral |  | neutral | -0.440 ✗ [-0.490, -0.390, -0.510, -0.480, -0.330] | -0.005 [-0.005, -0.004, -0.004, -0.005, -0.006] |
| a03-mux-a | opposite | a03-mux-b | detract 2 | -1.320 [-1.320, -1.290, -1.330, -1.300, -1.360] | -0.465 [-0.452, -0.457, -0.437, -0.475, -0.506] |
| a03-mux-b | opposite | a03-mux-a | build 2 | -0.648 ✗ [-0.650, -0.640, -0.700, -0.640, -0.610] | -0.079 ✗ [-0.074, -0.072, -0.086, -0.069, -0.093] |
| a03-mux-c | conflict |  | detract 1 | -1.348 [-1.360, -1.310, -1.390, -1.420, -1.260] | -0.332 [-0.362, -0.315, -0.336, -0.335, -0.310] |
| a04-rogue-a | opposite | a04-rogue-b | build 2 | -0.978 ✗ [-0.960, -1.020, -0.950, -0.980, -0.980] | -0.190 ✗ [-0.190, -0.194, -0.213, -0.166, -0.185] |
| a04-rogue-b | opposite | a04-rogue-a | detract 1 | -1.060 [-1.070, -1.060, -1.050, -1.040, -1.080] | -0.185 [-0.188, -0.183, -0.168, -0.197, -0.192] |
| a05-glitch-a | plain |  | build 3 | 1.770 [1.790, 1.730, 1.790, 1.760, 1.780] | 0.642 [0.632, 0.628, 0.659, 0.640, 0.651] |
| a05-rogue-a | plain |  | detract 2 | -1.214 [-1.250, -1.260, -1.200, -1.130, -1.230] | 0.000 ✗ [-0.006, 0.002, 0.004, 0.009, -0.008] |
| a05-rogue-c | conflict |  | build 1 | -0.878 ✗ [-0.780, -0.890, -0.880, -0.870, -0.970] | 0.026 ✗ [0.026, 0.039, 0.036, 0.018, 0.011] |
| a06-dep-rogue-a | plain |  | build 1 | 0.164 [0.070, 0.380, 0.140, 0.130, 0.100] | 0.015 ✗ [0.006, 0.016, 0.008, 0.022, 0.022] |
| a06-dep-rogue-b | neutral |  | neutral | 0.310 ✗ [0.300, 0.340, 0.280, 0.350, 0.280] | 0.011 [0.015, 0.014, 0.008, 0.010, 0.008] |
| a06-arr-rogue-a | opposite | a06-arr-rogue-b | detract 2 | -1.576 [-1.640, -1.710, -1.540, -1.580, -1.410] | -0.120 [-0.122, -0.109, -0.152, -0.118, -0.097] |
| a06-arr-rogue-b | opposite | a06-arr-rogue-a | build 1 | -0.572 ✗ [-0.540, -0.510, -0.660, -0.540, -0.610] | -0.021 ✗ [-0.032, -0.020, -0.004, -0.018, -0.029] |
| a07-glitch-a | opposite | a07-glitch-b | detract 1 | -1.230 [-1.210, -1.250, -1.200, -1.220, -1.270] | -0.461 [-0.461, -0.467, -0.439, -0.475, -0.464] |
| a07-glitch-b | opposite | a07-glitch-a | build 3 | 1.204 [1.150, 1.180, 1.330, 1.190, 1.170] | 0.140 [0.135, 0.138, 0.142, 0.156, 0.130] |
| a07-glitch-c | conflict |  | build 1 | 0.444 [0.390, 0.370, 0.580, 0.440, 0.440] | 0.022 ✗ [0.026, 0.017, 0.009, 0.031, 0.027] |
| a08-mux-a | opposite | a08-mux-b | detract 1 | 0.062 ✗ [0.020, 0.080, 0.050, 0.090, 0.070] | -0.147 [-0.147, -0.159, -0.149, -0.132, -0.147] |
| a08-mux-b | opposite | a08-mux-a | build 2 | 1.632 [1.670, 1.670, 1.600, 1.610, 1.610] | 0.337 [0.355, 0.343, 0.334, 0.329, 0.323] |
| a08-mux-c | conflict |  | build 1 | 0.622 [0.600, 0.580, 0.620, 0.680, 0.630] | 0.075 [0.062, 0.083, 0.083, 0.074, 0.070] |
| a09-rogue-a | plain |  | detract 1 | -1.050 [-1.050, -1.030, -1.020, -1.060, -1.090] | -0.226 [-0.195, -0.244, -0.224, -0.231, -0.238] |
| a09-rogue-b | neutral |  | neutral | -1.042 ✗ [-1.060, -1.100, -1.050, -0.970, -1.030] | 0.006 [0, 0.003, 0.005, 0.007, 0.014] |
| a09-mux-c | conflict |  | build 2 | 0.818 [0.770, 0.790, 0.840, 0.800, 0.890] | -0.352 ✗ [-0.362, -0.288, -0.365, -0.370, -0.373] |
| a09-rogue-c | conflict |  | detract 1 | 0.766 ✗ [0.780, 0.880, 0.840, 0.670, 0.660] | 0.068 ✗ [0.069, 0.056, 0.069, 0.077, 0.066] |
| a10-rogue-c | neutral |  | neutral | -0.370 ✗ [-0.400, -0.340, -0.370, -0.390, -0.350] | 0.017 [0.011, 0.022, 0.018, 0.017, 0.015] |
| a11-mux-b | neutral |  | neutral | 0.112 ✗ [0.100, 0.130, 0.110, 0.100, 0.120] | 0.003 [0.004, 0.003, 0.003, 0.003, 0.003] |
| a12-rogue-a | neutral |  | neutral | -0.088 [-0.050, -0.100, -0.060, -0.130, -0.100] | -0.007 [-0.006, -0.004, -0.009, -0.005, -0.012] |

