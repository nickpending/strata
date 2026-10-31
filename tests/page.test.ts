import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Browser } from "playwright";
import { nameOf, readPage, unlabeled, useAccountBrowsers } from "../src/player/page.ts";
import { startServer } from "../src/server/routes.ts";

const WORLD = join(import.meta.dir, "..", "world");

let browser: Browser;
let base: string;
let stop: () => void = () => {};
let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "strata-page-"));
  const started = startServer({
    world: WORLD,
    dbPath: join(dir, "world.sqlite"),
    tickMinutes: 10,
    port: 0,
  });
  if (!started.ok) throw new Error(started.refusal.message);
  stop = started.stop;
  base = `http://127.0.0.1:${started.server.port}/`;
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
  rmSync(dir, { recursive: true, force: true });
}, 30_000);

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
