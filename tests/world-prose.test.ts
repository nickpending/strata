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

describe("W1: no description in a committed world names an exit key or another thing", () => {
  test("every room and item description in world/ and tests/worlds/ is free of the world's typed words", () => {
    const read: string[] = [];
    const named: { world: string; thing: string; description: string; word: string }[] = [];
    for (const dir of committedWorlds()) {
      const loaded = loadWorld(dir);
      if (!loaded.ok) throw new Error(loaded.refusal.message);
      const world = relative(ROOT, dir);
      read.push(world);
      const typed = typedWords(loaded.defs);
      const described = [
        ...loaded.defs.rooms.map(({ id, description }) => ({
          thing: `room ${id}`,
          id,
          description,
        })),
        ...loaded.defs.items.map(({ id, description }) => ({
          thing: `item ${id}`,
          id,
          description,
        })),
      ];
      for (const { thing, id, description } of described) {
        const words = new Set(typed.filter((t) => t.of !== id).map((t) => t.word.toLowerCase()));
        for (const word of words) {
          if (names(description, word)) named.push({ world, thing, description, word });
        }
      }
    }
    expect(read).toContain("world");
    expect(read).toContain(join("tests", "worlds", "two-tick"));
    expect(named).toEqual([]);
  });
});
