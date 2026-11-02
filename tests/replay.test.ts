import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compare, project } from "../src/driver/replay.ts";
import { loadWorld, type WorldDefs } from "../src/engine/definitions.ts";
import { boot, type Engine } from "../src/engine/engine.ts";
import { registry, type Subkind, type Visibility, type WorldEvent } from "../src/engine/events.ts";
import { initialRows, type StateRow } from "../src/engine/things.ts";

const WORLD = join(import.meta.dir, "..", "world");

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function committedDefs(): WorldDefs {
  const loaded = loadWorld(WORLD);
  if (!loaded.ok) throw new Error(loaded.refusal.message);
  return loaded.defs;
}

function bootEngine(): Engine {
  const dir = mkdtempSync(join(tmpdir(), "strata-replay-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

/** An event as the engine would record it, with its registry visibility. */
function event<S extends Subkind>(
  seq: number,
  subkind: S,
  fields: Omit<
    Extract<WorldEvent, { subkind: S }>,
    "id" | "seq" | "kind" | "subkind" | "visibility"
  >,
): WorldEvent {
  return {
    id: `e${seq}`,
    seq,
    kind: subkind.slice(0, subkind.indexOf(".")),
    subkind,
    visibility: registry[subkind].visibility as Visibility,
    ...fields,
  } as WorldEvent;
}

/** Glitch walks to the Back Room; Mux, already there, offers Glitch the charge cell; Glitch takes it. */
const log: WorldEvent[] = [
  event(1, "physical.depart", {
    tick: 0,
    actor: "glitch",
    targets: [],
    place: "chrome-cassette",
    cause: "operator",
    payload: {
      from: "chrome-cassette",
      exit: "east",
      to: "back-room",
      travelTicks: 1,
      arrivesAt: 1,
    },
  }),
  event(2, "time.tick", {
    tick: 1,
    actor: "clock",
    targets: [],
    place: null,
    cause: "operator",
    payload: {},
  }),
  event(3, "physical.arrive", {
    tick: 1,
    actor: "glitch",
    targets: [],
    place: "back-room",
    cause: "e1",
    payload: { from: "chrome-cassette", to: "back-room", present: ["mux"] },
  }),
  event(4, "exchange.offer", {
    tick: 1,
    actor: "mux",
    targets: ["glitch"],
    place: "back-room",
    cause: "operator",
    payload: { item: "charge-cell", until: 3 },
  }),
  event(5, "exchange.accept", {
    tick: 1,
    actor: "glitch",
    targets: ["mux"],
    place: "back-room",
    cause: "operator",
    payload: { item: "charge-cell", from: "mux" },
  }),
];

describe("C2: the replay oracle", () => {
  test("project over a hand-built log reaches the rows derived by hand", () => {
    const defs = committedDefs();
    const booted = bootEngine().rows();
    const changed: Record<string, unknown> = {
      "glitch/location": { room: "back-room" },
      "charge-cell/holder": "glitch",
      "charge-cell/offer": "none",
      "clock/tick": 1,
      "clock/schedule": [],
    };
    const expected = booted.map((row) => {
      const key = `${row.thing}/${row.part}`;
      return Object.hasOwn(changed, key) ? { ...row, state: changed[key] } : row;
    });
    // The booted charge cell was Mux's and Glitch stood in the Chrome Cassette.
    expect(booted).toContainEqual({ thing: "charge-cell", part: "holder", state: "mux" });
    expect(booted).toContainEqual({
      thing: "glitch",
      part: "location",
      state: { room: "chrome-cassette" },
    });

    const replayed = project(defs, log);
    expect(compare(expected, replayed, "e5")).toBeNull();
    const byKey = (rows: StateRow[]) =>
      Object.fromEntries(rows.map((row) => [`${row.thing}/${row.part}`, row.state]));
    expect(byKey(replayed)).toEqual(byKey(expected));
    expect(replayed).toHaveLength(booted.length);
  });

  test("project persists nothing: the booted rows it starts from are left as they were", () => {
    const defs = committedDefs();
    const before = structuredClone(initialRows(defs));
    project(defs, log);
    expect(initialRows(defs)).toEqual(before);
  });

  test("compare names the one differing row with both values, and null for identical rows", () => {
    const live = bootEngine().rows();
    const copy = live.map((row) =>
      row.thing === "stimpak" && row.part === "holder" ? { ...row, state: "mux" } : row,
    );
    expect(compare(live, copy, "e9")).toEqual({
      thing: "stimpak",
      part: "holder",
      event: "e9",
      live: "glitch",
      replayed: "mux",
    });
    expect(compare(live, structuredClone(live), "e9")).toBeNull();
    expect(compare(live, [...live].reverse(), null)).toBeNull();
  });
});
