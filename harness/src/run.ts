/**
 * The harness's loop: open the bench at `url` (or one `host` hosts) in chromium, read the verbs and
 * subkinds it serves, ask the model for the target end state (a run whose end state already holds
 * ends there, already-held, having done nothing) and the words, then read the page,
 * the snapshot route's pending states and whether the end state holds, ask Jev, perform the rule's
 * choice in the browser, and loop until reached, stuck, the ceiling, or a refusal. Every loop is
 * printed as it happens and appended to loops.jsonl; a headed run then holds until the operator
 * steps it before performing anything, and holds once more, however it ended, before it closes the
 * browser. run.json is rewritten as the run goes; the history is read back through the bench's own
 * routes at the end.
 */
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import {
  type EventsBody,
  getJson,
  type ReceivedBody,
  type SnapshotBody,
  type SubkindsBody,
  type VerbsBody,
} from "./bench.ts";
import { type Candidate, candidates } from "./candidates.ts";
import { described, type EndState, holds } from "./goal.ts";
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
  advanced,
  ask,
  type Decision,
  decideLoop,
  type Goal,
  PLAN_START,
  PRESS_ACT,
  REGISTERED,
  renderState,
  type Scored,
  type Seen,
  type Thresholds,
} from "./rule.ts";
import { askTarget, type RecordedTarget, type Served, writesWords } from "./target.ts";
import { words as askWords, DEFAULT_MODEL, type ModelOptions } from "./words.ts";

/** A bench hosted for one run: where it answers and how to stop it, or why it would not boot. */
export type Hosted = { ok: true; base: string; stop: () => void } | { ok: false; message: string };

/** Hosts a fresh bench over `worldDir` at `tickMinutes` for a run with no `url`. */
export type Host = (bench: { worldDir: string; tickMinutes: number }) => Hosted;

/**
 * Where a headed run holds: before performing an action, or, once the run has ended, before it
 * closes the browser.
 */
export type Held = { kind: "perform"; action: string } | { kind: "close" };

/**
 * Asked at each hold of a headed run: before an action, go performs it and end stops the run
 * there; before the close, either answer closes the browser.
 */
export type Hold = (held: Held) => Promise<"go" | "end">;

export type DriveOptions = {
  instruction: string;
  /** A bench to drive; absent, the run drives a fresh one `host` hosts. */
  url?: string | undefined;
  /** Hosts the bench a run with no `url` drives; with neither, the run has no bench and stops. */
  host?: Host | undefined;
  /** Asked at each hold of a headed run; holdOnEnter over stdin when absent. */
  hold?: Hold | undefined;
  worldDir: string;
  tickMinutes: number;
  headed: boolean;
  maxLoops: number;
  /** Where run directories are made: corpus/runs by default. */
  corpusDir: string;
  jev: ClientOptions;
  /** The player's model client; its model is DEFAULT_MODEL when none is named. */
  model: ModelOptions;
  thresholds?: Thresholds;
  /** Whether a goal file's expectation holds on the bench at `base`; asked once the run ends. */
  probe?: (base: string) => Promise<boolean>;
  /** Where each loop is printed as it happens; stdout by default. */
  print?: (text: string) => void;
  /** A browser to open the page in, kept open after the run; absent, the run launches its own. */
  browser?: Browser;
};

/**
 * Why a run stopped short: a client's refusal (config, network, status, parse), a bench that would
 * not boot, a page with an unlabeled control, a browser the harness cannot work, a bench route
 * the run could not read, or the operator ending a headed run at its hold. `call` names where:
 * boot, launch, target, words or the loop.
 */
export type Stopped = {
  kind: Refusal["kind"] | "boot" | "page" | "browser" | "bench" | "hold";
  message: string;
  call: string;
  status?: number;
};

export type Outcome =
  | { kind: "reached"; loop: number; done: number }
  | {
      kind: "stuck";
      loop: number;
      best: Scored | null;
      pending?: Extract<Decision, { kind: "stuck" }>["pending"];
      step?: Extract<Decision, { kind: "stuck" }>["step"];
    }
  | { kind: "no-such-action"; reason: string }
  /** The target's end state held on the bench before the run acted: nothing was done. */
  | { kind: "already-held"; expect: EndState }
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
  /** Whether the run's end state held on the bench when the loop read the page. */
  held: boolean;
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
  target: RecordedTarget | null;
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
  /** Whether the goal file's expectation held at the end (scoring runs only). */
  held?: boolean;
  /** Bench reads after the run that failed (the probe, the history), each naming its read. */
  benchFailures: BenchFailure[];
};

/** A read of the bench's routes that failed after the run: the outcome stands, this read is missing. */
export type BenchFailure = { kind: "bench"; call: "probe" | "history"; message: string };

export type DriveResult = { runDir: string; record: RunRecord };

/** The command-line flags a run and score share, for node:util parseArgs. */
export const RUN_FLAGS = {
  "tick-minutes": { type: "string" },
  world: { type: "string", default: "world" },
  corpus: { type: "string", default: "corpus/runs" },
  "max-loops": { type: "string", default: "24" },
  headed: { type: "boolean", default: false },
  "jev-endpoint": { type: "string" },
  "model-endpoint": { type: "string" },
  /** The apiconf key to send; an endpoint override is sent a key only when this names one. */
  "key-name": { type: "string" },
  /** The player's model, which writes the target and the words; DEFAULT_MODEL when absent. */
  model: { type: "string" },
} as const;

export const RUN_USAGE =
  "--tick-minutes <n> [--world world] [--corpus corpus/runs] [--max-loops 24] [--headed] [--jev-endpoint <url>] [--model-endpoint <url>] [--key-name sable-openrouter] [--model <provider/model>]";

/** An OpenRouter model id, <provider>/<model>: one slash, and neither part leading with a dot. */
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._:-]*$/;

/** The message refusing `value` given as `flag`, or null when it is a model id. */
export function modelIdRefusal(flag: string, value: string): string | null {
  return MODEL_ID.test(value)
    ? null
    : `${flag} must be an OpenRouter model id, <provider>/<model>, got "${value}"`;
}

type FlagValues = { [K in keyof typeof RUN_FLAGS]?: string | boolean | undefined };

/**
 * The run options the shared flags give, or the message naming the first bad one. The
 * instruction is the caller's.
 */
export function optionsFromFlags(
  values: FlagValues,
): Omit<DriveOptions, "instruction"> | { error: string } {
  const text = (flag: keyof typeof RUN_FLAGS): string | undefined => {
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
  const model = text("model");
  const refused = model === undefined ? null : modelIdRefusal("--model", model);
  if (refused !== null) return { error: refused };
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
    model: { ...client(text("model-endpoint")), model },
  };
}

/** The UTC start time, safe as a directory name, made unique within `corpusDir`. */
function runIdFor(corpusDir: string, startedAt: Date): string {
  const base = startedAt.toISOString().replace(/[:.]/g, "-");
  let id = base;
  for (let n = 2; existsSync(join(corpusDir, id)); n++) id = `${base}-${n}`;
  return id;
}

/**
 * The history and every person's received copies, read through the bench's routes. Both files
 * are written only once every read has answered, so a history file present is a complete one.
 */
async function writeHistory(base: string, runDir: string): Promise<void> {
  const { events } = await getJson<EventsBody>(base, "/api/events?since=0");
  const snapshot = await getJson<SnapshotBody>(base, "/api/snapshot");
  const lines: string[] = [];
  for (const person of Object.keys(snapshot.people)) {
    const { copies } = await getJson<ReceivedBody>(
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
  options: DriveOptions,
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
  const { decision } = entry;
  const serves = "pending" in decision && decision.pending !== undefined ? decision.pending : null;
  const index =
    decision.kind === "plan"
      ? decision.step
      : decision.kind === "stuck"
        ? decision.step?.index
        : undefined;
  const why = [
    ...(serves === null ? [] : [`pending ${serves.subkind} ${serves.event}`]),
    ...(index === undefined ? [] : [`plan step ${index + 1}`]),
  ];
  lines.push(`held: ${entry.held}`);
  lines.push(`decision: ${decision.kind}${why.length === 0 ? "" : ` (${why.join("; ")})`}`);
  lines.push(`action: ${entry.action ?? `none (${entry.decision.kind})`}`);
  print(lines.join("\n"));
}

/** A stream read line by line: its reader, once opened, the text not yet taken, and whether it ended. */
type LineSource = {
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
  decoder: TextDecoder;
  buffered: string;
  ended: boolean;
};

/** The process's stdin, one stream however many runs hold on it. */
const STDIN = () => Bun.stdin.stream();

/** Each input's one line source: a stream takes one reader, so every hold over it shares it. */
const sources = new WeakMap<() => ReadableStream<Uint8Array>, LineSource>();

/**
 * The hold a headed run uses when none is given: it prints what it holds before (the action, or the
 * browser's close), and answers go on the next line `input` gives, end once `input` has ended.
 * Every hold over the same `input`
 * shares one reader, so every run of a process (each goal of a headed score) holds on stdin in
 * turn, each line answering one call.
 */
export function holdOnEnter(
  input: () => ReadableStream<Uint8Array> = STDIN,
  print: (text: string) => void = (text) => console.log(text),
): Hold {
  return async (held) => {
    print(
      held.kind === "close"
        ? "hold: press Enter to close the browser"
        : `hold: press Enter to perform "${held.action}"`,
    );
    let source = sources.get(input);
    if (source === undefined) {
      source = { reader: null, decoder: new TextDecoder(), buffered: "", ended: false };
      sources.set(input, source);
    }
    while (!source.buffered.includes("\n")) {
      if (source.ended) return "end";
      source.reader ??= input().getReader();
      const { done, value } = await source.reader.read();
      if (done) source.ended = true;
      else source.buffered += source.decoder.decode(value, { stream: true });
    }
    source.buffered = source.buffered.slice(source.buffered.indexOf("\n") + 1);
    return "go";
  };
}

/**
 * Let go of `input` once nothing will hold on it again: cancel its reader, if a hold opened one,
 * so an open stdin no longer keeps the process alive. A command line calls it once, when its work
 * ends; a hold after it answers end.
 */
export async function releaseHolds(input: () => ReadableStream<Uint8Array> = STDIN): Promise<void> {
  const source = sources.get(input);
  if (source === undefined) return;
  source.ended = true;
  const { reader } = source;
  source.reader = null;
  await reader?.cancel();
}

/** Drive the bench once toward `options.instruction`, recording everything under a new run dir. */
export async function drive(options: DriveOptions): Promise<DriveResult> {
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
      wordsModel: options.model.model ?? DEFAULT_MODEL,
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
  const hold = options.headed ? (options.hold ?? holdOnEnter(undefined, print)) : null;

  let hosted: Extract<Hosted, { ok: true }> | null = null;
  let launched: Browser | null = null;
  let context: BrowserContext | null = null;
  /** The bench the run reads back after it ends, once the page has been opened on it. */
  let benchBase: string | null = null;
  try {
    if (options.url === undefined) {
      const bench = options.host?.({
        worldDir: options.worldDir,
        tickMinutes: options.tickMinutes,
      }) ?? {
        ok: false,
        message: "no bench to drive: the run was given no --url and no host to host one",
      };
      if (!bench.ok) {
        finish({
          kind: "stopped",
          stopped: { kind: "boot", message: bench.message, call: "boot" },
        });
        return { runDir, record };
      }
      hosted = bench;
    }
    const base = hosted?.base ?? (options.url as string);
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
    await play(page, base, options, thresholds, record, { print, call, finish, runDir, hold });
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
    // A headed run's operator watches the last step land: the browser closes on their word.
    if (hold !== null && context !== null) await hold({ kind: "close" });
    await context?.close();
    await launched?.close();
    hosted?.stop();
  }
  return { runDir, record };
}

type Hooks = {
  print: (text: string) => void;
  call: (client: Call["client"], purpose: string, costUsd: number | null) => void;
  finish: (outcome: Outcome) => void;
  runDir: string;
  /** The headed run's hold; null in a headless run, which never holds. */
  hold: Hold | null;
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
  options: DriveOptions,
  thresholds: Thresholds,
  record: RunRecord,
  hooks: Hooks,
): Promise<void> {
  /** Stop the run on a bench route it could not read at `call`. */
  const benchStop = (error: unknown, call: string) => {
    const message = error instanceof Error ? error.message : String(error);
    hooks.finish({ kind: "stopped", stopped: { kind: "bench", message, call } });
  };
  const first = await labelledRead(page, hooks, "target");
  if (first === null) return;
  let served: Served;
  try {
    const { verbs } = await getJson<VerbsBody>(base, "/api/verbs");
    const { subkinds } = await getJson<SubkindsBody>(base, "/api/subkinds");
    served = { verbs, subkinds };
  } catch (error) {
    benchStop(error, "target");
    return;
  }
  const asked = await askTarget(options.instruction, first, served, options.model);
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
  // An end state that holds before the run acts is refused, as checked() refuses one the page
  // does not show: a loop would read it held and call the run reached having done nothing.
  let already: boolean;
  try {
    already = await holds(target.expect, base);
  } catch (error) {
    benchStop(error, "target");
    return;
  }
  if (already) {
    hooks.print(`already held: ${described(target.expect)}`);
    hooks.finish({ kind: "already-held", expect: target.expect });
    return;
  }
  let words: string | null = null;
  if (writesWords(target, served.verbs)) {
    const written = await askWords(options.instruction, target.expect, options.model);
    if (!written.ok) {
      hooks.finish({ kind: "stopped", stopped: { ...written.refusal, call: "words" } });
      return;
    }
    hooks.call("model", "words", written.costUsd);
    words = written.value;
    record.words = words;
    hooks.print(`words: ${words}`);
  }
  const goal: Goal = { instruction: options.instruction, target, words, verbs: served.verbs };
  let plan = PLAN_START;
  /** The log's last seq before a press Act the plan led to, until the next loop reads what it recorded. */
  let pressedAfter: number | null = null;

  for (let loop = 1; loop <= options.maxLoops; loop++) {
    const read = await labelledRead(page, hooks, `loop ${loop}`);
    if (read === null) return;
    const offered = candidates(read.controls, words);
    let seen: Seen;
    try {
      if (pressedAfter !== null) {
        const since = `/api/events?since=${pressedAfter}`;
        plan = advanced(plan, target.steps, (await getJson<EventsBody>(base, since)).events);
        pressedAfter = null;
      }
      const { pending } = await getJson<SnapshotBody>(base, "/api/snapshot");
      seen = { held: await holds(target.expect, base), pending, controls: read.controls, plan };
    } catch (error) {
      benchStop(error, `loop ${loop}`);
      return;
    }
    const state = renderState(goal, read.text, plan);
    const answered = await ask(state, goal, offered, options.jev);
    if (!answered.ok) {
      hooks.finish({ kind: "stopped", stopped: { ...answered.refusal, call: `loop ${loop}` } });
      return;
    }
    hooks.call("jev", `loop ${loop}`, answered.costUsd);
    const decision = decideLoop(goal, seen, answered, thresholds);
    const chosen =
      "chosen" in decision ? offered.find((c) => c.key === decision.chosen.key) : undefined;
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
      held: seen.held,
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
      const stuck = decision.kind === "stuck" ? decision : null;
      hooks.finish({
        kind: "stuck",
        loop,
        best: stuck?.best ?? null,
        ...(stuck?.pending === undefined ? {} : { pending: stuck.pending }),
        ...(stuck?.step === undefined ? {} : { step: stuck.step }),
      });
      return;
    }
    if (decision.kind === "plan" && chosen.description === PRESS_ACT) {
      try {
        const { events } = await getJson<EventsBody>(base, "/api/events?since=0");
        pressedAfter = events.at(-1)?.seq ?? 0;
      } catch (error) {
        benchStop(error, `loop ${loop}`);
        return;
      }
    }
    const held: Held = { kind: "perform", action: chosen.description };
    if (hooks.hold !== null && (await hooks.hold(held)) === "end") {
      hooks.finish({
        kind: "stopped",
        stopped: {
          kind: "hold",
          message: `the operator ended the run before "${chosen.description}"`,
          call: `loop ${loop}`,
        },
      });
      return;
    }
    await perform(page, chosen);
  }
  hooks.finish({ kind: "ceiling", loops: options.maxLoops });
}
