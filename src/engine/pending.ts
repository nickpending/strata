/**
 * Pending states: every clock schedule entry is a wait an action opened, which the clock closes at
 * its tick unless someone closes it first. Each is derived, never stated: what opened it is the log's
 * event, what the clock fires is the entry, and who closes it first is found by running every verb by
 * every person through the rules and the reducers on copies of the rows, keeping each action after
 * which the entry is gone. Nothing here names a verb, a subkind or a part.
 */
import { dueDrafts, type Scheduled } from "./clock.ts";
import type { WorldDefs } from "./definitions.ts";
import { eventOf } from "./engine.ts";
import type { EventDraft, Subkind, WorldEvent } from "./events.ts";
import { type Action, actionSchema, fieldIds, rule, verbs } from "./rules.ts";
import { buildSnapshot, type Snapshot } from "./snapshot.ts";
import { applyPart, type Location, type StateRow } from "./things.ts";

/** What a state reached holds: every item's holder and every person's location. */
export type After = { holders: Record<string, string>; locations: Record<string, Location> };

/** The event that opened a pending state, as the log records it. */
export type Opened = Pick<WorldEvent, "id" | "subkind" | "actor" | "targets" | "payload">;

/** An action that closes a pending state now, who takes it, and what it leaves. */
export type Resolution = { by: string; action: Action; after: After };

/** One schedule entry: what opened it, what the clock fires when it falls due, and who closes it first. */
export type Pending = {
  opened: Opened;
  due: { at: number; fires: Subkind; after: After };
  resolutions: Resolution[];
};

/** The value a free-text field is tried with: any line will do, none is read. */
const FREE_TEXT = "a line";

/** `rows` with each of `drafts` recorded after `lastSeq` and applied through every part's reducer. */
function applied(rows: StateRow[], drafts: EventDraft[], lastSeq: number): StateRow[] {
  let reached = rows;
  drafts.forEach((draft, i) => {
    const event = eventOf(draft, lastSeq + i + 1);
    reached = reached.map((row) => ({
      ...row,
      state: applyPart(row.part, row.thing, row.state, event),
    }));
  });
  return reached;
}

/** The item holders and person locations of `snapshot`. */
export function afterOf(snapshot: Snapshot): After {
  return {
    holders: Object.fromEntries(
      Object.entries(snapshot.items).map(([item, state]) => [item, state.holder]),
    ),
    locations: Object.fromEntries(
      Object.entries(snapshot.people).map(([person, state]) => [person, state.location]),
    ),
  };
}

/** Every action of every verb by every person, each field over the ids it ranges over. */
function everyAction(snapshot: Snapshot): Action[] {
  const actions: Action[] = [];
  for (const { verb, fields } of verbs()) {
    for (const actor of Object.keys(snapshot.people)) {
      let partial: Record<string, string>[] = [{ actor, verb }];
      for (const field of fields) {
        const ids = fieldIds(field, snapshot) ?? [FREE_TEXT];
        partial = partial.flatMap((action) => ids.map((id) => ({ ...action, [field]: id })));
      }
      for (const action of partial) {
        const parsed = actionSchema.safeParse(action);
        if (parsed.success) actions.push(parsed.data);
      }
    }
  }
  return actions;
}

/**
 * Every pending state of the world `rows` hold, one per schedule entry in insertion order. `events`
 * is the log so far, where each entry's opening event is found by its id.
 */
export function pendingOf(
  rows: StateRow[],
  defs: WorldDefs,
  tickMinutes: number,
  events: WorldEvent[],
): Pending[] {
  const snapshot = buildSnapshot(rows, defs, tickMinutes);
  if (snapshot.schedule.length === 0) return [];
  const lastSeq = events.at(-1)?.seq ?? 0;
  const tried = everyAction(snapshot).flatMap((action) => {
    const result = rule(snapshot, action);
    if ("refused" in result) return [];
    const reached = buildSnapshot(applied(rows, result.events, lastSeq), defs, tickMinutes);
    return [{ action, reached }];
  });
  const stands = (entry: Scheduled, schedule: Scheduled[]) =>
    schedule.some((other) => Bun.deepEquals(other, entry, true));
  return snapshot.schedule.map((entry) => {
    const opening = events.find((event) => event.id === entry.cause);
    if (opening === undefined) {
      throw new Error(`the schedule entry's cause ${entry.cause} names no event`);
    }
    const { id, subkind, actor, targets, payload } = opening;
    const fired = applied(rows, dueDrafts([entry], entry.at), lastSeq);
    return {
      opened: { id, subkind, actor, targets, payload } as Opened,
      due: {
        at: entry.at,
        fires: entry.subkind,
        after: afterOf(buildSnapshot(fired, defs, tickMinutes)),
      },
      resolutions: tried
        .filter(({ reached }) => !stands(entry, reached.schedule))
        .map(({ action, reached }) => ({ by: action.actor, action, after: afterOf(reached) })),
    };
  });
}
