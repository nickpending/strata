import { z } from "zod";
import type { Fact } from "./knowledge.ts";

/**
 * Who receives a copy of an event and what each copy carries. `audience: "place"` sends a copy
 * to every person located at the event's place; `"none"` sends copies only to the actor and the
 * targets that are people. `narrow` names payload fields that only participants (the actor and
 * the targets) receive; every other witness's copy drops them.
 */
export type Visibility = {
  readonly audience: "place" | "none";
  readonly narrow?: Readonly<Record<string, "participants">>;
};

/**
 * One subkind's entry: its payload schema, its visibility, and what a witness's copy of it teaches.
 * `teaches` reads only the copy it is handed (its envelope and the payload that witness holds), so
 * it never reads a field the visibility narrows away from that witness.
 */
export type RegistryEntry = {
  readonly payload: z.ZodType;
  readonly visibility: Visibility;
  readonly teaches: (copy: Held) => Fact[];
};

/**
 * A copy as `teaches` reads it: the envelope and the payload its witness holds. Every Copy is one;
 * it names no subkind, so the registry's own type does not depend on itself.
 */
export type Held = Envelope & { payload: Record<string, unknown> };

const id = z.string().min(1);
const tick = z.number().int().nonnegative();

/** The string the copy's payload holds at `field`; a copy without it is a broken log. */
function textOf(copy: Held, field: string): string {
  const value = copy.payload[field];
  if (typeof value !== "string") throw new Error(`the copy of ${copy.id} has no ${field}`);
  return value;
}

/** The ids the copy's payload holds at `field`, or none when this witness's copy lacks it. */
function idsOf(copy: Held, field: string): string[] {
  const value = copy.payload[field];
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

/** That each of `people` is in the room `room`; nothing when the event has no place. */
function inRoom(people: string[], room: string | null): Fact[] {
  if (room === null) return [];
  return people.map((person) => ({ kind: "location", thing: person, value: { room } }));
}

/** That the copy's item is held by the person at `field` (the actor when `field` is omitted). */
function heldBy(copy: Held, field?: string): Fact[] {
  const person = field === undefined ? copy.actor : textOf(copy, field);
  return [{ kind: "holder", thing: textOf(copy, "item"), value: person }];
}

/**
 * Every event subkind the engine records: its payload schema, its visibility and what its copies
 * teach. Adding a subkind is one entry here and one rule; no part or reader changes.
 */
export const registry = {
  "physical.depart": {
    payload: z.strictObject({
      from: id,
      exit: id,
      to: id,
      travelTicks: z.number().int().positive(),
      arrivesAt: tick,
    }),
    visibility: { audience: "place" },
    teaches: (copy) => {
      const arrivesAt = copy.payload.arrivesAt;
      if (typeof arrivesAt !== "number") throw new Error(`the copy of ${copy.id} has no arrivesAt`);
      const transit = { from: textOf(copy, "from"), to: textOf(copy, "to"), arrivesAt };
      return [{ kind: "location", thing: copy.actor, value: { transit } }];
    },
  },
  "physical.arrive": {
    /** `present`: the people in the room `to` as the arrive lands, sorted, the mover not among them. */
    payload: z.strictObject({ from: id, to: id, present: z.array(id) }),
    visibility: { audience: "place", narrow: { present: "participants" } },
    teaches: (copy) => inRoom([copy.actor, ...idsOf(copy, "present")], textOf(copy, "to")),
  },
  "speech.say": {
    payload: z.strictObject({ words: z.string().min(1) }),
    visibility: { audience: "place" },
    teaches: (copy) => inRoom([copy.actor], copy.place),
  },
  "speech.say-to": {
    payload: z.strictObject({ words: z.string().min(1) }),
    visibility: { audience: "place" },
    teaches: (copy) => inRoom([copy.actor, ...copy.targets], copy.place),
  },
  "speech.whisper": {
    payload: z.strictObject({ words: z.string().min(1) }),
    visibility: { audience: "place", narrow: { words: "participants" } },
    teaches: (copy) => inRoom([copy.actor, ...copy.targets], copy.place),
  },
  "exchange.offer": {
    payload: z.strictObject({ item: id, until: tick }),
    visibility: { audience: "place" },
    teaches: (copy) => [...inRoom([copy.actor, ...copy.targets], copy.place), ...heldBy(copy)],
  },
  "exchange.accept": {
    payload: z.strictObject({ item: id, from: id }),
    visibility: { audience: "place" },
    teaches: (copy) => [...inRoom([copy.actor, ...copy.targets], copy.place), ...heldBy(copy)],
  },
  "exchange.refuse": {
    payload: z.strictObject({ item: id, from: id }),
    visibility: { audience: "place" },
    // The giver need not be present to be refused, so its room is not taught.
    teaches: (copy) => [...inRoom([copy.actor], copy.place), ...heldBy(copy, "from")],
  },
  "exchange.lapse": {
    payload: z.strictObject({ item: id, from: id, to: id }),
    visibility: { audience: "place" },
    // The clock fires a lapse at the offer's room whoever has since left: no room is taught.
    teaches: (copy) => heldBy(copy, "from"),
  },
  "time.tick": {
    payload: z.strictObject({}),
    visibility: { audience: "none" },
    teaches: () => [],
  },
} as const satisfies Record<string, RegistryEntry>;

export type Subkind = keyof typeof registry;
export type PayloadOf<S extends Subkind> = z.infer<(typeof registry)[S]["payload"]>;

export const subkinds = Object.keys(registry) as Subkind[];

/** The id an operator-made event carries as its cause. */
export const OPERATOR = "operator";
/** The actor of a `time.tick`. */
export const CLOCK = "clock";

type Envelope = {
  id: string;
  tick: number;
  seq: number;
  kind: string;
  actor: string;
  targets: string[];
  place: string | null;
  visibility: Visibility;
  cause: string;
};

/** One recorded event: the envelope plus its subkind's payload. */
export type WorldEvent = {
  [S in Subkind]: Envelope & { subkind: S; payload: PayloadOf<S> };
}[Subkind];

/** What a rule or the clock asks the engine to record; the engine assigns id, seq and visibility. */
export type EventDraft = {
  [S in Subkind]: {
    subkind: S;
    tick: number;
    actor: string;
    targets: string[];
    place: string | null;
    cause: string;
    payload: PayloadOf<S>;
  };
}[Subkind];

/** A witness's copy of an event: the envelope, with narrowed payload fields dropped for outsiders. */
export type Copy = Omit<WorldEvent, "payload"> & { payload: Record<string, unknown> };

/** The family an event belongs to: the part of its subkind before the dot. */
export function kindOf(subkind: Subkind): string {
  return subkind.slice(0, subkind.indexOf("."));
}

/** The actor and the targets of an event. */
export function participants(event: WorldEvent): string[] {
  return [event.actor, ...event.targets];
}

/** The copy of `event` that `witness` may hold, made from the event's visibility. */
export function redact(event: WorldEvent, witness: string): Copy {
  const payload: Record<string, unknown> = { ...event.payload };
  const narrow = event.visibility.narrow ?? {};
  const isParticipant = participants(event).includes(witness);
  for (const field of Object.keys(narrow)) {
    if (!isParticipant) delete payload[field];
  }
  return { ...event, payload };
}
