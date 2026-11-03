/**
 * What each person knows, as of a tick: the places authored for it at boot, and from each copy it
 * receives the locations and holders that copy teaches. A fact is a row appended beside the copy
 * that taught it and never changed; a reader takes the latest row per (kind, thing). Nothing in the
 * rules or the apply path reads `now` or `stale`: they are the operator's view.
 */
import type { WorldDefs } from "./definitions.ts";
import { encountersOf } from "./encounters.ts";
import { type Copy, registry, type Subkind } from "./events.ts";
import { lookup, type Snapshot } from "./snapshot.ts";
import type { Location } from "./things.ts";

/** One thing a person knows: a person's location, an item's holder, or a place it knows of. */
export type Fact =
  | { kind: "location"; thing: string; value: Location }
  | { kind: "holder"; thing: string; value: string }
  | { kind: "place"; thing: string; value: null };

export type FactKind = Fact["kind"];

/** A fact as a person holds it: who, as of which tick, and the teaching event's id (null at boot). */
export type KnownRow = Fact & { witness: string; tick: number; event: string | null };

/** A known row as the store keeps it: its seq, and the teaching event's subkind (null at boot). */
export type StoredKnown = KnownRow & { seq: number; subkind: Subkind | null };

/**
 * Every fact kind, the one home of each: what its thing is and where the world holds its current
 * value. A place is a room's definition, which never changes.
 */
export const factKinds: {
  [K in FactKind]: { now: (snapshot: Snapshot, thing: string) => unknown };
} = {
  location: { now: (snapshot, thing) => lookup(snapshot.people, thing)?.location ?? null },
  holder: { now: (snapshot, thing) => lookup(snapshot.items, thing)?.holder ?? null },
  place: { now: () => null },
};

/** The current value of `fact`'s kind and thing in `snapshot`. */
export function nowOf(fact: Fact, snapshot: Snapshot): unknown {
  return factKinds[fact.kind].now(snapshot, fact.thing);
}

/** The authored rows of a fresh world: each person's places, as of tick 0, taught by no event. */
export function initialKnown(defs: WorldDefs): KnownRow[] {
  return defs.people.flatMap((person) =>
    person.places.map(
      (room): KnownRow => ({
        witness: person.id,
        kind: "place",
        thing: room,
        value: null,
        tick: 0,
        event: null,
      }),
    ),
  );
}

/**
 * What `witness` learns from its own `copy`: the facts its subkind's entry teaches, less those the
 * witness's own parts own, its own location and its holding of an item.
 */
export function learned(copy: Copy, witness: string): Fact[] {
  return registry[copy.subkind]
    .teaches(copy)
    .filter(
      (fact) =>
        !(fact.kind === "location" && fact.thing === witness) &&
        !(fact.kind === "holder" && fact.value === witness),
    );
}

/** Where a row came from: the teaching event's id and subkind, or authored at boot. */
type Sourced = Fact & { tick: number; source: string; subkind: Subkind | null };

/** A person's latest fact on a subject, with the world's current value beside it. */
export type KnownFact = Sourced & { now: unknown; stale: boolean };

/** A person the person knows: by an authored tie as of boot, or first met in a copy it holds. */
export type KnownPerson = {
  person: string;
  tick: number;
  source: string;
  subkind: Subkind | null;
};

/** Everything one person knows, with what its own parts hold beside it. */
export type KnowledgeView = {
  person: string;
  name: string;
  /** The person's own location (location part) and holdings (holder part). */
  own: { location: Location; holdings: string[] };
  people: KnownPerson[];
  /** The latest row per (kind, thing), in seq order, less holder facts about items held now. */
  facts: KnownFact[];
  /** Every row, in seq order. */
  history: Sourced[];
};

/** What one person's view is read from. */
export type KnowledgeOf = {
  person: string;
  name: string;
  snapshot: Snapshot;
  rows: StoredKnown[];
  latest: StoredKnown[];
  copies: Copy[];
};

function sourced(row: StoredKnown): Sourced {
  const { kind, thing, value, tick, event, subkind } = row;
  return { kind, thing, value, tick, source: event ?? "authored", subkind } as Sourced;
}

/** Each tie target as the ties part holds it, then each other person as of its first encounter. */
function peopleOf({ person, snapshot, copies }: KnowledgeOf): KnownPerson[] {
  const known = new Map<string, KnownPerson>();
  for (const { target } of lookup(snapshot.people, person)?.ties ?? []) {
    known.set(target, { person: target, tick: 0, source: "authored", subkind: null });
  }
  const isPerson = (id: string) => Object.hasOwn(snapshot.people, id);
  for (const { with: other, tick, event, subkind } of encountersOf(copies, person, isPerson)) {
    if (!known.has(other)) known.set(other, { person: other, tick, source: event, subkind });
  }
  return [...known.values()];
}

/** One person's knowledge as the operator reads it. */
export function knowledgeView(of: KnowledgeOf): KnowledgeView {
  const { person, name, snapshot, rows, latest } = of;
  const holdings = snapshot.views.holdings[person] ?? [];
  const location = lookup(snapshot.people, person)?.location;
  if (location === undefined) throw new Error(`"${person}" names no person`);
  return {
    person,
    name,
    own: { location, holdings },
    people: peopleOf(of),
    facts: latest
      .filter((row) => !(row.kind === "holder" && holdings.includes(row.thing)))
      .map((row) => {
        const now = nowOf(row, snapshot);
        return { ...sourced(row), now, stale: !Bun.deepEquals(row.value, now, true) };
      }),
    history: rows.map(sourced),
  };
}
