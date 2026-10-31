import { z } from "zod";
import {
  type Copy,
  participants,
  registry,
  type Subkind,
  type Visibility,
  type WorldEvent,
} from "../engine/events.ts";
import type { Snapshot } from "../engine/snapshot.ts";

/** One broken invariant: which, the thing it concerns, and what is wrong. */
export type Violation = {
  invariant: "holder" | "location" | "redaction" | "log";
  thing: string;
  detail: string;
};

/** What the invariants read: the snapshot, the event log and every person's received copies. */
export type World = { snapshot: Snapshot; events: WorldEvent[]; received: Record<string, Copy[]> };

/** Every item's holder names a person. */
function holders({ snapshot }: World): Violation[] {
  return Object.entries(snapshot.items)
    .filter(([, item]) => !Object.hasOwn(snapshot.people, item.holder))
    .map(([id, item]) => ({
      invariant: "holder",
      thing: id,
      detail: `held by "${item.holder}", who names no person`,
    }));
}

/**
 * Every person is in a room the world holds, or in transit to one with their arrive due in the
 * schedule at the transit's arrivesAt.
 */
function locations({ snapshot }: World): Violation[] {
  const violations: Violation[] = [];
  for (const [person, { location }] of Object.entries(snapshot.people)) {
    const room = "room" in location ? location.room : location.transit.to;
    if (!Object.hasOwn(snapshot.rooms, room)) {
      violations.push({ invariant: "location", thing: person, detail: `"${room}" names no room` });
      continue;
    }
    if ("room" in location) continue;
    const { from, to, arrivesAt } = location.transit;
    const due = snapshot.schedule.some(
      (entry) =>
        entry.subkind === "physical.arrive" &&
        entry.actor === person &&
        entry.at === arrivesAt &&
        entry.payload.to === to,
    );
    if (!due) {
      violations.push({
        invariant: "location",
        thing: person,
        detail: `in transit ${from} -> ${to} arriving at tick ${arrivesAt}, with no arrive due at tick ${arrivesAt} in the schedule`,
      });
    }
  }
  return violations;
}

/** The registry entry of `subkind`, or undefined when the registry has none. */
function entryOf(subkind: string): (typeof registry)[Subkind] | undefined {
  return Object.hasOwn(registry, subkind) ? registry[subkind as Subkind] : undefined;
}

/**
 * Every copy held by a thing that is neither the event's actor nor a target lacks each payload
 * field the subkind's registry entry narrows to participants.
 */
function redactions({ events, received }: World): Violation[] {
  const logged = new Map(events.map((event) => [event.id, event]));
  const violations: Violation[] = [];
  for (const [witness, copies] of Object.entries(received)) {
    for (const copy of copies) {
      const event = logged.get(copy.id);
      if (event === undefined) {
        violations.push({
          invariant: "redaction",
          thing: witness,
          detail: `holds a copy of ${copy.id}, which is not in the log`,
        });
        continue;
      }
      if (participants(event).includes(witness)) continue;
      const visibility: Visibility | undefined = entryOf(event.subkind)?.visibility;
      for (const field of Object.keys(visibility?.narrow ?? {})) {
        if (Object.hasOwn(copy.payload, field)) {
          violations.push({
            invariant: "redaction",
            thing: witness,
            detail: `the copy of ${event.id} (${event.subkind} by ${event.actor}) held by non-participant ${witness} carries ${field}: ${JSON.stringify(copy.payload[field])}`,
          });
        }
      }
    }
  }
  return violations;
}

/** Every event's subkind is in the registry and its payload parses against the subkind's schema. */
function logged({ events }: World): Violation[] {
  const violations: Violation[] = [];
  for (const event of events) {
    const entry = entryOf(event.subkind);
    if (entry === undefined) {
      violations.push({
        invariant: "log",
        thing: event.id,
        detail: `subkind "${event.subkind}" is not in the registry`,
      });
      continue;
    }
    const parsed = entry.payload.safeParse(event.payload);
    if (!parsed.success) {
      violations.push({
        invariant: "log",
        thing: event.id,
        detail: `the ${event.subkind} payload by ${event.actor} fails its schema: ${z.prettifyError(parsed.error)}`,
      });
    }
  }
  return violations;
}

/** Every violation of the holder, location, redaction and log invariants over `world`. */
export function check(world: World): Violation[] {
  return [...holders(world), ...locations(world), ...redactions(world), ...logged(world)];
}
