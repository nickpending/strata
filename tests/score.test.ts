import { afterAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { WorldEvent } from "../src/engine/events.ts";
import { useAccountBrowsers } from "../src/player/page.ts";
import { RULE_AUTHOR, T_ACT, T_DONE } from "../src/player/rule.ts";
import { GRID, type ScoreFile } from "../src/player/score.ts";

const ROOT = join(import.meta.dir, "..");
// Every score run below is a child process; each inherits where the account's browsers are.
useAccountBrowsers();
const SCORE = join(ROOT, "src", "player", "score.ts");
const CALIBRATION = join(ROOT, "corpus", "goals", "calibration.json");

const MODEL_COST = 0.0002;
const JEV_COST = 0.00002;
/** Scripted noul values, derived from the rule's thresholds so they hold whatever calibration sets. */
const YES_DONE = Math.min(1, T_DONE + 0.05);
const NO_DONE = T_DONE * 0.3;
const FAVOURED = Math.min(1, T_ACT + 0.05);
const PASSED_OVER = T_ACT * 0.3;
const LINE = "Nothing in this bar runs on time, least of all me.";

const temps: string[] = [];
const stops: (() => void)[] = [];
afterAll(() => {
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

type Scripted = {
  instruction: string;
  target: unknown;
  /** The candidate Jev favours on each call, in order; once they run out, done is answered yes. */
  steps: string[];
};

/** Four goals, one per expectation type, each with its model target and scripted Jev answers. */
const GOALS: (Scripted & { id: string; expect: unknown })[] = [
  {
    id: "give-shard",
    instruction: "have Rogue give Glitch the data shard",
    expect: { holder: { item: "data-shard", person: "glitch" } },
    target: {
      kind: "action",
      actor: "rogue",
      verb: "offer",
      fields: { target: "glitch", item: "data-shard" },
      needsWords: false,
      done: "Does Glitch hold the data shard?",
    },
    steps: [
      "set actor to rogue",
      "set verb to offer",
      "set item to data-shard",
      "press Act",
      "set actor to glitch",
      "set verb to accept",
      "press Act",
    ],
  },
  {
    id: "glitch-east",
    instruction: "send Glitch to the Back Room",
    expect: { location: { person: "glitch", room: "back-room" } },
    target: {
      kind: "action",
      actor: "glitch",
      verb: "depart",
      fields: { exit: "east" },
      needsWords: false,
      done: "Is Glitch in the Back Room?",
    },
    steps: ["press Act", "press Step"],
  },
  {
    id: "mux-says",
    instruction: "have Mux say something",
    expect: { said: { person: "mux", subkind: "speech.say" } },
    target: {
      kind: "action",
      actor: "mux",
      verb: "say",
      needsWords: true,
      done: "Has Mux spoken?",
    },
    steps: ["set actor to mux", "set verb to say", "type the words into words", "press Act"],
  },
  {
    id: "moon",
    instruction: "have Rogue fly to the moon",
    expect: { outcome: "no-such-action" },
    target: { kind: "no-such-action", reason: "no verb flies" },
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

/** The decisions stand-in: per goal, favour the next scripted step; done once the steps run out. */
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
      if (key === "done") answers[key] = { noul: step === undefined ? YES_DONE : NO_DONE };
      else answers[key] = { noul: q.instructions.includes(`"${step}"`) ? FAVOURED : PASSED_OVER };
    }
    return Response.json({ answers, usage: { cost: JEV_COST } });
  });
}

async function score(goals: string, corpus: string, flags: string[]) {
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
    { cwd: ROOT, env: process.env, stdout: "pipe", stderr: "pipe" },
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
    const ran = await score(CALIBRATION, corpus, ["--key", "stand-in-key"]);
    expect(ran.exitCode).toBe(1);
    expect(ran.stderr).toContain(`goal file's author "${set.author}"`);
    expect(ran.stderr).toContain(`the rule's author "${RULE_AUTHOR}"`);
    expect(existsSync(corpus)).toBe(false);
    expect(hash(scoreFile)).toBe(before);
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
      "--key",
      "stand-in-key",
      "--sweep",
    ]);
    expect(ran.stderr).toBe("");
    expect(ran.exitCode).toBe(0);

    const written = JSON.parse(readFileSync(join(dir, "scripted.score.json"), "utf8")) as ScoreFile;
    expect(written.reached).toEqual({ held: 4, of: 4 });
    // Loops and cost per goal, derived by hand from the scripted answers: one Jev call per step
    // plus the loop that answers done, one model call for the target, one more for the words.
    const expected = {
      "give-shard": { outcome: "reached", loops: 8, costUsd: MODEL_COST + 8 * JEV_COST },
      "glitch-east": { outcome: "reached", loops: 3, costUsd: MODEL_COST + 3 * JEV_COST },
      "mux-says": { outcome: "reached", loops: 5, costUsd: 2 * MODEL_COST + 5 * JEV_COST },
      moon: { outcome: "no-such-action", loops: 0, costUsd: MODEL_COST },
    };
    expect(written.perGoal.map((g) => g.id)).toEqual(Object.keys(expected));
    for (const goal of written.perGoal) {
      const want = expected[goal.id as keyof typeof expected];
      expect({ id: goal.id, outcome: goal.outcome, loops: goal.loops, held: goal.held }).toEqual({
        id: goal.id,
        outcome: want.outcome,
        loops: want.loops,
        held: true,
      });
      expect(goal.costUsd).toBeCloseTo(want.costUsd, 12);
    }
    expect(m.calls).toBe(5);
    expect(j.calls).toBe(16);

    // Each goal ran on its own fresh bench: each history starts at e1 and holds only its own acts.
    const runs = readdirSync(corpus).sort();
    expect(runs).toHaveLength(4);
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
    ]);
    for (const events of histories) {
      if (events.length > 0) expect(events[0]?.id).toBe("e1");
    }

    // The sweep: every goal holds exactly where done passes on the last loop alone and the
    // favoured step still reaches the act threshold. Ties go to the median T_DONE among them
    // (the lower middle), then the median T_ACT at that T_DONE.
    const holdsAll = (done: number, act: number) =>
      NO_DONE < done && done <= YES_DONE && act <= FAVOURED;
    const dones = GRID.done.filter((done) => GRID.act.some((act) => holdsAll(done, act)));
    const done = dones[Math.floor((dones.length - 1) / 2)] as number;
    const acts = GRID.act.filter((act) => holdsAll(done, act));
    const best = { done, act: acts[Math.floor((acts.length - 1) / 2)] as number };
    expect(dones.length).toBeGreaterThan(0);
    expect(written.sweep?.best).toEqual({ ...best, held: 4 });
    expect(written.sweep?.grid).toEqual(GRID);
    expect(written.sweep?.method.length).toBeGreaterThan(0);
    expect(ran.stdout).toContain(`best: T_DONE=${best?.done} T_ACT=${best?.act} (held 4 of 4)`);
    for (const pair of written.sweep?.results ?? []) {
      expect(pair.held).toBe(holdsAll(pair.done, pair.act) ? 4 : 1);
    }
  }, 240_000);
});
