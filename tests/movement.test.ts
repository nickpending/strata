import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadWorld } from "../src/engine/definitions.ts";
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
    });
    // Mux was already in the Back Room as Glitch arrived.
    expect(arrive.payload).toEqual({ from: "chrome-cassette", to: "back-room", present: ["mux"] });
    expect(engine.received("mux").find((copy) => copy.id === arrive.id)?.payload).toEqual({
      from: "chrome-cassette",
      to: "back-room",
    });
    expect(engine.snapshot().people.glitch?.location).toEqual({ room: "back-room" });
    expect(witnesses(engine, arrive)).toEqual(["glitch", "mux"]);
    expect(witnesses(engine, tick)).toEqual([]);
  });
});

describe("W2: every world/ exit takes 1 tick, and world/'s offer window is 2", () => {
  test("each exit's travel_ticks is 1, a depart either way arrives on the one step, the window 2", () => {
    const loaded = loadWorld(WORLD);
    if (!loaded.ok) throw new Error(loaded.refusal.message);
    const exits = loaded.defs.rooms.flatMap((room) =>
      Object.entries(room.exits).map(([exit, to]) => [room.id, exit, to.travel_ticks]),
    );
    expect(exits.length).toBeGreaterThan(0);
    expect(exits.filter(([, , ticks]) => ticks !== 1)).toEqual([]);
    expect(loaded.defs.offerWindowTicks).toBe(2);

    for (const [actor, exit] of [
      ["mux", "west"],
      ["glitch", "east"],
    ] as const) {
      const engine = fresh();
      const acted = engine.act({ actor, verb: "depart", exit });
      if (acted.outcome !== "recorded") throw new Error(JSON.stringify(acted));
      const [depart] = acted.events;
      expect(depart?.tick).toBe(0);
      expect(depart?.payload).toMatchObject({ travelTicks: 1, arrivesAt: 1 });
      const stepped = engine.step();
      expect(stepped.map((event) => [event.tick, event.subkind, event.actor])).toContainEqual([
        1,
        "physical.arrive",
        actor,
      ]);
    }
  });
});
