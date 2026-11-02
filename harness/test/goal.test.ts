import { afterAll, describe, expect, test } from "bun:test";
import { afterOf, type Event } from "../src/bench.ts";
import { described, type EndState, expectSchema, holds, satisfies } from "../src/goal.ts";
import { checked, type Target, vocabulary } from "../src/target.ts";
import { ADA_KNOWS, BO_KNOWS, KNOWS_GOALS, OFFER, PAGE, SNAPSHOT, SUBKINDS } from "./fixtures.ts";

const stops: (() => void)[] = [];
afterAll(() => {
  for (const stop of stops) stop();
});

const SUNG: Event = {
  id: "e1",
  seq: 1,
  subkind: "speech.sing",
  kind: "speech",
  actor: "ada",
  targets: ["bo"],
  payload: { words: "la" },
};

/** A stand-in bench answering fixture bodies on /api/snapshot, /api/events and /api/knowledge. */
function bench(events: Event[]): string {
  const knowledge: Record<string, unknown> = { "/api/knowledge/ada": ADA_KNOWS };
  knowledge["/api/knowledge/bo"] = BO_KNOWS;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/snapshot") return Response.json(SNAPSHOT);
      if (pathname === "/api/events") return Response.json({ events });
      if (Object.hasOwn(knowledge, pathname)) return Response.json(knowledge[pathname]);
      return new Response("not found", { status: 404 });
    },
  });
  stops.push(() => void server.stop(true));
  return `http://127.0.0.1:${server.port}/`;
}

describe("end states are checked by code against what the bench serves", () => {
  test("afterOf projects a snapshot body to its item holders and person locations", () => {
    expect(afterOf(SNAPSHOT)).toEqual({
      holders: { lamp: "ada", key: "bo" },
      locations: {
        ada: { room: "yard" },
        bo: { transit: { from: "yard", to: "hall", arrivesAt: 2 } },
      },
    });
  });

  test("satisfies checks holders and rooms, and a person in transit is in no room", () => {
    const now = afterOf(SNAPSHOT);
    expect(satisfies({ holder: { item: "lamp", person: "ada" } }, now)).toBe(true);
    expect(satisfies({ holder: { item: "lamp", person: "bo" } }, now)).toBe(false);
    expect(satisfies({ location: { person: "ada", room: "yard" } }, now)).toBe(true);
    expect(satisfies({ location: { person: "bo", room: "hall" } }, now)).toBe(false);
    expect(satisfies({ said: { person: "ada", subkind: "speech.sing" } }, now)).toBe(false);
    // A pending state's resolution leaves its own after, checked the same way.
    expect(
      satisfies({ holder: { item: "lamp", person: "bo" } }, OFFER.resolutions[0]?.after ?? now),
    ).toBe(true);
  });

  test("holds reads the bench: the snapshot for holders and rooms, the history for speech", async () => {
    const quiet = bench([]);
    expect(await holds({ holder: { item: "key", person: "bo" } }, quiet)).toBe(true);
    expect(await holds({ location: { person: "ada", room: "hall" } }, quiet)).toBe(false);
    expect(await holds({ said: { person: "ada", subkind: "speech.sing" } }, quiet)).toBe(false);
    const sung = bench([SUNG]);
    expect(await holds({ said: { person: "ada", subkind: "speech.sing" } }, sung)).toBe(true);
    expect(await holds({ said: { person: "bo", subkind: "speech.sing" } }, sung)).toBe(false);
    expect(await holds({ outcome: "no-such-action" }, sung)).toBe(false);
  });

  test("a bench route answering an error throws naming the route and the status", async () => {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => new Response("down", { status: 503 }),
    });
    stops.push(() => void server.stop(true));
    const base = `http://127.0.0.1:${server.port}/`;
    await expect(holds({ holder: { item: "key", person: "bo" } }, base)).rejects.toThrow(
      "GET /api/snapshot answered 503",
    );
  });
});

describe("K10: a knows end state holds only on the knower's latest fact, and only while not stale", () => {
  test("holds reads /api/knowledge/<person>: a fresh fact holds; a stale or absent one never does", async () => {
    const base = bench([]);
    expect(await holds({ knows: { person: "ada", location: "bo" } }, base)).toBe(true);
    expect(await holds({ knows: { person: "bo", location: "ada" } }, base)).toBe(false);
    expect(await holds({ knows: { person: "ada", location: "zed" } }, base)).toBe(false);
    expect(await holds({ knows: { person: "bo", holder: "lamp" } }, base)).toBe(true);
    expect(await holds({ knows: { person: "ada", holder: "key" } }, base)).toBe(false);
    expect(await holds({ knows: { person: "ada", holder: "lamp" } }, base)).toBe(false);
    // A fact of the other kind on the same thing is not the one asked for.
    expect(await holds({ knows: { person: "ada", holder: "bo" } }, base)).toBe(false);
  });

  test("satisfies is false for knows, since a pending state's after carries no knowledge", () => {
    const now = afterOf(SNAPSHOT);
    expect(satisfies({ knows: { person: "ada", location: "bo" } }, now)).toBe(false);
    expect(satisfies({ knows: { person: "bo", holder: "lamp" } }, now)).toBe(false);
  });

  test("described reads who knows where someone is, or who holds an item, now", () => {
    expect(described({ knows: { person: "mux", location: "rogue" } })).toBe(
      "mux knows where rogue is now",
    );
    expect(described({ knows: { person: "glitch", holder: "charge-cell" } })).toBe(
      "glitch knows who holds charge-cell now",
    );
  });

  test("checked turns a knows naming a person or an item the page does not show into no-such-action", () => {
    const offered = vocabulary(PAGE, SUBKINDS);
    const knows = (expect: EndState): Target => ({ kind: "goal", expect, steps: [] });
    const refused = (reason: string): Target => ({ kind: "no-such-action", reason });
    const fine = knows({ knows: { person: "ada", location: "bo" } });
    expect(checked(fine, offered)).toEqual(fine);
    const held = knows({ knows: { person: "bo", holder: "lamp" } });
    expect(checked(held, offered)).toEqual(held);
    expect(checked(knows({ knows: { person: "cy", location: "bo" } }), offered)).toEqual(
      refused('the page shows no person "cy" (it has: ada, bo)'),
    );
    expect(checked(knows({ knows: { person: "ada", location: "lamp" } }), offered)).toEqual(
      refused('the page shows no person "lamp" (it has: ada, bo)'),
    );
    expect(checked(knows({ knows: { person: "ada", holder: "bo" } }), offered)).toEqual(
      refused('the page shows no item "bo" (it has: lamp, key)'),
    );
    expect(checked(knows({ knows: { person: "ada", holder: "torch" } }), offered)).toEqual(
      refused('the page shows no item "torch" (it has: lamp, key)'),
    );
  });

  test("a goal file whose expects are knows end states parses with expectSchema", () => {
    expect(KNOWS_GOALS.goals.map((goal) => expectSchema.parse(goal.expect))).toEqual(
      KNOWS_GOALS.goals.map((goal) => goal.expect),
    );
    expect(
      expectSchema.safeParse({ knows: { person: "ada", location: "bo", holder: "lamp" } }).success,
    ).toBe(false);
  });
});
