import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Comparison, RefusedCall } from "harness/compare.ts";
import { useAccountBrowsers } from "harness/page.ts";
import type { RunRecord } from "harness/run.ts";
import type { ScoreFile } from "harness/score.ts";
import { REQUEST } from "harness/words.ts";

const ROOT = join(import.meta.dir, "..");
// The fixture's scores are child processes; each inherits where the account's browsers are.
useAccountBrowsers();
const SCORE = join(ROOT, "src", "adapter", "score.ts");

const BASELINE = "test/baseline";
const CANDIDATE = "test/candidate";
const MODEL_COST = 0.0002;
const JEV_COST = 0.00002;
const LINE = "Nothing in this bar runs on time, least of all me.";

const temps: string[] = [];
const stops: (() => void)[] = [];
afterAll(() => {
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "strata-compare-"));
  temps.push(dir);
  return dir;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** A scripted answer of the chat stand-in: a message's content, or not JSON at all. */
const json = (value: unknown): string => JSON.stringify(value);
const NOT_JSON = "Sure, here is what I would do.";

const MUX_SAYS = { said: { person: "mux", subkind: "speech.say" } };
const ROGUE_SAYS = { said: { person: "rogue", subkind: "speech.say" } };
const GLITCH_IN_BACK = { location: { person: "glitch", room: "back-room" } };
const STIMPAK_TO_ROGUE = { holder: { item: "stimpak", person: "rogue" } };
const MUX_SAY = { actor: "mux", verb: "say", fields: {} };

type Scripted = {
  id: string;
  instruction: string;
  expect: unknown;
  /** Each model's target answer, and its words answer when the run asks for words. */
  answers: Record<string, { target: string | string[]; words?: string | string[] }>;
};

/**
 * Set one: a goal the baseline holds and the candidate does not, its candidate run stuck after a
 * plan of its own; and a goal both hold. Set two: a goal the candidate holds and the baseline does
 * not; a goal the baseline holds whose candidate target is refused as not JSON; and a goal whose
 * words both models answer with text that is not JSON. Each model has words of every kind.
 */
const SETS: { set: string; goals: Scripted[] }[] = [
  {
    set: "one",
    goals: [
      {
        id: "east",
        instruction: "send Glitch to the Back Room",
        expect: GLITCH_IN_BACK,
        answers: {
          [BASELINE]: {
            target: json({
              kind: "goal",
              expect: GLITCH_IN_BACK,
              steps: [{ actor: "glitch", verb: "depart", fields: { exit: "east" } }],
            }),
          },
          [CANDIDATE]: {
            target: json({ kind: "goal", expect: GLITCH_IN_BACK, steps: [MUX_SAY] }),
            words: json({ words: LINE }),
          },
        },
      },
      {
        id: "mux-says",
        instruction: "have Mux say something",
        expect: MUX_SAYS,
        answers: {
          [BASELINE]: {
            target: json({ kind: "goal", expect: MUX_SAYS, steps: [MUX_SAY] }),
            words: json({ words: LINE }),
          },
          [CANDIDATE]: {
            target: json({ kind: "goal", expect: MUX_SAYS, steps: [MUX_SAY] }),
            words: json({ words: "Mux has nothing nice to say." }),
          },
        },
      },
    ],
  },
  {
    set: "two",
    goals: [
      {
        id: "stimpak",
        instruction: "have Glitch give Rogue the stimpak",
        expect: STIMPAK_TO_ROGUE,
        answers: {
          [BASELINE]: { target: json({ kind: "goal", expect: STIMPAK_TO_ROGUE }) },
          [CANDIDATE]: {
            target: json({
              kind: "goal",
              expect: STIMPAK_TO_ROGUE,
              steps: [
                { actor: "glitch", verb: "offer", fields: { target: "rogue", item: "stimpak" } },
                { actor: "rogue", verb: "accept", fields: { item: "stimpak" } },
              ],
            }),
          },
        },
      },
      {
        id: "refused",
        instruction: "have Mux say hello",
        expect: MUX_SAYS,
        answers: {
          [BASELINE]: {
            target: json({ kind: "goal", expect: MUX_SAYS, steps: [MUX_SAY] }),
            words: json({ words: "Hello, whoever is paying." }),
          },
          [CANDIDATE]: { target: NOT_JSON },
        },
      },
      {
        id: "rogue-says",
        instruction: "have Rogue say something",
        expect: ROGUE_SAYS,
        answers: {
          [BASELINE]: { target: json({ kind: "goal", expect: ROGUE_SAYS }), words: NOT_JSON },
          [CANDIDATE]: { target: json({ kind: "goal", expect: ROGUE_SAYS }), words: NOT_JSON },
        },
      },
    ],
  },
];

function serve(answer: (body: Record<string, unknown>) => Response): string {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => answer((await request.json()) as Record<string, unknown>),
  });
  stops.push(() => void server.stop(true));
  return `http://127.0.0.1:${server.port}/`;
}

/**
 * The chat stand-in: each goal's answer for the model the request names; a list of answers is
 * given one per call, in order.
 */
function modelStandIn(sets: { goals: Scripted[] }[]): string {
  const goals = sets.flatMap((s) => s.goals);
  const asked = new Map<string, number>();
  return serve((body) => {
    const prompt = String((body.messages as { content: string }[])[0]?.content);
    const goal = goals.find(
      (g) =>
        prompt.includes(`Instruction: ${g.instruction}\n`) ||
        prompt.includes(`The instruction: ${g.instruction}\n`),
    );
    const scripted = goal?.answers[String(body.model)];
    const kind = prompt.includes('{"words"') ? "words" : "target";
    const key = `${body.model} ${goal?.id} ${kind}`;
    const n = asked.get(key) ?? 0;
    asked.set(key, n + 1);
    const answer = scripted?.[kind];
    const content = Array.isArray(answer) ? answer[n] : answer;
    if (content === undefined) return new Response("no such answer", { status: 400 });
    return Response.json({ choices: [{ message: { content } }], usage: { cost: MODEL_COST } });
  });
}

/** The decisions stand-in: every noul 0, so only code's plan and resolve loops act. */
function jevStandIn(): string {
  return serve((body) => {
    const questions = body.questions as Record<string, unknown>;
    const answers = Object.fromEntries(Object.keys(questions).map((key) => [key, { noul: 0 }]));
    return Response.json({ answers, usage: { cost: JEV_COST } });
  });
}

async function spawned(cmd: string[]) {
  const proc = Bun.spawn(cmd, { cwd: ROOT, env: process.env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

/** A fixture: <dir>/goals/<set>.json and both models' scores of each, their runs in <dir>/runs. */
async function fixtureOf(sets: { set: string; goals: Scripted[] }[]): Promise<string> {
  const fixture = tempDir();
  mkdirSync(join(fixture, "goals"));
  const model = modelStandIn(sets);
  const jev = jevStandIn();
  for (const { set, goals } of sets) {
    const file = join(fixture, "goals", `${set}.json`);
    writeFileSync(
      file,
      JSON.stringify({
        set,
        author: "a test, not the rule's author",
        goals: goals.map(({ id, instruction, expect }) => ({ id, instruction, expect })),
      }),
    );
    for (const named of [BASELINE, CANDIDATE]) {
      const ran = await spawned([
        process.execPath,
        "run",
        SCORE,
        "--goals",
        file,
        "--tick-minutes",
        "10",
        "--corpus",
        join(fixture, "runs"),
        "--model-endpoint",
        model,
        "--jev-endpoint",
        jev,
        "--model",
        named,
      ]);
      if (ran.exitCode !== 0) throw new Error(`score ${set} under ${named} failed: ${ran.stderr}`);
    }
  }
  return fixture;
}

/** The fixture of SETS. */
let fixture = "";

beforeAll(async () => {
  fixture = await fixtureOf(SETS);
}, 300_000);

const goalsOf = (dir: string, set: string) => join(dir, "goals", `${set}.json`);
const scoreOf = (dir: string, set: string, model: string) =>
  join(dir, "goals", `${set}.${model.replace("/", "_")}.${REQUEST}.score.json`);
const COMPARE_JSON = `test_candidate.vs.test_baseline.${REQUEST}.compare.json`;
const COMPARE_MD = `test_candidate.vs.test_baseline.${REQUEST}.compare.md`;

/** `bun run compare` over the sets of `dir` (SETS' two by default), as the operator runs it. */
function compare(dir: string, sets = ["one", "two"]) {
  return spawned([
    process.execPath,
    "run",
    "compare",
    "--baseline",
    BASELINE,
    "--candidate",
    CANDIDATE,
    ...sets.flatMap((set) => ["--goals", goalsOf(dir, set)]),
  ]);
}

/** Every refused call of `record`, in call order, as compare must show it. */
function refusedOf(record: RunRecord) {
  return record.calls.flatMap(({ purpose, retry, refused }) =>
    refused === undefined ? [] : [{ purpose, retry: retry === true, ...refused }],
  );
}

/** Every key of `value`, at any depth. */
function keysOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysOf);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, inner]) => [key, ...keysOf(inner)]);
}

/** The level-3 headings of the markdown section headed `## <title>`. */
function headingsUnder(markdown: string, title: string): string[] {
  const section = markdown.split("\n## ").find((part) => part.startsWith(title)) ?? "";
  return section
    .split("\n")
    .filter((line) => line.startsWith("### "))
    .map((line) => line.slice(4));
}

describe("M5: compare sets two models' scores side by side as a loss report, deciding nothing", () => {
  test("per set, losses, gains and words, each read from the score files and the runs they name", async () => {
    const dir = tempDir();
    cpSync(fixture, dir, { recursive: true });
    const ran = await compare(dir);
    // bun run echoes the script it runs on stderr; compare itself writes nothing there.
    expect(ran.stderr).not.toContain("compare: ");
    expect(ran.exitCode).toBe(0);
    expect(ran.stdout).toContain(`compare written to ${join(dir, "goals", COMPARE_JSON)} and `);
    const report = readJson<Comparison>(join(dir, "goals", COMPARE_JSON));
    const markdown = readFileSync(join(dir, "goals", COMPARE_MD), "utf8");
    expect([report.baseline, report.candidate]).toEqual([BASELINE, CANDIDATE]);

    const scores = Object.fromEntries(
      SETS.flatMap(({ set }) =>
        [BASELINE, CANDIDATE].map((model) => [
          `${set} ${model}`,
          readJson<ScoreFile>(scoreOf(dir, set, model)),
        ]),
      ),
    );
    const scored = (set: string, model: string) => scores[`${set} ${model}`] as ScoreFile;

    // Per set: each model's numbers equal its score file's, and the markdown's row carries them.
    expect(report.sets.map((row) => row.set)).toEqual(["one", "two"]);
    for (const row of report.sets) {
      for (const [side, model] of [
        ["baseline", BASELINE],
        ["candidate", CANDIDATE],
      ] as const) {
        const file = scored(row.set, model);
        const shown = row[side];
        expect(shown).toEqual({
          scoreFile: `${row.set}.${model.replace("/", "_")}.${REQUEST}.score.json`,
          reached: { count: file.reached.held, of: file.reached.of },
          targets: file.targets,
          words: file.words,
          costUsd: file.costUsd,
          unreportedCosts: file.unreportedCosts,
          retries: file.retries,
        });
        expect(markdown).toContain(
          `| ${row.set} | ${side} | ${model} | ${file.reached.held} of ${file.reached.of} | ${file.targets.valid} of ${file.targets.asked} | ${file.words.written} | ${file.words.refused} | ${file.retries.asked} | ${file.retries.rescued} | ${file.costUsd} | ${file.unreportedCosts} |\n`,
        );
      }
    }
    // The fixture's own counts, so the rows above are not vacuous.
    expect(report.sets.map((row) => [row.baseline.reached, row.candidate.reached])).toEqual([
      [
        { count: 2, of: 2 },
        { count: 1, of: 2 },
      ],
      [
        { count: 1, of: 3 },
        { count: 1, of: 3 },
      ],
    ]);

    const entryOf = (set: string, model: string, id: string) => {
      const entry = scored(set, model).perGoal.find((g) => g.id === id);
      if (entry === undefined) throw new Error(`no ${id} in ${set} under ${model}`);
      return entry;
    };
    /** A goal's run as compare must show it: read from the run.json its own score entry names. */
    const runOf = (set: string, model: string, id: string) => {
      const entry = entryOf(set, model, id);
      const record = readJson<RunRecord>(join(dir, "goals", entry.run, "run.json"));
      return {
        run: entry.run,
        outcome: record.outcome,
        target: record.target,
        stopped: record.stopped ?? null,
        refused: refusedOf(record),
      };
    };
    const moved = (set: string, id: string) => {
      const entry = entryOf(set, BASELINE, id);
      return {
        set,
        id,
        instruction: entry.instruction,
        expect: entry.expect,
        baseline: runOf(set, BASELINE, id),
        candidate: runOf(set, CANDIDATE, id),
      };
    };

    // Losses: exactly the goals the baseline held and the candidate did not, over both sets.
    expect(report.losses.map((g) => `${g.set}/${g.id}`)).toEqual(["one/east", "two/refused"]);
    expect(report.losses).toEqual([moved("one", "east"), moved("two", "refused")]);
    const [east, refused] = report.losses;
    // The candidate's east run stuck on a plan of its own, unlike the baseline's.
    expect(east?.candidate.outcome?.kind).toBe("stuck");
    expect(east?.candidate.target).toEqual({
      kind: "goal",
      expect: GLITCH_IN_BACK,
      steps: [MUX_SAY],
    });
    expect(east?.baseline.target).not.toEqual(east?.candidate.target);
    // The candidate's target for the say was refused: no target, the refusal as recorded.
    expect(refused?.candidate.target).toBeNull();
    expect(refused?.candidate.stopped).toMatchObject({ kind: "parse", call: "target" });

    // Gains: exactly the reverse, never a goal both held.
    expect(report.gains).toEqual([moved("two", "stimpak")]);

    // Words: every goal, both models' words as their score entries record them.
    const words = SETS.flatMap(({ set, goals }) =>
      goals.map(({ id }) => ({
        set,
        id,
        baseline: entryOf(set, BASELINE, id).words,
        candidate: entryOf(set, CANDIDATE, id).words,
      })),
    );
    expect(report.words).toEqual(words);
    const kinds = (side: "baseline" | "candidate") =>
      [...new Set(report.words.map((w) => w[side].kind))].sort();
    expect([kinds("baseline"), kinds("candidate")]).toEqual([
      ["none", "refused", "written"],
      ["none", "refused", "written"],
    ]);

    // The markdown names the same goals in the same sections, and every goal's words.
    expect(headingsUnder(markdown, "Losses")).toEqual(["one / east", "two / refused"]);
    expect(headingsUnder(markdown, "Gains")).toEqual(["two / stimpak"]);
    for (const row of report.words) expect(markdown).toContain(`| ${row.set} | ${row.id} | `);
    expect(markdown).toContain(`written: "${LINE}"`);

    // No verdict: no key and no line says a set or the whole held, holds or did not. Only the
    // retried goals state each model's held, as its score entry records it for that goal.
    const verdict = /\b(held|holds|did-not-hold|verdict)\b/i;
    expect(keysOf({ ...report, retries: [] }).filter((key) => verdict.test(key))).toEqual([]);
    const outsideRetries = markdown.replace(/\n## Retries\n.*?\n## /s, "\n## ");
    expect(outsideRetries.split("\n").filter((line) => verdict.test(line))).toEqual([]);
  }, 60_000);
});

describe("M6: compare refuses score files that are not like for like, writing nothing", () => {
  /** A copy of the fixture changed by `change`, compared: it must exit 1 with no compare file. */
  async function refused(change: (dir: string) => void) {
    const dir = tempDir();
    cpSync(fixture, dir, { recursive: true });
    change(dir);
    const ran = await compare(dir);
    expect(ran.exitCode).toBe(1);
    expect(readdirSync(join(dir, "goals")).filter((file) => file.includes(".compare."))).toEqual(
      [],
    );
    return { dir, stderr: ran.stderr };
  }

  function rewrite(file: string, edit: (score: ScoreFile) => ScoreFile): void {
    writeFileSync(file, `${JSON.stringify(edit(readJson<ScoreFile>(file)), null, 2)}\n`);
  }

  test("a candidate score file whose model is another id", async () => {
    let file = "";
    const { stderr } = await refused((dir) => {
      file = scoreOf(dir, "one", CANDIDATE);
      rewrite(file, (score) => ({ ...score, model: "test/other" }));
    });
    expect(stderr).toContain(file);
    expect(stderr).toContain("model");
    expect(stderr).toContain('"test/other"');
  }, 30_000);

  test("a score file made at other thresholds than the registered ones", async () => {
    let file = "";
    const { stderr } = await refused((dir) => {
      file = scoreOf(dir, "two", BASELINE);
      rewrite(file, (score) => ({
        ...score,
        rule: { ...score.rule, thresholds: { ...score.rule.thresholds, act: 0.45 } },
      }));
    });
    expect(stderr).toContain(file);
    expect(stderr).toContain("rule.thresholds");
  }, 30_000);

  test("a candidate score whose goals are in another order than the goal file's", async () => {
    let file = "";
    const { stderr } = await refused((dir) => {
      file = scoreOf(dir, "one", CANDIDATE);
      rewrite(file, (score) => ({ ...score, perGoal: [...score.perGoal].reverse() }));
    });
    expect(stderr).toContain(file);
    expect(stderr).toContain("perGoal");
  }, 30_000);

  test("a missing candidate score file", async () => {
    let file = "";
    const { stderr } = await refused((dir) => {
      file = scoreOf(dir, "two", CANDIDATE);
      rmSync(file);
    });
    expect(stderr).toContain(file);
  }, 30_000);

  test("a lost goal whose run.json is gone", async () => {
    let file = "";
    const { stderr } = await refused((dir) => {
      const east = readJson<ScoreFile>(scoreOf(dir, "one", CANDIDATE)).perGoal.find(
        (g) => g.id === "east",
      );
      file = join(dir, "goals", east?.run ?? "", "run.json");
      expect(existsSync(file)).toBe(true);
      rmSync(file);
    });
    expect(stderr).toContain(file);
  }, 30_000);
});

describe("S6: compare counts and lists the retries, on a path naming the request", () => {
  /** The candidate's two refused targets, the second longer than a refusal's 80-character excerpt. */
  const LOST = ["Let me think about the moon.", `No such trip: ${"the moon is far. ".repeat(6)}`];
  const SAY = json({ kind: "goal", expect: MUX_SAYS, steps: [MUX_SAY] });
  const NO_SUCH = json({ kind: "no-such-action", reason: "no verb flies" });
  /**
   * A goal nobody retried; one the baseline held and the candidate lost on a target refused twice;
   * and one both held, the baseline's words only after a rescued retry.
   */
  const RETRIED: { set: string; goals: Scripted[] }[] = [
    {
      set: "retried",
      goals: [
        {
          id: "steady",
          instruction: "have Glitch fly home",
          expect: { outcome: "no-such-action" },
          answers: { [BASELINE]: { target: NO_SUCH }, [CANDIDATE]: { target: NO_SUCH } },
        },
        {
          id: "lost",
          instruction: "have Rogue fly to the moon",
          expect: { outcome: "no-such-action" },
          answers: { [BASELINE]: { target: NO_SUCH }, [CANDIDATE]: { target: LOST } },
        },
        {
          id: "rescued",
          instruction: "have Mux say something",
          expect: MUX_SAYS,
          answers: {
            [BASELINE]: { target: SAY, words: [NOT_JSON, json({ words: LINE })] },
            [CANDIDATE]: { target: SAY, words: json({ words: LINE }) },
          },
        },
      ],
    },
  ];
  let retried = "";
  beforeAll(async () => {
    retried = await fixtureOf(RETRIED);
  }, 300_000);

  test("the retries columns, both refused answers whole, and a Retries section of exactly the retried goals", async () => {
    const dir = tempDir();
    cpSync(retried, dir, { recursive: true });
    const before = [".json", ".md"].map((ext) =>
      join(dir, "goals", `test_candidate.vs.test_baseline.compare${ext}`),
    );
    for (const file of before) writeFileSync(file, `the json_object report at ${file}\n`);
    const ran = await compare(dir, ["retried"]);
    expect(ran.exitCode).toBe(0);
    for (const file of before) {
      expect(readFileSync(file, "utf8")).toBe(`the json_object report at ${file}\n`);
    }
    const report = readJson<Comparison>(join(dir, "goals", COMPARE_JSON));
    const markdown = readFileSync(join(dir, "goals", COMPARE_MD), "utf8");
    expect(report.request).toBe(REQUEST);

    const [baseline, candidate] = [BASELINE, CANDIDATE].map((model) =>
      readJson<ScoreFile>(scoreOf(dir, "retried", model)),
    );
    expect([baseline?.retries, candidate?.retries]).toEqual([
      { asked: 1, rescued: 1 },
      { asked: 1, rescued: 0 },
    ]);
    expect(report.sets.map((row) => [row.baseline.retries, row.candidate.retries])).toEqual([
      [baseline?.retries, candidate?.retries],
    ]);
    expect(markdown).toContain(
      "| words written | words refused | retries asked | retries rescued | costUsd |",
    );
    expect(markdown).toContain(
      "| retried | baseline | test/baseline | 3 of 3 | 3 of 3 | 1 | 0 | 1 | 1 | ",
    );
    expect(markdown).toContain(
      "| retried | candidate | test/candidate | 2 of 3 | 2 of 3 | 1 | 0 | 1 | 0 | ",
    );

    // The lost goal's candidate run, with both refused answers whole, in call order.
    const notJson = (answer: string) => `the model's answer is not JSON: ${answer.slice(0, 80)}`;
    const lostRefused = LOST.map((answer, i) => ({
      purpose: "target",
      retry: i === 1,
      message: notJson(answer),
      answer,
    }));
    expect(report.losses.map((g) => [g.id, g.candidate.refused])).toEqual([["lost", lostRefused]]);
    const losses = markdown.slice(markdown.indexOf("## Losses"), markdown.indexOf("## Gains"));
    for (const answer of LOST) expect(losses).toContain(JSON.stringify(answer));

    // Retries: after Gains and before Words, exactly the two retried goals in goal-file order.
    const at = (title: string) => markdown.indexOf(`\n## ${title}\n`);
    expect([at("Gains") < at("Retries"), at("Retries") < at("Words")]).toEqual([true, true]);
    expect(headingsUnder(markdown, "Retries")).toEqual(["retried / lost", "retried / rescued"]);
    const rescuedRefused = [
      { purpose: "words", retry: false, message: notJson(NOT_JSON), answer: NOT_JSON },
    ];
    const side = (held: boolean, asked: number, rescued: number, refused: RefusedCall[]) => ({
      held,
      retries: { asked, rescued },
      refused,
    });
    expect(report.retries).toEqual([
      {
        set: "retried",
        id: "lost",
        instruction: "have Rogue fly to the moon",
        baseline: side(true, 0, 0, []),
        candidate: side(false, 1, 0, lostRefused),
      },
      {
        set: "retried",
        id: "rescued",
        instruction: "have Mux say something",
        baseline: side(true, 1, 1, rescuedRefused),
        candidate: side(true, 0, 0, []),
      },
    ]);
    const section = markdown.slice(at("Retries"), at("Words"));
    const [lost, rescued] = section.split("\n### ").slice(1);
    expect(lost).toContain("- baseline (test/baseline): held true; retries asked 0, rescued 0\n");
    expect(lost).toContain(
      "- candidate (test/candidate): held false; retries asked 1, rescued 0\n",
    );
    expect(rescued).toContain(
      "- baseline (test/baseline): held true; retries asked 1, rescued 1\n",
    );
    expect(rescued).toContain(
      "- candidate (test/candidate): held true; retries asked 0, rescued 0\n",
    );
    const shown = (r: { purpose: string; retry: boolean; message: string; answer: string }) =>
      `  - refused ${r.purpose}${r.retry ? " (retry)" : ""}: \`${JSON.stringify(r.answer)}\`: ${r.message}\n`;
    const [first, second] = lostRefused.map(shown);
    expect((lost ?? "").indexOf(first ?? "-")).toBeGreaterThan(-1);
    expect((lost ?? "").indexOf(second ?? "-")).toBeGreaterThan((lost ?? "").indexOf(first ?? "-"));
    expect(rescued).toContain(shown(rescuedRefused[0] as (typeof rescuedRefused)[0]));
  }, 60_000);

  test("a candidate score file made under another request is refused, naming it, writing nothing", async () => {
    const dir = tempDir();
    cpSync(retried, dir, { recursive: true });
    const file = scoreOf(dir, "retried", CANDIDATE);
    const score = readJson<ScoreFile>(file);
    writeFileSync(file, `${JSON.stringify({ ...score, request: "json-object" }, null, 2)}\n`);
    const ran = await compare(dir, ["retried"]);
    expect(ran.exitCode).toBe(1);
    expect(ran.stderr).toContain(file);
    expect(ran.stderr).toContain('request is "json-object"');
    expect(readdirSync(join(dir, "goals")).filter((f) => f.includes(".compare."))).toEqual([]);
  }, 30_000);
});
