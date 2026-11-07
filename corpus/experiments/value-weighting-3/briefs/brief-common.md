## The experiment
strata (/Users/rudy/development/projects/strata) is a text world engine whose NPCs will judge each encounter through their own values. The open design question: when an encounter touches an NPC's values, is the NPC's per-value importance applied by Jev (arm O1) or by code (arm O2)? Two earlier runs decided nothing because Jev was misused: bare importance numbers, one five-way choice read by its expectation, two-hop interpretation questions, one large state sent to every question. This run builds each arm at its best under docs/jev.md, with a separate author per arm. You author one arm. The other arm's author is building the competitor; make yours the strongest it can honestly be. The operator's standard, verbatim: "experiments must always try to model final state reality not fucking strawman peices of shit". Chained requests, where one answer feeds the state of the next, are fine.

## Read first, in full, before designing
1. `docs/jev.md`: the governing reference. Every question you write follows it; if your design bends a rule, say which and why.
2. `docs/explorations/bench-automation.md`, journey items 3 and 6: reverie's touches-plus-change nouls held 30 of 32 blind moments (wording: touches = "Does what just happened touch you personally: your safety, your secrets, your people, or something you want?", change = "Does what just happened give you a real reason to do something different right now?", rule touches ≥ 0.80 and change ≥ 0.55).
3. `docs/explorations/npc-relationships.md`, journey items 14 to 17: what is being judged (build or detract, from the NPC's own point of view).
4. `corpus/experiments/value-weighting-3/prereg.md`: the rules your arm must keep, the metrics and the comparison. Pay attention to "The arms".
5. `corpus/experiments/value-weighting-2/report.md`: what failed last time and why. You may read `corpus/experiments/value-weighting-2/arms/*.ts` as examples of what did not work.
6. `corpus/experiments/value-weighting-3/contract.ts`, `jev3.ts` (the client: noul, choice and score; state is a JSON object), `run.ts`, `score.ts`, `catalogue.json`; `corpus/experiments/value-weighting-2/build.ts` and `render.ts` (how a case is built and what a `BuiltCase` holds).
7. TypeSafe's own docs with WebFetch: https://docs.typesafe.ai/model-jaggedness/jev-1.13, /primitives, /primitives/noul, /primitives/choice, /primitives/score, /concepts/state, /patterns/composite-scoring.

## Material
- Dev split: `corpus/experiments/value-weighting-3/dev-material.json` and `dev-labels.json` (44 cases, 14 opposite pairs). Labels were written blind by someone who knows nothing of either arm.
- Extra dev, optional: `corpus/experiments/value-weighting-2/dev-material.json` + `dev-labels.json` and `heldout-material.json` + `heldout-labels.json` (64 older cases, a different labeller and different variants). Use them to check you are not overfitting the 44.
- The held-out split is not in the repository and must not be looked for. Don't open anything in /private/tmp other than files you create yourself.
- Never open `corpus/experiments/value-weighting-3/arms/{OTHER}.ts`.

## How to work
- Write only `corpus/experiments/value-weighting-3/arms/{MINE}.ts` (default export satisfying `{MODULE}` in contract.ts). Don't change contract.ts, jev3.ts, run.ts, score.ts, catalogue.json or any material.
- Run: from `corpus/experiments/value-weighting-3/`, `bun run.ts --material dev-material.json --tag dev-{MINE}-<name> --arms {MINE} --variants <id,id|all> --reps 2`, then `bun score.ts --calls <judgments.jsonl> --labels dev-labels.json`. Raw runs land in `corpus/runs/value-weighting-3/` (gitignored). Use `--only` for quick probes.
- Budget: at most 12 variants in the final module and at most 0.60 USD of dev calls in total (sum `costUsd` over your judgments.jsonl files and keep a running tally). A 3-question request costs about 2e-5 USD; state size drives cost.
- Wording must be general: per-value or per-event-kind wording is fine; nothing may name or special-case a dev case, scenario, variant or a fact only a dev scenario contains. The held-out cases are new scenarios with new variants of the same three people.
- Tune on dev only. Prefer the variant you'd bet on for new scenarios over the one that tops 44 dev cases by one; v2's finals each lost pairs on held-out.
- Name one `final` and up to 4 `contenders` in the module, with a `band` per variant.
- Put a header comment in the module: the design of the final (each step, its state fields, each question and its type, how the score combines them) and the docs/jev.md rules each part leans on.

## Reply with
The final and contenders; the final's design in a few lines; a table of which docs/jev.md rules (1 to 10 and the measured shapes) the final leans on and any it bends, with why; dev scores (M1, M3, M5, ρ, neutral hits, USD per judgment, requests and questions per judgment) for the final and each contender; total dev spend; and what kind of case your arm still misses.
