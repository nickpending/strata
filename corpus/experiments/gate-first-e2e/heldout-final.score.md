# gate-first-e2e scoring

calls: corpus/runs/gate-first-e2e/2026-11-12T21-22-19-984Z-heldout-final/judgments.jsonl; material: corpus/experiments/gate-first-e2e/heldout-material.json; labels: corpus/experiments/gate-first-e2e/heldout-labels.json; labels2: corpus/experiments/gate-first-e2e/heldout-labels2.json; seed 20261112; resamples 10000

## Header

| arm | variant | final | judgments | ok | refused | reps | cases |
|---|---|---|---|---|---|---|---|
| B | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| G | m3-45 | yes | 400 | 400 | 0 | 5 | 80 |

cases 80; scenarios 56; items per case 20 (2 channels x 10 values); items 1600

Case labels per direction and magnitude:

| direction | 0 | 1 | 2 | 3 | 4 | 5 | total |
|---|---|---|---|---|---|---|---|
| build | 0 | 4 | 10 | 14 | 4 | 4 | 36 |
| detract | 0 | 4 | 8 | 13 | 5 | 4 | 34 |
| neutral | 10 | 0 | 0 | 0 | 0 | 0 | 10 |

Touched items per channel and direction (first labeller):

| channel | up | down | none |
|---|---|---|---|
| stake | 50 | 69 | 681 |
| deed | 75 | 39 | 686 |

## Case level: E1 to E5

E3 decides. E4 is the mean of the build and detract rho. Ceiling row: second labeller's signed label as the score.

| arm | n | E1 | E1 per rep (mean, min-max) | E2 pairs held | E3 pooled rho | E4 build | E4 detract | E4 | E5 3-way | neutral |score| med | neutral max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B-lin | 80 | 47/70 (67%) | 0.683 (0.657-0.714) | 8/24 (33%) | 0.597 | 0.568 | 0.412 | 0.490 | 49/80 (61%) | 0.096 | 0.721 |
| G | 80 | 51/70 (73%) | 0.726 (0.714-0.743) | 11/24 (46%) | 0.633 | 0.465 | 0.621 | 0.543 | 53/80 (66%) | 0.025 | 0.343 |
| G-sq | 80 | 50/70 (71%) | 0.720 (0.714-0.729) | 10/24 (42%) | 0.652 | 0.451 | 0.600 | 0.525 | 56/80 (70%) | 0.013 | 0.429 |
| B-sq (secondary) | 80 | 52/70 (74%) | 0.749 (0.729-0.771) | 12/24 (50%) | 0.659 | 0.591 | 0.423 | 0.507 | 53/80 (66%) | 0.105 | 0.780 |
| L2 (ceiling) | 80 | 58/70 (83%) | n/a | 15/24 (63%) | 0.859 | 0.691 | 0.840 | 0.765 | 68/80 (85%) | 0.000 | 0.000 |

## Case level: E6 to E8

| arm | conflict dir | character dir | exposure dir | size pairs ordered | E7 spread med | E7 spread max | calls/judg | questions/judg | USD total | USD/judg | ms median |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B-lin | 5/10 (50%) | 13/20 (65%) | 10/13 (77%) | 6/6 (100%) | 0.118 | 0.399 | 2.0 | 57.3 | 0.1033 (n=400) | 0.000258 | 362 |
| G | 6/10 (60%) | 15/20 (75%) | 11/13 (85%) | 6/6 (100%) | 0.072 | 0.689 | 4.0 | 35.9 | 0.1102 (n=400) | 0.000276 | 525 |

Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).

## Per-value stage: P1 and P2

P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong. -sq rows have the same readings as their lin row.

| arm | touched n | P1 all | P1 stake | P1 deed | P2 fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|---|---|
| B-lin | 233 | 0.709 | 0.664 | 0.752 | 91 | 89/91 (98%) | 203/233 (87%) |
| G | 233 | 0.826 | 0.808 | 0.848 | 177 | 160/177 (90%) | 175/233 (75%) |
| L2 (ceiling) | 233 | 0.867 | 0.829 | 0.907 | 186 | 184/186 (99%) | 184/233 (79%) |

## P3 per value (both channels pooled; n = touched items)

### B-lin

| value | touched n | P1 | fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|
| self_direction | 13 | 0.791 | 6 | 6/6 (100%) | 12/13 (92%) |
| stimulation | 10 | 0.649 | 6 | 6/6 (100%) | 10/10 (100%) |
| hedonism | 5 | 0.884 | 3 | 3/3 (100%) | 3/5 (60%) |
| achievement | 9 | 0.747 | 4 | 4/4 (100%) | 8/9 (89%) |
| power | 50 | 0.684 | 16 | 16/16 (100%) | 40/50 (80%) |
| security | 61 | 0.700 | 21 | 21/21 (100%) | 53/61 (87%) |
| conformity * | 23 | 0.667 | 8 | 8/8 (100%) | 22/23 (96%) |
| tradition | 8 | 0.779 | 4 | 4/4 (100%) | 8/8 (100%) |
| benevolence * | 38 | 0.737 | 15 | 13/15 (87%) | 31/38 (82%) |
| universalism | 16 | 0.836 | 8 | 8/8 (100%) | 16/16 (100%) |

### G

| value | touched n | P1 | fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|
| self_direction | 13 | 0.844 | 10 | 10/10 (100%) | 10/13 (77%) |
| stimulation | 10 | 0.641 | 4 | 4/4 (100%) | 4/10 (40%) |
| hedonism | 5 | 0.990 | 5 | 5/5 (100%) | 5/5 (100%) |
| achievement | 9 | 0.922 | 9 | 9/9 (100%) | 9/9 (100%) |
| power | 50 | 0.625 | 26 | 24/26 (92%) | 29/50 (58%) |
| security | 61 | 0.865 | 56 | 48/56 (86%) | 50/61 (82%) |
| conformity * | 23 | 0.644 | 15 | 11/15 (73%) | 15/23 (65%) |
| tradition | 8 | 0.970 | 8 | 8/8 (100%) | 8/8 (100%) |
| benevolence * | 38 | 0.856 | 31 | 28/31 (90%) | 30/38 (79%) |
| universalism | 16 | 0.833 | 13 | 13/13 (100%) | 15/16 (94%) |

### L2 (ceiling)

| value | touched n | P1 | fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|
| self_direction | 13 | 0.897 | 12 | 12/12 (100%) | 12/13 (92%) |
| stimulation | 10 | 0.880 | 8 | 8/8 (100%) | 8/10 (80%) |
| hedonism | 5 | 0.994 | 5 | 5/5 (100%) | 5/5 (100%) |
| achievement | 9 | 0.712 | 4 | 4/4 (100%) | 4/9 (44%) |
| power | 50 | 0.679 | 22 | 22/22 (100%) | 22/50 (44%) |
| security | 61 | 0.871 | 57 | 55/57 (96%) | 55/61 (90%) |
| conformity * | 23 | 0.898 | 19 | 19/19 (100%) | 19/23 (83%) |
| tradition | 8 | 0.964 | 8 | 8/8 (100%) | 8/8 (100%) |
| benevolence * | 38 | 0.912 | 36 | 36/36 (100%) | 36/38 (95%) |
| universalism | 16 | 0.969 | 15 | 15/15 (100%) | 15/16 (94%) |

(* conformity and benevolence are reported whatever their n.)

## Consensus subset (both labellers give the same direction)

68 of 80 cases.

| arm | n | E1 | E3 |
|---|---|---|---|
| B-lin | 68 | 43/58 (74%) | 0.692 |
| G | 68 | 47/58 (81%) | 0.716 |
| G-sq | 68 | 46/58 (79%) | 0.722 |
| B-sq (secondary) | 68 | 47/58 (81%) | 0.755 |
| L2 (ceiling) | 68 | 58/58 (100%) | 0.975 |

## Stage attribution (from logged answers, linear weights unless stated; never decides)

### B-lin

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 47/70 (67%) | 0.597 | 0.490 |
| gate oracle | 52/70 (74%) | 0.638 | 0.411 |
| direction oracle | 50/70 (71%) | 0.669 | 0.526 |
| gate and direction oracle | 57/70 (81%) | 0.783 | 0.460 |
| no touches | 47/70 (67%) | 0.607 | 0.478 |
| labels only (lin) | 65/70 (93%) | 0.822 | 0.203 |
| labels only (sq) | 66/70 (94%) | 0.824 | 0.208 |

### G

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 51/70 (73%) | 0.633 | 0.543 |
| gate oracle | 52/70 (74%) | 0.642 | 0.384 |
| direction oracle | 53/70 (76%) | 0.697 | 0.559 |
| gate and direction oracle | 55/70 (79%) | 0.760 | 0.427 |
| no touches | 51/70 (73%) | 0.643 | 0.551 |
| labels only (lin) | 65/70 (93%) | 0.822 | 0.203 |
| labels only (sq) | 66/70 (94%) | 0.824 | 0.208 |

### Recovery shares: (E3_arm - E3_B) / (E3_ceiling - E3_B), over each arm's own cases

B-lin E3 0.597; ceiling as second labeller's E3 0.859; ceiling as B's gate and direction oracle E3 0.783.

| arm | E3 | share, ceiling = L2's E3 | share, ceiling = B gate+direction oracle |
|---|---|---|---|
| G | 0.633 | 0.140 | 0.197 |

## Comparisons (paired scenario bootstrap on E3; decides)

### Gate fix: G vs B-lin

n 80 cases, 56 scenarios. E3 B-lin 0.597, G 0.633.

**E3 difference 0.037, 97.50% interval [-0.074, 0.160] (skipped resamples 0): G ties.**

| descriptive | G only right/held | B-lin only right/held | exact McNemar p / interval |
|---|---|---|---|
| E1 (discordant cases) | 8 | 4 | 0.388 |
| E2 (discordant pairs) | 6 | 3 | 0.508 |
| E4 difference | 0.053 |  | [-0.095, 0.208] bootstrap |

### Squared: G-sq vs G

n 80 cases, 56 scenarios. E3 G 0.633, G-sq 0.652.

**E3 difference 0.019, 97.50% interval [-0.028, 0.062] (skipped resamples 0): G-sq ties.**

| descriptive | G-sq only right/held | G only right/held | exact McNemar p / interval |
|---|---|---|---|
| E1 (discordant cases) | 0 | 1 | 1.000 |
| E2 (discordant pairs) | 0 | 1 | 1.000 |
| E4 difference | -0.018 |  | [-0.095, 0.051] bootstrap |

RECOMMENDATION: B's per-value stage stays (no challenger wins on E3); weighting: linear stays (G-sq ties against G).
