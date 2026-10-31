import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { INHERITED_KEYS, randomAction, WORDS } from "../src/driver/actions.ts";
import { seeded } from "../src/driver/rng.ts";
import { boot, type Engine } from "../src/engine/engine.ts";
import { fieldIds, verbs } from "../src/engine/rules.ts";
import type { Snapshot } from "../src/engine/snapshot.ts";

const WORLD = join(import.meta.dir, "..", "world");

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function bootedSnapshot(): Snapshot {
  const dir = mkdtempSync(join(tmpdir(), "strata-actions-"));
  temps.push(dir);
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine.snapshot();
}

function draw(snapshot: Snapshot, seed: number, count: number): Record<string, unknown>[] {
  const rng = seeded(seed);
  return Array.from({ length: count }, () => randomAction(snapshot, verbs(), rng));
}

/** Names an operator could type that are keys every object inherits. */
const INHERITED = new Set(Object.getOwnPropertyNames(Object.prototype));

describe("C4: random actions", () => {
  test("seed 3's 400 cover a non-person actor, an inherited key, an empty field and every verb", () => {
    const snapshot = bootedSnapshot();
    const actions = draw(snapshot, 3, 400);
    expect(actions).toHaveLength(400);
    expect(actions.some((a) => !Object.hasOwn(snapshot.people, String(a.actor)))).toBe(true);
    expect(
      actions.some((a) =>
        ["exit", "item", "target"].some((field) => INHERITED.has(String(a[field]))),
      ),
    ).toBe(true);
    expect(actions.some((a) => Object.entries(a).some(([k, v]) => k !== "verb" && v === ""))).toBe(
      true,
    );
    const drawn = new Set(actions.map((a) => a.verb));
    for (const { verb } of verbs()) expect(drawn).toContain(verb);
  });

  test("two draws of 50 with seed 11 are identical, and another seed differs", () => {
    const snapshot = bootedSnapshot();
    const first = draw(snapshot, 11, 50);
    expect(draw(snapshot, 11, 50)).toEqual(first);
    expect(draw(snapshot, 12, 50)).not.toEqual(first);
  });

  test("the generator yields the same sequence for a seed, in [0, 1)", () => {
    const a = seeded(5);
    const b = seeded(5);
    const xs = Array.from({ length: 100 }, () => a.next());
    expect(Array.from({ length: 100 }, () => b.next())).toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(new Set(xs).size).toBeGreaterThan(95);
  });
});

describe("C17: the ids a verb's field ranges over have one home, read by the driver", () => {
  test("fieldIds gives exit, target and item their ids, and words none", () => {
    const snapshot = bootedSnapshot();
    expect(fieldIds("exit", snapshot)?.sort()).toEqual(["east", "west"]);
    expect(fieldIds("target", snapshot)).toEqual(["glitch", "mux", "rogue"]);
    expect(fieldIds("item", snapshot)).toEqual(["charge-cell", "data-shard", "stimpak"]);
    expect(fieldIds("words", snapshot)).toBeNull();
  });

  test("every value seed 3's 400 draw is one of the snapshot's ids for its field, a words line, or an odd draw", () => {
    const snapshot = bootedSnapshot();
    // The snapshot's ids for each field, read here from the snapshot itself.
    const ids: Record<string, string[]> = {
      exit: Object.values(snapshot.rooms).flatMap((room) => Object.keys(room.exits)),
      target: Object.keys(snapshot.people),
      item: Object.keys(snapshot.items),
      words: [...WORDS],
    };
    const odd = new Set(["", ...INHERITED_KEYS]);
    const strays: string[] = [];
    for (const action of draw(snapshot, 3, 400)) {
      const { verb } = action;
      for (const field of verbs().find((v) => v.verb === verb)?.fields ?? []) {
        const value = action[field];
        if (value === undefined || odd.has(String(value))) continue;
        if (!(ids[field] ?? []).includes(String(value))) strays.push(`${field} ${String(value)}`);
      }
    }
    expect(strays).toEqual([]);
  });

  test("draws of 50 with seed 11 are identical twice", () => {
    const snapshot = bootedSnapshot();
    expect(draw(snapshot, 11, 50)).toEqual(draw(snapshot, 11, 50));
  });
});
