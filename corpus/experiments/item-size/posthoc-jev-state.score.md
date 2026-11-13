# item-size scoring

calls: corpus/runs/item-size/posthoc/jev-state-heldout.jsonl; material: corpus/experiments/jev-state/heldout-material.json; labels: corpus/experiments/jev-state/heldout-labels.json; labels2: corpus/experiments/jev-state/heldout-labels2.json; seed 20261112; resamples 10000

## Header

| arm | variant | final | judgments | ok | refused | reps | cases |
|---|---|---|---|---|---|---|---|
| S | t5 | yes | 400 | 400 | 0 | 5 | 80 |
| SX1 | t5 | yes | 400 | 400 | 0 | 5 | 80 |
| SX2 | t5 | yes | 400 | 400 | 0 | 5 | 80 |
| SX3 | t5 | yes | 400 | 400 | 0 | 5 | 80 |
| B | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X1 | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X2 | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X3 | as-is | yes | 400 | 400 | 0 | 5 | 80 |

cases 80; scenarios 56; items per case 20 (2 channels x 10 values); items 1600

Case labels per direction and magnitude:

| direction | 0 | 1 | 2 | 3 | 4 | 5 | total |
|---|---|---|---|---|---|---|---|
| build | 0 | 4 | 13 | 10 | 5 | 4 | 36 |
| detract | 0 | 4 | 5 | 15 | 6 | 4 | 34 |
| neutral | 10 | 0 | 0 | 0 | 0 | 0 | 10 |

Touched items per channel and direction (first labeller):

| channel | up | down | none |
|---|---|---|---|
| stake | 64 | 51 | 685 |
| deed | 63 | 51 | 686 |

## Case level: E1 to E5

E3 decides. E4 is the mean of the build and detract rho. Ceiling row: second labeller's signed label as the score.

| arm | n | E1 | E1 per rep (mean, min-max) | E2 pairs held | E3 pooled rho | E4 build | E4 detract | E4 | E5 3-way | neutral |score| med | neutral max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 80 | 49/70 (70%) | 0.706 (0.700-0.714) | 9/24 (38%) | 0.548 | 0.250 | 0.064 | 0.157 | 53/80 (66%) | 0.048 | 0.195 |
| X1 | 80 | 54/70 (77%) | 0.760 (0.743-0.786) | 12/24 (50%) | 0.595 | 0.129 | 0.167 | 0.148 | 56/80 (70%) | 0.200 | 0.755 |
| X2 | 80 | 53/70 (76%) | 0.754 (0.743-0.771) | 11/24 (46%) | 0.594 | 0.217 | 0.123 | 0.170 | 55/80 (69%) | 0.119 | 0.445 |
| X3 | 80 | 54/70 (77%) | 0.763 (0.729-0.786) | 12/24 (50%) | 0.592 | 0.213 | 0.156 | 0.185 | 55/80 (69%) | 0.122 | 0.445 |
| S | 80 | 52/70 (74%) | 0.734 (0.714-0.743) | 13/24 (54%) | 0.526 | 0.284 | 0.022 | 0.153 | 56/80 (70%) | 0.047 | 0.426 |
| SX1 | 80 | 54/70 (77%) | 0.749 (0.729-0.771) | 14/24 (58%) | 0.524 | 0.203 | -0.021 | 0.091 | 55/80 (69%) | 0.141 | 1.000 |
| SX2 | 80 | 52/70 (74%) | 0.743 (0.729-0.757) | 12/24 (50%) | 0.529 | 0.234 | 0.023 | 0.128 | 54/80 (68%) | 0.087 | 0.883 |
| SX3 | 80 | 55/70 (79%) | 0.763 (0.743-0.771) | 15/24 (63%) | 0.532 | 0.217 | 0.039 | 0.128 | 55/80 (69%) | 0.136 | 1.029 |
| B-sq | 80 | 55/70 (79%) | 0.780 (0.757-0.800) | 14/24 (58%) | 0.613 | 0.248 | 0.054 | 0.151 | 58/80 (73%) | 0.052 | 0.148 |
| X1-sq | 80 | 57/70 (81%) | 0.800 (0.786-0.814) | 15/24 (63%) | 0.632 | 0.165 | 0.152 | 0.159 | 59/80 (74%) | 0.195 | 0.770 |
| X2-sq | 80 | 55/70 (79%) | 0.763 (0.743-0.786) | 14/24 (58%) | 0.618 | 0.237 | 0.193 | 0.215 | 56/80 (70%) | 0.098 | 0.427 |
| X3-sq | 80 | 57/70 (81%) | 0.794 (0.771-0.814) | 15/24 (63%) | 0.639 | 0.218 | 0.166 | 0.192 | 59/80 (74%) | 0.115 | 0.427 |
| S-sq | 80 | 55/70 (79%) | 0.789 (0.786-0.800) | 15/24 (63%) | 0.587 | 0.301 | 0.070 | 0.186 | 58/80 (73%) | 0.057 | 0.374 |
| SX1-sq | 80 | 57/70 (81%) | 0.806 (0.786-0.843) | 16/24 (67%) | 0.562 | 0.193 | -0.009 | 0.092 | 58/80 (73%) | 0.087 | 0.885 |
| SX2-sq | 80 | 55/70 (79%) | 0.797 (0.786-0.814) | 14/24 (58%) | 0.578 | 0.279 | 0.035 | 0.157 | 59/80 (74%) | 0.076 | 0.826 |
| SX3-sq | 80 | 56/70 (80%) | 0.803 (0.800-0.814) | 16/24 (67%) | 0.569 | 0.256 | 0.055 | 0.156 | 58/80 (73%) | 0.120 | 0.921 |
| L2 (ceiling) | 80 | 64/70 (91%) | n/a | 24/24 (100%) | 0.940 | 0.770 | 0.831 | 0.801 | 74/80 (93%) | 0.000 | 0.000 |

## Case level: E6 to E8

| arm | conflict dir | character dir | exposure dir | size pairs ordered | E7 spread med | E7 spread max | calls/judg | questions/judg | USD total | USD/judg | ms median |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 6/10 (60%) | 17/24 (71%) | 7/13 (54%) | 5/6 (83%) | 0.084 | 0.431 | 2.0 | 55.5 | 0.0975 (n=400) | 0.000244 | 410 |
| X1 | 8/10 (80%) | 19/24 (79%) | 7/13 (54%) | 6/6 (100%) | 0.138 | 1.313 | 2.0 | 55.5 | 0.0975 (n=400) | 0.000244 | 410 |
| X2 | 7/10 (70%) | 17/24 (71%) | 8/13 (62%) | 6/6 (100%) | 0.164 | 1.313 | 2.0 | 55.5 | 0.0975 (n=400) | 0.000244 | 410 |
| X3 | 8/10 (80%) | 18/24 (75%) | 8/13 (62%) | 6/6 (100%) | 0.141 | 1.441 | 2.0 | 55.5 | 0.0975 (n=400) | 0.000244 | 410 |
| S | 6/10 (60%) | 17/24 (71%) | 11/13 (85%) | 5/6 (83%) | 0.090 | 0.269 | 2.0 | 55.5 | 0.1056 (n=400) | 0.000264 | 414 |
| SX1 | 7/10 (70%) | 19/24 (79%) | 9/13 (69%) | 4/6 (67%) | 0.129 | 1.565 | 2.0 | 55.5 | 0.1056 (n=400) | 0.000264 | 414 |
| SX2 | 7/10 (70%) | 18/24 (75%) | 8/13 (62%) | 5/6 (83%) | 0.184 | 1.658 | 2.0 | 55.5 | 0.1056 (n=400) | 0.000264 | 414 |
| SX3 | 7/10 (70%) | 19/24 (79%) | 10/13 (77%) | 5/6 (83%) | 0.156 | 1.363 | 2.0 | 55.5 | 0.1056 (n=400) | 0.000264 | 414 |

Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).

## Per-value stage: P1 and P2 (once per statement set; r and touches are the base arm's in every X arm, checked)

P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong.

| arms | touched n | P1 all | P1 stake | P1 deed | P2 fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|---|---|
| B, X1, X2, X3 | 229 | 0.726 | 0.720 | 0.730 | 98 | 96/98 (98%) | 198/229 (86%) |
| S, SX1, SX2, SX3 | 229 | 0.722 | 0.729 | 0.714 | 91 | 87/91 (96%) | 200/229 (87%) |
| L2 (ceiling) | 229 | 0.890 | 0.918 | 0.861 | 200 | 195/200 (98%) | 195/229 (85%) |

## P3 per value (touched n from the first labelled source; P1 gate AUC; dir = direction among fired)

### Both channels pooled

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 S, SX1, SX2, SX3 | dir fired S, SX1, SX2, SX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 4 | 0.886 | 2/2 (100%) | 0.886 | 2/2 (100%) | 0.929 | 4/4 (100%) |
| stimulation | 23 | 0.816 | 16/16 (100%) | 0.807 | 15/15 (100%) | 0.898 | 19/19 (100%) |
| hedonism | 9 | 0.659 | 4/4 (100%) | 0.578 | 4/4 (100%) | 1.000 | 9/9 (100%) |
| achievement | 18 | 0.804 | 10/10 (100%) | 0.789 | 10/11 (91%) | 0.912 | 17/17 (100%) |
| power | 35 | 0.831 | 20/20 (100%) | 0.801 | 20/20 (100%) | 0.855 | 32/33 (97%) |
| security | 68 | 0.617 | 14/16 (88%) | 0.618 | 16/18 (89%) | 0.798 | 53/56 (95%) |
| conformity | 20 | 0.656 | 7/7 (100%) | 0.753 | 5/6 (83%) | 0.854 | 16/16 (100%) |
| tradition | 6 | 0.797 | 2/2 (100%) | 0.856 | 2/2 (100%) | 0.994 | 6/6 (100%) |
| benevolence | 31 | 0.550 | 12/12 (100%) | 0.549 | 7/7 (100%) | 0.833 | 24/25 (96%) |
| universalism | 15 | 0.764 | 9/9 (100%) | 0.763 | 6/6 (100%) | 0.990 | 15/15 (100%) |

### Stake channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 S, SX1, SX2, SX3 | dir fired S, SX1, SX2, SX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 4 | 0.914 | 2/2 (100%) | 0.895 | 2/2 (100%) | 0.921 | 4/4 (100%) |
| stimulation | 10 | 0.704 | 3/3 (100%) | 0.717 | 4/4 (100%) | 0.936 | 9/9 (100%) |
| hedonism | 5 | 0.285 | n/a | 0.208 | n/a | 1.000 | 5/5 (100%) |
| achievement | 16 | 0.830 | 10/10 (100%) | 0.823 | 10/11 (91%) | 0.914 | 15/15 (100%) |
| power | 27 | 0.794 | 13/13 (100%) | 0.753 | 13/13 (100%) | 0.859 | 24/25 (96%) |
| security | 44 | 0.634 | 9/10 (90%) | 0.656 | 14/15 (93%) | 0.876 | 37/38 (97%) |
| conformity | 2 | 1.000 | 2/2 (100%) | 1.000 | 2/2 (100%) | 1.000 | 2/2 (100%) |
| tradition | 2 | 0.814 | n/a | 0.913 | n/a | 0.987 | 2/2 (100%) |
| benevolence | 5 | 0.329 | n/a | 0.291 | n/a | 0.780 | 3/3 (100%) |
| universalism | 0 | n/a | n/a | n/a | n/a | n/a | n/a |

### Deed channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 S, SX1, SX2, SX3 | dir fired S, SX1, SX2, SX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 0 | n/a | n/a | n/a | n/a | n/a | n/a |
| stimulation | 13 | 0.885 | 13/13 (100%) | 0.861 | 11/11 (100%) | 0.870 | 10/10 (100%) |
| hedonism | 4 | 1.000 | 4/4 (100%) | 1.000 | 4/4 (100%) | 1.000 | 4/4 (100%) |
| achievement | 2 | 0.744 | n/a | 0.647 | n/a | 0.936 | 2/2 (100%) |
| power | 8 | 0.973 | 7/7 (100%) | 0.974 | 7/7 (100%) | 0.875 | 8/8 (100%) |
| security | 24 | 0.555 | 5/6 (83%) | 0.499 | 2/3 (67%) | 0.723 | 16/18 (89%) |
| conformity | 18 | 0.648 | 5/5 (100%) | 0.720 | 3/4 (75%) | 0.784 | 14/14 (100%) |
| tradition | 4 | 0.809 | 2/2 (100%) | 0.849 | 2/2 (100%) | 1.000 | 4/4 (100%) |
| benevolence | 26 | 0.606 | 12/12 (100%) | 0.611 | 7/7 (100%) | 0.784 | 21/22 (95%) |
| universalism | 15 | 0.755 | 9/9 (100%) | 0.720 | 6/6 (100%) | 0.977 | 15/15 (100%) |

## Consensus subset (both labellers give the same direction)

74 of 80 cases.

| arm | n | E1 | E3 |
|---|---|---|---|
| B | 74 | 46/64 (72%) | 0.582 |
| X1 | 74 | 51/64 (80%) | 0.614 |
| X2 | 74 | 50/64 (78%) | 0.615 |
| X3 | 74 | 51/64 (80%) | 0.614 |
| S | 74 | 49/64 (77%) | 0.560 |
| SX1 | 74 | 51/64 (80%) | 0.556 |
| SX2 | 74 | 49/64 (77%) | 0.564 |
| SX3 | 74 | 52/64 (81%) | 0.561 |
| B-sq | 74 | 52/64 (81%) | 0.650 |
| X1-sq | 74 | 54/64 (84%) | 0.647 |
| X2-sq | 74 | 52/64 (81%) | 0.643 |
| X3-sq | 74 | 54/64 (84%) | 0.664 |
| S-sq | 74 | 52/64 (81%) | 0.624 |
| SX1-sq | 74 | 54/64 (84%) | 0.591 |
| SX2-sq | 74 | 52/64 (81%) | 0.613 |
| SX3-sq | 74 | 54/64 (84%) | 0.595 |
| L2 (ceiling) | 74 | 64/64 (100%) | 0.968 |

## Stage attribution (from each arm's own logged answers, linear weights unless stated; never decides)

### B

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 49/70 (70%) | 0.548 | 0.157 |
| gate oracle | 50/70 (71%) | 0.651 | 0.352 |
| direction oracle | 51/70 (73%) | 0.575 | 0.215 |
| gate and direction oracle | 54/70 (77%) | 0.736 | 0.406 |
| no touches | 49/70 (70%) | 0.585 | 0.146 |

### X1

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 54/70 (77%) | 0.595 | 0.148 |
| gate oracle | 49/70 (70%) | 0.679 | 0.361 |
| direction oracle | 54/70 (77%) | 0.676 | 0.184 |
| gate and direction oracle | 53/70 (76%) | 0.792 | 0.432 |
| no touches | 54/70 (77%) | 0.606 | 0.157 |

### X2

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 53/70 (76%) | 0.594 | 0.170 |
| gate oracle | 49/70 (70%) | 0.664 | 0.361 |
| direction oracle | 55/70 (79%) | 0.671 | 0.235 |
| gate and direction oracle | 52/70 (74%) | 0.769 | 0.415 |
| no touches | 53/70 (76%) | 0.607 | 0.172 |

### X3

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 54/70 (77%) | 0.592 | 0.185 |
| gate oracle | 50/70 (71%) | 0.680 | 0.373 |
| direction oracle | 55/70 (79%) | 0.651 | 0.213 |
| gate and direction oracle | 53/70 (76%) | 0.772 | 0.424 |
| no touches | 54/70 (77%) | 0.619 | 0.174 |

### Labels only (no answer used; over B's cases)

| swap | E1 | E3 | E4 |
|---|---|---|---|
| labels only (lin) | 57/70 (81%) | 0.844 | 0.357 |
| labels only (sq) | 61/70 (87%) | 0.879 | 0.355 |

### Own-gap closure: (E3_oracle - E3_arm) / (E3_L2 - E3_arm), for each arm above

E3_L2 0.940.

| arm | E3 | gate oracle | direction oracle | gate and direction oracle |
|---|---|---|---|---|
| B | 0.548 | 0.263 | 0.070 | 0.478 |
| X1 | 0.595 | 0.244 | 0.235 | 0.572 |
| X2 | 0.594 | 0.202 | 0.221 | 0.504 |
| X3 | 0.592 | 0.252 | 0.171 | 0.518 |

## Comparisons (paired scenario bootstrap; E3 decides)

### X1 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.548, X1 0.595. **E3 difference 0.047, [-0.069, 0.170] (skipped resamples 0): X1 ties.**

| secondary (described, never deciding) | X1 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 6 | 1 | 0.125 |
| E4 build difference |  |  | -0.121 [-0.342, 0.059] (skipped 0) |
| E4 detract difference |  |  | 0.103 [-0.100, 0.351] (skipped 0) |
| E4 mean difference |  |  | -0.009 [-0.131, 0.115] (skipped 0) |

### X2 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.548, X2 0.594. **E3 difference 0.046, [-0.041, 0.144] (skipped resamples 0): X2 ties.**

| secondary (described, never deciding) | X2 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 4 | 0 | 0.125 |
| E4 build difference |  |  | -0.034 [-0.208, 0.114] (skipped 0) |
| E4 detract difference |  |  | 0.060 [-0.071, 0.226] (skipped 0) |
| E4 mean difference |  |  | 0.013 [-0.083, 0.111] (skipped 0) |

### X3 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.548, X3 0.592. **E3 difference 0.044, [-0.064, 0.156] (skipped resamples 0): X3 ties.**

| secondary (described, never deciding) | X3 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 6 | 1 | 0.125 |
| E4 build difference |  |  | -0.037 [-0.169, 0.089] (skipped 0) |
| E4 detract difference |  |  | 0.093 [-0.069, 0.300] (skipped 0) |
| E4 mean difference |  |  | 0.028 [-0.080, 0.146] (skipped 0) |

### X2 vs X1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X1 0.595, X2 0.594. **E3 difference -0.001, [-0.067, 0.057] (skipped resamples 0): X2 ties.**

### X3 vs X2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X2 0.594, X3 0.592. **E3 difference -0.002, [-0.053, 0.050] (skipped resamples 0): X3 ties.**

### SX1 vs S (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 S 0.526, SX1 0.524. **E3 difference -0.002, [-0.103, 0.091] (skipped resamples 0): SX1 ties.**

### SX2 vs S (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 S 0.526, SX2 0.529. **E3 difference 0.004, [-0.074, 0.091] (skipped resamples 0): SX2 ties.**

### SX3 vs S (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 S 0.526, SX3 0.532. **E3 difference 0.006, [-0.082, 0.100] (skipped resamples 0): SX3 ties.**

### SX2 vs SX1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 SX1 0.524, SX2 0.529. **E3 difference 0.005, [-0.044, 0.062] (skipped resamples 0): SX2 ties.**

### SX3 vs SX2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 SX2 0.529, SX3 0.532. **E3 difference 0.002, [-0.038, 0.037] (skipped resamples 0): SX3 ties.**

### S vs B (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.548, S 0.526. **E3 difference -0.022, [-0.116, 0.065] (skipped resamples 0): S ties.**

### B-sq vs B (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.548, B-sq 0.613. **E3 difference 0.065, [-0.021, 0.162] (skipped resamples 0): B-sq ties.**

### X1-sq vs X1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X1 0.595, X1-sq 0.632. **E3 difference 0.037, [-0.040, 0.123] (skipped resamples 0): X1-sq ties.**

### X2-sq vs X2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X2 0.594, X2-sq 0.618. **E3 difference 0.024, [-0.076, 0.103] (skipped resamples 0): X2-sq ties.**

### X3-sq vs X3 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X3 0.592, X3-sq 0.639. **E3 difference 0.047, [-0.025, 0.129] (skipped resamples 0): X3-sq ties.**

### S-sq vs S (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 S 0.526, S-sq 0.587. **E3 difference 0.061, [0.004, 0.137] (skipped resamples 0): S-sq wins.**

### SX1-sq vs SX1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 SX1 0.524, SX1-sq 0.562. **E3 difference 0.038, [-0.033, 0.113] (skipped resamples 0): SX1-sq ties.**

### SX2-sq vs SX2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 SX2 0.529, SX2-sq 0.578. **E3 difference 0.049, [-0.019, 0.120] (skipped resamples 0): SX2-sq ties.**

### SX3-sq vs SX3 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 SX3 0.532, SX3-sq 0.569. **E3 difference 0.037, [-0.021, 0.103] (skipped resamples 0): SX3-sq ties.**

RECOMMENDATION: no X arm wins on E3: B's reading stays (X1 ties, X2 ties, X3 ties). No X arm loses.
