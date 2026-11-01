import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { described, type EndState } from "harness/goal.ts";
import { type Control, readPage, useAccountBrowsers } from "harness/page.ts";
import { T_ACT } from "harness/rule.ts";
import type { DriveResult, LoopRecord, RunRecord } from "harness/run.ts";
import { targetSchema } from "harness/target.ts";
import { REQUEST, wireSchema, wordsSchema } from "harness/words.ts";
import type { Browser } from "playwright";
import { hostBench } from "../src/adapter/host.ts";
import { kindOf, subkinds, type WorldEvent } from "../src/engine/events.ts";
import { verbs } from "../src/engine/rules.ts";
import {
  chat,
  endpoints,
  exitsAfterClose,
  goal,
  JEV_COST,
  type JevRequest,
  jev,
  keyOf,
  lines,
  MAIN,
  MODEL_COST,
  model,
  NO_DONE,
  PASSED_OVER,
  play,
  preferring,
  proxied,
  type Ran,
  ROOT,
  RUN_FILES,
  standIn,
  stops,
  temps,
} from "./stand-ins.ts";

// Every run below is a child process, or loads playwright only after this; each finds the
// account's browsers.
useAccountBrowsers();

afterAll(() => {
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/** The candidates a loop's controls offer, worked out here from the controls the loop read. */
function offeredBy(entry: LoopRecord, words: string | null): string[] {
  return entry.controls.flatMap((control) => {
    if (control.label === "" || !control.enabled) return [];
    if (control.kind === "select") {
      return control.options
        .filter((option) => option !== control.value)
        .map((option) => `set ${control.label} to ${option}`);
    }
    if (control.kind === "button") return [`press ${control.label}`];
    return words !== null && control.value !== words
      ? [`type the words into ${control.label}`]
      : [];
  });
}

const MUX_SAYS = { said: { person: "mux", subkind: "speech.say" } };
const LINE = "My refurb deck runs on hope and duct tape.";
const MUX_SAY_MOVES = [
  "set actor to mux",
  "set verb to say",
  "type the words into words",
  "press Act",
];

describe("C5: the player works the bench toward a typed end state", () => {
  test("have Mux say something funny: actor, verb, typing, Act, then reached by the bench's check", async () => {
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const j = preferring(MUX_SAY_MOVES, 0.0);
    const ran = await play("have Mux say something funny", endpoints(m, j));
    expect(ran.stderr).toBe("");
    expect(ran.exitCode).toBe(0);
    expect(RUN_FILES.filter((file) => !existsSync(join(ran.runDir, file)))).toEqual([]);

    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(loops.map((entry) => entry.action)).toEqual([...MUX_SAY_MOVES, null]);
    // Reached on the loop after the Act, when the end state holds, though done never passed T_DONE.
    expect(ran.record.outcome).toEqual({ kind: "reached", loop: 5, done: 0 });
    expect(loops.map((entry) => entry.held)).toEqual([false, false, false, false, true]);
    expect(loops.map((entry) => entry.answers.done)).toEqual([0, 0, 0, 0, 0]);
    // A target with no steps records an empty plan, and the run is led by Jev from its first loop.
    expect(ran.record.target).toEqual({ ...goal(MUX_SAYS, true), steps: [] });
    expect(ran.record.words).toBe(LINE);

    const requests = j.bodies as JevRequest[];
    expect(requests).toHaveLength(loops.length);
    loops.forEach((entry, i) => {
      const request = requests[i] as JevRequest;
      // One done noul plus one noul per candidate the page offered that loop, and nothing else.
      expect(Object.keys(request.questions).sort()).toEqual(
        ["done", ...entry.candidates.map((c) => c.key)].sort(),
      );
      expect(Object.values(request.questions).every((q) => q.type === "noul")).toBe(true);
      expect(request.questions.done?.instructions).toContain(described(MUX_SAYS));
      expect(request.state).toBe(entry.state);
      expect(request.model).toBe("typesafe/jev-1.13");
      // The candidates are the page's own controls and options as read that loop.
      expect(entry.candidates.map((c) => c.description)).toEqual(offeredBy(entry, LINE));
      for (const candidate of entry.candidates) {
        expect(entry.controls.map((c) => c.id)).toContain(candidate.control);
      }
      expect(Object.keys(entry.questions).sort()).toEqual(Object.keys(request.questions).sort());
    });
    // The page as read: the actor select offers the world's people, the words field appears once
    // say is the verb, and the words are typed into it before Act.
    expect(loops[0]?.controls.find((c) => c.label === "actor")?.options).toEqual([
      "glitch",
      "mux",
      "rogue",
    ]);
    expect(loops[0]?.controls.some((c) => c.label === "words")).toBe(false);
    expect(loops[2]?.controls.find((c) => c.label === "words")?.value).toBe("");
    expect(loops[3]?.controls.find((c) => c.label === "words")?.value).toBe(LINE);

    // Every loop was printed as it happened: its state, each question with its answer (the done
    // noul included), whether the end state held, its decision and its action.
    for (const entry of loops) {
      expect(ran.stdout).toContain(`--- loop ${entry.loop}`);
      for (const [key, question] of Object.entries(entry.questions)) {
        const score =
          key === "done"
            ? entry.answers.done
            : entry.answers.scored.find((scored) => scored.key === key)?.score;
        expect(score).toBeDefined();
        expect(ran.stdout).toContain(`  ${key}: ${question.instructions} -> ${score}\n`);
      }
      expect(ran.stdout).toContain(entry.state);
      expect(ran.stdout).toContain(`held: ${entry.held}\ndecision: ${entry.decision.kind}`);
      if (entry.action !== null) expect(ran.stdout).toContain(`action: ${entry.action}`);
    }

    // The history read back from the bench holds Mux's say with the stand-in's words.
    const events = lines<WorldEvent>(join(ran.runDir, "events.jsonl"));
    expect(events.map((e) => [e.subkind, e.actor, e.payload])).toEqual([
      ["speech.say", "mux", { words: LINE }],
    ]);
    const received = lines<{ thing: string; copy: WorldEvent }>(join(ran.runDir, "received.jsonl"));
    expect(received.map((r) => r.thing)).toEqual(["mux"]);

    // The total cost is the sum of the answered costs: two model calls and one Jev call per loop.
    const answered = m.bodies.length * MODEL_COST + requests.length * JEV_COST;
    expect(m.bodies).toHaveLength(2);
    expect(ran.record.costUsd).toBeCloseTo(answered, 12);
    expect(ran.record.calls.map((c) => c.client)).toEqual([
      "model",
      "model",
      ...loops.map(() => "jev" as const),
    ]);
  }, 60_000);
});

describe("C6: the player ends without inventing an end state", () => {
  const ATTACK = "have Rogue attack Glitch";
  const ROGUE_BACK = goal({ location: { person: "rogue", room: "back-room" } });

  test("a model answering no-such-action ends the run before any loop", async () => {
    const j = preferring([]);
    const ran = await play(
      ATTACK,
      endpoints(model({ kind: "no-such-action", reason: "no verb attacks" }), j),
    );
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "no-such-action", reason: "no verb attacks" });
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
    expect(existsSync(join(ran.runDir, "run.json"))).toBe(true);
    expect(ran.stderr).toContain("no-such-action");
  }, 60_000);

  test("an end state naming an item the page does not show ends no-such-action naming the item", async () => {
    const j = preferring([]);
    const m = model(goal({ holder: { item: "plasma-rifle", person: "glitch" } }));
    const ran = await play(ATTACK, endpoints(m, j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(JSON.stringify(ran.record.outcome)).toContain(
      'the page shows no item \\"plasma-rifle\\"',
    );
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
    // A target checked() turns into no-such-action is no refusal: it is never asked again.
    expect(m.bodies).toHaveLength(1);
    expect(ran.record.calls).toEqual([{ client: "model", purpose: "target", costUsd: MODEL_COST }]);
  }, 60_000);

  test("a said end state naming a speech kind the bench does not serve ends no-such-action naming it", async () => {
    const j = preferring([]);
    const m = model(goal({ said: { person: "rogue", subkind: "speech.threat" } }, true));
    const ran = await play(ATTACK, endpoints(m, j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(JSON.stringify(ran.record.outcome)).toContain(
      'the bench serves no speech kind \\"speech.threat\\"',
    );
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
    // No words were asked for: the run ended at the target.
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target"]);
  }, 60_000);

  test("nouls that never pass T_ACT end stuck, naming the best candidate and its score", async () => {
    const best = T_ACT * 0.6;
    const j = jev((request) =>
      Object.fromEntries(
        Object.keys(request.questions).map((key) => {
          if (key === "done") return [key, NO_DONE];
          return [key, key === keyOf(request, "press Act") ? best : PASSED_OVER];
        }),
      ),
    );
    const ran = await play(ATTACK, endpoints(model(ROGUE_BACK), j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toMatchObject({
      kind: "stuck",
      loop: 1,
      best: { description: "press Act", score: best },
    });
    expect(ran.stderr).toContain("stuck");
    expect(ran.stderr).toContain("press Act");
  }, 60_000);

  test("a loop ceiling of 2 ends at the ceiling after two loops", async () => {
    const j = preferring(["press Step"]);
    const ran = await play(ATTACK, [...endpoints(model(ROGUE_BACK), j), "--max-loops", "2"]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "ceiling", loops: 2 });
    expect(lines<LoopRecord>(join(ran.runDir, "loops.jsonl")).map((l) => l.action)).toEqual([
      "press Step",
      "press Step",
    ]);
    expect(j.bodies).toHaveLength(2);
    // Two presses of Step advanced the bench's clock twice.
    const events = lines<WorldEvent>(join(ran.runDir, "events.jsonl"));
    expect(events.map((e) => e.subkind)).toEqual(["time.tick", "time.tick"]);
  }, 60_000);
});

/**
 * A Jev stand-in that favours the giver's offer moves, in order, until the offer is recorded, and
 * from then on scores press Step above every other candidate on every loop.
 */
function offerThenStep(offerMoves: string[]) {
  return preferring((request) =>
    request.state.includes("exchange.offer") ? ["press Step"] : offerMoves,
  );
}

/** The loops that pressed Step while the page showed the offer `e1` pending. */
function steppedWhileOffered(loops: LoopRecord[]): number[] {
  return loops
    .filter(
      (entry) => entry.state.includes("exchange.offer e1 by") && entry.action === "press Step",
    )
    .map((entry) => entry.loop);
}

describe("C15: code resolves a pending offer before the clock lapses it", () => {
  const GIVES = [
    {
      instruction: "have Glitch give Rogue the stimpak",
      expect: { holder: { item: "stimpak", person: "rogue" } },
      moves: ["set verb to offer", "set target to rogue", "set item to stimpak", "press Act"],
      resolved: ["set actor to rogue", "set verb to accept", "press Act"],
    },
    {
      instruction: "have Rogue give Glitch the data shard",
      expect: { holder: { item: "data-shard", person: "glitch" } },
      moves: ["set actor to rogue", "set verb to offer", "set item to data-shard", "press Act"],
      resolved: ["set actor to glitch", "set verb to accept", "press Act"],
    },
  ];

  for (const give of GIVES) {
    test(`${give.instruction}: offer, then the accept code derives, never Step`, async () => {
      const ran = await play(
        give.instruction,
        endpoints(model(goal(give.expect)), offerThenStep(give.moves)),
      );
      const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
      const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
      expect(steppedWhileOffered(loops)).toEqual([]);
      expect({ outcome: ran.record.outcome?.kind, history }).toEqual({
        outcome: "reached",
        history: ["exchange.offer", "exchange.accept"],
      });
      expect(ran.exitCode).toBe(0);
      expect(loops.map((entry) => entry.action)).toEqual([...give.moves, ...give.resolved, null]);
      // Each loop after the offer is a resolve naming the offer's opening event.
      const after = loops.slice(give.moves.length, -1);
      expect(after.map((entry) => entry.decision)).toEqual(
        after.map((entry) =>
          expect.objectContaining({
            kind: "resolve",
            pending: { event: "e1", subkind: "exchange.offer" },
            chosen: expect.objectContaining({ description: entry.action }),
          }),
        ),
      );
      // Jev scored press Step above every other candidate on each of those loops.
      for (const entry of after) {
        const top = [...entry.answers.scored].sort((a, b) => b.score - a.score)[0];
        expect(top?.description).toBe("press Step");
      }
      // Reached is the bench's holder check; the accept that made it so is the goal person's.
      const accepted = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).at(-1);
      expect([accepted?.actor, accepted?.payload]).toEqual([
        give.expect.holder.person,
        expect.objectContaining({ item: give.expect.holder.item }),
      ]);
    }, 60_000);
  }

  test("a run whose derived move is absent from the page stops stuck naming the pending state", async () => {
    // The page's verb select leaves out accept: the move the offer's resolution needs is not there.
    const base = proxied((path, text) => {
      if (path !== "/bench/panels/world.js") return text;
      const changed = text.replace(
        "state.verbs.map((v) => v.verb),",
        'state.verbs.map((v) => v.verb).filter((v) => v !== "accept"),',
      );
      if (changed === text) throw new Error("the verb select was not found to rewrite");
      return changed;
    });
    const give = GIVES[1];
    if (give === undefined) throw new Error("no give");
    const ran = await play(give.instruction, [
      ...endpoints(model(goal(give.expect)), offerThenStep(give.moves)),
      "--url",
      base,
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({
      kind: "stuck",
      loop: give.moves.length + 2,
      best: null,
      pending: { event: "e1", subkind: "exchange.offer", move: "set verb to accept" },
    });
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(steppedWhileOffered(loops)).toEqual([]);
    expect(ran.stderr).toContain("exchange.offer");
  }, 60_000);
});

/** A plan's step as the model writes it. */
function step(actor: string, verb: string, fields: Record<string, string> = {}) {
  return { actor, verb, fields };
}

/** The decision kinds of a run's loops, in order. */
function kinds(loops: LoopRecord[]): string[] {
  return loops.map((entry) => entry.decision.kind);
}

describe("the plan: code performs the target's typed steps, resolving and waiting out what stands between them", () => {
  test("each give reaches its end state through plan and resolve loops alone, every noul below T_ACT", async () => {
    const gives = [
      {
        instruction: "have Glitch give Rogue the stimpak",
        expect: { holder: { item: "stimpak", person: "rogue" } },
        steps: [
          step("glitch", "offer", { target: "rogue", item: "stimpak" }),
          step("rogue", "accept", { item: "stimpak" }),
        ],
        actions: [
          "set verb to offer",
          "set target to rogue",
          "set item to stimpak",
          "press Act",
          "set actor to rogue",
          "set verb to accept",
          "press Act",
          null,
        ],
      },
      {
        instruction: "have Rogue give Glitch the data shard",
        expect: { holder: { item: "data-shard", person: "glitch" } },
        steps: [
          step("rogue", "offer", { target: "glitch", item: "data-shard" }),
          step("glitch", "accept", { item: "data-shard" }),
        ],
        actions: [
          "set actor to rogue",
          "set verb to offer",
          "set item to data-shard",
          "press Act",
          "set actor to glitch",
          "set verb to accept",
          "press Act",
          null,
        ],
      },
    ];
    for (const give of gives) {
      const target = { ...goal(give.expect), steps: give.steps };
      const ran = await play(give.instruction, endpoints(model(target), preferring([])));
      const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
      const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
      expect({ outcome: ran.record.outcome?.kind, history, kinds: kinds(loops) }).toEqual({
        outcome: "reached",
        history: ["exchange.offer", "exchange.accept"],
        kinds: ["plan", "plan", "plan", "plan", "resolve", "resolve", "resolve", "reached"],
      });
      expect(loops.map((entry) => entry.action)).toEqual(give.actions);
      // Every plan loop names the step it serves: the offer, the plan's first.
      for (const entry of loops.filter((l) => l.decision.kind === "plan")) {
        expect(entry.decision).toMatchObject({ kind: "plan", step: 0 });
      }
      expect(ran.record.target).toEqual(target);
      expect(ran.exitCode).toBe(0);
    }
  }, 60_000);

  test("a walk then a say-to: Step is pressed through wait loops until Mux arrives, then the say-to", async () => {
    const said = { said: { person: "mux", subkind: "speech.say-to" } };
    const target = {
      ...goal(said),
      steps: [step("mux", "depart", { exit: "west" }), step("mux", "say-to", { target: "glitch" })],
    };
    const ran = await play(
      "have Mux go out front and ask Glitch about the cell",
      endpoints(model(target, { words: LINE }), preferring([])),
    );
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
    expect({ outcome: ran.record.outcome?.kind, kinds: kinds(loops) }).toEqual({
      outcome: "reached",
      kinds: ["plan", "plan", "wait", "wait", "plan", "plan", "plan", "reached"],
    });
    expect(loops.map((entry) => entry.action)).toEqual([
      "set actor to mux",
      "press Act",
      "press Step",
      "press Step",
      "set verb to say-to",
      "type the words into words",
      "press Act",
      null,
    ]);
    expect(loops[2]?.decision).toMatchObject({
      kind: "wait",
      pending: { event: "e1", subkind: "physical.depart" },
    });
    expect(loops.slice(4, 7).map((entry) => entry.decision)).toEqual(
      loops.slice(4, 7).map(() => expect.objectContaining({ kind: "plan", step: 1 })),
    );
    expect(history).toEqual([
      "physical.depart",
      "time.tick",
      "time.tick",
      "physical.arrive",
      "speech.say-to",
    ]);
    // Code decided the run writes words: the end state is of kind said; the model said it needs none.
    expect(ran.record.words).toBe(LINE);
    expect(ran.exitCode).toBe(0);
  }, 60_000);

  test("a step naming an exit the page lacks ends no-such-action naming the exit", async () => {
    const j = preferring([]);
    const target = {
      ...goal({ location: { person: "glitch", room: "back-room" } }),
      steps: [step("glitch", "depart", { exit: "north" })],
    };
    const ran = await play("send Glitch north", endpoints(model(target), j));
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(JSON.stringify(ran.record.outcome)).toContain('the page shows no exit \\"north\\"');
    expect(ran.record.loops).toBe(0);
    expect(j.bodies).toHaveLength(0);
  }, 60_000);

  test("a step the bench refuses ends the plan, and the next loop is led by choose()", async () => {
    // Rogue holds no stimpak: the offer is refused, so the plan's accept is never tried.
    const target = {
      ...goal({ holder: { item: "stimpak", person: "rogue" } }),
      steps: [
        step("rogue", "offer", { target: "glitch", item: "stimpak" }),
        step("glitch", "accept", { item: "stimpak" }),
      ],
    };
    const ran = await play("have Rogue get the stimpak", [
      ...endpoints(model(target), preferring(["press Step"])),
      "--max-loops",
      "6",
    ]);
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(kinds(loops)).toEqual(["plan", "plan", "plan", "plan", "act", "act"]);
    expect(loops.map((entry) => entry.action)).toEqual([
      "set actor to rogue",
      "set verb to offer",
      "set item to stimpak",
      "press Act",
      "press Step",
      "press Step",
    ]);
    expect(loops[4]?.state).toContain("refused: not-holding");
    expect(ran.record.outcome).toEqual({ kind: "ceiling", loops: 6 });
  }, 60_000);
});

describe("whether the run writes words is code's to decide, never the model's", () => {
  test("a target that leaves needsWords out runs, and a said end state still gets its words", async () => {
    const said = { said: { person: "mux", subkind: "speech.say" } };
    const m = model({ kind: "goal", expect: said }, { words: LINE });
    const ran = await play("have Mux say something funny", endpoints(m, preferring(MUX_SAY_MOVES)));
    expect(ran.record.outcome).toMatchObject({ kind: "reached", loop: 5 });
    expect(ran.record.target).toEqual({ kind: "goal", expect: said, steps: [] });
    expect(ran.record.words).toBe(LINE);
    expect(ran.exitCode).toBe(0);
  }, 60_000);
});

describe("C16: reached is the bench's check, never the done noul", () => {
  test("a done noul of 0.99 on every loop does not end the run before Mux has spoken", async () => {
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const j = preferring(MUX_SAY_MOVES, 0.99);
    const ran = await play("have Mux say something funny", endpoints(m, j));
    const loops = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    const history = lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind);
    expect({ outcome: ran.record.outcome, history }).toEqual({
      outcome: { kind: "reached", loop: 5, done: 0.99 },
      history: ["speech.say"],
    });
    expect(loops.map((entry) => entry.held)).toEqual([false, false, false, false, true]);
    expect(loops.map((entry) => entry.answers.done)).toEqual([0.99, 0.99, 0.99, 0.99, 0.99]);
    expect(loops.map((entry) => entry.action)).toEqual([...MUX_SAY_MOVES, null]);
    expect(ran.exitCode).toBe(0);
  }, 60_000);
});

describe("C7: a refusal from either client stops the run naming its kind", () => {
  const TARGET = goal({ location: { person: "glitch", room: "back-room" } });

  /** Each stop leaves run.json naming it and every file written before it. */
  function expectStopped(ran: Ran, kind: string, call: string): void {
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toMatchObject({ kind: "stopped", stopped: { kind, call } });
    expect(ran.record.stopped).toMatchObject({ kind, call });
    expect(ran.stderr).toContain(`stopped: ${kind}`);
    expect(RUN_FILES.filter((file) => !existsSync(join(ran.runDir, file)))).toEqual([]);
  }

  test("status: the decisions endpoint answers 500 on the second loop", async () => {
    const j = preferring(["press Step"], NO_DONE, (n) =>
      n === 2 ? new Response("upstream exploded", { status: 500 }) : null,
    );
    const ran = await play("send Glitch east", endpoints(model(TARGET), j));
    expectStopped(ran, "status", "loop 2");
    expect(ran.record.stopped?.status).toBe(500);
    expect(ran.stderr).toContain("500");
    // The first loop and the calls before the stop remain.
    expect(lines<LoopRecord>(join(ran.runDir, "loops.jsonl"))).toHaveLength(1);
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target", "loop 1"]);
    expect(lines<WorldEvent>(join(ran.runDir, "events.jsonl")).map((e) => e.subkind)).toEqual([
      "time.tick",
    ]);
  }, 60_000);

  test("parse: the chat completions endpoint answers a body that is not the answer shape", async () => {
    const m = standIn(() => Response.json({ id: "x", object: "chat.completion", choices: [] }));
    const j = preferring([]);
    const ran = await play("send Glitch east", endpoints(m, j));
    expectStopped(ran, "parse", "target");
    expect(j.bodies).toHaveLength(0);
    // Asked once more by the identical request, then final: both attempts are calls, no answer.
    expect(m.bodies).toHaveLength(2);
    expect(m.bodies[1]).toEqual(m.bodies[0]);
    const refused = { message: "the chat completions body has no message content", answer: null };
    expect(ran.record.calls).toEqual([
      { client: "model", purpose: "target", costUsd: null, refused },
      { client: "model", purpose: "target", costUsd: null, retry: true, refused },
    ]);
  }, 60_000);

  test("status: the chat completions endpoint answers 500, asked once, no model call recorded", async () => {
    const m = chat({ status: 500 }, { content: JSON.stringify(TARGET) });
    const ran = await play("send Glitch east", endpoints(m, preferring([])));
    expect(m.bodies).toHaveLength(1);
    expectStopped(ran, "status", "target");
    expect(ran.record.calls).toEqual([]);
  }, 60_000);

  test("parse: a target not the shape, then a valid one, is the run's target; the retry is identical", async () => {
    const plan = JSON.stringify({ kind: "plan", steps: [] });
    const m = chat({ content: plan }, { content: JSON.stringify(TARGET) });
    const ran = await play("send Glitch east", endpoints(m, preferring([])));
    expect(ran.record.target).toEqual({ ...TARGET, steps: [] });
    expect(m.bodies).toHaveLength(2);
    expect(m.bodies[1]).toEqual(m.bodies[0]);
    const refused = { message: expect.stringContaining("not the asked shape"), answer: plan };
    expect(ran.record.calls.slice(0, 2)).toEqual([
      { client: "model", purpose: "target", costUsd: MODEL_COST, refused },
      { client: "model", purpose: "target", costUsd: MODEL_COST, retry: true },
    ]);
  }, 60_000);

  test("parse: text that is not JSON twice stops at the target after exactly two requests", async () => {
    const prose = ["Glitch heads east, I think.", "Glitch should walk east, surely."];
    const m = chat(...prose.map((content) => ({ content })), { content: JSON.stringify(TARGET) });
    const ran = await play("send Glitch east", endpoints(m, preferring([])));
    expect(m.bodies).toHaveLength(2);
    expectStopped(ran, "parse", "target");
    expect(ran.record.calls.map((c) => [c.retry ?? false, c.refused?.answer])).toEqual([
      [false, prose[0]],
      [true, prose[1]],
    ]);
  }, 60_000);

  test("network: no server answers at the decisions endpoint", async () => {
    const gone = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("") });
    const url = `http://127.0.0.1:${gone.port}/`;
    await gone.stop(true);
    const ran = await play("send Glitch east", endpoints(model(TARGET), { url }));
    expectStopped(ran, "network", "loop 1");
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target"]);
    expect(ran.record.target).toEqual({ ...TARGET, steps: [] });
  }, 60_000);

  test("config: a key name that resolves to nothing stops before any request", async () => {
    const m = model(TARGET);
    const j = preferring([]);
    const ran = await play("send Glitch east", [
      "--model-endpoint",
      m.url,
      "--jev-endpoint",
      j.url,
      "--key-name",
      "strata-test-no-such-key",
    ]);
    expectStopped(ran, "config", "target");
    expect(ran.record.stopped?.message).toContain("strata-test-no-such-key");
    expect(m.bodies).toHaveLength(0);
    expect(j.bodies).toHaveLength(0);
  }, 60_000);
});

describe("S1: a words answer refused at parse is asked once more, every attempt a call", () => {
  test("GLM's garbled words, then a valid line: reached, the refused answer kept whole", async () => {
    const glm = join(ROOT, "corpus", "runs", "2026-11-01T21-15-09-855Z", "run.json");
    const recorded = JSON.parse(readFileSync(glm, "utf8")) as RunRecord;
    const excerpt = recorded.stopped?.message.replace("the model's answer is not JSON: ", "") ?? "";
    const garbled = `${excerpt}${"<unused2133> ন্".repeat(6)}`;
    const said = goal({ said: { person: "rogue", subkind: "speech.whisper" } }, true);
    const target = { ...said, steps: [step("rogue", "whisper", { target: "glitch" })] };
    const warning = "Glitch, the fixer sold us out; keep your head down.";
    const answers = [JSON.stringify(target), garbled, JSON.stringify({ words: warning })];
    const m = chat(...answers.map((content) => ({ content })));
    const ran = await play("have Rogue whisper a warning to Glitch", endpoints(m, preferring([])));
    expect(ran.record.outcome?.kind).toBe("reached");
    expect(garbled.length).toBeGreaterThan(80);
    const refused = {
      message: `the model's answer is not JSON: ${garbled.slice(0, 80)}`,
      answer: garbled,
    };
    expect(ran.record.calls.filter((c) => c.client === "model")).toEqual([
      { client: "model", purpose: "target", costUsd: MODEL_COST },
      { client: "model", purpose: "words", costUsd: MODEL_COST, refused },
      { client: "model", purpose: "words", costUsd: MODEL_COST, retry: true },
    ]);
    const sum = ran.record.calls.reduce((total, c) => total + (c.costUsd ?? 0), 0);
    expect(ran.record.costUsd).toBeCloseTo(sum, 12);
    expect(ran.record.words).toBe(warning);
    expect(m.bodies).toHaveLength(3);
    expect(m.bodies[2]).toEqual(m.bodies[1]);
  }, 60_000);
});

/**
 * An end state false on the fresh world that a run reaches by acting: Jev favours press Act, Glitch
 * departs east, code presses Step until he arrives, and the third loop finds him in the Back Room.
 */
const GLITCH_IN_BACK = goal({ location: { person: "glitch", room: "back-room" } });
const GLITCH_GOES_EAST = ["press Act"];

describe("the key goes only where it is named, never in the clear, and never into a message", () => {
  const FAKE_SECRET = "sk-or-v1-FAKESECRET0000000000";

  async function spawned(cmd: string[], env: Record<string, string | undefined> = process.env) {
    const proc = Bun.spawn(cmd, { cwd: ROOT, env, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { stdout, stderr, exitCode };
  }

  test("an endpoint override is sent no key unless --key-name names one for it", async () => {
    const m = model(GLITCH_IN_BACK);
    const j = preferring(GLITCH_GOES_EAST);
    const ran = await play("send Glitch to the Back Room", endpoints(m, j));
    expect(ran.record.outcome).toEqual({ kind: "reached", loop: 3, done: NO_DONE });
    expect(j.authorized.length).toBe(ran.record.loops);
    expect([m.authorized, j.authorized]).toEqual([[false], j.authorized.map(() => false)]);
  }, 60_000);

  test("a named key is never sent over plain http to another machine", async () => {
    const elsewhere = "http://strata-test.invalid/";
    const ran = await play("send Glitch east", [
      "--model-endpoint",
      elsewhere,
      "--jev-endpoint",
      elsewhere,
      "--key-name",
      "strata-test-no-such-key",
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.stopped).toMatchObject({ kind: "config", call: "target" });
    expect(ran.record.stopped?.message).toContain("https");
    expect(ran.record.stopped?.message).toContain("strata-test.invalid");
  }, 60_000);

  test("a malformed apiconf config is named without the parser's detail, which quotes key lines", async () => {
    const home = mkdtempSync(join(tmpdir(), "strata-apiconf-"));
    temps.push(home);
    const config = join(home, ".config", "apiconf", "config.toml");
    mkdirSync(dirname(config), { recursive: true });
    // One typo, an unclosed quote, on the line after a key's value.
    writeFileSync(
      config,
      `[keys.sable-openrouter]\nvalue = "${FAKE_SECRET}"\nnote = "personal key\n`,
    );
    const code = [
      `import { DECISIONS_URL, postJson } from ${JSON.stringify(join(ROOT, "harness", "src", "jev.ts"))};`,
      `console.log(JSON.stringify(await postJson(DECISIONS_URL, "decisions", {}, {})));`,
    ].join("\n");
    const ran = await spawned([process.execPath, "-e", code], { ...process.env, HOME: home });
    expect(ran.exitCode).toBe(0);
    const posted = JSON.parse(ran.stdout) as {
      ok: boolean;
      refusal: { kind: string; message: string };
    };
    expect(posted).toMatchObject({ ok: false, refusal: { kind: "config" } });
    expect(posted.refusal.message).toContain("sable-openrouter");
    expect(posted.refusal.message).toContain(config);
    expect(ran.stdout.includes("FAKESECRET")).toBe(false);
    expect(ran.stderr.includes("FAKESECRET")).toBe(false);
  }, 30_000);

  test("there is no flag that takes a key on the command line", async () => {
    const dir = mkdtempSync(join(tmpdir(), "strata-harness-test-"));
    temps.push(dir);
    const corpus = join(dir, "runs");
    const ran = await spawned([
      process.execPath,
      "run",
      MAIN,
      "send Glitch east",
      "--tick-minutes",
      "10",
      "--corpus",
      corpus,
      "--key",
      "stand-in-key",
    ]);
    expect(ran.exitCode).toBe(2);
    expect(ran.stderr).toContain("--key");
    expect(ran.stderr).not.toContain("[--key <key>]");
    expect(existsSync(corpus)).toBe(false);
  }, 30_000);
});

describe("every call's cost is on record, and a cost the provider did not report is told apart", () => {
  test("a call answered without usage.cost is recorded as unreported, never as zero", async () => {
    // S4: the refused attempt reports a cost; its retry, which answers, reports none.
    const answer = JSON.stringify({ kind: "no-such-action", reason: "x" });
    const m = chat({ content: "no JSON here" }, { content: answer, cost: null });
    const ran = await play("have Rogue attack Glitch", endpoints(m, preferring([])));
    expect(ran.record.outcome?.kind).toBe("no-such-action");
    expect(ran.record.calls.map((c) => [c.costUsd, c.retry ?? false, c.refused?.answer])).toEqual([
      [MODEL_COST, false, "no JSON here"],
      [null, true, undefined],
    ]);
    expect(ran.record.unreportedCosts).toBe(1);
    expect(ran.record.costUsd).toBe(MODEL_COST);
  }, 60_000);
});

describe("a bench read that fails after the run is its own failure, kept apart from the outcome", () => {
  test("a history route answering 500 keeps the run reached, names the route, and writes no history", async () => {
    // The player's own read of the history fails; the page's reads, and the loop's, do not.
    const base = proxied(undefined, (path) =>
      path === "/api/events" ? new Response("history unavailable", { status: 500 }) : null,
    );
    const ran = await play("send Glitch to the Back Room", [
      ...endpoints(model(GLITCH_IN_BACK), preferring(GLITCH_GOES_EAST)),
      "--url",
      base,
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toEqual({ kind: "reached", loop: 3, done: NO_DONE });
    expect(ran.record.stopped).toBeUndefined();
    expect(ran.record.benchFailures).toHaveLength(1);
    expect(ran.record.benchFailures[0]).toMatchObject({ kind: "bench", call: "history" });
    expect(ran.record.benchFailures[0]?.message).toContain("/api/events");
    expect(ran.record.benchFailures[0]?.message).toContain("500");
    expect(existsSync(join(ran.runDir, "events.jsonl"))).toBe(false);
    expect(existsSync(join(ran.runDir, "received.jsonl"))).toBe(false);
    expect(ran.stderr).toContain("bench");
    expect(ran.stderr).toContain("/api/events");
  }, 60_000);
});

describe("A1: a run whose typed end state already holds before it acts ends already-held, never reached", () => {
  /** The run's end, read whole: an already-held run asks the model once and performs nothing. */
  function expectAlreadyHeld(ran: Ran, j: { bodies: unknown[] }, expected: EndState): void {
    expect(ran.record.outcome).toEqual({ kind: "already-held", expect: expected });
    expect(ran.record.loops).toBe(0);
    expect(readFileSync(join(ran.runDir, "loops.jsonl"), "utf8")).toBe("");
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target"]);
    expect(j.bodies).toHaveLength(0);
    expect(RUN_FILES.filter((file) => !existsSync(join(ran.runDir, file)))).toEqual([]);
    expect(ran.exitCode).toBe(1);
    expect(ran.stderr).toContain("already-held");
    expect(ran.stdout).toContain(`already held: ${described(expected)}`);
  }

  test("Glitch's stimpak typed as Glitch's: the run refuses it before acting, with no words and no Jev call", async () => {
    const stimpakWithGlitch = { holder: { item: "stimpak", person: "glitch" } };
    const m = model({ kind: "goal", expect: stimpakWithGlitch, steps: [] });
    const j = preferring([]);
    const ran = await play(
      "Mux is looking rough back there. Get Glitch's stimpak into his hands.",
      endpoints(m, j),
    );
    expectAlreadyHeld(ran, j, stimpakWithGlitch);
    expect(m.bodies).toHaveLength(1);
    // Nothing was done: the history read back from the fresh bench is empty.
    expect(readFileSync(join(ran.runDir, "events.jsonl"), "utf8")).toBe("");
  }, 60_000);

  test("A2: a location end state true from boot ends already-held", async () => {
    const rogueInBar = { location: { person: "rogue", room: "chrome-cassette" } };
    const j = preferring([]);
    const ran = await play("bring Rogue to the bar", endpoints(model(goal(rogueInBar)), j));
    expectAlreadyHeld(ran, j, rogueInBar);
  }, 60_000);

  test("A2: a said end state the bench's history already records ends already-held, with no words call", async () => {
    const bench = hostBench({ worldDir: join(ROOT, "world"), tickMinutes: 10 });
    if (!bench.ok) throw new Error(bench.message);
    stops.push(bench.stop);
    const said = await fetch(new URL("/api/actions", bench.base), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor: "mux", verb: "say", words: LINE }),
    });
    expect(said.status).toBe(200);
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const j = preferring(MUX_SAY_MOVES);
    const ran = await play("have Mux say something funny", [
      ...endpoints(m, j),
      "--url",
      bench.base,
    ]);
    expectAlreadyHeld(ran, j, MUX_SAYS);
    expect(m.bodies).toHaveLength(1);
    expect(ran.record.words).toBeNull();
    // The history holds the say made before the run, and nothing the run did.
    const events = lines<WorldEvent>(join(ran.runDir, "events.jsonl"));
    expect(events.map((e) => [e.subkind, e.actor])).toEqual([["speech.say", "mux"]]);
  }, 60_000);

  test("A4: a snapshot read failing at the pre-act read stops the run as bench at the target", async () => {
    const m = model(goal({ holder: { item: "stimpak", person: "rogue" } }));
    // The harness's own snapshot reads fail once the target has been asked for; the page's do not.
    const base = proxied(undefined, (path) =>
      path === "/api/snapshot" && m.bodies.length > 0
        ? new Response("snapshot unavailable", { status: 500 })
        : null,
    );
    const j = preferring([]);
    const ran = await play("have Glitch give Rogue the stimpak", [
      ...endpoints(m, j),
      "--url",
      base,
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toMatchObject({
      kind: "stopped",
      stopped: { kind: "bench", call: "target" },
    });
    expect(ran.record.stopped?.message).toContain("/api/snapshot");
    expect(ran.record.stopped?.message).toContain("500");
    expect(ran.record.loops).toBe(0);
    expect(readFileSync(join(ran.runDir, "loops.jsonl"), "utf8")).toBe("");
    expect(ran.record.calls.map((c) => c.purpose)).toEqual(["target"]);
    expect(j.bodies).toHaveLength(0);
    expect(ran.stderr).toContain("stopped: bench at target");
  }, 60_000);
});

/** The prompt the chat completions stand-in received on its first call: the target's. */
function targetPrompt(m: { bodies: unknown[] }): string {
  const first = m.bodies[0] as { messages: { content: string }[] } | undefined;
  return first?.messages[0]?.content ?? "";
}

/** The verb lines of a target prompt, between their heading and the people line. */
function verbLines(prompt: string): string[] {
  const all = prompt.split("\n");
  const from = all.indexOf("Verbs the page offers, each with the fields it takes besides actor:");
  const to = all.findIndex((line) => line.startsWith("People (actors and targets): "));
  return all.slice(from + 1, to);
}

/** A verb line as the prompt writes it from a verb and its fields. */
function verbLine({ verb, fields }: { verb: string; fields: string[] }): string {
  return `  ${verb}${fields.length > 0 ? ` (fields: ${fields.join(", ")})` : ""}`;
}

describe("H2: every engine fact the target uses is read from the bench's routes during the run", () => {
  const RUNS = [
    {
      instruction: "have Mux say something funny",
      answers: [goal(MUX_SAYS, true), { words: LINE }],
      jev: () => preferring(MUX_SAY_MOVES),
    },
    {
      instruction: "have Glitch give Rogue the stimpak",
      answers: [
        {
          ...goal({ holder: { item: "stimpak", person: "rogue" } }),
          steps: [
            step("glitch", "offer", { target: "rogue", item: "stimpak" }),
            step("rogue", "accept", { item: "stimpak" }),
          ],
        },
      ],
      jev: () => preferring([]),
    },
  ];

  for (const run of RUNS) {
    test(`${run.instruction}: the prompt's verbs and speech kinds are the ones the bench serves`, async () => {
      /** The paths of the harness's own reads of the bench (the page's carry a Chrome agent). */
      const read: string[] = [];
      const base = proxied(undefined, (path) => {
        read.push(path);
        return null;
      });
      const m = model(...run.answers);
      const ran = await play(run.instruction, [...endpoints(m, run.jev()), "--url", base]);
      expect(ran.record.outcome?.kind).toBe("reached");
      // Each was read once, at the run's start, before the target was asked for.
      expect(read.filter((path) => path === "/api/verbs")).toEqual(["/api/verbs"]);
      expect(read.filter((path) => path === "/api/subkinds")).toEqual(["/api/subkinds"]);
      expect(read.slice(0, 2)).toEqual(["/api/verbs", "/api/subkinds"]);

      const served = {
        verbs: (
          (await (await fetch(new URL("/api/verbs", base))).json()) as {
            verbs: { verb: string; fields: string[] }[];
          }
        ).verbs,
        subkinds: (
          (await (await fetch(new URL("/api/subkinds", base))).json()) as {
            subkinds: { subkind: string; kind: string }[];
          }
        ).subkinds,
      };
      const prompt = targetPrompt(m);
      // The verbs with their fields are the served body's, which are the engine's verbs.
      expect(verbLines(prompt)).toEqual(served.verbs.map(verbLine));
      expect(served.verbs.map(verbLine)).toEqual(verbs().map(verbLine));
      // The speech kinds are the served entries whose kind is speech, the registry's speech kinds.
      const speech = served.subkinds.filter((s) => s.kind === "speech").map((s) => s.subkind);
      expect(prompt).toContain(`\nSpeech kinds: ${speech.join(", ")}\n`);
      expect(speech).toEqual(subkinds.filter((subkind) => kindOf(subkind) === "speech"));
    }, 60_000);
  }

  test("a failed /api/subkinds read stops the run as a bench stop at the target", async () => {
    const base = proxied(undefined, (path) =>
      path === "/api/subkinds" ? new Response("subkinds unavailable", { status: 500 }) : null,
    );
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const j = preferring(MUX_SAY_MOVES);
    const ran = await play("have Mux say something funny", [...endpoints(m, j), "--url", base]);
    expect(ran.exitCode).toBe(1);
    expect(ran.record.outcome).toMatchObject({
      kind: "stopped",
      stopped: { kind: "bench", call: "target" },
    });
    expect(ran.record.stopped?.message).toContain("/api/subkinds");
    expect(ran.record.stopped?.message).toContain("500");
    expect(ran.record.loops).toBe(0);
    expect([m.bodies.length, j.bodies.length]).toEqual([0, 0]);
    expect(ran.stderr).toContain("stopped: bench at target");
  }, 60_000);
});

describe("H4: a headed run performs nothing until the operator steps it", () => {
  let browser: Browser;
  beforeAll(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch();
  }, 30_000);
  // Chromium takes about ten seconds to exit after close on this platform.
  afterAll(async () => {
    await browser?.close();
  }, 30_000);

  /** One hold call: the action, what had been printed and appended, and the page's controls. */
  type HoldCall = { action: string; printed: string; loops: LoopRecord[]; controls: Control[] };

  /**
   * The hold before the browser closes: how many actions were held before it, what had been
   * printed, the run files on disk, and whether the page was still open once it had waited.
   */
  type CloseCall = { after: number; printed: string; files: string[]; open: boolean };

  /** Drive toward Mux's say in this process, with a hold that records each call and answers. */
  async function heldRun(
    headed: boolean,
    answer: (call: number) => "go" | "end",
    j: { url: string },
    answers: unknown[] = [goal(MUX_SAYS, true), { words: LINE }],
  ): Promise<{ result: DriveResult; calls: HoldCall[]; closes: CloseCall[]; printed: string[] }> {
    const { drive } = await import("harness/run.ts");
    const corpus = join(mkdtempSync(join(tmpdir(), "strata-harness-test-")), "runs");
    temps.push(dirname(corpus));
    const printed: string[] = [];
    const calls: HoldCall[] = [];
    const closes: CloseCall[] = [];
    const result = await drive({
      instruction: "have Mux say something funny",
      worldDir: join(ROOT, "world"),
      tickMinutes: 10,
      headed,
      maxLoops: 24,
      corpusDir: corpus,
      jev: { endpoint: j.url },
      model: { endpoint: model(...answers).url },
      host: hostBench,
      browser,
      print: (text) => printed.push(text),
      hold: async (held) => {
        const runDir = join(corpus, readdirSync(corpus)[0] ?? "");
        if (held.kind === "close") {
          const close = { after: calls.length, printed: printed.join("\n") };
          const files = RUN_FILES.filter((file) => existsSync(join(runDir, file)));
          // The operator takes a while to press Enter: the page must still be open after it.
          await Bun.sleep(300);
          const page = browser.contexts()[0]?.pages()[0];
          const open = page !== undefined && (await readPage(page)).controls.length > 0;
          closes.push({ ...close, files, open });
          return "go";
        }
        const page = browser.contexts()[0]?.pages()[0];
        if (page === undefined) throw new Error("the run has no page open");
        calls.push({
          action: held.action,
          printed: printed.join("\n"),
          loops: lines<LoopRecord>(join(runDir, "loops.jsonl")),
          controls: (await readPage(page)).controls,
        });
        return answer(calls.length);
      },
    });
    return { result, calls, closes, printed };
  }

  /** The one close hold a headed run makes: after everything, the page open until it answers. */
  function expectClosedAfterHold(closes: CloseCall[], actions: number, outcome: string): void {
    expect(closes).toEqual([
      { after: actions, printed: expect.any(String), files: RUN_FILES, open: true },
    ]);
    expect(closes[0]?.printed).toContain(`outcome: {"kind":"${outcome}"`);
    // The run closed its context once the hold had answered.
    expect(browser.contexts()).toEqual([]);
  }

  test("each hold comes after its loop is printed and appended, with the page as that loop read it", async () => {
    const { result, calls, closes } = await heldRun(true, () => "go", preferring(MUX_SAY_MOVES));
    const loops = lines<LoopRecord>(join(result.runDir, "loops.jsonl"));
    expect(result.record.outcome).toEqual({ kind: "reached", loop: 5, done: NO_DONE });
    // Once per performed action, and never on the reached loop.
    expect(loops.map((entry) => entry.action)).toEqual([...MUX_SAY_MOVES, null]);
    expect(calls.map((call) => call.action)).toEqual(MUX_SAY_MOVES);
    calls.forEach((call, i) => {
      const entry = loops[i] as LoopRecord;
      // That loop is the last one appended to loops.jsonl, and the last one printed whole.
      expect(call.loops).toEqual(loops.slice(0, i + 1));
      const shown = call.printed.slice(call.printed.lastIndexOf("--- loop "));
      expect(shown.startsWith(`--- loop ${entry.loop}\nstate:\n${entry.state}\nquestions:\n`)).toBe(
        true,
      );
      for (const [key, question] of Object.entries(entry.questions)) {
        const score =
          key === "done"
            ? entry.answers.done
            : entry.answers.scored.find((scored) => scored.key === key)?.score;
        expect(shown).toContain(`  ${key}: ${question.instructions} -> ${score}\n`);
      }
      expect(shown).toContain(`decision: ${entry.decision.kind}`);
      expect(shown.endsWith(`action: ${call.action}`)).toBe(true);
      // Nothing was performed yet: the page's controls are as that loop read them.
      expect(call.controls).toEqual(entry.controls);
    });
    // After the reached loop, one more hold, and the browser closes only once it answers.
    expectClosedAfterHold(closes, MUX_SAY_MOVES.length, "reached");
  }, 60_000);

  test("a hold answering end on its second call stops the run there, the action not performed", async () => {
    const { result, calls, closes } = await heldRun(
      true,
      (call) => (call === 2 ? "end" : "go"),
      preferring(["press Step"]),
    );
    expect(calls.map((call) => call.action)).toEqual(["press Step", "press Step"]);
    expect(result.record.outcome).toMatchObject({
      kind: "stopped",
      stopped: { kind: "hold", call: "loop 2" },
    });
    expect(result.record.stopped).toMatchObject({ kind: "hold", call: "loop 2" });
    expect(result.record.loops).toBe(2);
    // The first loop's Step was performed and the second's was not: the clock ticked once.
    const events = lines<WorldEvent>(join(result.runDir, "events.jsonl"));
    expect(events.map((e) => e.subkind)).toEqual(["time.tick"]);
    expect(RUN_FILES.filter((file) => !existsSync(join(result.runDir, file)))).toEqual([]);
    // Ended at a hold, the run still holds once more before it closes the browser.
    expectClosedAfterHold(closes, 2, "stopped");
  }, 60_000);

  test("a headed run that ends before any loop still holds before closing the browser", async () => {
    const { result, calls, closes } = await heldRun(true, () => "go", preferring([]), [
      { kind: "no-such-action", reason: "no verb jokes" },
    ]);
    expect(result.record.outcome).toEqual({ kind: "no-such-action", reason: "no verb jokes" });
    expect(calls).toEqual([]);
    expectClosedAfterHold(closes, 0, "no-such-action");
  }, 60_000);

  test("a headless run never calls the hold", async () => {
    const { result, calls, closes } = await heldRun(false, () => "end", preferring(MUX_SAY_MOVES));
    expect(result.record.outcome).toEqual({ kind: "reached", loop: 5, done: NO_DONE });
    expect([calls, closes]).toEqual([[], []]);
  }, 60_000);
});

describe("H4: a headed command line exits once its run is done, its stdin still open", () => {
  test("bun run harness --headed exits after the close hold answers, though stdin never ends", async () => {
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const j = preferring(MUX_SAY_MOVES);
    const corpus = join(mkdtempSync(join(tmpdir(), "strata-harness-test-")), "runs");
    temps.push(dirname(corpus));
    const ran = await exitsAfterClose(
      [
        process.execPath,
        "run",
        MAIN,
        "have Mux say something funny",
        "--tick-minutes",
        "10",
        "--corpus",
        corpus,
        "--headed",
        ...endpoints(m, j),
      ],
      // A line for each of the four moves, and one for the close.
      MUX_SAY_MOVES.length + 1,
      1,
      15_000,
    );
    expect(ran.closed).toBe(true);
    expect({ exited: ran.exited, exitCode: ran.exitCode, stderr: ran.stderr }).toEqual({
      exited: true,
      exitCode: 0,
      stderr: "",
    });
    expect(ran.stdout).toContain("run written to ");
    expect(ran.stdout).toContain('outcome: {"kind":"reached","loop":5');
  }, 90_000);
});

describe("M1: the player's model is the --model setting, anthropic/claude-haiku-5.5 when none is named", () => {
  const RUNS: [flags: string[], posted: string][] = [
    [["--model", "z-ai/glm-5.3-flash"], "z-ai/glm-5.3-flash"],
    [[], "anthropic/claude-haiku-5.5"],
  ];

  for (const [flags, posted] of RUNS) {
    test(`${flags.join(" ") || "no --model"}: the target and the words are asked of ${posted}, and run.json records it`, async () => {
      const m = model(goal(MUX_SAYS, true), { words: LINE });
      const j = preferring(MUX_SAY_MOVES);
      const ran = await play("have Mux say something funny", [...endpoints(m, j), ...flags]);
      expect(ran.record.outcome?.kind).toBe("reached");
      expect(ran.record.calls.filter((c) => c.client === "model").map((c) => c.purpose)).toEqual([
        "target",
        "words",
      ]);
      expect((m.bodies as { model: string }[]).map((body) => body.model)).toEqual([posted, posted]);
      expect(ran.record.parameters.wordsModel).toBe(posted);
      // S2: the request is pinned with its name: a change to it that keeps REQUEST turns this red.
      expect([REQUEST, ran.record.parameters.request]).toEqual(["json-schema-retry", REQUEST]);
      const bodies = m.bodies as Record<string, unknown>[];
      const strict = (name: string, schema: unknown) => ({
        type: "json_schema",
        json_schema: { name, strict: true, schema },
      });
      const words = [
        "You write the one line a character says in a small text world.",
        "The instruction: have Mux say something funny",
        `The end state: ${described(MUX_SAYS)}.`,
        'Answer with one JSON object {"words": "<the line, as the character says it, one sentence>"} and nothing else.',
      ].join("\n");
      const head = /^You turn an instruction into a plan.*\nUse only the names listed above\.$/s;
      expect(bodies).toEqual([
        {
          model: posted,
          messages: [{ role: "user", content: expect.stringMatching(head) }],
          response_format: strict("target", wireSchema(targetSchema)),
          provider: { require_parameters: true },
          usage: { include: true },
        },
        {
          model: posted,
          messages: [{ role: "user", content: words }],
          response_format: strict("words", wireSchema(wordsSchema)),
          provider: { require_parameters: true },
          usage: { include: true },
        },
      ]);
      expect(JSON.stringify(bodies)).not.toContain('"oneOf"');
      // Jev's model is a constant, whatever the player's model is.
      expect(j.bodies.length).toBeGreaterThan(0);
      expect((j.bodies as JevRequest[]).map((body) => body.model)).toEqual(
        j.bodies.map(() => "typesafe/jev-1.13"),
      );
      expect(ran.exitCode).toBe(0);
    }, 60_000);
  }
});

describe("M2: a --model that is not <provider>/<model> is refused before the run starts", () => {
  test("each refused id exits 2 naming --model and the value, with no corpus and no call made", async () => {
    for (const bad of ["haiku", "../escape", ".hidden/x", "a/b/c", ""]) {
      const m = model(goal(MUX_SAYS, true), { words: LINE });
      const j = preferring(MUX_SAY_MOVES);
      const corpus = join(mkdtempSync(join(tmpdir(), "strata-harness-test-")), "runs");
      temps.push(dirname(corpus));
      const proc = Bun.spawn(
        [
          process.execPath,
          "run",
          MAIN,
          "have Mux say something funny",
          "--tick-minutes",
          "10",
          "--corpus",
          corpus,
          "--model",
          bad,
          ...endpoints(m, j),
        ],
        { cwd: ROOT, env: process.env, stdout: "pipe", stderr: "pipe" },
      );
      const [stderr, exitCode] = await Promise.all([new Response(proc.stderr).text(), proc.exited]);
      expect({ bad, exitCode }).toEqual({ bad, exitCode: 2 });
      expect(stderr).toContain(
        `--model must be an OpenRouter model id, <provider>/<model>, got "${bad}"`,
      );
      expect(existsSync(corpus)).toBe(false);
      expect([m.bodies.length, j.bodies.length]).toEqual([0, 0]);
    }
  }, 60_000);
});

describe("H6: a fresh run's files carry the committed run's keys", () => {
  const COMMITTED = join(ROOT, "corpus", "runs", "2026-10-31T14-36-50-377Z");

  test("run.json, its parameters, and every loops.jsonl line have the committed run's key sets", async () => {
    const m = model(goal(MUX_SAYS, true), { words: LINE });
    const ran = await play("have Mux say something funny", endpoints(m, preferring(MUX_SAY_MOVES)));
    const committed = JSON.parse(readFileSync(join(COMMITTED, "run.json"), "utf8")) as RunRecord;
    const keys = (value: object) => Object.keys(value).sort();
    expect(keys(ran.record)).toEqual(keys(committed));
    // A run records the request it made: the committed run, made before, has no request.
    expect(keys(ran.record.parameters)).toEqual(
      keys({ ...committed.parameters, request: REQUEST }),
    );
    const committedLoops = lines<LoopRecord>(join(COMMITTED, "loops.jsonl"));
    const loopKeys = [...new Set(committedLoops.map((entry) => keys(entry).join(",")))];
    expect(loopKeys).toHaveLength(1);
    const fresh = lines<LoopRecord>(join(ran.runDir, "loops.jsonl"));
    expect(fresh.length).toBeGreaterThan(0);
    expect([...new Set(fresh.map((entry) => keys(entry).join(",")))]).toEqual(loopKeys);
  }, 60_000);
});
