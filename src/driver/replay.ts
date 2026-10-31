import type { WorldDefs } from "../engine/definitions.ts";
import type { WorldEvent } from "../engine/events.ts";
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
