import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { check } from "../src/driver/invariants.ts";
import { boot, type Engine } from "../src/engine/engine.ts";
import { type Copy, redact, registry, type WorldEvent } from "../src/engine/events.ts";

const WORLD = join(import.meta.dir, "..", "world");

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function bootEngine(): Engine {
  const dir = mkdtempSync(join(tmpdir(), "strata-invariants-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

describe("C3: the world invariants", () => {
  test("a hand-built world breaking each of the four yields one violation of each, naming its thing", () => {
    const snapshot = bootEngine().snapshot();
    // An item held by nobody.
    snapshot.items.stimpak = { holder: "nobody", offer: "none" };
    // Glitch in transit with nothing in the schedule to bring her in.
    snapshot.people.glitch = {
      location: { transit: { from: "chrome-cassette", to: "back-room", arrivesAt: 3 } },
      ties: snapshot.people.glitch?.ties ?? [],
    };
    snapshot.schedule = [];

    const whisper = {
      id: "e1",
      tick: 0,
      seq: 1,
      kind: "speech",
      subkind: "speech.whisper",
      actor: "rogue",
      targets: ["glitch"],
      place: "chrome-cassette",
      visibility: registry["speech.whisper"].visibility,
      cause: "operator",
      payload: { words: "the shard is hot" },
    } as WorldEvent;
    // A say whose payload carries a field its schema does not allow.
    const broken = {
      ...whisper,
      id: "e2",
      seq: 2,
      subkind: "speech.say",
      targets: [],
      visibility: registry["speech.say"].visibility,
      payload: { words: "hey", volume: 11 },
    } as unknown as WorldEvent;
    const overheard: Copy = { ...whisper, payload: { words: "the shard is hot" } };
    const received: Record<string, Copy[]> = {
      glitch: [redact(whisper, "glitch")],
      rogue: [redact(whisper, "rogue")],
      mux: [overheard],
    };

    const violations = check({ snapshot, events: [whisper, broken], received });
    const byKind = Object.fromEntries(violations.map((v) => [v.invariant, v]));
    expect(violations.map((v) => v.invariant).sort()).toEqual([
      "holder",
      "location",
      "log",
      "redaction",
    ]);
    expect(byKind.holder).toMatchObject({ thing: "stimpak" });
    expect(byKind.holder?.detail).toContain("nobody");
    expect(byKind.location).toMatchObject({ thing: "glitch" });
    expect(byKind.location?.detail).toContain("no arrive");
    expect(byKind.redaction).toMatchObject({ thing: "mux" });
    expect(byKind.redaction?.detail).toContain("e1");
    expect(byKind.redaction?.detail).toContain("words");
    expect(byKind.log).toMatchObject({ thing: "e2" });
    expect(byKind.log?.detail).toContain("speech.say");
  });

  test("the freshly booted committed world breaks none", () => {
    const engine = bootEngine();
    const snapshot = engine.snapshot();
    const received = Object.fromEntries(
      Object.keys(snapshot.people).map((person) => [person, engine.received(person)]),
    );
    expect(check({ snapshot, events: engine.events(), received })).toEqual([]);
  });

  test("a person in transit with the arrive due at its arrivesAt is located", () => {
    const engine = bootEngine();
    expect(engine.act({ actor: "glitch", verb: "depart", exit: "east" }).outcome).toBe("recorded");
    const snapshot = engine.snapshot();
    expect(snapshot.views.inTransit).toHaveLength(1);
    const received = Object.fromEntries(
      Object.keys(snapshot.people).map((person) => [person, engine.received(person)]),
    );
    expect(check({ snapshot, events: engine.events(), received })).toEqual([]);
  });
});
