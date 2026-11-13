# item-size scoring

calls: ../../runs/item-size/2026-11-13T02-09-32-490Z-heldout/arms.jsonl; material: heldout-material.json; labels: heldout-labels.json; labels2: heldout-labels2.json; seed 20261112; resamples 10000

## Header

| arm | variant | final | judgments | ok | refused | reps | cases |
|---|---|---|---|---|---|---|---|
| B | as-is | yes | 600 | 600 | 0 | 5 | 120 |
| X1 | as-is | yes | 600 | 600 | 0 | 5 | 120 |
| X2 | as-is | yes | 600 | 600 | 0 | 5 | 120 |
| X3 | as-is | yes | 600 | 600 | 0 | 5 | 120 |
| W | w4 | yes | 600 | 600 | 0 | 5 | 120 |
| WX1 | w4 | yes | 600 | 600 | 0 | 5 | 120 |
| WX2 | w4 | yes | 600 | 600 | 0 | 5 | 120 |
| WX3 | w4 | yes | 600 | 600 | 0 | 5 | 120 |

cases 120; scenarios 84; items per case 20 (2 channels x 10 values); items 2400

Case labels per direction and magnitude:

| direction | 0 | 1 | 2 | 3 | 4 | 5 | total |
|---|---|---|---|---|---|---|---|
| build | 0 | 9 | 17 | 17 | 6 | 6 | 55 |
| detract | 0 | 8 | 16 | 14 | 6 | 6 | 50 |
| neutral | 15 | 0 | 0 | 0 | 0 | 0 | 15 |

Touched items per channel and direction (first labeller):

| channel | up | down | none |
|---|---|---|---|
| stake | 97 | 98 | 1005 |
| deed | 122 | 70 | 1008 |

## Case level: E1 to E5

E3 decides. E4 is the mean of the build and detract rho. Ceiling row: second labeller's signed label as the score.

| arm | n | E1 | E1 per rep (mean, min-max) | E2 pairs held | E3 pooled rho | E4 build | E4 detract | E4 | E5 3-way | neutral |score| med | neutral max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 120 | 77/105 (73%) | 0.722 (0.705-0.733) | 19/36 (53%) | 0.467 | 0.051 | 0.229 | 0.140 | 81/120 (68%) | 0.040 | 0.266 |
| X1 | 120 | 75/105 (71%) | 0.691 (0.686-0.705) | 15/36 (42%) | 0.453 | 0.192 | 0.212 | 0.202 | 77/120 (64%) | 0.172 | 0.882 |
| X2 | 120 | 75/105 (71%) | 0.709 (0.695-0.733) | 16/36 (44%) | 0.455 | 0.193 | 0.230 | 0.212 | 78/120 (65%) | 0.061 | 0.546 |
| X3 | 120 | 73/105 (70%) | 0.684 (0.657-0.705) | 14/36 (39%) | 0.445 | 0.206 | 0.223 | 0.214 | 76/120 (63%) | 0.106 | 0.546 |
| W | 120 | 69/105 (66%) | 0.657 (0.638-0.686) | 14/36 (39%) | 0.439 | 0.185 | 0.129 | 0.157 | 74/120 (62%) | 0.013 | 0.222 |
| WX1 | 120 | 73/105 (70%) | 0.676 (0.657-0.695) | 14/36 (39%) | 0.461 | 0.216 | 0.228 | 0.222 | 80/120 (67%) | 0.034 | 0.765 |
| WX2 | 120 | 72/105 (69%) | 0.653 (0.629-0.667) | 13/36 (36%) | 0.443 | 0.208 | 0.188 | 0.198 | 78/120 (65%) | 0.017 | 0.467 |
| WX3 | 120 | 74/105 (70%) | 0.674 (0.667-0.686) | 15/36 (42%) | 0.455 | 0.172 | 0.237 | 0.204 | 80/120 (67%) | 0.034 | 0.467 |
| B-sq | 120 | 73/105 (70%) | 0.703 (0.686-0.714) | 17/36 (47%) | 0.457 | 0.040 | 0.230 | 0.135 | 78/120 (65%) | 0.049 | 0.251 |
| X1-sq | 120 | 77/105 (73%) | 0.699 (0.686-0.714) | 19/36 (53%) | 0.462 | 0.176 | 0.216 | 0.196 | 78/120 (65%) | 0.203 | 0.817 |
| X2-sq | 120 | 79/105 (75%) | 0.724 (0.705-0.733) | 19/36 (53%) | 0.468 | 0.183 | 0.222 | 0.203 | 79/120 (66%) | 0.084 | 0.476 |
| X3-sq | 120 | 79/105 (75%) | 0.726 (0.705-0.743) | 19/36 (53%) | 0.460 | 0.195 | 0.226 | 0.210 | 80/120 (67%) | 0.101 | 0.511 |
| W-sq | 120 | 73/105 (70%) | 0.695 (0.686-0.705) | 15/36 (42%) | 0.468 | 0.161 | 0.144 | 0.153 | 79/120 (66%) | 0.016 | 0.240 |
| WX1-sq | 120 | 74/105 (70%) | 0.688 (0.686-0.695) | 15/36 (42%) | 0.456 | 0.165 | 0.247 | 0.206 | 81/120 (68%) | 0.012 | 0.840 |
| WX2-sq | 120 | 72/105 (69%) | 0.674 (0.667-0.686) | 13/36 (36%) | 0.444 | 0.186 | 0.208 | 0.197 | 82/120 (68%) | 0.006 | 0.500 |
| WX3-sq | 120 | 74/105 (70%) | 0.691 (0.686-0.695) | 15/36 (42%) | 0.461 | 0.153 | 0.244 | 0.199 | 82/120 (68%) | 0.012 | 0.500 |
| L2 (ceiling) | 120 | 87/105 (83%) | n/a | 20/36 (56%) | 0.822 | 0.570 | 0.772 | 0.671 | 102/120 (85%) | 0.000 | 0.000 |

## Case level: E6 to E8

| arm | conflict dir | character dir | exposure dir | size pairs ordered | E7 spread med | E7 spread max | calls/judg | questions/judg | USD total | USD/judg | ms median |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 11/15 (73%) | 22/27 (81%) | 17/20 (85%) | 6/9 (67%) | 0.115 | 0.546 | 2.0 | 56.2 | 0.1509 (n=600) | 0.000252 | 401 |
| X1 | 13/15 (87%) | 19/27 (70%) | 13/20 (65%) | 6/9 (67%) | 0.140 | 1.860 | 2.0 | 56.2 | 0.1509 (n=600) | 0.000252 | 401 |
| X2 | 12/15 (80%) | 21/27 (78%) | 14/20 (70%) | 6/9 (67%) | 0.218 | 2.508 | 2.0 | 56.2 | 0.1509 (n=600) | 0.000252 | 401 |
| X3 | 11/15 (73%) | 19/27 (70%) | 13/20 (65%) | 6/9 (67%) | 0.204 | 2.507 | 2.0 | 56.2 | 0.1509 (n=600) | 0.000252 | 401 |
| W | 11/15 (73%) | 17/27 (63%) | 15/20 (75%) | 6/9 (67%) | 0.062 | 0.350 | 1.9 | 48.3 | 0.1410 (n=600) | 0.000235 | 392 |
| WX1 | 12/15 (80%) | 20/27 (74%) | 14/20 (70%) | 4/9 (44%) | 0.072 | 0.950 | 1.9 | 48.3 | 0.1410 (n=600) | 0.000235 | 392 |
| WX2 | 12/15 (80%) | 19/27 (70%) | 15/20 (75%) | 5/9 (56%) | 0.122 | 1.425 | 1.9 | 48.3 | 0.1410 (n=600) | 0.000235 | 392 |
| WX3 | 12/15 (80%) | 20/27 (74%) | 15/20 (75%) | 5/9 (56%) | 0.122 | 1.357 | 1.9 | 48.3 | 0.1410 (n=600) | 0.000235 | 392 |

Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).

## Per-value stage: P1 and P2 (once per statement set; r and touches are the base arm's in every X arm, checked)

P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong.

| arms | touched n | P1 all | P1 stake | P1 deed | P2 fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|---|---|
| B, X1, X2, X3 | 387 | 0.684 | 0.684 | 0.683 | 116 | 107/116 (92%) | 308/387 (80%) |
| W, WX1, WX2, WX3 | 387 | 0.765 | 0.752 | 0.778 | 131 | 124/131 (95%) | 294/387 (76%) |
| L2 (ceiling) | 387 | 0.870 | 0.877 | 0.862 | 307 | 300/307 (98%) | 300/387 (78%) |

## P3 per value (touched n from the first labelled source; P1 gate AUC; dir = direction among fired)

### Both channels pooled

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 W, WX1, WX2, WX3 | dir fired W, WX1, WX2, WX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 23 | 0.801 | 11/11 (100%) | 0.766 | 4/8 (50%) | 0.961 | 23/23 (100%) |
| stimulation | 20 | 0.833 | 10/10 (100%) | 0.917 | 14/14 (100%) | 0.843 | 14/14 (100%) |
| hedonism | 15 | 0.708 | 4/6 (67%) | 0.847 | 4/4 (100%) | 0.831 | 10/10 (100%) |
| achievement | 16 | 0.676 | 3/3 (100%) | 0.690 | 2/2 (100%) | 0.868 | 12/12 (100%) |
| power | 82 | 0.642 | 15/15 (100%) | 0.711 | 28/28 (100%) | 0.855 | 59/64 (92%) |
| security | 95 | 0.647 | 26/33 (79%) | 0.626 | 27/30 (90%) | 0.788 | 77/79 (97%) |
| conformity | 39 | 0.602 | 13/13 (100%) | 0.787 | 21/21 (100%) | 0.880 | 31/31 (100%) |
| tradition | 12 | 0.791 | 6/6 (100%) | 0.898 | 3/3 (100%) | 0.987 | 12/12 (100%) |
| benevolence | 56 | 0.643 | 11/11 (100%) | 0.725 | 7/7 (100%) | 0.823 | 42/42 (100%) |
| universalism | 29 | 0.818 | 8/8 (100%) | 0.883 | 14/14 (100%) | 0.835 | 20/20 (100%) |

### Stake channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 W, WX1, WX2, WX3 | dir fired W, WX1, WX2, WX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 13 | 0.824 | 5/5 (100%) | 0.840 | 4/4 (100%) | 0.944 | 13/13 (100%) |
| stimulation | 8 | 0.748 | n/a | 0.925 | 6/6 (100%) | 0.996 | 8/8 (100%) |
| hedonism | 6 | 0.711 | 2/4 (50%) | 0.730 | n/a | 0.917 | 5/5 (100%) |
| achievement | 14 | 0.722 | 3/3 (100%) | 0.627 | 2/2 (100%) | 0.914 | 12/12 (100%) |
| power | 49 | 0.592 | 8/8 (100%) | 0.579 | 8/8 (100%) | 0.849 | 34/39 (87%) |
| security | 75 | 0.698 | 26/31 (84%) | 0.696 | 22/25 (88%) | 0.836 | 67/67 (100%) |
| conformity | 6 | 0.795 | 2/2 (100%) | 0.748 | 2/2 (100%) | 0.667 | 2/2 (100%) |
| tradition | 5 | 0.852 | 3/3 (100%) | 0.770 | 3/3 (100%) | 0.991 | 5/5 (100%) |
| benevolence | 12 | 0.665 | 1/1 (100%) | 0.720 | 3/3 (100%) | 0.625 | 3/3 (100%) |
| universalism | 7 | 0.894 | 2/2 (100%) | 0.849 | 2/2 (100%) | 0.500 | n/a |

### Deed channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 W, WX1, WX2, WX3 | dir fired W, WX1, WX2, WX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 10 | 0.783 | 6/6 (100%) | 0.678 | 0/4 (0%) | 0.977 | 10/10 (100%) |
| stimulation | 12 | 0.874 | 10/10 (100%) | 0.907 | 8/8 (100%) | 0.741 | 6/6 (100%) |
| hedonism | 9 | 0.739 | 2/2 (100%) | 0.906 | 4/4 (100%) | 0.773 | 5/5 (100%) |
| achievement | 2 | 0.525 | n/a | 0.604 | n/a | 0.500 | n/a |
| power | 33 | 0.720 | 7/7 (100%) | 0.834 | 20/20 (100%) | 0.856 | 25/25 (100%) |
| security | 20 | 0.537 | 0/2 (0%) | 0.528 | 5/5 (100%) | 0.665 | 10/12 (83%) |
| conformity | 33 | 0.662 | 11/11 (100%) | 0.814 | 19/19 (100%) | 0.899 | 29/29 (100%) |
| tradition | 7 | 0.732 | 3/3 (100%) | 0.997 | n/a | 0.982 | 7/7 (100%) |
| benevolence | 44 | 0.638 | 10/10 (100%) | 0.721 | 4/4 (100%) | 0.818 | 39/39 (100%) |
| universalism | 22 | 0.777 | 6/6 (100%) | 0.916 | 12/12 (100%) | 0.934 | 20/20 (100%) |

## Consensus subset (both labellers give the same direction)

102 of 120 cases.

| arm | n | E1 | E3 |
|---|---|---|---|
| B | 102 | 66/87 (76%) | 0.507 |
| X1 | 102 | 64/87 (74%) | 0.500 |
| X2 | 102 | 64/87 (74%) | 0.500 |
| X3 | 102 | 62/87 (71%) | 0.499 |
| W | 102 | 60/87 (69%) | 0.470 |
| WX1 | 102 | 62/87 (71%) | 0.491 |
| WX2 | 102 | 62/87 (71%) | 0.478 |
| WX3 | 102 | 64/87 (74%) | 0.493 |
| B-sq | 102 | 62/87 (71%) | 0.501 |
| X1-sq | 102 | 65/87 (75%) | 0.512 |
| X2-sq | 102 | 67/87 (77%) | 0.517 |
| X3-sq | 102 | 67/87 (77%) | 0.520 |
| W-sq | 102 | 63/87 (72%) | 0.500 |
| WX1-sq | 102 | 63/87 (72%) | 0.487 |
| WX2-sq | 102 | 62/87 (71%) | 0.478 |
| WX3-sq | 102 | 64/87 (74%) | 0.498 |
| L2 (ceiling) | 102 | 87/87 (100%) | 0.953 |

## Stage attribution (from each arm's own logged answers, linear weights unless stated; never decides)

### B

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 77/105 (73%) | 0.467 | 0.140 |
| gate oracle | 77/105 (73%) | 0.474 | 0.195 |
| direction oracle | 84/105 (80%) | 0.587 | 0.201 |
| gate and direction oracle | 86/105 (82%) | 0.644 | 0.286 |
| no touches | 77/105 (73%) | 0.467 | 0.136 |

### X1

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 75/105 (71%) | 0.453 | 0.202 |
| gate oracle | 73/105 (70%) | 0.545 | 0.234 |
| direction oracle | 82/105 (78%) | 0.572 | 0.235 |
| gate and direction oracle | 84/105 (80%) | 0.789 | 0.321 |
| no touches | 74/105 (70%) | 0.455 | 0.178 |

### X2

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 75/105 (71%) | 0.455 | 0.212 |
| gate oracle | 72/105 (69%) | 0.506 | 0.217 |
| direction oracle | 81/105 (77%) | 0.602 | 0.293 |
| gate and direction oracle | 84/105 (80%) | 0.764 | 0.346 |
| no touches | 75/105 (71%) | 0.455 | 0.194 |

### X3

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 73/105 (70%) | 0.445 | 0.214 |
| gate oracle | 74/105 (70%) | 0.522 | 0.242 |
| direction oracle | 79/105 (75%) | 0.595 | 0.284 |
| gate and direction oracle | 87/105 (83%) | 0.817 | 0.386 |
| no touches | 73/105 (70%) | 0.447 | 0.199 |

### Labels only (no answer used; over B's cases)

| swap | E1 | E3 | E4 |
|---|---|---|---|
| labels only (lin) | 90/105 (86%) | 0.812 | 0.211 |
| labels only (sq) | 94/105 (90%) | 0.843 | 0.254 |

### Own-gap closure: (E3_oracle - E3_arm) / (E3_L2 - E3_arm), for each arm above

E3_L2 0.822.

| arm | E3 | gate oracle | direction oracle | gate and direction oracle |
|---|---|---|---|---|
| B | 0.467 | 0.018 | 0.336 | 0.496 |
| X1 | 0.453 | 0.248 | 0.322 | 0.911 |
| X2 | 0.455 | 0.138 | 0.402 | 0.843 |
| X3 | 0.445 | 0.205 | 0.396 | 0.986 |

## Comparisons (paired scenario bootstrap; E3 decides)

### X1 vs B (primary)

n 120 cases, 84 scenarios; interval 98.33%.

E3 B 0.467, X1 0.453. **E3 difference -0.014, [-0.127, 0.097] (skipped resamples 0): X1 ties.**

| secondary (described, never deciding) | X1 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 7 | 9 | 0.804 |
| E4 build difference |  |  | 0.140 [-0.000, 0.308] (skipped 0) |
| E4 detract difference |  |  | -0.018 [-0.237, 0.168] (skipped 0) |
| E4 mean difference |  |  | 0.061 [-0.070, 0.186] (skipped 0) |

### X2 vs B (primary)

n 120 cases, 84 scenarios; interval 98.33%.

E3 B 0.467, X2 0.455. **E3 difference -0.013, [-0.108, 0.084] (skipped resamples 0): X2 ties.**

| secondary (described, never deciding) | X2 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 5 | 7 | 0.774 |
| E4 build difference |  |  | 0.142 [-0.000, 0.339] (skipped 0) |
| E4 detract difference |  |  | 0.001 [-0.170, 0.135] (skipped 0) |
| E4 mean difference |  |  | 0.072 [-0.044, 0.192] (skipped 0) |

### X3 vs B (primary)

n 120 cases, 84 scenarios; interval 98.33%.

E3 B 0.467, X3 0.445. **E3 difference -0.022, [-0.123, 0.078] (skipped resamples 0): X3 ties.**

| secondary (described, never deciding) | X3 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 5 | 9 | 0.424 |
| E4 build difference |  |  | 0.155 [0.006, 0.347] (skipped 0) |
| E4 detract difference |  |  | -0.006 [-0.204, 0.160] (skipped 0) |
| E4 mean difference |  |  | 0.074 [-0.053, 0.200] (skipped 0) |

### X2 vs X1 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 X1 0.453, X2 0.455. **E3 difference 0.001, [-0.054, 0.053] (skipped resamples 0): X2 ties.**

### X3 vs X2 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 X2 0.455, X3 0.445. **E3 difference -0.010, [-0.042, 0.021] (skipped resamples 0): X3 ties.**

### WX1 vs W (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 W 0.439, WX1 0.461. **E3 difference 0.022, [-0.048, 0.093] (skipped resamples 0): WX1 ties.**

### WX2 vs W (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 W 0.439, WX2 0.443. **E3 difference 0.004, [-0.055, 0.062] (skipped resamples 0): WX2 ties.**

### WX3 vs W (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 W 0.439, WX3 0.455. **E3 difference 0.016, [-0.041, 0.076] (skipped resamples 0): WX3 ties.**

### WX2 vs WX1 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 WX1 0.461, WX2 0.443. **E3 difference -0.018, [-0.063, 0.024] (skipped resamples 0): WX2 ties.**

### WX3 vs WX2 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 WX2 0.443, WX3 0.455. **E3 difference 0.012, [-0.023, 0.052] (skipped resamples 0): WX3 ties.**

### W vs B (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 B 0.467, W 0.439. **E3 difference -0.028, [-0.147, 0.083] (skipped resamples 0): W ties.**

### B-sq vs B (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 B 0.467, B-sq 0.457. **E3 difference -0.010, [-0.071, 0.039] (skipped resamples 0): B-sq ties.**

### X1-sq vs X1 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 X1 0.453, X1-sq 0.462. **E3 difference 0.009, [-0.051, 0.064] (skipped resamples 0): X1-sq ties.**

### X2-sq vs X2 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 X2 0.455, X2-sq 0.468. **E3 difference 0.013, [-0.039, 0.065] (skipped resamples 0): X2-sq ties.**

### X3-sq vs X3 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 X3 0.445, X3-sq 0.460. **E3 difference 0.015, [-0.042, 0.069] (skipped resamples 0): X3-sq ties.**

### W-sq vs W (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 W 0.439, W-sq 0.468. **E3 difference 0.029, [-0.015, 0.076] (skipped resamples 0): W-sq ties.**

### WX1-sq vs WX1 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 WX1 0.461, WX1-sq 0.456. **E3 difference -0.005, [-0.049, 0.034] (skipped resamples 0): WX1-sq ties.**

### WX2-sq vs WX2 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 WX2 0.443, WX2-sq 0.444. **E3 difference 0.001, [-0.038, 0.037] (skipped resamples 0): WX2-sq ties.**

### WX3-sq vs WX3 (described, E3 only, decides nothing)

n 120 cases, 84 scenarios; interval 98.33%.

E3 WX3 0.455, WX3-sq 0.461. **E3 difference 0.006, [-0.032, 0.042] (skipped resamples 0): WX3-sq ties.**

RECOMMENDATION: no X arm wins on E3: B's reading stays (X1 ties, X2 ties, X3 ties). No X arm loses.
