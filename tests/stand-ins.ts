/**
 * The endpoint stand-ins the player's tests share: local servers answering as the chat completions
 * and decisions endpoints do, each keeping the requests it was sent. A test file that uses them
 * stops every server in `stops` once its tests are done.
 */
import type { EndState } from "harness/goal.ts";
import { T_ACT, T_DONE } from "harness/rule.ts";

export const MODEL_COST = 0.0002;
export const JEV_COST = 0.00002;
/** Scripted noul values, derived from the rule's thresholds so they hold whatever calibration sets. */
export const NO_DONE = T_DONE * 0.3;
export const FAVOURED = Math.min(1, T_ACT + 0.05);
export const PASSED_OVER = T_ACT * 0.3;

/** Stops each server a stand-in started. */
export const stops: (() => void)[] = [];

export type JevRequest = {
  model: string;
  state: string;
  questions: Record<string, { type: string; instructions: string }>;
};

/**
 * A local server standing in for an endpoint; each request's JSON body is kept, in order, and
 * whether it carried an Authorization header.
 */
export function standIn(answer: (body: unknown, n: number) => Response): {
  url: string;
  bodies: unknown[];
  authorized: boolean[];
} {
  const bodies: unknown[] = [];
  const authorized: boolean[] = [];
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      const body: unknown = await request.json();
      bodies.push(body);
      authorized.push(request.headers.has("authorization"));
      return answer(body, bodies.length);
    },
  });
  stops.push(() => void server.stop(true));
  return { url: `http://127.0.0.1:${server.port}/`, bodies, authorized };
}

/** The chat completions stand-in: answers each call with the next scripted JSON object. */
export function model(...answers: unknown[]) {
  return standIn((_body, n) =>
    Response.json({
      choices: [{ message: { role: "assistant", content: JSON.stringify(answers[n - 1] ?? {}) } }],
      usage: { cost: MODEL_COST },
    }),
  );
}

/** The model's target for an end state. */
export function goal(expect: EndState, needsWords = false) {
  return { kind: "goal" as const, expect, needsWords };
}

/**
 * The decisions stand-in: `score` gives every question's noul from the whole request; `instead`
 * may answer the nth call with another response.
 */
export function jev(
  score: (request: JevRequest) => Record<string, number>,
  instead: (n: number) => Response | null = () => null,
) {
  return standIn((body, n) => {
    const other = instead(n);
    if (other !== null) return other;
    const answers = Object.fromEntries(
      Object.entries(score(body as JevRequest)).map(([key, noul]) => [key, { noul }]),
    );
    return Response.json({ answers, usage: { cost: JEV_COST } });
  });
}

/** The key of the question asking about `description`, if this request asks about it. */
export function keyOf(request: JevRequest, description: string): string | undefined {
  return Object.entries(request.questions).find(
    ([key, q]) => key !== "done" && q.instructions.includes(`"${description}"`),
  )?.[0];
}

/**
 * A Jev stand-in that favours the first of `preferred` the page offers (or that `preferred` gives
 * for the request), passes over every other candidate, and answers done with `done`.
 */
export function preferring(
  preferred: string[] | ((request: JevRequest) => string[]),
  done = NO_DONE,
  instead?: (n: number) => Response | null,
) {
  return jev((request) => {
    const wanted = typeof preferred === "function" ? preferred(request) : preferred;
    const favoured = wanted.map((d) => keyOf(request, d)).find((key) => key !== undefined);
    return Object.fromEntries(
      Object.keys(request.questions).map((key) => {
        if (key === "done") return [key, done];
        return [key, key === favoured ? FAVOURED : PASSED_OVER];
      }),
    );
  }, instead);
}
