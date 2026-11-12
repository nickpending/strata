## The job

You write arm G of the gate-first-e2e experiment in strata (/Users/rudy/development/projects/strata): design B with a
gate-first per-value stage in place of its 40 up and down nouls, everything after the per-value stage left as it is.
The question the experiment answers is how much of design B's case-level loss a better per-value gate recovers. You
write one module, `corpus/experiments/gate-first-e2e/arms/g.ts`, satisfying `contract.ts`, and optionally a second,
`arms/c.ts`.

## Read first

- `docs/jev.md`, in full. It governs every question.
- `corpus/experiments/gate-first-e2e/prereg.md` ("Arms" is your spec), `contract.ts`, `run.ts`, `arms/b.ts` (the
  baseline, and the source of the shared size step and touches noul: `strength4`, `TOUCHES`, `levelOf`).
- `corpus/experiments/gate-direction/report.md`, `arms/b.ts` (the gate-first shape you take), `arms/c.ts`, `arms/a.ts`.
- `corpus/experiments/value-weighting-4/report.md` and `arms/b.ts`.
- The dev split: `corpus/experiments/gate-first-e2e/dev-material.json` and `dev-labels.json`. Build and print it with
  `bun corpus/experiments/size-judgment/build.ts <material>`.

Never open `corpus/experiments/gate-first-e2e/heldout-*`, `labels2*`, or anything outside the repository.

## Arm G, as the prereg fixes it

- **The per-value stage is gate-direction's arm B, wording unchanged:** a gate noul per value and channel (`touched`,
  `main`, or both read as the lower), then a chained direction choice for each item whose gate reaches the threshold.
  Its reading r is the gate probability signed by the pick, 0 below the threshold. Import gate-direction B's variant
  `judge` functions where you can; where a threshold you want isn't exported, copy the code character for character
  and change only the threshold.
- **Then the size step:** for every item with r ≠ 0, v3's strength score (`arms/b.ts` `strength4`) on the statement of
  the picked direction (`up` when r > 0), chained after the direction step, in one request named `how`. L = `levelOf`
  its answer (1, 2 or 3). effect = r × L.
- **Touches:** `arms/b.ts` `TOUCHES`, asked as its own request named `touches` on the same state (it may run in
  parallel with the gate request).
- **The combine is the contract's,** not yours. You don't choose weights, a band or a touches threshold.

Your knobs: which gate (touched, main, both) and the threshold, from gate-direction B's dev-tuned set (`mg3-45`,
`m3-45`, `g3-40`, `mg3-50`) or thresholds between 0.35 and 0.55 on those gates. Choose the final by dev E3 (pooled
case ρ, scored with linear weights), ties within 0.02 going to fewer questions per judgment. Report E1, E2, E4 and the
per-value P1 and P2 too. Name up to 3 contenders. At most 10 variants.

**Optional arm C.** gate-direction's C final (`cw3-z50`, concrete one-sided statements, P(up) − P(down) zeroed under
0.5) as the per-value stage, with the same size step (on v3's statement of the sign's direction), touches and
combine. Write it only if your dev data argues that it adds something G doesn't (say what, in numbers); otherwise
leave it out and say why in g.ts's header.

No question, weight or threshold may name or special-case a dev case, scenario or a fact only a dev scenario holds.

## Measuring

Run on dev with `bun corpus/experiments/gate-first-e2e/run.ts --material
corpus/experiments/gate-first-e2e/dev-material.json --tag dev-<name> --arms <g|c|b> --variants <...> --reps 2`, and
score with `bun corpus/experiments/gate-first-e2e/score.ts --calls <judgments.jsonl> --material
corpus/experiments/gate-first-e2e/dev-material.json --labels corpus/experiments/gate-first-e2e/dev-labels.json`. A dev
run of arm B already exists at `{BDEV}`; score your runs beside it rather than rerunning B. Total dev spend at most
**0.40 USD**; the runner prints spend per run. Keep a running total and stop before the cap.

## The module's header

As `../gate-direction/arms/b.ts` does: the state and every question in outline (or where it is imported from), how
code turns answers into r and effect, the dev numbers that chose the final and each contender (E1, E2, E3, E4 build
and detract, P1, P2, questions and USD per judgment), the docs/jev.md rules it leans on, and the rules it bends with
the reason. Typecheck it: `bun node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --target esnext
--module esnext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --types bun-types
--noUncheckedIndexedAccess corpus/experiments/gate-first-e2e/arms/*.ts` (ignore errors about `values.toml`).

## Reply with

The final and contenders, one line of what each asks, and their dev E1 / E2 / E3 / E4 / P1 / P2; whether you wrote
arm C and why; the dev spend total. Under 300 words.
