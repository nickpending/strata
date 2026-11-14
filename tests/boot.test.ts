import { Database } from "bun:sqlite";
import { afterAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import {
  type ItemDef,
  loadWorld,
  type PersonDef,
  type RoomDef,
  type WorldDefs,
} from "../src/engine/definitions.ts";
import { boot, type Engine } from "../src/engine/engine.ts";

const WORLD = join(import.meta.dir, "..", "world");
const MAIN = join(import.meta.dir, "..", "src", "server", "main.ts");

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "strata-boot-"));
  temps.push(dir);
  return dir;
}

function bootInto(dbPath: string): Engine {
  const booted = boot(WORLD, { tickMinutes: 10, dbPath });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

function committedDefs(): WorldDefs {
  const loaded = loadWorld(WORLD);
  if (!loaded.ok) throw new Error(loaded.refusal.message);
  return loaded.defs;
}

function stateRows(dbPath: string): unknown[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    return db.query("SELECT thing, part, json FROM state ORDER BY thing, part").all();
  } finally {
    db.close();
  }
}

function eventCount(dbPath: string): number {
  const db = new Database(dbPath, { readonly: true });
  try {
    return db.query<{ n: number }, []>("SELECT count(*) AS n FROM events").get()?.n ?? -1;
  } finally {
    db.close();
  }
}

function hashTree(dir: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = join(entry.parentPath, entry.name);
    hashes[relative(dir, file)] = createHash("sha256").update(readFileSync(file)).digest("hex");
  }
  return hashes;
}

describe("C1: a missing tick length refuses", () => {
  test("boot() refuses naming --tick-minutes and creates no database", () => {
    const dbPath = join(tempDir(), "world.sqlite");
    const booted = boot(WORLD, { dbPath });
    expect(booted.ok).toBe(false);
    if (booted.ok) return;
    expect(booted.refusal.message).toContain("--tick-minutes");
    expect(existsSync(dbPath)).toBe(false);
  });

  test("the CLI exits non-zero naming --tick-minutes and creates no database", () => {
    const cwd = tempDir();
    const run = Bun.spawnSync([process.execPath, "run", MAIN, "--world", WORLD, "--port", "0"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.exitCode).not.toBe(0);
    expect(run.stderr.toString()).toContain("--tick-minutes");
    expect(readdirSync(cwd)).toEqual([]);
  });
});

describe("C2: a broken definition refuses naming file, path and rule", () => {
  const cases: {
    name: string;
    file: string;
    /** Break the parsed file in place, returning the value it replaced. */
    breakIt: (def: Partial<ItemDef & RoomDef & PersonDef>) => unknown;
    from: unknown;
    path: string;
    rule: string;
  }[] = [
    {
      name: "an item whose holder names no person",
      file: "items/stimpak.json",
      breakIt: (item) => {
        const was = item.holder;
        item.holder = "nobody";
        return was;
      },
      from: "glitch",
      path: "holder",
      rule: "holder-names-person",
    },
    {
      name: "a room exit whose to names no room",
      file: "rooms/chrome-cassette.json",
      breakIt: (room) => {
        const exit = room.exits?.east;
        const was = exit?.to;
        if (exit) exit.to = "nowhere";
        return was;
      },
      from: "back-room",
      path: "exits.east.to",
      rule: "exit-to-names-room",
    },
    {
      name: "a person whose location names no room",
      file: "people/mux.json",
      breakIt: (person) => {
        const was = person.location;
        person.location = "nowhere";
        return was;
      },
      from: "back-room",
      path: "location",
      rule: "location-names-room",
    },
    {
      name: "a ties target naming no person",
      file: "people/rogue.json",
      breakIt: (person) => {
        const tie = person.ties?.[0];
        const was = tie?.target;
        if (tie) tie.target = "nobody";
        return was;
      },
      from: "glitch",
      path: "ties.0.target",
      rule: "tie-target-names-person",
    },
    {
      name: "a missing required field",
      file: "items/data-shard.json",
      breakIt: (item) => {
        const was = item.holder;
        delete item.holder;
        return was;
      },
      from: "rogue",
      path: "holder",
      rule: "invalid_type",
    },
  ];

  for (const broken of cases) {
    test(broken.name, () => {
      const dir = tempDir();
      const world = join(dir, "world");
      cpSync(WORLD, world, { recursive: true });
      const file = join(world, broken.file);
      expect(existsSync(file)).toBe(true);
      const def = JSON.parse(readFileSync(file, "utf8"));
      expect(broken.breakIt(def)).toBe(broken.from);
      writeFileSync(file, JSON.stringify(def));

      const dbPath = join(dir, "world.sqlite");
      const booted = boot(world, { tickMinutes: 10, dbPath });
      expect(booted.ok).toBe(false);
      if (booted.ok) return;
      expect(booted.refusal).toMatchObject({ file, path: broken.path, rule: broken.rule });
      expect(booted.refusal.message).toContain(broken.file);
      expect(existsSync(dbPath)).toBe(false);
    });
  }
});

describe("C4: two boots of the committed world are identical", () => {
  test("each boot holds the authored world at tick 0, and the state tables match row for row", () => {
    const defs = committedDefs();
    const dir = tempDir();
    const first = join(dir, "first.sqlite");
    const second = join(dir, "second.sqlite");
    for (const dbPath of [first, second]) {
      const snapshot = bootInto(dbPath).snapshot();
      expect(snapshot.views.presence).toEqual({
        "back-room": ["mux"],
        "chrome-cassette": ["glitch", "rogue"],
      });
      expect(snapshot.items.stimpak?.holder).toBe("glitch");
      expect(snapshot.items["charge-cell"]?.holder).toBe("mux");
      expect(snapshot.items["data-shard"]?.holder).toBe("rogue");
      for (const person of defs.people) {
        expect(snapshot.people[person.id]?.location).toEqual({ room: person.location });
        expect(snapshot.people[person.id]?.ties).toEqual(person.ties);
      }
      for (const item of defs.items) {
        expect(snapshot.items[item.id]).toEqual({ holder: item.holder, offer: "none" });
      }
      expect(eventCount(dbPath)).toBe(0);
      expect(snapshot.tick).toBe(0);
      expect(snapshot.schedule).toEqual([]);
    }
    const rows = stateRows(first);
    expect(rows.length).toBeGreaterThan(0);
    expect(stateRows(second)).toEqual(rows);
  });

  test("a boot replaces whatever database was at the path", () => {
    const dbPath = join(tempDir(), "world.sqlite");
    const engine = bootInto(dbPath);
    engine.step();
    expect(eventCount(dbPath)).toBe(1);
    bootInto(dbPath);
    expect(eventCount(dbPath)).toBe(0);
  });
});

describe("C12: the definitions are never written", () => {
  test("world/ hashes the same before boot and after the C5 and C7 sequences", () => {
    const before = hashTree(WORLD);
    expect(Object.keys(before).length).toBeGreaterThan(0);
    const engine = bootInto(join(tempDir(), "world.sqlite"));
    expect(engine.act({ actor: "glitch", verb: "depart", exit: "east" }).outcome).toBe("recorded");
    engine.step();
    const back = engine.act({ actor: "glitch", verb: "depart", exit: "west" });
    if (back.outcome !== "recorded") throw new Error(JSON.stringify(back));
    const { travelTicks } = back.events[0]?.payload as { travelTicks: number };
    for (let i = 0; i < travelTicks; i++) engine.step();
    const offer = { actor: "rogue", verb: "offer", target: "glitch", item: "data-shard" };
    expect(engine.act(offer).outcome).toBe("recorded");
    expect(engine.act({ actor: "glitch", verb: "accept", item: "data-shard" }).outcome).toBe(
      "recorded",
    );
    expect(hashTree(WORLD)).toEqual(before);
  });
});
