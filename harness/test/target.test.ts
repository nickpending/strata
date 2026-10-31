import { describe, expect, test } from "bun:test";
import {
  checked,
  type GoalTarget,
  speechKinds,
  type Target,
  vocabulary,
  writesWords,
} from "../src/target.ts";
import { PAGE, SUBKINDS, VERBS } from "./fixtures.ts";

describe("the target's names are checked against the page and what the bench serves", () => {
  test("vocabulary reads the page's verbs, people, items, rooms and exits, and the served speech kinds", () => {
    expect(vocabulary(PAGE, SUBKINDS)).toEqual({
      verbs: ["walk", "sing", "hand", "take"],
      people: ["ada", "bo"],
      items: ["lamp", "key"],
      rooms: ["yard", "hall"],
      exits: ["north", "south", "up"],
      speech: ["speech.sing", "speech.hum"],
    });
  });

  test("the speech kinds are the served subkinds whose kind is speech, in served order", () => {
    expect(speechKinds(SUBKINDS)).toEqual(["speech.sing", "speech.hum"]);
    expect(speechKinds([])).toEqual([]);
  });

  test("a speech kind the bench does not serve becomes no-such-action naming the bench", () => {
    const target: Target = {
      kind: "goal",
      expect: { said: { person: "ada", subkind: "speech.say" } },
      steps: [],
    };
    expect(checked(target, vocabulary(PAGE, SUBKINDS))).toEqual({
      kind: "no-such-action",
      reason: 'the bench serves no speech kind "speech.say" (it has: speech.sing, speech.hum)',
    });
    const served: Target = {
      ...target,
      expect: { said: { person: "ada", subkind: "speech.hum" } },
    };
    expect(checked(served, vocabulary(PAGE, SUBKINDS))).toEqual(served);
  });

  test("a name the page does not show becomes no-such-action naming the page", () => {
    const target: Target = {
      kind: "goal",
      expect: { holder: { item: "lamp", person: "bo" } },
      steps: [{ actor: "ada", verb: "hand", fields: { target: "bo", item: "torch" } }],
    };
    expect(checked(target, vocabulary(PAGE, SUBKINDS))).toEqual({
      kind: "no-such-action",
      reason: 'the page shows no item "torch" (it has: lamp, key)',
    });
  });
});

describe("whether a run writes words is read from the served verbs", () => {
  const singing: GoalTarget = {
    kind: "goal",
    expect: { location: { person: "ada", room: "hall" } },
    steps: [{ actor: "ada", verb: "sing", fields: { target: "bo" } }],
  };

  test("a step whose served verb takes words writes them; the same verb served without does not", () => {
    expect(writesWords(singing, VERBS)).toBe(true);
    expect(writesWords(singing, [{ verb: "sing", fields: ["target"] }])).toBe(false);
  });

  test("a said end state always writes words", () => {
    const said: GoalTarget = {
      kind: "goal",
      expect: { said: { person: "ada", subkind: "speech.hum" } },
      steps: [],
    };
    expect(writesWords(said, [])).toBe(true);
  });
});
