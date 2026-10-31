import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type BootRefusal, boot, type Engine } from "../engine/engine.ts";
import type { WorldEvent } from "../engine/events.ts";
import { verbs } from "../engine/rules.ts";
import { randomAction } from "./actions.ts";
import { check, type Violation } from "./invariants.ts";
import { compare, type Difference, project } from "./replay.ts";
import { seeded } from "./rng.ts";

export type DriverOptions = {
  worldDir: string;
  tickMinutes: number;
  seed: number;
  /** How many actions to draw and act. */
  actions: number;
  /** A step after every this many actions. */
  stepEvery: number;
};

/** Each call's outcome: events recorded by subkind, refusals by code, and invalid actions. */
export type Tally = {
  recorded: Record<string, number>;
  refused: Record<string, number>;
  invalid: number;
};

/** What one failed check found, with the message naming it. */
type Found = { message: string } & (
  | { check: "refusal"; before: number; after: number }
  | { check: "replay"; difference: Difference }
  | { check: "invariants"; violations: Violation[] }
);

/** The first check that failed, what it found, and where. */
export type Failure = Found & {
  /** The iteration (1-based action number) and whether the act or the step after it failed. */
  at: { iteration: number; call: "act" | "step" };
};

export type DriverReport = {
  ok: boolean;
  seed: number;
  actions: number;
  steps: number;
  tally: Tally;
  /** How many replay and invariant checks passed. */
  checks: { replay: number; invariants: number };
  failure?: Failure;
};

export type DriverResult = { ok: true; report: DriverReport } | { ok: false; refusal: BootRefusal };

/** The refusal check: a refused or invalid action leaves the log's length and every row as they were. */
function unchanged(engine: Engine, before: { count: number; rows: string }): Found | null {
  const after = engine.events().length;
  if (after !== before.count) {
    return {
      check: "refusal",
      before: before.count,
      after,
      message: `a refused or invalid action changed the event count from ${before.count} to ${after}`,
    };
  }
  if (JSON.stringify(engine.rows()) !== before.rows) {
    return {
      check: "refusal",
      before: before.count,
      after,
      message: "a refused or invalid action changed the state rows",
    };
  }
  return null;
}

/** Replay the log from the definitions and compare with the live rows. */
function replayed(engine: Engine, events: WorldEvent[]): Found | null {
  const difference = compare(
    engine.rows(),
    project(engine.defs, events),
    events.at(-1)?.id ?? null,
  );
  if (difference === null) return null;
  const { thing, part, event, live, replayed: value } = difference;
  return {
    check: "replay",
    difference,
    message: `replay differs at ${thing} ${part} after ${event}: live ${JSON.stringify(live)}, replayed ${JSON.stringify(value)}`,
  };
}

/** Run the invariants over the engine's snapshot, log and every person's received copies. */
function invariants(engine: Engine, events: WorldEvent[]): Found | null {
  const snapshot = engine.snapshot();
  const received = Object.fromEntries(
    Object.keys(snapshot.people).map((person) => [person, engine.received(person)]),
  );
  const violations = check({ snapshot, events, received });
  if (violations.length === 0) return null;
  return {
    check: "invariants",
    violations,
    message: violations.map((v) => `${v.invariant} invariant: ${v.thing}: ${v.detail}`).join("; "),
  };
}

function count(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

/**
 * Boot the world into a temporary database, draw and act `actions` random actions with a step
 * after every `stepEvery`, and after every call run the refusal check (for a refused or invalid
 * action), the replay oracle and the invariants. Stops at the first failure. The database is
 * removed at the end; the definitions are only read.
 */
export function runDriver(options: DriverOptions): DriverResult {
  const dir = mkdtempSync(join(tmpdir(), "strata-driver-"));
  try {
    const booted = boot(options.worldDir, {
      tickMinutes: options.tickMinutes,
      dbPath: join(dir, "world.sqlite"),
    });
    if (!booted.ok) return booted;
    const { engine } = booted;
    try {
      return { ok: true, report: drive(engine, options) };
    } finally {
      engine.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function drive(engine: Engine, options: DriverOptions): DriverReport {
  const rng = seeded(options.seed);
  const verbList = verbs();
  const tally: Tally = { recorded: {}, refused: {}, invalid: 0 };
  const checks = { replay: 0, invariants: 0 };
  let steps = 0;
  const report = (failure?: Failure): DriverReport => ({
    ok: failure === undefined,
    seed: options.seed,
    actions: options.actions,
    steps,
    tally,
    checks,
    ...(failure === undefined ? {} : { failure }),
  });

  /** Every check after one call, counting those that pass; the first failure found, or null. */
  const verify = (before: { count: number; rows: string } | null): Found | null => {
    const refusal = before === null ? null : unchanged(engine, before);
    if (refusal !== null) return refusal;
    const events = engine.events();
    const replay = replayed(engine, events);
    if (replay !== null) return replay;
    checks.replay++;
    const broken = invariants(engine, events);
    if (broken !== null) return broken;
    checks.invariants++;
    return null;
  };

  for (let iteration = 1; iteration <= options.actions; iteration++) {
    const action = randomAction(engine.snapshot(), verbList, rng);
    const before = { count: engine.events().length, rows: JSON.stringify(engine.rows()) };
    const result = engine.act(action);
    if (result.outcome === "recorded") {
      for (const event of result.events) count(tally.recorded, event.subkind);
    } else if (result.outcome === "refused") count(tally.refused, result.refused.code);
    else tally.invalid++;
    const acted = verify(result.outcome === "recorded" ? null : before);
    if (acted !== null) return report({ ...acted, at: { iteration, call: "act" } });

    if (iteration % options.stepEvery !== 0) continue;
    for (const event of engine.step()) count(tally.recorded, event.subkind);
    steps++;
    const stepped = verify(null);
    if (stepped !== null) return report({ ...stepped, at: { iteration, call: "step" } });
  }
  return report();
}
