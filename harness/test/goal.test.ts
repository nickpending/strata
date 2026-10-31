import { afterAll, describe, expect, test } from "bun:test";
import { afterOf, type Event } from "../src/bench.ts";
import { holds, satisfies } from "../src/goal.ts";
import { OFFER, SNAPSHOT } from "./fixtures.ts";

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

/** A stand-in bench answering fixture bodies on /api/snapshot and /api/events. */
function bench(events: Event[]): string {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/snapshot") return Response.json(SNAPSHOT);
      if (pathname === "/api/events") return Response.json({ events });
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
