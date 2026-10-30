import { z } from "zod";
import { type EventDraft, OPERATOR } from "./events.ts";
import { lookup, roomOf, type Snapshot } from "./snapshot.ts";

const actor = z.string().min(1);
const words = z.string().min(1);
const name = z.string().min(1);

/** One schema per verb: an action is `{ actor, verb, ...fields }`. */
export const actionSchemas = {
  depart: z.strictObject({ actor, verb: z.literal("depart"), exit: name }),
  say: z.strictObject({ actor, verb: z.literal("say"), words }),
  "say-to": z.strictObject({ actor, verb: z.literal("say-to"), target: name, words }),
  whisper: z.strictObject({ actor, verb: z.literal("whisper"), target: name, words }),
  offer: z.strictObject({ actor, verb: z.literal("offer"), target: name, item: name }),
  accept: z.strictObject({ actor, verb: z.literal("accept"), item: name }),
  refuse: z.strictObject({ actor, verb: z.literal("refuse"), item: name }),
} as const;

export type Verb = keyof typeof actionSchemas;

export const actionSchema = z.discriminatedUnion("verb", [
  actionSchemas.depart,
  actionSchemas.say,
  actionSchemas["say-to"],
  actionSchemas.whisper,
  actionSchemas.offer,
  actionSchemas.accept,
  actionSchemas.refuse,
]);

export type Action = z.infer<typeof actionSchema>;

/** The closed set of reasons a rule refuses an action. */
export type RefusalCode =
  | "no-such-exit"
  | "in-transit"
  | "not-in-room"
  | "self-target"
  | "not-holding"
  | "already-offered"
  | "not-offered-to-you"
  | "giver-absent";

export type Refusal = { code: RefusalCode; message: string };

export type RuleResult = { refused: Refusal } | { events: EventDraft[] };

/** Each verb as JSON Schema, with the fields an operator fills besides actor and verb. */
export function verbs(): { verb: Verb; fields: string[]; schema: unknown }[] {
  return (Object.keys(actionSchemas) as Verb[]).map((verb) => {
    const schema = actionSchemas[verb];
    return {
      verb,
      fields: Object.keys(schema.shape).filter((field) => field !== "actor" && field !== "verb"),
      schema: z.toJSONSchema(schema),
    };
  });
}

function refused(code: RefusalCode, message: string): RuleResult {
  return { refused: { code, message } };
}

/**
 * Validate `action` against the snapshot: either the refusal or the events to record. Pure: it
 * reads the snapshot and writes nothing. The actor must be a person in the snapshot.
 */
export function rule(snapshot: Snapshot, action: Action): RuleResult {
  const here = roomOf(snapshot, action.actor);
  if (here === null) {
    return refused("in-transit", `${action.actor} is in transit and cannot ${action.verb}`);
  }
  const base = { tick: snapshot.tick, actor: action.actor, place: here, cause: OPERATOR };

  switch (action.verb) {
    case "depart": {
      const room = lookup(snapshot.rooms, here);
      const exit = room === undefined ? undefined : lookup(room.exits, action.exit);
      if (exit === undefined) {
        return refused("no-such-exit", `${here} has no exit "${action.exit}"`);
      }
      return {
        events: [
          {
            ...base,
            subkind: "physical.depart",
            targets: [],
            payload: {
              from: here,
              exit: action.exit,
              to: exit.to,
              travelTicks: exit.travel_ticks,
              arrivesAt: snapshot.tick + exit.travel_ticks,
            },
          },
        ],
      };
    }
    case "say":
      return {
        events: [{ ...base, subkind: "speech.say", targets: [], payload: { words: action.words } }],
      };
    case "say-to":
    case "whisper": {
      const problem = addresseeProblem(snapshot, action.actor, action.target, here);
      if (problem !== null) return problem;
      return {
        events: [
          {
            ...base,
            subkind: action.verb === "say-to" ? "speech.say-to" : "speech.whisper",
            targets: [action.target],
            payload: { words: action.words },
          },
        ],
      };
    }
    case "offer": {
      const item = lookup(snapshot.items, action.item);
      if (item === undefined || item.holder !== action.actor) {
        return refused("not-holding", `${action.actor} does not hold "${action.item}"`);
      }
      if (item.offer !== "none") {
        return refused("already-offered", `${action.item} is already offered to ${item.offer.to}`);
      }
      const problem = addresseeProblem(snapshot, action.actor, action.target, here);
      if (problem !== null) return problem;
      return {
        events: [
          {
            ...base,
            subkind: "exchange.offer",
            targets: [action.target],
            payload: { item: action.item, until: snapshot.tick + snapshot.offerWindowTicks },
          },
        ],
      };
    }
    case "accept":
    case "refuse": {
      const item = lookup(snapshot.items, action.item);
      if (item === undefined || item.offer === "none" || item.offer.to !== action.actor) {
        return refused("not-offered-to-you", `${action.item} is not offered to ${action.actor}`);
      }
      const giver = item.holder;
      if (action.verb === "accept" && roomOf(snapshot, giver) !== here) {
        return refused("giver-absent", `${giver}, who offered ${action.item}, is not in ${here}`);
      }
      return {
        events: [
          {
            ...base,
            subkind: action.verb === "accept" ? "exchange.accept" : "exchange.refuse",
            targets: [giver],
            payload: { item: action.item, from: giver },
          },
        ],
      };
    }
  }
}

/** Why `actor` may not address `target` from `here`, or null when it may. */
function addresseeProblem(
  snapshot: Snapshot,
  actor: string,
  target: string,
  here: string,
): RuleResult | null {
  if (target === actor) return refused("self-target", `${actor} cannot address themself`);
  if (roomOf(snapshot, target) !== here) {
    return refused("not-in-room", `${target} is not in ${here}`);
  }
  return null;
}
