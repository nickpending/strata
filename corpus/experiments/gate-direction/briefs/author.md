## The job

You write the arms of the gate-direction experiment in strata (/Users/rudy/development/projects/strata). It isolates
one stage of design B, the way NPCs read an encounter against their values: **per value and per channel, did the
encounter touch the value for the holder, and which way?** Channels: `stake`, the encounter advanced (up) or set
back (down) the holder's own share of the value; `deed`, the other, in this act, acted for (up) or against (down) the
value. You write three modules in `corpus/experiments/gate-direction/arms/`, each satisfying `contract.ts`.

## Read first

- `docs/jev.md`, in full. It governs every question you write.
- `corpus/experiments/gate-direction/prereg.md`, `contract.ts`, `run.ts`, and `report.md` (step 1: why this stage).
- `corpus/experiments/value-weighting-3/arms/o2.ts` (design B's questions, family `d4`),
  `corpus/experiments/value-weighting-4/report.md` and `arms/b.ts`, and `corpus/experiments/size-judgment/report.md`
  and `arms/` (how an arm module and its header are written).
- The dev split: `corpus/experiments/gate-direction/dev-material.json` and `dev-labels.json`. Build and print it with
  `bun corpus/experiments/size-judgment/build.ts <material>`.
- You may read v4's logged answers under `corpus/runs/value-weighting-4/` (step 1 used them).

Never open `corpus/experiments/gate-direction/heldout-*`, `labels2*`, or anything outside the repository.

## The three modules

1. **`arms/a.ts`, arm A, one variant `as-is`, final, no contenders.** Design B's gate request, ported from
   `../value-weighting-3/arms/o2.ts` character for character: its `stateOf`, `READ` and the per-value statements `S`
   for both channels and both directions, 40 nouls, `${READ} ${statement}`, in one request named `gate` on the same
   five-field state. Drop the touches noul and the `how` step. Reading = P(up) − P(down) per item. Copy, don't
   retype; the orchestrator checks every question's text against v4's logged requests.
2. **`arms/b.ts` and `arms/c.ts`, arms B and C: two challengers**, each a different idea about how to ask this stage
   better, under docs/jev.md. Start from what step 1 found: the up and down nouls both fire on most cases, and they
   lean up whatever happened; on the holder's least-cared-about values they carry no signal; and the misses are
   misreads with the facts in the state (what an act exposes the holder to, what it says about the other).
   - Candidate directions, not orders: gate first, then direction (a per-value touched noul, then a direction
     question chained only for what fired); a smaller state per question (rule 7); literal questions about what the
     act exposes the holder to; per-value concrete wording against the catalogue's descriptions.
   - B and C must differ from each other in idea, not only in wording details.
   - Up to 12 variants per module; name one `final` and up to 3 `contenders`. Readings may combine nouls as
     probabilities; a score or choice is read by its most probable level or option only (rule 6).
   - No question, weight or threshold may name or special-case a dev case, scenario or a fact only a dev scenario
     holds. Wording is per value or per channel.

## Measuring

Run on dev with `bun corpus/experiments/gate-direction/run.ts --material
corpus/experiments/gate-direction/dev-material.json --tag dev-<name> --arms <a|b|c> --variants <...> --reps 2`, and
score with `bun corpus/experiments/gate-direction/score.ts --calls <judgments.jsonl> --labels
corpus/experiments/gate-direction/dev-labels.json`. Choose each final by measured dev lift on M1 (item ρ), and report
M2 and M3. Total dev spend at most **0.40 USD**; the runner prints spend per run. Keep a running total and stop
before the cap.

## Each module's header

As `../size-judgment/arms/*.ts` do: the state and every question's wording in outline, how code turns answers into a
reading, the dev numbers that chose the final and each contender (M1, M2, M3, per channel), the docs/jev.md rules it
leans on, and the rules it bends with the reason.

## Reply with

Per module: the final and contenders, one line of what each asks, and the dev M1 / M2 / M3; the dev spend total.
Under 300 words.
