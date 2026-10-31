/**
 * The player's pre-registered rule. Each loop asks Jev, in one call over a state rendered by code
 * (the goal and its end state, then the page's text), one noul whether the end state is reached and
 * one noul per candidate whether it is the next step; the answers are recorded, and code decides:
 * reached when the end state holds on the bench, the done noul deciding nothing; else resolve, when
 * a pending state stands whose resolution (or, failing one, whose due firing) leaves the end state,
 * by that resolution's next form move, or stuck naming the pending state when the page lacks it;
 * else the highest-scored candidate at or above T_ACT, with press Step withheld while a resolution
 * that leaves the end state stands; stuck when none reaches it. The thresholds are set from the
 * calibration goal set and recorded with its score; a goal set by this rule's author is never a
 * blind test of it.
 */
import type { Opened, Pending } from "../engine/pending.ts";
import type { Action } from "../engine/rules.ts";
import type { Candidate } from "./candidates.ts";
import { described, satisfies } from "./goal.ts";
import { type ClientOptions, type DecideResult, decide, type NoulQuestion } from "./jev.ts";
import type { Control } from "./page.ts";
import type { GoalTarget } from "./target.ts";

/** Who wrote this rule and its calibration set; a blind goal set must carry another author. */
export const RULE_AUTHOR = "claude-opus-5-5 (bench-driver builder)";
/** Set by `score --sweep` on corpus/goals/calibration.json; its score file records the pair. */
export const T_DONE = 0.6;
export const T_ACT = 0.3;

export type Thresholds = { done: number; act: number };
export const REGISTERED: Thresholds = { done: T_DONE, act: T_ACT };

/** The page's own buttons the rule presses: the act form's submit, and the clock's step. */
export const PRESS_ACT = "press Act";
export const PRESS_STEP = "press Step";

/** What the run is for: the instruction, the checked end state, and the words to type, if any. */
export type Goal = { instruction: string; target: GoalTarget; words: string | null };

/** A candidate as recorded: its key, what it does and Jev's score for it. */
export type Scored = { key: string; description: string; score: number };

/** The pending state a loop serves, named by its opening event. */
export type Serving = { event: string; subkind: string };

export type Decision =
  | { kind: "reached"; done: number }
  | { kind: "resolve"; done: number; pending: Serving; chosen: Scored }
  | { kind: "act"; done: number; chosen: Scored }
  | {
      kind: "stuck";
      done: number;
      best: Scored | null;
      /** Set when the move a pending state needs is not on the page: the state and the move. */
      pending?: Serving & { move: string };
    };

/** What the loop read besides the answers: whether the end state holds, the pending states, the controls. */
export type Seen = { held: boolean; pending: Pending[]; controls: Control[] };

/** The state Jev reads: the goal and its end state, rendered by code, then the page as text. */
export function renderState(goal: Goal, pageText: string): string {
  return [
    `Goal: ${goal.instruction}`,
    `End state: ${described(goal.target.expect)}`,
    ...(goal.words === null ? [] : [`Words to use: ${goal.words}`]),
    "",
    "The page now:",
    pageText,
  ].join("\n");
}

/** One noul for the end state (`done`) and one per candidate, keyed by the candidate's key. */
export function questionsFor(goal: Goal, candidates: Candidate[]): Record<string, NoulQuestion> {
  const questions: Record<string, NoulQuestion> = {
    done: {
      type: "noul",
      instructions: `Does the page show this end state: ${described(goal.target.expect)}?`,
    },
  };
  for (const candidate of candidates) {
    questions[candidate.key] = {
      type: "noul",
      instructions: `Is "${candidate.description}" the next step toward the goal?`,
    };
  }
  return questions;
}

/** The highest-scored candidate at or above the act threshold, in candidate order; else stuck. */
export function choose(done: number, scored: Scored[], thresholds: Thresholds): Decision {
  let best: Scored | null = null;
  for (const candidate of scored) {
    if (best === null || candidate.score > best.score) best = candidate;
  }
  if (best !== null && best.score >= thresholds.act) return { kind: "act", done, chosen: best };
  return { kind: "stuck", done, best };
}

/**
 * The next form move toward `action` over the controls as read: setting the first of actor, verb
 * and each of the action's fields whose control holds another value; pressing Act when all agree.
 */
export function nextMove(action: Action, controls: Control[]): string {
  const { actor, verb, ...fields } = action;
  for (const [label, value] of [["actor", actor], ["verb", verb], ...Object.entries(fields)]) {
    if (controls.find((control) => control.label === label)?.value !== value) {
      return `set ${label} to ${value}`;
    }
  }
  return PRESS_ACT;
}

/**
 * The first pending state that stands between now and the end state, and the move toward it: its
 * first resolution whose after leaves the end state, by that action's next form move; else its
 * due firing, when that leaves the end state, by pressing Step. Null when no pending state does.
 */
function serving(goal: Goal, seen: Seen): { opened: Opened; move: string } | null {
  for (const entry of seen.pending) {
    const resolution = entry.resolutions.find((r) => satisfies(goal.target.expect, r.after));
    if (resolution !== undefined) {
      return { opened: entry.opened, move: nextMove(resolution.action, seen.controls) };
    }
    if (satisfies(goal.target.expect, entry.due.after)) {
      return { opened: entry.opened, move: PRESS_STEP };
    }
  }
  return null;
}

/** The rule over one loop: what it read and Jev's answers, in the order the rule decides. */
export function decideLoop(
  goal: Goal,
  seen: Seen,
  answers: { done: number; scored: Scored[] },
  thresholds: Thresholds,
): Decision {
  const { done, scored } = answers;
  if (seen.held) return { kind: "reached", done };
  const serves = serving(goal, seen);
  if (serves !== null) {
    const pending = { event: serves.opened.id, subkind: serves.opened.subkind };
    const chosen = scored.find((candidate) => candidate.description === serves.move);
    if (chosen === undefined) {
      return { kind: "stuck", done, best: null, pending: { ...pending, move: serves.move } };
    }
    return { kind: "resolve", done, pending, chosen };
  }
  const resolvable = seen.pending.some((entry) =>
    entry.resolutions.some((r) => satisfies(goal.target.expect, r.after)),
  );
  const open = resolvable ? scored.filter((c) => c.description !== PRESS_STEP) : scored;
  return choose(done, open, thresholds);
}

export type Asked =
  | {
      ok: true;
      questions: Record<string, NoulQuestion>;
      done: number;
      scored: Scored[];
      /** What Jev reported the call cost, or null when it reported none. */
      costUsd: number | null;
    }
  | {
      ok: false;
      questions: Record<string, NoulQuestion>;
      refusal: Extract<DecideResult, { ok: false }>["refusal"];
    };

/** One decide call: the done noul and every candidate's noul over the rendered state. */
export async function ask(
  state: string,
  goal: Goal,
  candidates: Candidate[],
  options: ClientOptions,
): Promise<Asked> {
  const questions = questionsFor(goal, candidates);
  const answered = await decide(state, questions, options);
  if (!answered.ok) return { ok: false, questions, refusal: answered.refusal };
  const noul = (key: string): number => {
    const answer = answered.answers[key];
    return answer !== undefined && "noul" in answer ? answer.noul : 0;
  };
  return {
    ok: true,
    questions,
    done: noul("done"),
    scored: candidates.map((c) => ({ key: c.key, description: c.description, score: noul(c.key) })),
    costUsd: answered.costUsd,
  };
}
