/**
 * The harness's pre-registered rule. Each loop asks Jev, in one call over a state rendered by code
 * (the goal, its end state and its plan's steps, then the page's text), one noul whether the end
 * state is reached and one noul per candidate whether it is the next step; the answers are
 * recorded, and code decides: reached when the end state holds on the bench, the done noul deciding
 * nothing; else resolve, when a pending state stands whose resolution (or, failing one, whose due
 * firing) leaves the end state, by that resolution's next form move; else wait, pressing Step while
 * a pending state the plan's last performed step opened stands with no one to resolve it; else
 * plan, the next form move of the plan's next unperformed step; else the highest-scored candidate
 * at or above T_ACT, with press Step withheld while a resolution that leaves the end state stands;
 * stuck when none reaches it, or when the move code derived is not on the page. The thresholds are
 * set from the calibration goal set and recorded with its score; a goal set by this rule's author
 * is never a blind test of it.
 */
import type { Action, Event, Opened, Pending } from "./bench.ts";
import type { Candidate } from "./candidates.ts";
import { described, satisfies } from "./goal.ts";
import { type ClientOptions, type DecideResult, decide, type NoulQuestion } from "./jev.ts";
import type { Control } from "./page.ts";
import { fieldsOf, type GoalTarget, type Served, STEP_FIELDS, type Step } from "./target.ts";

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

/**
 * What the run is for: the instruction, the checked end state, the words to type, if any, and the
 * verbs the bench serves, with the fields each takes.
 */
export type Goal = {
  instruction: string;
  target: GoalTarget;
  words: string | null;
  verbs: Served["verbs"];
};

/** A candidate as recorded: its key, what it does and Jev's score for it. */
export type Scored = { key: string; description: string; score: number };

/** The pending state a loop serves, named by its opening event. */
export type Serving = { event: string; subkind: string };

export type Decision =
  | { kind: "reached"; done: number }
  | { kind: "resolve"; done: number; pending: Serving; chosen: Scored }
  | { kind: "wait"; done: number; pending: Serving; chosen: Scored }
  | { kind: "plan"; done: number; step: number; chosen: Scored }
  | { kind: "act"; done: number; chosen: Scored }
  | {
      kind: "stuck";
      done: number;
      best: Scored | null;
      /** Set when the move a pending state needs is not on the page: the state and the move. */
      pending?: Serving & { move: string };
      /** Set when the move the plan's next step needs is not on the page: its index and the move. */
      step?: { index: number; move: string };
    };

/**
 * Where the run is in its plan: the index of the next unperformed step, whether a refused step
 * ended the plan, and the event the last performed step recorded (null before any).
 */
export type PlanProgress = { next: number; ended: boolean; opened: string | null };

export const PLAN_START: PlanProgress = { next: 0, ended: false, opened: null };

/**
 * What the loop read besides the answers: whether the end state holds, the pending states, the
 * controls, and where the run is in its plan.
 */
export type Seen = { held: boolean; pending: Pending[]; controls: Control[]; plan: PlanProgress };

/**
 * The plan after a press Act its next step led to, from the events that press recorded: the step
 * is performed when one of them is its actor's, and refused, ending the plan, when none is.
 */
export function advanced(plan: PlanProgress, steps: Step[], recorded: Event[]): PlanProgress {
  const step = steps[plan.next];
  const event = step === undefined ? undefined : recorded.find((e) => e.actor === step.actor);
  if (event === undefined) return { ...plan, ended: true };
  return { next: plan.next + 1, ended: false, opened: event.id };
}

/** A step in words: who, the verb, and the fields it names. */
function stepText(step: Step): string {
  const named = Object.entries(step.fields)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => `${key} ${value}`);
  return `${step.actor} ${step.verb}${named.length > 0 ? ` (${named.join(", ")})` : ""}`;
}

/** The plan's steps in words, each marked done or not, or nothing when the plan has none. */
function planLines(goal: Goal, plan: PlanProgress): string[] {
  const { steps } = goal.target;
  if (steps.length === 0) return [];
  return [
    "Plan:",
    ...steps.map(
      (step, i) => `  ${i + 1}. ${stepText(step)}: ${i < plan.next ? "done" : "not done"}`,
    ),
    ...(plan.ended ? [`  Step ${plan.next + 1} was refused; the plan ends there.`] : []),
  ];
}

/** The line in the state Jev reads after which the page's text follows to the end. */
export const PAGE_NOW = "The page now:";

/** The state Jev reads: the goal, its end state and its plan, rendered by code, then the page. */
export function renderState(goal: Goal, pageText: string, plan: PlanProgress): string {
  return [
    `Goal: ${goal.instruction}`,
    `End state: ${described(goal.target.expect)}`,
    ...planLines(goal, plan),
    ...(goal.words === null ? [] : [`Words to use: ${goal.words}`]),
    "",
    PAGE_NOW,
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

/** An action as the form fills it: the actor, the verb, and a value for each field it takes. */
export type FormAction = Action;

/**
 * The next form move toward `action` over the controls as read: setting the first of actor, verb
 * and each of the action's fields whose select holds another value; then typing the run's words
 * into a field that is a text box and does not hold them; pressing Act when all agree.
 */
export function nextMove(action: FormAction, controls: Control[], words: string | null): string {
  const { actor, verb, ...fields } = action;
  const typing: string[] = [];
  for (const [label, value] of [["actor", actor], ["verb", verb], ...Object.entries(fields)]) {
    const control = controls.find((c) => c.label === label);
    if (control !== undefined && (control.kind === "input" || control.kind === "textarea")) {
      if (control.value !== words) typing.push(`type the words into ${label}`);
    } else if (control?.value !== value) return `set ${label} to ${value}`;
  }
  return typing[0] ?? PRESS_ACT;
}

/**
 * A plan's step as the form fills it: the fields its verb takes, each id-ranged one as the step
 * names it (left as the form holds it when the step names none) and each free-text one with the
 * run's words.
 */
function stepAction(step: Step, goal: Goal): FormAction {
  const { words } = goal;
  const action: FormAction = { actor: step.actor, verb: step.verb };
  const named: Record<string, string | null | undefined> = step.fields;
  for (const field of fieldsOf(goal.verbs, step.verb)) {
    if (!STEP_FIELDS.includes(field)) action[field] = words ?? "";
    else {
      const value = named[field];
      if (typeof value === "string") action[field] = value;
    }
  }
  return action;
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
      return { opened: entry.opened, move: nextMove(resolution.action, seen.controls, goal.words) };
    }
    if (satisfies(goal.target.expect, entry.due.after)) {
      return { opened: entry.opened, move: PRESS_STEP };
    }
  }
  return null;
}

/** The candidate `move` names among the scored ones, if the page offers it. */
function offered(scored: Scored[], move: string): Scored | undefined {
  return scored.find((candidate) => candidate.description === move);
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
    const chosen = offered(scored, serves.move);
    if (chosen === undefined) {
      return { kind: "stuck", done, best: null, pending: { ...pending, move: serves.move } };
    }
    return { kind: "resolve", done, pending, chosen };
  }
  const { plan } = seen;
  const waiting = seen.pending.find(
    (entry) => entry.opened.id === plan.opened && entry.resolutions.length === 0,
  );
  if (waiting !== undefined) {
    const pending = { event: waiting.opened.id, subkind: waiting.opened.subkind };
    const chosen = offered(scored, PRESS_STEP);
    if (chosen === undefined) {
      return { kind: "stuck", done, best: null, pending: { ...pending, move: PRESS_STEP } };
    }
    return { kind: "wait", done, pending, chosen };
  }
  const step = plan.ended ? undefined : goal.target.steps[plan.next];
  if (step !== undefined) {
    const move = nextMove(stepAction(step, goal), seen.controls, goal.words);
    const chosen = offered(scored, move);
    if (chosen === undefined) {
      return { kind: "stuck", done, best: null, step: { index: plan.next, move } };
    }
    return { kind: "plan", done, step: plan.next, chosen };
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
