import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const RUN = join(ROOT, "harness", "src", "run.ts");

const temps: string[] = [];
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/**
 * Run `code` in a child bun process; one still running `bound` after it started is killed, and
 * its exit code is null.
 */
async function child(code: string, bound: number) {
  const proc = Bun.spawn([process.execPath, "-e", code], {
    cwd: ROOT,
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const exited = await Promise.race([
    proc.exited.then(() => true),
    Bun.sleep(bound).then(() => false),
  ]);
  if (!exited) proc.kill();
  const [stdout, stderr] = await output;
  return { stdout, stderr, exitCode: exited ? proc.exitCode : null };
}

describe("G5: a run directory is claimed by the mkdir that creates it", () => {
  const PROCESSES = 8;
  const CLAIMS = 150;
  const STARTED_AT = "2026-11-01T12:00:00.000Z";

  test("several processes claiming for one startedAt at once each get their own directories, and none fails", async () => {
    const corpus = mkdtempSync(join(tmpdir(), "strata-claim-"));
    temps.push(corpus);
    // Every process waits for the same instant, then claims as fast as it can.
    const at = Date.now() + 2_000;
    const code = [
      `import { claimRunDir } from ${JSON.stringify(RUN)};`,
      `while (Date.now() < ${at}) {}`,
      "const dirs = [];",
      `for (let i = 0; i < ${CLAIMS}; i++) dirs.push(claimRunDir(${JSON.stringify(corpus)}, new Date(${JSON.stringify(STARTED_AT)})).runDir);`,
      "console.log(JSON.stringify(dirs));",
    ].join("\n");
    const ran = await Promise.all(Array.from({ length: PROCESSES }, () => child(code, 60_000)));
    expect(ran.map((r) => [r.exitCode, r.stderr])).toEqual(ran.map(() => [0, ""]));
    const dirs = ran.flatMap((r) => JSON.parse(r.stdout) as string[]);
    expect(dirs).toHaveLength(PROCESSES * CLAIMS);
    expect(dirs.filter((dir) => !existsSync(dir))).toEqual([]);
    expect(new Set(dirs).size).toBe(dirs.length);
  }, 90_000);

  test("an error other than EEXIST is rethrown, never taken as a claimed directory", async () => {
    const dir = mkdtempSync(join(tmpdir(), "strata-claim-"));
    temps.push(dir);
    // The corpus does not exist: the mkdir fails with ENOENT on every id it could try.
    const corpus = join(dir, "no-such-corpus");
    const code = [
      `import { claimRunDir } from ${JSON.stringify(RUN)};`,
      "try {",
      `  claimRunDir(${JSON.stringify(corpus)}, new Date(${JSON.stringify(STARTED_AT)}));`,
      '  console.log("claimed");',
      "} catch (error) {",
      "  console.log(error.code);",
      "}",
    ].join("\n");
    const ran = await child(code, 10_000);
    expect({ exitCode: ran.exitCode, stdout: ran.stdout }).toEqual({
      exitCode: 0,
      stdout: "ENOENT\n",
    });
    expect(existsSync(corpus)).toBe(false);
  }, 30_000);
});
