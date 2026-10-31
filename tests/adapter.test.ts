import { afterAll, describe, expect, test } from "bun:test";
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
import { join } from "node:path";
import { useAccountBrowsers } from "harness/page.ts";
import type { RunRecord } from "harness/run.ts";
import { hostBench } from "../src/adapter/host.ts";

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");
// Every run below is a child process; each inherits where the account's browsers are.
useAccountBrowsers();

const temps: string[] = [];
const stops: (() => void)[] = [];
afterAll(() => {
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

async function spawned(cmd: string[], env: Record<string, string | undefined> = process.env) {
  const proc = Bun.spawn(cmd, { cwd: ROOT, env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

/** The one run a corpus directory holds. */
function onlyRun(corpus: string): { runDir: string; record: RunRecord } {
  const runs = existsSync(corpus) ? readdirSync(corpus) : [];
  if (runs.length !== 1) throw new Error(`expected one run in ${corpus}, found ${runs.length}`);
  const runDir = join(corpus, runs[0] ?? "");
  return {
    runDir,
    record: JSON.parse(readFileSync(join(runDir, "run.json"), "utf8")) as RunRecord,
  };
}

describe("H3: the bench serves every registry subkind with its family", () => {
  test("GET /api/subkinds on a hosted bench answers each subkind once, in registry order", async () => {
    const hosted = hostBench({ worldDir: WORLD, tickMinutes: 10 });
    if (!hosted.ok) throw new Error(hosted.message);
    stops.push(hosted.stop);
    const response = await fetch(new URL("/api/subkinds", hosted.base));
    expect(response.status).toBe(200);
    // Written by hand from src/engine/events.ts's registry, each with the part before its dot.
    expect(await response.json()).toEqual({
      subkinds: [
        { subkind: "physical.depart", kind: "physical" },
        { subkind: "physical.arrive", kind: "physical" },
        { subkind: "speech.say", kind: "speech" },
        { subkind: "speech.say-to", kind: "speech" },
        { subkind: "speech.whisper", kind: "speech" },
        { subkind: "exchange.offer", kind: "exchange" },
        { subkind: "exchange.accept", kind: "exchange" },
        { subkind: "exchange.refuse", kind: "exchange" },
        { subkind: "exchange.lapse", kind: "exchange" },
        { subkind: "time.tick", kind: "time" },
      ],
    });
  });
});

describe("H5: a run has a bench only when it is given one or a host for one", () => {
  test("the harness's own cli with neither --url nor a host stops at once as boot, writing run.json", async () => {
    const corpus = join(temp("strata-adapter-test-"), "runs");
    const ran = await spawned([
      process.execPath,
      "run",
      join(ROOT, "harness", "src", "main.ts"),
      "send Glitch east",
      "--tick-minutes",
      "10",
      "--corpus",
      corpus,
      "--model-endpoint",
      "http://127.0.0.1:1/",
      "--jev-endpoint",
      "http://127.0.0.1:1/",
    ]);
    expect(ran.exitCode).toBe(1);
    const { record } = onlyRun(corpus);
    expect(record.outcome).toMatchObject({
      kind: "stopped",
      stopped: {
        kind: "boot",
        call: "boot",
        message: expect.stringContaining("no bench to drive"),
      },
    });
    expect(record.loops).toBe(0);
    expect(record.calls).toEqual([]);
    expect(ran.stderr).toContain("stopped: boot");
  }, 30_000);

  test("the harness's own scoreCli with no host refuses before any goal runs", async () => {
    const dir = temp("strata-adapter-test-");
    const goals = join(dir, "goals", "elsewhere.json");
    mkdirSync(join(dir, "goals"));
    writeFileSync(
      goals,
      JSON.stringify({
        set: "elsewhere",
        author: "a test",
        goals: [
          { id: "moon", instruction: "fly to the moon", expect: { outcome: "no-such-action" } },
        ],
      }),
    );
    const corpus = join(dir, "runs");
    const ran = await spawned([
      process.execPath,
      "run",
      join(ROOT, "harness", "src", "score.ts"),
      "--goals",
      goals,
      "--tick-minutes",
      "10",
      "--corpus",
      corpus,
    ]);
    expect(ran.exitCode).toBe(1);
    expect(ran.stderr).toContain("each goal needs a hosted bench");
    expect(existsSync(corpus)).toBe(false);
    expect(existsSync(join(dir, "goals", "elsewhere.score.json"))).toBe(false);
  }, 30_000);

  test("the adapter's run hosts a fresh bench, drives it, and removes its directory at the end", async () => {
    const tmp = temp("strata-adapter-tmp-");
    const hostedDirs = () => readdirSync(tmp).filter((name) => name.startsWith("strata-harness-"));
    const model = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () =>
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  kind: "goal",
                  expect: { holder: { item: "data-shard", person: "rogue" } },
                }),
              },
            },
          ],
        }),
    });
    stops.push(() => void model.stop(true));
    /** The bench directories under the run's TMPDIR as each Jev call saw them. */
    const during: string[][] = [];
    const jev = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: async (request) => {
        during.push(hostedDirs());
        const { questions } = (await request.json()) as { questions: Record<string, unknown> };
        const answers = Object.fromEntries(Object.keys(questions).map((key) => [key, { noul: 0 }]));
        return Response.json({ answers });
      },
    });
    stops.push(() => void jev.stop(true));
    const corpus = join(temp("strata-adapter-test-"), "runs");
    const ran = await spawned(
      [
        process.execPath,
        "run",
        join(ROOT, "src", "adapter", "main.ts"),
        "keep the data shard with Rogue",
        "--tick-minutes",
        "10",
        "--corpus",
        corpus,
        "--model-endpoint",
        `http://127.0.0.1:${model.port}/`,
        "--jev-endpoint",
        `http://127.0.0.1:${jev.port}/`,
      ],
      { ...process.env, TMPDIR: tmp },
    );
    expect(ran.stderr).toBe("");
    expect(ran.exitCode).toBe(0);
    const { runDir, record } = onlyRun(corpus);
    expect(record.parameters.url).toBeNull();
    expect(record.outcome).toEqual({ kind: "reached", loop: 1, done: 0 });
    // The run drove a bench of its own, in one directory under TMPDIR while it ran, and none after.
    expect(during).toEqual([[expect.stringMatching(/^strata-harness-/)]]);
    expect(hostedDirs()).toEqual([]);
    // A fresh bench: its history holds nothing the run did not do.
    expect(readFileSync(join(runDir, "events.jsonl"), "utf8")).toBe("");
  }, 60_000);
});
