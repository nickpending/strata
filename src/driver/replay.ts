import type { WorldDefs } from "../engine/definitions.ts";
import { witnessesOf } from "../engine/engine.ts";
import { redact, type WorldEvent } from "../engine/events.ts";
import { type Fact, initialKnown, type KnownRow, learned, nowOf } from "../engine/knowledge.ts";
import { buildSnapshot, type Snapshot } from "../engine/snapshot.ts";
import { applyPart, initialRows, type StateRow } from "../engine/things.ts";

/** Where live state and the replayed log part ways: the row, the last event applied, both values. */
export type Difference = {
  thing: string;
  part: string;
  event: string | null;
  live: unknown;
  replayed: unknown;
};

/**
 * The state rows the log reaches from the booted definitions: every part's reducer over every row
 * for each event in seq order. Pure: it reads nothing but its arguments and persists nothing.
 */
export function project(defs: WorldDefs, events: WorldEvent[]): StateRow[] {
  let rows = initialRows(defs);
  for (const event of [...events].sort((a, b) => a.seq - b.seq)) {
    rows = rows.map((row) => ({ ...row, state: applyPart(row.part, row.thing, row.state, event) }));
  }
  return rows;
}

/** A fact that did not hold of the world right after the event that taught it. */
export type FalseFact = {
  witness: string;
  event: string;
  fact: Fact;
  value: unknown;
  now: unknown;
};

/** An arrive whose `present` is not the people who were in its room just before it. */
export type WrongPresent = { event: string; present: unknown; expected: string[] };

/** What replaying the log reaches of every person's knowledge, and what it found wrong. */
export type KnownProjection = {
  /** Every known row, in the order record() appends them, without seq. */
  rows: KnownRow[];
  falseFacts: FalseFact[];
  wrongPresent: WrongPresent[];
};

/**
 * The known rows the log reaches from the booted definitions, replayed as record() writes them:
 * from initialKnown, each event applied through every part, its witnesses read from the state
 * after it, each witness's copy redacted and learned. Beside them, every fact whose value differs
 * from the world's right after its teaching event, and every arrive whose `present` is not the
 * people in its room just before it, sorted, the mover not among them. Pure, like project.
 */
export function projectKnown(
  defs: WorldDefs,
  tickMinutes: number,
  events: WorldEvent[],
): KnownProjection {
  let rows = initialRows(defs);
  const projection: KnownProjection = {
    rows: initialKnown(defs),
    falseFacts: [],
    wrongPresent: [],
  };
  for (const event of [...events].sort((a, b) => a.seq - b.seq)) {
    const wrong = wrongPresent(event, buildSnapshot(rows, defs, tickMinutes));
    if (wrong !== null) projection.wrongPresent.push(wrong);
    rows = rows.map((row) => ({ ...row, state: applyPart(row.part, row.thing, row.state, event) }));
    taught(event, buildSnapshot(rows, defs, tickMinutes), projection);
  }
  return projection;
}

/** `event`, when an arrive whose `present` is not who `before` holds in its room; else null. */
function wrongPresent(event: WorldEvent, before: Snapshot): WrongPresent | null {
  if (event.subkind !== "physical.arrive") return null;
  const { to, present } = event.payload;
  const expected = (before.views.presence[to] ?? []).filter((p) => p !== event.actor).sort();
  return Bun.deepEquals(present, expected, true) ? null : { event: event.id, present, expected };
}

/**
 * Append to `projection` each row `event` teaches each witness, found from `after`, the state
 * right after it, and each of those facts that `after` does not bear out.
 */
function taught(event: WorldEvent, after: Snapshot, projection: KnownProjection): void {
  for (const witness of witnessesOf(event, after)) {
    for (const fact of learned(redact(event, witness), witness)) {
      projection.rows.push({ ...fact, witness, tick: event.tick, event: event.id });
      const now = nowOf(fact, after);
      if (!Bun.deepEquals(fact.value, now, true)) {
        projection.falseFacts.push({ witness, event: event.id, fact, value: fact.value, now });
      }
    }
  }
}

/** Rows keyed by `thing/part`, so neither side's order matters. */
function keyed(rows: StateRow[]): Map<string, StateRow> {
  return new Map(rows.map((row) => [`${row.thing}\u0000${row.part}`, row]));
}

/** The order compare walks rows in: by thing, then part, compared as plain strings. */
function byThingThenPart(a: StateRow, b: StateRow): number {
  if (a.thing !== b.thing) return a.thing < b.thing ? -1 : 1;
  if (a.part !== b.part) return a.part < b.part ? -1 : 1;
  return 0;
}

/**
 * The first row, by (thing, part), where `live` and `replayed` differ, or null when they hold the
 * same rows with equal states. `event` is the id of the last event applied, named in the difference.
 * A row on one side only differs with `null` standing for the missing value.
 */
export function compare(
  live: StateRow[],
  replayed: StateRow[],
  event: string | null,
): Difference | null {
  const liveRows = keyed(live);
  const replayedRows = keyed(replayed);
  const all = keyed([...replayed, ...live]);
  for (const row of [...all.values()].sort(byThingThenPart)) {
    const key = `${row.thing}\u0000${row.part}`;
    const left = liveRows.get(key);
    const right = replayedRows.get(key);
    if (
      left !== undefined &&
      right !== undefined &&
      Bun.deepEquals(left.state, right.state, true)
    ) {
      continue;
    }
    return {
      thing: row.thing,
      part: row.part,
      event,
      live: left === undefined ? null : left.state,
      replayed: right === undefined ? null : right.state,
    };
  }
  return null;
}
