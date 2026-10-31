import type { verbs } from "../engine/rules.ts";
import { lookup, roomOf, type Snapshot } from "../engine/snapshot.ts";
import { chance, pick, type Rng } from "./rng.ts";

/** The verb list as the engine serves it: each verb with the fields an operator fills. */
export type VerbList = ReturnType<typeof verbs>;

/** Names every object inherits: an operator may type them, and none may reach an inherited member. */
const INHERITED_KEYS = ["constructor", "__proto__", "toString", "hasOwnProperty", "valueOf"];
/** Actors that name no person. */
const STRANGERS = ["nobody", ...INHERITED_KEYS];
const WORDS = ["hey", "the shard is hot", "watch the door", "you owe me", "not here"];

/** One in sixteen actions comes from someone who is no person. */
const STRANGER_ODDS = 1 / 16;
/** Each field is, now and then, absent, empty or an inherited key. */
const ABSENT_ODDS = 1 / 30;
const EMPTY_ODDS = 1 / 30;
const INHERITED_ODDS = 1 / 30;
/** How often a field is drawn from what is near the actor rather than the whole world. */
const NEAR_ODDS = 3 / 4;
/**
 * While offers are pending, how often the actor is one of their recipients (drawn to a verb that
 * names an item) or, failing that, one of their givers (drawn to a verb that names an exit), so
 * offers are answered, and answered after the giver has gone.
 */
const RECIPIENT_ODDS = 1 / 3;
const GIVER_ODDS = 1 / 3;
const WANTED_ODDS = 2 / 3;
/** While no offer is pending, how often the actor is drawn to a verb that names an item. */
const HOLDER_ODDS = 1 / 3;
/** How often an item is one offered to the actor, when any is. */
const OFFERED_ODDS = 3 / 4;

/** `near` when the draw favours it and it has anything, else `all`. */
function nearOrAll(rng: Rng, near: string[], all: string[]): string {
  return near.length > 0 && chance(rng, NEAR_ODDS) ? pick(rng, near) : pick(rng, all);
}

/** A value for `field` from the id space the snapshot gives, biased towards the actor. */
function fill(field: string, actor: string, snapshot: Snapshot, rng: Rng): string {
  const here = roomOf(snapshot, actor);
  const people = Object.keys(snapshot.people);
  const items = Object.keys(snapshot.items);
  switch (field) {
    case "exit": {
      const exits = Object.values(snapshot.rooms).flatMap((room) => Object.keys(room.exits));
      const room = here === null ? undefined : lookup(snapshot.rooms, here);
      return nearOrAll(rng, room === undefined ? [] : Object.keys(room.exits), exits);
    }
    case "target": {
      const present = here === null ? [] : (snapshot.views.presence[here] ?? []);
      return nearOrAll(
        rng,
        present.filter((person) => person !== actor),
        people,
      );
    }
    case "item": {
      const held = lookup(snapshot.views.holdings, actor) ?? [];
      const offered = snapshot.views.offers.filter((o) => o.to === actor).map((o) => o.item);
      if (offered.length > 0 && chance(rng, OFFERED_ODDS)) return pick(rng, offered);
      return nearOrAll(rng, held, items);
    }
    case "words":
      return pick(rng, WORDS);
    default:
      return pick(rng, [...people, ...items]);
  }
}

/**
 * One action, legal or illegal by draw: an actor (now and then no person), a verb from `verbList`,
 * and each of its fields filled from the snapshot, with absent, empty and inherited-key fields drawn
 * now and then so the schemas and the refusal codes are reached.
 */
export function randomAction(
  snapshot: Snapshot,
  verbList: VerbList,
  rng: Rng,
): Record<string, unknown> {
  const { offers } = snapshot.views;
  const recipients = offers.map((offer) => offer.to);
  const givers = offers.map((offer) => offer.from);
  let actor: string;
  let wants: string | null = null;
  if (chance(rng, STRANGER_ODDS)) actor = pick(rng, STRANGERS);
  else if (offers.length > 0 && chance(rng, RECIPIENT_ODDS)) {
    actor = pick(rng, recipients);
    wants = "item";
  } else if (offers.length > 0 && chance(rng, GIVER_ODDS)) {
    actor = pick(rng, givers);
    wants = chance(rng, 2 / 3) ? "exit" : "item";
  } else {
    actor = pick(rng, Object.keys(snapshot.people));
    if (offers.length === 0 && chance(rng, HOLDER_ODDS)) wants = "item";
  }
  const wanted = verbList.filter((v) => wants !== null && v.fields.includes(wants));
  const { verb, fields } = pick(
    rng,
    wanted.length > 0 && chance(rng, WANTED_ODDS) ? wanted : verbList,
  );
  const action: Record<string, unknown> = { actor, verb };
  for (const field of fields) {
    const draw = rng.next();
    if (draw < ABSENT_ODDS) continue;
    if (draw < ABSENT_ODDS + EMPTY_ODDS) action[field] = "";
    else if (draw < ABSENT_ODDS + EMPTY_ODDS + INHERITED_ODDS) {
      action[field] = pick(rng, INHERITED_KEYS);
    } else action[field] = fill(field, actor, snapshot, rng);
  }
  return action;
}
