import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type ScoreFile, scorePath } from "harness/score.ts";

const ROOT = join(import.meta.dir, "..");
const GOALS = join(ROOT, "corpus", "goals");
const COPIES = join(ROOT, "corpus", "experiments", "glm-default");
const TRAVEL_COPIES = join(ROOT, "corpus", "experiments", "world-prose-travel");

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

describe("W9: the world-prose-travel experiment's goal files are byte copies of corpus/goals", () => {
  for (const set of ["knowledge", "blind-1", "blind-2", "blind-2-spent"]) {
    test(`${set}.json: the copy's sha256 equals its corpus/goals original's`, () => {
      expect(sha256(join(TRAVEL_COPIES, `${set}.json`))).toBe(sha256(join(GOALS, `${set}.json`)));
    });
  }
});

describe("V13: the four sets re-run from byte copies under npc-values, each score and loss on record", () => {
  const VALUES_COPIES = join(ROOT, "corpus", "experiments", "npc-values");
  const BEFORE = join(ROOT, "corpus", "experiments", "npc-encounters");
  const SETS = ["knowledge", "blind-1", "blind-2", "blind-2-spent"];
  const scoreAt = (path: string) => JSON.parse(readFileSync(path, "utf8")) as ScoreFile;
  /** The first run's four sets, before the page split, as their score files recorded them. */
  const FIRST_RUN = { held: "37 of 44", costUsd: 0.069152374 };

  test("each copy is its original's bytes, its score and page sit beside it, and real-runs.md reports both runs", () => {
    const reportPath = join(ROOT, "docs", "work", "npc-values", "real-runs.md");
    expect({ report: existsSync(reportPath) }).toEqual({ report: true });
    const report = readFileSync(reportPath, "utf8");
    let total = 0;
    for (const set of SETS) {
      const copy = join(VALUES_COPIES, `${set}.json`);
      expect({ set, copy: existsSync(copy) }).toEqual({ set, copy: true });
      expect(sha256(copy)).toBe(sha256(join(GOALS, `${set}.json`)));
      const path = scorePath(copy, set, undefined);
      expect({ set, score: existsSync(path) }).toEqual({ set, score: true });
      const score = scoreAt(path);
      expect([score.set, score.model, score.request]).toEqual([
        set,
        "z-ai/glm-5.3-flash",
        "json-object-z-ai-retry",
      ]);
      // The page the set's player read covers every loop its goals ran.
      expect(score.page?.loops).toBe(score.perGoal.reduce((sum, g) => sum + g.loops, 0));
      const before = scoreAt(scorePath(join(BEFORE, `${set}.json`), set, undefined));
      const row = [
        set,
        `${score.reached.held} of ${score.reached.of}`,
        `${before.reached.held} of ${before.reached.of}`,
        score.costUsd.toFixed(6),
        before.costUsd.toFixed(6),
        `${score.page.meanChars} / ${score.page.maxChars}`,
      ];
      expect(report).toContain(`| ${row.join(" | ")} |`);
      for (const goal of score.perGoal.filter((g) => !g.held)) {
        expect(report).toContain(`- ${goal.id} (${set}, run ${goal.run.split("/").at(-1)})`);
      }
      total += score.costUsd;
    }
    // The re-run stays within its further $0.10, and the report gives every spend.
    expect(total).toBeLessThanOrEqual(0.1);
    const probe = readFileSync(join(VALUES_COPIES, "probe.txt"), "utf8");
    const probeCost = Number(/^costUsd: (\S+)$/m.exec(probe)?.[1]);
    expect(Number.isFinite(probeCost)).toBe(true);
    expect(report).toContain(`first run: held ${FIRST_RUN.held}`);
    expect(report).toContain(`re-run costUsd: ${total.toFixed(6)}`);
    expect(report).toContain(`total spend: ${(probeCost + FIRST_RUN.costUsd + total).toFixed(6)}`);
  });

  test("no file under corpus/goals differs from the committed tree", () => {
    const diff = Bun.spawnSync(["git", "diff", "--stat", "--", "corpus/goals"], { cwd: ROOT });
    expect(diff.exitCode).toBe(0);
    expect(diff.stdout.toString()).toBe("");
  });
});
