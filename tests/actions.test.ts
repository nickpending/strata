import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomAction } from "../src/driver/actions.ts";
import { seeded } from "../src/driver/rng.ts";
import { boot, type Engine } from "../src/engine/engine.ts";
import { verbs } from "../src/engine/rules.ts";
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
