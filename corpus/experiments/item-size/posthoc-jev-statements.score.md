# item-size scoring

calls: corpus/runs/item-size/posthoc/jev-statements-heldout.jsonl; material: corpus/experiments/jev-statements/heldout-material.json; labels: corpus/experiments/jev-statements/heldout-labels.json; labels2: corpus/experiments/jev-statements/heldout-labels2.json; seed 20261112; resamples 10000

## Header

| arm | variant | final | judgments | ok | refused | reps | cases |
|---|---|---|---|---|---|---|---|
| B | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X1 | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X2 | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X3 | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| W | w4 | yes | 400 | 400 | 0 | 5 | 80 |
| WX1 | w4 | yes | 400 | 400 | 0 | 5 | 80 |
| WX2 | w4 | yes | 400 | 400 | 0 | 5 | 80 |
| WX3 | w4 | yes | 400 | 400 | 0 | 5 | 80 |

cases 80; scenarios 56; items per case 20 (2 channels x 10 values); items 1600

Case labels per direction and magnitude:

| direction | 0 | 1 | 2 | 3 | 4 | 5 | total |
|---|---|---|---|---|---|---|---|
| build | 0 | 5 | 11 | 16 | 4 | 4 | 40 |
| detract | 0 | 5 | 10 | 7 | 4 | 4 | 30 |
| neutral | 10 | 0 | 0 | 0 | 0 | 0 | 10 |

Touched items per channel and direction (first labeller):

| channel | up | down | none |
|---|---|---|---|
| stake | 66 | 50 | 684 |
| deed | 78 | 43 | 679 |

## Case level: E1 to E5

E3 decides. E4 is the mean of the build and detract rho. Ceiling row: second labeller's signed label as the score.

| arm | n | E1 | E1 per rep (mean, min-max) | E2 pairs held | E3 pooled rho | E4 build | E4 detract | E4 | E5 3-way | neutral |score| med | neutral max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 80 | 55/70 (79%) | 0.783 (0.771-0.800) | 13/24 (54%) | 0.671 | 0.242 | 0.787 | 0.514 | 61/80 (76%) | 0.030 | 0.253 |
| X1 | 80 | 49/70 (70%) | 0.691 (0.686-0.700) | 9/24 (38%) | 0.595 | 0.239 | 0.682 | 0.460 | 51/80 (64%) | 0.131 | 0.763 |
| X2 | 80 | 49/70 (70%) | 0.711 (0.700-0.714) | 9/24 (38%) | 0.616 | 0.288 | 0.703 | 0.495 | 51/80 (64%) | 0.101 | 0.381 |
| X3 | 80 | 49/70 (70%) | 0.703 (0.686-0.729) | 8/24 (33%) | 0.597 | 0.280 | 0.706 | 0.493 | 51/80 (64%) | 0.084 | 0.463 |
| W | 80 | 53/70 (76%) | 0.757 (0.757-0.757) | 11/24 (46%) | 0.665 | 0.219 | 0.759 | 0.489 | 60/80 (75%) | 0.010 | 0.199 |
| WX1 | 80 | 54/70 (77%) | 0.763 (0.757-0.771) | 13/24 (54%) | 0.665 | 0.251 | 0.613 | 0.432 | 58/80 (73%) | 0.063 | 0.453 |
| WX2 | 80 | 52/70 (74%) | 0.740 (0.729-0.757) | 11/24 (46%) | 0.646 | 0.223 | 0.740 | 0.481 | 58/80 (73%) | 0.031 | 0.336 |
| WX3 | 80 | 52/70 (74%) | 0.743 (0.729-0.757) | 11/24 (46%) | 0.662 | 0.242 | 0.740 | 0.491 | 56/80 (70%) | 0.048 | 0.374 |
| B-sq | 80 | 57/70 (81%) | 0.806 (0.786-0.814) | 13/24 (54%) | 0.695 | 0.292 | 0.766 | 0.529 | 60/80 (75%) | 0.036 | 0.295 |
| X1-sq | 80 | 53/70 (76%) | 0.771 (0.757-0.814) | 11/24 (46%) | 0.641 | 0.281 | 0.721 | 0.501 | 55/80 (69%) | 0.193 | 0.971 |
| X2-sq | 80 | 53/70 (76%) | 0.760 (0.743-0.786) | 11/24 (46%) | 0.664 | 0.320 | 0.764 | 0.542 | 56/80 (70%) | 0.142 | 0.485 |
| X3-sq | 80 | 53/70 (76%) | 0.746 (0.729-0.771) | 11/24 (46%) | 0.654 | 0.306 | 0.751 | 0.528 | 55/80 (69%) | 0.141 | 0.542 |
| W-sq | 80 | 54/70 (77%) | 0.774 (0.771-0.786) | 12/24 (50%) | 0.683 | 0.224 | 0.742 | 0.483 | 59/80 (74%) | 0.011 | 0.192 |
| WX1-sq | 80 | 53/70 (76%) | 0.760 (0.757-0.771) | 12/24 (50%) | 0.681 | 0.277 | 0.597 | 0.437 | 58/80 (73%) | 0.023 | 0.792 |
| WX2-sq | 80 | 54/70 (77%) | 0.780 (0.757-0.800) | 13/24 (54%) | 0.669 | 0.261 | 0.718 | 0.489 | 59/80 (74%) | 0.012 | 0.396 |
| WX3-sq | 80 | 55/70 (79%) | 0.786 (0.771-0.800) | 13/24 (54%) | 0.677 | 0.278 | 0.712 | 0.495 | 59/80 (74%) | 0.017 | 0.690 |
| L2 (ceiling) | 80 | 63/70 (90%) | n/a | 18/24 (75%) | 0.943 | 0.765 | 0.831 | 0.798 | 73/80 (91%) | 0.000 | 0.000 |

## Case level: E6 to E8

| arm | conflict dir | character dir | exposure dir | size pairs ordered | E7 spread med | E7 spread max | calls/judg | questions/judg | USD total | USD/judg | ms median |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 8/10 (80%) | 19/25 (76%) | 12/18 (67%) | 6/6 (100%) | 0.083 | 0.423 | 2.0 | 55.0 | 0.0969 (n=400) | 0.000242 | 386 |
| X1 | 8/10 (80%) | 16/25 (64%) | 11/18 (61%) | 6/6 (100%) | 0.121 | 1.124 | 2.0 | 55.0 | 0.0969 (n=400) | 0.000242 | 386 |
| X2 | 8/10 (80%) | 16/25 (64%) | 11/18 (61%) | 6/6 (100%) | 0.158 | 1.096 | 2.0 | 55.0 | 0.0969 (n=400) | 0.000242 | 386 |
| X3 | 8/10 (80%) | 15/25 (60%) | 11/18 (61%) | 6/6 (100%) | 0.158 | 0.981 | 2.0 | 55.0 | 0.0969 (n=400) | 0.000242 | 386 |
| W | 8/10 (80%) | 19/25 (76%) | 11/18 (61%) | 6/6 (100%) | 0.049 | 0.458 | 2.0 | 48.4 | 0.0934 (n=400) | 0.000234 | 381 |
| WX1 | 8/10 (80%) | 20/25 (80%) | 12/18 (67%) | 6/6 (100%) | 0.076 | 0.779 | 2.0 | 48.4 | 0.0934 (n=400) | 0.000234 | 381 |
| WX2 | 8/10 (80%) | 19/25 (76%) | 12/18 (67%) | 6/6 (100%) | 0.099 | 1.262 | 2.0 | 48.4 | 0.0934 (n=400) | 0.000234 | 381 |
| WX3 | 8/10 (80%) | 20/25 (80%) | 12/18 (67%) | 6/6 (100%) | 0.091 | 0.864 | 2.0 | 48.4 | 0.0934 (n=400) | 0.000234 | 381 |

Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).

## Per-value stage: P1 and P2 (once per statement set; r and touches are the base arm's in every X arm, checked)

P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong.

| arms | touched n | P1 all | P1 stake | P1 deed | P2 fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|---|---|
| B, X1, X2, X3 | 237 | 0.760 | 0.768 | 0.754 | 102 | 94/102 (92%) | 193/237 (81%) |
| W, WX1, WX2, WX3 | 237 | 0.830 | 0.837 | 0.825 | 99 | 95/99 (96%) | 199/237 (84%) |
| L2 (ceiling) | 237 | 0.870 | 0.862 | 0.877 | 189 | 189/189 (100%) | 189/237 (80%) |

## P3 per value (touched n from the first labelled source; P1 gate AUC; dir = direction among fired)

### Both channels pooled

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 W, WX1, WX2, WX3 | dir fired W, WX1, WX2, WX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 11 | 0.720 | 7/7 (100%) | 0.773 | 7/7 (100%) | 0.983 | 11/11 (100%) |
| stimulation | 36 | 0.819 | 20/20 (100%) | 0.854 | 16/16 (100%) | 0.833 | 24/24 (100%) |
| hedonism | 15 | 0.574 | 4/4 (100%) | 0.915 | 5/5 (100%) | 0.920 | 13/13 (100%) |
| achievement | 12 | 0.731 | 3/3 (100%) | 0.749 | 2/2 (100%) | 0.761 | 7/7 (100%) |
| power | 20 | 0.863 | 7/7 (100%) | 0.826 | 9/9 (100%) | 0.946 | 19/19 (100%) |
| security | 71 | 0.806 | 24/32 (75%) | 0.728 | 25/29 (86%) | 0.758 | 55/55 (100%) |
| conformity | 16 | 0.568 | 4/4 (100%) | 0.709 | 6/6 (100%) | 0.760 | 10/10 (100%) |
| tradition | 6 | 0.996 | 6/6 (100%) | 1.000 | 5/5 (100%) | 1.000 | 6/6 (100%) |
| benevolence | 39 | 0.620 | 12/12 (100%) | 0.788 | 13/13 (100%) | 0.869 | 33/33 (100%) |
| universalism | 11 | 0.826 | 7/7 (100%) | 0.919 | 7/7 (100%) | 0.993 | 11/11 (100%) |

### Stake channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 W, WX1, WX2, WX3 | dir fired W, WX1, WX2, WX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 6 | 0.935 | 5/5 (100%) | 0.902 | 5/5 (100%) | 0.993 | 6/6 (100%) |
| stimulation | 17 | 0.758 | 5/5 (100%) | 0.903 | 9/9 (100%) | 0.824 | 11/11 (100%) |
| hedonism | 11 | 0.456 | 2/2 (100%) | 0.951 | 3/3 (100%) | 0.909 | 9/9 (100%) |
| achievement | 9 | 0.752 | 2/2 (100%) | 0.775 | 2/2 (100%) | 0.812 | 6/6 (100%) |
| power | 7 | 0.783 | 1/1 (100%) | 0.634 | 1/1 (100%) | 0.894 | 6/6 (100%) |
| security | 50 | 0.866 | 14/22 (64%) | 0.794 | 16/18 (89%) | 0.730 | 38/38 (100%) |
| conformity | 0 | n/a | n/a | n/a | n/a | n/a | n/a |
| tradition | 3 | 1.000 | 3/3 (100%) | 1.000 | 3/3 (100%) | 1.000 | 3/3 (100%) |
| benevolence | 13 | 0.546 | 2/2 (100%) | 0.857 | 5/5 (100%) | 0.801 | 9/9 (100%) |
| universalism | 0 | n/a | n/a | n/a | n/a | n/a | n/a |

### Deed channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 W, WX1, WX2, WX3 | dir fired W, WX1, WX2, WX3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|---|---|
| self_direction | 5 | 0.481 | 2/2 (100%) | 0.627 | 2/2 (100%) | 0.973 | 5/5 (100%) |
| stimulation | 19 | 0.865 | 15/15 (100%) | 0.810 | 7/7 (100%) | 0.842 | 13/13 (100%) |
| hedonism | 4 | 0.885 | 2/2 (100%) | 0.934 | 2/2 (100%) | 0.974 | 4/4 (100%) |
| achievement | 3 | 0.665 | 1/1 (100%) | 0.602 | n/a | 0.628 | 1/1 (100%) |
| power | 13 | 0.917 | 6/6 (100%) | 0.917 | 8/8 (100%) | 0.978 | 13/13 (100%) |
| security | 21 | 0.755 | 10/10 (100%) | 0.756 | 9/11 (82%) | 0.786 | 17/17 (100%) |
| conformity | 16 | 0.595 | 4/4 (100%) | 0.674 | 6/6 (100%) | 0.695 | 10/10 (100%) |
| tradition | 3 | 0.991 | 3/3 (100%) | 1.000 | 2/2 (100%) | 1.000 | 3/3 (100%) |
| benevolence | 26 | 0.667 | 10/10 (100%) | 0.792 | 8/8 (100%) | 0.897 | 24/24 (100%) |
| universalism | 11 | 0.784 | 7/7 (100%) | 0.938 | 7/7 (100%) | 0.986 | 11/11 (100%) |

## Consensus subset (both labellers give the same direction)

73 of 80 cases.

| arm | n | E1 | E3 |
|---|---|---|---|
| B | 73 | 52/63 (83%) | 0.680 |
| X1 | 73 | 48/63 (76%) | 0.625 |
| X2 | 73 | 48/63 (76%) | 0.645 |
| X3 | 73 | 48/63 (76%) | 0.626 |
| W | 73 | 50/63 (79%) | 0.682 |
| WX1 | 73 | 52/63 (83%) | 0.684 |
| WX2 | 73 | 50/63 (79%) | 0.664 |
| WX3 | 73 | 50/63 (79%) | 0.680 |
| B-sq | 73 | 54/63 (86%) | 0.709 |
| X1-sq | 73 | 52/63 (83%) | 0.660 |
| X2-sq | 73 | 52/63 (83%) | 0.689 |
| X3-sq | 73 | 52/63 (83%) | 0.679 |
| W-sq | 73 | 51/63 (81%) | 0.699 |
| WX1-sq | 73 | 51/63 (81%) | 0.706 |
| WX2-sq | 73 | 52/63 (83%) | 0.689 |
| WX3-sq | 73 | 53/63 (84%) | 0.695 |
| L2 (ceiling) | 73 | 63/63 (100%) | 0.964 |

## Stage attribution (from each arm's own logged answers, linear weights unless stated; never decides)

### B

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 55/70 (79%) | 0.671 | 0.514 |
| gate oracle | 53/70 (76%) | 0.675 | 0.529 |
| direction oracle | 58/70 (83%) | 0.755 | 0.529 |
| gate and direction oracle | 60/70 (86%) | 0.804 | 0.564 |
| no touches | 55/70 (79%) | 0.672 | 0.541 |

### X1

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 49/70 (70%) | 0.595 | 0.460 |
| gate oracle | 51/70 (73%) | 0.631 | 0.483 |
| direction oracle | 55/70 (79%) | 0.723 | 0.477 |
| gate and direction oracle | 57/70 (81%) | 0.831 | 0.530 |
| no touches | 48/70 (69%) | 0.595 | 0.462 |

### X2

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 49/70 (70%) | 0.616 | 0.495 |
| gate oracle | 52/70 (74%) | 0.640 | 0.527 |
| direction oracle | 55/70 (79%) | 0.746 | 0.533 |
| gate and direction oracle | 58/70 (83%) | 0.831 | 0.575 |
| no touches | 49/70 (70%) | 0.628 | 0.518 |

### X3

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 49/70 (70%) | 0.597 | 0.493 |
| gate oracle | 52/70 (74%) | 0.634 | 0.498 |
| direction oracle | 53/70 (76%) | 0.735 | 0.519 |
| gate and direction oracle | 58/70 (83%) | 0.835 | 0.573 |
| no touches | 49/70 (70%) | 0.605 | 0.506 |

### Labels only (no answer used; over B's cases)

| swap | E1 | E3 | E4 |
|---|---|---|---|
| labels only (lin) | 63/70 (90%) | 0.881 | 0.473 |
| labels only (sq) | 65/70 (93%) | 0.911 | 0.571 |

### Own-gap closure: (E3_oracle - E3_arm) / (E3_L2 - E3_arm), for each arm above

E3_L2 0.943.

| arm | E3 | gate oracle | direction oracle | gate and direction oracle |
|---|---|---|---|---|
| B | 0.671 | 0.013 | 0.309 | 0.489 |
| X1 | 0.595 | 0.105 | 0.368 | 0.678 |
| X2 | 0.616 | 0.072 | 0.397 | 0.659 |
| X3 | 0.597 | 0.107 | 0.400 | 0.688 |

## Comparisons (paired scenario bootstrap; E3 decides)

### X1 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.671, X1 0.595. **E3 difference -0.077, [-0.197, 0.037] (skipped resamples 0): X1 ties.**

| secondary (described, never deciding) | X1 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 2 | 8 | 0.109 |
| E4 build difference |  |  | -0.004 [-0.176, 0.197] (skipped 0) |
| E4 detract difference |  |  | -0.105 [-0.340, 0.064] (skipped 0) |
| E4 mean difference |  |  | -0.054 [-0.200, 0.080] (skipped 0) |

### X2 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.671, X2 0.616. **E3 difference -0.055, [-0.159, 0.023] (skipped resamples 0): X2 ties.**

| secondary (described, never deciding) | X2 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 1 | 7 | 0.070 |
| E4 build difference |  |  | 0.046 [-0.084, 0.178] (skipped 0) |
| E4 detract difference |  |  | -0.084 [-0.289, 0.067] (skipped 0) |
| E4 mean difference |  |  | -0.019 [-0.134, 0.077] (skipped 0) |

### X3 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.671, X3 0.597. **E3 difference -0.075, [-0.181, 0.016] (skipped resamples 0): X3 ties.**

| secondary (described, never deciding) | X3 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 1 | 7 | 0.070 |
| E4 build difference |  |  | 0.038 [-0.093, 0.173] (skipped 0) |
| E4 detract difference |  |  | -0.081 [-0.297, 0.077] (skipped 0) |
| E4 mean difference |  |  | -0.022 [-0.142, 0.081] (skipped 0) |

### X2 vs X1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X1 0.595, X2 0.616. **E3 difference 0.022, [-0.039, 0.074] (skipped resamples 0): X2 ties.**

### X3 vs X2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X2 0.616, X3 0.597. **E3 difference -0.019, [-0.063, 0.019] (skipped resamples 0): X3 ties.**

### WX1 vs W (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 W 0.665, WX1 0.665. **E3 difference -0.000, [-0.078, 0.098] (skipped resamples 0): WX1 ties.**

### WX2 vs W (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 W 0.665, WX2 0.646. **E3 difference -0.019, [-0.066, 0.028] (skipped resamples 0): WX2 ties.**

### WX3 vs W (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 W 0.665, WX3 0.662. **E3 difference -0.003, [-0.076, 0.080] (skipped resamples 0): WX3 ties.**

### WX2 vs WX1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 WX1 0.665, WX2 0.646. **E3 difference -0.019, [-0.093, 0.044] (skipped resamples 0): WX2 ties.**

### WX3 vs WX2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 WX2 0.646, WX3 0.662. **E3 difference 0.016, [-0.038, 0.075] (skipped resamples 0): WX3 ties.**

### W vs B (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.671, W 0.665. **E3 difference -0.006, [-0.099, 0.063] (skipped resamples 0): W ties.**

### B-sq vs B (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.671, B-sq 0.695. **E3 difference 0.024, [-0.051, 0.089] (skipped resamples 0): B-sq ties.**

### X1-sq vs X1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X1 0.595, X1-sq 0.641. **E3 difference 0.046, [-0.034, 0.139] (skipped resamples 0): X1-sq ties.**

### X2-sq vs X2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X2 0.616, X2-sq 0.664. **E3 difference 0.048, [-0.026, 0.141] (skipped resamples 0): X2-sq ties.**

### X3-sq vs X3 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X3 0.597, X3-sq 0.654. **E3 difference 0.057, [-0.036, 0.159] (skipped resamples 0): X3-sq ties.**

### W-sq vs W (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 W 0.665, W-sq 0.683. **E3 difference 0.019, [-0.013, 0.057] (skipped resamples 0): W-sq ties.**

### WX1-sq vs WX1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 WX1 0.665, WX1-sq 0.681. **E3 difference 0.017, [-0.022, 0.050] (skipped resamples 0): WX1-sq ties.**

### WX2-sq vs WX2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 WX2 0.646, WX2-sq 0.669. **E3 difference 0.023, [-0.031, 0.096] (skipped resamples 0): WX2-sq ties.**

### WX3-sq vs WX3 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 WX3 0.662, WX3-sq 0.677. **E3 difference 0.015, [-0.032, 0.061] (skipped resamples 0): WX3-sq ties.**

RECOMMENDATION: no X arm wins on E3: B's reading stays (X1 ties, X2 ties, X3 ties). No X arm loses.
