import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dueEntries, fired } from "../src/engine/clock.ts";
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
  const dir = mkdtempSync(join(tmpdir(), "strata-clock-"));
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

describe("C8: entries due at the same tick fire in the order they were scheduled", () => {
  test("an arrive and a lapse due at tick 2 fire after the second step, nothing early", () => {
    const engine = fresh();
    const depart = recorded(engine, { actor: "mux", verb: "depart", exit: "west" });
    const offer = recorded(engine, {
      actor: "rogue",
      verb: "offer",
      target: "glitch",
      item: "data-shard",
    });
    expect(depart.payload).toMatchObject({ arrivesAt: 2 });
    expect(offer.payload).toMatchObject({ until: 2 });
    expect(engine.snapshot().schedule.map((entry) => [entry.at, entry.subkind])).toEqual([
      [2, "physical.arrive"],
      [2, "exchange.lapse"],
    ]);

    const first = engine.step();
    expect(first.map((event) => [event.tick, event.subkind])).toEqual([[1, "time.tick"]]);

    const second = engine.step();
    expect(second.map((event) => [event.tick, event.subkind, event.cause])).toEqual([
      [2, "time.tick", "operator"],
      [2, "physical.arrive", depart.id],
      [2, "exchange.lapse", offer.id],
    ]);
    const seqs = second.map((event) => event.seq);
    const firstTick = first[0];
    if (firstTick === undefined) throw new Error("first step recorded nothing");
    expect(seqs).toEqual([firstTick.seq + 1, firstTick.seq + 2, firstTick.seq + 3]);
    expect(engine.snapshot().schedule).toEqual([]);
  });

  test("fired makes each due entry its draft: an arrive's present from the snapshot it is given, a lapse as scheduled", () => {
    const engine = fresh();
    const depart = recorded(engine, { actor: "mux", verb: "depart", exit: "west" });
    const offer = recorded(engine, {
      actor: "rogue",
      verb: "offer",
      target: "glitch",
      item: "data-shard",
    });
    const snapshot = engine.snapshot();
    const [arrive, lapse] = dueEntries(snapshot.schedule, 2);
    if (arrive === undefined || lapse === undefined) throw new Error("nothing due at tick 2");
    expect(fired(arrive, 2, snapshot)).toEqual({
      subkind: "physical.arrive",
      tick: 2,
      cause: depart.id,
      actor: "mux",
      targets: [],
      place: "chrome-cassette",
      payload: { from: "back-room", to: "chrome-cassette", present: ["glitch", "rogue"] },
    });
    expect(fired(lapse, 2, snapshot)).toEqual({
      subkind: "exchange.lapse",
      tick: 2,
      cause: offer.id,
      actor: "rogue",
      targets: ["glitch"],
      place: "chrome-cassette",
      payload: { item: "data-shard", from: "rogue", to: "glitch" },
    });
    expect(dueEntries(snapshot.schedule, 1)).toEqual([]);
  });

  test("game time is the tick times the tick length", () => {
    const engine = fresh();
    engine.step();
    engine.step();
    const snapshot = engine.snapshot();
    expect(snapshot.tick).toBe(2);
    expect(snapshot.gameMinutes).toBe(2 * engine.tickMinutes);
  });
});
