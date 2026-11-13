# jev-statements scoring

calls: ../../runs/jev-statements/2026-11-13T01-36-18-961Z-heldout-final/judgments.jsonl,../../runs/jev-statements/2026-11-13T01-37-12-240Z-heldout-contenders/judgments.jsonl; material: heldout-material.json; labels: heldout-labels.json; labels2: heldout-labels2.json; seed 20261114; resamples 10000

## Header

| arm | variant | final | judgments | ok | refused | reps | cases |
|---|---|---|---|---|---|---|---|
| B | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| W | w4 | yes | 400 | 400 | 0 | 5 | 80 |
| W | w1 | no | 240 | 240 | 0 | 3 | 80 |

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
| W | 80 | 53/70 (76%) | 0.757 (0.757-0.757) | 11/24 (46%) | 0.665 | 0.219 | 0.759 | 0.489 | 60/80 (75%) | 0.010 | 0.199 |
| B-sq (secondary) | 80 | 57/70 (81%) | 0.806 (0.786-0.814) | 13/24 (54%) | 0.695 | 0.292 | 0.766 | 0.529 | 60/80 (75%) | 0.036 | 0.295 |
| W-sq (secondary) | 80 | 54/70 (77%) | 0.774 (0.771-0.786) | 12/24 (50%) | 0.683 | 0.224 | 0.742 | 0.483 | 59/80 (74%) | 0.011 | 0.192 |
| W/w1 (secondary) | 80 | 53/70 (76%) | 0.767 (0.757-0.771) | 11/24 (46%) | 0.638 | 0.183 | 0.744 | 0.463 | 51/80 (64%) | 0.072 | 0.299 |
| W/w1 sq (secondary) | 80 | 55/70 (79%) | 0.786 (0.771-0.800) | 14/24 (58%) | 0.672 | 0.204 | 0.750 | 0.477 | 56/80 (70%) | 0.049 | 0.275 |
| L2 (ceiling) | 80 | 63/70 (90%) | n/a | 18/24 (75%) | 0.943 | 0.765 | 0.831 | 0.798 | 73/80 (91%) | 0.000 | 0.000 |

## Case level: E6 to E8

| arm | conflict dir | character dir | exposure dir | size pairs ordered | E7 spread med | E7 spread max | calls/judg | questions/judg | USD total | USD/judg | ms median |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 8/10 (80%) | 19/25 (76%) | 12/18 (67%) | 6/6 (100%) | 0.083 | 0.423 | 2.0 | 55.0 | 0.0969 (n=400) | 0.000242 | 386 |
| W | 8/10 (80%) | 19/25 (76%) | 11/18 (61%) | 6/6 (100%) | 0.049 | 0.458 | 2.0 | 48.4 | 0.0934 (n=400) | 0.000234 | 381 |
| W/w1 (secondary) | 8/10 (80%) | 19/25 (76%) | 11/18 (61%) | 6/6 (100%) | 0.044 | 0.310 | 2.0 | 50.1 | 0.0579 (n=240) | 0.000241 | 381 |

Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).

## Per-value stage: P1 and P2

P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong. -sq rows have the same readings as their lin row.

| arm | touched n | P1 all | P1 stake | P1 deed | P2 fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|---|---|
| B | 237 | 0.760 | 0.768 | 0.754 | 102 | 94/102 (92%) | 193/237 (81%) |
| W | 237 | 0.830 | 0.837 | 0.825 | 99 | 95/99 (96%) | 199/237 (84%) |
| W/w1 (secondary) | 237 | 0.796 | 0.814 | 0.786 | 107 | 104/107 (97%) | 189/237 (80%) |
| L2 (ceiling) | 237 | 0.870 | 0.862 | 0.877 | 189 | 189/189 (100%) | 189/237 (80%) |

## P3 per value (touched n from the first labelled source of B, W, L2; P1 gate AUC; dir = direction among fired)

### Both channels pooled

| value | touched n | P1 B | P1 W | P1 L2 | dir fired B | dir fired W | dir fired L2 |
|---|---|---|---|---|---|---|---|
| self_direction | 11 | 0.720 | 0.773 | 0.983 | 7/7 (100%) | 7/7 (100%) | 11/11 (100%) |
| stimulation | 36 | 0.819 | 0.854 | 0.833 | 20/20 (100%) | 16/16 (100%) | 24/24 (100%) |
| hedonism | 15 | 0.574 | 0.915 | 0.920 | 4/4 (100%) | 5/5 (100%) | 13/13 (100%) |
| achievement | 12 | 0.731 | 0.749 | 0.761 | 3/3 (100%) | 2/2 (100%) | 7/7 (100%) |
| power | 20 | 0.863 | 0.826 | 0.946 | 7/7 (100%) | 9/9 (100%) | 19/19 (100%) |
| security | 71 | 0.806 | 0.728 | 0.758 | 24/32 (75%) | 25/29 (86%) | 55/55 (100%) |
| conformity | 16 | 0.568 | 0.709 | 0.760 | 4/4 (100%) | 6/6 (100%) | 10/10 (100%) |
| tradition | 6 | 0.996 | 1.000 | 1.000 | 6/6 (100%) | 5/5 (100%) | 6/6 (100%) |
| benevolence | 39 | 0.620 | 0.788 | 0.869 | 12/12 (100%) | 13/13 (100%) | 33/33 (100%) |
| universalism | 11 | 0.826 | 0.919 | 0.993 | 7/7 (100%) | 7/7 (100%) | 11/11 (100%) |

### Stake channel

| value | touched n | P1 B | P1 W | P1 L2 | dir fired B | dir fired W | dir fired L2 |
|---|---|---|---|---|---|---|---|
| self_direction | 6 | 0.935 | 0.902 | 0.993 | 5/5 (100%) | 5/5 (100%) | 6/6 (100%) |
| stimulation | 17 | 0.758 | 0.903 | 0.824 | 5/5 (100%) | 9/9 (100%) | 11/11 (100%) |
| hedonism | 11 | 0.456 | 0.951 | 0.909 | 2/2 (100%) | 3/3 (100%) | 9/9 (100%) |
| achievement | 9 | 0.752 | 0.775 | 0.812 | 2/2 (100%) | 2/2 (100%) | 6/6 (100%) |
| power | 7 | 0.783 | 0.634 | 0.894 | 1/1 (100%) | 1/1 (100%) | 6/6 (100%) |
| security | 50 | 0.866 | 0.794 | 0.730 | 14/22 (64%) | 16/18 (89%) | 38/38 (100%) |
| conformity | 0 | n/a | n/a | n/a | n/a | n/a | n/a |
| tradition | 3 | 1.000 | 1.000 | 1.000 | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| benevolence | 13 | 0.546 | 0.857 | 0.801 | 2/2 (100%) | 5/5 (100%) | 9/9 (100%) |
| universalism | 0 | n/a | n/a | n/a | n/a | n/a | n/a |

### Deed channel

| value | touched n | P1 B | P1 W | P1 L2 | dir fired B | dir fired W | dir fired L2 |
|---|---|---|---|---|---|---|---|
| self_direction | 5 | 0.481 | 0.627 | 0.973 | 2/2 (100%) | 2/2 (100%) | 5/5 (100%) |
| stimulation | 19 | 0.865 | 0.810 | 0.842 | 15/15 (100%) | 7/7 (100%) | 13/13 (100%) |
| hedonism | 4 | 0.885 | 0.934 | 0.974 | 2/2 (100%) | 2/2 (100%) | 4/4 (100%) |
| achievement | 3 | 0.665 | 0.602 | 0.628 | 1/1 (100%) | n/a | 1/1 (100%) |
| power | 13 | 0.917 | 0.917 | 0.978 | 6/6 (100%) | 8/8 (100%) | 13/13 (100%) |
| security | 21 | 0.755 | 0.756 | 0.786 | 10/10 (100%) | 9/11 (82%) | 17/17 (100%) |
| conformity | 16 | 0.595 | 0.674 | 0.695 | 4/4 (100%) | 6/6 (100%) | 10/10 (100%) |
| tradition | 3 | 0.991 | 1.000 | 1.000 | 3/3 (100%) | 2/2 (100%) | 3/3 (100%) |
| benevolence | 26 | 0.667 | 0.792 | 0.897 | 10/10 (100%) | 8/8 (100%) | 24/24 (100%) |
| universalism | 11 | 0.784 | 0.938 | 0.986 | 7/7 (100%) | 7/7 (100%) | 11/11 (100%) |

## Consensus subset (both labellers give the same direction)

73 of 80 cases.

| arm | n | E1 | E3 |
|---|---|---|---|
| B | 73 | 52/63 (83%) | 0.680 |
| W | 73 | 50/63 (79%) | 0.682 |
| B-sq (secondary) | 73 | 54/63 (86%) | 0.709 |
| W-sq (secondary) | 73 | 51/63 (81%) | 0.699 |
| W/w1 (secondary) | 73 | 49/63 (78%) | 0.654 |
| W/w1 sq (secondary) | 73 | 52/63 (83%) | 0.690 |
| L2 (ceiling) | 73 | 63/63 (100%) | 0.964 |

## Stage attribution (from logged answers, linear weights unless stated; never decides)

### B

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 55/70 (79%) | 0.671 | 0.514 |
| gate oracle | 53/70 (76%) | 0.675 | 0.529 |
| direction oracle | 58/70 (83%) | 0.755 | 0.529 |
| gate and direction oracle | 60/70 (86%) | 0.804 | 0.564 |
| no touches | 55/70 (79%) | 0.672 | 0.541 |
| labels only (lin) | 63/70 (90%) | 0.881 | 0.473 |
| labels only (sq) | 65/70 (93%) | 0.911 | 0.571 |

### W

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 53/70 (76%) | 0.665 | 0.489 |
| gate oracle | 52/70 (74%) | 0.667 | 0.497 |
| direction oracle | 56/70 (80%) | 0.769 | 0.513 |
| gate and direction oracle | 59/70 (84%) | 0.796 | 0.523 |
| no touches | 53/70 (76%) | 0.661 | 0.472 |
| labels only (lin) | 63/70 (90%) | 0.881 | 0.473 |
| labels only (sq) | 65/70 (93%) | 0.911 | 0.571 |

### Recovery shares: (E3_arm - E3_B) / (E3_ceiling - E3_B), over each arm's own cases

B E3 0.671; ceiling as second labeller's E3 0.943; ceiling as B's gate and direction oracle E3 0.804.

| arm | E3 | share, ceiling = L2's E3 | share, ceiling = B gate+direction oracle |
|---|---|---|---|
| W | 0.665 | -0.024 | -0.048 |
| B-sq | 0.695 | 0.088 | 0.180 |

### Own-gap closure: (E3_oracle - E3_arm) / (E3_L2 - E3_arm), for each final arm

E3_L2 0.943.

| arm | E3 | gate oracle | direction oracle | gate and direction oracle |
|---|---|---|---|---|
| B | 0.671 | 0.013 | 0.309 | 0.489 |
| W | 0.665 | 0.006 | 0.376 | 0.472 |

## Comparisons (paired scenario bootstrap; E3 and P1 decide)

### W vs B

n 80 cases, 56 scenarios; interval 97.50%.

E3 B 0.671, W 0.665. **E3 difference -0.006, [-0.090, 0.060] (skipped resamples 0): W ties.**

P1 B 0.760, W 0.830. **P1 difference 0.069, [0.015, 0.123] (skipped resamples 0): W wins.**

| described | W only right/held | B only right/held | exact McNemar p / interval |
|---|---|---|---|
| E1 (discordant cases) | 1 | 3 | 0.625 |
| E2 (discordant pairs) | 0 | 2 | 0.500 |
| E4 difference | -0.025 |  | [-0.151, 0.098] bootstrap |
| P2 (direction over all touched) difference | 0.025 |  | [-0.020, 0.069] bootstrap |
| P2 (direction among fired) difference | 0.038 |  | [-0.045, 0.126] bootstrap (skipped 0) |

Per value, B to W (described, decides nothing):

| value | measure | B | W | difference | interval 97.50% | skipped |
|---|---|---|---|---|---|---|
| security | P1 | 0.806 | 0.728 | -0.078 | [-0.177, 0.012] | 0 |
| security | direction among fired | 0.750 | 0.862 | 0.112 | [-0.094, 0.421] | 0 |
| benevolence | P1 | 0.620 | 0.788 | 0.168 | [-0.019, 0.342] | 0 |
| benevolence | direction among fired | 1.000 | 1.000 | 0.000 | [0.000, 0.000] | 3 |

### B-sq vs B

n 80 cases, 56 scenarios; interval 97.50%.

E3 B 0.671, B-sq 0.695. **E3 difference 0.024, [-0.045, 0.083] (skipped resamples 0): B-sq ties.**

No P1 row: the readings are the same.

| described | B-sq only right/held | B only right/held | exact McNemar p / interval |
|---|---|---|---|
| E1 (discordant cases) | 3 | 1 | 0.625 |
| E2 (discordant pairs) | 1 | 1 | 1.000 |
| E4 difference | 0.015 |  | [-0.089, 0.106] bootstrap |

### W-sq vs B (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 97.50%.

E3 B 0.671, W-sq 0.683. **E3 difference 0.012, [-0.070, 0.086] (skipped resamples 0): W-sq ties.**

### W-sq vs W (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 97.50%.

E3 W 0.665, W-sq 0.683. **E3 difference 0.019, [-0.010, 0.052] (skipped resamples 0): W-sq ties.**

### W-sq vs B-sq (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 97.50%.

E3 B-sq 0.695, W-sq 0.683. **E3 difference -0.012, [-0.107, 0.078] (skipped resamples 0): W-sq ties.**

### Variants vs B (dev aid; described, decides nothing; 95% interval)

B E3 0.671.

| variant | n | E3 | E3 diff vs B [95%] | P1 | P1 diff vs B [95%] |
|---|---|---|---|---|---|
| W/w1 | 80 | 0.638 | -0.033 [-0.106, 0.029] ties | 0.796 | 0.036 [-0.012, 0.083] ties |

RECOMMENDATION: statements: B's stay (W ties on E3). W wins on P1 but not on E3: a per-value gain that does not reach the case. weighting: linear stays (B-sq ties on E3).
