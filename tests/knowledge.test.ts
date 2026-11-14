import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { goalFileSchema, type ScoreFile, scorePath } from "harness/score.ts";
import { loadWorld } from "../src/engine/definitions.ts";
import { boot, type Engine, eventOf } from "../src/engine/engine.ts";
import type { WorldEvent } from "../src/engine/events.ts";
import { initialKnown, type KnowledgeView } from "../src/engine/knowledge.ts";
import { Store } from "../src/engine/store.ts";
import { initialRows } from "../src/engine/things.ts";

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");
const PEOPLE = ["glitch", "mux", "rogue"];

const temps: string[] = [];
const closers: { close(): void }[] = [];
afterAll(() => {
  for (const open of closers) open.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "strata-knowledge-"));
  temps.push(dir);
  return dir;
}

function fresh(): Engine {
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(tempDir(), "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  closers.push(booted.engine);
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
function muxToBar(engine: Engine): WorldEvent {
  act(engine, { actor: "mux", verb: "depart", exit: "west" });
  return stepTo(engine, "physical.arrive");
}

type Row = KnowledgeView["history"][number];

const PLACES = ["back-room", "chrome-cassette"].map(
  (room): Row => ({
    kind: "place",
    thing: room,
    value: null,
    tick: 0,
    source: "authored",
    subkind: null,
  }),
);

const bar = { room: "chrome-cassette" };

/** A history row taught by `event`. */
function taught(event: WorldEvent, kind: Row["kind"], thing: string, value: unknown): Row {
  return { kind, thing, value, tick: event.tick, source: event.id, subkind: event.subkind } as Row;
}

/** The rows of `person`'s history that `event` taught. */
function from(engine: Engine, person: string, event: WorldEvent) {
  return engine.knowledge(person).history.filter((row) => row.source === event.id);
}

describe("K1: a fresh boot knows its authored places and ties, and nothing located or held", () => {
  test("each person's facts are its two places, its people its tie targets, its own parts its world's", () => {
    const engine = fresh();
    const ties: Record<string, string> = { glitch: "rogue", mux: "glitch", rogue: "glitch" };
    const located: Record<string, string> = {
      glitch: "chrome-cassette",
      mux: "back-room",
      rogue: "chrome-cassette",
    };
    const held: Record<string, string[]> = {
      glitch: ["stimpak"],
      mux: ["charge-cell"],
      rogue: ["data-shard"],
    };
    for (const person of PEOPLE) {
      const view = engine.knowledge(person);
      expect(view.person).toBe(person);
      expect(view.facts).toEqual(PLACES.map((row) => ({ ...row, now: null, stale: false })));
      expect(view.history).toEqual(PLACES);
      expect(view.people).toEqual([
        { person: ties[person], tick: 0, source: "authored", subkind: null },
      ]);
      expect(view.own).toEqual({ location: { room: located[person] }, holdings: held[person] });
    }
  });

  test("a place naming no room refuses boot naming people/mux.json, places.0 and place-names-room", () => {
    const dir = tempDir();
    const world = join(dir, "world");
    cpSync(WORLD, world, { recursive: true });
    const file = join(world, "people", "mux.json");
    expect(existsSync(file)).toBe(true);
    const mux = JSON.parse(readFileSync(file, "utf8"));
    expect(mux.places).toEqual(["back-room", "chrome-cassette"]);
    writeFileSync(file, JSON.stringify({ ...mux, places: ["nowhere"] }));
    const dbPath = join(dir, "world.sqlite");
    const booted = boot(world, { tickMinutes: 10, dbPath });
    expect(booted.ok).toBe(false);
    if (booted.ok) return;
    expect(booted.refusal).toMatchObject({ file, path: "places.0", rule: "place-names-room" });
    expect(existsSync(dbPath)).toBe(false);
  });
});

describe("K2: each subkind teaches what its registry entry declares, from the witness's copy", () => {
  test("a whisper teaches a bystander both rooms and no words; every witness's history is exact", () => {
    const engine = fresh();
    const arrive = muxToBar(engine);
    const whisper = act(engine, {
      actor: "rogue",
      verb: "whisper",
      target: "glitch",
      words: "psst",
    });
    expect(engine.received("mux").find((copy) => copy.id === whisper.id)?.payload).toEqual({});
    expect(engine.knowledge("mux").history).toEqual([
      ...PLACES,
      taught(arrive, "location", "glitch", bar),
      taught(arrive, "location", "rogue", bar),
      taught(whisper, "location", "rogue", bar),
      taught(whisper, "location", "glitch", bar),
    ]);
    expect(engine.knowledge("glitch").history).toEqual([
      ...PLACES,
      taught(arrive, "location", "mux", bar),
      taught(whisper, "location", "rogue", bar),
    ]);
    expect(engine.knowledge("rogue").history).toEqual([
      ...PLACES,
      taught(arrive, "location", "mux", bar),
      taught(whisper, "location", "glitch", bar),
    ]);
  });

  test("a refuse after the giver left teaches the refuser's room and the holder, never the giver's room", () => {
    const engine = fresh();
    act(engine, { actor: "glitch", verb: "offer", target: "rogue", item: "stimpak" });
    act(engine, { actor: "glitch", verb: "depart", exit: "east" });
    const refuse = act(engine, { actor: "rogue", verb: "refuse", item: "stimpak" });
    expect(from(engine, "rogue", refuse)).toEqual([taught(refuse, "holder", "stimpak", "glitch")]);
    expect(from(engine, "glitch", refuse)).toEqual([taught(refuse, "location", "rogue", bar)]);
    expect(from(engine, "mux", refuse)).toEqual([]);
  });

  test("a lapse after the giver left teaches whoever holds its copy the holder and no location", () => {
    const engine = fresh();
    muxToBar(engine);
    const offer = act(engine, {
      actor: "mux",
      verb: "offer",
      target: "glitch",
      item: "charge-cell",
    });
    act(engine, { actor: "mux", verb: "depart", exit: "east" });
    stepTo(engine, "physical.arrive");
    const lapse = stepTo(engine, "exchange.lapse");
    expect(PEOPLE.filter((p) => engine.received(p).some((c) => c.id === lapse.id))).toEqual(PEOPLE);
    // Read at tick 3, the offer's rows are still as of the offer's tick 1.
    expect([offer.tick, lapse.tick, engine.snapshot().tick]).toEqual([1, 3, 3]);
    expect(from(engine, "glitch", offer)).toEqual([
      taught(offer, "location", "mux", bar),
      taught(offer, "holder", "charge-cell", "mux"),
    ]);
    expect(from(engine, "glitch", lapse)).toEqual([taught(lapse, "holder", "charge-cell", "mux")]);
    expect(from(engine, "rogue", lapse)).toEqual([taught(lapse, "holder", "charge-cell", "mux")]);
    expect(from(engine, "mux", lapse)).toEqual([]);
  });

  test("say teaches the speaker's room; say-to the speaker's and the target's", () => {
    const engine = fresh();
    const say = act(engine, { actor: "glitch", verb: "say", words: "hey" });
    expect(from(engine, "rogue", say)).toEqual([taught(say, "location", "glitch", bar)]);
    expect(from(engine, "glitch", say)).toEqual([]);
    const sayTo = act(engine, { actor: "rogue", verb: "say-to", target: "glitch", words: "hey" });
    expect(from(engine, "glitch", sayTo)).toEqual([taught(sayTo, "location", "rogue", bar)]);
    expect(from(engine, "rogue", sayTo)).toEqual([taught(sayTo, "location", "glitch", bar)]);
    expect(from(engine, "mux", say)).toEqual([]);
  });

  test("an offer then an accept teach both rooms and the holder, each as of its own event", () => {
    const engine = fresh();
    const offer = act(engine, {
      actor: "rogue",
      verb: "offer",
      target: "glitch",
      item: "data-shard",
    });
    const accept = act(engine, { actor: "glitch", verb: "accept", item: "data-shard" });
    expect(from(engine, "glitch", offer)).toEqual([
      taught(offer, "location", "rogue", bar),
      taught(offer, "holder", "data-shard", "rogue"),
    ]);
    expect(from(engine, "rogue", offer)).toEqual([taught(offer, "location", "glitch", bar)]);
    expect(from(engine, "rogue", accept)).toEqual([
      taught(accept, "location", "glitch", bar),
      taught(accept, "holder", "data-shard", "glitch"),
    ]);
    expect(from(engine, "glitch", accept)).toEqual([taught(accept, "location", "rogue", bar)]);
  });
});

describe("K3: an arriver learns who is already in the room, from its own copy alone", () => {
  test("mux's arrive carries present, teaches mux both rooms, and the bystanders' copies drop it", () => {
    const engine = fresh();
    act(engine, { actor: "mux", verb: "depart", exit: "west" });
    expect(engine.snapshot().schedule.map((entry) => entry.payload)).toEqual([
      { from: "back-room", to: "chrome-cassette" },
    ]);
    const arrive = stepTo(engine, "physical.arrive");
    expect(arrive.payload).toEqual({
      from: "back-room",
      to: "chrome-cassette",
      present: ["glitch", "rogue"],
    });
    expect(from(engine, "mux", arrive)).toEqual([
      taught(arrive, "location", "glitch", bar),
      taught(arrive, "location", "rogue", bar),
    ]);
    for (const bystander of ["glitch", "rogue"]) {
      const copy = engine.received(bystander).find((c) => c.id === arrive.id);
      expect(copy?.payload).toEqual({ from: "back-room", to: "chrome-cassette" });
      expect(from(engine, bystander, arrive)).toEqual([taught(arrive, "location", "mux", bar)]);
    }
  });

  test("of two arrivals into one room at one tick, the second's present names the first mover", () => {
    const engine = fresh();
    act(engine, { actor: "glitch", verb: "depart", exit: "east" });
    act(engine, { actor: "rogue", verb: "depart", exit: "east" });
    const arrives = engine.step().filter((event) => event.subkind === "physical.arrive");
    expect(arrives.map((event) => [event.actor, event.tick, event.payload])).toEqual([
      ["glitch", 1, { from: "chrome-cassette", to: "back-room", present: ["mux"] }],
      ["rogue", 1, { from: "chrome-cassette", to: "back-room", present: ["glitch", "mux"] }],
    ]);
  });

  test("an arrive into a room emptied before it lands has present empty", () => {
    const engine = fresh();
    act(engine, { actor: "mux", verb: "depart", exit: "west" });
    act(engine, { actor: "rogue", verb: "depart", exit: "east" });
    act(engine, { actor: "glitch", verb: "depart", exit: "east" });
    const arrive = stepTo(engine, "physical.arrive");
    expect([arrive.actor, arrive.payload]).toEqual([
      "mux",
      { from: "back-room", to: "chrome-cassette", present: [] },
    ]);
    expect(from(engine, "mux", arrive)).toEqual([]);
  });
});

describe("K4: knowledge holds nothing a person's own parts own", () => {
  test("no row of a person's own location or of an item it holds, and held items hidden at read", () => {
    const engine = fresh();
    const offer = act(engine, {
      actor: "rogue",
      verb: "offer",
      target: "glitch",
      item: "data-shard",
    });
    act(engine, { actor: "glitch", verb: "accept", item: "data-shard" });
    muxToBar(engine);
    const glitch = engine.knowledge("glitch");
    const shard = glitch.history.filter((r) => r.kind === "holder" && r.thing === "data-shard");
    expect(shard).toEqual([taught(offer, "holder", "data-shard", "rogue")]);
    expect(glitch.history.filter((r) => r.kind === "holder" && r.value === "glitch")).toEqual([]);
    expect(glitch.facts.filter((f) => f.kind === "holder" && f.thing === "data-shard")).toEqual([]);
    expect(glitch.own.holdings).toEqual(["data-shard", "stimpak"]);
    for (const person of PEOPLE) {
      const own = engine.knowledge(person).history.filter((r) => r.kind === "location");
      expect(own.filter((r) => r.thing === person)).toEqual([]);
    }
    expect(engine.knowledge("mux").history.some((r) => r.kind === "location")).toBe(true);
  });
});

describe("K5: the latest fact per subject, every earlier one kept, rows only ever appended", () => {
  test("a newer fact is the latest, the older stays in history, and it goes stale out of sight", () => {
    const engine = fresh();
    const say = act(engine, { actor: "glitch", verb: "say", words: "hey" });
    const depart = act(engine, { actor: "glitch", verb: "depart", exit: "east" });
    const transit = { transit: { from: "chrome-cassette", to: "back-room", arrivesAt: 1 } };
    const aboutGlitch = () =>
      engine.knowledge("rogue").facts.filter((f) => f.kind === "location" && f.thing === "glitch");
    expect(aboutGlitch()).toEqual([
      { ...taught(depart, "location", "glitch", transit), now: transit, stale: false },
    ]);
    expect(
      engine
        .knowledge("rogue")
        .history.filter((r) => r.kind === "location" && r.thing === "glitch"),
    ).toEqual([
      taught(say, "location", "glitch", bar),
      taught(depart, "location", "glitch", transit),
    ]);

    stepTo(engine, "physical.arrive");
    expect(aboutGlitch()).toEqual([
      {
        ...taught(depart, "location", "glitch", transit),
        now: { room: "back-room" },
        stale: true,
      },
    ]);

    const before = PEOPLE.map((person) => JSON.stringify(engine.knowledge(person).history));
    expect(engine.act({ actor: "mux", verb: "offer", target: "rogue", item: "stimpak" })).toEqual({
      outcome: "refused",
      refused: expect.objectContaining({ code: "not-holding" }),
    });
    expect(engine.act({ actor: "mux", verb: "fly" }).outcome).toBe("invalid");
    expect(PEOPLE.map((person) => JSON.stringify(engine.knowledge(person).history))).toEqual(
      before,
    );
  });

  test("the store refuses a taught row naming an event its witness holds no copy of", () => {
    const loaded = loadWorld(WORLD);
    if (!loaded.ok) throw new Error(loaded.refusal.message);
    const store = Store.create(
      join(tempDir(), "world.sqlite"),
      initialRows(loaded.defs),
      initialKnown(loaded.defs),
    );
    closers.push(store);
    const event = eventOf(
      {
        subkind: "speech.say",
        tick: 0,
        actor: "glitch",
        targets: [],
        place: "back-room",
        cause: "operator",
        payload: { words: "hey" },
      },
      1,
    );
    store.appendEvent(event);
    store.witness(event.id, "mux", { ...event, payload: { words: "hey" } });
    const row = {
      kind: "location" as const,
      thing: "glitch",
      value: { room: "back-room" },
      tick: 0,
      event: event.id,
    };
    store.know({ ...row, witness: "mux" });
    expect(() => store.know({ ...row, witness: "rogue" })).toThrow("FOREIGN KEY constraint failed");
    expect(store.known("rogue").filter((r) => r.event !== null)).toEqual([]);
  });

  test("no statement in store.ts updates or deletes a known row", () => {
    const source = readFileSync(join(ROOT, "src", "engine", "store.ts"), "utf8");
    expect(source).toMatch(/INSERT INTO known/);
    expect(source).not.toMatch(/UPDATE\s+known|DELETE\s+FROM\s+known|REPLACE\s+INTO\s+known/i);
  });
});

describe("K13: the knowledge goal set and the default model's scores, each held and cost on record", () => {
  const GOALS = join(ROOT, "corpus", "goals");
  const SETS = ["knowledge", "blind-1", "blind-2", "blind-2-spent"];

  test("knowledge.json holds the design's six goals, author the npc-knowledge shaper", () => {
    const path = join(GOALS, "knowledge.json");
    const file = goalFileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    expect(file.author).toBe("claude-opus-5-5 (npc-knowledge shaper)");
    expect(file.goals.map((goal) => [goal.id, goal.expect])).toEqual([
      ["mux-finds-rogue", { knows: { person: "mux", location: "rogue" } }],
      ["rogue-finds-mux", { knows: { person: "rogue", location: "mux" } }],
      ["glitch-finds-cell", { knows: { person: "glitch", holder: "charge-cell" } }],
      ["mux-sees-glitch", { knows: { person: "mux", location: "glitch" } }],
      ["mux-finds-shard", { knows: { person: "mux", holder: "data-shard" } }],
      ["rogue-reads-glitch", { outcome: "no-such-action" }],
    ]);
  });

  test("each set's score sits at the default request's new path, and real-runs.md reports it", () => {
    const report = readFileSync(
      join(ROOT, "docs", "work", "npc-knowledge", "real-runs.md"),
      "utf8",
    );
    for (const set of SETS) {
      const path = scorePath(join(GOALS, `${set}.json`), set, undefined);
      expect(path).toBe(join(GOALS, `${set}.z-ai_glm-5.3-flash.json-object-z-ai-retry.score.json`));
      const score = JSON.parse(readFileSync(path, "utf8")) as ScoreFile;
      expect([score.set, score.model, score.request]).toEqual([
        set,
        "z-ai/glm-5.3-flash",
        "json-object-z-ai-retry",
      ]);
      const { held, of } = score.reached;
      expect(report).toContain(`| ${set} | ${held} of ${of} | ${score.costUsd.toFixed(6)} |`);
      for (const goal of score.perGoal.filter((g) => !g.held)) expect(report).toContain(goal.id);
    }
  });
});
