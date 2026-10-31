/**
 * The bench's routes as the harness reads them: each body it reads, declared over only the fields
 * it uses, and the one GET it reads them with. Every fact the harness uses about verbs, speech
 * kinds, pending states, the snapshot and the history comes through here, from the bench it
 * drives; strata's typecheck holds the bodies the bench serves to these declarations.
 */

/** GET /api/verbs: every verb the bench takes, with the fields it takes besides actor and verb. */
export type VerbsBody = { verbs: { verb: string; fields: string[] }[] };

/** GET /api/subkinds: every event subkind the bench records, with its family. */
export type SubkindsBody = { subkinds: { subkind: string; kind: string }[] };

/** Where a person is: in a room, or in transit between two. */
export type Location =
  | { room: string }
  | { transit: { from: string; to: string; arrivesAt: number } };

/** What a state reached holds: every item's holder and every person's location. */
export type After = { holders: Record<string, string>; locations: Record<string, Location> };

/** One recorded event: the envelope fields the harness reads, and its payload. */
export type Event = {
  id: string;
  seq: number;
  subkind: string;
  kind: string;
  actor: string;
  targets: string[];
  payload: Record<string, unknown>;
};

/** The event that opened a pending state, as the log records it. */
export type Opened = Pick<Event, "id" | "subkind" | "actor" | "targets" | "payload">;

/** An action as the bench takes it: the actor, the verb, and a value for each field it takes. */
export type Action = { actor: string; verb: string } & Record<string, string>;

/** One pending state: what opened it, what the clock fires when it falls due, and who closes it first. */
export type Pending = {
  opened: Opened;
  due: { at: number; fires: string; after: After };
  resolutions: { by: string; action: Action; after: After }[];
};

/** GET /api/snapshot: each item's holder, each person's location, and the pending states. */
export type SnapshotBody = {
  items: Record<string, { holder: string }>;
  people: Record<string, { location: Location }>;
  pending: Pending[];
};

/** GET /api/events: every event after the `since` seq, in order. */
export type EventsBody = { events: Event[] };

/** GET /api/received/<person>: the copies of events that person has received. */
export type ReceivedBody = { thing: string; copies: unknown[] };

/** GET a bench route's JSON; a non-2xx answer throws naming the route and the status. */
export async function getJson<T>(base: string, path: string): Promise<T> {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/**
 * The item holders and person locations of a snapshot body: the shape a pending state's afters
 * carry, so an end state is checked the same way against now and against what an action leaves.
 */
export function afterOf(snapshot: SnapshotBody): After {
  const after: After = { holders: {}, locations: {} };
  for (const [item, { holder }] of Object.entries(snapshot.items)) after.holders[item] = holder;
  for (const [person, { location }] of Object.entries(snapshot.people)) {
    after.locations[person] = location;
  }
  return after;
}
