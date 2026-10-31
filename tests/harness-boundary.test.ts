import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

const ROOT = join(import.meta.dir, "..");
const TSC = join(ROOT, "node_modules", "typescript", "bin", "tsc");

const temps: string[] = [];
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/**
 * harness/ as it is on disk, without any node_modules of its own, copied alone into a fresh
 * directory with nothing beside it, and the root's installed node_modules linked in as its own.
 */
function copyAlone(): { copy: string; modules: string } {
  const dir = mkdtempSync(join(tmpdir(), "strata-harness-copy-"));
  temps.push(dir);
  const copy = join(dir, "harness");
  const source = join(ROOT, "harness");
  cpSync(source, copy, {
    recursive: true,
    filter: (path) => !path.slice(source.length).split(sep).includes("node_modules"),
  });
  symlinkSync(join(ROOT, "node_modules"), join(copy, "node_modules"), "dir");
  return { copy: realpathSync(copy), modules: realpathSync(join(ROOT, "node_modules")) };
}

async function run(cmd: string[], cwd: string) {
  const proc = Bun.spawn(cmd, { cwd, env: process.env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { exitCode, output: `${stdout}${stderr}` };
}

describe("H1: the harness package reaches nothing outside itself and its dependencies", () => {
  const { copy, modules } = copyAlone();

  test("copied alone, its typecheck passes", async () => {
    const ran = await run([process.execPath, "run", "typecheck"], copy);
    expect({ exitCode: ran.exitCode, output: ran.output }).toEqual({
      exitCode: 0,
      output: expect.any(String),
    });
  }, 120_000);

  test("copied alone, its tests pass", async () => {
    const ran = await run([process.execPath, "test"], copy);
    expect({ exitCode: ran.exitCode, output: ran.exitCode === 0 ? "" : ran.output }).toEqual({
      exitCode: 0,
      output: "",
    });
  }, 120_000);

  test("every file its program lists lies under the copy or the linked node_modules", async () => {
    const ran = await run([process.execPath, TSC, "--listFilesOnly", "-p", "tsconfig.json"], copy);
    expect(ran.exitCode).toBe(0);
    const listed = ran.output.split("\n").filter((line) => line.trim() !== "");
    expect(listed.length).toBeGreaterThan(0);
    const outside = listed.filter((file) => {
      const real = existsSync(file) ? realpathSync(file) : file;
      return !real.startsWith(copy + sep) && !real.startsWith(modules + sep);
    });
    expect(outside).toEqual([]);
  }, 120_000);

  test("no file of the old player remains under src/player", () => {
    expect(existsSync(join(ROOT, "src", "player"))).toBe(false);
  });
});
