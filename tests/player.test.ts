import { afterAll, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { WorldEvent } from "../src/engine/events.ts";
import { described, type EndState } from "../src/player/goal.ts";
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

/**
 * A local server standing in for an endpoint; each request's JSON body is kept, in order, and
 * whether it carried an Authorization header.
 */
function standIn(answer: (body: unknown, n: number) => Response): {
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
function model(...answers: unknown[]) {
  return standIn((_body, n) =>
    Response.json({
      choices: [{ message: { role: "assistant", content: JSON.stringify(answers[n - 1] ?? {}) } }],
      usage: { cost: MODEL_COST },
    }),
  );
}

/** The model's target for an end state. */
function goal(expect: EndState, needsWords = false) {
  return { kind: "goal" as const, expect, needsWords };
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
 * A Jev stand-in that favours the first of `preferred` the page offers (or that `preferred` gives
 * for the request), passes over every other candidate, and answers done with `done`.
 */
function preferring(
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
  return ["--model-endpoint", m.url, "--jev-endpoint", j.url];
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

/**
 * Serve a bench on an ephemeral port behind a proxy: `rewrite` may change a static file the page
 * loads, and `fails` may answer one of the player's own route reads (those that carry no Chrome
 * user agent) in place of the bench.
 */
function proxied(
  rewrite: (path: string, text: string) => string = (_path, text) => text,
  fails: (path: string) => Response | null = () => null,
): string {
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

const MUX_SAYS = { said: { person: "mux", subkind: "speech.say" } };
const LINE = "My refurb deck runs on hope and duct tape.";
const MUX_SAY_MOVES = [
  "set actor to mux",
  "set verb to say",
  "type the words into words",
  "press Act",
];

describe("C5: the player works the bench toward a typed end state", () => {
  test("have Mux say something funny: actor, verb, typing, Act, then reached by the bench's check", async () => {
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const j = preferring(MUX_SAY_MOVES, 0.0);
    const ran = await play("have Mux say something funny", endpoints(m, j));
    expect(ran.stderr).toBe("");
    expect(ran.exitCode).toBe(0);
    expect(RUN_FILES.filter((file) => !existsSync(join(ran.runDir, file)))).toEqual([]);

    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(loops.map((entry) => entry.action)).toEqual([...MUX_SAY_MOVES, null]);
    // Reached on the loop after the Act, when the end state holds, though done never passed T_DONE.
    expect(ran.record.outcome).toEqual({ kind: "reached", loop: 5, done: 0 });
    expect(loops.map((entry) => entry.held)).toEqual([false, false, false, false, true]);
    expect(loops.map((entry) => entry.answers.done)).toEqual([0, 0, 0, 0, 0]);
    // A target with no steps records an empty plan, and the run is led by Jev from its first loop.
    expect(ran.record.target).toEqual({ ...goal(MUX_SAYS, true), steps: [] });
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
      expect(request.questions.done?.instructions).toContain(described(MUX_SAYS));
      expect(request.state).toBe(entry.state);
      expect(request.model).toBe("typesafe/jev-1.13");
      // The candidates are the page's own controls and options as read that loop.
      expect(entry.candidates.map((c) => c.description)).toEqual(offeredBy(entry, LINE));
      for (const candidate of entry.candidates) {
        expect(entry.controls.map((c) => c.id)).toContain(candidate.control);
      }
      expect(Object.keys(entry.questions).sort()).toEqual(Object.keys(request.questions).sort());
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

    // Every loop was printed as it happened: its state, each question with its answer (the done
    // noul included), whether the end state held, its decision and its action.
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
      expect(ran.stdout).toContain(`held: ${entry.held}\ndecision: ${entry.decision.kind}`);
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

describe("C6: the player ends without inventing an end state", () => {
  const ATTACK = "have Rogue attack Glitch";
  const ROGUE_BACK = goal({ location: { person: "rogue", room: "back-room" } });

  test("a model answering no-such-action ends the run before any loop", async () => {
    const j = preferring([]);
    const ran = await play(
      ATTACK,
      endpoints(model({ kind: "no-such-action", reason: "no verb attacks" }), j),
    );
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "no-such-action", reason: "no verb attacks" });
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
    expect(existsSync(join(ran.runDir, "run.json"))).toBe(true);
    expect(ran.stderr).toContain("no-such-action");
  }, 60_000);

  test("an end state naming an item the page does not show ends no-such-action naming the item", async () => {
    const j = preferring([]);
    const m = model(goal({ holder: { item: "plasma-rifle", person: "glitch" } }));
    const ran = await play(ATTACK, endpoints(m, j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(JSON.stringify(ran.record.outcome)).toContain(
      'the page shows no item \\"plasma-rifle\\"',
    );
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
  }, 60_000);

  test("a said end state naming a speech kind the registry lacks ends no-such-action naming it", async () => {
    const j = preferring([]);
    const m = model(goal({ said: { person: "rogue", subkind: "speech.threat" } }, true));
    const ran = await play(ATTACK, endpoints(m, j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(JSON.stringify(ran.record.outcome)).toContain(
      'the registry has no speech kind \\"speech.threat\\"',
    );
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
    // No words were asked for: the run ended at the target.
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target"]);
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
    const ran = await play(ATTACK, endpoints(model(ROGUE_BACK), j));
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
    const j = preferring(["press Step"]);
    const ran = await play(ATTACK, [...endpoints(model(ROGUE_BACK), j), "--max-loops", "2"]);
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

/**
 * A Jev stand-in that favours the giver's offer moves, in order, until the offer is recorded, and
 * from then on scores press Step above every other candidate on every loop.
 */
function offerThenStep(offerMoves: string[]) {
  return preferring((request) =>
    request.state.includes("exchange.offer") ? ["press Step"] : offerMoves,
  );
}

/** The loops that pressed Step while the page showed the offer `e1` pending. */
function steppedWhileOffered(loops: LoopRecord[]): number[] {
  return loops
    .filter(
      (entry) => entry.state.includes("exchange.offer e1 by") && entry.action === "press Step",
    )
    .map((entry) => entry.loop);
}

describe("C15: code resolves a pending offer before the clock lapses it", () => {
  const GIVES = [
    {
      instruction: "have Glitch give Rogue the stimpak",
      expect: { holder: { item: "stimpak", person: "rogue" } },
      moves: ["set verb to offer", "set target to rogue", "set item to stimpak", "press Act"],
      resolved: ["set actor to rogue", "set verb to accept", "press Act"],
    },
    {
      instruction: "have Rogue give Glitch the data shard",
      expect: { holder: { item: "data-shard", person: "glitch" } },
      moves: ["set actor to rogue", "set verb to offer", "set item to data-shard", "press Act"],
      resolved: ["set actor to glitch", "set verb to accept", "press Act"],
    },
  ];

  for (const give of GIVES) {
    test(`${give.instruction}: offer, then the accept code derives, never Step`, async () => {
      const ran = await play(
        give.instruction,
        endpoints(model(goal(give.expect)), offerThenStep(give.moves)),
      );
      const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
      const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
      expect(steppedWhileOffered(loops)).toEqual([]);
      expect({ outcome: ran.record.outcome?.kind, history }).toEqual({
        outcome: "reached",
        history: ["exchange.offer", "exchange.accept"],
      });
      expect(ran.exitCode).toBe(0);
      expect(loops.map((entry) => entry.action)).toEqual([...give.moves, ...give.resolved, null]);
      // Each loop after the offer is a resolve naming the offer's opening event.
      const after = loops.slice(give.moves.length, -1);
      expect(after.map((entry) => entry.decision)).toEqual(
        after.map((entry) =>
          expect.objectContaining({
            kind: "resolve",
            pending: { event: "e1", subkind: "exchange.offer" },
            chosen: expect.objectContaining({ description: entry.action }),
          }),
        ),
      );
      // Jev scored press Step above every other candidate on each of those loops.
      for (const entry of after) {
        const top = [...entry.answers.scored].sort((a, b) => b.score - a.score)[0];
        expect(top?.description).toBe("press Step");
      }
      // Reached is the bench's holder check; the accept that made it so is the goal person's.
      const accepted = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).at(-1);
      expect([accepted?.actor, accepted?.payload]).toEqual([
        give.expect.holder.person,
        expect.objectContaining({ item: give.expect.holder.item }),
      ]);
    }, 60_000);
  }

  test("a run whose derived move is absent from the page stops stuck naming the pending state", async () => {
    // The page's verb select leaves out accept: the move the offer's resolution needs is not there.
    const base = proxied((path, text) => {
      if (path !== "/bench/panels/world.js") return text;
      const changed = text.replace(
        "state.verbs.map((v) => v.verb),",
        'state.verbs.map((v) => v.verb).filter((v) => v !== "accept"),',
      );
      if (changed === text) throw new Error("the verb select was not found to rewrite");
      return changed;
    });
    const give = GIVES[1];
    if (give === undefined) throw new Error("no give");
    const ran = await play(give.instruction, [
      ...endpoints(model(goal(give.expect)), offerThenStep(give.moves)),
      "--url",
      base,
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({
      kind: "stuck",
      loop: give.moves.length + 2,
      best: null,
      pending: { event: "e1", subkind: "exchange.offer", move: "set verb to accept" },
    });
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(steppedWhileOffered(loops)).toEqual([]);
    expect(ran.stderr).toContain("exchange.offer");
  }, 60_000);
});

/** A plan's step as the model writes it. */
function step(actor: string, verb: string, fields: Record<string, string> = {}) {
  return { actor, verb, fields };
}

/** The decision kinds of a run's loops, in order. */
function kinds(loops: LoopRecord[]): string[] {
  return loops.map((entry) => entry.decision.kind);
}

describe("the plan: code performs the target's typed steps, resolving and waiting out what stands between them", () => {
  test("each give reaches its end state through plan and resolve loops alone, every noul below T_ACT", async () => {
    const gives = [
      {
        instruction: "have Glitch give Rogue the stimpak",
        expect: { holder: { item: "stimpak", person: "rogue" } },
        steps: [
          step("glitch", "offer", { target: "rogue", item: "stimpak" }),
          step("rogue", "accept", { item: "stimpak" }),
        ],
        actions: [
          "set verb to offer",
          "set target to rogue",
          "set item to stimpak",
          "press Act",
          "set actor to rogue",
          "set verb to accept",
          "press Act",
          null,
        ],
      },
      {
        instruction: "have Rogue give Glitch the data shard",
        expect: { holder: { item: "data-shard", person: "glitch" } },
        steps: [
          step("rogue", "offer", { target: "glitch", item: "data-shard" }),
          step("glitch", "accept", { item: "data-shard" }),
        ],
        actions: [
          "set actor to rogue",
          "set verb to offer",
          "set item to data-shard",
          "press Act",
          "set actor to glitch",
          "set verb to accept",
          "press Act",
          null,
        ],
      },
    ];
    for (const give of gives) {
      const target = { ...goal(give.expect), steps: give.steps };
      const ran = await play(give.instruction, endpoints(model(target), preferring([])));
      const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
      const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
      expect({ outcome: ran.record.outcome?.kind, history, kinds: kinds(loops) }).toEqual({
        outcome: "reached",
        history: ["exchange.offer", "exchange.accept"],
        kinds: ["plan", "plan", "plan", "plan", "resolve", "resolve", "resolve", "reached"],
      });
      expect(loops.map((entry) => entry.action)).toEqual(give.actions);
      // Every plan loop names the step it serves: the offer, the plan's first.
      for (const entry of loops.filter((l) => l.decision.kind === "plan")) {
        expect(entry.decision).toMatchObject({ kind: "plan", step: 0 });
      }
      expect(ran.record.target).toEqual(target);
      expect(ran.exitCode).toBe(0);
    }
  }, 60_000);

  test("a walk then a say-to: Step is pressed through wait loops until Mux arrives, then the say-to", async () => {
    const said = { said: { person: "mux", subkind: "speech.say-to" } };
    const target = {
      ...goal(said),
      steps: [step("mux", "depart", { exit: "west" }), step("mux", "say-to", { target: "glitch" })],
    };
    const ran = await play(
      "have Mux go out front and ask Glitch about the cell",
      endpoints(model(target, { words: LINE }), preferring([])),
    );
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
    expect({ outcome: ran.record.outcome?.kind, kinds: kinds(loops) }).toEqual({
      outcome: "reached",
      kinds: ["plan", "plan", "wait", "wait", "plan", "plan", "plan", "reached"],
    });
    expect(loops.map((entry) => entry.action)).toEqual([
      "set actor to mux",
      "press Act",
      "press Step",
      "press Step",
      "set verb to say-to",
      "type the words into words",
      "press Act",
      null,
    ]);
    expect(loops[2]?.decision).toMatchObject({
      kind: "wait",
      pending: { event: "e1", subkind: "physical.depart" },
    });
    expect(loops.slice(4, 7).map((entry) => entry.decision)).toEqual(
      loops.slice(4, 7).map(() => expect.objectContaining({ kind: "plan", step: 1 })),
    );
    expect(history).toEqual([
      "physical.depart",
      "time.tick",
      "time.tick",
      "physical.arrive",
      "speech.say-to",
    ]);
    // Code decided the run writes words: the end state is of kind said; the model said it needs none.
    expect(ran.record.words).toBe(LINE);
    expect(ran.exitCode).toBe(0);
  }, 60_000);

  test("a step naming an exit the page lacks ends no-such-action naming the exit", async () => {
    const j = preferring([]);
    const target = {
      ...goal({ location: { person: "glitch", room: "back-room" } }),
      steps: [step("glitch", "depart", { exit: "north" })],
    };
    const ran = await play("send Glitch north", endpoints(model(target), j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(JSON.stringify(ran.record.outcome)).toContain('the page shows no exit \\"north\\"');
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
  }, 60_000);

  test("a step the bench refuses ends the plan, and the next loop is led by choose()", async () => {
    // Rogue holds no stimpak: the offer is refused, so the plan's accept is never tried.
    const target = {
      ...goal({ holder: { item: "stimpak", person: "rogue" } }),
      steps: [
        step("rogue", "offer", { target: "glitch", item: "stimpak" }),
        step("glitch", "accept", { item: "stimpak" }),
      ],
    };
    const ran = await play("have Rogue get the stimpak", [
      ...endpoints(model(target), preferring(["press Step"])),
      "--max-loops",
      "6",
    ]);
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(kinds(loops)).toEqual(["plan", "plan", "plan", "plan", "act", "act"]);
    expect(loops.map((entry) => entry.action)).toEqual([
      "set actor to rogue",
      "set verb to offer",
      "set item to stimpak",
      "press Act",
      "press Step",
      "press Step",
    ]);
    expect(loops[4]?.state).toContain("refused: not-holding");
    expect(ran.record.outcome).toEqual({ kind: "ceiling", loops: 6 });
  }, 60_000);
});

describe("C16: reached is the bench's check, never the done noul", () => {
  test("a done noul of 0.99 on every loop does not end the run before Mux has spoken", async () => {
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const j = preferring(MUX_SAY_MOVES, 0.99);
    const ran = await play("have Mux say something funny", endpoints(m, j));
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
    expect({ outcome: ran.record.outcome, history }).toEqual({
      outcome: { kind: "reached", loop: 5, done: 0.99 },
      history: ["speech.say"],
    });
    expect(loops.map((entry) => entry.held)).toEqual([false, false, false, false, true]);
    expect(loops.map((entry) => entry.answers.done)).toEqual([0.99, 0.99, 0.99, 0.99, 0.99]);
    expect(loops.map((entry) => entry.action)).toEqual([...MUX_SAY_MOVES, null]);
    expect(ran.exitCode).toBe(0);
  }, 60_000);
});

describe("C7: a refusal from either client stops the run naming its kind", () => {
  const TARGET = goal({ location: { person: "glitch", room: "back-room" } });

  /** Each stop leaves run.json naming it and every file written before it. */
  function expectStopped(ran: Ran, kind: string, call: string): void {
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toMatchObject({ kind: "stopped", stopped: { kind, call } });
    expect(ran.record.stopped).toMatchObject({ kind, call });
    expect(ran.stderr).toContain(`stopped: ${kind}`);
    expect(RUN_FILES.filter((file) => !existsSync(join(ran.runDir, file)))).toEqual([]);
  }

  test("status: the decisions endpoint answers 500 on the second loop", async () => {
    const j = preferring(["press Step"], NO_DONE, (n) =>
      n === 2 ? new Response("upstream exploded", { status: 500 }) : null,
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
    const j = preferring([]);
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
    expect(ran.record.target).toEqual({ ...TARGET, steps: [] });
  }, 60_000);

  test("config: a key name that resolves to nothing stops before any request", async () => {
    const m = model(TARGET);
    const j = preferring([]);
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

/** An end state the committed world holds from boot: a run toward it is reached on its first loop. */
const ROGUE_HOLDS_SHARD = goal({ holder: { item: "data-shard", person: "rogue" } });

describe("the key goes only where it is named, never in the clear, and never into a message", () => {
  const FAKE_SECRET = "sk-or-v1-FAKESECRET0000000000";

  async function spawned(cmd: string[], env: Record<string, string | undefined> = process.env) {
    const proc = Bun.spawn(cmd, { cwd: ROOT, env, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { stdout, stderr, exitCode };
  }

  test("an endpoint override is sent no key unless --key-name names one for it", async () => {
    const m = model(ROGUE_HOLDS_SHARD);
    const j = preferring([]);
    const ran = await play("keep the data shard with Rogue", endpoints(m, j));
    expect(ran.record.outcome?.kind).toBe("reached");
    expect([m.authorized, j.authorized]).toEqual([[false], [false]]);
  }, 60_000);

  test("a named key is never sent over plain http to another machine", async () => {
    const elsewhere = "http://strata-test.invalid/";
    const ran = await play("send Glitch east", [
      "--model-endpoint",
      elsewhere,
      "--jev-endpoint",
      elsewhere,
      "--key-name",
      "strata-test-no-such-key",
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.stopped).toMatchObject({ kind: "config", call: "target" });
    expect(ran.record.stopped?.message).toContain("https");
    expect(ran.record.stopped?.message).toContain("strata-test.invalid");
  }, 60_000);

  test("a malformed apiconf config is named without the parser's detail, which quotes key lines", async () => {
    const home = mkdtempSync(join(tmpdir(), "strata-apiconf-"));
    temps.push(home);
    const config = join(home, ".config", "apiconf", "config.toml");
    mkdirSync(dirname(config), { recursive: true });
    // One typo, an unclosed quote, on the line after a key's value.
    writeFileSync(
      config,
      `[keys.sable-openrouter]\nvalue = "${FAKE_SECRET}"\nnote = "personal key\n`,
    );
    const code = [
      `import { DECISIONS_URL, postJson } from ${JSON.stringify(join(ROOT, "src", "player", "jev.ts"))};`,
      `console.log(JSON.stringify(await postJson(DECISIONS_URL, "decisions", {}, {})));`,
    ].join("\n");
    const ran = await spawned([process.execPath, "-e", code], { ...process.env, HOME: home });
    expect(ran.exitCode).toBe(0);
    const posted = JSON.parse(ran.stdout) as {
      ok: boolean;
      refusal: { kind: string; message: string };
    };
    expect(posted).toMatchObject({ ok: false, refusal: { kind: "config" } });
    expect(posted.refusal.message).toContain("sable-openrouter");
    expect(posted.refusal.message).toContain(config);
    expect(ran.stdout.includes("FAKESECRET")).toBe(false);
    expect(ran.stderr.includes("FAKESECRET")).toBe(false);
  }, 30_000);

  test("there is no flag that takes a key on the command line", async () => {
    const dir = mkdtempSync(join(tmpdir(), "strata-player-test-"));
    temps.push(dir);
    const corpus = join(dir, "runs");
    const ran = await spawned([
      process.execPath,
      "run",
      MAIN,
      "send Glitch east",
      "--tick-minutes",
      "10",
      "--corpus",
      corpus,
      "--key",
      "stand-in-key",
    ]);
    expect(ran.exitCode).toBe(2);
    expect(ran.stderr).toContain("--key");
    expect(ran.stderr).not.toContain("[--key <key>]");
    expect(existsSync(corpus)).toBe(false);
  }, 30_000);
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
    const ran = await play("have Rogue attack Glitch", endpoints(m, preferring([])));
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(ran.record.calls).toEqual([{ client: "model", purpose: "target", costUsd: null }]);
    expect(ran.record.unreportedCosts).toBe(1);
    expect(ran.record.costUsd).toBe(0);
  }, 60_000);
});

describe("a bench read that fails after the run is its own failure, kept apart from the outcome", () => {
  test("a history route answering 500 keeps the run reached, names the route, and writes no history", async () => {
    // The player's own read of the history fails; the page's reads, and the loop's, do not.
    const base = proxied(undefined, (path) =>
      path === "/api/events" ? new Response("history unavailable", { status: 500 }) : null,
    );
    const ran = await play("keep the data shard with Rogue", [
      ...endpoints(model(ROGUE_HOLDS_SHARD), preferring([])),
      "--url",
      base,
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "reached", loop: 1, done: NO_DONE });
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
