# jev-state scoring

calls: corpus/runs/jev-state/2026-11-13T00-47-02-133Z-heldout-final/judgments.jsonl; material: corpus/experiments/jev-state/heldout-material.json; labels: corpus/experiments/jev-state/heldout-labels.json; labels2: corpus/experiments/jev-state/heldout-labels2.json; seed 20261113; resamples 10000

## Header

| arm | variant | final | judgments | ok | refused | reps | cases |
|---|---|---|---|---|---|---|---|
| S | t5 | yes | 400 | 400 | 0 | 5 | 80 |
| B | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| F | g4-prose | yes | 400 | 400 | 0 | 5 | 80 |

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
| S | 80 | 52/70 (74%) | 0.734 (0.714-0.743) | 13/24 (54%) | 0.526 | 0.284 | 0.022 | 0.153 | 56/80 (70%) | 0.047 | 0.426 |
| F | 80 | 53/70 (76%) | 0.754 (0.743-0.771) | 12/24 (50%) | 0.597 | 0.248 | 0.191 | 0.219 | 55/80 (69%) | 0.046 | 0.368 |
| S-sq (secondary) | 80 | 55/70 (79%) | 0.789 (0.786-0.800) | 15/24 (63%) | 0.587 | 0.301 | 0.070 | 0.186 | 58/80 (73%) | 0.057 | 0.374 |
| B-sq (secondary) | 80 | 55/70 (79%) | 0.780 (0.757-0.800) | 14/24 (58%) | 0.613 | 0.248 | 0.054 | 0.151 | 58/80 (73%) | 0.052 | 0.148 |
| F-sq (secondary) | 80 | 56/70 (80%) | 0.803 (0.771-0.829) | 16/24 (67%) | 0.624 | 0.255 | 0.179 | 0.217 | 60/80 (75%) | 0.045 | 0.320 |
| L2 (ceiling) | 80 | 64/70 (91%) | n/a | 24/24 (100%) | 0.940 | 0.770 | 0.831 | 0.801 | 74/80 (93%) | 0.000 | 0.000 |

## Case level: E6 to E8

| arm | conflict dir | character dir | exposure dir | size pairs ordered | E7 spread med | E7 spread max | calls/judg | questions/judg | USD total | USD/judg | ms median |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 6/10 (60%) | 17/24 (71%) | 7/13 (54%) | 5/6 (83%) | 0.084 | 0.431 | 2.0 | 55.5 | 0.0975 (n=400) | 0.000244 | 410 |
| S | 6/10 (60%) | 17/24 (71%) | 11/13 (85%) | 5/6 (83%) | 0.090 | 0.269 | 2.0 | 55.5 | 0.1056 (n=400) | 0.000264 | 414 |
| F | 6/10 (60%) | 17/24 (71%) | 10/13 (77%) | 5/6 (83%) | 0.066 | 0.422 | 10.3 | 55.2 | 0.1591 (n=400) | 0.000398 | 435 |

Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).

## Per-value stage: P1 and P2

P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong. -sq rows have the same readings as their lin row.

| arm | touched n | P1 all | P1 stake | P1 deed | P2 fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|---|---|
| B | 229 | 0.726 | 0.720 | 0.730 | 98 | 96/98 (98%) | 198/229 (86%) |
| S | 229 | 0.722 | 0.729 | 0.714 | 91 | 87/91 (96%) | 200/229 (87%) |
| F | 229 | 0.686 | 0.708 | 0.663 | 77 | 76/77 (99%) | 191/229 (83%) |
| L2 (ceiling) | 229 | 0.890 | 0.918 | 0.861 | 200 | 195/200 (98%) | 195/229 (85%) |

## P3 per value (both channels pooled; n = touched items)

### B

| value | touched n | P1 | fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|
| self_direction | 4 | 0.886 | 2 | 2/2 (100%) | 4/4 (100%) |
| stimulation | 23 | 0.816 | 16 | 16/16 (100%) | 22/23 (96%) |
| hedonism | 9 | 0.659 | 4 | 4/4 (100%) | 6/9 (67%) |
| achievement | 18 | 0.804 | 10 | 10/10 (100%) | 17/18 (94%) |
| power | 35 | 0.831 | 20 | 20/20 (100%) | 31/35 (89%) |
| security | 68 | 0.617 | 16 | 14/16 (88%) | 58/68 (85%) |
| conformity * | 20 | 0.656 | 7 | 7/7 (100%) | 18/20 (90%) |
| tradition | 6 | 0.797 | 2 | 2/2 (100%) | 4/6 (67%) |
| benevolence * | 31 | 0.550 | 12 | 12/12 (100%) | 23/31 (74%) |
| universalism | 15 | 0.764 | 9 | 9/9 (100%) | 15/15 (100%) |

### S

| value | touched n | P1 | fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|
| self_direction | 4 | 0.886 | 2 | 2/2 (100%) | 4/4 (100%) |
| stimulation | 23 | 0.807 | 15 | 15/15 (100%) | 22/23 (96%) |
| hedonism | 9 | 0.578 | 4 | 4/4 (100%) | 6/9 (67%) |
| achievement | 18 | 0.789 | 11 | 10/11 (91%) | 17/18 (94%) |
| power | 35 | 0.801 | 20 | 20/20 (100%) | 31/35 (89%) |
| security | 68 | 0.618 | 18 | 16/18 (89%) | 58/68 (85%) |
| conformity * | 20 | 0.753 | 6 | 5/6 (83%) | 19/20 (95%) |
| tradition | 6 | 0.856 | 2 | 2/2 (100%) | 4/6 (67%) |
| benevolence * | 31 | 0.549 | 7 | 7/7 (100%) | 25/31 (81%) |
| universalism | 15 | 0.763 | 6 | 6/6 (100%) | 14/15 (93%) |

### F

| value | touched n | P1 | fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|
| self_direction | 4 | 0.752 | 3 | 3/3 (100%) | 3/4 (75%) |
| stimulation | 23 | 0.768 | 13 | 13/13 (100%) | 22/23 (96%) |
| hedonism | 9 | 0.607 | 4 | 4/4 (100%) | 7/9 (78%) |
| achievement | 18 | 0.691 | 6 | 6/6 (100%) | 17/18 (94%) |
| power | 35 | 0.754 | 19 | 19/19 (100%) | 28/35 (80%) |
| security | 68 | 0.575 | 16 | 15/16 (94%) | 59/68 (87%) |
| conformity * | 20 | 0.621 | 4 | 4/4 (100%) | 18/20 (90%) |
| tradition | 6 | 0.858 | 2 | 2/2 (100%) | 2/6 (33%) |
| benevolence * | 31 | 0.510 | 2 | 2/2 (100%) | 24/31 (77%) |
| universalism | 15 | 0.732 | 8 | 8/8 (100%) | 11/15 (73%) |

### L2 (ceiling)

| value | touched n | P1 | fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|
| self_direction | 4 | 0.929 | 4 | 4/4 (100%) | 4/4 (100%) |
| stimulation | 23 | 0.898 | 19 | 19/19 (100%) | 19/23 (83%) |
| hedonism | 9 | 1.000 | 9 | 9/9 (100%) | 9/9 (100%) |
| achievement | 18 | 0.912 | 17 | 17/17 (100%) | 17/18 (94%) |
| power | 35 | 0.855 | 33 | 32/33 (97%) | 32/35 (91%) |
| security | 68 | 0.798 | 56 | 53/56 (95%) | 53/68 (78%) |
| conformity * | 20 | 0.854 | 16 | 16/16 (100%) | 16/20 (80%) |
| tradition | 6 | 0.994 | 6 | 6/6 (100%) | 6/6 (100%) |
| benevolence * | 31 | 0.833 | 25 | 24/25 (96%) | 24/31 (77%) |
| universalism | 15 | 0.990 | 15 | 15/15 (100%) | 15/15 (100%) |

(* conformity and benevolence are reported whatever their n.)

## Consensus subset (both labellers give the same direction)

74 of 80 cases.

| arm | n | E1 | E3 |
|---|---|---|---|
| B | 74 | 46/64 (72%) | 0.582 |
| S | 74 | 49/64 (77%) | 0.560 |
| F | 74 | 49/64 (77%) | 0.613 |
| S-sq (secondary) | 74 | 52/64 (81%) | 0.624 |
| B-sq (secondary) | 74 | 52/64 (81%) | 0.650 |
| F-sq (secondary) | 74 | 53/64 (83%) | 0.645 |
| L2 (ceiling) | 74 | 64/64 (100%) | 0.968 |

## Stage attribution (from logged answers, linear weights unless stated; never decides)

### B

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 49/70 (70%) | 0.548 | 0.157 |
| gate oracle | 50/70 (71%) | 0.651 | 0.352 |
| direction oracle | 51/70 (73%) | 0.575 | 0.215 |
| gate and direction oracle | 54/70 (77%) | 0.736 | 0.406 |
| no touches | 49/70 (70%) | 0.585 | 0.146 |
| labels only (lin) | 57/70 (81%) | 0.844 | 0.357 |
| labels only (sq) | 61/70 (87%) | 0.879 | 0.355 |

### S

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 52/70 (74%) | 0.526 | 0.153 |
| gate oracle | 50/70 (71%) | 0.626 | 0.327 |
| direction oracle | 53/70 (76%) | 0.587 | 0.205 |
| gate and direction oracle | 53/70 (76%) | 0.716 | 0.396 |
| no touches | 52/70 (74%) | 0.557 | 0.165 |
| labels only (lin) | 57/70 (81%) | 0.844 | 0.357 |
| labels only (sq) | 61/70 (87%) | 0.879 | 0.355 |

### F

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 53/70 (76%) | 0.597 | 0.219 |
| gate oracle | 47/70 (67%) | 0.594 | 0.274 |
| direction oracle | 54/70 (77%) | 0.628 | 0.263 |
| gate and direction oracle | 51/70 (73%) | 0.693 | 0.375 |
| no touches | 53/70 (76%) | 0.607 | 0.197 |
| labels only (lin) | 57/70 (81%) | 0.844 | 0.357 |
| labels only (sq) | 61/70 (87%) | 0.879 | 0.355 |

### Recovery shares: (E3_arm - E3_B) / (E3_ceiling - E3_B), over each arm's own cases

B E3 0.548; ceiling as second labeller's E3 0.940; ceiling as B's gate and direction oracle E3 0.736.

| arm | E3 | share, ceiling = L2's E3 | share, ceiling = B gate+direction oracle |
|---|---|---|---|
| S | 0.526 | -0.056 | -0.118 |
| F | 0.597 | 0.125 | 0.261 |

### Own-gap closure: (E3_oracle - E3_arm) / (E3_L2 - E3_arm), for each final arm

E3_L2 0.940.

| arm | E3 | gate oracle | direction oracle | gate and direction oracle |
|---|---|---|---|---|
| B | 0.548 | 0.263 | 0.070 | 0.478 |
| S | 0.526 | 0.241 | 0.147 | 0.458 |
| F | 0.597 | -0.008 | 0.091 | 0.280 |

## Comparisons (paired scenario bootstrap; E3 and P1 decide)

### S vs B

n 80 cases, 56 scenarios; interval 97.50%.

E3 B 0.548, S 0.526. **E3 difference -0.022, [-0.110, 0.058] (skipped resamples 0): S ties.**

P1 B 0.726, S 0.722. **P1 difference -0.004, [-0.030, 0.023] (skipped resamples 0): S ties.**

| descriptive | S only right/held | B only right/held | exact McNemar p / interval |
|---|---|---|---|
| E1 (discordant cases) | 4 | 1 | 0.375 |
| E2 (discordant pairs) | 4 | 0 | 0.125 |
| E4 difference | -0.004 |  | [-0.131, 0.132] bootstrap |
| P2 (direction over all touched) difference | 0.009 |  | [-0.013, 0.034] bootstrap |

### F vs B

n 80 cases, 56 scenarios; interval 97.50%.

E3 B 0.548, F 0.597. **E3 difference 0.049, [-0.075, 0.181] (skipped resamples 0): F ties.**

P1 B 0.726, F 0.686. **P1 difference -0.040, [-0.089, 0.007] (skipped resamples 0): F ties.**

| descriptive | F only right/held | B only right/held | exact McNemar p / interval |
|---|---|---|---|
| E1 (discordant cases) | 6 | 2 | 0.289 |
| E2 (discordant pairs) | 3 | 0 | 0.250 |
| E4 difference | 0.063 |  | [-0.118, 0.269] bootstrap |
| P2 (direction over all touched) difference | -0.031 |  | [-0.087, 0.032] bootstrap |

### F vs S (described, decides nothing)

n 80 cases, 56 scenarios; interval 97.50%.

E3 S 0.526, F 0.597. **E3 difference 0.071, [-0.063, 0.216] (skipped resamples 0): F ties.**

P1 S 0.722, F 0.686. **P1 difference -0.036, [-0.078, 0.003] (skipped resamples 0): F ties.**

| descriptive | F only right/held | S only right/held | exact McNemar p / interval |
|---|---|---|---|
| E1 (discordant cases) | 5 | 4 | 1.000 |
| E2 (discordant pairs) | 1 | 2 | 1.000 |
| E4 difference | 0.066 |  | [-0.111, 0.268] bootstrap |
| P2 (direction over all touched) difference | -0.039 |  | [-0.099, 0.029] bootstrap |

RECOMMENDATION: B's state stays (no challenger wins on E3).
