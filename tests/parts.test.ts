import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import type { Schedule } from "../src/engine/clock.ts";
import { loadWorld } from "../src/engine/definitions.ts";
import {
  registry,
  type Subkind,
  subkinds,
  type Visibility,
  type WorldEvent,
} from "../src/engine/events.ts";
import {
  applyPart,
  initialRows,
  type Location,
  type Offer,
  type PartName,
  partNames,
  parts,
} from "../src/engine/things.ts";

const WORLD = join(import.meta.dir, "..", "world");

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** Each reducer takes exactly its own state and the event: nothing else is in its signature. */
type ReducerOf<N extends PartName> = ReturnType<(typeof parts)[N]["reducer"]>;
const signatures: { [N in PartName]: Equal<Parameters<ReducerOf<N>>[1], WorldEvent> } & {
  [N in PartName]: Equal<Parameters<ReducerOf<N>>["length"], 2>;
} = {
  location: true,
  ties: true,
  holder: true,
  offer: true,
  tick: true,
  schedule: true,
};

/** One sample of every subkind, made by Rogue toward Glitch over the data shard. */
function sample(subkind: Subkind, seq: number): WorldEvent {
  const envelope = {
    id: `e${seq}`,
    tick: 3,
    seq,
    kind: subkind.slice(0, subkind.indexOf(".")),
    actor: "rogue",
    targets: ["glitch"],
    place: "chrome-cassette",
    visibility: registry[subkind].visibility as Visibility,
    cause: "operator",
  };
  const payloads: { [S in Subkind]: WorldEvent & { subkind: S } } = {
    "physical.depart": {
      ...envelope,
      subkind: "physical.depart",
      targets: [],
      payload: {
        from: "chrome-cassette",
        exit: "east",
        to: "back-room",
        travelTicks: 1,
        arrivesAt: 4,
      },
    },
    "physical.arrive": {
      ...envelope,
      subkind: "physical.arrive",
      targets: [],
      cause: "e1",
      payload: { from: "chrome-cassette", to: "back-room", present: ["mux"] },
    },
    "speech.say": { ...envelope, subkind: "speech.say", targets: [], payload: { words: "hey" } },
    "speech.say-to": { ...envelope, subkind: "speech.say-to", payload: { words: "hey" } },
    "speech.whisper": { ...envelope, subkind: "speech.whisper", payload: { words: "psst" } },
    "exchange.offer": {
      ...envelope,
      subkind: "exchange.offer",
      payload: { item: "data-shard", until: 5 },
    },
    "exchange.accept": {
      ...envelope,
      subkind: "exchange.accept",
      actor: "glitch",
      targets: ["rogue"],
      payload: { item: "data-shard", from: "rogue" },
    },
    "exchange.refuse": {
      ...envelope,
      subkind: "exchange.refuse",
      actor: "glitch",
      targets: ["rogue"],
      payload: { item: "data-shard", from: "rogue" },
    },
    "exchange.lapse": {
      ...envelope,
      subkind: "exchange.lapse",
      cause: "e2",
      payload: { item: "data-shard", from: "rogue", to: "glitch" },
    },
    "time.tick": {
      ...envelope,
      subkind: "time.tick",
      actor: "clock",
      targets: [],
      place: null,
      payload: {},
    },
  };
  return payloads[subkind];
}

/** Whether `event` concerns part `name` of thing `self`: the only events it may change state for. */
function concerns(name: PartName, self: string, event: WorldEvent): boolean {
  const item = "item" in event.payload ? event.payload.item : undefined;
  switch (name) {
    case "location":
      return (
        (event.subkind === "physical.depart" || event.subkind === "physical.arrive") &&
        event.actor === self
      );
    case "ties":
      return false;
    case "holder":
      return event.subkind === "exchange.accept" && item === self;
    case "offer":
      return event.kind === "exchange" && item === self;
    case "tick":
      return event.subkind === "time.tick";
    case "schedule":
      return event.kind === "physical" || event.kind === "exchange";
  }
}

/** Several states per part: each thing's initial state plus states the world reaches later. */
function statesOf(name: PartName): { self: string; state: unknown }[] {
  const loaded = loadWorld(WORLD);
  if (!loaded.ok) throw new Error(loaded.refusal.message);
  const states: { self: string; state: unknown }[] = initialRows(loaded.defs)
    .filter((row) => row.part === name)
    .map((row) => ({ self: row.thing, state: row.state }));
  const later: Partial<Record<PartName, { self: string; state: unknown }[]>> = {
    location: [
      {
        self: "rogue",
        state: {
          transit: { from: "chrome-cassette", to: "back-room", arrivesAt: 4 },
        } satisfies Location,
      },
    ],
    offer: [
      { self: "data-shard", state: { to: "glitch", offerEvent: "e2", until: 5 } satisfies Offer },
    ],
    schedule: [
      {
        self: "clock",
        state: [
          {
            at: 4,
            cause: "e1",
            subkind: "physical.arrive",
            actor: "rogue",
            targets: [],
            place: "back-room",
            payload: { from: "chrome-cassette", to: "back-room" },
          },
        ] satisfies Schedule,
      },
    ],
  };
  return [...states, ...(later[name] ?? [])];
}

describe("C9: every reducer ignores the events that do not concern it", () => {
  test("the samples cover every subkind in the registry", () => {
    expect(subkinds.map((subkind, i) => sample(subkind, i + 1).subkind)).toEqual(
      Object.keys(registry) as Subkind[],
    );
  });

  test("each reducer returns a value equal to its input for each unconcerned event", () => {
    let checked = 0;
    for (const name of partNames) {
      for (const { self, state } of statesOf(name)) {
        for (const [i, subkind] of subkinds.entries()) {
          const event = sample(subkind, i + 1);
          if (concerns(name, self, event)) continue;
          const before = structuredClone(state);
          expect({ name, self, subkind, state: applyPart(name, self, state, event) }).toEqual({
            name,
            self,
            subkind,
            state: before,
          });
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(subkinds.length * partNames.length);
  });

  test("each reducer's signature takes only its own state and the event", () => {
    expect(Object.keys(signatures).sort()).toEqual([...partNames].sort());
    for (const name of partNames) {
      expect(parts[name].reducer("any").length).toBeLessThanOrEqual(2);
    }
  });
});
