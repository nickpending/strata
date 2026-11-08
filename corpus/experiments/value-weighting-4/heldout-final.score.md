# value-weighting-4 scoring

## Header

- judgments: 720
- refusals: 0
  - B/lin (final): 0 of 360
  - C/put-rt (final): 0 of 360
- reps: 5 (0, 1, 2, 3, 4)
- cases: 72
- opposite pairs: 24
  - by kind: conflict 8, neutral 8, opposite 48, plain 8
  - by direction: build 30, detract 34, neutral 8
  - by set: A 36, B 36
  - character cases: character 26, other 46

## B/lin (final)

band 0.050; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 49/64 = 0.766
  - per rep: rep 0: 49/64 = 0.766; rep 1: 48/64 = 0.750; rep 2: 47/64 = 0.734; rep 3: 48/64 = 0.750; rep 4: 49/64 = 0.766
- **M2 magnitude** (Spearman, score vs signed label): rho 0.548; within build 0.315; within detract 0.170 (build 30, detract 34)
- **M3 opposite pairs**: 14/24 = 0.583
- **M4 conflict** (build/detract conflict cases): 4/8 = 0.500
- **M8 character** (reported): M1 on character build/detract cases 20/26 = 0.769; character opposite pairs held 10/18 = 0.556
- **M5 three-way**: accuracy 44/72 = 0.611; neutral read neutral 5/8 = 0.625; false neutrals (directional read neutral) 15/64 = 0.234; neutral |score| median 0.044, max 0.608
- **M6 noise**: spread (max-min over reps, 72 cases with >=2 scored reps) median 0.047, max 0.267; per-rep M1 correct range 47..49 (n 64,64,64,64,64); per-rep M5 correct range 44..46 (n 72,72,72,72,72)
- **M7 cost**: requests per judgment 2; questions per judgment 53.800; mean USD per judgment 0.000230753 (360 of 360 ok judgments report cost, 0 lacking); median ms per judgment 399

## C/put-rt (final)

band 0.050; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 48/64 = 0.750
  - per rep: rep 0: 47/64 = 0.734; rep 1: 49/64 = 0.766; rep 2: 48/64 = 0.750; rep 3: 48/64 = 0.750; rep 4: 48/64 = 0.750
- **M2 magnitude** (Spearman, score vs signed label): rho 0.559; within build 0.253; within detract 0.144 (build 30, detract 34)
- **M3 opposite pairs**: 14/24 = 0.583
- **M4 conflict** (build/detract conflict cases): 4/8 = 0.500
- **M8 character** (reported): M1 on character build/detract cases 19/26 = 0.731; character opposite pairs held 10/18 = 0.556
- **M5 three-way**: accuracy 48/72 = 0.667; neutral read neutral 5/8 = 0.625; false neutrals (directional read neutral) 10/64 = 0.156; neutral |score| median 0.043, max 0.588
- **M6 noise**: spread (max-min over reps, 72 cases with >=2 scored reps) median 0.057, max 0.275; per-rep M1 correct range 47..49 (n 64,64,64,64,64); per-rep M5 correct range 47..50 (n 72,72,72,72,72)
- **M7 cost**: requests per judgment 3; questions per judgment 74.778; mean USD per judgment 0.000300501 (360 of 360 ok judgments report cost, 0 lacking); median ms per judgment 405

## Comparison

### C vs B

B = B/lin, C = C/put-rt

1. Disqualification (fewer than half the opposite pairs): B holds 14 of 24, ok; C holds 14 of 24, ok
2. M5 (McNemar over all cases):
   M5: B right/C wrong b=1, B wrong/C right c=5, n=6, exact two-sided p=0.2188
   p >= 0.05: not decided
3. M1 (McNemar over build and detract cases):
   M1: B right/C wrong b=1, B wrong/C right c=0, n=1, exact two-sided p=1.0000
   p >= 0.05: not decided
4. M2 rho difference: B 0.548, C 0.559, C - B = 0.010 (decides when |diff| > 0.10)
   not decided
5. Tie on accuracy; B is recommended: it asks fewer questions.
   mean USD per judgment: B 0.000230753, C 0.000300501; requests per judgment: B 2, C 3; questions per judgment: B 53.800, C 74.778
   M8 character (reported, never decides): McNemar on M1 correctness over character build/detract cases (n=26): B right/C wrong b=1, B wrong/C right c=0, exact two-sided p=1.0000; character pairs held: B 10/18, C 10/18

VERDICT (C vs B): tie on accuracy (step 5); B recommended, it asks fewer questions

Congruence moved the needle: NO (neither C nor C2 wins at step 2, 3 or 4)

## Second labeller (reported only; never affects the Comparison)

- direction agreement: 62/72 = 0.861
- confusion (rows = first labeller, columns = second):

| first \ second | build | detract | neutral |
|---|---|---|---|
| build | 25 | 2 | 3 |
| detract | 2 | 29 | 3 |
| neutral | 0 | 0 | 8 |

- Spearman between signed labels (72 cases): 0.895
- consensus subset: 62 cases (54 build/detract), 17 of 24 pairs

- B/lin (final): M1 45/54 = 0.833; M3 12/17 = 0.706; M5 43/62 = 0.694
- C/put-rt (final): M1 45/54 = 0.833; M3 12/17 = 0.706; M5 45/62 = 0.726

## Per case

| case | kind | char | pair | label | B/lin (final) | C/put-rt (final) |
|---|---|---|---|---|---|---|
| A01a | opposite | Y | A01b | detract 1 | -0.174 [-0.228, -0.158, -0.170, -0.165, -0.150] | -0.509 [-0.445, -0.494, -0.545, -0.499, -0.562] |
| A01b | opposite | Y | A01a | build 2 | 0.508 [0.504, 0.510, 0.516, 0.530, 0.481] | 0.662 [0.640, 0.695, 0.680, 0.642, 0.654] |
| A01c | neutral |  |  | neutral | 0.084 ✗ [0.087, 0.084, 0.086, 0.081, 0.082] | 0.075 ✗ [0.083, 0.076, 0.071, 0.076, 0.072] |
| A02a | opposite |  | A02b | build 2 | 1.221 [1.191, 1.219, 1.259, 1.229, 1.207] | 1.230 [1.240, 1.263, 1.250, 1.267, 1.131] |
| A02b | opposite |  | A02a | detract 2 | 0.238 ✗ [0.220, 0.249, 0.264, 0.223, 0.237] | 0.219 ✗ [0.221, 0.211, 0.221, 0.216, 0.228] |
| A02c | plain |  |  | detract 1 | -0.667 [-0.659, -0.667, -0.668, -0.647, -0.697] | -0.702 [-0.720, -0.684, -0.731, -0.689, -0.687] |
| A03a | opposite | Y | A03b | build 1 | 0.038 ✗ [0.036, 0.040, 0.038, 0.035, 0.042] | 0.053 [0.045, 0.050, 0.060, 0.031, 0.077] |
| A03b | opposite | Y | A03a | detract 2 | -0.004 ✗ [-0.009, -0.007, 0.002, -0.003, -0.003] | -0.035 ✗ [-0.054, -0.033, -0.028, -0.021, -0.038] |
| A03c | conflict |  |  | build 1 | 0.302 [0.337, 0.287, 0.263, 0.306, 0.317] | 0.291 [0.322, 0.258, 0.311, 0.288, 0.276] |
| A04a | opposite | Y | A04b | detract 2 | -0.053 [-0.052, -0.057, -0.044, -0.054, -0.057] | -0.300 [-0.305, -0.302, -0.301, -0.291, -0.303] |
| A04b | opposite | Y | A04a | build 2 | 0.136 [0.128, 0.148, 0.170, 0.132, 0.102] | 0.069 [0.080, 0.072, 0.022, 0.074, 0.096] |
| A04c | plain |  |  | detract 3 | -0.344 [-0.369, -0.299, -0.321, -0.407, -0.324] | -0.347 [-0.402, -0.306, -0.317, -0.391, -0.322] |
| A05a | opposite |  | A05b | detract 2 | 1.637 ✗ [1.603, 1.606, 1.729, 1.625, 1.624] | 1.652 ✗ [1.778, 1.518, 1.735, 1.695, 1.535] |
| A05b | opposite | Y | A05a | build 2 | 2.314 [2.315, 2.294, 2.452, 2.186, 2.321] | 2.349 [2.387, 2.368, 2.325, 2.321, 2.345] |
| A05c | plain |  |  | detract 2 | -0.710 [-0.712, -0.704, -0.702, -0.712, -0.719] | -0.732 [-0.684, -0.719, -0.763, -0.750, -0.741] |
| A06a | opposite |  | A06b | build 2 | 0.805 [0.808, 0.770, 0.811, 0.762, 0.872] | 0.868 [0.794, 0.881, 0.926, 0.861, 0.877] |
| A06b | opposite |  | A06a | detract 2 | -0.008 ✗ [-0.039, 0.047, 0.010, 0.003, -0.063] | -0.047 ✗ [-0.064, -0.061, -0.070, -0.067, 0.030] |
| A06c | neutral |  |  | neutral | -0.047 [-0.049, -0.047, -0.043, -0.050, -0.048] | -0.043 [-0.045, -0.045, -0.040, -0.045, -0.042] |
| A07a | opposite | Y | A07b | build 1 | 0.049 ✗ [0.051, 0.065, 0.048, 0.032, 0.050] | 0.096 [0.105, 0.097, 0.099, 0.090, 0.090] |
| A07b | opposite |  | A07a | detract 1 | -0.089 [-0.083, -0.090, -0.084, -0.082, -0.105] | -0.128 [-0.120, -0.110, -0.138, -0.122, -0.150] |
| A07c | conflict |  |  | detract 1 | 0.383 ✗ [0.394, 0.355, 0.389, 0.362, 0.416] | 0.331 ✗ [0.341, 0.258, 0.300, 0.351, 0.408] |
| A08a | opposite | Y | A08b | build 2 | -0.015 ✗ [-0.029, -0.051, 0.011, -0.005, -0.000] | -0.034 ✗ [-0.086, -0.003, -0.023, -0.058, 0.001] |
| A08b | opposite |  | A08a | detract 1 | -0.052 [-0.011, -0.067, -0.065, -0.083, -0.035] | -0.096 [-0.070, -0.075, -0.096, -0.123, -0.114] |
| A08c | conflict | Y |  | detract 2 | 1.300 ✗ [1.314, 1.299, 1.331, 1.237, 1.319] | 1.331 ✗ [1.245, 1.290, 1.348, 1.327, 1.443] |
| A09a | opposite |  | A09b | build 2 | 0.830 [0.839, 0.847, 0.830, 0.816, 0.817] | 0.849 [0.800, 0.840, 0.879, 0.845, 0.881] |
| A09b | opposite |  | A09a | detract 1 | 0.244 ✗ [0.220, 0.143, 0.314, 0.242, 0.300] | 0.159 ✗ [0.215, 0.012, 0.063, 0.216, 0.287] |
| A09c | neutral |  |  | neutral | 0.608 ✗ [0.548, 0.644, 0.672, 0.588, 0.587] | 0.588 ✗ [0.558, 0.521, 0.565, 0.609, 0.686] |
| A10a | opposite |  | A10b | build 2 | 0.508 [0.498, 0.527, 0.527, 0.508, 0.481] | 0.535 [0.566, 0.508, 0.541, 0.505, 0.556] |
| A10b | opposite | Y | A10a | detract 2 | -0.615 [-0.626, -0.606, -0.614, -0.626, -0.605] | -0.645 [-0.628, -0.654, -0.655, -0.645, -0.645] |
| A10c | conflict |  |  | build 1 | -0.047 ✗ [-0.016, -0.059, -0.048, -0.047, -0.063] | -0.072 ✗ [-0.079, -0.091, -0.067, -0.063, -0.059] |
| A11a | opposite |  | A11b | detract 2 | 0.080 ✗ [0.063, 0.079, 0.078, 0.090, 0.091] | 0.026 ✗ [0.038, -0.016, 0.077, 0.019, 0.015] |
| A11b | opposite | Y | A11a | build 1 | 0.047 ✗ [0.046, 0.049, 0.048, 0.046, 0.047] | -0.105 ✗ [-0.106, -0.097, -0.121, -0.101, -0.100] |
| A11c | neutral |  |  | neutral | 0.030 [0.033, 0.028, 0.030, 0.031, 0.029] | 0.028 [0.031, 0.033, 0.036, 0.011, 0.030] |
| A12a | opposite | Y | A12b | build 1 | 0.649 [0.652, 0.674, 0.635, 0.637, 0.647] | 0.761 [0.779, 0.759, 0.764, 0.723, 0.779] |
| A12b | opposite |  | A12a | detract 1 | -0.027 ✗ [-0.026, -0.034, -0.019, -0.018, -0.036] | -0.037 ✗ [-0.029, -0.041, -0.065, -0.009, -0.041] |
| A12c | plain | Y |  | build 1 | 0.113 [0.119, 0.109, 0.119, 0.116, 0.103] | 0.278 [0.282, 0.274, 0.282, 0.268, 0.282] |
| B01a | opposite | Y | B01b | detract 1 | 0.191 ✗ [0.188, 0.191, 0.236, 0.145, 0.194] | 0.044 ✗ [0.017, 0.047, 0.045, 0.083, 0.028] |
| B01b | opposite | Y | B01a | build 2 | 0.118 [0.135, 0.109, 0.105, 0.121, 0.122] | 0.024 ✗ [0.003, 0.020, 0.030, 0.044, 0.021] |
| B01c | neutral |  |  | neutral | 0.041 [0.038, 0.039, 0.043, 0.044, 0.041] | 0.040 [0.041, 0.039, 0.041, 0.039, 0.038] |
| B02a | opposite |  | B02b | build 2 | 0.703 [0.691, 0.723, 0.723, 0.693, 0.686] | 0.699 [0.678, 0.747, 0.717, 0.654, 0.702] |
| B02b | opposite |  | B02a | detract 2 | -0.227 [-0.234, -0.225, -0.229, -0.235, -0.212] | -0.246 [-0.235, -0.248, -0.263, -0.233, -0.249] |
| B02c | neutral |  |  | neutral | 0.030 [0.030, 0.031, 0.028, 0.033, 0.026] | 0.031 [0.030, 0.032, 0.027, 0.032, 0.032] |
| B02d | conflict |  |  | build 1 | 0.461 [0.471, 0.456, 0.560, 0.355, 0.463] | 0.438 [0.545, 0.432, 0.423, 0.341, 0.450] |
| B03a | opposite |  | B03b | build 2 | 0.763 [0.745, 0.795, 0.814, 0.765, 0.696] | 0.746 [0.790, 0.742, 0.726, 0.734, 0.737] |
| B03b | opposite | Y | B03a | detract 3 | -0.302 [-0.288, -0.341, -0.263, -0.361, -0.258] | -0.344 [-0.343, -0.312, -0.346, -0.359, -0.360] |
| B03c | plain |  |  | detract 1 | 0.013 ✗ [0.022, 0.013, 0.011, 0.007, 0.014] | 0.009 ✗ [0.010, 0.006, 0.009, 0.009, 0.012] |
| B04a | opposite | Y | B04b | build 2 | -0.036 ✗ [-0.063, -0.055, -0.014, -0.023, -0.023] | -0.052 ✗ [-0.061, -0.021, -0.090, -0.063, -0.025] |
| B04b | opposite |  | B04a | detract 2 | -0.610 [-0.630, -0.620, -0.635, -0.594, -0.573] | -0.666 [-0.661, -0.688, -0.656, -0.659, -0.664] |
| B05a | opposite |  | B05b | build 2 | 1.108 [1.123, 1.112, 1.115, 1.089, 1.101] | 1.135 [1.135, 1.127, 1.117, 1.161, 1.137] |
| B05b | opposite | Y | B05a | detract 2 | 0.197 ✗ [0.199, 0.220, 0.209, 0.171, 0.189] | 0.156 ✗ [0.141, 0.145, 0.166, 0.172, 0.157] |
| B05c | plain |  |  | detract 1 | -0.100 [-0.097, -0.100, -0.104, -0.095, -0.105] | -0.098 [-0.097, -0.109, -0.099, -0.097, -0.090] |
| B06a | opposite | Y | B06b | build 1 | 0.109 [0.105, 0.113, 0.109, 0.108, 0.109] | 0.110 [0.114, 0.108, 0.104, 0.113, 0.109] |
| B06b | opposite |  | B06a | detract 1 | 0.049 ✗ [0.040, 0.038, 0.042, 0.062, 0.063] | 0.043 ✗ [0.044, 0.041, 0.046, 0.042, 0.041] |
| B07a | opposite |  | B07b | build 2 | 0.189 [0.240, 0.231, 0.132, 0.115, 0.229] | 0.129 [0.103, 0.116, 0.078, 0.104, 0.246] |
| B07b | opposite |  | B07a | detract 2 | -0.038 ✗ [-0.032, -0.048, 0.024, -0.068, -0.068] | -0.072 [-0.091, -0.106, -0.106, -0.026, -0.031] |
| B07c | plain |  |  | detract 2 | -0.013 ✗ [-0.007, -0.004, -0.008, -0.021, -0.026] | -0.149 [-0.164, -0.128, -0.137, -0.157, -0.157] |
| B08a | opposite | Y | B08b | build 2 | 0.109 [0.117, 0.121, 0.102, 0.104, 0.102] | 0.142 [0.153, 0.142, 0.115, 0.151, 0.151] |
| B08b | opposite |  | B08a | detract 1 | -0.087 [-0.088, -0.083, -0.083, -0.094, -0.087] | -0.284 [-0.283, -0.288, -0.280, -0.279, -0.288] |
| B08c | neutral |  |  | neutral | 0.040 [0.036, 0.042, 0.042, 0.042, 0.036] | 0.042 [0.040, 0.043, 0.045, 0.034, 0.046] |
| B08d | conflict |  |  | build 1 | 1.508 [1.522, 1.504, 1.524, 1.480, 1.510] | 1.541 [1.512, 1.516, 1.584, 1.548, 1.547] |
| B09a | opposite | Y | B09b | detract 1 | -0.506 [-0.517, -0.502, -0.532, -0.448, -0.529] | -0.786 [-0.764, -0.778, -0.804, -0.773, -0.811] |
| B09b | opposite | Y | B09a | build 1 | 0.446 [0.424, 0.510, 0.423, 0.427, 0.444] | 0.608 [0.613, 0.608, 0.628, 0.566, 0.623] |
| B09c | neutral |  |  | neutral | 0.161 ✗ [0.198, 0.118, 0.191, 0.191, 0.110] | 0.175 ✗ [0.192, 0.198, 0.177, 0.107, 0.202] |
| B10a | opposite |  | B10b | build 2 | 0.189 [0.209, 0.126, 0.241, 0.143, 0.225] | 0.188 [0.224, 0.236, 0.132, 0.205, 0.143] |
| B10b | opposite |  | B10a | detract 2 | -0.040 ✗ [-0.055, -0.035, -0.054, -0.034, -0.023] | -0.030 ✗ [0.000, -0.066, -0.010, -0.072, -0.002] |
| B10c | conflict |  |  | build 1 | 0.685 [0.782, 0.632, 0.634, 0.716, 0.660] | 0.604 [0.627, 0.598, 0.571, 0.629, 0.596] |
| B11a | opposite | Y | B11b | build 2 | 0.402 [0.409, 0.389, 0.413, 0.404, 0.392] | 0.538 [0.559, 0.520, 0.548, 0.528, 0.533] |
| B11b | opposite |  | B11a | detract 1 | -0.013 ✗ [-0.010, -0.013, -0.005, -0.015, -0.020] | -0.075 [-0.090, -0.083, -0.063, -0.080, -0.061] |
| B11c | conflict |  |  | detract 1 | 0.448 ✗ [0.444, 0.411, 0.463, 0.461, 0.459] | 0.455 ✗ [0.470, 0.443, 0.487, 0.470, 0.406] |
| B12a | opposite | Y | B12b | detract 2 | -0.335 [-0.338, -0.349, -0.306, -0.367, -0.313] | -0.544 [-0.557, -0.526, -0.577, -0.549, -0.511] |
| B12b | opposite | Y | B12a | build 1 | -0.339 ✗ [-0.379, -0.333, -0.302, -0.342, -0.341] | -0.599 ✗ [-0.561, -0.619, -0.617, -0.596, -0.604] |
| B12c | plain |  |  | detract 2 | -0.140 [-0.157, -0.174, -0.162, -0.107, -0.101] | -0.177 [-0.128, -0.207, -0.207, -0.193, -0.150] |

