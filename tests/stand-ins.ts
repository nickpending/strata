/**
 * The stand-ins the player's tests share: local servers answering as the chat completions and
 * decisions endpoints do, each keeping the requests it was sent, a bench behind a proxy, and the
 * player's command line run against them. A test file that uses them stops every server in
 * `stops` and removes every directory in `temps` once its tests are done.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { EndState } from "harness/goal.ts";
import { type Control, readPage } from "harness/page.ts";
import { T_ACT, T_DONE } from "harness/rule.ts";
import type { DriveResult, LoopRecord, RunRecord } from "harness/run.ts";
import type { Browser } from "playwright";
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
 * absent), the cost reported (MODEL_COST when absent, no usage.cost when null) and the provider
 * reported (no provider key when absent), or a status.
 */
export type ChatAnswer =
  | { content?: string; cost?: number | null; provider?: string }
  | { status: number };

/** The chat completions stand-in scripted call by call: the nth call gets the nth answer. */
export function chat(...answers: ChatAnswer[]) {
  return standIn((_body, n) => {
    const answer = answers[n - 1] ?? { content: "{}" };
    if ("status" in answer) return new Response("upstream exploded", { status: answer.status });
    const { content, cost = MODEL_COST, provider } = answer;
    return Response.json({
      ...(provider === undefined ? {} : { provider }),
      choices: content === undefined ? [] : [{ message: { role: "assistant", content } }],
      ...(cost === null ? {} : { usage: { cost } }),
    });
  });
}

/** The chat completions stand-in: answers each call with the next scripted JSON object. */
export function model(...answers: unknown[]) {
  return chat(...answers.map((answer) => ({ content: JSON.stringify(answer) })));
}

/** The prompt a chat completions request `body` was sent with, as a stand-in kept it. */
export function promptOf(body: unknown): string {
  const sent = body as { messages?: { content: string }[] } | undefined;
  return sent?.messages?.[0]?.content ?? "";
}

/** The prompt the chat completions stand-in received on its first call: the target's. */
export function targetPrompt(m: { bodies: unknown[] }): string {
  return promptOf(m.bodies[0]);
}

/** The verb lines of a target prompt, between their heading and the people line. */
export function verbLines(prompt: string): string[] {
  const all = prompt.split("\n");
  const from = all.indexOf("Verbs the page offers, each with the fields it takes besides actor:");
  const to = all.findIndex((line) => line.startsWith("People (actors and targets): "));
  return all.slice(from + 1, to);
}

/** A verb line as the prompt writes it from a verb and its fields. */
export function verbLine({ verb, fields }: { verb: string; fields: string[] }): string {
  return `  ${verb}${fields.length > 0 ? ` (fields: ${fields.join(", ")})` : ""}`;
}

/**
 * Today's json-schema-retry body for `model`, its keys in today's order, as JSON text: the body
 * every model the request table does not list is sent.
 */
export function schemaRetryText(
  model: string,
  prompt: string,
  name: string,
  schema: unknown,
): string {
  return JSON.stringify({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: { name, strict: true, schema },
    },
    provider: { require_parameters: true },
    usage: { include: true },
  });
}

/** The candidates a loop's controls offer, worked out here from the controls the loop read. */
export function offeredBy(entry: LoopRecord, words: string | null): string[] {
  return entry.controls.flatMap((control) => {
    if (control.label === "" || !control.enabled) return [];
    if (control.kind === "select") {
      return control.options
        .filter((option) => option !== control.value)
        .map((option) => `set ${control.label} to ${option}`);
    }
    if (control.kind === "button") return [`press ${control.label}`];
    return words !== null && control.value !== words
      ? [`type the words into ${control.label}`]
      : [];
  });
}

/** A plan's step as the model writes it. */
export function step(actor: string, verb: string, fields: Record<string, string> = {}) {
  return { actor, verb, fields };
}

/** The decision kinds of a run's loops, in order. */
export function kinds(loops: LoopRecord[]): string[] {
  return loops.map((entry) => entry.decision.kind);
}

/** The loops that pressed Step while the page showed the offer `e1` pending. */
export function steppedWhileOffered(loops: LoopRecord[]): number[] {
  return loops
    .filter(
      (entry) => entry.state.includes("exchange.offer e1 by") && entry.action === "press Step",
    )
    .map((entry) => entry.loop);
}

/** Every string anywhere in `value`, at any depth, keys left out. */
export function stringsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringsOf);
}

/** The model's target for an end state. */
export function goal(expect: EndState, needsWords = false) {
  return { kind: "goal" as const, expect, needsWords };
}

/** The end state of Mux saying something, and the words the stand-ins write for it. */
export const MUX_SAYS = { said: { person: "mux", subkind: "speech.say" } };
export const LINE = "My refurb deck runs on hope and duct tape.";

/** One hold call: the action, what had been printed and appended, and the page's controls. */
export type HoldCall = {
  action: string;
  printed: string;
  loops: LoopRecord[];
  controls: Control[];
};

/**
 * The hold before the browser closes: how many actions were held before it, what had been
 * printed, the run files on disk, and whether the page was still open once it had waited.
 */
export type CloseCall = { after: number; printed: string; files: string[]; open: boolean };

/**
 * Drive toward Mux's say in this process on `browser`, with a hold that records each call and
 * answers it with `answer`.
 */
export async function heldRun(
  browser: Browser,
  headed: boolean,
  answer: (call: number) => "go" | "end",
  j: { url: string },
  answers: unknown[] = [goal(MUX_SAYS, true), { words: LINE }],
): Promise<{ result: DriveResult; calls: HoldCall[]; closes: CloseCall[]; printed: string[] }> {
  const { drive } = await import("harness/run.ts");
  const corpus = join(mkdtempSync(join(tmpdir(), "strata-harness-test-")), "runs");
  temps.push(dirname(corpus));
  const printed: string[] = [];
  const calls: HoldCall[] = [];
  const closes: CloseCall[] = [];
  const result = await drive({
    instruction: "have Mux say something funny",
    worldDir: join(ROOT, "world"),
    tickMinutes: 10,
    headed,
    maxLoops: 24,
    corpusDir: corpus,
    jev: { endpoint: j.url },
    model: { endpoint: model(...answers).url },
    host: hostBench,
    browser,
    print: (text) => printed.push(text),
    hold: async (held) => {
      const runDir = join(corpus, readdirSync(corpus)[0] ?? "");
      if (held.kind === "close") {
        const close = { after: calls.length, printed: printed.join("\n") };
        const files = RUN_FILES.filter((file) => existsSync(join(runDir, file)));
        // The operator takes a while to press Enter: the page must still be open after it.
        await Bun.sleep(300);
        const page = browser.contexts()[0]?.pages()[0];
        const open = page !== undefined && (await readPage(page)).controls.length > 0;
        closes.push({ ...close, files, open });
        return "go";
      }
      const page = browser.contexts()[0]?.pages()[0];
      if (page === undefined) throw new Error("the run has no page open");
      calls.push({
        action: held.action,
        printed: printed.join("\n"),
        loops: lines<LoopRecord>(join(runDir, "loops.jsonl")),
        controls: (await readPage(page)).controls,
      });
      return answer(calls.length);
    },
  });
  return { result, calls, closes, printed };
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

/**
 * A Jev stand-in that favours the giver's offer moves, in order, until the offer is recorded, and
 * from then on scores press Step above every other candidate on every loop.
 */
export function offerThenStep(offerMoves: string[]) {
  return preferring((request) =>
    request.state.includes("exchange.offer") ? ["press Step"] : offerMoves,
  );
}
