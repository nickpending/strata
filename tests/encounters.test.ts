import { afterAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ScoreFile, scorePath } from "harness/score.ts";
import type { Encounter } from "../src/engine/encounters.ts";
import { boot, type Engine } from "../src/engine/engine.ts";
import type { WorldEvent } from "../src/engine/events.ts";

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");
const PEOPLE = ["glitch", "mux", "rogue"];

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function fresh(): Engine {
  const dir = mkdtempSync(join(tmpdir(), "strata-encounters-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

/** Act and return the one event the action recorded. */
function act(engine: Engine, action: Record<string, string>): WorldEvent {
  const result = engine.act(action);
  if (result.outcome !== "recorded") throw new Error(JSON.stringify(result));
  const [event] = result.events;
  if (event === undefined) throw new Error("nothing recorded");
  return event;
}

/** Step the clock and return the event of `subkind` the step recorded. */
function stepTo(engine: Engine, subkind: string): WorldEvent {
  const found = engine.step().find((event) => event.subkind === subkind);
  if (found === undefined) throw new Error(`the step recorded no ${subkind}`);
  return found;
}

/** Mux walks west to the bar: the depart, then one step to the arrive. */
function muxToBar(engine: Engine): { depart: WorldEvent; arrive: WorldEvent } {
  const depart = act(engine, { actor: "mux", verb: "depart", exit: "west" });
  return { depart, arrive: stepTo(engine, "physical.arrive") };
}

/** `person`'s encounters that came from `event`. */
function from(engine: Engine, person: string, event: WorldEvent): Encounter[] {
  return engine.encounters(person).encounters.filter((encounter) => encounter.event === event.id);
}

/** The encounter `event` gives its holder with `other`, in `role`. */
function met(event: WorldEvent, other: string, role: Encounter["role"]): Encounter {
  return { with: other, role, subkind: event.subkind, tick: event.tick, event: event.id };
}

function everyone(engine: Engine): Record<string, Encounter[]> {
  return Object.fromEntries(PEOPLE.map((p) => [p, engine.encounters(p).encounters]));
}

/** What `event` gave each person: their encounters from it, keyed by person. */
function fromEach(engine: Engine, event: WorldEvent): Record<string, Encounter[]> {
  return Object.fromEntries(PEOPLE.map((p) => [p, from(engine, p, event)]));
}

describe("V6: one encounter per other recipient of each event, direct for its actor or a target", () => {
  test("mux's depart gives mux none; its arrive gives mux one direct with each in the room, each there one witnessed with every other", () => {
    const engine = fresh();
    const depart = act(engine, { actor: "mux", verb: "depart", exit: "west" });
    expect(fromEach(engine, depart)).toEqual({ glitch: [], mux: [], rogue: [] });
    const arrive = stepTo(engine, "physical.arrive");
    expect(arrive.subkind).toBe("physical.arrive");
    expect(fromEach(engine, arrive)).toEqual({
      glitch: [met(arrive, "mux", "witnessed"), met(arrive, "rogue", "witnessed")],
      mux: [met(arrive, "glitch", "direct"), met(arrive, "rogue", "direct")],
      rogue: [met(arrive, "glitch", "witnessed"), met(arrive, "mux", "witnessed")],
    });
    expect(engine.encounters("mux").encounters).toEqual(from(engine, "mux", arrive));
  });

  test("then glitch's say: glitch direct with each listener, each listener witnessed with glitch and with the other", () => {
    const engine = fresh();
    muxToBar(engine);
    const say = act(engine, { actor: "glitch", verb: "say", words: "hello" });
    expect(fromEach(engine, say)).toEqual({
      glitch: [met(say, "mux", "direct"), met(say, "rogue", "direct")],
      mux: [met(say, "glitch", "witnessed"), met(say, "rogue", "witnessed")],
      rogue: [met(say, "glitch", "witnessed"), met(say, "mux", "witnessed")],
    });
  });

  test("rogue's whisper to glitch: actor and target direct with both others, the bystander witnessed with both", () => {
    const engine = fresh();
    muxToBar(engine);
    const whisper = act(engine, {
      actor: "rogue",
      verb: "whisper",
      target: "glitch",
      words: "psst",
    });
    expect(whisper.subkind).toBe("speech.whisper");
    expect(fromEach(engine, whisper)).toEqual({
      glitch: [met(whisper, "mux", "direct"), met(whisper, "rogue", "direct")],
      mux: [met(whisper, "glitch", "witnessed"), met(whisper, "rogue", "witnessed")],
      rogue: [met(whisper, "glitch", "direct"), met(whisper, "mux", "direct")],
    });
  });

  test("glitch's depart east: glitch direct with the one who saw it, that one witnessed, mux in the back room none", () => {
    const engine = fresh();
    const depart = act(engine, { actor: "glitch", verb: "depart", exit: "east" });
    expect(engine.received("mux").map((copy) => copy.id)).not.toContain(depart.id);
    expect(everyone(engine)).toEqual({
      glitch: [met(depart, "rogue", "direct")],
      mux: [],
      rogue: [met(depart, "glitch", "witnessed")],
    });
  });

  test("a refused action, an invalid one and a tick-only step leave every person's encounters", () => {
    const engine = fresh();
    const say = act(engine, { actor: "rogue", verb: "say", words: "hello" });
    const before = everyone(engine);
    expect(before).toEqual({
      glitch: [met(say, "rogue", "witnessed")],
      mux: [],
      rogue: [met(say, "glitch", "direct")],
    });
    expect(
      engine.act({ actor: "mux", verb: "offer", target: "rogue", item: "stimpak" }).outcome,
    ).toBe("refused");
    expect(engine.act({ actor: "mux", verb: "fly" }).outcome).toBe("invalid");
    expect(everyone(engine)).toEqual(before);
    expect(engine.step().map((event) => event.subkind)).toEqual(["time.tick"]);
    expect(everyone(engine)).toEqual(before);
  });

  test("every encounter is of a copy its holder holds, with that event's subkind and tick, the others sorted by id", () => {
    const engine = fresh();
    muxToBar(engine);
    act(engine, { actor: "rogue", verb: "whisper", target: "glitch", words: "psst" });
    act(engine, { actor: "glitch", verb: "say-to", target: "mux", words: "hi" });
    const events = new Map(engine.events().map((event) => [event.id, event]));
    // The arrive, the whisper and the say-to each reach all three: two others for each of three.
    expect(Object.values(everyone(engine)).flat()).toHaveLength(18);
    for (const person of PEOPLE) {
      const held = new Set(engine.received(person).map((copy) => copy.id));
      const encounters = engine.encounters(person).encounters;
      for (const encounter of encounters) {
        expect(held.has(encounter.event)).toBe(true);
        expect(events.get(encounter.event)).toMatchObject({
          tick: encounter.tick,
          subkind: encounter.subkind,
        });
        expect(encounter.with).not.toBe(person);
      }
      for (const event of new Set(encounters.map((e) => e.event))) {
        const others = encounters.filter((e) => e.event === event).map((e) => e.with);
        expect(others).toEqual([...others].sort());
      }
    }
  });
});

describe("V7: knowledge's people are its tie targets, then each other person as of the first encounter", () => {
  test("each person's people keep the tie, then the arrive that first put each other with it", () => {
    const engine = fresh();
    const { arrive } = muxToBar(engine);
    act(engine, { actor: "rogue", verb: "whisper", target: "glitch", words: "psst" });
    act(engine, { actor: "rogue", verb: "say-to", target: "mux", words: "hi" });
    act(engine, { actor: "mux", verb: "say-to", target: "glitch", words: "yo" });
    const first = (event: WorldEvent, person: string) => ({
      person,
      tick: event.tick,
      source: event.id,
      subkind: event.subkind,
    });
    const authored = (person: string) => ({ person, tick: 0, source: "authored", subkind: null });
    expect(engine.knowledge("mux").people).toEqual([authored("glitch"), first(arrive, "rogue")]);
    expect(engine.knowledge("glitch").people).toEqual([authored("rogue"), first(arrive, "mux")]);
    expect(engine.knowledge("rogue").people).toEqual([authored("glitch"), first(arrive, "mux")]);
  });
});

describe("E6: the four sets re-run from byte copies, each score and loss on record", () => {
  const GOALS = join(ROOT, "corpus", "goals");
  const COPIES = join(ROOT, "corpus", "experiments", "npc-encounters");
  const SETS = ["knowledge", "blind-1", "blind-2", "blind-2-spent"];
  const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
  const scoreAt = (path: string) => JSON.parse(readFileSync(path, "utf8")) as ScoreFile;

  test("each copy is its original's bytes, its score sits beside it, and real-runs.md reports it", () => {
    const report = readFileSync(
      join(ROOT, "docs", "work", "npc-encounters", "real-runs.md"),
      "utf8",
    );
    for (const set of SETS) {
      const copy = join(COPIES, `${set}.json`);
      expect(sha256(copy)).toBe(sha256(join(GOALS, `${set}.json`)));
      const path = scorePath(copy, set, undefined);
      expect(path).toBe(
        join(COPIES, `${set}.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`),
      );
      const score = scoreAt(path);
      expect([score.set, score.model, score.request]).toEqual([
        set,
        "z-ai/glm-5.3-flash",
        "json-object-z-ai-retry",
      ]);
      const before = scoreAt(scorePath(join(GOALS, `${set}.json`), set, undefined));
      const row = [
        set,
        `${score.reached.held} of ${score.reached.of}`,
        `${before.reached.held} of ${before.reached.of}`,
        score.costUsd.toFixed(6),
        before.costUsd.toFixed(6),
      ];
      expect(report).toContain(`| ${row.join(" | ")} |`);
      for (const goal of score.perGoal.filter((g) => !g.held)) {
        expect(report).toContain(`- ${goal.id} (${set}, run ${goal.run.split("/").at(-1)})`);
      }
    }
  });
});
