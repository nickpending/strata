/**
 * Scoring the harness on a goal set by expected end states: each goal runs on its own fresh bench,
 * and its typed expectation is checked by code against the bench's final snapshot and history.
 * With --sweep, a grid of T_ACT values, T_DONE held at its calibrated value, is replayed over the
 * recorded loops and the value holding the most goals is printed. A goal set whose author is the
 * rule's author is refused on a plain score: it is no blind test of the rule. A set not named as
 * its file is refused: its score would land on another file's. Each goal needs a bench hosted for
 * it, so a score with no host refuses before any goal runs. A score under a named --model asks that
 * model for every target and words, records it, and lands in a file of its own (scorePath).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type Browser, chromium } from "playwright";
import { z } from "zod";
import { type Expectation, expectSchema, holds } from "./goal.ts";
import { choose, REGISTERED, RULE_AUTHOR, T_DONE, type Thresholds } from "./rule.ts";
import {
  type BenchFailure,
  type DriveOptions,
  drive,
  type Host,
  type LoopRecord,
  optionsFromFlags,
  RUN_FLAGS,
  RUN_USAGE,
  type RunRecord,
  releaseHolds,
} from "./run.ts";
import { DEFAULT_MODEL } from "./words.ts";

const name = z.string().trim().min(1);

export const goalFileSchema = z.strictObject({
  /** The set's name, and its score file's (scorePath), beside the goals: so a plain name. */
  set: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "set must be letters, digits, - and _ (a file name)"),
  author: name,
  goals: z.array(z.strictObject({ id: name, instruction: name, expect: expectSchema })).min(1),
});
export type GoalFile = z.infer<typeof goalFileSchema>;

/**
 * The grid the sweep tries: T_DONE at its calibrated value alone, since the done noul decides
 * nothing, and T_ACT in hundredths. A score file swept before T_DONE was fixed records a grid of
 * the same shape with many T_DONE values.
 */
export const GRID = {
  done: [T_DONE],
  act: Array.from({ length: 16 }, (_, i) => (5 + 5 * i) / 100),
};

export const SWEEP_METHOD =
  "Each T_ACT value, T_DONE held at its calibrated value, replays every goal's recorded loops in order: at a loop whose recorded held is true the run reached its end state there, and the goal holds when its expectation held at the run's end; a resolve, wait or plan loop, which code chose, is followed as recorded, and a loop stuck on the missing move of a pending state or a plan's step stops as recorded, at every value; elsewhere the rule's choose() at the value must pick the candidate the run performed, or the replay leaves the recorded path and the goal counts as not held; where it would be stuck, or when the recorded loops run out, the goal is not held. A no-such-action goal counts as its run did at every value. The best pair holds the most goals; among tied pairs it takes the median T_DONE (the lower middle of an even count), then the median T_ACT of the tied pairs at that T_DONE.";

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
  /**
   * The model's target answer: valid when it parsed and passed the target schema (a target
   * checked() turned into no-such-action included), invalid when it did not, unanswered when the
   * run stopped before or at the target call with no answer from the model.
   */
  target: "valid" | "invalid" | "unanswered";
  /** The run's words: the line the model wrote, refused when its answer did not parse, or none. */
  words: GoalWords;
};

export type GoalWords = { kind: "written"; text: string } | { kind: "refused" } | { kind: "none" };

export type SweepResult = { done: number; act: number; held: number };

export type ScoreFile = {
  set: string;
  author: string;
  /** The model the runs were made with, as each run.json's wordsModel records it. */
  model: string;
  /** The rule the runs were made with. */
  rule: { author: string; thresholds: Thresholds };
  reached: { held: number; of: number };
  /** The goals whose target was valid, of those whose target the model answered. */
  targets: { valid: number; asked: number };
  /** The goals whose words were written, and those whose words were refused. */
  words: { written: number; refused: number };
  perGoal: GoalScore[];
  /** The sum of every goal's reported cost. */
  costUsd: number;
  /** How many calls across the set came back with no reported cost. */
  unreportedCosts: number;
  sweep?: { grid: typeof GRID; method: string; results: SweepResult[]; best: SweepResult };
};

/** The decisions code makes whatever the thresholds: a replay follows them as recorded. */
const CODE_LED: string[] = ["resolve", "wait", "plan"];

/** Whether `goal` holds at `thresholds`, replaying its recorded loops (see SWEEP_METHOD). */
function heldAt(goal: GoalScore, loops: LoopRecord[], thresholds: Thresholds): boolean {
  if ("outcome" in goal.expect) return goal.held;
  for (const entry of loops) {
    if (entry.held) return goal.held;
    if (CODE_LED.includes(entry.decision.kind)) continue;
    const { decision: recorded } = entry;
    if (recorded.kind === "stuck" && (recorded.pending ?? recorded.step) !== undefined) {
      return false;
    }
    const decision = choose(entry.answers.done, entry.answers.scored, thresholds);
    if (decision.kind !== "act") return false;
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

/** Whether the run's target was answered, and parsed, read from its record, never its outcome. */
function targetOf(record: RunRecord): GoalScore["target"] {
  if (record.target !== null) return "valid";
  const { stopped } = record;
  return stopped?.call === "target" && stopped.kind === "parse" ? "invalid" : "unanswered";
}

/** The run's words as its record holds them: written, refused when their answer did not parse. */
function wordsOf(record: RunRecord): GoalWords {
  if (record.words !== null) return { kind: "written", text: record.words };
  const { stopped } = record;
  return stopped?.call === "words" && stopped.kind === "parse"
    ? { kind: "refused" }
    : { kind: "none" };
}

/** A model id as a file name: every character outside [A-Za-z0-9._-] becomes _. */
export function modelSlug(model: string): string {
  return model.replace(/[^A-Za-z0-9._-]/g, "_");
}

/**
 * Where `set`'s score is written beside `goalsPath`: <set>.score.json when no model was named, and
 * <set>.<slug>.score.json when one was, even the default's id, so a named model's score never
 * writes, reads or replaces the registered one. The one place a score path is derived.
 */
export function scorePath(goalsPath: string, set: string, model: string | undefined): string {
  const name = model === undefined ? set : `${set}.${modelSlug(model)}`;
  return join(dirname(goalsPath), `${name}.score.json`);
}

/** Run every goal of `file` on its own fresh bench and score it; the score file is written beside the goals. */
export async function score(
  goalsPath: string,
  file: GoalFile,
  run: Omit<DriveOptions, "instruction">,
  withSweep: boolean,
): Promise<{ path: string; scored: ScoreFile }> {
  const path = scorePath(goalsPath, file.set, run.model.model);
  const browser: Browser = await chromium.launch({ headless: !run.headed });
  const goals: { score: GoalScore; loops: LoopRecord[] }[] = [];
  try {
    for (const goal of file.goals) {
      const { runDir, record } = await drive({
        ...run,
        instruction: goal.instruction,
        url: undefined,
        browser,
        probe: (base) => holds(goal.expect, base),
      });
      const outcome = record.outcome?.kind ?? "unfinished";
      // A run that found its end state already held did nothing: whatever the probe reads, the
      // goal is not held, even when the file expects the very state that held.
      const held =
        "outcome" in goal.expect
          ? outcome === goal.expect.outcome
          : outcome !== "already-held" && record.held === true;
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
          target: targetOf(record),
          words: wordsOf(record),
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
    model: run.model.model ?? DEFAULT_MODEL,
    rule: { author: RULE_AUTHOR, thresholds: run.thresholds ?? REGISTERED },
    reached: { held: perGoal.filter((g) => g.held).length, of: perGoal.length },
    targets: {
      valid: perGoal.filter((g) => g.target === "valid").length,
      asked: perGoal.filter((g) => g.target !== "unanswered").length,
    },
    words: {
      written: perGoal.filter((g) => g.words.kind === "written").length,
      refused: perGoal.filter((g) => g.words.kind === "refused").length,
    },
    perGoal,
    costUsd: perGoal.reduce((sum, g) => sum + g.costUsd, 0),
    unreportedCosts: perGoal.reduce((sum, g) => sum + g.unreportedCosts, 0),
    ...(withSweep ? { sweep: sweep(goals) } : {}),
  };
  writeFileSync(path, `${JSON.stringify(scored, null, 2)}\n`);
  return { path, scored };
}

const USAGE = `usage: bun run score --goals <file> [--sweep] ${RUN_USAGE}`;

function usage(message: string): never {
  console.error(`score: ${message}\n${USAGE}`);
  process.exit(2);
}

/**
 * score's command line over `args`: every goal of the file on its own bench `host` hosts, the score
 * written beside the goals; refused with no host, since each goal needs a hosted bench.
 */
export async function scoreCli(args: string[], bench: { host?: Host } = {}): Promise<void> {
  let values: ReturnType<typeof parse>["values"];
  function parse() {
    return parseArgs({
      args,
      options: {
        ...RUN_FLAGS,
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
      `score: refused: the goal file's set "${file.set}" is not its file's name "${fileName}"; the score is written to ${scorePath(goalsPath, file.set, values.model)}, and a set named for another file would overwrite that file's score`,
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
  if (bench.host === undefined) {
    console.error(
      "score: refused: no host to host a bench: each goal needs a hosted bench of its own, so score runs only through a host (bun run score)",
    );
    process.exit(1);
  }
  let written: Awaited<ReturnType<typeof score>>;
  try {
    written = await score(goalsPath, file, { ...options, host: bench.host }, sweeping);
  } finally {
    // Every goal's holds are done: an open stdin must not keep the process alive past the last.
    await releaseHolds();
  }
  const { path, scored } = written;
  console.log(JSON.stringify({ reached: scored.reached, perGoal: scored.perGoal }, null, 2));
  console.log(`score written to ${path}`);
  const best = scored.sweep?.best;
  if (best !== undefined) {
    console.log(
      `best: T_DONE=${best.done} T_ACT=${best.act} (held ${best.held} of ${scored.reached.of})`,
    );
  }
}

if (import.meta.main) await scoreCli(Bun.argv.slice(2));
