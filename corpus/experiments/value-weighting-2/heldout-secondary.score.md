# value-weighting-2 scoring

## Header

- calls: 1920
- refusals: 0
  - O1/lens-c3: 0 of 96
  - O1/lens-ext-s5: 0 of 96
  - O1/lens-late-ens: 0 of 96
  - O1/lens-late-gate: 0 of 96
  - O1/lens-late-reads: 0 of 96
  - O1/lens-s5: 0 of 96
  - O1/lens-show-s5: 0 of 96
  - O1/outlook-nouls: 0 of 96
  - O1/outlook-s5: 0 of 96
  - O1/tiers-c3: 0 of 96
  - O1/tiers-s5: 0 of 96
  - O2/C-hyb-top-sig: 0 of 96
  - O2/E-top-sig: 0 of 96
  - O2/F-lin-gate: 0 of 96
  - O2/P-above-sig: 0 of 96
  - O2/P-lin-sig: 0 of 96
  - O2/P-top-sig: 0 of 96
  - O2/P2-top-sig: 0 of 96
  - O2/P3-top-sig: 0 of 96
  - O2/P4-top-sig: 0 of 96
- reps: 3 (0, 1, 2)
- cases: 32
- opposite pairs: 7
  - by kind: conflict 8, neutral 6, opposite 14, plain 4
  - by direction: build 14, detract 12, neutral 6

## O1/lens-c3

band 0.120; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 17/26 = 0.654
  - per rep: rep 0: 18/26 = 0.692; rep 1: 17/26 = 0.654; rep 2: 18/26 = 0.692
- **M2 magnitude** (Spearman, score vs signed label): rho 0.708; within build 0.354; within detract 0.593 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 4/8 = 0.500
- **M5 three-way**: accuracy 18/32 = 0.563; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 5/26 = 0.192; neutral |score| median 0.165, max 0.387
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.050, max 0.140; per-rep M1 correct range 17..18 (n 26,26,26); per-rep M5 correct range 18..18 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.00003993674999999999 (96 of 96 ok calls report cost); median ms 188

## O1/lens-ext-s5

band 0.200; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 19/26 = 0.731; rep 1: 19/26 = 0.731; rep 2: 19/26 = 0.731
- **M2 magnitude** (Spearman, score vs signed label): rho 0.696; within build 0.306; within detract 0.570 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 2/26 = 0.077; neutral |score| median 0.325, max 0.747
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.050, max 0.280; per-rep M1 correct range 19..19 (n 26,26,26); per-rep M5 correct range 18..21 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.000039731999999999985 (96 of 96 ok calls report cost); median ms 194.500

## O1/lens-late-ens

band 0.200; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 20/26 = 0.769
  - per rep: rep 0: 20/26 = 0.769; rep 1: 20/26 = 0.769; rep 2: 20/26 = 0.769
- **M2 magnitude** (Spearman, score vs signed label): rho 0.769; within build 0.536; within detract 0.789 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 6/8 = 0.750
- **M5 three-way**: accuracy 21/32 = 0.656; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 2/26 = 0.077; neutral |score| median 0.352, max 0.980
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.070, max 0.600; per-rep M1 correct range 20..20 (n 26,26,26); per-rep M5 correct range 20..21 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 2; mean USD per judgment 0.00005146575000000003 (96 of 96 ok calls report cost); median ms 191.500

## O1/lens-late-gate

band 0.200; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 20/26 = 0.769; rep 1: 19/26 = 0.731; rep 2: 19/26 = 0.731
- **M2 magnitude** (Spearman, score vs signed label): rho 0.755; within build 0.507; within detract 0.789 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.229, max 0.816
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.059, max 0.354; per-rep M1 correct range 19..20 (n 26,26,26); per-rep M5 correct range 20..22 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 2; mean USD per judgment 0.00004425487499999997 (96 of 96 ok calls report cost); median ms 192.500

## O1/lens-late-reads

band 0.250; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 18/26 = 0.692
  - per rep: rep 0: 19/26 = 0.731; rep 1: 18/26 = 0.692; rep 2: 18/26 = 0.692
- **M2 magnitude** (Spearman, score vs signed label): rho 0.737; within build 0.440; within detract 0.745 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 1/26 = 0.038; neutral |score| median 0.298, max 0.963
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.060, max 0.470; per-rep M1 correct range 18..19 (n 26,26,26); per-rep M5 correct range 20..21 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.000043596 (96 of 96 ok calls report cost); median ms 189

## O1/lens-s5

band 0.200; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 19/26 = 0.731; rep 1: 19/26 = 0.731; rep 2: 19/26 = 0.731
- **M2 magnitude** (Spearman, score vs signed label): rho 0.697; within build 0.325; within detract 0.658 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 18/32 = 0.563; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.377, max 0.760
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.070, max 0.420; per-rep M1 correct range 19..19 (n 26,26,26); per-rep M5 correct range 18..18 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.000042375375000000006 (96 of 96 ok calls report cost); median ms 185

## O1/lens-show-s5

band 0.140; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 19/26 = 0.731; rep 1: 19/26 = 0.731; rep 2: 19/26 = 0.731
- **M2 magnitude** (Spearman, score vs signed label): rho 0.686; within build 0.364; within detract 0.593 (build 14, detract 12)
- **M3 opposite pairs**: 4/7 = 0.571
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 21/32 = 0.656; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 0/26 = 0; neutral |score| median 0.282, max 0.430
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.110, max 0.400; per-rep M1 correct range 19..19 (n 26,26,26); per-rep M5 correct range 21..21 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.000043249499999999986 (96 of 96 ok calls report cost); median ms 192

## O1/outlook-nouls

band 0.010; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 21/26 = 0.808
  - per rep: rep 0: 21/26 = 0.808; rep 1: 21/26 = 0.808; rep 2: 21/26 = 0.808
- **M2 magnitude** (Spearman, score vs signed label): rho 0.701; within build 0.374; within detract 0.658 (build 14, detract 12)
- **M3 opposite pairs**: 4/7 = 0.571
- **M4 conflict** (build/detract conflict cases): 7/8 = 0.875
- **M5 three-way**: accuracy 21/32 = 0.656; neutral read neutral 0/6 = 0; false neutrals (directional read neutral) 0/26 = 0; neutral |score| median 0.060, max 0.147
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.030, max 0.090; per-rep M1 correct range 21..21 (n 26,26,26); per-rep M5 correct range 21..22 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 2; mean USD per judgment 0.000034940062499999975 (96 of 96 ok calls report cost); median ms 189

## O1/outlook-s5

band 0.130; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 20/26 = 0.769; rep 1: 19/26 = 0.731; rep 2: 19/26 = 0.731
- **M2 magnitude** (Spearman, score vs signed label): rho 0.715; within build 0.325; within detract 0.702 (build 14, detract 12)
- **M3 opposite pairs**: 4/7 = 0.571
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 2/6 = 0.333; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.222, max 0.627
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.065, max 0.360; per-rep M1 correct range 19..20 (n 26,26,26); per-rep M5 correct range 20..20 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.00003974906250000001 (96 of 96 ok calls report cost); median ms 194

## O1/tiers-c3

band 0.050; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 18/26 = 0.692
  - per rep: rep 0: 18/26 = 0.692; rep 1: 17/26 = 0.654; rep 2: 18/26 = 0.692
- **M2 magnitude** (Spearman, score vs signed label): rho 0.521; within build 0.220; within detract 0.526 (build 14, detract 12)
- **M3 opposite pairs**: 1/7 = 0.143
- **M4 conflict** (build/detract conflict cases): 7/8 = 0.875
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 3/6 = 0.500; false neutrals (directional read neutral) 1/26 = 0.038; neutral |score| median 0.068, max 0.450
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.040, max 0.190; per-rep M1 correct range 17..18 (n 26,26,26); per-rep M5 correct range 18..21 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.00003439012500000003 (96 of 96 ok calls report cost); median ms 185.500

## O1/tiers-s5

band 0.250; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 17/26 = 0.654
  - per rep: rep 0: 17/26 = 0.654; rep 1: 17/26 = 0.654; rep 2: 17/26 = 0.654
- **M2 magnitude** (Spearman, score vs signed label): rho 0.604; within build 0.325; within detract 0.570 (build 14, detract 12)
- **M3 opposite pairs**: 2/7 = 0.286
- **M4 conflict** (build/detract conflict cases): 4/8 = 0.500
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 4/6 = 0.667; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.175, max 0.770
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.060, max 0.260; per-rep M1 correct range 17..17 (n 26,26,26); per-rep M5 correct range 19..20 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 1; mean USD per judgment 0.000039380249999999976 (96 of 96 ok calls report cost); median ms 195

## O2/C-hyb-top-sig

band 0.040; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 20/26 = 0.769
  - per rep: rep 0: 20/26 = 0.769; rep 1: 19/26 = 0.731; rep 2: 20/26 = 0.769
- **M2 magnitude** (Spearman, score vs signed label): rho 0.576; within build 0.191; within detract 0.243 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 6/8 = 0.750
- **M5 three-way**: accuracy 22/32 = 0.688; neutral read neutral 6/6 = 1; false neutrals (directional read neutral) 5/26 = 0.192; neutral |score| median 0.019, max 0.026
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.024, max 0.134; per-rep M1 correct range 19..20 (n 26,26,26); per-rep M5 correct range 22..24 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 21; mean USD per judgment 0.000179046 (96 of 96 ok calls report cost); median ms 208

## O2/E-top-sig

band 0.070; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 18/26 = 0.692
  - per rep: rep 0: 18/26 = 0.692; rep 1: 18/26 = 0.692; rep 2: 18/26 = 0.692
- **M2 magnitude** (Spearman, score vs signed label): rho 0.535; within build 0.096; within detract 0.439 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 21/32 = 0.656; neutral read neutral 4/6 = 0.667; false neutrals (directional read neutral) 2/26 = 0.077; neutral |score| median 0.012, max 0.200
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.034, max 0.111; per-rep M1 correct range 18..18 (n 26,26,26); per-rep M5 correct range 21..21 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 11; mean USD per judgment 0.00010960162499999997 (96 of 96 ok calls report cost); median ms 200.500

## O2/F-lin-gate

band 0.050; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 16/26 = 0.615
  - per rep: rep 0: 16/26 = 0.615; rep 1: 16/26 = 0.615; rep 2: 16/26 = 0.615
- **M2 magnitude** (Spearman, score vs signed label): rho 0.607; within build 0.335; within detract 0.745 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 3/8 = 0.375
- **M5 three-way**: accuracy 19/32 = 0.594; neutral read neutral 3/6 = 0.500; false neutrals (directional read neutral) 2/26 = 0.077; neutral |score| median 0.028, max 0.094
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.025, max 0.079; per-rep M1 correct range 16..16 (n 26,26,26); per-rep M5 correct range 18..20 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 10; mean USD per judgment 0.00008322299999999999 (96 of 96 ok calls report cost); median ms 200

## O2/P-above-sig

band 0.030; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 17/26 = 0.654
  - per rep: rep 0: 17/26 = 0.654; rep 1: 17/26 = 0.654; rep 2: 17/26 = 0.654
- **M2 magnitude** (Spearman, score vs signed label): rho 0.652; within build 0.172; within detract 0.462 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 4/8 = 0.500
- **M5 three-way**: accuracy 21/32 = 0.656; neutral read neutral 4/6 = 0.667; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.029, max 0.045
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.020, max 0.074; per-rep M1 correct range 17..17 (n 26,26,26); per-rep M5 correct range 19..21 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 11; mean USD per judgment 0.00010033537500000001 (96 of 96 ok calls report cost); median ms 203.500

## O2/P-lin-sig

band 0.035; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 16/26 = 0.615
  - per rep: rep 0: 17/26 = 0.654; rep 1: 17/26 = 0.654; rep 2: 16/26 = 0.615
- **M2 magnitude** (Spearman, score vs signed label): rho 0.537; within build 0.096; within detract 0.351 (build 14, detract 12)
- **M3 opposite pairs**: 2/7 = 0.286
- **M4 conflict** (build/detract conflict cases): 4/8 = 0.500
- **M5 three-way**: accuracy 18/32 = 0.563; neutral read neutral 3/6 = 0.500; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.033, max 0.087
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.022, max 0.052; per-rep M1 correct range 16..17 (n 26,26,26); per-rep M5 correct range 18..19 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 11; mean USD per judgment 0.00010033537500000001 (96 of 96 ok calls report cost); median ms 202.500

## O2/P-top-sig

band 0.030; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 18/26 = 0.692
  - per rep: rep 0: 18/26 = 0.692; rep 1: 18/26 = 0.692; rep 2: 18/26 = 0.692
- **M2 magnitude** (Spearman, score vs signed label): rho 0.638; within build 0.220; within detract 0.399 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 22/32 = 0.688; neutral read neutral 5/6 = 0.833; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.021, max 0.045
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.023, max 0.088; per-rep M1 correct range 18..18 (n 26,26,26); per-rep M5 correct range 21..22 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 11; mean USD per judgment 0.00010033537500000001 (96 of 96 ok calls report cost); median ms 204.500

## O2/P2-top-sig

band 0.035; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 18/26 = 0.692; rep 1: 19/26 = 0.731; rep 2: 17/26 = 0.654
- **M2 magnitude** (Spearman, score vs signed label): rho 0.643; within build 0.220; within detract 0.462 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 4/6 = 0.667; false neutrals (directional read neutral) 3/26 = 0.115; neutral |score| median 0.024, max 0.062
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.022, max 0.125; per-rep M1 correct range 17..19 (n 26,26,26); per-rep M5 correct range 20..22 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 11; mean USD per judgment 0.00011197724999999995 (96 of 96 ok calls report cost); median ms 203

## O2/P3-top-sig

band 0.020; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 19/26 = 0.731
  - per rep: rep 0: 18/26 = 0.692; rep 1: 18/26 = 0.692; rep 2: 19/26 = 0.731
- **M2 magnitude** (Spearman, score vs signed label): rho 0.670; within build 0.191; within detract 0.311 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 21/32 = 0.656; neutral read neutral 3/6 = 0.500; false neutrals (directional read neutral) 2/26 = 0.077; neutral |score| median 0.018, max 0.049
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.018, max 0.072; per-rep M1 correct range 18..19 (n 26,26,26); per-rep M5 correct range 20..22 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 11; mean USD per judgment 0.00013154924999999993 (96 of 96 ok calls report cost); median ms 203

## O2/P4-top-sig

band 0.035; refused calls excluded from case means: 0; cases with no scored call: 0

- **M1 direction** (build/detract, sign of case mean): 18/26 = 0.692
  - per rep: rep 0: 19/26 = 0.731; rep 1: 18/26 = 0.692; rep 2: 18/26 = 0.692
- **M2 magnitude** (Spearman, score vs signed label): rho 0.632; within build 0.220; within detract 0.399 (build 14, detract 12)
- **M3 opposite pairs**: 3/7 = 0.429
- **M4 conflict** (build/detract conflict cases): 5/8 = 0.625
- **M5 three-way**: accuracy 20/32 = 0.625; neutral read neutral 4/6 = 0.667; false neutrals (directional read neutral) 4/26 = 0.154; neutral |score| median 0.020, max 0.067
- **M6 noise**: spread (max-min over reps, 32 cases with >=2 scored reps) median 0.026, max 0.138; per-rep M1 correct range 18..19 (n 26,26,26); per-rep M5 correct range 20..20 (n 32,32,32)
- **M7 cost**: calls per judgment 1; questions per call 11; mean USD per judgment 0.00010903725000000001 (96 of 96 ok calls report cost); median ms 202

## Comparison

Not run: needs exactly one final variant per arm for both O1 and O2 (found O1 0, O2 0).

## Per case

| case | kind | pair | label | O1/lens-c3 | O1/lens-ext-s5 | O1/lens-late-ens | O1/lens-late-gate | O1/lens-late-reads | O1/lens-s5 | O1/lens-show-s5 | O1/outlook-nouls | O1/outlook-s5 | O1/tiers-c3 | O1/tiers-s5 | O2/C-hyb-top-sig | O2/E-top-sig | O2/F-lin-gate | O2/P-above-sig | O2/P-lin-sig | O2/P-top-sig | O2/P2-top-sig | O2/P3-top-sig | O2/P4-top-sig |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a01-rogue-a | opposite | a01-rogue-b | detract 3 | -1 [-1, -1, -1] | -1.963 [-1.960, -1.960, -1.970] | -1.910 [-1.890, -1.930, -1.910] | -1.741 [-1.690, -1.785, -1.747] | -1.957 [-1.950, -1.960, -1.960] | -1.973 [-1.970, -1.970, -1.980] | -1.943 [-1.940, -1.940, -1.950] | -0.657 [-0.660, -0.650, -0.660] | -1.910 [-1.880, -1.930, -1.920] | -0.990 [-0.990, -0.990, -0.990] | -1.880 [-1.900, -1.860, -1.880] | -0.618 [-0.598, -0.634, -0.621] | -0.690 [-0.695, -0.669, -0.705] | -0.670 [-0.631, -0.678, -0.702] | -0.636 [-0.626, -0.625, -0.658] | -0.610 [-0.600, -0.625, -0.605] | -0.592 [-0.535, -0.618, -0.623] | -0.657 [-0.667, -0.644, -0.661] | -0.456 [-0.452, -0.424, -0.491] | -0.607 [-0.603, -0.554, -0.663] |
| a01-rogue-b | opposite | a01-rogue-a | build 2 | -0.017 ✗ [0, -0.070, 0.020] | -0.160 ✗ [-0.220, -0.070, -0.190] | 0.403 [0.305, 0.410, 0.495] | 0.342 [0.379, 0.275, 0.373] | 0.350 [0.450, 0.310, 0.290] | -0.357 ✗ [-0.190, -0.270, -0.610] | 0.283 [0.190, 0.330, 0.330] | 0.223 [0.260, 0.240, 0.170] | 0.060 ✗ [-0.020, 0.100, 0.100] | -0.757 ✗ [-0.740, -0.740, -0.790] | -0.420 ✗ [-0.420, -0.380, -0.460] | -0.278 ✗ [-0.314, -0.193, -0.327] | -0.218 ✗ [-0.267, -0.232, -0.156] | -0.537 ✗ [-0.567, -0.525, -0.520] | -0.214 ✗ [-0.254, -0.187, -0.200] | -0.331 ✗ [-0.363, -0.318, -0.310] | -0.275 ✗ [-0.258, -0.241, -0.327] | -0.325 ✗ [-0.307, -0.397, -0.272] | -0.130 ✗ [-0.116, -0.137, -0.136] | -0.334 ✗ [-0.360, -0.320, -0.323] |
| a01-rogue-c | conflict |  | detract 1 | -0.827 [-0.820, -0.810, -0.850] | -1.540 [-1.530, -1.550, -1.540] | -1.157 [-1.255, -1.230, -0.985] | -1.037 [-0.960, -1.253, -0.899] | -1.350 [-1.440, -1.440, -1.170] | -1.473 [-1.460, -1.430, -1.530] | -1.420 [-1.300, -1.470, -1.490] | -0.437 [-0.430, -0.420, -0.460] | -1.510 [-1.510, -1.560, -1.460] | -0.933 [-0.930, -0.930, -0.940] | -1.593 [-1.610, -1.560, -1.610] | -0.283 [-0.323, -0.302, -0.225] | -0.235 [-0.230, -0.251, -0.225] | -0.535 [-0.522, -0.542, -0.541] | -0.456 [-0.448, -0.459, -0.462] | -0.449 [-0.462, -0.445, -0.440] | -0.385 [-0.378, -0.402, -0.376] | -0.477 [-0.479, -0.492, -0.459] | -0.221 [-0.235, -0.215, -0.212] | -0.499 [-0.421, -0.559, -0.518] |
| a02-glitch-a | opposite | a02-glitch-b | build 2 | 0.663 [0.600, 0.680, 0.710] | 1.217 [1.200, 1.260, 1.190] | 1.232 [1.220, 1.220, 1.255] | 1.076 [1.079, 1.070, 1.079] | 1.053 [1.070, 1.070, 1.020] | 1.107 [1.180, 1.160, 0.980] | 1.213 [1.180, 1.200, 1.260] | 0.463 [0.450, 0.450, 0.490] | 1.113 [1, 1.220, 1.120] | 0.427 [0.440, 0.450, 0.390] | 0.863 [0.920, 0.750, 0.920] | 0.488 [0.474, 0.504, 0.488] | 0.369 [0.349, 0.388, 0.372] | 0.064 [0.063, 0.053, 0.078] | 0.441 [0.449, 0.448, 0.426] | 0.107 [0.108, 0.105, 0.108] | 0.448 [0.438, 0.438, 0.468] | 0.425 [0.419, 0.422, 0.435] | 0.301 [0.296, 0.293, 0.315] | 0.462 [0.450, 0.471, 0.464] |
| a02-glitch-b | opposite | a02-glitch-a | detract 2 | -0.923 [-0.910, -0.940, -0.920] | -1.337 [-1.380, -1.330, -1.300] | -1.357 [-1.280, -1.385, -1.405] | -1.295 [-1.305, -1.292, -1.287] | -1.390 [-1.390, -1.420, -1.360] | -1.407 [-1.390, -1.460, -1.370] | -1.333 [-1.280, -1.350, -1.370] | -0.473 [-0.450, -0.490, -0.480] | -1.347 [-1.330, -1.380, -1.330] | -0.757 [-0.770, -0.770, -0.730] | -1.277 [-1.300, -1.310, -1.220] | -0.545 [-0.548, -0.552, -0.533] | -0.577 [-0.592, -0.580, -0.558] | -0.644 [-0.647, -0.637, -0.648] | -0.531 [-0.532, -0.539, -0.520] | -0.395 [-0.404, -0.398, -0.383] | -0.552 [-0.553, -0.540, -0.563] | -0.567 [-0.576, -0.568, -0.557] | -0.388 [-0.392, -0.376, -0.395] | -0.550 [-0.540, -0.574, -0.535] |
| a02-glitch-c | conflict |  | build 1 | -0.003 ✗ [0.070, -0.010, -0.070] | 0.427 [0.410, 0.440, 0.430] | 0.010 ✗ [0.020, 0.010, 0.000] | -0.092 ✗ [-0.067, -0.151, -0.057] | -0.033 ✗ [0.060, -0.140, -0.020] | 0.647 [0.680, 0.610, 0.650] | 0.553 [0.550, 0.660, 0.450] | 0.163 [0.140, 0.170, 0.180] | 0.390 [0.390, 0.400, 0.380] | 0.060 [0.040, 0.060, 0.080] | -0.040 ✗ [-0.040, -0.130, 0.050] | 0.156 [0.158, 0.163, 0.147] | 0.117 [0.111, 0.130, 0.111] | -0.268 ✗ [-0.258, -0.274, -0.272] | -0.009 ✗ [-0.015, -0.010, -0.001] | -0.099 ✗ [-0.098, -0.102, -0.097] | 0.050 [0.064, 0.035, 0.051] | 0.032 ✗ [0.059, 0.036, 0.002] | 0.024 [0.019, 0.024, 0.029] | 0.026 ✗ [0.022, 0.033, 0.023] |
| a03-arr-glitch-b | neutral |  | neutral | -0.160 ✗ [-0.200, -0.150, -0.130] | -0.330 ✗ [-0.340, -0.330, -0.320] | -0.362 ✗ [-0.335, -0.370, -0.380] | -0.253 ✗ [-0.235, -0.274, -0.249] | -0.293 ✗ [-0.290, -0.290, -0.300] | -0.387 ✗ [-0.380, -0.340, -0.440] | -0.297 ✗ [-0.260, -0.310, -0.320] | -0.063 ✗ [-0.060, -0.060, -0.070] | -0.253 ✗ [-0.260, -0.250, -0.250] | -0.047 [-0.050, -0.050, -0.040] | -0.237 [-0.230, -0.280, -0.200] | -0.020 [-0.023, -0.018, -0.018] | -0.016 [-0.016, -0.010, -0.021] | 0 [0, 0, 0] | -0.016 [-0.012, -0.018, -0.017] | -0.024 [-0.025, -0.024, -0.023] | -0.019 [-0.015, -0.020, -0.022] | -0.026 [-0.024, -0.025, -0.028] | -0.011 [-0.011, -0.009, -0.011] | -0.020 [-0.017, -0.023, -0.021] |
| a03-mux-a | opposite | a03-mux-b | detract 2 | -0.990 [-0.990, -0.990, -0.990] | -1.733 [-1.720, -1.760, -1.720] | -1.345 [-1.385, -1.305, -1.345] | -1.118 [-1.092, -1.156, -1.105] | -1.607 [-1.580, -1.670, -1.570] | -1.710 [-1.670, -1.720, -1.740] | -1.737 [-1.760, -1.750, -1.700] | -0.600 [-0.590, -0.600, -0.610] | -1.627 [-1.620, -1.610, -1.650] | -0.967 [-0.960, -0.970, -0.970] | -1.497 [-1.510, -1.480, -1.500] | -0.552 [-0.560, -0.525, -0.570] | -0.608 [-0.598, -0.637, -0.589] | -0.380 [-0.381, -0.380, -0.381] | -0.637 [-0.637, -0.648, -0.627] | -0.511 [-0.507, -0.527, -0.499] | -0.649 [-0.640, -0.680, -0.628] | -0.708 [-0.714, -0.694, -0.717] | -0.477 [-0.482, -0.482, -0.466] | -0.719 [-0.697, -0.754, -0.705] |
| a03-mux-b | opposite | a03-mux-a | build 2 | -0.803 ✗ [-0.830, -0.810, -0.770] | -1.183 ✗ [-1.200, -1.200, -1.150] | -0.735 ✗ [-0.720, -0.715, -0.770] | -0.465 ✗ [-0.429, -0.497, -0.469] | -0.993 ✗ [-1, -0.960, -1.020] | -1.170 ✗ [-1.190, -1.200, -1.120] | -1.337 ✗ [-1.240, -1.380, -1.390] | -0.303 ✗ [-0.330, -0.270, -0.310] | -0.917 ✗ [-0.860, -0.950, -0.940] | -0.847 ✗ [-0.850, -0.840, -0.850] | -1.087 ✗ [-1.070, -1.100, -1.090] | -0.087 ✗ [-0.082, -0.093, -0.086] | -0.502 ✗ [-0.521, -0.493, -0.491] | -0.133 ✗ [-0.136, -0.133, -0.129] | -0.088 ✗ [-0.097, -0.092, -0.075] | -0.202 ✗ [-0.207, -0.195, -0.203] | -0.098 ✗ [-0.100, -0.097, -0.097] | -0.116 ✗ [-0.112, -0.111, -0.126] | -0.080 ✗ [-0.079, -0.084, -0.077] | -0.110 ✗ [-0.102, -0.120, -0.109] |
| a03-mux-c | conflict |  | detract 1 | -0.990 [-0.990, -0.990, -0.990] | -1.790 [-1.770, -1.800, -1.800] | -1.343 [-1.360, -1.330, -1.340] | -1.144 [-1.147, -1.151, -1.134] | -1.593 [-1.610, -1.570, -1.600] | -1.787 [-1.790, -1.790, -1.780] | -1.737 [-1.760, -1.730, -1.720] | -0.557 [-0.580, -0.550, -0.540] | -1.607 [-1.570, -1.620, -1.630] | -0.950 [-0.940, -0.970, -0.940] | -1.423 [-1.440, -1.430, -1.400] | -0.399 [-0.387, -0.412, -0.398] | -0.578 [-0.575, -0.582, -0.575] | -0.312 [-0.340, -0.316, -0.280] | -0.386 [-0.403, -0.390, -0.366] | -0.411 [-0.402, -0.406, -0.423] | -0.435 [-0.437, -0.443, -0.424] | -0.497 [-0.492, -0.509, -0.490] | -0.339 [-0.324, -0.347, -0.344] | -0.491 [-0.498, -0.481, -0.492] |
| a04-rogue-a | opposite | a04-rogue-b | build 2 | -0.727 ✗ [-0.690, -0.810, -0.680] | -1.020 ✗ [-1.030, -1, -1.030] | -0.972 ✗ [-0.985, -0.970, -0.960] | -0.830 ✗ [-0.842, -0.798, -0.851] | -1.070 ✗ [-1.060, -1.070, -1.080] | -1.053 ✗ [-1.050, -1.060, -1.050] | -1.023 ✗ [-1.020, -1.010, -1.040] | -0.337 ✗ [-0.350, -0.330, -0.330] | -0.993 ✗ [-0.980, -1.010, -0.990] | -0.663 ✗ [-0.670, -0.650, -0.670] | -1.013 ✗ [-1.020, -1.020, -1] | -0.250 ✗ [-0.230, -0.252, -0.266] | -0.396 ✗ [-0.403, -0.418, -0.367] | -0.082 ✗ [-0.081, -0.079, -0.087] | -0.292 ✗ [-0.281, -0.306, -0.289] | -0.240 ✗ [-0.250, -0.235, -0.234] | -0.285 ✗ [-0.257, -0.302, -0.296] | -0.274 ✗ [-0.274, -0.259, -0.288] | -0.163 ✗ [-0.165, -0.171, -0.153] | -0.258 ✗ [-0.261, -0.254, -0.259] |
| a04-rogue-b | opposite | a04-rogue-a | detract 1 | -0.827 [-0.850, -0.830, -0.800] | -1.083 [-1.060, -1.100, -1.090] | -1.083 [-1.080, -1.085, -1.085] | -0.767 [-0.784, -0.766, -0.749] | -1.113 [-1.140, -1.120, -1.080] | -1.080 [-1.060, -1.090, -1.090] | -1.110 [-1.110, -1.110, -1.110] | -0.143 [-0.140, -0.130, -0.160] | -0.693 [-0.670, -0.710, -0.700] | -0.487 [-0.530, -0.460, -0.470] | -0.843 [-0.850, -0.830, -0.850] | -0.250 [-0.241, -0.239, -0.270] | -0.234 [-0.251, -0.222, -0.230] | -0.199 [-0.200, -0.195, -0.201] | -0.245 [-0.249, -0.237, -0.249] | -0.251 [-0.273, -0.231, -0.250] | -0.262 [-0.270, -0.266, -0.251] | -0.305 [-0.305, -0.307, -0.302] | -0.205 [-0.195, -0.209, -0.210] | -0.315 [-0.310, -0.322, -0.312] |
| a05-glitch-a | plain |  | build 3 | 0.983 [0.970, 0.990, 0.990] | 1.847 [1.870, 1.810, 1.860] | 1.783 [1.795, 1.770, 1.785] | 1.569 [1.593, 1.549, 1.566] | 1.797 [1.780, 1.800, 1.810] | 1.793 [1.790, 1.790, 1.800] | 1.877 [1.860, 1.890, 1.880] | 0.667 [0.660, 0.680, 0.660] | 1.830 [1.800, 1.840, 1.850] | 0.980 [0.980, 0.980, 0.980] | 1.883 [1.880, 1.870, 1.900] | 0.747 [0.740, 0.735, 0.766] | 0.630 [0.613, 0.657, 0.620] | 0.664 [0.674, 0.672, 0.647] | 0.791 [0.789, 0.789, 0.795] | 0.623 [0.613, 0.637, 0.619] | 0.790 [0.792, 0.801, 0.779] | 0.790 [0.779, 0.800, 0.792] | 0.686 [0.692, 0.694, 0.672] | 0.780 [0.765, 0.787, 0.787] |
| a05-rogue-a | plain |  | detract 2 | -0.760 [-0.760, -0.740, -0.780] | -1.313 [-1.220, -1.400, -1.320] | -1.233 [-1.285, -1.210, -1.205] | -1.123 [-1.068, -1.201, -1.100] | -1.333 [-1.350, -1.440, -1.210] | -1.463 [-1.550, -1.370, -1.470] | -1.093 [-1.030, -1.100, -1.150] | -0.270 [-0.270, -0.270, -0.270] | -1.247 [-1.300, -1.240, -1.200] | -0.463 [-0.550, -0.480, -0.360] | -0.997 [-1, -0.910, -1.080] | -0.006 ✗ [-0.013, 0.011, -0.015] | -0.107 [-0.120, -0.090, -0.112] | -0.375 [-0.341, -0.392, -0.391] | -0.349 [-0.313, -0.387, -0.347] | -0.250 [-0.268, -0.221, -0.261] | -0.288 [-0.302, -0.285, -0.276] | -0.329 [-0.344, -0.328, -0.314] | -0.183 [-0.179, -0.177, -0.192] | -0.319 [-0.305, -0.299, -0.353] |
| a05-rogue-c | conflict |  | build 1 | -0.440 ✗ [-0.440, -0.500, -0.380] | -0.560 ✗ [-0.610, -0.420, -0.650] | -0.837 ✗ [-0.790, -0.850, -0.870] | -0.729 ✗ [-0.755, -0.657, -0.774] | -0.910 ✗ [-0.840, -0.990, -0.900] | -0.607 ✗ [-0.660, -0.530, -0.630] | -0.587 ✗ [-0.490, -0.680, -0.590] | 0.027 [0.030, 0.030, 0.020] | -0.040 ✗ [0.200, -0.160, -0.160] | -0.337 ✗ [-0.340, -0.360, -0.310] | -0.647 ✗ [-0.530, -0.640, -0.770] | 0.030 ✗ [0.009, 0.017, 0.065] | -0.133 ✗ [-0.111, -0.135, -0.153] | -0.352 ✗ [-0.348, -0.344, -0.364] | -0.174 ✗ [-0.193, -0.146, -0.183] | -0.121 ✗ [-0.139, -0.102, -0.123] | -0.122 ✗ [-0.124, -0.114, -0.127] | -0.147 ✗ [-0.146, -0.161, -0.133] | -0.068 ✗ [-0.080, -0.051, -0.071] | -0.124 ✗ [-0.107, -0.141, -0.124] |
| a06-dep-rogue-a | plain |  | build 1 | -0.060 ✗ [-0.110, -0.050, -0.020] | 0.247 [0.290, 0.330, 0.120] | 0.278 [0.530, 0.375, -0.070] | 0.119 ✗ [0.107, 0.191, 0.060] | -0.317 ✗ [-0.220, -0.130, -0.600] | 0.143 ✗ [0.080, 0.180, 0.170] | -0.287 ✗ [-0.120, -0.470, -0.270] | -0.070 ✗ [-0.080, -0.060, -0.070] | -0.070 ✗ [0.020, -0.160, -0.070] | -0.123 ✗ [-0.110, -0.120, -0.140] | 0.020 ✗ [0.070, 0.050, -0.060] | 0.024 ✗ [0.012, 0.024, 0.034] | -0.213 ✗ [-0.246, -0.179, -0.212] | -0.025 ✗ [-0.032, -0.008, -0.036] | -0.035 ✗ [-0.033, -0.028, -0.045] | -0.016 ✗ [0.003, -0.031, -0.020] | -0.013 ✗ [-0.023, -0.010, -0.006] | 0.002 ✗ [-0.001, 0.025, -0.016] | 0.006 ✗ [-0.010, -0.005, 0.035] | -0.006 ✗ [0.033, -0.019, -0.033] |
| a06-dep-rogue-b | neutral |  | neutral | 0.177 ✗ [0.190, 0.200, 0.140] | 0.320 ✗ [0.360, 0.300, 0.300] | 0.372 ✗ [0.335, 0.405, 0.375] | 0.250 ✗ [0.270, 0.180, 0.299] | 0.303 ✗ [0.310, 0.310, 0.290] | 0.390 ✗ [0.470, 0.390, 0.310] | 0.267 ✗ [0.240, 0.220, 0.340] | 0.147 ✗ [0.130, 0.160, 0.150] | 0.063 [0.100, 0.030, 0.060] | -0.023 [0.010, -0.090, 0.010] | 0.003 [-0.020, 0.040, -0.010] | 0.020 [0.018, 0.022, 0.019] | -0.078 ✗ [-0.059, -0.093, -0.083] | 0 [0, 0, 0] | 0.028 [0.033, 0.022, 0.030] | 0.043 ✗ [0.046, 0.040, 0.042] | 0.024 [0.023, 0.023, 0.025] | 0.015 [0.013, 0.011, 0.022] | 0.006 [0.008, 0.011, -0.002] | 0.016 [0.019, 0.014, 0.014] |
| a06-arr-rogue-a | opposite | a06-arr-rogue-b | detract 2 | -0.953 [-0.970, -0.940, -0.950] | -1.827 [-1.800, -1.830, -1.850] | -1.482 [-1.565, -1.405, -1.475] | -1.344 [-1.361, -1.331, -1.340] | -1.657 [-1.680, -1.630, -1.660] | -1.827 [-1.810, -1.840, -1.830] | -1.790 [-1.820, -1.800, -1.750] | -0.463 [-0.450, -0.470, -0.470] | -1.617 [-1.640, -1.580, -1.630] | -0.733 [-0.750, -0.760, -0.690] | -1.453 [-1.400, -1.500, -1.460] | -0.209 [-0.220, -0.192, -0.217] | -0.326 [-0.352, -0.313, -0.314] | -0.458 [-0.472, -0.490, -0.411] | -0.309 [-0.324, -0.270, -0.335] | -0.256 [-0.274, -0.250, -0.245] | -0.298 [-0.298, -0.275, -0.320] | -0.341 [-0.335, -0.333, -0.356] | -0.183 [-0.170, -0.177, -0.202] | -0.315 [-0.314, -0.332, -0.300] |
| a06-arr-rogue-b | opposite | a06-arr-rogue-a | build 1 | -0.400 ✗ [-0.410, -0.380, -0.410] | -0.963 ✗ [-0.970, -0.940, -0.980] | -0.417 ✗ [-0.375, -0.445, -0.430] | -0.408 ✗ [-0.418, -0.396, -0.412] | -0.453 ✗ [-0.420, -0.450, -0.490] | -0.987 ✗ [-0.990, -0.960, -1.010] | -0.623 ✗ [-0.620, -0.560, -0.690] | 0.027 [0.040, 0.020, 0.020] | -0.567 ✗ [-0.630, -0.550, -0.520] | -0.497 ✗ [-0.520, -0.500, -0.470] | -0.800 ✗ [-0.820, -0.780, -0.800] | -0.029 ✗ [-0.038, -0.023, -0.026] | -0.122 ✗ [-0.094, -0.164, -0.108] | -0.083 ✗ [-0.084, -0.084, -0.080] | -0.018 ✗ [-0.001, -0.038, -0.014] | -0.068 ✗ [-0.056, -0.058, -0.089] | -0.031 ✗ [-0.023, -0.012, -0.059] | -0.083 ✗ [-0.069, -0.095, -0.087] | -0.041 ✗ [-0.057, -0.042, -0.025] | -0.105 ✗ [-0.129, -0.092, -0.095] |
| a07-glitch-a | opposite | a07-glitch-b | detract 1 | -0.740 [-0.730, -0.750, -0.740] | -1.430 [-1.410, -1.460, -1.420] | -1.237 [-1.225, -1.210, -1.275] | -1.065 [-0.949, -1.161, -1.084] | -1.250 [-1.300, -1.230, -1.220] | -1.303 [-1.290, -1.280, -1.340] | -1.280 [-1.290, -1.280, -1.270] | -0.247 [-0.210, -0.270, -0.260] | -1.147 [-1.120, -1.150, -1.170] | 0.150 ✗ [0.110, 0.190, 0.150] | -0.410 [-0.270, -0.430, -0.530] | -0.624 [-0.610, -0.630, -0.632] | -0.576 [-0.604, -0.574, -0.551] | -0.372 [-0.393, -0.322, -0.401] | -0.623 [-0.630, -0.620, -0.620] | -0.396 [-0.412, -0.397, -0.378] | -0.617 [-0.610, -0.611, -0.630] | -0.638 [-0.636, -0.641, -0.638] | -0.457 [-0.456, -0.446, -0.468] | -0.637 [-0.611, -0.634, -0.667] |
| a07-glitch-b | opposite | a07-glitch-a | build 3 | 0.787 [0.780, 0.790, 0.790] | 1.073 [1.020, 1.090, 1.110] | 1.160 [1.180, 1.160, 1.140] | 1.034 [1.032, 1.044, 1.027] | 1.310 [1.320, 1.320, 1.290] | 1.187 [1.150, 1.170, 1.240] | 1.103 [1.040, 1.130, 1.140] | 0.300 [0.290, 0.310, 0.300] | 1.260 [1.250, 1.260, 1.270] | 0.740 [0.740, 0.740, 0.740] | 1.233 [1.220, 1.290, 1.190] | 0.190 [0.205, 0.198, 0.168] | 0.092 [0.068, 0.113, 0.094] | 0.061 [0.042, 0.081, 0.061] | 0.106 [0.132, 0.085, 0.100] | -0.019 ✗ [-0.013, 0.002, -0.044] | 0.202 [0.220, 0.163, 0.223] | 0.136 [0.130, 0.138, 0.139] | 0.190 [0.194, 0.183, 0.193] | 0.172 [0.198, 0.148, 0.170] |
| a07-glitch-c | conflict |  | build 1 | 0.193 [0.240, 0.130, 0.210] | 0.227 [0.330, 0.220, 0.130] | 0.400 [0.360, 0.405, 0.435] | 0.385 [0.392, 0.300, 0.464] | 0.413 [0.460, 0.390, 0.390] | 0.157 ✗ [0.180, 0.140, 0.150] | 0.263 [0.230, 0.180, 0.380] | 0.193 [0.190, 0.190, 0.200] | 0.437 [0.440, 0.350, 0.520] | 0.680 [0.700, 0.640, 0.700] | 0.613 [0.580, 0.580, 0.680] | 0.035 ✗ [0.021, 0.044, 0.040] | 0.026 ✗ [0.010, 0.065, 0.002] | -0.056 ✗ [-0.094, -0.051, -0.022] | -0.017 ✗ [-0.027, -0.007, -0.015] | -0.131 ✗ [-0.128, -0.129, -0.135] | -0.020 ✗ [-0.005, -0.023, -0.031] | -0.046 ✗ [-0.052, -0.056, -0.031] | 0.033 [0.026, 0.035, 0.037] | -0.014 ✗ [-0.025, -0.008, -0.010] |
| a08-mux-a | opposite | a08-mux-b | detract 1 | -0.110 ✗ [-0.090, -0.140, -0.100] | -0.197 ✗ [-0.250, -0.220, -0.120] | 0.127 ✗ [0.185, 0.200, -0.005] | 0.050 ✗ [-0.062, 0.141, 0.070] | 0.367 ✗ [0.280, 0.400, 0.420] | -0.130 ✗ [-0.080, -0.130, -0.180] | -0.300 [-0.390, -0.260, -0.250] | 0.137 ✗ [0.150, 0.120, 0.140] | -0.153 [-0.060, -0.210, -0.190] | 0.627 ✗ [0.650, 0.610, 0.620] | 0.467 ✗ [0.490, 0.490, 0.420] | -0.187 [-0.200, -0.175, -0.187] | -0.171 [-0.178, -0.176, -0.160] | -0.130 [-0.128, -0.132, -0.129] | -0.102 [-0.119, -0.100, -0.088] | -0.101 [-0.103, -0.110, -0.090] | -0.218 [-0.197, -0.232, -0.224] | -0.215 [-0.211, -0.216, -0.219] | -0.142 [-0.136, -0.119, -0.169] | -0.201 [-0.179, -0.211, -0.213] |
| a08-mux-b | opposite | a08-mux-a | build 2 | 0.947 [0.960, 0.940, 0.940] | 1.630 [1.620, 1.630, 1.640] | 1.575 [1.560, 1.605, 1.560] | 1.478 [1.463, 1.500, 1.472] | 1.727 [1.720, 1.730, 1.730] | 1.653 [1.640, 1.660, 1.660] | 1.597 [1.620, 1.580, 1.590] | 0.473 [0.480, 0.480, 0.460] | 1.603 [1.550, 1.620, 1.640] | 0.960 [0.970, 0.940, 0.970] | 1.547 [1.540, 1.540, 1.560] | 0.405 [0.408, 0.407, 0.401] | 0.214 [0.223, 0.211, 0.209] | 0.223 [0.224, 0.235, 0.208] | 0.489 [0.484, 0.491, 0.490] | 0.268 [0.276, 0.275, 0.254] | 0.417 [0.439, 0.408, 0.405] | 0.416 [0.410, 0.424, 0.413] | 0.294 [0.301, 0.299, 0.283] | 0.408 [0.404, 0.397, 0.422] |
| a08-mux-c | conflict |  | build 1 | 0.363 [0.390, 0.370, 0.330] | 0.677 [0.720, 0.690, 0.620] | 0.573 [0.540, 0.615, 0.565] | 0.650 [0.702, 0.682, 0.564] | 1.060 [1.040, 1.090, 1.050] | 0.630 [0.700, 0.560, 0.630] | 0.470 [0.390, 0.580, 0.440] | 0.310 [0.310, 0.340, 0.280] | 0.607 [0.580, 0.590, 0.650] | 0.787 [0.750, 0.800, 0.810] | 0.857 [0.870, 0.820, 0.880] | 0.084 [0.085, 0.079, 0.089] | 0.124 [0.123, 0.144, 0.107] | -0.019 ✗ [-0.018, -0.032, -0.007] | 0.293 [0.284, 0.317, 0.280] | 0.035 ✗ [0.029, 0.051, 0.024] | 0.130 [0.151, 0.126, 0.113] | 0.134 [0.125, 0.151, 0.127] | 0.109 [0.115, 0.096, 0.116] | 0.154 [0.159, 0.154, 0.149] |
| a09-rogue-a | plain |  | detract 1 | -0.783 [-0.780, -0.810, -0.760] | -1.143 [-1.140, -1.130, -1.160] | -1.005 [-1.030, -0.960, -1.025] | -0.816 [-0.848, -0.806, -0.796] | -1.077 [-1.080, -1.080, -1.070] | -1.163 [-1.180, -1.140, -1.170] | -1.037 [-1.050, -1, -1.060] | -0.307 [-0.310, -0.320, -0.290] | -1.023 [-1.020, -1, -1.050] | -0.663 [-0.640, -0.700, -0.650] | -1.037 [-1.060, -1.020, -1.030] | -0.323 [-0.300, -0.350, -0.318] | -0.459 [-0.460, -0.450, -0.468] | -0.354 [-0.335, -0.374, -0.354] | -0.480 [-0.487, -0.493, -0.459] | -0.370 [-0.363, -0.380, -0.367] | -0.406 [-0.396, -0.415, -0.407] | -0.428 [-0.425, -0.409, -0.451] | -0.262 [-0.270, -0.256, -0.260] | -0.410 [-0.401, -0.416, -0.412] |
| a09-rogue-b | neutral |  | neutral | -0.387 ✗ [-0.380, -0.400, -0.380] | -0.747 ✗ [-0.730, -0.750, -0.760] | -0.980 ✗ [-0.970, -1.015, -0.955] | -0.816 ✗ [-0.802, -0.828, -0.818] | -0.963 ✗ [-0.960, -1, -0.930] | -0.760 ✗ [-0.740, -0.750, -0.790] | -0.430 ✗ [-0.370, -0.430, -0.490] | 0.057 ✗ [0.060, 0.050, 0.060] | -0.627 ✗ [-0.620, -0.630, -0.630] | -0.450 ✗ [-0.430, -0.460, -0.460] | -0.770 ✗ [-0.790, -0.760, -0.760] | 0.002 [0.002, -0.005, 0.010] | -0.200 ✗ [-0.210, -0.189, -0.199] | -0.094 ✗ [-0.098, -0.078, -0.106] | 0.045 ✗ [0.049, 0.038, 0.047] | -0.087 ✗ [-0.093, -0.076, -0.093] | -0.002 [-0.012, 0.005, 0.000] | -0.048 ✗ [-0.046, -0.058, -0.040] | -0.049 ✗ [-0.045, -0.052, -0.050] | -0.050 ✗ [-0.038, -0.046, -0.065] |
| a09-mux-c | conflict |  | build 2 | -0.067 ✗ [-0.010, -0.040, -0.150] | -0.230 ✗ [-0.310, -0.330, -0.050] | 0.642 [0.635, 0.735, 0.555] | 0.766 [0.810, 0.713, 0.774] | 0.883 [0.810, 0.830, 1.010] | -0.343 ✗ [-0.480, -0.310, -0.240] | -0.347 ✗ [-0.280, -0.310, -0.450] | 0.083 [0.070, 0.070, 0.110] | -0.420 ✗ [-0.520, -0.350, -0.390] | 0.210 [0.180, 0.230, 0.220] | -0.323 ✗ [-0.280, -0.320, -0.370] | -0.432 ✗ [-0.361, -0.463, -0.470] | -0.304 ✗ [-0.238, -0.342, -0.331] | -0.380 ✗ [-0.399, -0.371, -0.371] | -0.451 ✗ [-0.473, -0.433, -0.445] | -0.525 ✗ [-0.516, -0.521, -0.539] | -0.483 ✗ [-0.476, -0.487, -0.484] | -0.530 ✗ [-0.505, -0.540, -0.546] | -0.247 ✗ [-0.281, -0.252, -0.209] | -0.510 ✗ [-0.534, -0.476, -0.522] |
| a09-rogue-c | conflict |  | detract 1 | 0.153 ✗ [0.130, 0.100, 0.230] | 0.650 ✗ [0.520, 0.740, 0.690] | 0.725 ✗ [0.630, 0.770, 0.775] | 0.552 ✗ [0.517, 0.615, 0.524] | 0.807 ✗ [0.790, 0.840, 0.790] | 0.613 ✗ [0.570, 0.620, 0.650] | 0.410 ✗ [0.350, 0.640, 0.240] | 0.140 ✗ [0.140, 0.140, 0.140] | 0.477 ✗ [0.530, 0.330, 0.570] | -0.043 ✗ [-0.070, 0, -0.060] | 0.227 ✗ [0.190, 0.240, 0.250] | 0.085 ✗ [0.086, 0.087, 0.083] | 0.043 ✗ [0.032, 0.040, 0.056] | -0.114 [-0.100, -0.126, -0.115] | -0.041 [-0.033, -0.043, -0.047] | -0.064 [-0.053, -0.053, -0.087] | -0.024 ✗ [-0.017, -0.026, -0.030] | -0.032 ✗ [-0.051, -0.044, 0.000] | 0.007 ✗ [0.005, 0.011, 0.004] | -0.023 ✗ [-0.006, -0.031, -0.032] |
| a10-rogue-c | neutral |  | neutral | -0.170 ✗ [-0.170, -0.120, -0.220] | -0.357 ✗ [-0.350, -0.360, -0.360] | -0.343 ✗ [-0.360, -0.335, -0.335] | -0.207 ✗ [-0.208, -0.182, -0.232] | -0.303 ✗ [-0.390, -0.240, -0.280] | -0.367 ✗ [-0.350, -0.370, -0.380] | -0.360 ✗ [-0.270, -0.390, -0.420] | -0.023 ✗ [-0.010, -0.040, -0.020] | -0.410 ✗ [-0.490, -0.380, -0.360] | -0.113 ✗ [-0.140, -0.090, -0.110] | -0.413 ✗ [-0.420, -0.400, -0.420] | 0.026 [0.029, 0.024, 0.026] | 0.003 [0.000, 0.008, 0.003] | 0 [0, 0, 0] | -0.042 ✗ [-0.044, -0.045, -0.036] | -0.073 ✗ [-0.066, -0.080, -0.071] | -0.045 ✗ [-0.043, -0.045, -0.046] | -0.062 ✗ [-0.064, -0.058, -0.064] | -0.044 ✗ [-0.046, -0.041, -0.045] | -0.067 ✗ [-0.078, -0.062, -0.060] |
| a11-mux-b | neutral |  | neutral | 0.090 [0.090, 0.080, 0.100] | 0.113 [0.100, 0.120, 0.120] | 0.128 [0.110, 0.140, 0.135] | 0.060 [0.064, 0.059, 0.056] | 0.160 [0.150, 0.160, 0.170] | 0.120 [0.110, 0.120, 0.130] | 0.057 [0.050, 0.070, 0.050] | 0.083 ✗ [0.080, 0.070, 0.100] | 0.017 [0.040, -0.000, 0.010] | 0.090 ✗ [0.080, 0.090, 0.100] | 0.053 [0.080, 0.040, 0.040] | 0.012 [0.011, 0.014, 0.012] | 0.009 [0.010, 0.008, 0.010] | -0.056 ✗ [-0.059, -0.061, -0.049] | 0.014 [0.016, 0.013, 0.013] | 0.011 [0.011, 0.014, 0.009] | 0.015 [0.013, 0.016, 0.014] | 0.013 [0.013, 0.013, 0.013] | 0.012 [0.012, 0.013, 0.011] | 0.014 [0.016, 0.011, 0.014] |
| a12-rogue-a | neutral |  | neutral | -0.107 [-0.100, -0.120, -0.100] | -0.120 [-0.180, -0.090, -0.090] | -0.030 [0.005, -0.005, -0.090] | -0.047 [-0.047, -0.026, -0.067] | -0.160 [-0.140, -0.160, -0.180] | -0.147 [-0.140, -0.160, -0.140] | -0.107 [-0.110, -0.080, -0.130] | 0.020 ✗ [0.040, 0, 0.020] | -0.190 ✗ [-0.170, -0.190, -0.210] | -0.030 [-0.030, -0.020, -0.040] | -0.113 [-0.110, -0.110, -0.120] | -0.019 [-0.014, -0.013, -0.029] | 0.005 [0.010, 0.004, 0] | -0.089 ✗ [-0.093, -0.088, -0.086] | -0.030 [-0.031, -0.025, -0.032] | -0.022 [-0.016, -0.025, -0.026] | -0.028 [-0.030, -0.030, -0.023] | -0.022 [-0.019, -0.024, -0.024] | -0.024 ✗ [-0.022, -0.023, -0.026] | -0.019 [-0.017, -0.019, -0.022] |

