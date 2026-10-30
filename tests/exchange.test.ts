import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { boot, type Engine } from "../src/engine/engine.ts";
import type { WorldEvent } from "../src/engine/events.ts";

const WORLD = join(import.meta.dir, "..", "world");

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function fresh(): Engine {
  const dir = mkdtempSync(join(tmpdir(), "strata-exchange-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

function recorded(engine: Engine, action: Record<string, string>): WorldEvent {
  const result = engine.act(action);
  if (result.outcome !== "recorded") throw new Error(JSON.stringify(result));
  const [event] = result.events;
  if (event === undefined) throw new Error("nothing recorded");
  return event;
}

const SHARD = "data-shard";

/** Rogue offers the shard to Glitch; checks the offer and the pending state it leaves. */
function offerShard(engine: Engine): WorldEvent {
  const tick = engine.snapshot().tick;
  const offer = recorded(engine, { actor: "rogue", verb: "offer", target: "glitch", item: SHARD });
  const until = tick + engine.defs.offerWindowTicks;
  expect(offer).toMatchObject({
    subkind: "exchange.offer",
    actor: "rogue",
    targets: ["glitch"],
    payload: { item: SHARD, until },
  });
  const pending = engine.snapshot();
  expect(pending.items[SHARD]).toEqual({
    holder: "rogue",
    offer: { to: "glitch", offerEvent: offer.id, until },
  });
  expect(pending.schedule).toEqual([
    expect.objectContaining({ at: until, cause: offer.id, subkind: "exchange.lapse" }),
  ]);
  return offer;
}

function lapses(engine: Engine): unknown[] {
  return engine.snapshot().schedule.filter((entry) => entry.subkind === "exchange.lapse");
}

describe("C7: an offer ends by accept, refuse or lapse", () => {
  test("Glitch accepts: the holder moves to Glitch, the offer and its lapse are cleared", () => {
    const engine = fresh();
    offerShard(engine);
    const accept = recorded(engine, { actor: "glitch", verb: "accept", item: SHARD });
    expect(accept).toMatchObject({
      subkind: "exchange.accept",
      actor: "glitch",
      targets: ["rogue"],
      payload: { item: SHARD, from: "rogue" },
    });
    expect(engine.snapshot().items[SHARD]).toEqual({ holder: "glitch", offer: "none" });
    expect(lapses(engine)).toEqual([]);
  });

  test("Glitch refuses: the holder stays Rogue, the offer and its lapse are cleared", () => {
    const engine = fresh();
    offerShard(engine);
    const refuse = recorded(engine, { actor: "glitch", verb: "refuse", item: SHARD });
    expect(refuse).toMatchObject({
      subkind: "exchange.refuse",
      actor: "glitch",
      payload: { item: SHARD, from: "rogue" },
    });
    expect(engine.snapshot().items[SHARD]).toEqual({ holder: "rogue", offer: "none" });
    expect(lapses(engine)).toEqual([]);
  });

  test("nobody answers: the offer lapses at until, caused by the offer", () => {
    const engine = fresh();
    const offer = offerShard(engine);
    const until = (offer.payload as { until: number }).until;
    const fired: WorldEvent[] = [];
    for (let tick = offer.tick; tick < until; tick++) {
      expect(engine.snapshot().items[SHARD]?.holder).toBe("rogue");
      expect(engine.snapshot().items[SHARD]?.offer).not.toBe("none");
      fired.push(...engine.step().filter((event) => event.subkind !== "time.tick"));
    }
    expect(fired).toEqual([
      expect.objectContaining({
        tick: until,
        subkind: "exchange.lapse",
        cause: offer.id,
        payload: { item: SHARD, from: "rogue", to: "glitch" },
      }),
    ]);
    expect(engine.snapshot().items[SHARD]).toEqual({ holder: "rogue", offer: "none" });
    expect(lapses(engine)).toEqual([]);
  });
});
