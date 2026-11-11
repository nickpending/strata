import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RULE_AUTHOR, T_ACT, T_DONE } from "harness/rule.ts";
import { type GoalFile, GRID, type ScoreFile } from "harness/score.ts";

const GOALS = join(import.meta.dir, "..", "corpus", "goals");

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
    // The calibration was swept over T_DONE as well; the sweep now holds T_DONE at the pair's value
    // and tries the same T_ACT values.
    expect(scored.sweep?.grid.done).toContain(T_DONE);
    expect(scored.sweep?.grid.act).toEqual(GRID.act);
    expect(GRID.done).toEqual([T_DONE]);
    expect({ done: T_DONE, act: T_ACT }).toEqual({
      done: scored.sweep?.best.done ?? Number.NaN,
      act: scored.sweep?.best.act ?? Number.NaN,
    });
    const most = Math.max(...(scored.sweep?.results ?? []).map((r) => r.held));
    expect(scored.sweep?.best.held).toBe(most);
  });

  test("the score holds reached, loops and cost per goal, summed as its entries record them", () => {
    expect(scored.set).toBe(goals.set);
    expect(scored.reached.of).toBe(goals.goals.length);
    expect(scored.reached.held).toBe(scored.perGoal.filter((g) => g.held).length);
    expect(scored.perGoal.map((g) => g.id)).toEqual(goals.goals.map((g) => g.id));
    for (const goal of scored.perGoal) {
      expect(Number.isInteger(goal.loops)).toBe(true);
      expect(goal.costUsd).toBeGreaterThan(0);
      // Run directories stay local (corpus/runs is untracked, ember#250), so the score file stands alone.
      expect(goal.benchFailures).toEqual([]);
    }
    expect(scored.unreportedCosts).toBe(
      scored.perGoal.reduce((sum, g) => sum + g.unreportedCosts, 0),
    );
  });
});
