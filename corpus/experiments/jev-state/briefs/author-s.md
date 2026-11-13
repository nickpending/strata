## The job

You write arm S of the jev-state experiment in strata (/Users/rudy/development/projects/strata). Arm S is design B's
per-value stage with **the questions fixed and the state rebuilt as structured, typed data**. You may also write
optional arm K: S plus the holder's known facts. The experiment asks whether state construction, not the questions,
is where design B loses. You write `corpus/experiments/jev-state/arms/s.ts` and optionally `arms/k.ts`, each
satisfying `contract.ts` (`StateArmModule`, arm `"S"` or `"K"`).

## Read first

- `docs/jev.md`, in full, and especially "Building state". It governs every state and every question.
- `corpus/experiments/jev-state/prereg.md` ("Arms" is your spec: what every arm keeps and what it may change),
  `contract.ts`, `build.ts` (the `TypedCase` you receive: `copy`, `historyCopies`, `knowledge`, `encounters`, `names`,
  `world`, plus every BuiltCase field), `run.ts`, `arms/b.ts`.
- `corpus/experiments/gate-first-e2e/arms/b.ts` (B's ask, which you keep: `strength4`, `TOUCHES`, `levelOf`, `key4`,
  `ASK_STRENGTH_FROM` 0.4, `STAKE_LEVELS`, `DEED_LEVELS`) and `corpus/experiments/gate-direction/arms/a.ts`
  (`statement`, `READ`, `stateOf`).
- `corpus/experiments/gate-first-e2e/report.md` and `corpus/experiments/gate-direction/report.md`.
- `src/engine/events.ts` (what each subkind's payload holds), `src/engine/knowledge.ts`.
- The dev split: `corpus/experiments/jev-state/dev-material.json` and `dev-labels.json`. Print it with
  `bun corpus/experiments/size-judgment/build.ts <material>`. Inspect typed cases with `buildTyped` from `build.ts`.

Never open `corpus/experiments/jev-state/heldout-*`, `labels2*`, `arms/f.ts`, `briefs/author-f.md`, or anything
outside the repository.

## Arm S, as the prereg fixes it

- **Kept, word for word:** the 40 statements (`statement(v.id, other, ch, d)`) as nouls, the touches noul's words
  (you may rename the fields it points at), the chained strength score at 0.4 with its levels and instruction form,
  and the readings (r = P(up) − P(down), effect = P(up)·L(up) − P(down)·L(down), touches = P(touches)). Import them;
  don't retype.
- **Yours: the state and the preamble.** One state for the `gate` request and the chained `how`, as B does. Build it
  from the TypedCase:
  - The event is typed fields from `copy`: kind or subkind, actor, target(s), item, room, ids resolved through
    `names` (the holder is "you"). Its words go in as text where the event is speech. Say what a lapse or an offer
    window means in words, not as a tick number (rule 4).
  - The earlier events are in the same form, oldest first, and you decide how many.
  - The identity is typed facts where the prose states them. Debts, who shelters whom, what the holder holds, what
    they fear and who threatens them become fields.
  - The role is a field.
  - Field names should match how the preamble names them. The preamble (B's `READ`) points at the fields with
    backticked paths. You may vary the preamble by channel (stake or deed), since the 40 statements are fixed but
    what they turn on differs.
- **Typed identity facts.** Each person has one identity, the same in every set (`dev-material.json` `identities`).
  Write each person's facts once, in the module, keyed by person id. Every fact carries, in a comment, the sentence
  it comes from, and states nothing that sentence doesn't. No fact may come from a case, a label or a scenario.
- **No added questions** in S. Nothing an S state holds may come from outside the TypedCase's B fields (event,
  history, identity, role) and the names and world descriptions in `names` and `world`.

**Optional arm K:** S's final, with the holder's known facts added as typed fields:
- `knowledge.facts`: who holds which item, where people are, as of the target;
- `knowledge.people`;
- `encounters`;
- `world.ties`.

Pick what bears on the judgment, and point the preamble at it. Write K only if your dev numbers argue it adds
something S doesn't (say what, in numbers). Otherwise leave it out and say why in s.ts's header.

Your knobs: the state's shape and contents, the preamble, the identity facts. At most 8 variants in all, including
K. Choose S's final by dev E3 (pooled case ρ, linear weights). Ties within 0.02 go to the cheaper variant. Report E1,
E2, E4, P1 and P2 too. Name at most 1 contender. The final must cost at most 8e-4 USD per judgment.

Nothing may name or special-case a dev case, scenario or variant, or a fact only a dev scenario holds.

## Measuring

Run on dev:

```
bun corpus/experiments/jev-state/run.ts --material corpus/experiments/jev-state/dev-material.json --tag dev-s-<name> --arms s --variants <ids> --reps 2
```

Score:

```
bun corpus/experiments/jev-state/score.ts --calls <judgments.jsonl>[,{BDEV}] --material corpus/experiments/jev-state/dev-material.json --labels corpus/experiments/jev-state/dev-labels.json
```

B's dev run is `{BDEV}`; score beside it rather than rerunning B. Total dev spend is at most **0.40 USD**. The
runner prints spend per run. Keep a running total and stop before the cap. Look at what Jev got wrong on dev, item by
item: the per-value misses tell you which facts a question needed and didn't see.

## The module's header

Write it as `../gate-first-e2e/arms/g.ts` does:
- the state, in outline, with one rendered example;
- the preamble(s);
- what is imported unchanged;
- the identity facts' sources;
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
- the final and the contender, one line of what each state holds, and their dev E1 / E2 / E3 / E4 / P1 / P2 against
  B's;
- whether you wrote K, and why;
- the dev spend total.
