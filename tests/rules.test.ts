import { Database } from "bun:sqlite";
import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { boot, type Engine } from "../src/engine/engine.ts";
import type { RefusalCode } from "../src/engine/rules.ts";

const WORLD = join(import.meta.dir, "..", "world");

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function fresh(): Engine {
  const dir = mkdtempSync(join(tmpdir(), "strata-rules-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

function record(engine: Engine, action: Record<string, string>): void {
  const result = engine.act(action);
  if (result.outcome !== "recorded")
    throw new Error(`setup action failed: ${JSON.stringify(result)}`);
}

/** Every row of every table, read through a separate connection to the world's database. */
function tables(engine: Engine): Record<string, unknown[]> {
  const db = new Database(engine.dbPath, { readonly: true });
  try {
    return {
      events: db.query("SELECT * FROM events ORDER BY seq").all(),
      state: db.query("SELECT * FROM state ORDER BY thing, part").all(),
      witnessed: db.query("SELECT * FROM witnessed ORDER BY event, witness").all(),
    };
  } finally {
    db.close();
  }
}

function expectRefused(engine: Engine, action: Record<string, string>, code: RefusalCode): void {
  const before = tables(engine);
  const result = engine.act(action);
  expect(result).toMatchObject({ outcome: "refused", refused: { code } });
  expect(tables(engine)).toEqual(before);
}

describe("C3: each forbidden action is refused by code and writes nothing", () => {
  test("no-such-exit: Rogue departs west", () => {
    expectRefused(fresh(), { actor: "rogue", verb: "depart", exit: "west" }, "no-such-exit");
  });

  test("in-transit: a person in transit says anything", () => {
    const engine = fresh();
    record(engine, { actor: "glitch", verb: "depart", exit: "east" });
    expectRefused(engine, { actor: "glitch", verb: "say", words: "anyone?" }, "in-transit");
  });

  test("not-in-room: Rogue whispers to Mux", () => {
    expectRefused(
      fresh(),
      { actor: "rogue", verb: "whisper", target: "mux", words: "psst" },
      "not-in-room",
    );
  });

  test("self-target: Rogue says-to Rogue", () => {
    expectRefused(
      fresh(),
      { actor: "rogue", verb: "say-to", target: "rogue", words: "hm" },
      "self-target",
    );
  });

  test("not-holding: Glitch offers the data shard", () => {
    expectRefused(
      fresh(),
      { actor: "glitch", verb: "offer", target: "rogue", item: "data-shard" },
      "not-holding",
    );
  });

  test("already-offered: Rogue offers the data shard twice", () => {
    const engine = fresh();
    const offer = { actor: "rogue", verb: "offer", target: "glitch", item: "data-shard" };
    record(engine, offer);
    expectRefused(engine, offer, "already-offered");
  });

  test("not-offered-to-you: Mux accepts an offer made to Glitch", () => {
    const engine = fresh();
    record(engine, { actor: "rogue", verb: "offer", target: "glitch", item: "data-shard" });
    expectRefused(
      engine,
      { actor: "mux", verb: "accept", item: "data-shard" },
      "not-offered-to-you",
    );
  });

  test("giver-absent: Glitch accepts after Rogue has departed", () => {
    const engine = fresh();
    record(engine, { actor: "rogue", verb: "offer", target: "glitch", item: "data-shard" });
    record(engine, { actor: "rogue", verb: "depart", exit: "east" });
    expectRefused(engine, { actor: "glitch", verb: "accept", item: "data-shard" }, "giver-absent");
  });
});

describe("actions the schemas reject", () => {
  test("an actor naming no person is invalid and writes nothing", () => {
    const engine = fresh();
    const before = tables(engine);
    expect(engine.act({ actor: "nobody", verb: "say", words: "hi" }).outcome).toBe("invalid");
    expect(engine.act({ actor: "rogue", verb: "dance" }).outcome).toBe("invalid");
    expect(engine.act({ actor: "rogue", verb: "say", words: "hi", extra: 1 }).outcome).toBe(
      "invalid",
    );
    expect(tables(engine)).toEqual(before);
  });
});
