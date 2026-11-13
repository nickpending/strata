# item-size scoring

calls: corpus/runs/item-size/posthoc/gate-first-e2e-heldout.jsonl; material: corpus/experiments/gate-first-e2e/heldout-material.json; labels: corpus/experiments/gate-first-e2e/heldout-labels.json; labels2: corpus/experiments/gate-first-e2e/heldout-labels2.json; seed 20261112; resamples 10000

## Header

| arm | variant | final | judgments | ok | refused | reps | cases |
|---|---|---|---|---|---|---|---|
| B | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X1 | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X2 | as-is | yes | 400 | 400 | 0 | 5 | 80 |
| X3 | as-is | yes | 400 | 400 | 0 | 5 | 80 |

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
| B | 80 | 47/70 (67%) | 0.683 (0.657-0.714) | 8/24 (33%) | 0.597 | 0.568 | 0.412 | 0.490 | 49/80 (61%) | 0.096 | 0.721 |
| X1 | 80 | 50/70 (71%) | 0.700 (0.671-0.714) | 10/24 (42%) | 0.568 | 0.417 | 0.291 | 0.354 | 49/80 (61%) | 0.380 | 1.504 |
| X2 | 80 | 48/70 (69%) | 0.677 (0.657-0.686) | 9/24 (38%) | 0.575 | 0.528 | 0.320 | 0.424 | 49/80 (61%) | 0.190 | 1.230 |
| X3 | 80 | 48/70 (69%) | 0.686 (0.657-0.700) | 8/24 (33%) | 0.554 | 0.482 | 0.306 | 0.394 | 48/80 (60%) | 0.249 | 1.311 |
| B-sq | 80 | 52/70 (74%) | 0.749 (0.729-0.771) | 12/24 (50%) | 0.659 | 0.591 | 0.423 | 0.507 | 53/80 (66%) | 0.105 | 0.780 |
| X1-sq | 80 | 55/70 (79%) | 0.763 (0.743-0.786) | 15/24 (63%) | 0.639 | 0.361 | 0.317 | 0.339 | 54/80 (68%) | 0.439 | 1.545 |
| X2-sq | 80 | 53/70 (76%) | 0.740 (0.714-0.757) | 14/24 (58%) | 0.631 | 0.443 | 0.351 | 0.397 | 51/80 (64%) | 0.230 | 1.297 |
| X3-sq | 80 | 56/70 (80%) | 0.766 (0.743-0.786) | 16/24 (67%) | 0.641 | 0.440 | 0.337 | 0.388 | 54/80 (68%) | 0.250 | 1.398 |
| L2 (ceiling) | 80 | 58/70 (83%) | n/a | 15/24 (63%) | 0.859 | 0.691 | 0.840 | 0.765 | 68/80 (85%) | 0.000 | 0.000 |

## Case level: E6 to E8

| arm | conflict dir | character dir | exposure dir | size pairs ordered | E7 spread med | E7 spread max | calls/judg | questions/judg | USD total | USD/judg | ms median |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B | 5/10 (50%) | 13/20 (65%) | 10/13 (77%) | 6/6 (100%) | 0.118 | 0.399 | 2.0 | 57.3 | 0.1033 (n=400) | 0.000258 | 362 |
| X1 | 5/10 (50%) | 14/20 (70%) | 9/13 (69%) | 5/6 (83%) | 0.206 | 1.200 | 2.0 | 57.3 | 0.1033 (n=400) | 0.000258 | 362 |
| X2 | 5/10 (50%) | 14/20 (70%) | 9/13 (69%) | 5/6 (83%) | 0.226 | 1.797 | 2.0 | 57.3 | 0.1033 (n=400) | 0.000258 | 362 |
| X3 | 5/10 (50%) | 14/20 (70%) | 9/13 (69%) | 5/6 (83%) | 0.221 | 1.350 | 2.0 | 57.3 | 0.1033 (n=400) | 0.000258 | 362 |

Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).

## Per-value stage: P1 and P2 (once per statement set; r and touches are the base arm's in every X arm, checked)

P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong.

| arms | touched n | P1 all | P1 stake | P1 deed | P2 fired n | P2 dir among fired | dir over all touched |
|---|---|---|---|---|---|---|---|
| B, X1, X2, X3 | 233 | 0.709 | 0.664 | 0.752 | 91 | 89/91 (98%) | 203/233 (87%) |
| L2 (ceiling) | 233 | 0.867 | 0.829 | 0.907 | 186 | 184/186 (99%) | 184/233 (79%) |

## P3 per value (touched n from the first labelled source; P1 gate AUC; dir = direction among fired)

### Both channels pooled

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|
| self_direction | 13 | 0.791 | 6/6 (100%) | 0.897 | 12/12 (100%) |
| stimulation | 10 | 0.649 | 6/6 (100%) | 0.880 | 8/8 (100%) |
| hedonism | 5 | 0.884 | 3/3 (100%) | 0.994 | 5/5 (100%) |
| achievement | 9 | 0.747 | 4/4 (100%) | 0.712 | 4/4 (100%) |
| power | 50 | 0.684 | 16/16 (100%) | 0.679 | 22/22 (100%) |
| security | 61 | 0.700 | 21/21 (100%) | 0.871 | 55/57 (96%) |
| conformity | 23 | 0.667 | 8/8 (100%) | 0.898 | 19/19 (100%) |
| tradition | 8 | 0.779 | 4/4 (100%) | 0.964 | 8/8 (100%) |
| benevolence | 38 | 0.737 | 13/15 (87%) | 0.912 | 36/36 (100%) |
| universalism | 16 | 0.836 | 8/8 (100%) | 0.969 | 15/15 (100%) |

### Stake channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|
| self_direction | 9 | 0.890 | 6/6 (100%) | 0.888 | 8/8 (100%) |
| stimulation | 6 | 0.688 | 4/4 (100%) | 0.820 | 4/4 (100%) |
| hedonism | 3 | 0.697 | 1/1 (100%) | 1.000 | 3/3 (100%) |
| achievement | 9 | 0.715 | 4/4 (100%) | 0.715 | 4/4 (100%) |
| power | 34 | 0.630 | 9/9 (100%) | 0.640 | 11/11 (100%) |
| security | 42 | 0.658 | 13/13 (100%) | 0.860 | 36/38 (95%) |
| conformity | 0 | n/a | n/a | n/a | n/a |
| tradition | 3 | 0.814 | 2/2 (100%) | 1.000 | 3/3 (100%) |
| benevolence | 6 | 0.645 | 2/2 (100%) | 0.910 | 5/5 (100%) |
| universalism | 7 | 0.935 | 4/4 (100%) | 0.929 | 6/6 (100%) |

### Deed channel

| value | touched n | P1 B, X1, X2, X3 | dir fired B, X1, X2, X3 | P1 L2 (ceiling) | dir fired L2 (ceiling) |
|---|---|---|---|---|---|
| self_direction | 4 | 0.592 | n/a | 0.928 | 4/4 (100%) |
| stimulation | 4 | 0.595 | 2/2 (100%) | 0.974 | 4/4 (100%) |
| hedonism | 2 | 1.000 | 2/2 (100%) | 0.987 | 2/2 (100%) |
| achievement | 0 | n/a | n/a | n/a | n/a |
| power | 16 | 0.782 | 7/7 (100%) | 0.789 | 11/11 (100%) |
| security | 19 | 0.720 | 8/8 (100%) | 0.902 | 19/19 (100%) |
| conformity | 23 | 0.771 | 8/8 (100%) | 0.878 | 19/19 (100%) |
| tradition | 5 | 0.763 | 2/2 (100%) | 0.927 | 5/5 (100%) |
| benevolence | 32 | 0.783 | 11/13 (85%) | 0.839 | 31/31 (100%) |
| universalism | 9 | 0.762 | 4/4 (100%) | 1.000 | 9/9 (100%) |

## Consensus subset (both labellers give the same direction)

68 of 80 cases.

| arm | n | E1 | E3 |
|---|---|---|---|
| B | 68 | 43/58 (74%) | 0.692 |
| X1 | 68 | 44/58 (76%) | 0.658 |
| X2 | 68 | 43/58 (74%) | 0.677 |
| X3 | 68 | 42/58 (72%) | 0.649 |
| B-sq | 68 | 47/58 (81%) | 0.755 |
| X1-sq | 68 | 49/58 (84%) | 0.725 |
| X2-sq | 68 | 48/58 (83%) | 0.732 |
| X3-sq | 68 | 49/58 (84%) | 0.737 |
| L2 (ceiling) | 68 | 58/58 (100%) | 0.975 |

## Stage attribution (from each arm's own logged answers, linear weights unless stated; never decides)

### B

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 47/70 (67%) | 0.597 | 0.490 |
| gate oracle | 52/70 (74%) | 0.638 | 0.411 |
| direction oracle | 50/70 (71%) | 0.669 | 0.526 |
| gate and direction oracle | 57/70 (81%) | 0.783 | 0.460 |
| no touches | 47/70 (67%) | 0.607 | 0.478 |

### X1

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 50/70 (71%) | 0.568 | 0.354 |
| gate oracle | 52/70 (74%) | 0.647 | 0.342 |
| direction oracle | 52/70 (74%) | 0.646 | 0.373 |
| gate and direction oracle | 58/70 (83%) | 0.810 | 0.376 |
| no touches | 50/70 (71%) | 0.545 | 0.274 |

### X2

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 48/70 (69%) | 0.575 | 0.424 |
| gate oracle | 54/70 (77%) | 0.669 | 0.442 |
| direction oracle | 50/70 (71%) | 0.649 | 0.455 |
| gate and direction oracle | 58/70 (83%) | 0.825 | 0.495 |
| no touches | 48/70 (69%) | 0.577 | 0.397 |

### X3

| swap | E1 | E3 | E4 |
|---|---|---|---|
| none (logged) | 48/70 (69%) | 0.554 | 0.394 |
| gate oracle | 52/70 (74%) | 0.652 | 0.425 |
| direction oracle | 52/70 (74%) | 0.654 | 0.445 |
| gate and direction oracle | 58/70 (83%) | 0.836 | 0.496 |
| no touches | 48/70 (69%) | 0.552 | 0.354 |

### Labels only (no answer used; over B's cases)

| swap | E1 | E3 | E4 |
|---|---|---|---|
| labels only (lin) | 65/70 (93%) | 0.822 | 0.203 |
| labels only (sq) | 66/70 (94%) | 0.824 | 0.208 |

### Own-gap closure: (E3_oracle - E3_arm) / (E3_L2 - E3_arm), for each arm above

E3_L2 0.859.

| arm | E3 | gate oracle | direction oracle | gate and direction oracle |
|---|---|---|---|---|
| B | 0.597 | 0.159 | 0.277 | 0.711 |
| X1 | 0.568 | 0.273 | 0.270 | 0.832 |
| X2 | 0.575 | 0.332 | 0.260 | 0.881 |
| X3 | 0.554 | 0.321 | 0.328 | 0.927 |

## Comparisons (paired scenario bootstrap; E3 decides)

### X1 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.597, X1 0.568. **E3 difference -0.029, [-0.116, 0.065] (skipped resamples 0): X1 ties.**

| secondary (described, never deciding) | X1 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 4 | 1 | 0.375 |
| E4 build difference |  |  | -0.152 [-0.357, 0.015] (skipped 0) |
| E4 detract difference |  |  | -0.121 [-0.304, 0.073] (skipped 0) |
| E4 mean difference |  |  | -0.136 [-0.248, -0.033] (skipped 0) |

### X2 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.597, X2 0.575. **E3 difference -0.021, [-0.087, 0.053] (skipped resamples 0): X2 ties.**

| secondary (described, never deciding) | X2 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 2 | 1 | 1.000 |
| E4 build difference |  |  | -0.041 [-0.154, 0.073] (skipped 0) |
| E4 detract difference |  |  | -0.092 [-0.235, 0.038] (skipped 0) |
| E4 mean difference |  |  | -0.066 [-0.138, 0.005] (skipped 0) |

### X3 vs B (primary)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.597, X3 0.554. **E3 difference -0.043, [-0.137, 0.057] (skipped resamples 0): X3 ties.**

| secondary (described, never deciding) | X3 only right | B only right | exact McNemar p / difference [interval] |
|---|---|---|---|
| E1 (discordant cases) | 4 | 3 | 1.000 |
| E4 build difference |  |  | -0.086 [-0.247, 0.059] (skipped 0) |
| E4 detract difference |  |  | -0.106 [-0.276, 0.061] (skipped 0) |
| E4 mean difference |  |  | -0.096 [-0.195, 0.005] (skipped 0) |

### X2 vs X1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X1 0.568, X2 0.575. **E3 difference 0.008, [-0.045, 0.061] (skipped resamples 0): X2 ties.**

### X3 vs X2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X2 0.575, X3 0.554. **E3 difference -0.022, [-0.081, 0.029] (skipped resamples 0): X3 ties.**

### B-sq vs B (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 B 0.597, B-sq 0.659. **E3 difference 0.062, [-0.004, 0.137] (skipped resamples 0): B-sq ties.**

### X1-sq vs X1 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X1 0.568, X1-sq 0.639. **E3 difference 0.071, [0.009, 0.144] (skipped resamples 0): X1-sq wins.**

### X2-sq vs X2 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X2 0.575, X2-sq 0.631. **E3 difference 0.055, [-0.011, 0.123] (skipped resamples 0): X2-sq ties.**

### X3-sq vs X3 (described, E3 only, decides nothing)

n 80 cases, 56 scenarios; interval 98.33%.

E3 X3 0.554, X3-sq 0.641. **E3 difference 0.088, [0.023, 0.162] (skipped resamples 0): X3-sq wins.**

RECOMMENDATION: no X arm wins on E3: B's reading stays (X1 ties, X2 ties, X3 ties). No X arm loses.
