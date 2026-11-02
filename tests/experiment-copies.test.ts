import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const GOALS = join(ROOT, "corpus", "goals");
const COPIES = join(ROOT, "corpus", "experiments", "glm-default");

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

describe("G7: the glm-default experiment's goal files are byte copies of corpus/goals", () => {
  for (const set of ["calibration", "blind-1", "blind-2-spent", "blind-2"]) {
    test(`${set}.json: the copy's sha256 equals its corpus/goals original's`, () => {
      expect(sha256(join(COPIES, `${set}.json`))).toBe(sha256(join(GOALS, `${set}.json`)));
    });
  }
});
