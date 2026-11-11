import { afterAll, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
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

describe("V11: the harness's own source, copied alone, reaches nothing outside itself", () => {
  const { copy, modules } = copyAlone();
  // The source alone, under the harness's own compiler options: what the harness ships.
  writeFileSync(
    join(copy, "tsconfig.src.json"),
    JSON.stringify({ extends: "./tsconfig.json", include: ["src/**/*.ts"] }),
  );

  test("its source typechecks, and every file that program lists lies under the copy or the linked node_modules", async () => {
    const checked = await run([process.execPath, TSC, "--noEmit", "-p", "tsconfig.src.json"], copy);
    expect({ exitCode: checked.exitCode, output: checked.output }).toEqual({
      exitCode: 0,
      output: "",
    });
    const ran = await run(
      [process.execPath, TSC, "--listFilesOnly", "-p", "tsconfig.src.json"],
      copy,
    );
    expect(ran.exitCode).toBe(0);
    const listed = ran.output.split("\n").filter((line) => line.trim() !== "");
    expect(listed.some((file) => file.endsWith(`${sep}src${sep}jev.ts`))).toBe(true);
    const outside = listed.filter((file) => {
      const real = existsSync(file) ? realpathSync(file) : file;
      return !real.startsWith(copy + sep) && !real.startsWith(modules + sep);
    });
    expect(outside).toEqual([]);
  }, 120_000);
});

/** Every value a manifest gives under a key named `name`, with the path of keys that leads to it. */
function named(value: unknown, name: string, path: string[] = []): [string, unknown][] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, inner]) => [
    ...(key === name ? ([[[...path, key].join("."), inner]] as [string, unknown][]) : []),
    ...named(inner, name, [...path, key]),
  ]);
}

describe("H8: every version the root and the harness share has one home, the workspace catalog", () => {
  const SHARED = [
    "playwright",
    "zod",
    "@voidwire/apiconf",
    "typescript",
    "bun-types",
    "@biomejs/biome",
  ];
  const read = (file: string): unknown => JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  const manifests = {
    "package.json": read("package.json"),
    "harness/package.json": read("harness/package.json"),
  };

  test("each shared dependency is versioned in the catalog alone and named as catalog: everywhere else", () => {
    const catalog = (
      manifests["package.json"] as { workspaces?: { catalog?: Record<string, string> } }
    ).workspaces?.catalog;
    for (const name of SHARED) {
      expect({ name, version: catalog?.[name] }).toEqual({
        name,
        version: expect.stringMatching(/^\d/),
      });
    }
    const elsewhere = Object.entries(manifests).flatMap(([file, manifest]) =>
      SHARED.flatMap((name) =>
        named(manifest, name)
          .filter(([path]) => path !== `workspaces.catalog.${name}`)
          .map(([path, value]) => ({ file, path, value })),
      ),
    );
    // Every name both packages use is named by each, so each shared dependency is named somewhere.
    for (const name of SHARED) {
      expect(elsewhere.some((entry) => entry.path.endsWith(`.${name}`))).toBe(true);
    }
    expect(elsewhere.filter((entry) => entry.value !== "catalog:")).toEqual([]);
  });

  test("the install is hoisted: bunfig pins the linker and harness/ holds no node_modules", () => {
    const bunfig = Bun.TOML.parse(readFileSync(join(ROOT, "bunfig.toml"), "utf8")) as {
      install?: { linker?: string };
    };
    expect(bunfig.install?.linker).toBe("hoisted");
    expect(existsSync(join(ROOT, "harness", "node_modules"))).toBe(false);
  });
});
