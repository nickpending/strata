## The experiment

strata (/Users/rudy/development/projects/strata) is a text world engine whose NPCs judge each encounter per value
(design B): Jev decides whether the encounter advanced or set back the NPC's stake in a value, then a chained `how`
score judges its size, and code weights by importance. End to end, B's size agreement was weak, so this run isolates
the size step: **given the right value and the right direction, can Jev judge how far an encounter moved that value
for its holder, from the holder's side?** You author the arms. The operator's standard, verbatim: "experiments must
always try to model final state reality not fucking strawman peices of shit". Make every arm the strongest it
honestly can be.

## Read first, in full, before designing

1. `docs/jev.md`: the governing reference. Every question follows it; name any rule an arm bends and why. Rule 6
   especially: each arm reads a score by its most probable level only (`contract.ts` `mostProbable`).
2. `corpus/experiments/size-judgment/prereg.md`: the arms, the metrics and the comparison. Note "What size means"
   (size excludes how much the holder cares about the value; only the stake channel is tested).
3. `corpus/experiments/size-judgment/contract.ts`, `run.ts`, `build.ts`.
4. `corpus/experiments/value-weighting-4/report.md` and `arms/b.ts`; `corpus/experiments/value-weighting-3/report.md`
   and `arms/o2.ts` (the `how` step: `stateOf`, `READ`, `S[...].stake`, `STAKE_LEVELS`, `strength4`).
5. `docs/explorations/npc-relationships.md`, journey items 14 to 19.

## The arms (prereg "Arms")

- `arms/a.ts`, arm "A", **as is**: v3's `how` question for the given stake statement, verbatim: `stateOf`'s five
  fields, `READ`, `Asked: "<S[value](other).stake[direction]>" If so, how big is it?`, `STAKE_LEVELS`. One score
  question per item; all of a case's items may go in one request. Copy the wording character for character (v3's
  helpers are not exported); the orchestrator checks it by script against the logged v4 `how` questions. You choose
  only its `toLabel`, on dev. One variant, no contenders.
- `arms/b.ts`, arm "B": 4 or 5 levels, each described as a concrete situation.
- `arms/c.ts`, arm "C": level descriptions anchored per value (what each level means for security, for achievement,
  and so on), any number of levels you argue for.
- `arms/d.ts`, arm "D", optional: a chained or comparative form, only if you argue for it under docs/jev.md.
- Each module: one `final`, up to 3 `contenders`, a `toLabel` per variant (the 1 to 5 size each level stands for,
  chosen on dev). Nothing an arm sends Jev may carry an importance or a label.

## Material

- Dev: `corpus/experiments/size-judgment/dev-material.json` and `dev-labels.json`. Each case's `touched` gives the
  items; labels give each item's size 1 to 5 (written blind) and the size pairs (same holder, value, direction and
  kind of event, sizes at least 2 apart).
- v4's logged `how` answers under `corpus/runs/value-weighting-4/*/judgments.jsonl` show how the current wording
  behaves (no size labels there).
- The held-out split is not in the repository and must not be looked for. Do not open anything under
  `/private/tmp` or any `briefs/labeller*.md`.

## How to work

- Write only `arms/*.ts` and scratch scripts under `corpus/runs/size-judgment/` (gitignored). Change nothing else.
- Run, from the repository root: `bun corpus/experiments/size-judgment/run.ts --material
  corpus/experiments/size-judgment/dev-material.json --tag dev-<name> --arms <a,b,...> --variants <id,id|all>
  --reps 2`. There is no scorer for you; compute dev Spearman ρ (pooled, within up and down), size-pair ordering
  and exact-or-adjacent accuracy yourself in a scratch script from `judgments.jsonl` and `dev-labels.json`.
- Budget: 0.30 USD of Jev spend in total; keep a running tally of `costUsd`.
- Wording must be general: per value, per direction or per level; nothing names or special-cases a dev case,
  scenario, or a fact only a dev scenario holds.
- Tune on dev. Prefer what you'd bet on for new scenarios over what tops dev by one item. Every knob needs a measured
  lift; say what it was.
- Each module gets a header comment: the final's design (state fields, each question, its levels, how the level is
  read, `toLabel`), the docs/jev.md rules it leans on and bends, and the contenders.
- Check every module with: `bun node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --target esnext
  --module esnext --moduleResolution bundler --allowImportingTsExtensions --types bun-types --skipLibCheck
  corpus/experiments/size-judgment/arms/<m>.ts`.

## Reply with (under 450 words)

Per module: final, contenders, the final's design in a few lines, the rules it bends and why; dev scores (pooled ρ,
ρ up / down, pairs ordered / tied / reversed, exact-or-adjacent, USD and requests per judgment) for each final and
contender; whether you wrote D and why; total dev spend; what the arms still miss.
