# size-judgment scoring

cases scored: 49 (by set: A 26, C 23); items: 65; pairs scored: 12, dropped: 0
judgment lines: 735; ignored (case unlabelled or not selected): 0
values with 8+ items: achievement, benevolence, power, security, self_direction; seed 1, resamples 10000

## A / as-is (final)  levels 3
- M1 pooled rho: per rep [0.707, 0.707, 0.719, 0.727, 0.707], mean 0.713, SD over reps 0.009
- M2 within rho: up 0.644, down 0.686, achievement 0.802, benevolence 0.821, power 0.717, security 0.726, self_direction 0.539
- M3 ordered 10.00 / tied 1.00 / reversed 1.00 of 12 pairs (means over reps); pairs ordered in >= 4 of 5 reps: 10
- M4 exact 0.409, exact-or-adjacent 0.969
- M5 mean distinct levels per item 1.062, share of items whose level changes across reps 0.062 (4/65); SD of M1 over reps 0.009
- M6 requests/judgment 1.00, questions/judgment 1.33, USD/judgment 3.29e-5, median ms 203; judgments 245, refused 0

## B / b5c-given (final)  levels 5
- M1 pooled rho: per rep [0.750, 0.755, 0.756, 0.755, 0.745], mean 0.752, SD over reps 0.005
- M2 within rho: up 0.683, down 0.748, achievement 0.689, benevolence 0.739, power 0.818, security 0.774, self_direction 0.673
- M3 ordered 11.00 / tied 0.20 / reversed 0.80 of 12 pairs (means over reps); pairs ordered in >= 4 of 5 reps: 11
- M4 exact 0.443, exact-or-adjacent 0.954
- M5 mean distinct levels per item 1.077, share of items whose level changes across reps 0.077 (5/65); SD of M1 over reps 0.005
- M6 requests/judgment 1.00, questions/judgment 1.33, USD/judgment 4.52e-5, median ms 202; judgments 245, refused 0

## C / c5-given (final)  levels 5
- M1 pooled rho: per rep [0.781, 0.779, 0.754, 0.762, 0.779], mean 0.771, SD over reps 0.012
- M2 within rho: up 0.692, down 0.788, achievement 0.644, benevolence 0.928, power 0.846, security 0.741, self_direction 0.463
- M3 ordered 11.00 / tied 0.80 / reversed 0.20 of 12 pairs (means over reps); pairs ordered in >= 4 of 5 reps: 11
- M4 exact 0.468, exact-or-adjacent 0.954
- M5 mean distinct levels per item 1.092, share of items whose level changes across reps 0.092 (6/65); SD of M1 over reps 0.012
- M6 requests/judgment 1.00, questions/judgment 1.33, USD/judgment 3.85e-5, median ms 207; judgments 245, refused 0

## Ceiling: second labeller against the first
- items labelled by both: 65 of 65
- rho pooled 0.892; up 0.868; down 0.867; achievement 1.000; benevolence 0.866; power 0.929; security 0.887; self_direction 0.490
- exact 44/65 = 0.677; exact-or-adjacent 64/65 = 0.985
- size pairs the second labeller orders the same way: 12/12 = 1.000

## Consensus subset (|s1 - s2| <= 1): 64 items, 12 pairs
- A/as-is (final): M1 0.721; M3 ordered 10.00 / tied 1.00 / reversed 1.00 of 12 pairs (means over reps); pairs ordered in >= 4 of 5 reps: 10
- B/b5c-given (final): M1 0.755; M3 ordered 11.00 / tied 0.20 / reversed 0.80 of 12 pairs (means over reps); pairs ordered in >= 4 of 5 reps: 11
- C/c5-given (final): M1 0.775; M3 ordered 11.00 / tied 0.80 / reversed 0.20 of 12 pairs (means over reps); pairs ordered in >= 4 of 5 reps: 11

## Comparison against A (finals only)
23 scenarios, 2 non-A final(s), alpha 0.0250 per challenger (interval 97.50%), A final = as-is
- B/b5c-given: M1 0.752 vs A 0.713, diff 0.039; interval [-0.043, 0.132] (10000 resamples used, 0 dropped as NaN): tie
- C/c5-given: M1 0.771 vs A 0.713, diff 0.058; interval [-0.032, 0.155] (10000 resamples used, 0 dropped as NaN): tie

Recommended: A (as-is); no challenger beats A, design B is unchanged.

## Good enough to drive standing (recommended final)
- (b) M3 ordered 0.83 (>= 0.80): holds
- (c) M2 up 0.644, down 0.686 (both >= 0.5): holds
- (a) M1 0.713 >= ceiling 0.892 - 0.10 = 0.792: fails
- Grade: partly
