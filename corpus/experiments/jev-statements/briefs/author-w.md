## The job

You write arm W of the jev-statements experiment in strata (/Users/rudy/development/projects/strata). Arm W is design
B's per-value stage with **its 40 statements rewritten and everything else held**: the state, the preamble, the
touches noul, the size step and the readings. The experiment asks whether the statements are where design B loses its
per-value reading. You write `corpus/experiments/jev-statements/arms/w.ts`, satisfying `contract.ts`
(`StatementArmModule`, arm `"W"`).

## Read first

- `docs/jev.md`, in full. Rules 1, 2, 3 and 8 govern every statement. Rule 3 matters most: no indirection, and the
  question should point at what is visible.
- `corpus/experiments/jev-statements/prereg.md` ("Arms" is your spec, "Tuning" your limits), `contract.ts`, `ask.ts`,
  `arms/b.ts`, `run.ts`, `check-arms.ts`.
- `corpus/experiments/gate-direction/arms/a.ts`: B's statements (`S`), `READ` and `stateOf`. Every statement is asked
  as `${READ} ${statement}`, over B's state.
- `corpus/experiments/gate-first-e2e/arms/b.ts`: the strength score your statement is quoted into
  (`Asked: "<statement>" If so, how big is it?` for stake, `... how plainly does \`now\` show it?` for deed).
- `corpus/experiments/gate-direction/arms/c.ts`: an earlier rewording of all 40 (its `S3`). On gate-direction's
  held-out it lifted the item-level gate AUC from 0.74 to 0.84, read with a hard zero. It was never run through
  design B's combine. It is prior art you may start from or depart from, not a spec.
- The reports: `corpus/experiments/jev-state/report.md`, `gate-first-e2e/report.md` and `gate-direction/report.md`.
  Security and benevolence read worst in every arm so far.
- `world/` (every file) and `src/engine/rules.ts` and `events.ts`: what can actually happen and be seen in this world
  (the verbs, offers and their lapse, who receives what).
- The dev split: `corpus/experiments/jev-statements/dev-material.json` and `dev-labels.json`. Print it with
  `bun corpus/experiments/size-judgment/build.ts <material>`.

Never open the held-out split (it isn't in the repository), any `labels2*` file, another experiment's labels or
material, or anything under `corpus/runs/` except your own runs and B's dev run `{BDEV}`.

## What W may change: the 40 statements, nothing else

Write each variant as a statement table `(value, other, channel, direction) => string` and its judge as
`judgeWith(table)` from `../ask.ts`. Export each variant as `{ id, statement: table, judge: judgeWith(table) }`.

- **Keep each channel's meaning.** Stake asks whether the event advanced (up) or set back (down) the holder's own
  share of the value, from the holder's side. Deed asks whether the other, in this act, acted for (up) or against
  (down) the value. Yes means the statement holds (rule 8). Up and down stay separate questions.
- **Point at the concrete, visible thing the judgment turns on in strata's world,** rather than the Schwartz
  description. That means who did what to whom in `now` and `earlier`, and what it does to the holder's situation as
  `who_you_are` states it. For example, security, stake down: "Does what {o} did bring people who could hurt you
  closer to you, or put you at risk of harm, arrest, or losing your place?"
- **Rewrite every value,** not only security and benevolence. Those two are the measured worst, so report them per
  value.
- **Stay within docs/jev.md:**
  - literal, one judgment, no double negatives, no property of a property;
  - a list of instances of one judgment is fine, as B's and C's statements have;
  - a boundary clause ("Answer no if ...") is allowed (rule 2);
  - you may name B's state fields in backticks (`now`, `earlier`, `who_you_are`, `your_part`, `you`).
- **Generic to any holder.** A statement must hold for any holder and other in strata's world. It may name no
  person, room or item (`check-arms.ts` fails on them), and no fact that only one identity or a dev scenario holds,
  such as a named hunter, a particular debt or a particular deal. The table receives only the value, the other's
  name, the channel and the direction.
- **Nothing else changes.** `check-arms.ts` fails on any difference from B's requests other than the statements.

Limits:
- At most 8 variants, each a complete table of 40.
- Dev spend at most **0.40 USD** in all. The runner prints spend per run; keep a running total and stop before the
  cap.
- The final costs at most 5e-4 USD per judgment. Name at most 1 contender.
- **Choose the final by dev P1** (gate AUC, all items, both channels). Within 0.01 of the best, the higher dev E3
  (linear) wins. Don't tune for squared weighting; the experiment reads it from your final's answers.
- Nothing may name or special-case a dev case, scenario or variant.

Look at what Jev got wrong on dev, item by item. The per-value misses show which statements fire on untouched items,
and which miss touched ones.

## Measuring

```
bun corpus/experiments/jev-statements/run.ts --material corpus/experiments/jev-statements/dev-material.json --tag dev-w-<name> --arms w --variants <ids> --reps 2
bun corpus/experiments/jev-statements/score.ts --calls <judgments.jsonl>,{BDEV} --material corpus/experiments/jev-statements/dev-material.json --labels corpus/experiments/jev-statements/dev-labels.json
bun corpus/experiments/jev-statements/check-arms.ts corpus/experiments/jev-statements/dev-material.json w:<id>,w:<id>
```

Score beside B's dev run rather than rerunning B.

## The module's header

Write it as `../gate-direction/arms/c.ts` does:
- what is imported unchanged (everything but the statements);
- the final's statements in outline, with security and benevolence in full;
- each variant tried, what changed, and its dev E1, E2, E3, E4 build and detract, P1, P2, and P1 and direction
  among fired for security and benevolence, against B's on the same dev;
- the requests, questions and USD per judgment;
- the docs/jev.md rules it leans on, and any it bends, with the reason.

Typecheck:

```
bun node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --target esnext --module esnext --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --types bun-types --noUncheckedIndexedAccess corpus/experiments/jev-statements/arms/*.ts
```

Ignore errors about `values.toml`.

## Reply with

Under 300 words:
- the final and the contender, one line on how each rewrites the statements;
- their dev E1 / E2 / E3 / E4 / P1 / P2 against B's, and security's and benevolence's P1 against B's;
- the dev spend total.
