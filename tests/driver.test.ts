import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { DriverReport } from "../src/driver/run.ts";
import { subkinds } from "../src/engine/events.ts";
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
    [process.execPath, "run", MAIN, "--seed", "7", "--actions", "400", "--tick-minutes", "10"],
    { cwd: ROOT, stdout: "pipe", stderr: "pipe" },
  );
  return {
    exitCode: run.exitCode,
    report: JSON.parse(run.stdout.toString()) as DriverReport,
    stderr: run.stderr.toString(),
  };
}

describe("C1 and C11: a seeded driver run over the committed world", () => {
  test("seed 7, 400 actions, a step every 5: every subkind, every code, every check passed, and world/ untouched", () => {
    const before = hashTree(WORLD);
    const first = runC1();
    expect(first.report.failure ?? null).toBeNull();
    expect(first.stderr).toBe("");
    expect(first.exitCode).toBe(0);
    expect(first.report).toMatchObject({ ok: true, seed: 7, actions: 400, steps: 80 });
    const { recorded, refused } = first.report.tally;
    expect(subkinds.filter((subkind) => !((recorded[subkind] ?? 0) > 0))).toEqual([]);
    expect(Object.values(CODES).filter((code) => !((refused[code] ?? 0) > 0))).toEqual([]);
    expect(Object.keys(refused).sort()).toEqual(Object.values(CODES).sort());
    expect(first.report.tally.invalid).toBeGreaterThan(0);
    expect(first.report.checks).toEqual({ replay: 480, invariants: 480 });

    const second = runC1();
    expect(second.exitCode).toBe(0);
    expect(second.report.tally).toEqual(first.report.tally);
    expect(hashTree(WORLD)).toEqual(before);
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
