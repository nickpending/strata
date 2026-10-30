import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { boot, type Engine } from "../src/engine/engine.ts";
import type { Copy, WorldEvent } from "../src/engine/events.ts";

const WORLD = join(import.meta.dir, "..", "world");

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function fresh(): Engine {
  const dir = mkdtempSync(join(tmpdir(), "strata-speech-"));
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

/** Each person's copy of `event`, read back through the engine's received view. */
function copies(engine: Engine, event: WorldEvent): Record<string, Copy> {
  const held: Record<string, Copy> = {};
  for (const person of engine.defs.people) {
    const copy = engine.received(person.id).find((c) => c.id === event.id);
    if (copy !== undefined) held[person.id] = copy;
  }
  return held;
}

describe("C6: a whisper's words reach only its participants", () => {
  test("Mux holds the whisper's envelope without its words; the say reaches all three", () => {
    const engine = fresh();
    const depart = recorded(engine, { actor: "mux", verb: "depart", exit: "west" });
    const { travelTicks } = depart.payload as { travelTicks: number };
    for (let i = 0; i < travelTicks; i++) engine.step();
    const room = engine.snapshot().views.presence["chrome-cassette"];
    expect(room).toEqual(["glitch", "mux", "rogue"]);

    const words = "the shard is hot";
    const whisper = recorded(engine, { actor: "rogue", verb: "whisper", target: "glitch", words });
    const whispered = copies(engine, whisper);
    expect(Object.keys(whispered).sort()).toEqual(room ?? []);
    expect(whispered.rogue?.payload).toEqual({ words });
    expect(whispered.glitch?.payload).toEqual({ words });
    const overheard = whispered.mux;
    expect(overheard).toMatchObject({
      id: whisper.id,
      seq: whisper.seq,
      tick: whisper.tick,
      subkind: "speech.whisper",
      actor: "rogue",
      targets: ["glitch"],
      place: "chrome-cassette",
      cause: "operator",
    });
    expect(overheard?.payload).toEqual({});
    expect(overheard?.payload).not.toHaveProperty("words");
    for (const person of engine.defs.people) {
      if (!room?.includes(person.id)) expect(whispered[person.id]).toBeUndefined();
    }

    const aloud = "drinks are on me";
    const say = recorded(engine, { actor: "rogue", verb: "say", words: aloud });
    const heard = copies(engine, say);
    expect(Object.keys(heard).sort()).toEqual(["glitch", "mux", "rogue"]);
    for (const copy of Object.values(heard)) expect(copy.payload).toEqual({ words: aloud });
  });
});
