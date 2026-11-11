import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nameOf, type PageRead, readPage, unlabeled, useAccountBrowsers } from "harness/page.ts";
import { type Goal, PLAN_START, renderState } from "harness/rule.ts";
import { askTarget, vocabulary } from "harness/target.ts";
import type { Browser } from "playwright";
import { hostBench } from "../src/adapter/host.ts";
import { loadWorld } from "../src/engine/definitions.ts";

const WORLD = join(import.meta.dir, "..", "world");
const TWO_TICK = join(import.meta.dir, "worlds", "two-tick");

let browser: Browser;
let base: string;
let stop: () => void = () => {};

beforeAll(async () => {
  const hosted = hostBench({ worldDir: WORLD, tickMinutes: 10 });
  if (!hosted.ok) throw new Error(hosted.message);
  stop = hosted.stop;
  base = hosted.base;
  try {
    // Playwright fixes where it looks for browsers when first imported: find the account's first.
    useAccountBrowsers();
    const { chromium } = await import("playwright");
    browser = await chromium.launch();
  } catch (error) {
    throw new Error(
      `chromium could not be launched (run \`bunx playwright install chromium\`): ${error}`,
    );
  }
}, 30_000);

// Chromium takes about ten seconds to exit after close on this platform.
afterAll(async () => {
  await browser?.close();
  stop();
}, 30_000);

async function post(path: string, body: unknown): Promise<void> {
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(200);
}

/** The page read as the player reads it, once the Act form has rendered. */
async function read(url = base): Promise<PageRead> {
  const page = await browser.newPage();
  await page.goto(url);
  await page.getByRole("button", { name: "Act", exact: true }).waitFor();
  const got = await readPage(page);
  await page.close();
  return got;
}

/** The lines of the Pending section, as the page's text gives them. */
function pendingLines(text: string): string[] {
  const section = text.slice(text.indexOf('heading "Pending"'), text.indexOf('heading "Rooms"'));
  return [...section.matchAll(/listitem: "?([^"\n]*)"?\n/g)].map((m) => m[1] ?? "");
}

const controlsOf = (got: PageRead) => got.controls.map((c) => `${c.kind} ${c.label}`);

/** The Knowledge section's lines, keyed by each person's heading, as the page's text gives them. */
function knowledgeOf(text: string): Record<string, string[]> {
  const section = text.slice(
    text.indexOf('heading "Knowledge"'),
    text.indexOf('heading "Encounters"'),
  );
  // Split on each heading, kept: [before, heading, its lines, heading, its lines, ...].
  const parts = section.split(/- heading "(What [^"]+)" \[level=3\]/);
  const blocks: Record<string, string[]> = {};
  for (let i = 1; i < parts.length; i += 2) {
    const lines = [...(parts[i + 1] ?? "").matchAll(/listitem: "?([^"\n]*)"?\n/g)];
    blocks[parts[i] ?? ""] = lines.map((m) => m[1] ?? "");
  }
  return blocks;
}

/**
 * The Encounters section, keyed by each person's level-3 heading: each other person's item text
 * keyed to the lines under it, or the block's one bare line when it has no items.
 */
function encountersOn(text: string): Record<string, Record<string, string[]> | string> {
  const section = text.slice(
    text.indexOf('heading "Encounters"'),
    text.indexOf('heading "Received"'),
  );
  const parts = section.split(/- heading "([^"]+)" \[level=3\]\n/);
  const blocks: Record<string, Record<string, string[]> | string> = {};
  for (let i = 1; i < parts.length; i += 2) {
    const body = parts[i + 1] ?? "";
    const bare = /^\s*- text: "?([^"\n]*)"?\n/.exec(body);
    if (bare !== null) {
      blocks[parts[i] ?? ""] = bare[1] ?? "";
      continue;
    }
    const items: Record<string, string[]> = {};
    // An other person's item is the one list item with children; each encounter line has text.
    for (const item of body.split(/\n\s*- listitem:\n/).slice(1)) {
      const head = /- text: "?([^"\n]*)"?/.exec(item)?.[1] ?? "";
      items[head] = [...item.matchAll(/listitem: "?([^"\n]*)"?(?:\n|$)/g)].map((m) => m[1] ?? "");
    }
    blocks[parts[i] ?? ""] = items;
  }
  return blocks;
}

/** The world's own names, which vocabulary() must give exactly. */
function worldNames() {
  const loaded = loadWorld(WORLD);
  if (!loaded.ok) throw new Error(loaded.refusal.message);
  const { defs } = loaded;
  return {
    people: defs.people.map((p) => p.id),
    items: defs.items.map((i) => i.id),
    rooms: defs.rooms.map((r) => r.id),
    exits: [...new Set(defs.rooms.flatMap((r) => Object.keys(r.exits)))],
  };
}

// The controls of the player region, on a fresh world.
const MAIN_CONTROLS = [
  ["select", "actor", ["glitch", "mux", "rogue"]],
  ["select", "verb", ["depart", "say", "say-to", "whisper", "offer", "accept", "refuse"]],
  ["select", "exit", ["east"]],
  ["button", "Act", []],
  ["button", "Step", []],
  ["button", "Reset", []],
];

/** The operator region's text, the aside landmark labelled Operator, once the Act form has rendered. */
async function operatorText(url = base): Promise<string> {
  const page = await browser.newPage();
  await page.goto(url);
  await page.getByRole("button", { name: "Act", exact: true }).waitFor();
  const aside = page.getByRole("complementary", { name: "Operator", exact: true });
  const found = await aside.count();
  if (found !== 1) await page.close();
  expect({ operatorRegions: found }).toEqual({ operatorRegions: 1 });
  const text = await aside.ariaSnapshot();
  await page.close();
  return text;
}

/** The page's text, once its controls are main's, all labelled, and its vocabulary the world's. */
async function seenText(): Promise<string> {
  const { subkinds } = await (await fetch(new URL("/api/subkinds", base))).json();
  const got = await read();
  expect(got.controls.map((c) => [c.kind, c.label, c.options])).toEqual(MAIN_CONTROLS);
  expect(unlabeled(got.controls).map(nameOf)).toEqual([]);
  const { verbs: _verbs, speech: _speech, ...names } = vocabulary(got, subkinds);
  expect(names).toEqual(worldNames());
  return got.text;
}

/** The operator region's text, once the player region passes seenText()'s checks. */
async function seenOperator(): Promise<string> {
  await seenText();
  return operatorText();
}

/** POST to the bench and return the events the answer carries. */
async function events(path: string, body?: unknown): Promise<{ id: string }[]> {
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return ((await response.json()) as { events: { id: string }[] }).events;
}

// Runs first, so the labelled-control test below reads the page with these pending states on it.
describe("C14: the page shows each pending state with its resolvers and what the clock fires", () => {
  test("after an offer of data-shard by rogue to glitch, and then a depart by glitch", async () => {
    const fresh = await read();
    expect(fresh.text).toContain('heading "Pending"');
    expect(pendingLines(fresh.text)).toEqual([]);

    await post("/api/actions", {
      actor: "rogue",
      verb: "offer",
      target: "glitch",
      item: "data-shard",
    });
    const offered = await read();
    expect(pendingLines(offered.text)).toEqual([
      "exchange.offer e1 by rogue to glitch (item data-shard, until 2): resolved by glitch accept (item data-shard), glitch refuse (item data-shard); at tick 2 the clock fires exchange.lapse",
    ]);
    // The section adds no control.
    expect(controlsOf(offered)).toEqual(controlsOf(fresh));

    // Once Glitch is in transit he can answer nothing: the offer stands with no one to close it.
    await post("/api/actions", { actor: "glitch", verb: "depart", exit: "east" });
    const departed = await read();
    expect(pendingLines(departed.text)).toEqual([
      "exchange.offer e1 by rogue to glitch (item data-shard, until 2): no one resolves it; at tick 2 the clock fires exchange.lapse",
      "physical.depart e2 by glitch (from chrome-cassette, exit east, to back-room, travelTicks 1, arrivesAt 1): no one resolves it; at tick 1 the clock fires physical.arrive",
    ]);
    expect(controlsOf(departed)).toEqual(controlsOf(fresh));
    expect(unlabeled(departed.controls).map(nameOf)).toEqual([]);
  }, 30_000);
});

describe("C10: every control on a strata page carries a label", () => {
  test("every button, select, input and textarea on the bench, under every verb, has a label", async () => {
    const page = await browser.newPage();
    await page.goto(base);
    await page.getByRole("button", { name: "Act", exact: true }).waitFor();
    const first = await readPage(page);
    const verb = first.controls.find((control) => control.label === "verb");
    expect(verb?.options.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const option of verb?.options ?? []) {
      await page.getByRole("combobox", { name: "verb", exact: true }).selectOption(option);
      const { controls } = await readPage(page);
      expect(controls.length).toBeGreaterThan(0);
      expect(unlabeled(controls).map(nameOf)).toEqual([]);
      for (const control of controls) seen.add(`${control.kind} ${control.label}`);
    }
    // The form's every field and the clock's buttons were all read.
    for (const name of [
      "select actor",
      "select verb",
      "button Act",
      "button Step",
      "button Reset",
    ]) {
      expect(seen).toContain(name);
    }
    for (const name of ["select exit", "select target", "select item", "input words"]) {
      expect(seen).toContain(name);
    }
    // The operator region's one control, the received viewer, is labelled too.
    const operator = page.getByRole("complementary", { name: "Operator", exact: true });
    const viewer = operator.locator("button, select, input, textarea");
    expect(await viewer.count()).toBe(1);
    expect(await operator.getByRole("combobox", { name: "person", exact: true }).count()).toBe(1);
    await page.close();
  }, 30_000);

  test("a page with one unlabeled button fails naming that button", async () => {
    const page = await browser.newPage();
    await page.setContent(
      '<main><label>words <input></label><button>Go</button><button id="mystery"></button></main>',
    );
    const { controls } = await readPage(page);
    expect(controls.map((control) => control.label)).toEqual(["words", "Go", ""]);
    expect(unlabeled(controls).map(nameOf)).toEqual(['button #2 <button id="mystery"></button>']);
    await page.close();
  }, 30_000);
});

describe("W7: a room's exit line reads '(1 tick)' for a one-tick exit and '(n ticks)' otherwise", () => {
  test("world/'s exits read '(1 tick)', no line reads '1 ticks', and the fixture's read '(2 ticks)'", async () => {
    const { text } = await read();
    expect(text).toContain("west -> chrome-cassette (1 tick)");
    expect(text).toContain("east -> back-room (1 tick)");
    expect(text.split("\n").filter((line) => line.includes("1 ticks"))).toEqual([]);

    const fixture = hostBench({ worldDir: TWO_TICK, tickMinutes: 10 });
    if (!fixture.ok) throw new Error(fixture.message);
    try {
      expect((await read(fixture.base)).text).toContain("north -> hall (2 ticks)");
    } finally {
      fixture.stop();
    }
  }, 30_000);
});

/** Every level-2 heading in `text`, in order. */
const headings2 = (text: string) =>
  [...text.matchAll(/heading "([^"\n]+)" \[level=2\]/g)].map((m) => m[1] ?? "");

/**
 * The Values section's lines, keyed by each person's level-3 heading, from the operator region's
 * text, whose first level-2 heading must be Values.
 */
function valuesOn(text: string): Record<string, string[]> {
  expect(headings2(text)[0]).toBe("Values");
  const start = text.indexOf('heading "Values" [level=2]');
  const next = headings2(text)[1];
  const end = next === undefined ? text.length : text.indexOf(`heading "${next}" [level=2]`);
  const parts = text.slice(start, end).split(/- heading "([^"]+)" \[level=3\]\n/);
  const blocks: Record<string, string[]> = {};
  for (let i = 1; i < parts.length; i += 2) {
    const lines = [...(parts[i + 1] ?? "").matchAll(/listitem: "?([^"\n]*)"?(?:\n|$)/g)];
    blocks[parts[i] ?? ""] = lines.map((m) => m[1] ?? "");
  }
  return blocks;
}

/** The controls inside the operator region's Values section. */
async function valuesControls(): Promise<number> {
  const page = await browser.newPage();
  await page.goto(base);
  await page.getByRole("button", { name: "Act", exact: true }).waitFor();
  const section = page
    .getByRole("complementary", { name: "Operator", exact: true })
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Values", exact: true, level: 2 }) });
  expect(await section.count()).toBe(1);
  const controls = await section.locator("button, select, input, textarea").count();
  await page.close();
  return controls;
}

// Runs after the tests above: it resets the bench they share.
describe("V5: each person's values, shown open in a labelled Values section first in the operator region", () => {
  test("the aside's first section is Values, every line visible and labelled, adding no control", async () => {
    await events("/api/reset");
    const fresh = valuesOn(await operatorText());
    expect(Object.keys(fresh)).toEqual([
      "What Glitch values",
      "What Mux values",
      "What Rogue values",
    ]);
    const loaded = loadWorld(WORLD);
    if (!loaded.ok) throw new Error(loaded.refusal.message);
    const { defs } = loaded;
    const expected = Object.fromEntries(
      defs.people.map((person) => [
        `What ${person.name} values`,
        defs.values.map(({ id, description }) => {
          const importance = person.values[id] ?? -1;
          return `${id}: importance ${importance}, ${defs.importanceWords[importance]}, ${description}`;
        }),
      ]),
    );
    expect(fresh).toEqual(expected);
    for (const lines of Object.values(fresh)) expect(lines).toHaveLength(10);
    expect(fresh["What Rogue values"]).toContain(
      "power: importance 4, central to who this person is, status and prestige, control or dominance over people and resources",
    );

    expect(await valuesControls()).toBe(0);

    await events("/api/actions", { actor: "rogue", verb: "whisper", target: "glitch", words: "x" });
    expect(valuesOn(await operatorText())).toEqual(fresh);
  }, 60_000);
});

/** What an operator panel puts on the page: none of it may reach the player. */
const OPERATOR_MARKS = [
  'heading "Values"',
  'heading "Knowledge"',
  'heading "Encounters"',
  'heading "Received"',
  ' values" [level=3]',
  "What has passed between",
  ": importance ",
];

/** The marks of an operator panel `text` carries. */
const operatorMarksIn = (text: string) => OPERATOR_MARKS.filter((mark) => text.includes(mark));

/** The page read as the player reads it, and the controls a whole-document query finds inside main. */
async function readWithMain(): Promise<{ read: PageRead; inMain: string[] }> {
  const page = await browser.newPage();
  await page.goto(base);
  await page.getByRole("button", { name: "Act", exact: true }).waitFor();
  const read = await readPage(page);
  const inMain = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button, select, input, textarea"))
      .filter((el) => el.closest("main") !== null)
      .map((el) => el.outerHTML.slice(0, 120)),
  );
  await page.close();
  return { read, inMain };
}

/** The target prompt askTarget sends for `read`, taken from a stand-in model that refuses nothing. */
async function targetPrompt(read: PageRead): Promise<string> {
  const prompts: string[] = [];
  const model = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: async (request) => {
      const body = (await request.json()) as { messages: { content: string }[] };
      prompts.push(body.messages[0]?.content ?? "");
      const content = JSON.stringify({ kind: "no-such-action", reason: "a test" });
      return Response.json({ choices: [{ message: { content } }], usage: { cost: 0 } });
    },
  });
  try {
    const served = {
      verbs: (await (await fetch(new URL("/api/verbs", base))).json()).verbs,
      subkinds: (await (await fetch(new URL("/api/subkinds", base))).json()).subkinds,
    };
    await askTarget("have Rogue give Glitch the data shard", read, served, {
      endpoint: `http://127.0.0.1:${model.port}/`,
    });
  } finally {
    void model.stop(true);
  }
  expect(prompts).toHaveLength(1);
  return prompts[0] ?? "";
}

// Runs after the tests above: it resets the bench they share.
describe("V14: the player reads the main landmark alone, never an operator panel", () => {
  test("fresh and after a walk, a whisper and an offer, no operator text reaches the read, the state or the prompt", async () => {
    await events("/api/reset");
    const { subkinds } = await (await fetch(new URL("/api/subkinds", base))).json();
    const goal: Goal = {
      instruction: "have Rogue give Glitch the data shard",
      target: {
        kind: "goal",
        expect: { holder: { item: "data-shard", person: "glitch" } },
        steps: [],
      },
      words: null,
      verbs: [],
    };
    const check = async () => {
      const { read, inMain } = await readWithMain();
      expect(operatorMarksIn(read.text)).toEqual([]);
      expect(operatorMarksIn(renderState(goal, read.text, PLAN_START))).toEqual([]);
      const prompt = await targetPrompt(read);
      expect(prompt).toContain(read.text);
      expect(operatorMarksIn(prompt)).toEqual([]);
      expect(headings2(read.text)).toEqual([
        "Act",
        "Clock",
        "Pending",
        "Rooms",
        "In transit",
        "Items",
        "History",
      ]);
      expect(read.controls.map((control) => control.html)).toEqual(inMain);
      expect(read.controls.map(nameOf)).not.toContain('select "person"');
      const { verbs: _verbs, speech: _speech, ...names } = vocabulary(read, subkinds);
      expect(names).toEqual(worldNames());
    };
    await check();
    await events("/api/actions", { actor: "mux", verb: "depart", exit: "west" });
    await events("/api/step");
    await events("/api/actions", { actor: "rogue", verb: "whisper", target: "glitch", words: "x" });
    await events("/api/actions", {
      actor: "rogue",
      verb: "offer",
      target: "glitch",
      item: "data-shard",
    });
    // The operator region does carry the panels the player is kept from.
    expect(operatorMarksIn(await operatorText())).toEqual(OPERATOR_MARKS);
    await check();
  }, 60_000);

  test("a run over a page with no main, or with two, stops with kind page naming it before any loop", async () => {
    const pages: Record<string, string> = {
      "/none":
        "<!doctype html><body><label>who <select><option>a</option></select></label><button>Act</button></body>",
      "/two":
        "<!doctype html><body><main><button>Act</button></main><main><button>Step</button></main></body>",
    };
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: (request) => {
        const html = pages[new URL(request.url).pathname];
        return html === undefined
          ? Response.json({ error: "not found" }, { status: 404 })
          : new Response(html, { headers: { "content-type": "text/html" } });
      },
    });
    // run.ts loads playwright, which fixes where its browsers are when first loaded: so only now,
    // after beforeAll has pointed it at the account's.
    const { drive } = await import("harness/run.ts");
    const corpus = mkdtempSync(join(tmpdir(), "strata-page-region-"));
    try {
      for (const [path, mains] of [
        ["/none", 0],
        ["/two", 2],
      ] as const) {
        const { record } = await drive({
          instruction: "have Rogue give Glitch the data shard",
          url: `http://127.0.0.1:${server.port}${path}`,
          worldDir: WORLD,
          tickMinutes: 10,
          headed: false,
          maxLoops: 3,
          corpusDir: corpus,
          jev: { endpoint: "http://127.0.0.1:1/" },
          model: { endpoint: "http://127.0.0.1:1/" },
          browser,
          print: () => {},
        });
        expect({
          path,
          outcome: record.outcome?.kind,
          loops: record.loops,
          calls: record.calls,
        }).toEqual({ path, outcome: "stopped", loops: 0, calls: [] });
        expect(record.stopped).toMatchObject({ kind: "page", call: "target" });
        expect(record.stopped?.message).toContain(`${mains} main`);
      }
    } finally {
      void server.stop(true);
      rmSync(corpus, { recursive: true, force: true });
    }
  }, 60_000);
});

// Runs after the tests above: it resets the bench they share.
describe("E5: each person's encounters, shown in a labelled Encounters section on the bench page", () => {
  test("the section adds no control, feeds no name to the vocabulary, and labels every line", async () => {
    await events("/api/reset");
    const people = ["Glitch", "Mux", "Rogue"].map(
      (name) => `What has passed between ${name} and others`,
    );
    const fresh = encountersOn(await seenOperator());
    expect(fresh).toEqual(
      Object.fromEntries(people.map((heading) => [heading, "no encounters yet"])),
    );

    await events("/api/actions", { actor: "mux", verb: "depart", exit: "west" });
    const arrive = (await events("/api/step"))[1]?.id;
    const whisper = (
      await events("/api/actions", {
        actor: "rogue",
        verb: "whisper",
        target: "glitch",
        words: "psst",
      })
    )[0]?.id;
    const witnessed = (kind: string, event: string | undefined) =>
      `role witnessed (bystander), kind ${kind}, tick 1, event ${event}`;
    const direct = (kind: string, event: string | undefined) =>
      `role direct (actor or target), kind ${kind}, tick 1, event ${event}`;
    const after = encountersOn(await seenOperator());
    // Each block lists the other people in the order of its first encounter with each: the arrive
    // put all three together, its others sorted by id.
    expect(Object.values(after).map((block) => Object.keys(block))).toEqual([
      ["with mux", "with rogue"],
      ["with glitch", "with rogue"],
      ["with glitch", "with mux"],
    ]);
    expect(after).toEqual({
      "What has passed between Glitch and others": {
        "with mux": [witnessed("physical.arrive", arrive), direct("speech.whisper", whisper)],
        "with rogue": [witnessed("physical.arrive", arrive), direct("speech.whisper", whisper)],
      },
      "What has passed between Mux and others": {
        "with glitch": [direct("physical.arrive", arrive), witnessed("speech.whisper", whisper)],
        "with rogue": [direct("physical.arrive", arrive), witnessed("speech.whisper", whisper)],
      },
      "What has passed between Rogue and others": {
        "with glitch": [witnessed("physical.arrive", arrive), direct("speech.whisper", whisper)],
        "with mux": [witnessed("physical.arrive", arrive), direct("speech.whisper", whisper)],
      },
    });
  }, 60_000);
});

// Runs last: it resets the bench the tests above share.
describe("K9: what each person knows, shown in a Knowledge section on the bench page", () => {
  test("the section adds no control, feeds no name to the vocabulary, and marks stale facts", async () => {
    const seen = async () => knowledgeOf(await seenOperator());
    await events("/api/reset");

    const fresh = await seen();
    expect(Object.keys(fresh)).toEqual(["What Glitch knows", "What Mux knows", "What Rogue knows"]);
    for (const lines of Object.values(fresh)) {
      for (const label of [
        "own location (location part): ",
        "own holdings (holder part): ",
        "knows person ",
        "knows place ",
      ]) {
        expect(lines.some((line) => line.startsWith(label))).toBe(true);
      }
    }
    expect(fresh["What Mux knows"]).toContain("own location (location part): room back-room");
    expect(fresh["What Mux knows"]).toContain("own holdings (holder part): charge-cell");

    await events("/api/actions", { actor: "mux", verb: "depart", exit: "west" });
    const arrive = (await events("/api/step"))[1]?.id;
    const arrived = await seen();
    const aboutRogue = (lines: string[] | undefined) =>
      (lines ?? []).filter((line) => line.startsWith("location of rogue: "));
    expect(aboutRogue(arrived["What Mux knows"])).toEqual([
      `location of rogue: room chrome-cassette, learned tick 1 from ${arrive} physical.arrive`,
    ]);

    // Mux offers Glitch the charge cell: Glitch learns who holds it, in a line no item pattern reads.
    const offer = (
      await events("/api/actions", {
        actor: "mux",
        verb: "offer",
        target: "glitch",
        item: "charge-cell",
      })
    )[0]?.id;
    const offered = await seen();
    expect(
      (offered["What Glitch knows"] ?? []).filter((line) => line.startsWith("holder of ")),
    ).toEqual([`holder of charge-cell: mux, learned tick 1 from ${offer} exchange.offer`]);
    expect(offered["What Glitch knows"]?.some((line) => line.includes(": held by "))).toBe(false);

    const depart = (
      await events("/api/actions", { actor: "rogue", verb: "depart", exit: "east" })
    )[0]?.id;
    const transit = `location of rogue: in transit chrome-cassette -> back-room, arrives tick 2, learned tick 1 from ${depart} physical.depart`;
    expect(aboutRogue((await seen())["What Mux knows"])).toEqual([transit]);

    await events("/api/step");
    const landed = await seen();
    expect(aboutRogue(landed["What Mux knows"])).toEqual([
      `${transit} STALE (operator view): now room back-room`,
    ]);
    // Rogue last saw Mux in the bar at his offer; he is still there, so her fact is not stale.
    expect(
      (landed["What Rogue knows"] ?? []).filter((line) => line.startsWith("location of mux: ")),
    ).toEqual([
      `location of mux: room chrome-cassette, learned tick 1 from ${offer} exchange.offer`,
    ]);
  }, 60_000);
});
