import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { loadWorld, type WorldDefs } from "../src/engine/definitions.ts";

const ROOT = join(import.meta.dir, "..");
const WORLDS = join(import.meta.dir, "worlds");

/** Every committed world: world/ and each directory under tests/worlds/. */
function committedWorlds(): string[] {
  const fixtures = readdirSync(WORLDS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(WORLDS, entry.name));
  return [join(ROOT, "world"), ...fixtures];
}

/** A typed word of a world, and the room, person or item it names (none for an exit key). */
type Typed = { word: string; of: string | null };

/** Every exit key, and each room's, person's and item's id, id with hyphens as spaces, and name. */
function typedWords(defs: WorldDefs): Typed[] {
  const exits = defs.rooms.flatMap((room) => Object.keys(room.exits));
  const things = [...defs.rooms, ...defs.people, ...defs.items];
  return [
    ...exits.map((word) => ({ word, of: null })),
    ...things.flatMap((thing) =>
      [thing.id, thing.id.replaceAll("-", " "), thing.name].map((word) => ({ word, of: thing.id })),
    ),
  ];
}

/** Whether `text` holds `word` as a whole word, ignoring case. */
function names(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<!\\w)${escaped}(?!\\w)`, "i").test(text);
}

/** A described room or item: its label, its id and its description. */
type Described = { thing: string; id: string; description: string };

/** Every room and item description of a world. */
function describedThings(defs: WorldDefs): Described[] {
  return [
    ...defs.rooms.map(({ id, description }) => ({ thing: `room ${id}`, id, description })),
    ...defs.items.map(({ id, description }) => ({ thing: `item ${id}`, id, description })),
  ];
}

/** A description that names one of its world's typed words. */
type Named = { world: string; thing: string; description: string; word: string };

/** Every typed word of a world that a description of a thing other than its own holds. */
function namedIn(world: string, defs: WorldDefs): Named[] {
  const typed = typedWords(defs);
  return describedThings(defs).flatMap(({ thing, id, description }) => {
    const words = new Set(typed.filter((t) => t.of !== id).map((t) => t.word.toLowerCase()));
    return [...words]
      .filter((word) => names(description, word))
      .map((word) => ({ world, thing, description, word }));
  });
}

describe("W1: no description in a committed world names an exit key or another thing", () => {
  test("every room and item description in world/ and tests/worlds/ is free of the world's typed words", () => {
    const read: string[] = [];
    const named: Named[] = [];
    for (const dir of committedWorlds()) {
      const loaded = loadWorld(dir);
      if (!loaded.ok) throw new Error(loaded.refusal.message);
      const world = relative(ROOT, dir);
      read.push(world);
      named.push(...namedIn(world, loaded.defs));
    }
    expect(read).toContain("world");
    expect(read).toContain(join("tests", "worlds", "two-tick"));
    expect(named).toEqual([]);
  });
});
