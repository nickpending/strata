/**
 * The Jev client: one POST to OpenRouter's decisions endpoint per `decide`, keyed by the apiconf
 * key `sable-openrouter`. A question that cannot be answered is a typed refusal, never a throw and
 * never an empty answer; the caller branches on `refusal.kind`. Each call is made once: a refusal
 * stops the caller, which names its kind.
 */
import { getKey } from "@voidwire/apiconf";

export const DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";
export const JEV_MODEL = "typesafe/jev-1.13";
/** The apiconf key every OpenRouter request is authorised with. */
export const KEY_NAME = "sable-openrouter";

/** Why a call went unanswered: `config` (no key, before any request), `network` (the request did
 * not complete), `status` (a non-2xx answer, `status` set) or `parse` (a body not of the answer
 * shape). */
export type Refusal = {
  kind: "config" | "network" | "status" | "parse";
  message: string;
  status?: number;
};

export type ClientOptions = {
  /** The endpoint to post to, in place of the real one (a test stands a local server in). */
  endpoint?: string | undefined;
  /** The key to send, in place of the apiconf key: a stand-in endpoint never sees the real one. */
  key?: string | undefined;
  /** The apiconf key name to resolve, in place of `sable-openrouter`. */
  keyName?: string | undefined;
};

/** A yes-or-no question: the answer is the probability that it holds. */
export type NoulQuestion = { type: "noul"; instructions: string };
/** A closed question: the answer is one of `criteria`'s keys. */
export type ChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
};
export type JevQuestion = NoulQuestion | ChoiceQuestion;

export type NoulAnswer = { noul: number };
export type ChoiceAnswer = {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};
export type JevAnswer = NoulAnswer | ChoiceAnswer;

export type DecideResult =
  | { ok: true; answers: Record<string, JevAnswer>; costUsd: number | null }
  | { ok: false; refusal: Refusal };

export type Posted = { ok: true; body: unknown } | { ok: false; refusal: Refusal };

function refused(
  kind: Refusal["kind"],
  message: string,
  status?: number,
): { ok: false; refusal: Refusal } {
  return {
    ok: false,
    refusal: status === undefined ? { kind, message } : { kind, message, status },
  };
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * The cost OpenRouter reports in a body's `usage.cost`, or null when it reports none: a missing
 * cost is unknown, never a zero.
 */
export function costOf(body: unknown): number | null {
  const usage = isRecord(body) && isRecord(body.usage) ? body.usage : {};
  return typeof usage.cost === "number" ? usage.cost : null;
}

/**
 * POST `payload` as JSON to `options.endpoint` (or `url`) with the bearer key, and return the
 * parsed JSON body or the refusal: `config` when the key does not resolve, `network` when the
 * request does not complete, `status` on a non-2xx answer, `parse` when the body is not JSON.
 * `what` names the endpoint in each refusal's message.
 */
export async function postJson(
  url: string,
  what: string,
  payload: unknown,
  options: ClientOptions,
): Promise<Posted> {
  const keyName = options.keyName ?? KEY_NAME;
  let key: string;
  try {
    key = options.key ?? getKey(keyName);
  } catch (error) {
    return refused("config", `apiconf has no ${keyName}: ${(error as Error).message}`);
  }
  let response: Response;
  let text: string;
  try {
    response = await fetch(options.endpoint ?? url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    text = await response.text();
  } catch (error) {
    return refused("network", `the ${what} request did not complete: ${(error as Error).message}`);
  }
  if (!response.ok) {
    return refused(
      "status",
      `the ${what} endpoint answered ${response.status}: ${text.slice(0, 200)}`,
      response.status,
    );
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return refused("parse", `the ${what} body is not JSON: ${text.slice(0, 80)}`);
  }
}

function answerOf(value: unknown, question: JevQuestion): JevAnswer | undefined {
  if (!isRecord(value)) return undefined;
  if (question.type === "noul") {
    return typeof value.noul === "number" ? { noul: value.noul } : undefined;
  }
  if (typeof value.choice !== "string") return undefined;
  if (typeof value.confidence !== "number" || !isRecord(value.probabilities)) return undefined;
  const probabilities: Record<string, number> = {};
  for (const [key, probability] of Object.entries(value.probabilities)) {
    if (typeof probability !== "number") return undefined;
    probabilities[key] = probability;
  }
  return { choice: value.choice, confidence: value.confidence, probabilities };
}

/** Ask `questions` of `state` in one call; every question must come back answered. */
export async function decide(
  state: string,
  questions: Record<string, JevQuestion>,
  options: ClientOptions = {},
): Promise<DecideResult> {
  const posted = await postJson(
    DECISIONS_URL,
    "decisions",
    { model: JEV_MODEL, state, questions },
    options,
  );
  if (!posted.ok) return posted;
  const { body } = posted;
  const given = isRecord(body) && isRecord(body.answers) ? body.answers : {};
  const answers: Record<string, JevAnswer> = {};
  for (const [name, question] of Object.entries(questions)) {
    const answer = answerOf(given[name], question);
    if (answer === undefined) {
      return refused("parse", `the decisions body has no usable answer for question ${name}`);
    }
    answers[name] = answer;
  }
  return { ok: true, answers, costUsd: costOf(body) };
}
