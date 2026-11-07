/**
 * Read docs/jev.md before writing any question this client asks.
 *
 * This experiment's Jev client. harness/src/jev.ts `decide` sends state as a string and parses only
 * noul and choice answers; this experiment needs the score type and a JSON-object state (docs/jev.md
 * rule 7), and the brief allows no harness change. So it posts through the harness's own `postJson`,
 * key resolution and cost reading, unchanged, and parses all three answer types. Score's wire shape
 * is TypeSafe's (docs.typesafe.ai/primitives/score): `criteria` is an ordered array of level
 * descriptions, low to high; the answer carries `score`, `probabilities` keyed by level index, and
 * `confidence`.
 */
import { costOf, DECISIONS_URL, isRecord, JEV_MODEL, postJson, type Refusal } from "../../../harness/src/jev.ts";

export type NoulQuestion = { type: "noul"; instructions: string };
export type ChoiceQuestion = { type: "choice"; instructions: string; criteria: Record<string, string> };
/** `criteria`: 2 to 10 level descriptions, lowest first. */
export type ScoreQuestion = { type: "score"; instructions: string; criteria: string[] };
export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type NoulAnswer = { type: "noul"; noul: number };
export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};
/** `level` is the most probable level's index; `score` is Jev's expectation, kept for logs only (rule 6). */
export type ScoreAnswer = {
  type: "score";
  score: number;
  level: number;
  confidence: number;
  probabilities: number[];
};
export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;
export type Answers = Record<string, Answer>;

/** A JSON object of named fields, sent as Jev's state. */
export type State = Record<string, unknown>;

export type Asked =
  | { ok: true; answers: Answers; costUsd: number | null; ms: number }
  | { ok: false; refusal: Refusal; ms: number };

function probs(v: unknown): Record<string, number> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, p] of Object.entries(v)) {
    if (typeof p !== "number") return undefined;
    out[k] = p;
  }
  return out;
}

function answerOf(value: unknown, q: Question): Answer | undefined {
  if (!isRecord(value)) return undefined;
  if (q.type === "noul") return typeof value.noul === "number" ? { type: "noul", noul: value.noul } : undefined;
  const p = probs(value.probabilities);
  if (p === undefined || typeof value.confidence !== "number") return undefined;
  if (q.type === "choice") {
    return typeof value.choice === "string"
      ? { type: "choice", choice: value.choice, confidence: value.confidence, probabilities: p }
      : undefined;
  }
  if (typeof value.score !== "number") return undefined;
  const levels = q.criteria.map((_, i) => p[String(i)] ?? 0);
  let level = 0;
  levels.forEach((x, i) => {
    if (x > (levels[level] ?? 0)) level = i;
  });
  return { type: "score", score: value.score, level, confidence: value.confidence, probabilities: levels };
}

/** One request: every question sees `state`, and every one must come back answered. */
export async function ask(state: State, questions: Record<string, Question>): Promise<Asked> {
  const t = performance.now();
  const posted = await postJson(DECISIONS_URL, "decisions", { model: JEV_MODEL, state, questions }, {});
  const ms = Math.round(performance.now() - t);
  if (!posted.ok) return { ok: false, refusal: posted.refusal, ms };
  const given = isRecord(posted.body) && isRecord(posted.body.answers) ? posted.body.answers : {};
  const answers: Answers = {};
  for (const [name, q] of Object.entries(questions)) {
    const a = answerOf(given[name], q);
    if (a === undefined) {
      return { ok: false, refusal: { kind: "parse", message: `no usable answer for question ${name}` }, ms };
    }
    answers[name] = a;
  }
  return { ok: true, answers, costUsd: costOf(posted.body), ms };
}
