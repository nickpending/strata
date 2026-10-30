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
  const dir = mkdtempSync(join(tmpdir(), "strata-movement-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

/** The people holding a copy of `event`, read back through each person's received view. */
function witnesses(engine: Engine, event: WorldEvent): string[] {
  return engine.defs.people
    .map((person) => person.id)
    .filter((id) => engine.received(id).some((copy) => copy.id === event.id));
}

describe("C5: Glitch departs east, then the clock steps once", () => {
  test("the depart, the transit, the tick and the arrive, each witnessed after application", () => {
    const engine = fresh();
    const east = engine.defs.rooms.find((room) => room.id === "chrome-cassette")?.exits.east;
    expect(east).toBeDefined();

    const acted = engine.act({ actor: "glitch", verb: "depart", exit: "east" });
    if (acted.outcome !== "recorded") throw new Error(JSON.stringify(acted));
    const [depart] = acted.events;
    if (depart === undefined) throw new Error("no depart recorded");
    expect(depart).toMatchObject({
      tick: 0,
      subkind: "physical.depart",
      actor: "glitch",
      place: "chrome-cassette",
      cause: "operator",
      payload: {
        from: "chrome-cassette",
        exit: "east",
        to: "back-room",
        travelTicks: east?.travel_ticks,
        arrivesAt: 1,
      },
    });

    const inTransit = engine.snapshot();
    expect(inTransit.people.glitch?.location).toEqual({
      transit: { from: "chrome-cassette", to: "back-room", arrivesAt: 1 },
    });
    expect(inTransit.views.presence["chrome-cassette"]).not.toContain("glitch");
    expect(inTransit.views.presence["back-room"]).not.toContain("glitch");
    expect(witnesses(engine, depart)).toEqual(["glitch", "rogue"]);

    const stepped = engine.step();
    expect(stepped.map((event) => event.subkind)).toEqual(["time.tick", "physical.arrive"]);
    const [tick, arrive] = stepped;
    if (tick === undefined || arrive === undefined) throw new Error("step recorded too little");
    expect(tick.seq).toBe(depart.seq + 1);
    expect(arrive.seq).toBe(tick.seq + 1);
    expect(arrive).toMatchObject({
      tick: 1,
      actor: "glitch",
      place: "back-room",
      cause: depart.id,
      payload: { from: "chrome-cassette", to: "back-room" },
    });
    expect(engine.snapshot().people.glitch?.location).toEqual({ room: "back-room" });
    expect(witnesses(engine, arrive)).toEqual(["glitch", "mux"]);
    expect(witnesses(engine, tick)).toEqual([]);
  });
});
