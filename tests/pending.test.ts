import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { boot, type Engine } from "../src/engine/engine.ts";
import type { Pending } from "../src/engine/pending.ts";
import type { Snapshot } from "../src/engine/snapshot.ts";
import { startServer } from "../src/server/routes.ts";

const WORLD = join(import.meta.dir, "..", "world");

const temps: string[] = [];
const engines: Engine[] = [];
const stops: (() => void)[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function fresh(): Engine {
  const dir = mkdtempSync(join(tmpdir(), "strata-pending-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

const OFFER = { actor: "rogue", verb: "offer", target: "glitch", item: "data-shard" };
const DEPART = { actor: "glitch", verb: "depart", exit: "east" };

function acted(engine: Engine, action: Record<string, string>): Engine {
  const result = engine.act(action);
  if (result.outcome !== "recorded") throw new Error(JSON.stringify(result));
  return engine;
}

/** The committed world's holders and locations, with `changes` laid over them: derived by hand. */
function after(changes: {
  holders?: Record<string, string>;
  locations?: Record<string, { room: string }>;
}) {
  return {
    holders: { "charge-cell": "mux", "data-shard": "rogue", stimpak: "glitch", ...changes.holders },
    locations: {
      glitch: { room: "chrome-cassette" },
      mux: { room: "back-room" },
      rogue: { room: "chrome-cassette" },
      ...changes.locations,
    },
  };
}

const OFFER_PENDING: Pending[] = [
  {
    opened: {
      id: "e1",
      subkind: "exchange.offer",
      actor: "rogue",
      targets: ["glitch"],
      payload: { item: "data-shard", until: 2 },
    },
    due: { at: 2, fires: "exchange.lapse", after: after({}) },
    resolutions: [
      {
        by: "glitch",
        action: { actor: "glitch", verb: "accept", item: "data-shard" },
        after: after({ holders: { "data-shard": "glitch" } }),
      },
      {
        by: "glitch",
        action: { actor: "glitch", verb: "refuse", item: "data-shard" },
        after: after({}),
      },
    ],
  },
];

const DEPART_PENDING: Pending[] = [
  {
    opened: {
      id: "e1",
      subkind: "physical.depart",
      actor: "glitch",
      targets: [],
      payload: {
        from: "chrome-cassette",
        exit: "east",
        to: "back-room",
        travelTicks: 1,
        arrivesAt: 1,
      },
    },
    due: {
      at: 1,
      fires: "physical.arrive",
      after: after({ locations: { glitch: { room: "back-room" } } }),
    },
    resolutions: [],
  },
];

describe("C13: pending states, derived from the clock's schedule by the engine's own rules", () => {
  test("after rogue offers data-shard to glitch at tick 0, pending equals the values derived by hand", () => {
    const engine = acted(fresh(), OFFER);
    expect(engine.pending()).toEqual(OFFER_PENDING);
  });

  test("after glitch departs east, the transit's entry has no resolutions and fires its arrival", () => {
    const engine = acted(fresh(), DEPART);
    expect(engine.pending()).toEqual(DEPART_PENDING);
  });

  test("a fresh world has nothing pending, and engine.snapshot() carries no pending", () => {
    const engine = fresh();
    expect(engine.pending()).toEqual([]);
    acted(engine, OFFER);
    expect(Object.keys(engine.snapshot())).not.toContain("pending");
  });

  test("each resolution performed through act() on its own fresh engine is recorded and leaves its after holding", () => {
    for (const resolution of OFFER_PENDING[0]?.resolutions ?? []) {
      const engine = acted(fresh(), OFFER);
      const result = engine.act(resolution.action);
      expect(result.outcome).toBe("recorded");
      const snapshot = engine.snapshot();
      const holders = Object.fromEntries(
        Object.entries(snapshot.items).map(([item, state]) => [item, state.holder]),
      );
      const locations = Object.fromEntries(
        Object.entries(snapshot.people).map(([person, state]) => [person, state.location]),
      );
      expect({ holders, locations }).toEqual(resolution.after);
      expect(engine.pending()).toEqual([]);
    }
  });

  test("stepping the offer's engine to its due tick records exchange.lapse and leaves pending empty", () => {
    const engine = acted(fresh(), OFFER);
    const fired = [...engine.step(), ...engine.step()];
    expect(fired.map((event) => [event.tick, event.subkind])).toEqual([
      [1, "time.tick"],
      [2, "time.tick"],
      [2, "exchange.lapse"],
    ]);
    expect(engine.snapshot().items["data-shard"]?.holder).toBe("rogue");
    expect(engine.pending()).toEqual([]);
  });
});

describe("C13: the bench's routes serve pending beside the snapshot", () => {
  async function hosted(action: Record<string, string>) {
    const dir = mkdtempSync(join(tmpdir(), "strata-pending-bench-"));
    temps.push(dir);
    const started = startServer({
      world: WORLD,
      dbPath: join(dir, "world.sqlite"),
      tickMinutes: 10,
      port: 0,
    });
    if (!started.ok) throw new Error(started.refusal.message);
    stops.push(started.stop);
    const base = `http://127.0.0.1:${started.server.port}`;
    const post = (path: string, body?: unknown) =>
      fetch(`${base}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    expect((await post("/api/actions", action)).status).toBe(200);
    const snapshot = async () =>
      (await (await fetch(`${base}/api/snapshot`)).json()) as Snapshot & { pending: Pending[] };
    return { post, snapshot };
  }

  test("GET /api/snapshot carries the same pending beside the snapshot's fields", async () => {
    for (const [action, pending] of [
      [OFFER, OFFER_PENDING],
      [DEPART, DEPART_PENDING],
    ] as const) {
      const bench = await hosted(action);
      const body = await bench.snapshot();
      expect(body.pending).toEqual(pending);
      const engine = acted(fresh(), action);
      const { pending: _pending, ...fields } = body;
      expect(fields).toEqual(JSON.parse(JSON.stringify(engine.snapshot())));
    }
  });

  test("POST /api/reset's body carries pending, empty on the fresh world", async () => {
    const bench = await hosted(OFFER);
    const reset = await bench.post("/api/reset");
    expect(reset.status).toBe(200);
    const body = (await reset.json()) as { snapshot: Snapshot; pending: Pending[] };
    expect(body.pending).toEqual([]);
    expect(body.snapshot.tick).toBe(0);
    expect((await bench.snapshot()).pending).toEqual([]);
  });
});
