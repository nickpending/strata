/**
 * The player's loop: host the bench (or open the one at `url`), open it in chromium, ask the model
 * for the target and the words, then read the page, ask Jev, perform the rule's choice in the
 * browser, and loop until reached, stuck, the ceiling, or a refusal. Every loop is printed as it
 * happens and appended to loops.jsonl; run.json is rewritten as the run goes; the history is read
 * back through the bench's own routes at the end.
 */
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import type { WorldEvent } from "../engine/events.ts";
import type { Snapshot } from "../engine/snapshot.ts";
import { startServer } from "../server/routes.ts";
import { type Candidate, candidates } from "./candidates.ts";
import { type ClientOptions, JEV_MODEL, type Refusal } from "./jev.ts";
import {
  type Control,
  locate,
  nameOf,
  type PageRead,
  readPage,
  settled,
  unlabeled,
} from "./page.ts";
import {
  ask,
  choose,
  type Decision,
  type Goal,
  REGISTERED,
  renderState,
  type Scored,
  type Thresholds,
} from "./rule.ts";
import { askTarget, type Target } from "./target.ts";
import { words as askWords, WORDS_MODEL } from "./words.ts";

export type PlayerOptions = {
  instruction: string;
  /** A bench to drive; absent, the run hosts a fresh one on an ephemeral port. */
  url?: string | undefined;
  worldDir: string;
  tickMinutes: number;
  headed: boolean;
  maxLoops: number;
  /** Where run directories are made: corpus/runs by default. */
  corpusDir: string;
  jev: ClientOptions;
  model: ClientOptions;
  thresholds?: Thresholds;
  /** Whether a goal's expectation holds on the bench at `base` now; asked every loop and at the end. */
  probe?: (base: string) => Promise<boolean>;
  /** Where each loop is printed as it happens; stdout by default. */
  print?: (text: string) => void;
  /** A browser to open the page in, kept open after the run; absent, the run launches its own. */
  browser?: Browser;
};

/**
 * Why a run stopped short: a client's refusal (config, network, status, parse), a bench that would
 * not boot, a page with an unlabeled control, a browser the player cannot work, or a bench route
 * the loop's probe could not read. `call` names where: boot, launch, target, words or the loop.
 */
export type Stopped = {
  kind: Refusal["kind"] | "boot" | "page" | "browser" | "bench";
  message: string;
  call: string;
  status?: number;
};

export type Outcome =
  | { kind: "reached"; loop: number; done: number }
  | { kind: "stuck"; loop: number; best: Scored | null }
  | { kind: "no-such-action"; reason: string }
  | { kind: "ceiling"; loops: number }
  | { kind: "stopped"; stopped: Stopped };

/** One model or Jev call and what it cost: null when the provider reported no cost. */
export type Call = { client: "model" | "jev"; purpose: string; costUsd: number | null };

/** One loop as recorded in loops.jsonl. */
export type LoopRecord = {
  loop: number;
  state: string;
  controls: Control[];
  candidates: { key: string; description: string; control: number; move: Candidate["move"] }[];
  questions: Record<string, { type: string; instructions: string }>;
  answers: { done: number; scored: Scored[] };
  decision: Decision;
  /** The candidate performed, or null when the loop stopped. */
  action: string | null;
  /** Whether the goal's expectation held when the loop read the page (scoring runs only). */
  held?: boolean;
  costUsd: number | null;
};

export type RunRecord = {
  runId: string;
  instruction: string;
  startedAt: string;
  endedAt: string | null;
  parameters: {
    url: string | null;
    world: string;
    tickMinutes: number;
    maxLoops: number;
    headed: boolean;
    thresholds: Thresholds;
    jevModel: string;
    wordsModel: string;
  };
  target: Target | null;
  words: string | null;
  outcome: Outcome | null;
  /** Set when the run stopped at a call: the refusal's kind and message. */
  stopped?: Stopped;
  loops: number;
  calls: Call[];
  /** The sum of the costs the providers reported. */
  costUsd: number;
  /** How many calls came back with no reported cost: costUsd leaves them out. */
  unreportedCosts: number;
  /** Whether the goal's expectation held at the end (scoring runs only). */
  held?: boolean;
  /** Bench reads after the run that failed (the probe, the history), each naming its read. */
  benchFailures: BenchFailure[];
};

/** A read of the bench's routes that failed after the run: the outcome stands, this read is missing. */
export type BenchFailure = { kind: "bench"; call: "probe" | "history"; message: string };

export type PlayerResult = { runDir: string; record: RunRecord };

/** The command-line flags the player and score share, for node:util parseArgs. */
export const PLAYER_FLAGS = {
  "tick-minutes": { type: "string" },
  world: { type: "string", default: "world" },
  corpus: { type: "string", default: "corpus/runs" },
  "max-loops": { type: "string", default: "24" },
  headed: { type: "boolean", default: false },
  "jev-endpoint": { type: "string" },
  "model-endpoint": { type: "string" },
  /** The apiconf key to send; an endpoint override is sent a key only when this names one. */
  "key-name": { type: "string" },
} as const;

export const PLAYER_USAGE =
  "--tick-minutes <n> [--world world] [--corpus corpus/runs] [--max-loops 24] [--headed] [--jev-endpoint <url>] [--model-endpoint <url>] [--key-name sable-openrouter]";

type FlagValues = { [K in keyof typeof PLAYER_FLAGS]?: string | boolean | undefined };

/**
 * The player options the shared flags give, or the message naming the first bad one. The
 * instruction is the caller's.
 */
export function optionsFromFlags(
  values: FlagValues,
): Omit<PlayerOptions, "instruction"> | { error: string } {
  const text = (flag: keyof typeof PLAYER_FLAGS): string | undefined => {
    const value = values[flag];
    return typeof value === "string" ? value : undefined;
  };
  const tickMinutes = Number(text("tick-minutes"));
  if (text("tick-minutes") === undefined || !Number.isFinite(tickMinutes) || tickMinutes <= 0) {
    return { error: "--tick-minutes is required: the minutes of game time one tick stands for" };
  }
  const maxLoops = Number(text("max-loops"));
  if (!Number.isInteger(maxLoops) || maxLoops < 1) {
    return {
      error: `--max-loops must be a whole number of at least 1, got "${text("max-loops")}"`,
    };
  }
  const client = (endpoint: string | undefined): ClientOptions => ({
    endpoint,
    keyName: text("key-name"),
  });
  return {
    worldDir: resolve(text("world") ?? "world"),
    tickMinutes,
    headed: values.headed === true,
    maxLoops,
    corpusDir: resolve(text("corpus") ?? "corpus/runs"),
    jev: client(text("jev-endpoint")),
    model: client(text("model-endpoint")),
  };
}

/** The UTC start time, safe as a directory name, made unique within `corpusDir`. */
function runIdFor(corpusDir: string, startedAt: Date): string {
  const base = startedAt.toISOString().replace(/[:.]/g, "-");
  let id = base;
  for (let n = 2; existsSync(join(corpusDir, id)); n++) id = `${base}-${n}`;
  return id;
}

/** GET a bench route's JSON; a non-2xx answer throws naming the route and the status. */
export async function getJson<T>(base: string, path: string): Promise<T> {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/**
 * The history and every person's received copies, read through the bench's routes. Both files
 * are written only once every read has answered, so a history file present is a complete one.
 */
async function writeHistory(base: string, runDir: string): Promise<void> {
  const { events } = await getJson<{ events: WorldEvent[] }>(base, "/api/events?since=0");
  const snapshot = await getJson<Snapshot>(base, "/api/snapshot");
  const lines: string[] = [];
  for (const person of Object.keys(snapshot.people)) {
    const { copies } = await getJson<{ copies: unknown[] }>(
      base,
      `/api/received/${encodeURIComponent(person)}`,
    );
    for (const copy of copies) lines.push(`${JSON.stringify({ thing: person, copy })}\n`);
  }
  writeFileSync(join(runDir, "events.jsonl"), events.map((e) => `${JSON.stringify(e)}\n`).join(""));
  writeFileSync(join(runDir, "received.jsonl"), lines.join(""));
}

/**
 * The reads after the run: the goal's probe, then the history. A failed read is recorded as its own
 * bench failure naming the read; the run's outcome stands.
 */
async function readBench(
  base: string,
  options: PlayerOptions,
  record: RunRecord,
  runDir: string,
): Promise<void> {
  const reads: [BenchFailure["call"], () => Promise<void>][] = [
    [
      "probe",
      async () => {
        if (options.probe !== undefined) record.held = await options.probe(base);
      },
    ],
    ["history", () => writeHistory(base, runDir)],
  ];
  for (const [call, read] of reads) {
    try {
      await read();
    } catch (error) {
      record.benchFailures.push({
        kind: "bench",
        call,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/** Perform one candidate in the browser and wait for the page to settle. */
async function perform(page: Page, candidate: Candidate): Promise<void> {
  const control = locate(page, candidate.control);
  const { move } = candidate;
  await settled(page, async () => {
    if (move.kind === "select") await control.selectOption(move.option);
    else if (move.kind === "press") await control.click();
    else await control.fill(move.text);
  });
}

function printLoop(print: (text: string) => void, entry: LoopRecord): void {
  const lines = [`--- loop ${entry.loop}`, "state:", entry.state, "questions:"];
  for (const [key, question] of Object.entries(entry.questions)) {
    const score =
      key === "done" ? entry.answers.done : entry.answers.scored.find((s) => s.key === key)?.score;
    lines.push(`  ${key}: ${question.instructions} -> ${score}`);
  }
  lines.push(`action: ${entry.action ?? `none (${entry.decision.kind})`}`);
  print(lines.join("\n"));
}

/** Run the player once toward `options.instruction`, recording everything under a new run dir. */
export async function runPlayer(options: PlayerOptions): Promise<PlayerResult> {
  const print = options.print ?? ((text: string) => console.log(text));
  const thresholds = options.thresholds ?? REGISTERED;
  const started = new Date();
  mkdirSync(options.corpusDir, { recursive: true });
  const runId = runIdFor(options.corpusDir, started);
  const runDir = join(options.corpusDir, runId);
  mkdirSync(runDir);
  // loops.jsonl grows as the run goes; events.jsonl and received.jsonl are written once the
  // history has been read back whole, so their absence means it was never read.
  writeFileSync(join(runDir, "loops.jsonl"), "");
  const record: RunRecord = {
    runId,
    instruction: options.instruction,
    startedAt: started.toISOString(),
    endedAt: null,
    parameters: {
      url: options.url ?? null,
      world: options.worldDir,
      tickMinutes: options.tickMinutes,
      maxLoops: options.maxLoops,
      headed: options.headed,
      thresholds,
      jevModel: JEV_MODEL,
      wordsModel: WORDS_MODEL,
    },
    target: null,
    words: null,
    outcome: null,
    loops: 0,
    calls: [],
    costUsd: 0,
    unreportedCosts: 0,
    benchFailures: [],
  };
  const save = () =>
    writeFileSync(join(runDir, "run.json"), `${JSON.stringify(record, null, 2)}\n`);
  const call = (client: Call["client"], purpose: string, costUsd: number | null) => {
    record.calls.push({ client, purpose, costUsd });
    record.costUsd = record.calls.reduce((sum, c) => sum + (c.costUsd ?? 0), 0);
    record.unreportedCosts = record.calls.filter((c) => c.costUsd === null).length;
    save();
  };
  const finish = (outcome: Outcome) => {
    record.outcome = outcome;
    if (outcome.kind === "stopped") record.stopped = outcome.stopped;
    print(`outcome: ${JSON.stringify(outcome)}`);
    save();
  };
  save();
  print(`run ${runId}: ${options.instruction}`);

  let host: { base: string; stop: () => void; dir: string } | null = null;
  let launched: Browser | null = null;
  let context: BrowserContext | null = null;
  /** The bench the run reads back after it ends, once the page has been opened on it. */
  let benchBase: string | null = null;
  try {
    if (options.url === undefined) {
      const dir = mkdtempSync(join(tmpdir(), "strata-player-"));
      const served = startServer({
        world: options.worldDir,
        dbPath: join(dir, "world.sqlite"),
        tickMinutes: options.tickMinutes,
        port: 0,
      });
      if (!served.ok) {
        rmSync(dir, { recursive: true, force: true });
        finish({
          kind: "stopped",
          stopped: { kind: "boot", message: served.refusal.message, call: "boot" },
        });
        return { runDir, record };
      }
      host = { base: `http://127.0.0.1:${served.server.port}/`, stop: served.stop, dir };
    }
    const base = host?.base ?? (options.url as string);
    try {
      if (options.browser === undefined) {
        launched = await chromium.launch({ headless: !options.headed });
      }
    } catch (error) {
      finish({
        kind: "stopped",
        stopped: {
          kind: "browser",
          message: `chromium could not be launched (run \`bunx playwright install chromium\`): ${error}`,
          call: "launch",
        },
      });
      return { runDir, record };
    }
    context = await (options.browser ?? (launched as Browser)).newContext();
    const page = await context.newPage();
    await settled(page, async () => {
      await page.goto(base);
    });
    benchBase = base;
    await play(page, base, options, thresholds, record, { print, call, finish, runDir });
  } catch (error) {
    // Only a run play() has not finished stops on the browser; a finished outcome stands.
    if (record.outcome === null) {
      finish({
        kind: "stopped",
        stopped: { kind: "browser", message: String(error), call: `loop ${record.loops + 1}` },
      });
    }
  } finally {
    if (benchBase !== null) await readBench(benchBase, options, record, runDir);
    for (const failure of record.benchFailures) {
      print(`bench: the ${failure.call} read failed: ${failure.message}`);
    }
    record.endedAt = new Date().toISOString();
    save();
    await context?.close();
    await launched?.close();
    if (host !== null) {
      host.stop();
      rmSync(host.dir, { recursive: true, force: true });
    }
  }
  return { runDir, record };
}

type Hooks = {
  print: (text: string) => void;
  call: (client: Call["client"], purpose: string, costUsd: number | null) => void;
  finish: (outcome: Outcome) => void;
  runDir: string;
};

/** The page read, or null after stopping the run when it has a control with no label. */
async function labelledRead(page: Page, hooks: Hooks, at: string): Promise<PageRead | null> {
  const read = await readPage(page);
  const missing = unlabeled(read.controls);
  if (missing.length === 0) return read;
  hooks.finish({
    kind: "stopped",
    stopped: {
      kind: "page",
      message: `the page has controls with no label: ${missing.map(nameOf).join("; ")}`,
      call: at,
    },
  });
  return null;
}

async function play(
  page: Page,
  base: string,
  options: PlayerOptions,
  thresholds: Thresholds,
  record: RunRecord,
  hooks: Hooks,
): Promise<void> {
  const first = await labelledRead(page, hooks, "target");
  if (first === null) return;
  const asked = await askTarget(options.instruction, first, options.model);
  if (!asked.ok) {
    hooks.finish({ kind: "stopped", stopped: { ...asked.refusal, call: "target" } });
    return;
  }
  hooks.call("model", "target", asked.costUsd);
  const target = asked.value;
  record.target = target;
  hooks.print(`target: ${JSON.stringify(target)}`);
  if (target.kind === "no-such-action") {
    hooks.finish({ kind: "no-such-action", reason: target.reason });
    return;
  }
  let words: string | null = null;
  if (target.needsWords) {
    const written = await askWords(options.instruction, target, options.model);
    if (!written.ok) {
      hooks.finish({ kind: "stopped", stopped: { ...written.refusal, call: "words" } });
      return;
    }
    hooks.call("model", "words", written.costUsd);
    words = written.value;
    record.words = words;
    hooks.print(`words: ${words}`);
  }
  const goal: Goal = { instruction: options.instruction, target, words };

  for (let loop = 1; loop <= options.maxLoops; loop++) {
    const read = await labelledRead(page, hooks, `loop ${loop}`);
    if (read === null) return;
    const offered = candidates(read.controls, words);
    const state = renderState(goal, read.text);
    let held: boolean | undefined;
    try {
      held = options.probe === undefined ? undefined : await options.probe(base);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      hooks.finish({ kind: "stopped", stopped: { kind: "bench", message, call: `loop ${loop}` } });
      return;
    }
    const answered = await ask(state, goal, offered, options.jev);
    if (!answered.ok) {
      hooks.finish({ kind: "stopped", stopped: { ...answered.refusal, call: `loop ${loop}` } });
      return;
    }
    hooks.call("jev", `loop ${loop}`, answered.costUsd);
    const decision = choose(answered.done, answered.scored, thresholds);
    const chosen =
      decision.kind === "act" ? offered.find((c) => c.key === decision.chosen.key) : undefined;
    const entry: LoopRecord = {
      loop,
      state,
      controls: read.controls,
      candidates: offered.map((c) => ({
        key: c.key,
        description: c.description,
        control: c.control.id,
        move: c.move,
      })),
      questions: answered.questions,
      answers: { done: answered.done, scored: answered.scored },
      decision,
      action: chosen?.description ?? null,
      ...(held === undefined ? {} : { held }),
      costUsd: answered.costUsd,
    };
    record.loops = loop;
    printLoop(hooks.print, entry);
    appendFileSync(join(hooks.runDir, "loops.jsonl"), `${JSON.stringify(entry)}\n`);
    if (decision.kind === "reached") {
      hooks.finish({ kind: "reached", loop, done: decision.done });
      return;
    }
    if (chosen === undefined) {
      hooks.finish({ kind: "stuck", loop, best: decision.kind === "stuck" ? decision.best : null });
      return;
    }
    await perform(page, chosen);
  }
  hooks.finish({ kind: "ceiling", loops: options.maxLoops });
}
