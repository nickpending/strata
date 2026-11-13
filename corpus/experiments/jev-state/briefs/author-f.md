## The job

You write arm F of the jev-state experiment in strata (/Users/rudy/development/projects/strata). Arm F is design B's
per-value stage with **the questions fixed and the state filtered**: each question, or each group of questions, gets a
state that holds only what that judgment turns on. The experiment asks whether state construction, not the
questions, is where design B loses. You write `corpus/experiments/jev-state/arms/f.ts`, satisfying `contract.ts`
(`StateArmModule`, arm `"F"`).

## Read first

- `docs/jev.md`, in full, and especially "Building state". It governs every state and every question.
- `corpus/experiments/jev-state/prereg.md` ("Arms" is your spec: what every arm keeps and what it may change),
  `contract.ts`, `build.ts` (the `TypedCase` you receive: `copy`, `historyCopies`, `names`, `world`, plus every
  BuiltCase field), `run.ts`, `arms/b.ts`.
- `corpus/experiments/gate-first-e2e/arms/b.ts` (B's ask, which you keep: `strength4`, `TOUCHES`, `levelOf`, `key4`,
  `ASK_STRENGTH_FROM` 0.4, `STAKE_LEVELS`, `DEED_LEVELS`) and `corpus/experiments/gate-direction/arms/a.ts`
  (`statement`, `READ`, `stateOf`).
- `corpus/experiments/gate-first-e2e/report.md` and `corpus/experiments/gate-direction/report.md`.
- `src/engine/events.ts`, for what each subkind's payload holds.
- The dev split: `corpus/experiments/jev-state/dev-material.json` and `dev-labels.json`. Print it with
  `bun corpus/experiments/size-judgment/build.ts <material>`. Inspect typed cases with `buildTyped` from `build.ts`.

Never open `corpus/experiments/jev-state/heldout-*`, `labels2*`, `arms/s.ts`, `arms/k.ts`, `briefs/author-s.md`, or
anything outside the repository.

## Arm F, as the prereg fixes it

- **Kept, word for word:** the 40 statements (`statement(v.id, other, ch, d)`) as nouls, the touches noul's words
  (you may rename the fields it points at), the strength score at 0.4 with its levels and instruction form, chained
  over the same state its noul was asked over, and the readings (r = P(up) − P(down), effect = P(up)·L(up) −
  P(down)·L(down), touches = P(touches)). Import them; don't retype.
- **Yours: which state each question sees, and the preamble that names its fields.**
  - Group the questions however the judgments divide. One option is deed questions (what the other did) apart from
    stake questions (what it does to the holder), and within stake, by value or by value group. Each group's state
    holds only the fields its judgment turns on.
  - A deed group may need the event and little else.
  - A stake group about safety needs the holder's facts about danger, debts and threats, and probably not their
    pleasures.
  - Shape each state as the guidance says: typed fields where the engine data is typed, the event's words as text,
    named fields, and the preamble pointing at them with backticked paths.
- **Where the selection comes from is your design.**
  - You may write each person's identity once as typed facts, keyed by person id. Each person has one identity, the
    same in every set. Tag each fact with the values or groups it bears on. Every fact carries, in a comment, the
    sentence it comes from, and states nothing that sentence doesn't. Each tag is justified from the fact's own
    words, never from a label.
  - Or select with relevance nouls (docs/jev.md, "Filtering and gating") in an earlier request, chained. A
    relevance noul's answer may only decide what a later state holds, never enter a reading.
  - History may be filtered too, for example to the lines with the other or the lines a group needs.
- **Only B's information.** Nothing an F state holds may come from outside the TypedCase's B fields (event, history,
  identity, role) and the names and world descriptions in `names` and `world`. The holder's known facts
  (`knowledge`, `encounters`) are another arm's question. Leave them out.

Your knobs: the grouping, each group's state, the preambles, the selection method. At most 8 variants. Choose the
final by dev E3 (pooled case ρ, linear weights). Ties within 0.02 go to the cheaper variant. Report E1, E2, E4, P1
and P2 too. Name at most 1 contender. The final must cost at most 8e-4 USD per judgment and take at most 6 requests
in sequence. Parallel requests are fine.

Nothing may name or special-case a dev case, scenario or variant, or a fact only a dev scenario holds.

## Measuring

Run on dev:

```
bun corpus/experiments/jev-state/run.ts --material corpus/experiments/jev-state/dev-material.json --tag dev-f-<name> --arms f --variants <ids> --reps 2
```

Score:

```
bun corpus/experiments/jev-state/score.ts --calls <judgments.jsonl>[,{BDEV}] --material corpus/experiments/jev-state/dev-material.json --labels corpus/experiments/jev-state/dev-labels.json
```

B's dev run is `{BDEV}`; score beside it rather than rerunning B. Each request needs a step name unique within the
judgment. Total dev spend is at most **0.40 USD**. The runner prints spend per run. Keep a running total and stop
before the cap. Look at what Jev got wrong on dev, item by item: the per-value misses tell you which facts a group
needed and didn't see, and which ones distracted it.

## The module's header

Write it as `../gate-first-e2e/arms/g.ts` does:
- the groups and each group's state, in outline, with one rendered example;
- the preambles;
- what is imported unchanged;
- the identity facts' sources and tags, or the relevance nouls;
- the dev numbers that chose the final and the contender: E1, E2, E3, E4 build and detract, P1, P2, requests,
  questions and USD per judgment;
- the docs/jev.md rules and "Building state" points it leans on, and any it bends, with the reason.

Typecheck:

```
bun node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --target esnext --module esnext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --types bun-types --noUncheckedIndexedAccess corpus/experiments/jev-state/arms/*.ts
```

Ignore errors about `values.toml`.

## Reply with

Under 300 words:
- the final and the contender, one line of how each groups the questions and what each state holds, and their dev
  E1 / E2 / E3 / E4 / P1 / P2 against B's;
- the dev spend total.
