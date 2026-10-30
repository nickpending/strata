import { z } from "zod";

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

type RegistryEntry = { readonly payload: z.ZodType; readonly visibility: Visibility };

const id = z.string().min(1);
const tick = z.number().int().nonnegative();

/**
 * Every event subkind the engine records: its payload schema and its visibility. Adding a subkind
 * is one entry here and one rule; no part or reader changes.
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
  },
  "physical.arrive": {
    payload: z.strictObject({ from: id, to: id }),
    visibility: { audience: "place" },
  },
  "speech.say": {
    payload: z.strictObject({ words: z.string().min(1) }),
    visibility: { audience: "place" },
  },
  "speech.say-to": {
    payload: z.strictObject({ words: z.string().min(1) }),
    visibility: { audience: "place" },
  },
  "speech.whisper": {
    payload: z.strictObject({ words: z.string().min(1) }),
    visibility: { audience: "place", narrow: { words: "participants" } },
  },
  "exchange.offer": {
    payload: z.strictObject({ item: id, until: tick }),
    visibility: { audience: "place" },
  },
  "exchange.accept": {
    payload: z.strictObject({ item: id, from: id }),
    visibility: { audience: "place" },
  },
  "exchange.refuse": {
    payload: z.strictObject({ item: id, from: id }),
    visibility: { audience: "place" },
  },
  "exchange.lapse": {
    payload: z.strictObject({ item: id, from: id, to: id }),
    visibility: { audience: "place" },
  },
  "time.tick": {
    payload: z.strictObject({}),
    visibility: { audience: "none" },
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
