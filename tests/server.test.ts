import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type { WorldEvent } from "../src/engine/events.ts";
import { actionSchemas, type Verb } from "../src/engine/rules.ts";
import type { Snapshot } from "../src/engine/snapshot.ts";
import { type Started, startServer } from "../src/server/routes.ts";

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");

let dir = "";
let started: Started | undefined;
let base = "";

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "strata-server-"));
  started = startServer({
    world: WORLD,
    dbPath: join(dir, "world.sqlite"),
    tickMinutes: 10,
    port: 0,
  });
  if (!started.ok) throw new Error(started.refusal.message);
  base = `http://127.0.0.1:${started.server.port}`;
});

afterAll(() => {
  if (started?.ok) started.stop();
  rmSync(dir, { recursive: true, force: true });
});

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${base}${path}`);
  expect(response.status).toBe(200);
  return (await response.json()) as T;
}

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function act(action: Record<string, string>): Promise<WorldEvent[]> {
  const response = await post("/api/actions", action);
  expect(response.status).toBe(200);
  return ((await response.json()) as { events: WorldEvent[] }).events;
}

async function step(): Promise<WorldEvent[]> {
  const response = await post("/api/step");
  expect(response.status).toBe(200);
  return ((await response.json()) as { events: WorldEvent[] }).events;
}

async function events(since: number): Promise<WorldEvent[]> {
  return (await get<{ events: WorldEvent[] }>(`/api/events?since=${since}`)).events;
}

describe("C11: the server binds the loopback address", () => {
  test("its hostname is 127.0.0.1", () => {
    if (!started?.ok) throw new Error("server did not start");
    expect(started.server.hostname).toBe("127.0.0.1");
  });
});

describe("C10: the bench and its API over HTTP", () => {
  test("the page and its scripts are served with their content types", async () => {
    const files = [
      { path: "/", file: "bench/index.html", type: "text/html" },
      { path: "/bench/app.js", file: "bench/app.js", type: "text/javascript" },
      { path: "/bench/panels/world.js", file: "bench/panels/world.js", type: "text/javascript" },
    ];
    for (const { path, file, type } of files) {
      const response = await fetch(`${base}${path}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toStartWith(type);
      expect(await response.text()).toBe(readFileSync(join(ROOT, file), "utf8"));
    }
    expect((await fetch(`${base}/bench/../package.json`)).status).toBe(404);
  });

  test("/api/verbs lists every verb with its fields from the action schemas", async () => {
    const { verbs } = await get<{ verbs: { verb: Verb; fields: string[]; schema: unknown }[] }>(
      "/api/verbs",
    );
    expect(verbs.map((v) => v.verb)).toEqual([
      "depart",
      "say",
      "say-to",
      "whisper",
      "offer",
      "accept",
      "refuse",
    ]);
    for (const { verb, fields, schema } of verbs) {
      const declared = actionSchemas[verb];
      expect(schema).toEqual(JSON.parse(JSON.stringify(z.toJSONSchema(declared))));
      expect(fields).toEqual(
        Object.keys(declared.shape).filter((f) => f !== "actor" && f !== "verb"),
      );
    }
  });

  test("the C5 and C7 sequences, a forbidden action and reset", async () => {
    const booted = await get<Snapshot>("/api/snapshot");
    expect(booted.tick).toBe(0);
    expect(await events(0)).toEqual([]);

    const [depart] = await act({ actor: "glitch", verb: "depart", exit: "east" });
    expect(depart?.subkind).toBe("physical.depart");
    expect((await get<Snapshot>("/api/snapshot")).views.inTransit.map((t) => t.person)).toEqual([
      "glitch",
    ]);
    expect((await events(0)).map((e) => e.id)).toEqual([depart?.id]);

    const stepped = await step();
    expect(stepped.map((e) => e.subkind)).toEqual(["time.tick", "physical.arrive"]);
    const afterStep = await get<Snapshot>("/api/snapshot");
    expect(afterStep.tick).toBe(1);
    expect(afterStep.views.presence["back-room"]).toEqual(["glitch", "mux"]);
    expect(await events(depart?.seq ?? 0)).toEqual(stepped);
    const received = await get<{ copies: { id: string }[] }>("/api/received/mux");
    expect(received.copies.map((c) => c.id)).toEqual([stepped[1]?.id]);

    const resetResponse = await post("/api/reset");
    expect(resetResponse.status).toBe(200);
    expect(await get<Snapshot>("/api/snapshot")).toEqual(booted);
    expect(await events(0)).toEqual([]);

    const [offer] = await act({
      actor: "rogue",
      verb: "offer",
      target: "glitch",
      item: "data-shard",
    });
    expect(offer?.payload).toEqual({ item: "data-shard", until: booted.offerWindowTicks });
    expect((await get<Snapshot>("/api/snapshot")).views.offers).toEqual([
      {
        item: "data-shard",
        from: "rogue",
        to: "glitch",
        until: booted.offerWindowTicks,
        offerEvent: offer?.id,
      },
    ]);
    const [accept] = await act({ actor: "glitch", verb: "accept", item: "data-shard" });
    expect(accept?.subkind).toBe("exchange.accept");
    const afterAccept = await get<Snapshot>("/api/snapshot");
    expect(afterAccept.items["data-shard"]).toEqual({ holder: "glitch", offer: "none" });
    expect((await events(0)).map((e) => e.subkind)).toEqual(["exchange.offer", "exchange.accept"]);

    const forbidden = await post("/api/actions", { actor: "rogue", verb: "depart", exit: "west" });
    expect(forbidden.status).toBe(422);
    expect(await forbidden.json()).toMatchObject({ refused: { code: "no-such-exit" } });
    expect((await events(0)).length).toBe(2);

    const malformed = await post("/api/actions", { actor: "rogue", verb: "fly" });
    expect(malformed.status).toBe(400);

    expect((await post("/api/reset")).status).toBe(200);
    expect(await get<Snapshot>("/api/snapshot")).toEqual(booted);
    expect(await events(0)).toEqual([]);
  });
});
