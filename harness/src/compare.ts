/**
 * Two models' scores of the same goal sets side by side, as a loss report: per set, each model's
 * reached count, valid targets, words and cost; then every goal the baseline held and the
 * candidate did not, every goal the reverse, and every goal's words from both. Each lost or gained
 * goal shows both models' outcome and target, or the target's refusal, as the run.json its score
 * entry names records them. Every number and line is rendered by code from those files, and the
 * report states no verdict. Score files that name another model, were made at other thresholds
 * than the registered ones, or score other goals are refused before anything is written.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import type { Expectation } from "./goal.ts";
import { REGISTERED } from "./rule.ts";
import { modelIdRefusal, type Outcome, type RunRecord, type Stopped } from "./run.ts";
import {
  type GoalFile,
  type GoalScore,
  type GoalWords,
  goalFileSchema,
  modelSlug,
  type ScoreFile,
  scorePath,
} from "./score.ts";
import type { RecordedTarget } from "./target.ts";

/** One model's numbers for one set, as its score file records them. */
export type Side = {
  /** The score file, relative to the report's directory. */
  scoreFile: string;
  reached: { count: number; of: number };
  targets: ScoreFile["targets"];
  words: ScoreFile["words"];
  costUsd: number;
  unreportedCosts: number;
};

export type SetRow = { set: string; goals: string; baseline: Side; candidate: Side };

/** One model's run of a goal, as its run.json records it. */
export type GoalRun = {
  /** The run directory, relative to the report's directory. */
  run: string;
  outcome: Outcome | null;
  target: RecordedTarget | null;
  /** The refusal the run stopped on, or null. */
  stopped: Stopped | null;
};

/** A goal one model held and the other did not, with both models' runs of it. */
export type Moved = {
  set: string;
  id: string;
  instruction: string;
  expect: Expectation;
  baseline: GoalRun;
  candidate: GoalRun;
};

export type WordsRow = { set: string; id: string; baseline: GoalWords; candidate: GoalWords };

export type Comparison = {
  baseline: string;
  candidate: string;
  sets: SetRow[];
  losses: Moved[];
  gains: Moved[];
  words: WordsRow[];
};

/** Refuses the comparison on `file`, naming what is at fault in it. */
class Refused extends Error {
  constructor(file: string, fault: string) {
    super(`${file}: ${fault}`);
  }
}

function readJson<T>(file: string, what: string): T {
  if (!existsSync(file)) throw new Refused(file, `missing: no ${what} is there`);
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch (error) {
    throw new Refused(file, `not JSON: ${error instanceof Error ? error.message : error}`);
  }
}

function readGoals(goalsPath: string): GoalFile {
  const parsed = goalFileSchema.safeParse(readJson<unknown>(goalsPath, "goal file"));
  if (!parsed.success) throw new Refused(goalsPath, `not a goal file: ${parsed.error.message}`);
  return parsed.data;
}

/** `model`'s score of `file`, refused unless it is that model's, at REGISTERED, of its goals. */
function readScore(
  goalsPath: string,
  file: GoalFile,
  model: string,
): { path: string; score: ScoreFile } {
  const path = scorePath(goalsPath, file.set, model);
  const score = readJson<ScoreFile>(path, `score of ${file.set} under ${model}`);
  if (score.model !== model) {
    throw new Refused(
      path,
      `model is ${JSON.stringify(score.model)}, not the model named, "${model}"`,
    );
  }
  const thresholds = score.rule?.thresholds;
  if (thresholds?.done !== REGISTERED.done || thresholds.act !== REGISTERED.act) {
    throw new Refused(
      path,
      `rule.thresholds are ${JSON.stringify(thresholds)}, not the registered ${JSON.stringify(REGISTERED)}`,
    );
  }
  const ids = (score.perGoal ?? []).map((goal) => goal.id);
  const wanted = file.goals.map((goal) => goal.id);
  if (JSON.stringify(ids) !== JSON.stringify(wanted)) {
    throw new Refused(
      path,
      `perGoal ids are ${JSON.stringify(ids)}, not the goal file's, in order: ${JSON.stringify(wanted)}`,
    );
  }
  return { path, score };
}

/** One set as compare reads it: its goal file and both models' scores of it. */
type Read = {
  goalsPath: string;
  file: GoalFile;
  baseline: { path: string; score: ScoreFile };
  candidate: { path: string; score: ScoreFile };
};

function sideOf(out: string, { path, score }: Read["baseline"]): Side {
  return {
    scoreFile: relative(out, path),
    reached: { count: score.reached.held, of: score.reached.of },
    targets: score.targets,
    words: score.words,
    costUsd: score.costUsd,
    unreportedCosts: score.unreportedCosts,
  };
}

/** The run `entry` names, read from its own run.json, relative to the score file at `path`. */
function runOf(out: string, path: string, entry: GoalScore): GoalRun {
  const runDir = join(dirname(path), entry.run);
  const record = readJson<RunRecord>(join(runDir, "run.json"), `run.json of ${entry.id}`);
  return {
    run: relative(out, runDir),
    outcome: record.outcome,
    target: record.target,
    stopped: record.stopped ?? null,
  };
}

/** Every goal of `sets` whose `by` model held it and whose other model did not, in order. */
function movedOf(out: string, sets: Read[], by: "baseline" | "candidate"): Moved[] {
  return sets.flatMap((read) =>
    read.file.goals.flatMap((goal, i) => {
      const baseline = read.baseline.score.perGoal[i];
      const candidate = read.candidate.score.perGoal[i];
      if (baseline === undefined || candidate === undefined) return [];
      const [kept, missed] = by === "baseline" ? [baseline, candidate] : [candidate, baseline];
      if (!kept.held || missed.held) return [];
      return [
        {
          set: read.file.set,
          id: goal.id,
          instruction: goal.instruction,
          expect: goal.expect,
          baseline: runOf(out, read.baseline.path, baseline),
          candidate: runOf(out, read.candidate.path, candidate),
        },
      ];
    }),
  );
}

/** The comparison of `baseline` and `candidate` over `goalsPaths`, written beside the first. */
export function compare(
  baseline: string,
  candidate: string,
  goalsPaths: string[],
): { paths: string[]; report: Comparison } {
  const out = dirname(goalsPaths[0] ?? ".");
  const sets: Read[] = goalsPaths.map((goalsPath) => {
    const file = readGoals(goalsPath);
    return {
      goalsPath,
      file,
      baseline: readScore(goalsPath, file, baseline),
      candidate: readScore(goalsPath, file, candidate),
    };
  });
  const report: Comparison = {
    baseline,
    candidate,
    sets: sets.map((read) => ({
      set: read.file.set,
      goals: relative(out, read.goalsPath),
      baseline: sideOf(out, read.baseline),
      candidate: sideOf(out, read.candidate),
    })),
    losses: movedOf(out, sets, "baseline"),
    gains: movedOf(out, sets, "candidate"),
    words: sets.flatMap((read) =>
      read.file.goals.map((goal, i) => ({
        set: read.file.set,
        id: goal.id,
        baseline: read.baseline.score.perGoal[i]?.words ?? { kind: "none" },
        candidate: read.candidate.score.perGoal[i]?.words ?? { kind: "none" },
      })),
    ),
  };
  const base = join(out, `${modelSlug(candidate)}.vs.${modelSlug(baseline)}.compare`);
  const paths = [`${base}.json`, `${base}.md`];
  writeFileSync(`${base}.json`, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(`${base}.md`, rendered(report));
  return { paths, report };
}

/** `text` on one line, so it stays within its list item. */
function oneLine(text: string): string {
  return text.replace(/\s*\n\s*/g, " ");
}

/** `text` on one line, safe in a markdown table cell. */
function cell(text: string): string {
  return oneLine(text).replace(/\|/g, "\\|");
}

/** `value` as JSON in an inline code span, outside any table. */
function code(value: unknown): string {
  const text = oneLine(typeof value === "string" ? value : JSON.stringify(value));
  return text.includes("`") ? `\`\` ${text} \`\`` : `\`${text}\``;
}

function wordsText(words: GoalWords): string {
  return words.kind === "written" ? `written: "${cell(words.text)}"` : words.kind;
}

function runLine(side: "baseline" | "candidate", model: string, run: GoalRun): string {
  const target =
    run.target !== null
      ? `target ${code(run.target)}`
      : run.stopped !== null
        ? `target refused: ${run.stopped.kind} at ${run.stopped.call}: ${oneLine(run.stopped.message)}`
        : "no target recorded";
  return `- ${side} (${model}): outcome ${code(run.outcome)}; ${target}; run ${code(run.run)}`;
}

function movedSection(title: string, about: string, moved: Moved[], report: Comparison): string[] {
  const goals = moved.flatMap((goal) => [
    `### ${goal.set} / ${goal.id}`,
    "",
    `- instruction: ${oneLine(goal.instruction)}`,
    `- expect: ${code(goal.expect)}`,
    runLine("baseline", report.baseline, goal.baseline),
    runLine("candidate", report.candidate, goal.candidate),
    "",
  ]);
  return [`## ${title}`, "", about, "", ...(goals.length > 0 ? goals : ["None.", ""])];
}

function sideRow(set: string, side: "baseline" | "candidate", model: string, shown: Side): string {
  const { reached, targets, words } = shown;
  return `| ${set} | ${side} | ${model} | ${reached.count} of ${reached.of} | ${targets.valid} of ${targets.asked} | ${words.written} | ${words.refused} | ${shown.costUsd} | ${shown.unreportedCosts} |`;
}

/** The report as markdown: the same numbers and goals as the JSON, in the same order. */
export function rendered(report: Comparison): string {
  return [
    `# ${report.candidate} against ${report.baseline}`,
    "",
    `Baseline: ${report.baseline}. Candidate: ${report.candidate}. Every number and line below is rendered from the score files and the run.json files they name.`,
    "",
    "## Per set",
    "",
    "| set | side | model | reached | targets valid of asked | words written | words refused | costUsd | unreported costs |",
    "|---|---|---|---|---|---|---|---|---|",
    ...report.sets.flatMap((row) => [
      sideRow(row.set, "baseline", report.baseline, row.baseline),
      sideRow(row.set, "candidate", report.candidate, row.candidate),
    ]),
    "",
    ...movedSection(
      "Losses",
      "Goals whose expectation the baseline's run met and the candidate's did not.",
      report.losses,
      report,
    ),
    ...movedSection(
      "Gains",
      "Goals whose expectation the candidate's run met and the baseline's did not.",
      report.gains,
      report,
    ),
    "## Words",
    "",
    "| set | goal | baseline | candidate |",
    "|---|---|---|---|",
    ...report.words.map(
      (row) =>
        `| ${row.set} | ${row.id} | ${wordsText(row.baseline)} | ${wordsText(row.candidate)} |`,
    ),
    "",
  ].join("\n");
}

const USAGE =
  "usage: bun run compare --baseline <provider/model> --candidate <provider/model> --goals <file> [--goals <file> ...]";

function usage(message: string): never {
  console.error(`compare: ${message}\n${USAGE}`);
  process.exit(2);
}

/**
 * compare's command line over `args`: both models' scores of every goal file, set side by side in
 * <candidate>.vs.<baseline>.compare.json and .compare.md beside the first goal file; refused,
 * writing nothing, when any file is missing or not like for like.
 */
export async function compareCli(args: string[]): Promise<void> {
  let values: ReturnType<typeof parse>["values"];
  function parse() {
    return parseArgs({
      args,
      options: {
        baseline: { type: "string" },
        candidate: { type: "string" },
        goals: { type: "string", multiple: true },
      },
      strict: true,
    });
  }
  try {
    values = parse().values;
  } catch (error) {
    usage(error instanceof Error ? error.message : String(error));
  }
  const { baseline, candidate, goals } = values;
  if (baseline === undefined) usage("--baseline is required");
  if (candidate === undefined) usage("--candidate is required");
  for (const [flag, model] of [
    ["--baseline", baseline],
    ["--candidate", candidate],
  ] as const) {
    const refused = modelIdRefusal(flag, model);
    if (refused !== null) usage(refused);
  }
  if (goals === undefined || goals.length === 0) usage("--goals is required");
  let written: ReturnType<typeof compare>;
  try {
    written = compare(
      baseline,
      candidate,
      goals.map((path) => resolve(path)),
    );
  } catch (error) {
    if (!(error instanceof Refused)) throw error;
    console.error(`compare: refused: ${error.message}`);
    process.exit(1);
  }
  console.log(`compare written to ${written.paths.join(" and ")}`);
}

if (import.meta.main) await compareCli(Bun.argv.slice(2));
