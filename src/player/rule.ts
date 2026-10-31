/**
 * The player's pre-registered rule. Each loop asks Jev, in one call over a state rendered by code
 * (the goal, then the page's text), one noul whether the goal is reached and one noul per
 * candidate whether it is the next step. Reached when done >= T_DONE; otherwise perform the
 * highest-scored candidate at or above T_ACT; stuck when none reaches it. The thresholds are set
 * from the calibration goal set and recorded with its score; a goal set by this rule's author is
 * never a blind test of it.
 */
import type { Candidate } from "./candidates.ts";
import { type ClientOptions, type DecideResult, decide, type NoulQuestion } from "./jev.ts";
import type { ActionTarget } from "./target.ts";

/** Who wrote this rule and its calibration set; a blind goal set must carry another author. */
export const RULE_AUTHOR = "claude-opus-5-5 (bench-driver builder)";
/** Set by `score --sweep` on corpus/goals/calibration.json; its score file records the pair. */
export const T_DONE = 0.6;
export const T_ACT = 0.3;

export type Thresholds = { done: number; act: number };
export const REGISTERED: Thresholds = { done: T_DONE, act: T_ACT };

/** What the run is for: the instruction, the checked target, and the words to type, if any. */
export type Goal = { instruction: string; target: ActionTarget; words: string | null };

/** A candidate as recorded: its key, what it does and Jev's score for it. */
export type Scored = { key: string; description: string; score: number };

export type Decision =
  | { kind: "reached"; done: number }
  | { kind: "act"; done: number; chosen: Scored }
  | { kind: "stuck"; done: number; best: Scored | null };

/** The state Jev reads: the goal, rendered by code, then the page as text. */
export function renderState(goal: Goal, pageText: string): string {
  const { actor, verb, fields } = goal.target;
  const named = Object.entries(fields)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => `${key} ${value}`);
  return [
    `Goal: ${goal.instruction}`,
    `First action toward it: ${actor} ${verb}${named.length > 0 ? ` (${named.join(", ")})` : ""}; once it is in the history, the goal may need further actions by others`,
    `Done when: ${goal.target.done}`,
    ...(goal.words === null ? [] : [`Words to use: ${goal.words}`]),
    "",
    "The page now:",
    pageText,
  ].join("\n");
}

/** One noul for the goal (`done`) and one per candidate, keyed by the candidate's key. */
export function questionsFor(goal: Goal, candidates: Candidate[]): Record<string, NoulQuestion> {
  const questions: Record<string, NoulQuestion> = {
    done: { type: "noul", instructions: goal.target.done },
  };
  for (const candidate of candidates) {
    questions[candidate.key] = {
      type: "noul",
      instructions: `Is "${candidate.description}" the next step toward the goal?`,
    };
  }
  return questions;
}

/** The rule itself, over the done score and each candidate's score, in candidate order. */
export function choose(done: number, scored: Scored[], thresholds: Thresholds): Decision {
  if (done >= thresholds.done) return { kind: "reached", done };
  let best: Scored | null = null;
  for (const candidate of scored) {
    if (best === null || candidate.score > best.score) best = candidate;
  }
  if (best !== null && best.score >= thresholds.act) return { kind: "act", done, chosen: best };
  return { kind: "stuck", done, best };
}

export type Asked =
  | {
      ok: true;
      questions: Record<string, NoulQuestion>;
      done: number;
      scored: Scored[];
      costUsd: number;
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
