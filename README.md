# strata

A layered, event-driven world engine for living NPCs.

strata builds NPCs from the bottom up. One record of what happened, the event log, is the backbone. Each thing in the world is a bundle of small parts that change only through events. Every layer runs and can be played on its own, from one local web page, before the next layer is built on top of it. Typed data carries the facts, and prose is for voice only: code never decides anything by reading prose.

It grew out of an earlier project, where every change to NPC behaviour cascaded through hand-wired code paths. The reasoning behind the design is in [docs/explorations/strata-layered-world-engine.md](docs/explorations/strata-layered-world-engine.md).

## What exists

- **The world engine.** Two rooms, three NPCs (Rogue, Glitch and Mux) and three items, defined in `world/`. People move between rooms, speak (say, say to someone, whisper) and give items by offer and accept. A clock steps the world in ticks. Each event reaches only the people who could witness it, and secret fields, such as a whisper's words, are stripped from bystanders' copies.
- **Pending states.** A multi-step action, such as an offer waiting for an answer, is a typed thing the engine reports: who must resolve it, with which verbs, and by when.
- **Knowledge.** Each NPC knows facts as of the tick it learned them, from its authored starting places and ties and from what it experiences: where people are, and who holds which item. A known fact can go stale, but is never false.
- **Encounters.** Each NPC's record of what has passed between it and each other person, as a direct participant or a bystander.
- **The bench.** A local web page for driving the world by hand and watching every part of it.
- **A fuzzer.** It drives random legal actions, then checks that replaying the event log rebuilds the same state, and that every invariant holds.
- **A browser harness.** It drives the bench page toward a plain-language instruction through a real browser. A language model turns the instruction into a typed plan, and Jev, a decision model, picks the controls. Code checks whether the goal was reached.

Relationships are being explored now: [docs/explorations/npc-relationships.md](docs/explorations/npc-relationships.md).

## Requirements

- [Bun](https://bun.sh) 1.4 or later.
- For the harness only: Chromium for Playwright (`bunx playwright install chromium`) and an [OpenRouter](https://openrouter.ai) key.

## Running it

```sh
bun install

# The bench, at http://127.0.0.1:4800. The tick length (in game minutes) is required.
bun run start --tick-minutes 10

# The fuzzer: 400 random actions from seed 7, with every check run.
bun run driver --seed 7 --actions 400 --tick-minutes 10

# The harness: drive the bench toward one instruction. --headed shows the browser and waits for
# Enter before each action, and once more before closing.
bun run harness "have Mux say something funny" --tick-minutes 10 --headed

# Score a goal set by the end states it expects.
bun run score --goals corpus/goals/blind-1.json --tick-minutes 10

# Checks: typecheck, lint and tests.
bun run verify
```

The harness writes each run's files under `corpus/runs/`, which is kept out of git.

## Keys

The harness reads its OpenRouter key from the `OPENROUTER_API_KEY` environment variable:

```sh
export OPENROUTER_API_KEY=sk-or-...
```

A key can also come from [apiconf](https://www.npmjs.com/package/@voidwire/apiconf) by name, with `--key-name <name>`. A key is never taken on the command line, and is sent only over https or to this machine. Nothing in this repository holds a key.

The models it calls:
- `z-ai/glm-5.3-flash`, pinned to the Z.AI provider, for the plan and the words. `--model` picks another.
- `typesafe/jev-1.13` for decisions.

A run of the four goal sets (44 goals) costs about five cents.

## Layout

| Path | What it holds |
|---|---|
| `src/engine/` | The engine: definitions, things and parts, events and their registry, rules, clock, store, snapshot, pending states, knowledge, encounters |
| `src/server/` | The bench's HTTP server and routes |
| `src/driver/` | The fuzzer |
| `src/adapter/` | strata's side of the harness: hosting a bench for it |
| `harness/` | The browser harness, its own package with no path into the engine; it reads everything over the bench's routes |
| `bench/` | The bench page |
| `world/` | The authored world definitions, in TOML |
| `corpus/goals/` | Goal sets, and their committed scores |
| `corpus/experiments/` | The summaries of model comparisons and experiments |
| `docs/explorations/` | Design explorations: what was considered, rejected and chosen |
| `docs/work/` | The design, work order and evidence of each built piece |
| `tests/` | The tests |

## How it is built

strata is built with Claude Code, through a shape-then-build workflow. Each piece is explored in conversation, shaped into a design and a work order with testable criteria, built, reviewed, and then walked by a person before it closes. `docs/work/` holds those records.

## A note on history

Earlier commits contain the author's local checkout path (`/Users/...`) inside committed run logs and a few experiment tools. Run logs are no longer committed, and the current tree has no such paths. The old ones were left in history knowingly, because they are harmless.
