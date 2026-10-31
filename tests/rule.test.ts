import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { RULE_AUTHOR, T_ACT, T_DONE } from "../src/player/rule.ts";
import { type GoalFile, GRID, type ScoreFile } from "../src/player/score.ts";

const GOALS = join(import.meta.dir, "..", "corpus", "goals");
const RUN_FILES = ["events.jsonl", "loops.jsonl", "received.jsonl", "run.json"];

function read<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

describe("C9: the rule's constants are the calibration set's best pair", () => {
  const goals = read<GoalFile>(join(GOALS, "calibration.json"));
  const scored = read<ScoreFile>(join(GOALS, `${goals.set}.score.json`));

  test("the calibration set is the rule author's, with the goals the block needs", () => {
    expect(goals.author).toBe(RULE_AUTHOR);
    expect(goals.goals.length).toBeGreaterThanOrEqual(8);
    const said = goals.goals.flatMap((g) => ("said" in g.expect ? [g.expect.said.subkind] : []));
    expect(said).toContain("speech.say");
    expect(said).toContain("speech.whisper");
    expect(goals.goals.some((g) => "location" in g.expect)).toBe(true);
    expect(goals.goals.some((g) => "holder" in g.expect)).toBe(true);
    expect(goals.goals.some((g) => "outcome" in g.expect)).toBe(true);
  });

  test("T_DONE and T_ACT equal the pair the score file records as best", () => {
    expect(scored.sweep).toBeDefined();
    expect(scored.sweep?.grid).toEqual(GRID);
    expect({ done: T_DONE, act: T_ACT }).toEqual({
      done: scored.sweep?.best.done ?? Number.NaN,
      act: scored.sweep?.best.act ?? Number.NaN,
    });
    const most = Math.max(...(scored.sweep?.results ?? []).map((r) => r.held));
    expect(scored.sweep?.best.held).toBe(most);
  });

  test("the score holds reached, loops and cost per goal, and every run it names has its four files", () => {
    expect(scored.set).toBe(goals.set);
    expect(scored.reached.of).toBe(goals.goals.length);
    expect(scored.reached.held).toBe(scored.perGoal.filter((g) => g.held).length);
    expect(scored.perGoal.map((g) => g.id)).toEqual(goals.goals.map((g) => g.id));
    for (const goal of scored.perGoal) {
      expect(Number.isInteger(goal.loops)).toBe(true);
      expect(goal.costUsd).toBeGreaterThan(0);
      const runDir = join(dirname(join(GOALS, "x")), goal.run);
      expect(RUN_FILES.filter((file) => !existsSync(join(runDir, file)))).toEqual([]);
      const run = read<{ costUsd: number; loops: number }>(join(runDir, "run.json"));
      expect(run.costUsd).toBe(goal.costUsd);
      expect(run.loops).toBe(goal.loops);
    }
  });
});
