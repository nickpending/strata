/**
 * The stand-ins the player's tests share: local servers answering as the chat completions and
 * decisions endpoints do, each keeping the requests it was sent, a bench behind a proxy, and the
 * player's command line run against them. A test file that uses them stops every server in
 * `stops` and removes every directory in `temps` once its tests are done.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { EndState } from "harness/goal.ts";
import { T_ACT, T_DONE } from "harness/rule.ts";
import type { RunRecord } from "harness/run.ts";
import { hostBench } from "../src/adapter/host.ts";

export const ROOT = join(import.meta.dir, "..");
export const MAIN = join(ROOT, "src", "adapter", "main.ts");

export const MODEL_COST = 0.0002;
export const JEV_COST = 0.00002;
/** Scripted noul values, derived from the rule's thresholds so they hold whatever calibration sets. */
export const NO_DONE = T_DONE * 0.3;
export const FAVOURED = Math.min(1, T_ACT + 0.05);
export const PASSED_OVER = T_ACT * 0.3;

/** Stops each server a stand-in started. */
export const stops: (() => void)[] = [];
/** The temporary directories the tests made. */
export const temps: string[] = [];

export type Ran = {
  exitCode: number;
  stdout: string;
  stderr: string;
  runDir: string;
  record: RunRecord;
};

/** Run the player CLI as the operator does, against the stand-ins, into a fresh corpus. */
export async function play(instruction: string, flags: string[]): Promise<Ran> {
  const dir = mkdtempSync(join(tmpdir(), "strata-harness-test-"));
  temps.push(dir);
  const corpus = join(dir, "runs");
  const proc = Bun.spawn(
    [
      process.execPath,
      "run",
      MAIN,
      instruction,
      "--tick-minutes",
      "10",
      "--corpus",
      corpus,
      ...flags,
    ],
    { cwd: ROOT, env: process.env, stdout: "pipe", stderr: "pipe" },
  );
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  const runs = existsSync(corpus) ? readdirSync(corpus) : [];
  if (runs.length !== 1) throw new Error(`expected one run in ${corpus}: ${stderr}`);
  const runDir = join(corpus, runs[0] ?? "");
  const record = JSON.parse(readFileSync(join(runDir, "run.json"), "utf8")) as RunRecord;
  return { exitCode, stdout, stderr, runDir, record };
}

export function lines<T>(file: string): T[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as T);
}

export function endpoints(m: { url: string }, j: { url: string }): string[] {
  return ["--model-endpoint", m.url, "--jev-endpoint", j.url];
}

export const RUN_FILES = ["events.jsonl", "loops.jsonl", "received.jsonl", "run.json"];

/**
 * Spawn `cmd` with stdin open and never ended, as a terminal's is, `lines` written to it up front.
 * Resolves once the close hold has been printed `closes` times and the process has then exited, or
 * the bound has passed with the process still alive (it is killed, and `exited` is false).
 */
export async function exitsAfterClose(cmd: string[], lines: number, closes: number, bound: number) {
  const proc = Bun.spawn(cmd, {
    cwd: ROOT,
    env: process.env,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  proc.stdin.write("\n".repeat(lines));
  await proc.stdin.flush();
  let stdout = "";
  const decoder = new TextDecoder();
  const closeLine = "hold: press Enter to close the browser";
  const reading = (async () => {
    for await (const chunk of proc.stdout) stdout += decoder.decode(chunk, { stream: true });
  })();
  const deadline = Date.now() + 60_000;
  while (stdout.split(closeLine).length - 1 < closes && Date.now() < deadline) await Bun.sleep(50);
  const closed = stdout.split(closeLine).length - 1 >= closes;
  const exited = await Promise.race([
    proc.exited.then(() => true),
    Bun.sleep(bound).then(() => false),
  ]);
  if (!exited) proc.kill();
  await proc.exited;
  await reading;
  const stderr = await new Response(proc.stderr).text();
  return { closed, exited, exitCode: proc.exitCode, stdout, stderr };
}

/**
 * Serve a bench on an ephemeral port behind a proxy: `rewrite` may change a static file the page
 * loads, and `fails` may answer one of the player's own route reads (those that carry no Chrome
 * user agent) in place of the bench.
 */
export function proxied(
  rewrite: (path: string, text: string) => string = (_path, text) => text,
  fails: (path: string) => Response | null = () => null,
): string {
  const bench = hostBench({ worldDir: join(ROOT, "world"), tickMinutes: 10 });
  if (!bench.ok) throw new Error(bench.message);
  stops.push(bench.stop);
  const benchBase = new URL(bench.base).origin;
  const proxy = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      const url = new URL(request.url);
      const fromBrowser = (request.headers.get("user-agent") ?? "").includes("Chrome");
      const failed = fromBrowser ? null : fails(url.pathname);
      if (failed !== null) return failed;
      const type = request.headers.get("content-type");
      const response = await fetch(`${benchBase}${url.pathname}${url.search}`, {
        method: request.method,
        headers: type === null ? {} : { "content-type": type },
        body: request.method === "POST" ? await request.text() : undefined,
      });
      if (!url.pathname.startsWith("/bench/")) return response;
      return new Response(rewrite(url.pathname, await response.text()), {
        status: response.status,
        headers: { "content-type": response.headers.get("content-type") ?? "text/plain" },
      });
    },
  });
  stops.push(() => void proxy.stop(true));
  return `http://127.0.0.1:${proxy.port}/`;
}

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

/**
 * One scripted chat completions answer: a message's content as sent (a body with no choices when
 * absent) and the cost reported (MODEL_COST when absent, no usage.cost when null), or a status.
 */
export type ChatAnswer = { content?: string; cost?: number | null } | { status: number };

/** The chat completions stand-in scripted call by call: the nth call gets the nth answer. */
export function chat(...answers: ChatAnswer[]) {
  return standIn((_body, n) => {
    const answer = answers[n - 1] ?? { content: "{}" };
    if ("status" in answer) return new Response("upstream exploded", { status: answer.status });
    const { content, cost = MODEL_COST } = answer;
    return Response.json({
      choices: content === undefined ? [] : [{ message: { role: "assistant", content } }],
      ...(cost === null ? {} : { usage: { cost } }),
    });
  });
}

/** The chat completions stand-in: answers each call with the next scripted JSON object. */
export function model(...answers: unknown[]) {
  return chat(...answers.map((answer) => ({ content: JSON.stringify(answer) })));
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
