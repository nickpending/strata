import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decide, JEV_MODEL, type JevQuestion } from "../src/jev.ts";

const stops: (() => void)[] = [];
afterAll(() => {
  for (const stop of stops) stop();
});

/** A local stand-in for the decisions endpoint: it keeps each request body and answers `answer`'s. */
function standIn(answer: (n: number) => unknown): { endpoint: string; bodies: unknown[] } {
  const bodies: unknown[] = [];
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      bodies.push(await request.json());
      return Response.json(answer(bodies.length));
    },
  });
  stops.push(() => void server.stop(true));
  return { endpoint: `http://127.0.0.1:${server.port}/`, bodies };
}

const NOUL = {
  type: "noul",
  instructions: "Does `event.text` say Rogue lets Glitch stay?",
} as const;
const CHOICE = {
  type: "choice",
  instructions: "Who does `event.text` say stays?",
  criteria: { glitch: "Glitch stays", rogue: "Rogue stays" },
} as const;

describe("V8: the state is sent as given, a JSON object as an object and a string as a string", () => {
  test("an object state and then a string state, each with the model and the questions as given", async () => {
    const jev = standIn(() => ({ answers: { lets: { noul: 0.9 } }, usage: { cost: 0.0001 } }));
    const state = { event: { text: "Rogue lets Glitch stay." } };
    const questions = { lets: NOUL };
    const first = await decide(state, questions, { endpoint: jev.endpoint });
    const second = await decide("Rogue lets Glitch stay.", questions, { endpoint: jev.endpoint });
    expect([first.ok, second.ok]).toEqual([true, true]);
    expect(jev.bodies).toEqual([
      { model: JEV_MODEL, state, questions },
      { model: JEV_MODEL, state: "Rogue lets Glitch stay.", questions },
    ]);
    expect(typeof (jev.bodies[0] as { state: unknown }).state).toBe("object");
    expect(JEV_MODEL).toBe("typesafe/jev-1.13");
  });
});

/** The live body the probe saved: one noul, one choice and one three-level score, as the wire gave them. */
type Fixture = {
  answers: {
    lets: { noul: number };
    who: { choice: string; confidence: number; probabilities: Record<string, number> };
    warmth: {
      score: number;
      confidence: number;
      legend: Record<string, string>;
      probabilities: Record<string, number>;
    };
  };
  model: string;
  usage: { cost: number };
};

/** Read on each call, so a test that does not use the fixture never needs it. */
function fixture(): Fixture {
  return JSON.parse(readFileSync(join(import.meta.dir, "fixtures", "jev-score-body.json"), "utf8"));
}

/** The probe's three questions, as it asked them. */
const PROBE: Record<string, JevQuestion> = {
  lets: { type: "noul", instructions: "Does `event.text` say that Rogue lets Glitch stay?" },
  who: {
    type: "choice",
    instructions: "Who does `event.text` say is allowed to stay?",
    criteria: { glitch: "Glitch", rogue: "Rogue", nobody: "nobody" },
  },
  warmth: {
    type: "score",
    instructions: "How warmly does `event.text` describe what Rogue does for Glitch?",
    criteria: ["coldly", "neutrally", "warmly"],
  },
};
const PROBE_STATE = { event: { text: "Rogue lets Glitch stay in her bar for one more night." } };

/** decide() over the probe's questions, its endpoint serving `body`. */
async function served(body: unknown) {
  const jev = standIn(() => body);
  return decide(PROBE_STATE, PROBE, { endpoint: jev.endpoint });
}

describe("V12: the fixture is the live body the probe saved, cut to answers, model and usage", () => {
  test("its top-level keys are answers, model and usage, its answers the probe's three, and it parses", async () => {
    const body = fixture();
    expect(Object.keys(body).sort()).toEqual(["answers", "model", "usage"]);
    expect(Object.keys(body.answers).sort()).toEqual(["lets", "warmth", "who"]);
    expect(body.model).toStartWith("typesafe/jev-1.13");
    expect(typeof body.usage.cost).toBe("number");
    const parsed = await served(body);
    expect(parsed.ok).toBe(true);
  });
});

describe("V9: a score answer is returned as the wire gave it, and a malformed one is a parse refusal", () => {
  test("the fixture's noul, choice and score come back exactly as served", async () => {
    const body = fixture();
    const { lets, who, warmth } = body.answers;
    expect(await served(body)).toEqual({
      ok: true,
      answers: {
        lets: { noul: lets.noul },
        who: { choice: who.choice, confidence: who.confidence, probabilities: who.probabilities },
        warmth: {
          score: warmth.score,
          confidence: warmth.confidence,
          legend: warmth.legend,
          probabilities: warmth.probabilities,
        },
      },
      costUsd: body.usage.cost,
    });
    // The levels are keyed as the live body keys them: "0" to "2" for three levels.
    expect(Object.keys(warmth.legend).sort()).toEqual(["0", "1", "2"]);
  });

  const alterations: [string, (warmth: Record<string, unknown>) => void][] = [
    ["legend removed", (warmth) => delete warmth.legend],
    [
      "a probabilities key outside the score's levels",
      (warmth) => {
        warmth.probabilities = { ...(warmth.probabilities as object), "3": 0 };
      },
    ],
    [
      "score a string",
      (warmth) => {
        warmth.score = String(warmth.score);
      },
    ],
    ["confidence removed", (warmth) => delete warmth.confidence],
  ];
  for (const [name, alter] of alterations) {
    test(`${name}: a parse refusal naming the score question`, async () => {
      // The fixture as served parses, so the refusal below is the alteration's alone.
      expect((await served(fixture())).ok).toBe(true);
      const body = structuredClone(fixture()) as unknown as {
        answers: { warmth: Record<string, unknown> };
      };
      alter(body.answers.warmth);
      const result = await served(body);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.refusal.kind).toBe("parse");
      expect(result.refusal.message).toContain("warmth");
    });
  }
});

describe("V10: noul and choice answers parse as they did", () => {
  test("a noul is { noul }, a choice { choice, confidence, probabilities }, costUsd usage.cost or null", async () => {
    const choice = {
      choice: "glitch",
      confidence: 0.8,
      probabilities: { glitch: 0.9, rogue: 0.1 },
    };
    const jev = standIn((n) => ({
      answers: { lets: { type: "noul", noul: 0.7 }, who: { type: "choice", ...choice } },
      ...(n === 1 ? { usage: { cost: 0.00012 } } : {}),
    }));
    const questions = { lets: NOUL, who: CHOICE };
    const costed = await decide("Rogue lets Glitch stay.", questions, { endpoint: jev.endpoint });
    expect(costed).toEqual({
      ok: true,
      answers: { lets: { noul: 0.7 }, who: choice },
      costUsd: 0.00012,
    });
    const uncosted = await decide("Rogue lets Glitch stay.", questions, { endpoint: jev.endpoint });
    expect(uncosted).toEqual({
      ok: true,
      answers: { lets: { noul: 0.7 }, who: choice },
      costUsd: null,
    });
  });

  test("a choice missing its probabilities is a parse refusal naming the choice question", async () => {
    const jev = standIn(() => ({
      answers: { lets: { noul: 0.7 }, who: { choice: "glitch", confidence: 0.8 } },
    }));
    const result = await decide(
      "Rogue lets Glitch stay.",
      { lets: NOUL, who: CHOICE },
      { endpoint: jev.endpoint },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.refusal.kind).toBe("parse");
    expect(result.refusal.message).toContain("who");
  });
});
