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
import type { LoopRecord } from "harness/run.ts";
import { GRID, type ScoreFile } from "harness/score.ts";
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
} {
  const counter = { url: "", calls: 0 };
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      counter.calls++;
      return answer((await request.json()) as Record<string, unknown>);
    },
  });
  stops.push(() => void server.stop(true));
  counter.url = `http://127.0.0.1:${server.port}/`;
  return counter;
}

/** The chat stand-in: the scripted target for the goal named in the prompt, or the line of words. */
function modelStandIn() {
  return serve((body) => {
    const prompt = String((body.messages as { content: string }[])[0]?.content);
    const goal = GOALS.find((g) => prompt.includes(`Instruction: ${g.instruction}\n`));
    const content = prompt.includes('{"words"') ? { words: LINE } : goal?.target;
    return Response.json({
      choices: [{ message: { content: JSON.stringify(content ?? {}) } }],
      usage: { cost: MODEL_COST },
    });
  });
}

/**
 * The decisions stand-in: per goal, favour the next scripted step. Done is answered yes on every
 * call: it decides nothing.
 */
function jevStandIn() {
  const calls = new Map<string, number>();
  return serve((body) => {
    const state = String(body.state);
    const questions = body.questions as Record<string, { instructions: string }>;
    const goal = GOALS.find((g) => state.startsWith(`Goal: ${g.instruction}\n`));
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

async function score(goals: string, corpus: string, flags: string[], stdin?: string) {
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
      stdin: stdin === undefined ? "ignore" : new Response(stdin),
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
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

    const written = JSON.parse(readFileSync(join(dir, "scripted.score.json"), "utf8")) as ScoreFile;
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
    const written = JSON.parse(readFileSync(join(dir, "headed.score.json"), "utf8")) as ScoreFile;
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
