import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { WorldEvent } from "../src/engine/events.ts";
import { useAccountBrowsers } from "../src/player/page.ts";
import { T_ACT, T_DONE } from "../src/player/rule.ts";
import type { LoopRecord, RunRecord } from "../src/player/run.ts";
import { startServer } from "../src/server/routes.ts";

const ROOT = join(import.meta.dir, "..");
// Every player run below is a child process; each inherits where the account's browsers are.
useAccountBrowsers();
const MAIN = join(ROOT, "src", "player", "main.ts");

const MODEL_COST = 0.0002;
const JEV_COST = 0.00002;
/** Scripted noul values, derived from the rule's thresholds so they hold whatever calibration sets. */
const YES_DONE = Math.min(1, T_DONE + 0.05);
const NO_DONE = T_DONE * 0.3;
const FAVOURED = Math.min(1, T_ACT + 0.05);
const PASSED_OVER = T_ACT * 0.3;

const temps: string[] = [];
const stops: (() => void)[] = [];
afterAll(() => {
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

type JevRequest = {
  model: string;
  state: string;
  questions: Record<string, { type: string; instructions: string }>;
};

/** A local server standing in for an endpoint; each request's JSON body is kept, in order. */
function standIn(answer: (body: unknown, n: number) => Response): {
  url: string;
  bodies: unknown[];
} {
  const bodies: unknown[] = [];
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      const body: unknown = await request.json();
      bodies.push(body);
      return answer(body, bodies.length);
    },
  });
  stops.push(() => void server.stop(true));
  return { url: `http://127.0.0.1:${server.port}/`, bodies };
}

/** The chat completions stand-in: answers each call with the next scripted JSON object. */
function model(...answers: unknown[]) {
  return standIn((_body, n) =>
    Response.json({
      choices: [{ message: { role: "assistant", content: JSON.stringify(answers[n - 1] ?? {}) } }],
      usage: { cost: MODEL_COST },
    }),
  );
}

/**
 * The decisions stand-in: `score` gives every question's noul from the whole request; `instead`
 * may answer the nth call with another response.
 */
function jev(
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
function keyOf(request: JevRequest, description: string): string | undefined {
  return Object.entries(request.questions).find(
    ([key, q]) => key !== "done" && q.instructions.includes(`"${description}"`),
  )?.[0];
}

/**
 * A Jev stand-in that favours the first of `preferred` the page offers, passes over every other
 * candidate, and answers done yes when `isDone(state)`.
 */
function preferring(
  preferred: string[],
  isDone: (state: string) => boolean,
  instead?: (n: number) => Response | null,
) {
  return jev((request) => {
    const favoured = preferred.map((d) => keyOf(request, d)).find((key) => key !== undefined);
    return Object.fromEntries(
      Object.keys(request.questions).map((key) => {
        if (key === "done") return [key, isDone(request.state) ? YES_DONE : NO_DONE];
        return [key, key === favoured ? FAVOURED : PASSED_OVER];
      }),
    );
  }, instead);
}

type Ran = { exitCode: number; stdout: string; stderr: string; runDir: string; record: RunRecord };

/** Run the player CLI as the operator does, against the stand-ins, into a fresh corpus. */
async function play(instruction: string, flags: string[]): Promise<Ran> {
  const dir = mkdtempSync(join(tmpdir(), "strata-player-test-"));
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

function lines<T>(file: string): T[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as T);
}

function endpoints(m: { url: string }, j: { url: string }): string[] {
  return ["--model-endpoint", m.url, "--jev-endpoint", j.url, "--key", "stand-in-key"];
}

const RUN_FILES = ["events.jsonl", "loops.jsonl", "received.jsonl", "run.json"];

/** The candidates a loop's controls offer, worked out here from the controls the loop read. */
function offeredBy(entry: LoopRecord, words: string | null): string[] {
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

const SAY = {
  kind: "action",
  actor: "mux",
  verb: "say",
  needsWords: true,
  done: "Has Mux said something funny?",
};
const LINE = "My refurb deck runs on hope and duct tape.";

describe("C5: the player works the bench toward an instruction", () => {
  test("have Mux say something funny: actor, verb, typing, Act, then done", async () => {
    const m = model(SAY, { words: LINE });
    const j = preferring(
      ["set actor to mux", "set verb to say", "type the words into words", "press Act"],
      (state) => state.includes("speech.say"),
    );
    const ran = await play("have Mux say something funny", endpoints(m, j));
    expect(ran.stderr).toBe("");
    expect(ran.exitCode).toBe(0);
    expect(RUN_FILES.filter((file) => !existsSync(join(ran.runDir, file)))).toEqual([]);

    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(loops.map((entry) => entry.action)).toEqual([
      "set actor to mux",
      "set verb to say",
      "type the words into words",
      "press Act",
      null,
    ]);
    expect(ran.record.outcome).toEqual({ kind: "reached", loop: 5, done: YES_DONE });
    expect(ran.record.target).toMatchObject({ kind: "action", actor: "mux", verb: "say" });
    expect(ran.record.words).toBe(LINE);

    const requests = j.bodies as JevRequest[];
    expect(requests).toHaveLength(loops.length);
    loops.forEach((entry, i) => {
      const request = requests[i] as JevRequest;
      // One done noul plus one noul per candidate the page offered that loop, and nothing else.
      expect(Object.keys(request.questions).sort()).toEqual(
        ["done", ...entry.candidates.map((c) => c.key)].sort(),
      );
      expect(Object.values(request.questions).every((q) => q.type === "noul")).toBe(true);
      expect(request.questions.done?.instructions).toBe(SAY.done);
      expect(request.state).toBe(entry.state);
      expect(request.model).toBe("typesafe/jev-1.13");
      // The candidates are the page's own controls and options as read that loop.
      expect(entry.candidates.map((c) => c.description)).toEqual(offeredBy(entry, LINE));
      for (const candidate of entry.candidates) {
        expect(entry.controls.map((c) => c.id)).toContain(candidate.control);
      }
      expect(Object.keys(entry.questions).sort()).toEqual(Object.keys(request.questions).sort());
      expect(entry.answers.done).toBe(i === loops.length - 1 ? YES_DONE : NO_DONE);
    });
    // The page as read: the actor select offers the world's people, the words field appears once
    // say is the verb, and the words are typed into it before Act.
    expect(loops[0]?.controls.find((c) => c.label === "actor")?.options).toEqual([
      "glitch",
      "mux",
      "rogue",
    ]);
    expect(loops[0]?.controls.some((c) => c.label === "words")).toBe(false);
    expect(loops[2]?.controls.find((c) => c.label === "words")?.value).toBe("");
    expect(loops[3]?.controls.find((c) => c.label === "words")?.value).toBe(LINE);

    // Every loop was printed as it happened: its state, each question with its answer, its action.
    for (const entry of loops) {
      expect(ran.stdout).toContain(`--- loop ${entry.loop}`);
      for (const [key, question] of Object.entries(entry.questions)) {
        const score =
          key === "done"
            ? entry.answers.done
            : entry.answers.scored.find((scored) => scored.key === key)?.score;
        expect(score).toBeDefined();
        expect(ran.stdout).toContain(`  ${key}: ${question.instructions} -> ${score}\n`);
      }
      expect(ran.stdout).toContain(entry.state);
      if (entry.action !== null) expect(ran.stdout).toContain(`action: ${entry.action}`);
    }

    // The history read back from the bench holds Mux's say with the stand-in's words.
    const events = lines<WorldEvent>(join(ran.runDir, "events.jsonl"));
    expect(events.map((e) => [e.subkind, e.actor, e.payload])).toEqual([
      ["speech.say", "mux", { words: LINE }],
    ]);
    const received = lines<{ thing: string; copy: WorldEvent }>(join(ran.runDir, "received.jsonl"));
    expect(received.map((r) => r.thing)).toEqual(["mux"]);

    // The total cost is the sum of the answered costs: two model calls and one Jev call per loop.
    const answered = m.bodies.length * MODEL_COST + requests.length * JEV_COST;
    expect(m.bodies).toHaveLength(2);
    expect(ran.record.costUsd).toBeCloseTo(answered, 12);
    expect(ran.record.calls.map((c) => c.client)).toEqual([
      "model",
      "model",
      ...loops.map(() => "jev" as const),
    ]);
  }, 60_000);
});

describe("C6: the player ends without inventing an action", () => {
  const ATTACK = "have Rogue attack Glitch";
  const SAY_TO = {
    kind: "action",
    actor: "rogue",
    verb: "say-to",
    fields: { target: "glitch" },
    needsWords: false,
    done: "Has Rogue attacked Glitch?",
  };

  test("a model answering no-such-action ends the run before any loop", async () => {
    const j = preferring([], () => false);
    const ran = await play(
      ATTACK,
      endpoints(model({ kind: "no-such-action", reason: "no verb attacks" }), j),
    );
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "no-such-action", reason: "no verb attacks" });
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
    expect(ran.stderr).toContain("no-such-action");
  }, 60_000);

  test("a target naming a verb the page lacks ends no-such-action naming the verb", async () => {
    const j = preferring([], () => false);
    const m = model({ ...SAY_TO, verb: "attack" });
    const ran = await play(ATTACK, endpoints(m, j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(JSON.stringify(ran.record.outcome)).toContain('verb \\"attack\\"');
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
  }, 60_000);

  test("nouls that never pass T_ACT end stuck, naming the best candidate and its score", async () => {
    const best = T_ACT * 0.6;
    const j = jev((request) =>
      Object.fromEntries(
        Object.keys(request.questions).map((key) => {
          if (key === "done") return [key, NO_DONE];
          return [key, key === keyOf(request, "press Act") ? best : PASSED_OVER];
        }),
      ),
    );
    const ran = await play(ATTACK, endpoints(model(SAY_TO), j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toMatchObject({
      kind: "stuck",
      loop: 1,
      best: { description: "press Act", score: best },
    });
    expect(ran.stderr).toContain("stuck");
    expect(ran.stderr).toContain("press Act");
  }, 60_000);

  test("a loop ceiling of 2 ends at the ceiling after two loops", async () => {
    const j = preferring(["press Step"], () => false);
    const ran = await play(ATTACK, [...endpoints(model(SAY_TO), j), "--max-loops", "2"]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "ceiling", loops: 2 });
    expect(lines<LoopRecord>(join(ran.runDir, "loops.jsonl")).map((l) => l.action)).toEqual([
      "press Step",
      "press Step",
    ]);
    expect(j.bodies).toHaveLength(2);
    // Two presses of Step advanced the bench's clock twice.
    const events = lines<WorldEvent>(join(ran.runDir, "events.jsonl"));
    expect(events.map((e) => e.subkind)).toEqual(["time.tick", "time.tick"]);
  }, 60_000);
});

describe("C7: a refusal from either client stops the run naming its kind", () => {
  const TARGET = {
    kind: "action",
    actor: "glitch",
    verb: "depart",
    fields: { exit: "east" },
    needsWords: false,
    done: "Is Glitch in the Back Room?",
  };

  /** Each stop leaves run.json naming it and every file written before it. */
  function expectStopped(ran: Ran, kind: string, call: string): void {
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toMatchObject({ kind: "stopped", stopped: { kind, call } });
    expect(ran.record.stopped).toMatchObject({ kind, call });
    expect(ran.stderr).toContain(`stopped: ${kind}`);
    expect(RUN_FILES.filter((file) => !existsSync(join(ran.runDir, file)))).toEqual([]);
  }

  test("status: the decisions endpoint answers 500 on the second loop", async () => {
    const j = preferring(
      ["press Step"],
      () => false,
      (n) => (n === 2 ? new Response("upstream exploded", { status: 500 }) : null),
    );
    const ran = await play("send Glitch east", endpoints(model(TARGET), j));
    expectStopped(ran, "status", "loop 2");
    expect(ran.record.stopped?.status).toBe(500);
    expect(ran.stderr).toContain("500");
    // The first loop and the calls before the stop remain.
    expect(lines<LoopRecord>(join(ran.runDir, "loops.jsonl"))).toHaveLength(1);
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target", "loop 1"]);
    expect(lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind)).toEqual([
      "time.tick",
    ]);
  }, 60_000);

  test("parse: the chat completions endpoint answers a body that is not the answer shape", async () => {
    const m = standIn(() => Response.json({ id: "x", object: "chat.completion", choices: [] }));
    const j = preferring([], () => false);
    const ran = await play("send Glitch east", endpoints(m, j));
    expectStopped(ran, "parse", "target");
    expect(j.bodies).toHaveLength(0);
    expect(ran.record.calls).toEqual([]);
  }, 60_000);

  test("network: no server answers at the decisions endpoint", async () => {
    const gone = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("") });
    const url = `http://127.0.0.1:${gone.port}/`;
    await gone.stop(true);
    const ran = await play("send Glitch east", endpoints(model(TARGET), { url }));
    expectStopped(ran, "network", "loop 1");
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target"]);
    expect(ran.record.target).toMatchObject({ actor: "glitch", verb: "depart" });
  }, 60_000);

  test("config: a key name that resolves to nothing stops before any request", async () => {
    const m = model(TARGET);
    const j = preferring([], () => false);
    const ran = await play("send Glitch east", [
      "--model-endpoint",
      m.url,
      "--jev-endpoint",
      j.url,
      "--key-name",
      "strata-test-no-such-key",
    ]);
    expectStopped(ran, "config", "target");
    expect(ran.record.stopped?.message).toContain("strata-test-no-such-key");
    expect(m.bodies).toHaveLength(0);
    expect(j.bodies).toHaveLength(0);
  }, 60_000);
});

describe("every call's cost is on record, and a cost the provider did not report is told apart", () => {
  test("a call answered without usage.cost is recorded as unreported, never as zero", async () => {
    const m = standIn(() =>
      Response.json({
        choices: [
          { message: { content: JSON.stringify({ kind: "no-such-action", reason: "x" }) } },
        ],
      }),
    );
    const ran = await play(
      "have Rogue attack Glitch",
      endpoints(
        m,
        preferring([], () => false),
      ),
    );
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(ran.record.calls).toEqual([{ client: "model", purpose: "target", costUsd: null }]);
    expect(ran.record.unreportedCosts).toBe(1);
    expect(ran.record.costUsd).toBe(0);
  }, 60_000);
});

describe("a bench read that fails after the run is its own failure, kept apart from the outcome", () => {
  test("a history route answering 500 keeps the run reached, names the route, and writes no history", async () => {
    const dir = mkdtempSync(join(tmpdir(), "strata-player-bench-"));
    temps.push(dir);
    const bench = startServer({
      world: join(ROOT, "world"),
      dbPath: join(dir, "world.sqlite"),
      tickMinutes: 10,
      port: 0,
    });
    if (!bench.ok) throw new Error(bench.refusal.message);
    stops.push(bench.stop);
    const benchBase = `http://127.0.0.1:${bench.server.port}`;
    // A proxy that serves the page and its own reads, but fails the player's history read: the
    // browser's requests carry Chrome's user agent, the player's own fetches do not.
    const proxy = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: async (request) => {
        const url = new URL(request.url);
        const fromBrowser = (request.headers.get("user-agent") ?? "").includes("Chrome");
        if (url.pathname === "/api/events" && !fromBrowser) {
          return new Response("history unavailable", { status: 500 });
        }
        return fetch(`${benchBase}${url.pathname}${url.search}`, { method: request.method });
      },
    });
    stops.push(() => void proxy.stop(true));
    const m = model({
      kind: "action",
      actor: "glitch",
      verb: "depart",
      fields: { exit: "east" },
      needsWords: false,
      done: "Is Glitch in the Back Room?",
    });
    const ran = await play("send Glitch east", [
      ...endpoints(
        m,
        preferring([], () => true),
      ),
      "--url",
      `http://127.0.0.1:${proxy.port}/`,
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "reached", loop: 1, done: YES_DONE });
    expect(ran.record.stopped).toBeUndefined();
    expect(ran.record.benchFailures).toHaveLength(1);
    expect(ran.record.benchFailures[0]).toMatchObject({ kind: "bench", call: "history" });
    expect(ran.record.benchFailures[0]?.message).toContain("/api/events");
    expect(ran.record.benchFailures[0]?.message).toContain("500");
    expect(existsSync(join(ran.runDir, "events.jsonl"))).toBe(false);
    expect(existsSync(join(ran.runDir, "received.jsonl"))).toBe(false);
    expect(ran.stderr).toContain("bench");
    expect(ran.stderr).toContain("/api/events");
  }, 60_000);
});
