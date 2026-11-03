import { afterAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { projectKnown } from "../src/driver/replay.ts";
import { type DriverReport, runDriver } from "../src/driver/run.ts";
import { loadWorld } from "../src/engine/definitions.ts";
import { boot, type Engine } from "../src/engine/engine.ts";
import { type RegistryEntry, registry, subkinds, type WorldEvent } from "../src/engine/events.ts";
import type { KnownRow } from "../src/engine/knowledge.ts";
import type { RefusalCode } from "../src/engine/rules.ts";

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");
const MAIN = join(ROOT, "src", "driver", "main.ts");

/** The closed set of refusal codes, as rules.ts's RefusalCode type holds it. */
const CODES: { [C in RefusalCode]: C } = {
  "no-such-exit": "no-such-exit",
  "in-transit": "in-transit",
  "not-in-room": "not-in-room",
  "self-target": "self-target",
  "not-holding": "not-holding",
  "already-offered": "already-offered",
  "not-offered-to-you": "not-offered-to-you",
  "giver-absent": "giver-absent",
};

function hashTree(dir: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = join(entry.parentPath, entry.name);
    hashes[relative(dir, file)] = createHash("sha256").update(readFileSync(file)).digest("hex");
  }
  return hashes;
}

/** The C1 command, run as the operator runs it. */
function runC1(): { exitCode: number; report: DriverReport; stderr: string } {
  const run = Bun.spawnSync(
    [process.execPath, "run", MAIN, "--seed", "7", "--actions", "800", "--tick-minutes", "10"],
    { cwd: ROOT, stdout: "pipe", stderr: "pipe" },
  );
  return {
    exitCode: run.exitCode,
    report: JSON.parse(run.stdout.toString()) as DriverReport,
    stderr: run.stderr.toString(),
  };
}

describe("C1 and C11: a seeded driver run over the committed world", () => {
  test("seed 7, 800 actions, a step every 5: every subkind, every code, every check passed, and world/ untouched", () => {
    // The run is held on the committed world with 1-tick travel each way: every exit takes 1 tick.
    const loaded = loadWorld(WORLD);
    if (!loaded.ok) throw new Error(loaded.refusal.message);
    const travel = loaded.defs.rooms.flatMap((room) =>
      Object.entries(room.exits).map(([exit, to]) => [room.id, exit, to.travel_ticks]),
    );
    expect(travel).toEqual([
      ["back-room", "west", 1],
      ["chrome-cassette", "east", 1],
    ]);
    const before = hashTree(WORLD);
    const first = runC1();
    expect(first.report.failure ?? null).toBeNull();
    expect(first.stderr).toBe("");
    expect(first.exitCode).toBe(0);
    expect(first.report).toMatchObject({ ok: true, seed: 7, actions: 800, steps: 160 });
    const { recorded, refused } = first.report.tally;
    expect(subkinds.filter((subkind) => !((recorded[subkind] ?? 0) > 0))).toEqual([]);
    expect(Object.values(CODES).filter((code) => !((refused[code] ?? 0) > 0))).toEqual([]);
    expect(Object.keys(refused).sort()).toEqual(Object.values(CODES).sort());
    expect(first.report.tally.invalid).toBeGreaterThan(0);
    expect(first.report.checks).toEqual({
      replay: 960,
      knowledge: 960,
      truth: 960,
      present: 960,
      invariants: 960,
    });

    const second = runC1();
    expect(second.exitCode).toBe(0);
    expect(second.report.tally).toEqual(first.report.tally);
    expect(hashTree(WORLD)).toEqual(before);
  }, 120_000);

  test("seeds 1, 2 and 3, 200 actions each: every state, knowledge, truth and present check passed", () => {
    for (const seed of [1, 2, 3]) {
      const result = runDriver({
        worldDir: WORLD,
        tickMinutes: 10,
        seed,
        actions: 200,
        stepEvery: 5,
      });
      if (!result.ok) throw new Error(result.refusal.message);
      expect(result.report.failure ?? null).toBeNull();
      expect(result.report.checks).toEqual({
        replay: 240,
        knowledge: 240,
        truth: 240,
        present: 240,
        invariants: 240,
      });
    }
  }, 120_000);

  test("a missing tick length is a usage error naming --tick-minutes", () => {
    const run = Bun.spawnSync([process.execPath, "run", MAIN, "--seed", "7"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(run.exitCode).toBe(2);
    expect(run.stderr.toString()).toContain("--tick-minutes");
  });
});

describe("K7: the fuzzer replays knowledge from the log and checks every fact against the world", () => {
  const temps: string[] = [];
  const engines: Engine[] = [];
  afterAll(() => {
    for (const engine of engines) engine.close();
    for (const dir of temps) rmSync(dir, { recursive: true, force: true });
  });

  /** Mux walks west into the bar, where Glitch and Rogue stand: the log of a fresh engine. */
  function muxWalksIn(): { engine: Engine; events: WorldEvent[]; arrive: WorldEvent } {
    const dir = mkdtempSync(join(tmpdir(), "strata-driver-"));
    temps.push(dir);
    const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
    if (!booted.ok) throw new Error(booted.refusal.message);
    engines.push(booted.engine);
    booted.engine.act({ actor: "mux", verb: "depart", exit: "west" });
    const arrive = booted.engine.step().find((event) => event.subkind === "physical.arrive");
    if (arrive === undefined) throw new Error("mux never arrived");
    return { engine: booted.engine, events: booted.engine.events(), arrive };
  }

  const places = (witness: string) =>
    ["back-room", "chrome-cassette"].map(
      (room): KnownRow => ({
        witness,
        kind: "place",
        thing: room,
        value: null,
        tick: 0,
        event: null,
      }),
    );
  const inBar = (witness: string, thing: string, event: string): KnownRow => ({
    witness,
    kind: "location",
    thing,
    value: { room: "chrome-cassette" },
    tick: 1,
    event,
  });

  test("projectKnown reaches, from the log alone, the rows derived by hand and the live store's", () => {
    const { engine, events, arrive } = muxWalksIn();
    const projected = projectKnown(engine.defs, engine.tickMinutes, events);
    const byWitness = (witness: string) => projected.rows.filter((row) => row.witness === witness);
    expect(byWitness("glitch")).toEqual([...places("glitch"), inBar("glitch", "mux", arrive.id)]);
    expect(byWitness("mux")).toEqual([
      ...places("mux"),
      inBar("mux", "glitch", arrive.id),
      inBar("mux", "rogue", arrive.id),
    ]);
    expect(byWitness("rogue")).toEqual([...places("rogue"), inBar("rogue", "mux", arrive.id)]);
    expect(["glitch", "mux", "rogue"].flatMap((p) => engine.known(p))).toEqual([
      ...byWitness("glitch"),
      ...byWitness("mux"),
      ...byWitness("rogue"),
    ]);
    expect(projected.falseFacts).toEqual([]);
    expect(projected.wrongPresent).toEqual([]);
  });

  test("an arrive whose present is not who was in the room is named, with both lists", () => {
    const { engine, events, arrive } = muxWalksIn();
    const tampered = events.map((event) =>
      event.id === arrive.id
        ? { ...event, payload: { ...event.payload, present: ["glitch"] } }
        : event,
    ) as WorldEvent[];
    const projected = projectKnown(engine.defs, engine.tickMinutes, tampered);
    expect(projected.wrongPresent).toEqual([
      { event: arrive.id, present: ["glitch"], expected: ["glitch", "rogue"] },
    ]);
    expect(projected.rows.filter((row) => row.witness === "mux" && row.thing === "rogue")).toEqual(
      [],
    );
  });

  type Teach = RegistryEntry["teaches"];

  /** Seed 7's run with a test-only registry, whose speech.say teaches by `teaches` instead. */
  function planted(teaches: (copy: Parameters<Teach>[0], real: Teach) => ReturnType<Teach>) {
    const say = registry["speech.say"] as { teaches: Teach };
    const real = say.teaches;
    say.teaches = (copy) => teaches(copy, real);
    try {
      const result = runDriver({
        worldDir: WORLD,
        tickMinutes: 10,
        seed: 7,
        actions: 400,
        stepEvery: 5,
      });
      if (!result.ok) throw new Error(result.refusal.message);
      return result.report;
    } finally {
      say.teaches = real;
    }
  }

  test("a teaching that answers the replay otherwise than it answered record() fails the knowledge replay", () => {
    const taught = new Set<string>();
    const report = planted((copy, real) => {
      if (taught.has(copy.id)) return [];
      taught.add(copy.id);
      return real(copy);
    });
    expect(report.failure?.check).toBe("knowledge");
    if (report.failure?.check !== "knowledge") return;
    const { witness, event, live, replayed } = report.failure.difference;
    expect(event).not.toBeNull();
    expect(live).not.toEqual(replayed);
    expect(report.failure.message).toContain(witness);
    expect(report.failure.message).toContain(`${event}`);
  }, 120_000);

  test("a planted false teaching, say teaching the speaker in the other room, fails the truth check", () => {
    const result = {
      report: planted((copy) => [
        {
          kind: "location",
          thing: copy.actor,
          value: { room: copy.place === "back-room" ? "chrome-cassette" : "back-room" },
        },
      ]),
    };
    const { failure } = result.report;
    expect(failure?.check).toBe("truth");
    if (failure?.check !== "truth") return;
    const { witness, event, value, now } = failure.falseFact;
    const logged = result.report.tally.recorded["speech.say"] ?? 0;
    expect(logged).toBeGreaterThan(0);
    expect(value).not.toEqual(now);
    expect(failure.message).toContain(witness);
    expect(failure.message).toContain(event);
    expect(failure.message).toContain(JSON.stringify(value));
    expect(failure.message).toContain(JSON.stringify(now));
    expect(failure.message).toMatch(/speech\.say/);
  }, 120_000);
});
