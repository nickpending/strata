/**
 * Two models' scores of the same goal sets side by side, each under its own model's request, as a
 * loss report: per set, each model's reached count, valid targets, words, retries, cost and
 * providers; then every goal the baseline held and the candidate did not, every goal the reverse,
 * every goal either model's run asked a retry on, and every goal's words from both. Each lost or
 * gained goal shows both models' outcome and target, or the target's refusal, and each refused
 * answer whole, as the run.json its score entry names records them, and its providers as the score
 * entry records them. Every number and line is rendered by code from those files, and the report
 * states no verdict. Score files that name another model or a request not their model's, were made
 * at other thresholds than the registered ones, or score other goals are refused before anything
 * is written.
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
  type Providers,
  type Retries,
  type ScoreFile,
  scorePath,
} from "./score.ts";
import type { RecordedTarget } from "./target.ts";
import { requestFor } from "./words.ts";

/** One model's numbers for one set, as its score file records them. */
export type Side = {
  /** The score file, relative to the report's directory. */
  scoreFile: string;
  reached: { count: number; of: number };
  targets: ScoreFile["targets"];
  words: ScoreFile["words"];
  costUsd: number;
  unreportedCosts: number;
  retries: Retries;
  /** The set's model calls per provider; null for a score file made before providers were recorded. */
  providers: Providers | null;
};

export type SetRow = { set: string; goals: string; baseline: Side; candidate: Side };

/** A model call whose answer was refused: what it was for, whether it was the retry, and why. */
export type RefusedCall = {
  purpose: string;
  retry: boolean;
  message: string;
  answer: string | null;
};

/** One model's run of a goal, as its run.json records it. */
export type GoalRun = {
  /** The run directory, relative to the report's directory. */
  run: string;
  outcome: Outcome | null;
  target: RecordedTarget | null;
  /** The refusal the run stopped on, or null. */
  stopped: Stopped | null;
  /** Every refused model call of the run, in call order. */
  refused: RefusedCall[];
  /**
   * The run's model calls per provider, as its score entry records them, never recounted from
   * run.json; null for an entry made before providers were recorded.
   */
  providers: Providers | null;
};

/** One model's side of a retried goal: its score entry's held and retries, and its refused calls. */
export type RetriedSide = { held: boolean; retries: Retries; refused: RefusedCall[] };

/** A goal either model's run asked a retry on. */
export type Retried = {
  set: string;
  id: string;
  instruction: string;
  baseline: RetriedSide;
  candidate: RetriedSide;
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
  /** The request each model's scores were made under: its own (requestFor). */
  requests: { baseline: string; candidate: string };
  sets: SetRow[];
  losses: Moved[];
  gains: Moved[];
  retries: Retried[];
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

/**
 * `model`'s score of `file`, refused unless it is that model's, under that model's request, at
 * REGISTERED, of its goals.
 */
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
  const request = requestFor(model).name;
  if (score.request !== request) {
    throw new Refused(
      path,
      `request is ${JSON.stringify(score.request)}, not ${model}'s request, "${request}"`,
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
    retries: score.retries,
    providers: score.providers ?? null,
  };
}

/**
 * The run `entry` names, read from its own run.json, relative to the score file at `path`, with
 * the providers `entry` records.
 */
function runOf(out: string, path: string, entry: GoalScore): GoalRun {
  const runDir = join(dirname(path), entry.run);
  const record = readJson<RunRecord>(join(runDir, "run.json"), `run.json of ${entry.id}`);
  return {
    run: relative(out, runDir),
    outcome: record.outcome,
    target: record.target,
    stopped: record.stopped ?? null,
    refused: record.calls.flatMap(({ purpose, retry, refused }) =>
      refused === undefined ? [] : [{ purpose, retry: retry === true, ...refused }],
    ),
    providers: entry.providers ?? null,
  };
}

/** Every goal of `sets` with both models' score entries of it, in goal-file order. */
function paired(sets: Read[]) {
  return sets.flatMap((read) =>
    read.file.goals.flatMap((goal, i) => {
      const baseline = read.baseline.score.perGoal[i];
      const candidate = read.candidate.score.perGoal[i];
      return baseline === undefined || candidate === undefined
        ? []
        : [{ read, goal, baseline, candidate }];
    }),
  );
}

/** Every goal of `sets` either model's run asked a retry on, in goal-file order. */
function retriedOf(out: string, sets: Read[]): Retried[] {
  const side = (path: string, entry: GoalScore): RetriedSide => ({
    held: entry.held,
    retries: entry.retries,
    refused: runOf(out, path, entry).refused,
  });
  return paired(sets).flatMap(({ read, goal, baseline, candidate }) =>
    baseline.retries.asked === 0 && candidate.retries.asked === 0
      ? []
      : [
          {
            set: read.file.set,
            id: goal.id,
            instruction: goal.instruction,
            baseline: side(read.baseline.path, baseline),
            candidate: side(read.candidate.path, candidate),
          },
        ],
  );
}

/** Every goal of `sets` whose `by` model held it and whose other model did not, in order. */
function movedOf(out: string, sets: Read[], by: "baseline" | "candidate"): Moved[] {
  return paired(sets).flatMap(({ read, goal, baseline, candidate }) => {
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
  });
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
  const requests = {
    baseline: requestFor(baseline).name,
    candidate: requestFor(candidate).name,
  };
  const report: Comparison = {
    baseline,
    candidate,
    requests,
    sets: sets.map((read) => ({
      set: read.file.set,
      goals: relative(out, read.goalsPath),
      baseline: sideOf(out, read.baseline),
      candidate: sideOf(out, read.candidate),
    })),
    losses: movedOf(out, sets, "baseline"),
    gains: movedOf(out, sets, "candidate"),
    retries: retriedOf(out, sets),
    words: sets.flatMap((read) =>
      read.file.goals.map((goal, i) => ({
        set: read.file.set,
        id: goal.id,
        baseline: read.baseline.score.perGoal[i]?.words ?? { kind: "none" },
        candidate: read.candidate.score.perGoal[i]?.words ?? { kind: "none" },
      })),
    ),
  };
  const sides = [
    `${modelSlug(candidate)}.${requests.candidate}`,
    `${modelSlug(baseline)}.${requests.baseline}`,
  ];
  const base = join(out, `${sides.join(".vs.")}.compare`);
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

/**
 * Each provider's model calls as `<provider> <calls>`, an unreported provider as `unreported`, or
 * `not recorded` for a score made before providers were recorded.
 */
function providersText(providers: Providers | null): string {
  if (providers === null) return "not recorded";
  return providers.map((p) => `${p.provider ?? "unreported"} ${p.calls}`).join(", ");
}

function runLine(side: "baseline" | "candidate", model: string, run: GoalRun): string {
  const target =
    run.target !== null
      ? `target ${code(run.target)}`
      : run.stopped !== null
        ? `target refused: ${run.stopped.kind} at ${run.stopped.call}: ${oneLine(run.stopped.message)}`
        : "no target recorded";
  const providers = `providers ${oneLine(providersText(run.providers))}`;
  return `- ${side} (${model}): outcome ${code(run.outcome)}; ${target}; ${providers}; run ${code(run.run)}`;
}

/**
 * Each refused call as a line under its model's: what it was for, whether it was the retry, the
 * model's answer whole as a JSON string, and the refusal's message.
 */
function refusedLines(refused: RefusedCall[]): string[] {
  return refused.map((call) => {
    const answer = call.answer === null ? "no answer" : code(JSON.stringify(call.answer));
    const retry = call.retry ? " (retry)" : "";
    return `  - refused ${call.purpose}${retry}: ${answer}: ${oneLine(call.message)}`;
  });
}

/** A section of goals, each headed by its set and id; None. when there are none. */
function goalSection(title: string, about: string, goals: string[]): string[] {
  return [`## ${title}`, "", about, "", ...(goals.length > 0 ? goals : ["None.", ""])];
}

function movedSection(title: string, about: string, moved: Moved[], report: Comparison): string[] {
  const goals = moved.flatMap((goal) => [
    `### ${goal.set} / ${goal.id}`,
    "",
    `- instruction: ${oneLine(goal.instruction)}`,
    `- expect: ${code(goal.expect)}`,
    runLine("baseline", report.baseline, goal.baseline),
    ...refusedLines(goal.baseline.refused),
    runLine("candidate", report.candidate, goal.candidate),
    ...refusedLines(goal.candidate.refused),
    "",
  ]);
  return goalSection(title, about, goals);
}

function retriedLines(side: "baseline" | "candidate", model: string, shown: RetriedSide): string[] {
  const { asked, rescued } = shown.retries;
  return [
    `- ${side} (${model}): held ${shown.held}; retries asked ${asked}, rescued ${rescued}`,
    ...refusedLines(shown.refused),
  ];
}

function retriesSection(report: Comparison): string[] {
  const goals = report.retries.flatMap((goal) => [
    `### ${goal.set} / ${goal.id}`,
    "",
    `- instruction: ${oneLine(goal.instruction)}`,
    ...retriedLines("baseline", report.baseline, goal.baseline),
    ...retriedLines("candidate", report.candidate, goal.candidate),
    "",
  ]);
  return goalSection(
    "Retries",
    "Goals either model's run asked a retry on, in goal-file order: each model's held and retries as its score entry records them, and every refused answer, whole, with its refusal's message, in call order.",
    goals,
  );
}

function sideRow(set: string, side: "baseline" | "candidate", model: string, shown: Side): string {
  const { reached, targets, words, retries } = shown;
  return `| ${set} | ${side} | ${model} | ${reached.count} of ${reached.of} | ${targets.valid} of ${targets.asked} | ${words.written} | ${words.refused} | ${retries.asked} | ${retries.rescued} | ${shown.costUsd} | ${shown.unreportedCosts} | ${cell(providersText(shown.providers))} |`;
}

/** The report as markdown: the same numbers and goals as the JSON, in the same order. */
export function rendered(report: Comparison): string {
  const { requests } = report;
  return [
    `# ${report.candidate} against ${report.baseline}`,
    "",
    `Baseline: ${report.baseline} under ${requests.baseline}. Candidate: ${report.candidate} under ${requests.candidate}. Each model's scores were made under its own request. Every number and line below is rendered from the score files and the run.json files they name.`,
    "",
    "## Per set",
    "",
    "| set | side | model | reached | targets valid of asked | words written | words refused | retries asked | retries rescued | costUsd | unreported costs | providers |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
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
    ...retriesSection(report),
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
 * <candidate>.<candidate request>.vs.<baseline>.<baseline request>.compare.json and .compare.md
 * beside the first goal file; refused, writing nothing, when any file is missing or not like for
 * like.
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
