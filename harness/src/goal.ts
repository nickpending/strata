/**
 * The end states a run and score share: a goal is one of a closed set of typed end states
 * (an item's holder, a person's room, a person's speech, what a person knows now, or no such
 * action), checked by code against the bench's own routes. Reached is that check, never a model's
 * claim.
 */
import { z } from "zod";
import {
  type After,
  afterOf,
  type EventsBody,
  getJson,
  type KnowledgeBody,
  type SnapshotBody,
} from "./bench.ts";

const name = z.string().trim().min(1);

const holderSchema = z.strictObject({ holder: z.strictObject({ item: name, person: name }) });
const locationSchema = z.strictObject({ location: z.strictObject({ person: name, room: name }) });
const saidSchema = z.strictObject({ said: z.strictObject({ person: name, subkind: name }) });
/** That `person` knows where the person `location` is now, or who holds the item `holder` now. */
const knowsSchema = z.strictObject({
  knows: z.union([
    z.strictObject({ person: name, location: name }),
    z.strictObject({ person: name, holder: name }),
  ]),
});

/** An end state the world can reach: what a run's goal names. */
export const endStateSchema = z.union([holderSchema, locationSchema, saidSchema, knowsSchema]);
export type EndState = z.infer<typeof endStateSchema>;

/** What a goal file expects of a run: an end state, or that the run finds no such action. */
export const expectSchema = z.union([
  holderSchema,
  locationSchema,
  saidSchema,
  knowsSchema,
  z.strictObject({ outcome: z.literal("no-such-action") }),
]);
export type Expectation = z.infer<typeof expectSchema>;

/**
 * Whether `expectation` holds of the holders and locations `after` gives. A said end state is a
 * fact of the history and a knows end state a fact of a person's knowledge, neither of which
 * `after` carries, so neither ever holds of one.
 */
export function satisfies(expectation: Expectation, after: After): boolean {
  if ("holder" in expectation) {
    const { item, person } = expectation.holder;
    return Object.hasOwn(after.holders, item) && after.holders[item] === person;
  }
  if ("location" in expectation) {
    const { person, room } = expectation.location;
    const location = Object.hasOwn(after.locations, person) ? after.locations[person] : undefined;
    return location !== undefined && "room" in location && location.room === room;
  }
  return false;
}

/** Whether an end-state expectation holds on the bench at `base` now. */
export async function holds(expectation: Expectation, base: string): Promise<boolean> {
  if ("said" in expectation) {
    const { events } = await getJson<EventsBody>(base, "/api/events?since=0");
    const { person, subkind } = expectation.said;
    return events.some((event) => event.actor === person && event.subkind === subkind);
  }
  if ("knows" in expectation) return knows(expectation.knows, base);
  if ("outcome" in expectation) return false;
  return satisfies(expectation, afterOf(await getJson<SnapshotBody>(base, "/api/snapshot")));
}

type Knows = Extract<EndState, { knows: unknown }>["knows"];

/**
 * Whether the knower's latest fact on the subject stands unchanged in the world: a location fact
 * on the person, or a holder fact on the item, whose stale is false. The bench says what is stale;
 * an absent or stale fact never holds.
 */
async function knows(subject: Knows, base: string): Promise<boolean> {
  const { facts } = await getJson<KnowledgeBody>(
    base,
    `/api/knowledge/${encodeURIComponent(subject.person)}`,
  );
  const [kind, thing] =
    "location" in subject ? ["location", subject.location] : ["holder", subject.holder];
  return facts.some((fact) => fact.kind === kind && fact.thing === thing && !fact.stale);
}

/** The end state in words, built from its fields. */
export function described(endState: EndState): string {
  if ("holder" in endState) return `${endState.holder.person} holds ${endState.holder.item}`;
  if ("location" in endState) {
    return `${endState.location.person} is in the room ${endState.location.room}`;
  }
  if ("knows" in endState) {
    const subject = endState.knows;
    return "location" in subject
      ? `${subject.person} knows where ${subject.location} is now`
      : `${subject.person} knows who holds ${subject.holder} now`;
  }
  return `${endState.said.person} has spoken, a ${endState.said.subkind} event in the history`;
}
