## The experiment

strata (/Users/rudy/development/projects/strata) is a text world engine whose NPCs judge each encounter through
their own values: does it build or detract from how the holder sees the other person. value-weighting-3 found that
code should apply an NPC's per-value importance (arm O2), and that O2 still misses cases that turn on what an act
shows about the actor's character, zeroes a "matters" value with its step weighting, and leaks small positives on
routine acts. This run (value-weighting-4) tests whether a congruence channel closes the character gap, over O2 with
two measured fixes alone. You author one arm. The operator's standard, verbatim: "experiments must always try to
model final state reality not fucking strawman peices of shit". Make your arm the strongest it honestly can be.

## Read first, in full, before designing

1. `docs/jev.md`: the governing reference. Every question follows it; name any rule your final bends and why.
2. `corpus/experiments/value-weighting-4/prereg.md`: the arms, the rules your arm keeps, the metrics and the
   comparison. Note "A finding before design".
3. `corpus/experiments/value-weighting-3/report.md` and `arms/o2.ts` (the starting point; reuse its code by import
   rather than copying where you can). You may read `arms/o1.ts`.
4. `corpus/experiments/value-weighting-4/contract.ts`, `run.ts`, `score.ts`; `corpus/experiments/value-weighting-3/jev3.ts`
   and `catalogue.json`; `corpus/experiments/value-weighting-2/build.ts` and `render.ts`.
5. `docs/explorations/npc-relationships.md`, journey items 14 to 17.

## Material

- Dev: `corpus/experiments/value-weighting-4/dev-material.json` and `dev-labels.json` (36 cases, 12 opposite pairs;
  labels written blind; `character: true` marks cases whose label rests on what the act says about the other).
- Extra dev, encouraged: v3's 88 labelled cases (`corpus/experiments/value-weighting-3/{dev,heldout}-{material,labels}.json`)
  and their logged Jev answers under `corpus/runs/value-weighting-3/` (each line of `judgments.jsonl` holds every
  request's questions and answers, so any code-side weighting or gate can be rescored from the logs at no cost; the
  O2 rows of `*-heldout-final`, `*-heldout-secondary` and `*-dev-o2-final` carry the d4 nouls).
- The held-out split is not in the repository and must not be looked for. Don't open anything in /private/tmp other
  than files you create yourself.

## How to work

- Write only your module under `corpus/experiments/value-weighting-4/arms/` and scratch scripts under
  `corpus/runs/value-weighting-4/` (gitignored). Change nothing else.
- Run, from `corpus/experiments/value-weighting-4/`: `bun run.ts --material dev-material.json --tag dev-{MINE}-<name>
  --arms {MINE} --variants <id,id|all> --reps 2`, then `bun score.ts --calls <judgments.jsonl> --labels dev-labels.json`.
  The scorer compares B with C only when both arms are in the calls; with one arm it still prints M1 to M8.
- Keep a running tally of `costUsd` over your judgments files and stay under your budget.
- Wording must be general: per value or per channel; nothing names or special-cases a dev case, scenario, variant or
  a fact only a dev scenario holds.
- Tune on dev. Prefer the variant you'd bet on for new scenarios over the one that tops 36 dev cases by one; a pair
  count moves by 1 to 2 between splits on noise alone. Every knob you add needs a measured lift; say what it was.
- Name one `final` and up to 4 `contenders`, with a `band` per variant. Put a header comment in the module: the
  final's design (each step, state fields, each question and type, how the score combines them) and the docs/jev.md
  rules it leans on and bends.

## Reply with (under 400 words)

The final and contenders; the final's design in a few lines; the docs/jev.md rules it bends and why; dev scores (M1,
M3, M4, M5, neutral hits, false neutrals, M8, ρ all/build/detract, USD and requests per judgment) for the final and
each contender; total dev spend; what your arm still misses.
