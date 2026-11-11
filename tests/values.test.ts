import { afterAll, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadWorld, type WorldDefs } from "../src/engine/definitions.ts";
import { boot, type Engine } from "../src/engine/engine.ts";

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");
const CATALOGUE = join(ROOT, "corpus", "experiments", "value-weighting-3", "catalogue.json");

type Catalogue = {
  importance_scale: Record<string, string>;
  values: { id: string; description: string }[];
};

const catalogue = (): Catalogue => JSON.parse(readFileSync(CATALOGUE, "utf8")) as Catalogue;

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "strata-values-"));
  temps.push(dir);
  return dir;
}

function committedDefs(): WorldDefs {
  const loaded = loadWorld(WORLD);
  if (!loaded.ok) throw new Error(loaded.refusal.message);
  return loaded.defs;
}

function fresh(): Engine {
  const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(tempDir(), "world.sqlite") });
  if (!booted.ok) throw new Error(booted.refusal.message);
  engines.push(booted.engine);
  return booted.engine;
}

/** Every file under `dir`, recursively. */
function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

describe("V1: the world's values and importance words are world/values.toml's, held in definitions", () => {
  test("defs.values and defs.importanceWords equal the catalogue entry for entry, and src/ names neither", () => {
    const defs = committedDefs();
    const { values, importance_scale } = catalogue();
    expect(defs.values).toHaveLength(10);
    expect(defs.values).toEqual(values.map(({ id, description }) => ({ id, description })));
    expect(defs.importanceWords).toEqual([0, 1, 2, 3, 4].map((n) => importance_scale[String(n)]));

    // No file under src/ writes a value id or an importance phrase as a literal.
    const words = [...values.map((v) => v.id), ...Object.values(importance_scale)];
    const literals = words.flatMap((word) => [`"${word}"`, `'${word}'`, `\`${word}\``]);
    const found = filesUnder(join(ROOT, "src")).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return literals
        .filter((literal) => text.includes(literal))
        .map((literal) => ({ file, literal }));
    });
    expect(found).toEqual([]);
    // The descriptions and the phrases are named nowhere in src/ either, quoted or not.
    const prose = [...values.map((v) => v.description), ...Object.values(importance_scale)].filter(
      (text) => text.includes(" "),
    );
    const named = filesUnder(join(ROOT, "src")).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return prose.filter((phrase) => text.includes(phrase)).map((phrase) => ({ file, phrase }));
    });
    expect(named).toEqual([]);
  });
});

describe("V2: a broken catalogue or importance table refuses boot naming file, path and rule", () => {
  type Broken = {
    name: string;
    /** The world-relative file the refusal names. */
    file: string;
    path: string;
    rule: string;
    /** Break the copy at `world`. */
    breakIt: (world: string) => void;
  };
  const edit = (world: string, file: string, change: (text: string) => string) => {
    const at = join(world, file);
    expect({ file, exists: existsSync(at) }).toEqual({ file, exists: true });
    const text = readFileSync(at, "utf8");
    const changed = change(text);
    expect(changed).not.toBe(text);
    writeFileSync(at, changed);
  };
  const cases: Broken[] = [
    {
      name: "values.toml removed",
      file: "values.toml",
      path: "",
      rule: "missing-file",
      breakIt: (world) => rmSync(join(world, "values.toml"), { force: true }),
    },
    {
      name: "world.toml removed",
      file: "world.toml",
      path: "",
      rule: "missing-file",
      breakIt: (world) => rmSync(join(world, "world.toml")),
    },
    {
      name: "a values.toml whose second entry repeats the first's id",
      file: "values.toml",
      path: "values.1.id",
      rule: "unique-value-id",
      breakIt: (world) =>
        edit(world, "values.toml", (text) =>
          text.replace('id = "stimulation"', 'id = "self_direction"'),
        ),
    },
    {
      name: "a values.toml with importance key 4 removed",
      file: "values.toml",
      path: "importance.4",
      rule: "invalid_type",
      breakIt: (world) => edit(world, "values.toml", (text) => text.replace(/^4 = .*\n/m, "")),
    },
    {
      name: "mux.toml's [values] missing benevolence",
      file: "people/mux.toml",
      path: "values.benevolence",
      rule: "value-rated",
      breakIt: (world) =>
        edit(world, "people/mux.toml", (text) => text.replace(/^benevolence = .*\n/m, "")),
    },
    {
      name: "mux.toml's [values] naming greed = 2",
      file: "people/mux.toml",
      path: "values.greed",
      rule: "value-names-catalogue",
      breakIt: (world) =>
        edit(world, "people/mux.toml", (text) =>
          text.replace(/^universalism = (.*)\n/m, "universalism = $1\ngreed = 2\n"),
        ),
    },
    {
      name: "mux.toml's power = 5",
      file: "people/mux.toml",
      path: "values.power",
      rule: "too_big",
      breakIt: (world) =>
        edit(world, "people/mux.toml", (text) => text.replace(/^power = .*$/m, "power = 5")),
    },
    {
      name: "mux.toml's power = 2.5",
      file: "people/mux.toml",
      path: "values.power",
      rule: "invalid_type",
      breakIt: (world) =>
        edit(world, "people/mux.toml", (text) => text.replace(/^power = .*$/m, "power = 2.5")),
    },
  ];

  for (const broken of cases) {
    test(broken.name, () => {
      const dir = tempDir();
      const world = join(dir, "world");
      cpSync(WORLD, world, { recursive: true });
      broken.breakIt(world);
      const dbPath = join(dir, "world.sqlite");
      const booted = boot(world, { tickMinutes: 10, dbPath });
      expect(booted.ok).toBe(false);
      if (booted.ok) return;
      expect(booted.refusal).toMatchObject({
        file: join(world, broken.file),
        path: broken.path,
        rule: broken.rule,
      });
      expect(existsSync(dbPath)).toBe(false);
    });
  }
});

const DRAFT_COMMENT =
  "# Draft importances (experiment-grade, drafted by the assistant, rudy 2026-11-10); derived from this world's ties.";

describe("V3: Rogue, Glitch and Mux carry the drafted importances, each file marked as a draft", () => {
  const ORDER = [
    "self_direction",
    "stimulation",
    "hedonism",
    "achievement",
    "power",
    "security",
    "conformity",
    "tradition",
    "benevolence",
    "universalism",
  ];
  const DRAFTS: Record<string, number[]> = {
    rogue: [3, 0, 1, 2, 4, 4, 1, 0, 1, 0],
    glitch: [2, 1, 1, 1, 0, 4, 3, 0, 1, 1],
    mux: [1, 0, 1, 3, 2, 2, 2, 1, 3, 1],
  };

  test("each person's importances in catalogue order are the draft's", () => {
    const defs = committedDefs();
    expect(defs.values.map((v) => v.id)).toEqual(ORDER);
    for (const [person, draft] of Object.entries(DRAFTS)) {
      const def = defs.people.find((p) => p.id === person);
      expect({ person, importances: ORDER.map((id) => def?.values[id]) }).toEqual({
        person,
        importances: draft,
      });
    }
  });

  test("each file's text holds the draft comment directly above its [values] table", () => {
    for (const person of Object.keys(DRAFTS)) {
      const text = readFileSync(join(WORLD, "people", `${person}.toml`), "utf8");
      expect({ person, marked: text.includes(`${DRAFT_COMMENT}\n[values]\n`) }).toEqual({
        person,
        marked: true,
      });
    }
  });
});

describe("V4: Engine.values reads a person's values from the definitions, never the state", () => {
  test("rogue's values in catalogue order with words; unchanged by an act and a step; no state row", () => {
    const engine = fresh();
    const { values, importance_scale } = catalogue();
    expect(typeof engine.values).toBe("function");
    const rogue = engine.values("rogue");
    expect(rogue.person).toBe("rogue");
    expect(rogue.name).toBe("Rogue");
    expect(rogue.values.map((v) => v.id)).toEqual(values.map((v) => v.id));
    const def = engine.defs.people.find((p) => p.id === "rogue");
    expect(rogue.values).toEqual(
      values.map(({ id, description }) => {
        const importance = def?.values[id] ?? -1;
        return { id, description, importance, words: importance_scale[String(importance)] };
      }),
    );
    expect(rogue.values.find((v) => v.id === "power")).toEqual({
      id: "power",
      description: "status and prestige, control or dominance over people and resources",
      importance: 4,
      words: "central to who this person is",
    });

    const before = Object.fromEntries(["glitch", "mux", "rogue"].map((p) => [p, engine.values(p)]));
    expect(
      engine.act({ actor: "rogue", verb: "whisper", target: "glitch", words: "psst" }).outcome,
    ).toBe("recorded");
    engine.step();
    for (const person of ["glitch", "mux", "rogue"]) {
      expect(engine.values(person)).toEqual(before[person]);
    }
    expect(engine.rows().filter((row) => (row.part as string) === "values")).toEqual([]);
    expect(engine.rows().length).toBeGreaterThan(0);
    expect(() => engine.values("data-shard")).toThrow('"data-shard" names no person');
  });
});
