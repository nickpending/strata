import { type Schedule, schedulePart, tickPart } from "./clock.ts";
import type { ItemDef, PersonDef, Tie, WorldDefs } from "./definitions.ts";
import type { WorldEvent } from "./events.ts";

/** What kind of thing a part belongs to. */
export type Owner = "person" | "item" | "clock";

/**
 * A part owns one fact of one thing. `initial` builds its state from the thing's definition;
 * `reducer(self)` is the pure reducer for the thing `self`: it takes only the part's own state and
 * an event, and returns `state` itself for every event that does not concern it.
 */
export type Part<D, S> = {
  owner: Owner;
  initial: (definition: D) => S;
  reducer: (self: string) => (state: S, event: WorldEvent) => S;
};

export type Location =
  | { room: string }
  | { transit: { from: string; to: string; arrivesAt: number } };
export type Offer = "none" | { to: string; offerEvent: string; until: number };

export const locationPart: Part<PersonDef, Location> = {
  owner: "person",
  initial: (person) => ({ room: person.location }),
  reducer: (self) => (state, event) => {
    if (event.actor !== self) return state;
    if (event.subkind === "physical.depart") {
      const { from, to, arrivesAt } = event.payload;
      return { transit: { from, to, arrivesAt } };
    }
    if (event.subkind === "physical.arrive") return { room: event.payload.to };
    return state;
  },
};

/** The authored ties; no event changes them in this block. */
export const tiesPart: Part<PersonDef, Tie[]> = {
  owner: "person",
  initial: (person) => person.ties,
  reducer: () => (state) => state,
};

export const holderPart: Part<ItemDef, string> = {
  owner: "item",
  initial: (item) => item.holder,
  reducer: (self) => (state, event) => {
    if (event.subkind === "exchange.accept" && event.payload.item === self) return event.actor;
    return state;
  },
};

/** The item's pending offer; the giver is never stored here, it is the item's holder. */
export const offerPart: Part<ItemDef, Offer> = {
  owner: "item",
  initial: () => "none",
  reducer: (self) => (state, event) => {
    switch (event.subkind) {
      case "exchange.offer": {
        if (event.payload.item !== self) return state;
        const to = event.targets[0];
        if (to === undefined) return state;
        return { to, offerEvent: event.id, until: event.payload.until };
      }
      case "exchange.accept":
      case "exchange.refuse":
      case "exchange.lapse":
        return event.payload.item === self ? "none" : state;
      default:
        return state;
    }
  },
};

/** Every part, keyed by its name; each thing of a part's owner kind has one row per part. */
export const parts = {
  location: locationPart,
  ties: tiesPart,
  holder: holderPart,
  offer: offerPart,
  tick: tickPart,
  schedule: schedulePart,
} as const;

export type PartName = keyof typeof parts;
export const partNames = Object.keys(parts) as PartName[];

/** The id of the one clock thing. */
export const CLOCK_ID = "clock";

/** One row of live state: the thing, the part, and the part's state. */
export type StateRow = { thing: string; part: PartName; state: unknown };

/** The initial state rows of a world, one per thing per part, sorted by thing then part. */
export function initialRows(defs: WorldDefs): StateRow[] {
  const rows: StateRow[] = [];
  for (const person of defs.people) {
    rows.push({ thing: person.id, part: "location", state: locationPart.initial(person) });
    rows.push({ thing: person.id, part: "ties", state: tiesPart.initial(person) });
  }
  for (const item of defs.items) {
    rows.push({ thing: item.id, part: "holder", state: holderPart.initial(item) });
    rows.push({ thing: item.id, part: "offer", state: offerPart.initial(item) });
  }
  rows.push({ thing: CLOCK_ID, part: "tick", state: tickPart.initial(null) });
  rows.push({
    thing: CLOCK_ID,
    part: "schedule",
    state: schedulePart.initial(null) satisfies Schedule,
  });
  return rows.sort((a, b) => a.thing.localeCompare(b.thing) || a.part.localeCompare(b.part));
}

/**
 * Run part `name`'s reducer for thing `self` over `state`. State arrives untyped from its row, so
 * this is the one place the part's state type is erased.
 */
export function applyPart(
  name: PartName,
  self: string,
  state: unknown,
  event: WorldEvent,
): unknown {
  const part = parts[name] as unknown as Part<unknown, unknown>;
  return part.reducer(self)(state, event);
}
