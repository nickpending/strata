/**
 * Scoring the player on a goal set by expected end states: each goal runs on its own fresh bench,
 * and its typed expectation is checked by code against the bench's final snapshot and history.
 * With --sweep, a grid of (T_DONE, T_ACT) pairs is replayed over the recorded answers and the
 * pair holding the most goals is printed: how the rule's constants are set. A goal set whose
 * author is the rule's author is refused on a plain score: it is no blind test of the rule. A set
 * not named as its file is refused: its score would land on another file's.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type Browser, chromium } from "playwright";
import { z } from "zod";
import type { WorldEvent } from "../engine/events.ts";
import type { Snapshot } from "../engine/snapshot.ts";
import { choose, REGISTERED, RULE_AUTHOR, type Thresholds } from "./rule.ts";
import {
  type BenchFailure,
  getJson,
  type LoopRecord,
  optionsFromFlags,
  PLAYER_FLAGS,
  PLAYER_USAGE,
  type PlayerOptions,
  runPlayer,
} from "./run.ts";

const name = z.string().trim().min(1);

export const expectSchema = z.union([
  z.strictObject({ holder: z.strictObject({ item: name, person: name }) }),
  z.strictObject({ location: z.strictObject({ person: name, room: name }) }),
  z.strictObject({ said: z.strictObject({ person: name, subkind: name }) }),
  z.strictObject({ outcome: z.literal("no-such-action") }),
]);
export type Expectation = z.infer<typeof expectSchema>;

export const goalFileSchema = z.strictObject({
  /** The set's name, and its score file's: <set>.score.json beside the goals, so a plain name. */
  set: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "set must be letters, digits, - and _ (a file name)"),
  author: name,
  goals: z.array(z.strictObject({ id: name, instruction: name, expect: expectSchema })).min(1),
});
export type GoalFile = z.infer<typeof goalFileSchema>;

/** The (T_DONE, T_ACT) grid the sweep tries, in hundredths. */
export const GRID = {
  done: Array.from({ length: 14 }, (_, i) => (30 + 5 * i) / 100),
  act: Array.from({ length: 16 }, (_, i) => (5 + 5 * i) / 100),
};

export const SWEEP_METHOD =
  "Each pair replays every goal's recorded loops in order with the rule's choose(): at a loop where the pair says reached, the goal holds when its expectation held as that loop read the page; where the pair would act, it must pick the candidate the run performed, or the replay leaves the recorded path and the goal counts as not held; where it would be stuck, or when the recorded loops run out, the goal is not held. A no-such-action goal counts as its run did at every pair. The best pair holds the most goals; among tied pairs it takes the median T_DONE (the lower middle of an even count), then the median T_ACT of the tied pairs at that T_DONE.";

export type GoalScore = {
  id: string;
  instruction: string;
  expect: Expectation;
  outcome: string;
  held: boolean;
  loops: number;
  /** The sum of the costs the providers reported for the run. */
  costUsd: number;
  /** How many of the run's calls came back with no reported cost; costUsd leaves them out. */
  unreportedCosts: number;
  /** Bench reads after the run that failed; a failed probe leaves held false and is named here. */
  benchFailures: BenchFailure[];
  /** The run directory, relative to the score file's directory. */
  run: string;
};

export type SweepResult = { done: number; act: number; held: number };

export type ScoreFile = {
  set: string;
  author: string;
  /** The rule the runs were made with. */
  rule: { author: string; thresholds: Thresholds };
  reached: { held: number; of: number };
  perGoal: GoalScore[];
  /** The sum of every goal's reported cost. */
  costUsd: number;
  /** How many calls across the set came back with no reported cost. */
  unreportedCosts: number;
  sweep?: { grid: typeof GRID; method: string; results: SweepResult[]; best: SweepResult };
};

/** Whether an end-state expectation holds on the bench at `base` now. */
export async function holds(expectation: Expectation, base: string): Promise<boolean> {
  if ("holder" in expectation) {
    const snapshot = await getJson<Snapshot>(base, "/api/snapshot");
    const { item, person } = expectation.holder;
    return Object.hasOwn(snapshot.items, item) && snapshot.items[item]?.holder === person;
  }
  if ("location" in expectation) {
    const snapshot = await getJson<Snapshot>(base, "/api/snapshot");
    const { person, room } = expectation.location;
    const location = Object.hasOwn(snapshot.people, person)
      ? snapshot.people[person]?.location
      : undefined;
    return location !== undefined && "room" in location && location.room === room;
  }
  if ("said" in expectation) {
    const { events } = await getJson<{ events: WorldEvent[] }>(base, "/api/events?since=0");
    const { person, subkind } = expectation.said;
    return events.some((event) => event.actor === person && event.subkind === subkind);
  }
  return false;
}

/** Whether `goal` holds at `thresholds`, replaying its recorded loops (see SWEEP_METHOD). */
function heldAt(goal: GoalScore, loops: LoopRecord[], thresholds: Thresholds): boolean {
  if ("outcome" in goal.expect) return goal.held;
  for (const entry of loops) {
    const decision = choose(entry.answers.done, entry.answers.scored, thresholds);
    if (decision.kind === "reached") return entry.held === true;
    if (decision.kind === "stuck") return false;
    if (entry.decision.kind !== "act" || entry.decision.chosen.key !== decision.chosen.key) {
      return false;
    }
  }
  return false;
}

/** The middle of `values` sorted ascending (the lower middle of an even count). */
function median(values: number[]): number {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? Number.NaN;
}

/**
 * The pair holding the most goals; among ties, the median T_DONE of the tied pairs, then the
 * median T_ACT of the tied pairs at that T_DONE: the tied region's middle, away from its edges.
 */
export function bestOf(results: SweepResult[]): SweepResult {
  const most = Math.max(...results.map((r) => r.held));
  const tied = results.filter((r) => r.held === most);
  const done = median(tied.map((r) => r.done));
  const act = median(tied.filter((r) => r.done === done).map((r) => r.act));
  return { done, act, held: most };
}

/** Every grid pair's held count over the recorded runs, and the best pair. */
export function sweep(
  goals: { score: GoalScore; loops: LoopRecord[] }[],
): NonNullable<ScoreFile["sweep"]> {
  const results: SweepResult[] = [];
  for (const done of GRID.done) {
    for (const act of GRID.act) {
      const held = goals.filter((g) => heldAt(g.score, g.loops, { done, act })).length;
      results.push({ done, act, held });
    }
  }
  return { grid: GRID, method: SWEEP_METHOD, results, best: bestOf(results) };
}

function readLoops(runDir: string): LoopRecord[] {
  return readFileSync(join(runDir, "loops.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => JSON.parse(line) as LoopRecord);
}

/** Run every goal of `file` on its own fresh bench and score it; the score file is written beside the goals. */
export async function score(
  goalsPath: string,
  file: GoalFile,
  player: Omit<PlayerOptions, "instruction">,
  withSweep: boolean,
): Promise<{ path: string; scored: ScoreFile }> {
  const path = join(dirname(goalsPath), `${file.set}.score.json`);
  const browser: Browser = await chromium.launch({ headless: !player.headed });
  const goals: { score: GoalScore; loops: LoopRecord[] }[] = [];
  try {
    for (const goal of file.goals) {
      const { runDir, record } = await runPlayer({
        ...player,
        instruction: goal.instruction,
        url: undefined,
        browser,
        probe: (base) => holds(goal.expect, base),
      });
      const outcome = record.outcome?.kind ?? "unfinished";
      const held =
        "outcome" in goal.expect ? outcome === goal.expect.outcome : record.held === true;
      goals.push({
        score: {
          id: goal.id,
          instruction: goal.instruction,
          expect: goal.expect,
          outcome,
          held,
          loops: record.loops,
          costUsd: record.costUsd,
          unreportedCosts: record.unreportedCosts,
          benchFailures: record.benchFailures,
          run: relative(dirname(path), runDir),
        },
        loops: readLoops(runDir),
      });
    }
  } finally {
    await browser.close();
  }
  const perGoal = goals.map((g) => g.score);
  const scored: ScoreFile = {
    set: file.set,
    author: file.author,
    rule: { author: RULE_AUTHOR, thresholds: player.thresholds ?? REGISTERED },
    reached: { held: perGoal.filter((g) => g.held).length, of: perGoal.length },
    perGoal,
    costUsd: perGoal.reduce((sum, g) => sum + g.costUsd, 0),
    unreportedCosts: perGoal.reduce((sum, g) => sum + g.unreportedCosts, 0),
    ...(withSweep ? { sweep: sweep(goals) } : {}),
  };
  writeFileSync(path, `${JSON.stringify(scored, null, 2)}\n`);
  return { path, scored };
}

const USAGE = `usage: bun run src/player/score.ts --goals <file> [--sweep] ${PLAYER_USAGE}`;

function usage(message: string): never {
  console.error(`score: ${message}\n${USAGE}`);
  process.exit(2);
}

async function main(): Promise<void> {
  let values: ReturnType<typeof parse>["values"];
  function parse() {
    return parseArgs({
      args: Bun.argv.slice(2),
      options: {
        ...PLAYER_FLAGS,
        goals: { type: "string" },
        sweep: { type: "boolean", default: false },
      },
      strict: true,
    });
  }
  try {
    values = parse().values;
  } catch (error) {
    usage(error instanceof Error ? error.message : String(error));
  }
  if (values.goals === undefined) usage("--goals is required");
  const goalsPath = resolve(values.goals);
  let file: GoalFile;
  try {
    file = goalFileSchema.parse(JSON.parse(readFileSync(goalsPath, "utf8")));
  } catch (error) {
    usage(`${goalsPath} is not a goal file: ${error instanceof Error ? error.message : error}`);
  }
  const fileName = basename(goalsPath, ".json");
  if (file.set !== fileName) {
    console.error(
      `score: refused: the goal file's set "${file.set}" is not its file's name "${fileName}"; the score is written to <set>.score.json, and a set named for another file would overwrite that file's score`,
    );
    process.exit(1);
  }
  const sweeping = values.sweep === true;
  if (!sweeping && file.author === RULE_AUTHOR) {
    console.error(
      `score: refused: the goal file's author "${file.author}" is the rule's author "${RULE_AUTHOR}"; a goal set written by the rule's author is no blind test of it (only --sweep calibrates on it)`,
    );
    process.exit(1);
  }
  const options = optionsFromFlags(values);
  if ("error" in options) usage(options.error);
  const { path, scored } = await score(goalsPath, file, options, sweeping);
  console.log(JSON.stringify({ reached: scored.reached, perGoal: scored.perGoal }, null, 2));
  console.log(`score written to ${path}`);
  const best = scored.sweep?.best;
  if (best !== undefined) {
    console.log(
      `best: T_DONE=${best.done} T_ACT=${best.act} (held ${best.held} of ${scored.reached.of})`,
    );
  }
}

if (import.meta.main) await main();
