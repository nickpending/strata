import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { nameOf, type PageRead, readPage, unlabeled, useAccountBrowsers } from "harness/page.ts";
import type { Browser } from "playwright";
import { hostBench } from "../src/adapter/host.ts";

const WORLD = join(import.meta.dir, "..", "world");

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
async function read(): Promise<PageRead> {
  const page = await browser.newPage();
  await page.goto(base);
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
    // The form's every field, the clock's buttons and the received viewer were all read.
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
    expect(seen).toContain("select person");
    await page.close();
  }, 30_000);

  test("a page with one unlabeled button fails naming that button", async () => {
    const page = await browser.newPage();
    await page.setContent(
      '<label>words <input></label><button>Go</button><button id="mystery"></button>',
    );
    const { controls } = await readPage(page);
    expect(controls.map((control) => control.label)).toEqual(["words", "Go", ""]);
    expect(unlabeled(controls).map(nameOf)).toEqual(['button #2 <button id="mystery"></button>']);
    await page.close();
  }, 30_000);
});
