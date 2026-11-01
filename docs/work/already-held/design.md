---
type: design
date: 2026-11-01
title: "Design: already-held"
description: "A run whose typed end state already holds on the bench before it acts is refused with an outcome of its own, already-held, naming that end state, instead of ending reached having done nothing, so neither run.json, the labelled corpus nor a goal set's reached count can take a mistyped target for one the run carried out."
purpose: "The recorded design of the already-held work order, read by its plan and its builders."
producer: cli:shape
---

# Design: already-held

## Purpose

A run whose typed end state already holds on the bench before it acts is refused with an outcome of its own, already-held, naming that end state, instead of ending reached having done nothing, so neither run.json, the labelled corpus nor a goal set's reached count can take a mistyped target for one the run carried out.

## Form

One read of the end state before the run acts, at the point a checked target is already refused (harness/src/run.ts:565), and an outcome that records it.

1. The outcome (`harness/src/run.ts`, `Outcome` at run.ts:107-118). The union gains `{ kind: "already-held"; expect: EndState }`, `EndState` from goal.ts, the target's end state as the model typed it. Nothing else in RunRecord, LoopRecord or any corpus file changes shape.

2. The read (`play()` in run.ts). Right after the no-such-action branch (run.ts:565-568) and before the words call, the run reads `holds(target.expect, base)` once, the same code check every loop reads (run.ts:602, goal.ts holds), over the bench's routes. A failed read stops the run as `{ kind: "bench", call: "target" }`, the shape a failed `/api/verbs` read already has (run.ts:547-554). When it holds, the run prints `already held: <described(target.expect)>` and finishes `{ kind: "already-held", expect: target.expect }`, with no words call, no Jev call and no loop: `loops` is 0 and loops.jsonl stays empty. The model is never asked again. When it does not hold, the run goes on exactly as today; `decideLoop` (rule.ts:224) is unchanged, so every reached after this point is a holds that turned true after the run began acting. A headed run still holds before it closes the browser (the `finally` at run.ts:495-506, unchanged). The history is read back as for every run.

3. The command line (`harness/src/main.ts`). Unchanged: it exits 1 on every outcome but reached and prints the outcome as JSON (main.ts:50-58), so an already-held run exits 1 printing `harness: already-held: {"kind":"already-held","expect":...}`.

4. Scoring (`harness/src/score.ts`). The goal's score entry carries `outcome: "already-held"` as it carries every outcome kind (score.ts:167), and `run` leads to the run.json that names the end state. A goal's `held` is false when its run's outcome is already-held, whatever the probe of the goal file's expectation reads (score.ts:168-169 gains that one condition), so the set's `reached.held` never counts it, even when the goal file's own expectation is the state that already held. The sweep's `heldAt` is unchanged: such a run has no loops and its goal's held is false, so it is not held at any T_ACT, agreeing with the plain score. No score file field is added or renamed.

5. Tests (strata-side under tests/, where the real bench is, as harness-package placed them; and the package's own under harness/test/ where no bench is needed). The reproduction, in tests/player.test.ts: the run command, as the operator runs it, on a fresh hosted bench in a real browser, its model stand-in typing `holder(stimpak, glitch)` for "Mux is looking rough back there. Get Glitch's stimpak into his hands.", records outcome `{ kind: "already-held", expect: { holder: { item: "stimpak", person: "glitch" } } }`, loops 0, an empty loops.jsonl, calls purposes `["target"]` only, and exits 1; on the code before this change the same run records reached on loop 1. A run whose end state is false at the start and that the run brings about still ends reached (the existing give, walk and say runs, unchanged). A failed snapshot read at the pre-act read stops as bench at call target. In tests/score.test.ts: a goal whose model types an end state true from boot scores outcome already-held and held false, both when the goal file expects another state and when it expects that same state, and the sweep holds it at no value. The fixtures that used an end state true from boot as a one-loop reached run (tests/player.test.ts ROGUE_HOLDS_SHARD, three tests; tests/adapter.test.ts's hosted-bench test) move to an end state false on the fresh world that their run reaches by acting, their assertions on keys, the history read failure and the hosted directories unchanged.

Acts on the cause: The cause is that reached is decided from whether the end state holds when a loop reads the bench, with no read of whether it held before the run acted. The run now reads it before it acts, and an end state that held then ends the run as already-held, so no loop ever sees an end state that was true from the start: every reached that remains is one that turned true after the run began, and the condition the defect needs no longer exists.

## Commitments

- A run whose typed end state holds on the bench before it performs any action ends with outcome already-held naming that end state, never reached, with no words call, no Jev call and no loop.
- The model is never re-asked: an already-held target is refused, as checked() refuses a target naming what the page does not show.
- A run whose end state does not hold at its start decides every loop exactly as before; reached stays the code check of the end state.
- A goal whose run ended already-held is never counted held in a score file's reached count, and its score entry's outcome is already-held.
- The read before acting is holds() over the bench's routes; the harness imports nothing from the engine or the server.
- No field of run.json, loops.jsonl, events.jsonl, received.jsonl or a score file is added or renamed; only the outcome union gains a kind.

## Sacrifices

- An instruction that genuinely asks for a state already true ("make sure Glitch keeps his stimpak") also ends already-held and counts as not held; the run cannot tell a correct reading of such an instruction from a mistyped one, and treats both as nothing to do. (0 of 47 goal expectations in corpus/goals/blind-1.json, blind-2.json, blind-2-spent.json and calibration.json against the world's start holders and locations)
- The committed runs and score that recorded the stimpak-for-mux miss as reached keep that record; they are history and are not rewritten. (2 of 71 corpus/runs/*/loops.jsonl with at least one loop, loop 1 held true)
- Each run that passes the check pays one more snapshot read (or, for a said end state, one events read) before it acts. (69 of 71 corpus/runs/*/loops.jsonl with at least one loop whose loop 1 did not read held, each of which would have paid the read)

## Risk

If the read sat after the words call, an already-held run would still pay the words model; it sits before it. If score.ts kept held as the probe alone, a goal set whose own expectation already holds would count a run that did nothing, and the plain score would disagree with the sweep, which already holds no loopless run; held is false for an already-held outcome on both paths. If decideLoop were changed instead (reached only after an action), a held end state would become act or stuck on loop 1 and the run would act toward a state it already has; the refusal before the loop removes that path rather than steering it. If the fixtures that leaned on an end state true from boot were switched to expect already-held, the key test would lose its Jev-key assertion and the adapter test its Jev-time directory check, since neither stand-in would be called; they move to a run that acts instead.

## Licensed by

harness/src/target.ts:162
