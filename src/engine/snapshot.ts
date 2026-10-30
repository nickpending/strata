import type { Schedule } from "./clock.ts";
import type { RoomDef, Tie, WorldDefs } from "./definitions.ts";
import { CLOCK_ID, type Location, type Offer, type StateRow } from "./things.ts";

export type PersonState = { location: Location; ties: Tie[] };
export type ItemState = { holder: string; offer: Offer };

/** Views computed from the owning parts; none of them is stored. */
export type Views = {
  /** Room id to the ids of the people located in it, sorted. */
  presence: Record<string, string[]>;
  /** Person id to the ids of the items they hold, sorted. */
  holdings: Record<string, string[]>;
  inTransit: { person: string; from: string; to: string; arrivesAt: number }[];
  /** Every pending offer; the giver is the item's holder. */
  offers: { item: string; from: string; to: string; until: number; offerEvent: string }[];
  /** The schedule ordered by the tick each entry is due, insertion order within a tick. */
  due: Schedule;
};

/** Every thing's current parts, the read-only definitions rules need, and the derived views. */
export type Snapshot = {
  tick: number;
  tickMinutes: number;
  gameMinutes: number;
  offerWindowTicks: number;
  rooms: Record<string, RoomDef>;
  people: Record<string, PersonState>;
  items: Record<string, ItemState>;
  schedule: Schedule;
  views: Views;
};

function partOf<T>(rows: StateRow[], thing: string, part: string): T {
  const row = rows.find((r) => r.thing === thing && r.part === part);
  if (row === undefined) throw new Error(`state has no ${part} row for ${thing}`);
  return row.state as T;
}

/** Build the snapshot from the state rows. */
export function buildSnapshot(rows: StateRow[], defs: WorldDefs, tickMinutes: number): Snapshot {
  const tick = partOf<number>(rows, CLOCK_ID, "tick");
  const schedule = partOf<Schedule>(rows, CLOCK_ID, "schedule");
  const people: Record<string, PersonState> = {};
  for (const person of defs.people) {
    people[person.id] = {
      location: partOf<Location>(rows, person.id, "location"),
      ties: partOf<Tie[]>(rows, person.id, "ties"),
    };
  }
  const items: Record<string, ItemState> = {};
  for (const item of defs.items) {
    items[item.id] = {
      holder: partOf<string>(rows, item.id, "holder"),
      offer: partOf<Offer>(rows, item.id, "offer"),
    };
  }
  const rooms: Record<string, RoomDef> = {};
  for (const room of defs.rooms) rooms[room.id] = room;

  const presence: Record<string, string[]> = {};
  for (const room of defs.rooms) presence[room.id] = [];
  const holdings: Record<string, string[]> = {};
  const inTransit: Views["inTransit"] = [];
  for (const [id, person] of Object.entries(people)) {
    holdings[id] = [];
    if ("room" in person.location) presence[person.location.room]?.push(id);
    else inTransit.push({ person: id, ...person.location.transit });
  }
  const offers: Views["offers"] = [];
  for (const [id, item] of Object.entries(items)) {
    holdings[item.holder]?.push(id);
    if (item.offer !== "none") offers.push({ item: id, from: item.holder, ...item.offer });
  }
  const due = [...schedule].sort((a, b) => a.at - b.at);

  return {
    tick,
    tickMinutes,
    gameMinutes: tick * tickMinutes,
    offerWindowTicks: defs.offerWindowTicks,
    rooms,
    people,
    items,
    schedule,
    views: { presence, holdings, inTransit, offers, due },
  };
}

/**
 * The entry `key` names in `record`, or undefined. Only the record's own keys count, so a name an
 * operator supplies, such as "constructor" or "__proto__", never reaches an inherited member.
 */
export function lookup<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

/** The room a person is in, or null while in transit or when `person` names nobody. */
export function roomOf(snapshot: Snapshot, person: string): string | null {
  const location = lookup(snapshot.people, person)?.location;
  if (location === undefined || !("room" in location)) return null;
  return location.room;
}
