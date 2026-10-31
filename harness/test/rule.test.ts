import { describe, expect, test } from "bun:test";
import type { Event } from "../src/bench.ts";
import type { Control } from "../src/page.ts";
import {
  advanced,
  choose,
  decideLoop,
  type Goal,
  nextMove,
  PLAN_START,
  PRESS_ACT,
  PRESS_STEP,
  type Scored,
  type Seen,
} from "../src/rule.ts";
import { CONTROLS, OFFER, VERBS } from "./fixtures.ts";

const THRESHOLDS = { done: 0.6, act: 0.3 };

function scored(...descriptions: [string, number][]): Scored[] {
  return descriptions.map(([description, score], i) => ({ key: `c${i}`, description, score }));
}

function event(actor: string, id: string): Event {
  return { id, seq: 1, subkind: "trade.hand", kind: "trade", actor, targets: [], payload: {} };
}

const LAMP_TO_BO: Goal = {
  instruction: "have Ada hand Bo the lamp",
  target: { kind: "goal", expect: { holder: { item: "lamp", person: "bo" } }, steps: [] },
  words: null,
  verbs: VERBS,
};

const SEEN: Seen = { held: false, pending: [], controls: CONTROLS, plan: PLAN_START };

describe("choose: the highest-scored candidate at or above T_ACT", () => {
  test("the best candidate acts, the first of a tie, and below the threshold the run is stuck", () => {
    const options = scored(["press Act", 0.4], ["press Step", 0.7], ["set actor to bo", 0.7]);
    expect(choose(0.1, options, THRESHOLDS)).toEqual({
      kind: "act",
      done: 0.1,
      chosen: { key: "c1", description: "press Step", score: 0.7 },
    });
    const low = scored(["press Act", 0.2]);
    expect(choose(0.1, low, THRESHOLDS)).toEqual({
      kind: "stuck",
      done: 0.1,
      best: { key: "c0", description: "press Act", score: 0.2 },
    });
  });
});

describe("nextMove: the form move toward an action", () => {
  test("actor, then verb, then each field, then the words, then Act", () => {
    const action = { actor: "bo", verb: "walk", exit: "north" };
    expect(nextMove(action, CONTROLS, null)).toBe("set actor to bo");
    expect(nextMove({ ...action, actor: "ada" }, CONTROLS, null)).toBe(PRESS_ACT);
    expect(nextMove({ actor: "ada", verb: "take", item: "lamp" }, CONTROLS, null)).toBe(
      "set verb to take",
    );
  });
});

describe("advanced: a press Act the plan led to moves it on, or ends it", () => {
  const steps = [{ actor: "ada", verb: "hand", fields: { target: "bo", item: "lamp" } }];

  test("an event by the step's actor performs the step; none ends the plan", () => {
    expect(advanced(PLAN_START, steps, [event("ada", "e3")])).toEqual({
      next: 1,
      ended: false,
      opened: "e3",
    });
    expect(advanced(PLAN_START, steps, [event("bo", "e3")])).toEqual({
      ...PLAN_START,
      ended: true,
    });
  });
});

describe("decideLoop: the rule's order over one loop", () => {
  test("reached when the end state holds, whatever Jev answered", () => {
    expect(
      decideLoop(LAMP_TO_BO, { ...SEEN, held: true }, { done: 0, scored: [] }, THRESHOLDS),
    ).toEqual({ kind: "reached", done: 0 });
  });

  test("a pending state whose resolution leaves the end state is resolved by its next move", () => {
    const options = scored(["set actor to bo", 0.1], [PRESS_STEP, 0.9]);
    const decision = decideLoop(
      LAMP_TO_BO,
      { ...SEEN, pending: [OFFER] },
      { done: 0, scored: options },
      THRESHOLDS,
    );
    expect(decision).toEqual({
      kind: "resolve",
      done: 0,
      pending: { event: "e1", subkind: "trade.hand" },
      chosen: { key: "c0", description: "set actor to bo", score: 0.1 },
    });
  });

  test("a plan's step is filled by the fields its served verb takes", () => {
    // ada sings to bo: the served sing takes a target and words, so after actor and verb the
    // target is set; served without a target, the words are typed straight after the verb.
    const sings: Goal = {
      ...LAMP_TO_BO,
      words: "la",
      target: {
        ...LAMP_TO_BO.target,
        steps: [{ actor: "ada", verb: "sing", fields: { target: "bo" } }],
      },
    };
    const field = { enabled: true, html: "" };
    const controls: Control[] = [
      {
        ...field,
        id: 0,
        kind: "select",
        role: "combobox",
        label: "actor",
        value: "ada",
        options: [],
      },
      {
        ...field,
        id: 1,
        kind: "select",
        role: "combobox",
        label: "verb",
        value: "sing",
        options: [],
      },
      {
        ...field,
        id: 2,
        kind: "select",
        role: "combobox",
        label: "target",
        value: "ada",
        options: [],
      },
      { ...field, id: 3, kind: "input", role: "textbox", label: "words", value: "", options: [] },
    ];
    const options = scored(["set target to bo", 0], ["type the words into words", 0]);
    const seen = { ...SEEN, controls };
    expect(decideLoop(sings, seen, { done: 0, scored: options }, THRESHOLDS)).toMatchObject({
      kind: "plan",
      step: 0,
      chosen: { description: "set target to bo" },
    });
    const wordsOnly: Goal = { ...sings, verbs: [{ verb: "sing", fields: ["words"] }] };
    expect(decideLoop(wordsOnly, seen, { done: 0, scored: options }, THRESHOLDS)).toMatchObject({
      kind: "plan",
      step: 0,
      chosen: { description: "type the words into words" },
    });
  });

  test("with nothing pending and no plan, choose decides", () => {
    const options = scored([PRESS_STEP, 0.5]);
    expect(decideLoop(LAMP_TO_BO, SEEN, { done: 0, scored: options }, THRESHOLDS)).toMatchObject({
      kind: "act",
      chosen: { description: PRESS_STEP },
    });
  });
});
