import { CLOCK, type EventDraft, OPERATOR, type PayloadOf } from "./events.ts";
import type { Snapshot } from "./snapshot.ts";
import type { Part } from "./things.ts";

type ScheduledBase = { at: number; cause: string; actor: string; targets: string[]; place: string };

/**
 * An event the clock will fire at tick `at`, caused by the event whose id is `cause`. An arrive's
 * entry carries no `present`: who is in the room is read when the clock fires it (fired).
 */
export type Scheduled =
  | (ScheduledBase & {
      subkind: "physical.arrive";
      payload: Omit<PayloadOf<"physical.arrive">, "present">;
    })
  | (ScheduledBase & { subkind: "exchange.lapse"; payload: PayloadOf<"exchange.lapse"> });

/** The clock's pending entries, in insertion order. */
export type Schedule = Scheduled[];

export const tickPart: Part<null, number> = {
  owner: "clock",
  initial: () => 0,
  reducer: () => (state, event) => (event.subkind === "time.tick" ? event.tick : state),
};

/**
 * A depart schedules its arrive at `arrivesAt`; an offer schedules its lapse at `until`; an accept
 * or refuse of the item drops the pending lapse; a fired entry leaves when its event is recorded.
 */
export const schedulePart: Part<null, Schedule> = {
  owner: "clock",
  initial: () => [],
  reducer: () => (state, event) => {
    switch (event.subkind) {
      case "physical.depart": {
        const { from, to, arrivesAt } = event.payload;
        return [
          ...state,
          {
            at: arrivesAt,
            cause: event.id,
            subkind: "physical.arrive",
            actor: event.actor,
            targets: [],
            place: to,
            payload: { from, to },
          },
        ];
      }
      case "exchange.offer": {
        const to = event.targets[0];
        if (to === undefined || event.place === null) return state;
        return [
          ...state,
          {
            at: event.payload.until,
            cause: event.id,
            subkind: "exchange.lapse",
            actor: event.actor,
            targets: [to],
            place: event.place,
            payload: { item: event.payload.item, from: event.actor, to },
          },
        ];
      }
      case "exchange.accept":
      case "exchange.refuse": {
        const { item } = event.payload;
        return without(state, (e) => e.subkind === "exchange.lapse" && e.payload.item === item);
      }
      case "physical.arrive":
      case "exchange.lapse":
        return without(state, (e) => e.subkind === event.subkind && e.cause === event.cause);
      default:
        return state;
    }
  },
};

/** `schedule` without the entries `drop` matches; `schedule` itself when it matches none. */
function without(schedule: Schedule, drop: (entry: Scheduled) => boolean): Schedule {
  const kept = schedule.filter((entry) => !drop(entry));
  return kept.length === schedule.length ? schedule : kept;
}

/** The `time.tick` that advances the clock to `tick`. */
export function tickDraft(tick: number): EventDraft {
  return {
    subkind: "time.tick",
    tick,
    actor: CLOCK,
    targets: [],
    place: null,
    cause: OPERATOR,
    payload: {},
  };
}

/** The entries due at `tick`, in the order they were scheduled. */
export function dueEntries(schedule: Schedule, tick: number): Scheduled[] {
  return schedule.filter((entry) => entry.at <= tick);
}

/**
 * The one place a due entry becomes the event the clock records at `tick`, caused by its scheduling
 * event. `snapshot` is the world just before it is recorded: an arrive's `present` is everyone then
 * in the room it lands in, sorted, the mover not among them.
 */
export function fired(entry: Scheduled, tick: number, snapshot: Snapshot): EventDraft {
  const { at: _at, ...draft } = entry;
  if (draft.subkind === "exchange.lapse") return { ...draft, tick };
  const present = (snapshot.views.presence[draft.place] ?? [])
    .filter((person) => person !== draft.actor)
    .sort();
  return { ...draft, tick, payload: { ...draft.payload, present } };
}
