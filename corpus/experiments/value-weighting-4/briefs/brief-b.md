You are the author of arm **B: v3's O2 with the two fixes**. Your module is `arms/b.ts`, `arm: "B"`. Budget 0.20 USD.

## What B is (checked against your code before the freeze)

- The questions are v3's `d4` family, unchanged: import the `d4-*` variant's `ask` from
  `../../value-weighting-3/arms/o2.ts`. No new or reworded question.
- The two fixes, each chosen by measured lift, on v3's logged answers (88 cases, free to rescore) and on this run's dev:
  - **Weighting.** Start from linear (w = importance). You may choose another function if the data favour it, but none
    that gives weight 0 to importance 2 or more: the case that motivates this fix is a death threat on a value rated 2.
  - **Neutral gate.** A threshold τ on the touches noul: the score is 0 when P(touches) < τ. Decide also whether
    P(touches) still multiplies the score above τ. Tune τ and the band together; report neutral hits and false
    neutrals for the τ you pick.
- Jev never sees an importance; only `score` reads them (the contract's types enforce it).

The C author builds on your frozen final, adding a congruence channel, so keep the final clean and its knobs few.
