import { afterAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
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
import { useAccountBrowsers } from "harness/page.ts";
import { RULE_AUTHOR, T_ACT, T_DONE } from "harness/rule.ts";
import type { LoopRecord, RunRecord } from "harness/run.ts";
import * as scoring from "harness/score.ts";
import { GRID, type ScoreFile, scorePath } from "harness/score.ts";
import type { WorldEvent } from "../src/engine/events.ts";

const ROOT = join(import.meta.dir, "..");
// Every score run below is a child process; each inherits where the account's browsers are.
useAccountBrowsers();
const SCORE = join(ROOT, "src", "adapter", "score.ts");
const CALIBRATION = join(ROOT, "corpus", "goals", "calibration.json");

const MODEL_COST = 0.0002;
const JEV_COST = 0.00002;
/** Scripted noul values, derived from the rule's thresholds so they hold whatever calibration sets. */
const YES_DONE = Math.min(1, T_DONE + 0.05);
const FAVOURED = Math.min(1, T_ACT + 0.05);
const PASSED_OVER = T_ACT * 0.3;
const LINE = "Nothing in this bar runs on time, least of all me.";
/** Endpoints nothing answers at: a refused set that ran anyway would stop at its first call. */
const NOWHERE = [
  "--model-endpoint",
  "http://127.0.0.1:1/",
  "--jev-endpoint",
  "http://127.0.0.1:1/",
];

const temps: string[] = [];
const stops: (() => void)[] = [];
afterAll(() => {
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

type Scripted = {
  instruction: string;
  target: unknown;
  /** The candidate Jev favours on each call, in order; once they run out, nothing is favoured. */
  steps: string[];
  /** A favoured step's noul in place of FAVOURED, by its description. */
  scores?: Record<string, number>;
};

/** A favoured score the rule's T_ACT passes, but a higher T_ACT in the sweep does not. */
const MID_ACT = (T_ACT + FAVOURED) / 2;

/** The giver's moves that record Rogue's offer of the shard to Glitch. */
const OFFER_STEPS = [
  "set actor to rogue",
  "set verb to offer",
  "set item to data-shard",
  "press Act",
];
/**
 * Favoured on the three loops after the offer, while code derives the accept: a replay that chose
 * by score there would leave the recorded path, so only one that follows resolve loops holds.
 */
const STEP_WHILE_OFFERED = ["press Step", "press Step", "press Step"];

const MUX_SAY_STEPS = [
  "set actor to mux",
  "set verb to say",
  "type the words into words",
  "press Act",
];

const SHARD_TO_GLITCH = { holder: { item: "data-shard", person: "glitch" } };
const MUX_SAYS = { said: { person: "mux", subkind: "speech.say" } };

/**
 * One goal per expectation type, each with its model target and scripted Jev answers, and two
 * whose runs reach the model's end state while the goal file's expectation does not hold.
 */
const GOALS: (Scripted & { id: string; expect: unknown })[] = [
  {
    id: "give-shard",
    instruction: "have Rogue give Glitch the data shard",
    expect: SHARD_TO_GLITCH,
    target: { kind: "goal", expect: SHARD_TO_GLITCH, needsWords: false },
    steps: [...OFFER_STEPS, ...STEP_WHILE_OFFERED],
  },
  {
    // Glitch's depart opens a transit whose arrival leaves the end state: code presses Step.
    id: "glitch-east",
    instruction: "send Glitch to the Back Room",
    expect: { location: { person: "glitch", room: "back-room" } },
    target: {
      kind: "goal",
      expect: { location: { person: "glitch", room: "back-room" } },
      needsWords: false,
    },
    steps: ["press Act"],
  },
  {
    id: "mux-says",
    instruction: "have Mux say something",
    expect: MUX_SAYS,
    target: { kind: "goal", expect: MUX_SAYS, needsWords: true },
    steps: MUX_SAY_STEPS,
    scores: { "type the words into words": MID_ACT },
  },
  {
    id: "moon",
    instruction: "have Rogue fly to the moon",
    expect: { outcome: "no-such-action" },
    target: { kind: "no-such-action", reason: "no verb flies" },
    steps: [],
  },
  {
    // The model's end state has Glitch hold the shard, which the run reaches; the file names Rogue.
    id: "shard-wrong-holder",
    instruction: "have Rogue hand Glitch the data shard",
    expect: { holder: { item: "data-shard", person: "rogue" } },
    target: { kind: "goal", expect: SHARD_TO_GLITCH, needsWords: false },
    steps: [...OFFER_STEPS, ...STEP_WHILE_OFFERED],
  },
  {
    // Rogue offers the shard and Mux speaks, the model's end state; Rogue never says anything.
    // The offer stands throughout, but no resolution of it leaves a said end state.
    id: "rogue-says-wrong-speaker",
    instruction: "have Rogue say something",
    expect: { said: { person: "rogue", subkind: "speech.say" } },
    target: { kind: "goal", expect: MUX_SAYS, needsWords: true },
    steps: [...OFFER_STEPS, ...MUX_SAY_STEPS],
  },
  {
    // The model's plan, the giver's offer then the receiver's accept, leads every move; Jev favours
    // nothing, so a replay that chose by score on a plan loop would leave the recorded path.
    id: "stimpak-by-plan",
    instruction: "have Glitch give Rogue the stimpak",
    expect: { holder: { item: "stimpak", person: "rogue" } },
    target: {
      kind: "goal",
      expect: { holder: { item: "stimpak", person: "rogue" } },
      needsWords: false,
      steps: [
        { actor: "glitch", verb: "offer", fields: { target: "rogue", item: "stimpak" } },
        { actor: "rogue", verb: "accept", fields: { item: "stimpak" } },
      ],
    },
    steps: [],
  },
];

function serve(answer: (body: Record<string, unknown>) => Response): {
  url: string;
  calls: number;
  /** Each request's JSON body, in order. */
  bodies: Record<string, unknown>[];
} {
  const counter = { url: "", calls: 0, bodies: [] as Record<string, unknown>[] };
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      counter.calls++;
      const body = (await request.json()) as Record<string, unknown>;
      counter.bodies.push(body);
      return answer(body);
    },
  });
  stops.push(() => void server.stop(true));
  counter.url = `http://127.0.0.1:${server.port}/`;
  return counter;
}

/**
 * The chat stand-in: the scripted target for the goal named in the prompt, or the line of words,
 * each answered with the provider `providerOf` gives for its request (no provider key when none).
 */
function modelStandIn(
  goals: Scripted[] = GOALS,
  providerOf: (body: Record<string, unknown>) => string | undefined = () => undefined,
) {
  return serve((body) => {
    const prompt = String((body.messages as { content: string }[])[0]?.content);
    const goal = goals.find((g) => prompt.includes(`Instruction: ${g.instruction}\n`));
    const content = prompt.includes('{"words"') ? { words: LINE } : goal?.target;
    const provider = providerOf(body);
    return Response.json({
      ...(provider === undefined ? {} : { provider }),
      choices: [{ message: { content: JSON.stringify(content ?? {}) } }],
      usage: { cost: MODEL_COST },
    });
  });
}

/**
 * The decisions stand-in: per goal, favour the next scripted step. Done is answered yes on every
 * call: it decides nothing.
 */
function jevStandIn(goals: (Scripted & { id: string })[] = GOALS) {
  const calls = new Map<string, number>();
  return serve((body) => {
    const state = String(body.state);
    const questions = body.questions as Record<string, { instructions: string }>;
    const goal = goals.find((g) => state.startsWith(`Goal: ${g.instruction}\n`));
    if (goal === undefined) return new Response("no such goal", { status: 400 });
    const n = calls.get(goal.id) ?? 0;
    calls.set(goal.id, n + 1);
    const step = goal.steps[n];
    const answers: Record<string, { noul: number }> = {};
    for (const [key, q] of Object.entries(questions)) {
      if (key === "done") answers[key] = { noul: YES_DONE };
      else if (step !== undefined && q.instructions.includes(`"${step}"`)) {
        answers[key] = { noul: goal.scores?.[step] ?? FAVOURED };
      } else answers[key] = { noul: PASSED_OVER };
    }
    return Response.json({ answers, usage: { cost: JEV_COST } });
  });
}

/**
 * Run score as the operator does. `stdin`, when given, is written to a stdin left open, as a
 * terminal's is: the process must exit on its own once its goals are done; one still running
 * `bound` after it started is killed, and its exit code is null.
 */
async function score(
  goals: string,
  corpus: string,
  flags: string[],
  stdin?: string,
  bound = 60_000,
) {
  const proc = Bun.spawn(
    [
      process.execPath,
      "run",
      SCORE,
      "--goals",
      goals,
      "--tick-minutes",
      "10",
      "--corpus",
      corpus,
      ...flags,
    ],
    {
      cwd: ROOT,
      env: process.env,
      stdin: stdin === undefined ? "ignore" : "pipe",
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  if (stdin !== undefined && proc.stdin !== undefined && typeof proc.stdin !== "number") {
    proc.stdin.write(stdin);
    await proc.stdin.flush();
  }
  const output = Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const exited = await Promise.race([
    proc.exited.then(() => true),
    Bun.sleep(bound).then(() => false),
  ]);
  if (!exited) proc.kill();
  const [stdout, stderr] = await output;
  return { stdout, stderr, exitCode: exited ? proc.exitCode : null };
}

function hash(file: string): string {
  return existsSync(file) ? createHash("sha256").update(readFileSync(file)).digest("hex") : "";
}

describe("C8: scoring a goal set by expected end states", () => {
  test("the rule's own calibration set is refused on a plain score, naming both authors, writing nothing", async () => {
    const set = JSON.parse(readFileSync(CALIBRATION, "utf8")) as { author: string; set: string };
    expect(set.author).toBe(RULE_AUTHOR);
    const scoreFile = join(dirname(CALIBRATION), `${set.set}.score.json`);
    const before = hash(scoreFile);
    const dir = mkdtempSync(join(tmpdir(), "strata-score-"));
    temps.push(dir);
    const corpus = join(dir, "runs");
    const ran = await score(CALIBRATION, corpus, NOWHERE);
    expect(ran.exitCode).toBe(1);
    expect(ran.stderr).toContain(`goal file's author "${set.author}"`);
    expect(ran.stderr).toContain(`the rule's author "${RULE_AUTHOR}"`);
    expect(existsSync(corpus)).toBe(false);
    expect(hash(scoreFile)).toBe(before);
  }, 30_000);

  /** A one-goal set named `set`, by another author, written at <dir>/goals/<file>. */
  function goalFileAt(file: string, set: string): { dir: string; goals: string } {
    const dir = mkdtempSync(join(tmpdir(), "strata-score-"));
    temps.push(dir);
    const goals = join(dir, "goals", file);
    mkdirSync(dirname(goals));
    const goal = {
      id: "moon",
      instruction: "have Rogue fly to the moon",
      expect: { outcome: "no-such-action" },
    };
    writeFileSync(goals, JSON.stringify({ set, author: "a test", goals: [goal] }));
    return { dir, goals };
  }

  test("a set that is not a plain name is refused before any goal runs, writing nothing", async () => {
    const { dir, goals } = goalFileAt("escape.json", "../escape");
    const corpus = join(dir, "runs");
    const ran = await score(goals, corpus, NOWHERE);
    expect(ran.exitCode).toBe(2);
    expect(ran.stderr).toContain("set");
    expect(existsSync(join(dir, "escape.score.json"))).toBe(false);
    expect(existsSync(corpus)).toBe(false);
  }, 30_000);

  test("a set named for another goal file is refused, leaving that file's score untouched", async () => {
    const { dir, goals } = goalFileAt("blind-1.json", "calibration");
    const recorded = join(dir, "goals", "calibration.score.json");
    writeFileSync(recorded, "the calibration record\n");
    const corpus = join(dir, "runs");
    const ran = await score(goals, corpus, NOWHERE);
    expect(ran.exitCode).toBe(1);
    expect(ran.stderr).toContain('"calibration"');
    expect(ran.stderr).toContain('"blind-1"');
    expect(readFileSync(recorded, "utf8")).toBe("the calibration record\n");
    expect(existsSync(corpus)).toBe(false);
  }, 30_000);

  test("another author's set: every goal on its own bench, each expectation checked, the sweep's best pair", async () => {
    const dir = mkdtempSync(join(tmpdir(), "strata-score-"));
    temps.push(dir);
    const goalsFile = join(dir, "scripted.json");
    writeFileSync(
      goalsFile,
      JSON.stringify({
        set: "scripted",
        author: "a test, not the rule's author",
        goals: GOALS.map(({ id, instruction, expect }) => ({ id, instruction, expect })),
      }),
    );
    const m = modelStandIn();
    const j = jevStandIn();
    const corpus = join(dir, "runs");
    const ran = await score(goalsFile, corpus, [
      "--model-endpoint",
      m.url,
      "--jev-endpoint",
      j.url,
      "--sweep",
    ]);
    expect(ran.stderr).toBe("");
    expect(ran.exitCode).toBe(0);

    const written = JSON.parse(
      readFileSync(scorePath(goalsFile, "scripted", undefined), "utf8"),
    ) as ScoreFile;
    // Five goals hold; two reached the model's end state, but the file's does not hold.
    expect(written.reached).toEqual({ held: 5, of: 7 });
    // Loops and cost per goal, derived by hand from the scripted answers: one Jev call per loop
    // (each move, each move code derives, and the loop that finds the end state holding), one
    // model call for the target and one more for the words. The give: four offer moves, then set
    // actor to glitch, set verb to accept and press Act by resolve, then reached: 8 loops. The
    // depart: press Act, then press Step by resolve, then reached: 3. The plan's give: set verb to
    // offer, set target to rogue, set item to stimpak and press Act by plan, then the accept's
    // three moves by resolve, then reached: 8.
    const expected = {
      "give-shard": {
        outcome: "reached",
        loops: 8,
        costUsd: MODEL_COST + 8 * JEV_COST,
        held: true,
      },
      "glitch-east": {
        outcome: "reached",
        loops: 3,
        costUsd: MODEL_COST + 3 * JEV_COST,
        held: true,
      },
      "mux-says": {
        outcome: "reached",
        loops: 5,
        costUsd: 2 * MODEL_COST + 5 * JEV_COST,
        held: true,
      },
      moon: { outcome: "no-such-action", loops: 0, costUsd: MODEL_COST, held: true },
      "shard-wrong-holder": {
        outcome: "reached",
        loops: 8,
        costUsd: MODEL_COST + 8 * JEV_COST,
        held: false,
      },
      "rogue-says-wrong-speaker": {
        outcome: "reached",
        loops: 9,
        costUsd: 2 * MODEL_COST + 9 * JEV_COST,
        held: false,
      },
      "stimpak-by-plan": {
        outcome: "reached",
        loops: 8,
        costUsd: MODEL_COST + 8 * JEV_COST,
        held: true,
      },
    };
    expect(written.perGoal.map((g) => g.id)).toEqual(Object.keys(expected));
    for (const goal of written.perGoal) {
      const want = expected[goal.id as keyof typeof expected];
      expect({ id: goal.id, outcome: goal.outcome, loops: goal.loops, held: goal.held }).toEqual({
        id: goal.id,
        outcome: want.outcome,
        loops: want.loops,
        held: want.held,
      });
      expect(goal.costUsd).toBeCloseTo(want.costUsd, 12);
    }
    expect(m.calls).toBe(9);
    expect(j.calls).toBe(41);

    // Each goal ran on its own fresh bench: each history starts at e1 and holds only its own acts.
    const runs = readdirSync(corpus).sort();
    expect(runs).toHaveLength(7);
    const histories = written.perGoal.map((goal) =>
      readFileSync(join(dir, goal.run, "events.jsonl"), "utf8")
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => JSON.parse(line) as WorldEvent),
    );
    expect(histories.map((events) => events.map((e) => e.subkind))).toEqual([
      ["exchange.offer", "exchange.accept"],
      ["physical.depart", "time.tick", "physical.arrive"],
      ["speech.say"],
      [],
      ["exchange.offer", "exchange.accept"],
      ["exchange.offer", "speech.say"],
      ["exchange.offer", "exchange.accept"],
    ]);
    for (const events of histories) {
      if (events.length > 0) expect(events[0]?.id).toBe("e1");
    }

    // Whether the run's own end state held as each loop read the page: only on the last loop,
    // where the run stopped reached, though Jev answered done yes on every loop.
    const records = written.perGoal.map((goal) =>
      readFileSync(join(dir, goal.run, "loops.jsonl"), "utf8")
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => JSON.parse(line) as LoopRecord),
    );
    const times = (n: number, held: boolean) => Array.from({ length: n }, () => held);
    expect(records.map((loops) => loops.map((entry) => entry.held))).toEqual([
      [...times(7, false), true],
      [...times(2, false), true],
      [...times(4, false), true],
      [],
      [...times(7, false), true],
      [...times(8, false), true],
      [...times(7, false), true],
    ]);
    // The loops code derived: the give's accept moves, the depart's Step, and the plan's offer.
    expect(records.map((loops) => loops.map((entry): string => entry.decision.kind))).toEqual([
      ["act", "act", "act", "act", "resolve", "resolve", "resolve", "reached"],
      ["act", "resolve", "reached"],
      ["act", "act", "act", "act", "reached"],
      [],
      ["act", "act", "act", "act", "resolve", "resolve", "resolve", "reached"],
      [...Array.from({ length: 8 }, () => "act"), "reached"],
      ["plan", "plan", "plan", "plan", "resolve", "resolve", "resolve", "reached"],
    ]);

    // The sweep, by hand. T_DONE is its calibrated value in every row. The no-such-action goal
    // holds at every T_ACT, and so does the plan's give, its plan and resolve loops followed as
    // recorded though Jev favoured nothing; the two goals whose runs reach the model's end state
    // without the file's hold at none. Give-shard and glitch-east hold where their favoured moves
    // reach the act threshold, their resolve loops followed as recorded (on the give's, Jev
    // favoured press Step); mux-says needs its typing, scored lower, to reach it too.
    const heldAt = (act: number) =>
      2 + (act <= FAVOURED ? 2 : 0) + (act <= FAVOURED && act <= MID_ACT ? 1 : 0);
    const acts = GRID.act.filter((act) => heldAt(act) === 5);
    const best = { done: T_DONE, act: acts[Math.floor((acts.length - 1) / 2)] as number };
    expect(acts.length).toBeGreaterThan(0);
    // The grid holds a T_ACT that the typing misses and the other moves pass.
    expect(GRID.act.some((act) => heldAt(act) === 4)).toBe(true);
    expect(written.sweep?.grid).toEqual({ done: [T_DONE], act: GRID.act });
    expect(written.sweep?.results.map((r) => r.done)).toEqual(GRID.act.map(() => T_DONE));
    expect(written.sweep?.best).toEqual({ ...best, held: 5 });
    expect(written.sweep?.method.length).toBeGreaterThan(0);
    expect(ran.stdout).toContain(`best: T_DONE=${best.done} T_ACT=${best.act} (held 5 of 7)`);
    for (const pair of written.sweep?.results ?? []) {
      expect({ ...pair, held: heldAt(pair.act) }).toEqual(pair);
    }
  }, 240_000);
});

describe("A5: a goal whose run ended already-held is never counted held", () => {
  /** Rogue holds the shard from boot: the model types that end state for both goals. */
  const SHARD_WITH_ROGUE = { holder: { item: "data-shard", person: "rogue" } };
  const ALREADY: (Scripted & { id: string; expect: unknown })[] = [
    {
      id: "expects-another-state",
      instruction: "have Rogue hand Glitch the data shard",
      expect: SHARD_TO_GLITCH,
      target: { kind: "goal", expect: SHARD_WITH_ROGUE, needsWords: false },
      steps: [],
    },
    {
      id: "expects-the-held-state",
      instruction: "make sure Rogue keeps the data shard",
      expect: SHARD_WITH_ROGUE,
      target: { kind: "goal", expect: SHARD_WITH_ROGUE, needsWords: false },
      steps: [],
    },
  ];

  test("plainly and with --sweep: both goals score already-held, held false, at every T_ACT", async () => {
    const dir = mkdtempSync(join(tmpdir(), "strata-score-"));
    temps.push(dir);
    const goalsFile = join(dir, "already.json");
    writeFileSync(
      goalsFile,
      JSON.stringify({
        set: "already",
        author: "a test, not the rule's author",
        goals: ALREADY.map(({ id, instruction, expect }) => ({ id, instruction, expect })),
      }),
    );
    const m = modelStandIn(ALREADY);
    const j = jevStandIn(ALREADY);
    const endpoints = ["--model-endpoint", m.url, "--jev-endpoint", j.url];
    const scoreFile = scorePath(goalsFile, "already", undefined);

    for (const flags of [endpoints, [...endpoints, "--sweep"]]) {
      const ran = await score(goalsFile, join(dir, "runs"), flags);
      expect(ran.stderr).toBe("");
      expect(ran.exitCode).toBe(0);
      const written = JSON.parse(readFileSync(scoreFile, "utf8")) as ScoreFile;
      expect(written.perGoal.map((g) => [g.id, g.outcome, g.held, g.loops])).toEqual([
        ["expects-another-state", "already-held", false, 0],
        ["expects-the-held-state", "already-held", false, 0],
      ]);
      expect(written.reached).toEqual({ held: 0, of: 2 });
      if (flags.includes("--sweep")) {
        expect(written.sweep?.results.map((r) => r.held)).toEqual(GRID.act.map(() => 0));
      } else {
        expect(written.sweep).toBeUndefined();
      }
    }
    // Only the targets were asked for: no words, and no loop asked Jev anything.
    expect(m.calls).toBe(4);
    expect(j.calls).toBe(0);
  }, 120_000);
});

describe("H4: a headed score holds before every action of every goal", () => {
  test("two goals over one stdin: each performed action waits on its own line, goal after goal", async () => {
    const dir = mkdtempSync(join(tmpdir(), "strata-score-"));
    temps.push(dir);
    const goalsFile = join(dir, "headed.json");
    const two = GOALS.filter((g) => g.id === "glitch-east" || g.id === "mux-says");
    writeFileSync(
      goalsFile,
      JSON.stringify({
        set: "headed",
        author: "a test, not the rule's author",
        goals: two.map(({ id, instruction, expect }) => ({ id, instruction, expect })),
      }),
    );
    const m = modelStandIn();
    const j = jevStandIn();
    const corpus = join(dir, "runs");
    // One line per action the two goals perform (glitch-east's Act and Step, mux-says's four
    // moves) and one more after each goal, to close its browser.
    const ran = await score(
      goalsFile,
      corpus,
      ["--model-endpoint", m.url, "--jev-endpoint", j.url, "--headed"],
      "\n".repeat(8),
    );
    expect(ran.stderr).toBe("");
    expect(ran.exitCode).toBe(0);
    const written = JSON.parse(
      readFileSync(scorePath(goalsFile, "headed", undefined), "utf8"),
    ) as ScoreFile;
    expect(written.perGoal.map((g) => [g.id, g.outcome, g.held])).toEqual([
      ["glitch-east", "reached", true],
      ["mux-says", "reached", true],
    ]);
    const holds = ran.stdout.split("\n").filter((line) => line.startsWith("hold: "));
    expect(holds).toEqual([
      'hold: press Enter to perform "press Act"',
      'hold: press Enter to perform "press Step"',
      "hold: press Enter to close the browser",
      ...MUX_SAY_STEPS.map((move) => `hold: press Enter to perform "${move}"`),
      "hold: press Enter to close the browser",
    ]);
  }, 120_000);
});

/** A goal file for `set` at <dir>/<set>.json, by another author than the rule's. */
function writeSet(
  dir: string,
  set: string,
  goals: { id: string; instruction: string; expect: unknown }[],
): string {
  const file = join(dir, `${set}.json`);
  writeFileSync(
    file,
    JSON.stringify({
      set,
      author: "a test, not the rule's author",
      goals: goals.map(({ id, instruction, expect }) => ({ id, instruction, expect })),
    }),
  );
  return file;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "strata-score-"));
  temps.push(dir);
  return dir;
}

describe("M2: score refuses a --model that is not <provider>/<model> before any goal runs", () => {
  test("each refused id exits 2 naming --model and the value, writing no runs and no score", async () => {
    for (const bad of ["haiku", "../escape", ".hidden/x", "a/b/c", ""]) {
      const dir = tempDir();
      const goalsFile = writeSet(
        dir,
        "refused",
        GOALS.filter((g) => g.id === "moon"),
      );
      const m = modelStandIn();
      const j = jevStandIn();
      const corpus = join(dir, "runs");
      const ran = await score(goalsFile, corpus, [
        "--model",
        bad,
        "--model-endpoint",
        m.url,
        "--jev-endpoint",
        j.url,
      ]);
      expect({ bad, exitCode: ran.exitCode }).toEqual({ bad, exitCode: 2 });
      expect(ran.stderr).toContain(
        `--model must be an OpenRouter model id, <provider>/<model>, got "${bad}"`,
      );
      expect(existsSync(corpus)).toBe(false);
      expect(readdirSync(dir)).toEqual(["refused.json"]);
      expect([m.calls, j.calls]).toEqual([0, 0]);
    }
  }, 60_000);
});

describe("G3: every score lands in <set>.<slug>.<request>.score.json, the default's when no model is named, and counts providers", () => {
  const TWO = GOALS.filter((g) => g.id === "moon" || g.id === "mux-says");
  /** Mux's target is served by Z.AI and every words call by Fireworks; the moon's target reports none. */
  const providerOf = (body: Record<string, unknown>): string | undefined => {
    const prompt = String((body.messages as { content: string }[])[0]?.content);
    if (prompt.includes('{"words"')) return "Fireworks";
    return prompt.includes("Instruction: have Mux say something\n") ? "Z.AI" : undefined;
  };
  const RUNS = [
    {
      flags: [] as string[],
      model: "z-ai/glm-5.3-flash",
      file: "named.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json",
      request: "json-object-z-ai-retry",
    },
    {
      flags: ["--model", "anthropic/claude-haiku-5.5"],
      model: "anthropic/claude-haiku-5.5",
      file: "named.anthropic_claude-haiku-5.5.json-schema-retry.score.json",
      request: "json-schema-retry",
    },
  ];

  test("no --model writes the default's named file, --model Haiku its own, both beside an untouched <set>.score.json, providers counted per goal and per file", async () => {
    const dir = tempDir();
    const goalsFile = writeSet(dir, "named", TWO);
    const recorded = join(dir, "named.score.json");
    writeFileSync(recorded, "the committed score, as C9 reads it\n");
    const before = hash(recorded);
    expect(scorePath(goalsFile, "named", undefined)).toBe(join(dir, RUNS[0]?.file ?? ""));

    for (const run of RUNS) {
      const m = modelStandIn(TWO, providerOf);
      const j = jevStandIn(TWO);
      const ran = await score(goalsFile, join(dir, "runs"), [
        "--model-endpoint",
        m.url,
        "--jev-endpoint",
        j.url,
        ...run.flags,
      ]);
      expect(ran.stderr).toBe("");
      expect(ran.exitCode).toBe(0);
      // The registered score is neither replaced nor rewritten by any score.
      expect(hash(recorded)).toBe(before);
      const path = join(dir, run.file);
      expect(scorePath(goalsFile, "named", run.flags[1])).toBe(path);
      expect(ran.stdout).toContain(`score written to ${path}\n`);
      const written = readJson<ScoreFile>(path);
      expect([written.model, written.request]).toEqual([run.model, run.request]);
      // Both targets and the say's words were asked of the model, and each run records it.
      expect(m.bodies.map((body) => body.model)).toEqual([run.model, run.model, run.model]);
      // Each goal counts its run's model calls per reported provider, in first-seen order, and
      // never a Jev call; the file sums them in first-seen order over the goals.
      expect(written.perGoal.map((g) => [g.id, g.providers])).toEqual([
        [
          "mux-says",
          [
            { provider: "Z.AI", calls: 1 },
            { provider: "Fireworks", calls: 1 },
          ],
        ],
        ["moon", [{ provider: null, calls: 1 }]],
      ]);
      expect(written.providers).toEqual([
        { provider: "Z.AI", calls: 1 },
        { provider: "Fireworks", calls: 1 },
        { provider: null, calls: 1 },
      ]);
      for (const goal of written.perGoal) {
        const record = readJson<RunRecord>(join(dir, goal.run, "run.json"));
        expect([record.parameters.wordsModel, record.parameters.request]).toEqual([
          run.model,
          run.request,
        ]);
        const models = record.calls.filter((c) => c.client === "model");
        expect(goal.providers.reduce((sum, p) => sum + p.calls, 0)).toBe(models.length);
      }
    }
    expect(hash(recorded)).toBe(before);
    expect(
      readdirSync(dir)
        .filter((file) => file.endsWith(".score.json"))
        .sort(),
    ).toEqual(["named.score.json", ...RUNS.map((run) => run.file)].sort());
  }, 180_000);
});

/** A scripted answer of the chat stand-in: a message's content, or an HTTP status with no answer. */
type Answer = { content: string } | { status: number };

describe("M4: each goal records its target's validity and its words, and the score file sums them", () => {
  const json = (value: unknown): Answer => ({ content: JSON.stringify(value) });
  const ROGUE_SAYS = { said: { person: "rogue", subkind: "speech.say" } };
  const FIVE: (Scripted & {
    id: string;
    expect: unknown;
    target: Answer;
    words?: Answer;
  })[] = [
    {
      id: "written",
      instruction: "have Mux say something",
      expect: MUX_SAYS,
      target: json({ kind: "goal", expect: MUX_SAYS, needsWords: true }),
      words: json({ words: LINE }),
      steps: MUX_SAY_STEPS,
    },
    {
      id: "not-json",
      instruction: "have Glitch dance",
      expect: { outcome: "no-such-action" },
      target: { content: "Glitch dances, I suppose." },
      steps: [],
    },
    {
      // checked() turns it into no-such-action: the page shows no plasma rifle.
      id: "no-such-item",
      instruction: "have Glitch take the plasma rifle",
      expect: { outcome: "no-such-action" },
      target: json({
        kind: "goal",
        expect: { holder: { item: "plasma-rifle", person: "glitch" } },
      }),
      steps: [],
    },
    {
      id: "words-refused",
      instruction: "have Rogue say something",
      expect: ROGUE_SAYS,
      target: json({ kind: "goal", expect: ROGUE_SAYS }),
      words: { content: "Rogue says hi." },
      steps: [],
    },
    {
      id: "unanswered",
      instruction: "have Mux leave the bar",
      expect: { outcome: "no-such-action" },
      target: { status: 500 },
      steps: [],
    },
  ];

  test("valid, invalid, valid, valid and unanswered targets; words written, none, none, refused and none", async () => {
    const dir = tempDir();
    const goalsFile = writeSet(dir, "five", FIVE);
    const m = serve((body) => {
      const prompt = String((body.messages as { content: string }[])[0]?.content);
      const goal = FIVE.find(
        (g) =>
          prompt.includes(`Instruction: ${g.instruction}\n`) ||
          prompt.includes(`The instruction: ${g.instruction}\n`),
      );
      const answer = prompt.includes('{"words"') ? goal?.words : goal?.target;
      if (answer === undefined) return new Response("no such goal", { status: 400 });
      if ("status" in answer) return new Response("upstream exploded", { status: answer.status });
      return Response.json({
        choices: [{ message: { content: answer.content } }],
        usage: { cost: MODEL_COST },
      });
    });
    const j = jevStandIn(FIVE);
    const ran = await score(goalsFile, join(dir, "runs"), [
      "--model-endpoint",
      m.url,
      "--jev-endpoint",
      j.url,
    ]);
    expect(ran.exitCode).toBe(0);
    const written = readJson<ScoreFile>(scorePath(goalsFile, "five", undefined));
    expect(written.perGoal.map((g) => [g.id, g.outcome, g.target, g.words])).toEqual([
      ["written", "reached", "valid", { kind: "written", text: LINE }],
      ["not-json", "stopped", "invalid", { kind: "none" }],
      ["no-such-item", "no-such-action", "valid", { kind: "none" }],
      ["words-refused", "stopped", "valid", { kind: "refused" }],
      ["unanswered", "stopped", "unanswered", { kind: "none" }],
    ]);
    expect(written.targets).toEqual({ valid: 3, asked: 4 });
    expect(written.words).toEqual({ written: 1, refused: 1 });
    expect(written.model).toBe("z-ai/glm-5.3-flash");
  }, 120_000);
});

describe("S5: each goal and the score file count the retries asked and rescued", () => {
  const GLM = "z-ai/glm-5.3-flash";
  const NO_SUCH = JSON.stringify({ kind: "no-such-action", reason: "no verb for it" });
  const PROSE = "I would rather not say.";
  const MUX_SAY = { actor: "mux", verb: "say", fields: {} };
  /** Each goal's target answers, and its words answers, in the order the stand-in gives them. */
  const FOUR = [
    { id: "at-once", instruction: "have Rogue fly to the moon", target: [NO_SUCH] },
    { id: "rescued", instruction: "have Rogue swim the bay", target: [PROSE, NO_SUCH] },
    { id: "refused-twice", instruction: "have Glitch dance", target: [PROSE, PROSE] },
    {
      id: "words-rescued",
      instruction: "have Mux say something",
      target: [JSON.stringify({ kind: "goal", expect: MUX_SAYS, steps: [MUX_SAY] })],
      words: [PROSE, JSON.stringify({ words: LINE })],
    },
  ].map((g) => ({ words: [] as string[], ...g, expect: { outcome: "no-such-action" }, steps: [] }));

  test("asked 0, 1, 1 and 1, rescued 0, 1, 0 and 1, in a file named for the request", async () => {
    const dir = tempDir();
    const goalsFile = writeSet(dir, "four", FOUR);
    const before = join(dir, "four.z-ai_glm-5.3-flash.score.json");
    writeFileSync(before, "the json_object score, as the old report names it\n");
    const known = hash(before);
    const asked = new Map<string, number>();
    const m = serve((body) => {
      const prompt = String((body.messages as { content: string }[])[0]?.content);
      const words = prompt.includes('{"words"');
      const lead = words ? "The instruction" : "Instruction";
      const goal = FOUR.find((g) => prompt.includes(`${lead}: ${g.instruction}\n`));
      const key = `${goal?.id} ${words}`;
      const n = asked.get(key) ?? 0;
      asked.set(key, n + 1);
      const content = (words ? goal?.words : goal?.target)?.[n];
      if (content === undefined) return new Response("no such answer", { status: 400 });
      return Response.json({ choices: [{ message: { content } }], usage: { cost: MODEL_COST } });
    });
    const j = jevStandIn(FOUR);
    const flags = ["--model-endpoint", m.url, "--jev-endpoint", j.url, "--model", GLM];
    const ran = await score(goalsFile, join(dir, "runs"), flags);
    expect(ran.exitCode).toBe(0);
    // The score made before this request is left as it was.
    expect(hash(before)).toBe(known);
    const path = join(dir, "four.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json");
    expect(scorePath(goalsFile, "four", GLM)).toBe(path);
    expect(ran.stdout).toContain(`score written to ${path}\n`);
    const written = readJson<ScoreFile>(path);
    expect(written.request).toBe("json-object-z-ai-retry");
    expect(written.perGoal.map((g) => [g.id, g.retries])).toEqual([
      ["at-once", { asked: 0, rescued: 0 }],
      ["rescued", { asked: 1, rescued: 1 }],
      ["refused-twice", { asked: 1, rescued: 0 }],
      ["words-rescued", { asked: 1, rescued: 1 }],
    ]);
    expect(written.retries).toEqual({ asked: 3, rescued: 2 });
    // The final answers: a rescued target or line counts as given, a twice-refused one as invalid.
    expect(written.perGoal.map((g) => g.target)).toEqual(["valid", "valid", "invalid", "valid"]);
    expect(written.targets).toEqual({ valid: 3, asked: 4 });
    expect(written.words).toEqual({ written: 1, refused: 0 });
    // The page size covers every loop the set's runs recorded.
    expect(written.page.loops).toBe(written.perGoal.reduce((sum, g) => sum + g.loops, 0));
  }, 120_000);
});

describe("V15: every score file records the page size its runs' player read", () => {
  /** A loop as loops.jsonl records it, cut to its state: the rendered goal, then the page. */
  const loop = (page: string): Pick<LoopRecord, "state"> => ({
    state: `Goal: have Rogue give Glitch the data shard\nEnd state: glitch holds data-shard\n\nThe page now:\n${page}`,
  });

  test("three loops of 10, 20 and 60 page characters, and a set with no loops", () => {
    expect(typeof scoring.pageSize).toBe("function");
    const page = scoring.pageSize([
      loop("a".repeat(10)),
      loop("b\n".repeat(10)),
      loop("c".repeat(60)),
    ]);
    expect(page).toEqual({ loops: 3, meanChars: 30, maxChars: 60 });
    expect(scoring.pageSize([])).toEqual({ loops: 0, meanChars: 0, maxChars: 0 });
  });
});
