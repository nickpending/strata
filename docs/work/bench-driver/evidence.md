---
type: work-note
date: 2026-10-31
title: "bench-driver post-merge walks"
description: "What the C9 blind walks showed on the merged player: blind-1 failed at 10 of 12, the fix shipped as the pending-states work order, and a fresh blind-2 reached 12 of 13 at the unchanged thresholds."
purpose: "The record of bench-driver's post-merge walks, read by whoever next touches the player's rule, its goal sets or its scoring."
producer: assistant
---

# Evidence: bench-driver

## C9 walk, first run: blind-1 on 6deefe2, failed

The blind set `corpus/goals/blind-1.json` was written after job 1 merged, by an agent that was not the rule's
author, and scored on main with the real endpoints at tick length 10. Score: `corpus/goals/blind-1.score.json`
at 6deefe2.

Result: reached held 10 of 12 (0.83), below the 9-in-10 bar. The two misses were stimpak-to-rogue and
shard-to-glitch, both ending at the 24-loop ceiling. In each run the offer was made, then the player pressed Step
twice while the offer stood. The offer lapsed at tick 2 (`exchange.lapse`, e4 in the run's `events.jsonl`) and
the accept never landed. After that the actor flipped between glitch and rogue until the ceiling (runs
`2026-10-31T01-54-20-167Z` and `2026-10-31T01-54-32-384Z`). Total cost 0.0106 USD, 0 unreported.

## Why the fix is its own work order

The fix is a design change: multi-step actions become typed pending states that the engine exposes and the page
and the player read, and the model's target becomes a typed plan that code performs. The lane refuses an
amendment after a merge, so an amendment after a merge is a new work order. The change was shaped and built as
`pending-states` (cd700c7..c26eb21 on main). bench-driver's work order and design stay as its job was built
under them.

## C9 re-walk: fresh blind-2 on main, passed

The re-walk ran on main after pending-states merged (cd700c7..c26eb21). It used a fresh blind-2 set, written by
an agent that read neither `src/player/rule.ts` nor any earlier goal set or score. The thresholds were
unchanged: T_DONE 0.6, T_ACT 0.3, the pair the calibration set records.

Result: reached held 12 of 13 (0.92), at or above the 9-in-10 bar. Total cost 0.0099 USD, 0 unreported. The
set, its score and its 13 runs were committed at 4a48f97.

- Score: [corpus/goals/blind-2.score.json](../../../corpus/goals/blind-2.score.json)
- Write-up, with per-goal loops and the one miss: [docs/work/pending-states/c9-walk-2.md](../pending-states/c9-walk-2.md)

## C5 headed walk

The C5 walk, the headed browser run, is the operator's. He ran
`bun run src/player/main.ts "have Mux say something funny" --tick-minutes 10 --headed` on main.

Outcome, failed, in his words: "I ran it -- it did something but was too fast for me to see anything."

The run reached in 5 loops (`corpus/runs/2026-10-31T14-36-50-377Z`, committed with this note). Nothing paces a
headed run, so its loops cannot be watched. The pacing fix ships as its own work order, and the C5 re-walk will
be recorded here when it is given.

## C5 headed re-walk

The re-walk ran after harness-package's pacing fix (closed at bd3bd65, issue #5). Headed runs now hold on Enter
before each action and before the browser closes, and they exit cleanly. The player moved from src/player into
the harness package, so the C5 command `bun run src/player/main.ts "have Mux say something funny" --tick-minutes 10 --headed`
is now `bun run harness "have Mux say something funny" --tick-minutes 10 --headed`. The root `harness` script
runs `src/adapter/main.ts`, which hosts the bench over `world/` and hands it to the harness CLI.

The operator walked that command on main as harness-package's H4 walk. Outcome, passed, in his words: "passed".
The run is `corpus/runs/2026-11-01T19-22-29-696Z`, committed at 5454c84.

Each part of C5's then, checked against the run's files:

- Window on the hosted bench: `run.json` has `headed: true` and `url: null`, so the run drove a bench it hosted
  over `world/`. `benchFailures` is empty.
- Each loop printed: `loops.jsonl` holds five loops, each with its state, questions, answers and action. The
  actions are set actor to mux, set verb to say, type the words, and press Act. Loop 5 is `reached` at done 0.99.
- Mux's say in the history: `events.jsonl` holds e1, a `speech.say` by mux in back-room with the run's words,
  and `received.jsonl` holds mux's copy of it.
- Four files written: `run.json`, `loops.jsonl`, `events.jsonl` and `received.jsonl`.
