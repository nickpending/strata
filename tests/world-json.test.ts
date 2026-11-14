import { afterAll, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import type { WorldDefs, WorldKind } from "../src/engine/definitions.ts";
import * as definitions from "../src/engine/definitions.ts";
import { boot, type Engine } from "../src/engine/engine.ts";

const { loadWorld } = definitions;

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");
const TWO_TICK = join(ROOT, "tests", "worlds", "two-tick");
const SCHEMAS = join(ROOT, "schemas");
const KINDS: WorldKind[] = ["world", "values", "room", "person", "item"];
const SCHEMA_FILES = KINDS.map((kind) => `${kind}.schema.json`);

const temps: string[] = [];
const engines: Engine[] = [];
afterAll(() => {
  for (const engine of engines) engine.close();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "strata-world-json-"));
  temps.push(dir);
  return dir;
}

/** A copy of world/ in a fresh temporary directory. */
function copyWorld(): string {
  const world = join(tempDir(), "world");
  cpSync(WORLD, world, { recursive: true });
  return world;
}

/** Every file under `dir`, recursively, as paths relative to it, sorted. */
function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort();
}

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));
const committed = (kind: WorldKind): unknown => readJson(join(SCHEMAS, `${kind}.schema.json`));

/** Every key of every object nested in `value`. */
function keysOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keysOf);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, inner]) => [key, ...keysOf(inner)]);
}

/** The 18 world files, each world-relative, with the kind whose schema it names. */
const WORLD_JSON: [string, WorldKind][] = [
  ["world.json", "world"],
  ["values.json", "values"],
  ["rooms/back-room.json", "room"],
  ["rooms/chrome-cassette.json", "room"],
  ["people/glitch.json", "person"],
  ["people/mux.json", "person"],
  ["people/rogue.json", "person"],
  ["items/charge-cell.json", "item"],
  ["items/data-shard.json", "item"],
  ["items/stimpak.json", "item"],
];
const TWO_TICK_JSON: [string, WorldKind][] = [
  ["world.json", "world"],
  ["values.json", "values"],
  ["rooms/hall.json", "room"],
  ["rooms/yard.json", "room"],
  ["people/bo.json", "person"],
  ["people/cy.json", "person"],
  ["people/mux.json", "person"],
  ["items/token.json", "item"],
];
const EVERY_FILE = [
  ...WORLD_JSON.map(([file, kind]) => ({ file: join(WORLD, file), kind })),
  ...TWO_TICK_JSON.map(([file, kind]) => ({ file: join(TWO_TICK, file), kind })),
];

const VALUES = [
  {
    id: "self_direction",
    description: "independent thought and action: choosing your own course, creating, exploring",
  },
  { id: "stimulation", description: "excitement, novelty and challenge in life" },
  { id: "hedonism", description: "pleasure and enjoyment for yourself" },
  {
    id: "achievement",
    description: "personal success through showing competence by the standards of those around you",
  },
  {
    id: "power",
    description: "status and prestige, control or dominance over people and resources",
  },
  {
    id: "security",
    description: "safety, harmony and stability of your society, your relationships and yourself",
  },
  {
    id: "conformity",
    description:
      "restraint of actions and impulses likely to upset or harm others or break social expectations",
  },
  {
    id: "tradition",
    description:
      "respect for and commitment to the customs and ideas your culture or faith provides",
  },
  {
    id: "benevolence",
    description: "preserving and enhancing the welfare of the people close to you",
  },
  {
    id: "universalism",
    description:
      "understanding, tolerance and protection for the welfare of all people and of nature",
  },
];

const IMPORTANCE_WORDS = [
  "does not matter to this person",
  "matters a little",
  "matters",
  "matters a lot",
  "central to who this person is",
];

const EVEN = {
  self_direction: 2,
  stimulation: 2,
  hedonism: 2,
  achievement: 2,
  power: 2,
  security: 2,
  conformity: 2,
  tradition: 2,
  benevolence: 2,
  universalism: 2,
};

/** world/ as its TOML files held it. */
const WORLD_DEFS: Authored = {
  offerWindowTicks: 2,
  values: VALUES,
  importanceWords: IMPORTANCE_WORDS,
  rooms: [
    {
      id: "back-room",
      name: "Back Room",
      description: "A dim room stacked with crates and dead screens.",
      exits: { west: { to: "chrome-cassette", travel_ticks: 1 } },
    },
    {
      id: "chrome-cassette",
      name: "The Chrome Cassette",
      description: "A cramped bar thick with smoke and bass.",
      exits: { east: { to: "back-room", travel_ticks: 1 } },
    },
  ],
  people: [
    {
      id: "glitch",
      name: "Glitch",
      location: "chrome-cassette",
      places: ["back-room", "chrome-cassette"],
      ties: [
        {
          target: "rogue",
          kind: "lying low on her tolerance",
          note: "He knows she is weighing him and that he is a danger to her, and is careful never to give her a reason to decide he is not worth it.",
        },
      ],
      values: {
        self_direction: 2,
        stimulation: 1,
        hedonism: 1,
        achievement: 1,
        power: 0,
        security: 4,
        conformity: 3,
        tradition: 0,
        benevolence: 1,
        universalism: 1,
      },
    },
    {
      id: "mux",
      name: "Mux",
      location: "back-room",
      places: ["back-room", "chrome-cassette"],
      ties: [
        {
          target: "glitch",
          kind: "a regular for parts",
          note: "The netrunner who keeps his failing refurb gear limping: one of Mux's regulars for cells and parts, and the closest thing he has to a friend who talks back.",
        },
      ],
      values: {
        self_direction: 1,
        stimulation: 0,
        hedonism: 1,
        achievement: 3,
        power: 2,
        security: 2,
        conformity: 2,
        tradition: 1,
        benevolence: 3,
        universalism: 1,
      },
    },
    {
      id: "rogue",
      name: "Rogue",
      location: "chrome-cassette",
      places: ["back-room", "chrome-cassette"],
      ties: [
        {
          target: "glitch",
          kind: "wary tolerance",
          note: "The hot runner lying low in her grid. She lets him, for now, and weighs the whole time whether he is worth the heat he drags toward her door.",
        },
      ],
      values: {
        self_direction: 3,
        stimulation: 0,
        hedonism: 1,
        achievement: 2,
        power: 4,
        security: 4,
        conformity: 1,
        tradition: 0,
        benevolence: 1,
        universalism: 0,
      },
    },
  ],
  items: [
    {
      id: "charge-cell",
      name: "charge cell",
      description:
        "A scuffed charge cell, draw sloshing behind cracked casing: money you can hold, life you can spend.",
      holder: "mux",
    },
    {
      id: "data-shard",
      name: "data shard",
      description:
        "A sliver of black-market storage, contacts scored from a thousand jacks. Whatever is on it, someone wants it.",
      holder: "rogue",
    },
    {
      id: "stimpak",
      name: "stimpak",
      description:
        "A street-grade stim injector, its charge gauge flickering amber. One jolt of borrowed steadiness.",
      holder: "glitch",
    },
  ],
};

/** tests/worlds/two-tick as its TOML files held it. */
const TWO_TICK_DEFS: Authored = {
  offerWindowTicks: 2,
  values: VALUES,
  importanceWords: IMPORTANCE_WORDS,
  rooms: [
    {
      id: "hall",
      name: "Hall",
      description: "A long hall that smells of rain.",
      exits: { south: { to: "yard", travel_ticks: 2 } },
    },
    {
      id: "yard",
      name: "Yard",
      description: "A bare yard under a flickering lamp.",
      exits: { north: { to: "hall", travel_ticks: 2 } },
    },
  ],
  people: [
    { id: "bo", name: "Bo", location: "hall", places: ["hall", "yard"], ties: [], values: EVEN },
    { id: "cy", name: "Cy", location: "hall", places: ["hall", "yard"], ties: [], values: EVEN },
    { id: "mux", name: "Mux", location: "yard", places: ["hall", "yard"], ties: [], values: EVEN },
  ],
  items: [{ id: "token", name: "token", description: "A worn brass token.", holder: "bo" }],
};

/** What C1 compares: the loaded definitions, each person by the fields the TOML files authored. */
function authored(defs: WorldDefs) {
  return {
    offerWindowTicks: defs.offerWindowTicks,
    values: defs.values,
    importanceWords: defs.importanceWords,
    rooms: defs.rooms,
    people: defs.people.map(({ id, name, location, places, ties, values }) => ({
      id,
      name,
      location,
      places,
      ties,
      values,
    })),
    items: defs.items,
  };
}

type Authored = ReturnType<typeof authored>;

const AUTHORED: [name: string, dir: string, defs: Authored][] = [
  ["world/", WORLD, WORLD_DEFS],
  ["tests/worlds/two-tick", TWO_TICK, TWO_TICK_DEFS],
];

describe("C1: the loaded definitions are what the TOML files held", () => {
  for (const [name, dir, expected] of AUTHORED) {
    test(`${name} loads to the hand-written literal`, () => {
      const loaded = loadWorld(dir);
      if (!loaded.ok) throw new Error(loaded.refusal.message);
      expect(authored(loaded.defs)).toEqual(expected);
    });
  }
});

describe("C3: $schema and $comment reach no definition; an unknown root key still refuses", () => {
  test("a world whose every file carries $schema and $comment loads with neither key in any definition or the snapshot", () => {
    const world = copyWorld();
    const annotated = filesUnder(world).filter((file) => {
      if (!file.endsWith(".json")) return false;
      const at = join(world, file);
      const json = readJson(at) as Record<string, unknown>;
      if (typeof json.$schema !== "string") return false;
      writeFileSync(at, JSON.stringify({ ...json, $comment: `annotated ${file}` }));
      return true;
    });
    expect(annotated).toEqual(WORLD_JSON.map(([file]) => file).sort());
    const loaded = loadWorld(world);
    if (!loaded.ok) throw new Error(loaded.refusal.message);
    expect(keysOf(loaded.defs).filter((key) => key.startsWith("$"))).toEqual([]);

    const booted = boot(world, { tickMinutes: 10, dbPath: join(tempDir(), "world.sqlite") });
    if (!booted.ok) throw new Error(booted.refusal.message);
    engines.push(booted.engine);
    expect(keysOf(booted.engine.snapshot()).filter((key) => key.startsWith("$"))).toEqual([]);
  });

  test("a room file with a root key extra refuses naming rooms/back-room.json, an empty path and unrecognized_keys", () => {
    const world = copyWorld();
    const file = join(world, "rooms", "back-room.json");
    expect(existsSync(file)).toBe(true);
    const json = readJson(file) as Record<string, unknown>;
    writeFileSync(file, JSON.stringify({ ...json, extra: 1 }));
    const loaded = loadWorld(world);
    expect(loaded.ok).toBe(false);
    if (loaded.ok) return;
    expect(loaded.refusal).toMatchObject({ file, path: "", rule: "unrecognized_keys" });
  });
});

describe("C4: a file that is not JSON refuses boot as json-syntax", () => {
  test("an items/stimpak.json cut off mid-object refuses naming it, an empty path and json-syntax, and creates no database", () => {
    const dir = tempDir();
    const world = join(dir, "world");
    cpSync(WORLD, world, { recursive: true });
    const file = join(world, "items", "stimpak.json");
    expect(existsSync(file)).toBe(true);
    const text = readFileSync(file, "utf8");
    const cut = text.slice(0, text.indexOf('"holder"'));
    expect(cut.length).toBeGreaterThan(1);
    writeFileSync(file, cut);

    const dbPath = join(dir, "world.sqlite");
    const booted = boot(world, { tickMinutes: 10, dbPath });
    expect(booted.ok).toBe(false);
    if (booted.ok) return;
    expect(booted.refusal).toMatchObject({ file, path: "", rule: "json-syntax" });
    expect(booted.refusal.message).toContain("items/stimpak.json");
    expect(existsSync(dbPath)).toBe(false);
  });
});

describe("C6: the committed schemas are worldJsonSchemas(), and drift shows", () => {
  test("schemas/ holds one file per WORLD_FILES kind and no other, each equal to worldJsonSchemas() for its kind", () => {
    expect(Object.keys(definitions.WORLD_FILES).sort()).toEqual([...KINDS].sort());
    const schemas = definitions.worldJsonSchemas();
    expect(Object.keys(schemas).sort()).toEqual([...KINDS].sort());
    expect(readdirSync(SCHEMAS).sort()).toEqual([...SCHEMA_FILES].sort());
    for (const kind of KINDS) {
      expect({ kind, schema: committed(kind) }).toEqual({ kind, schema: schemas[kind] });
    }
  });

  test("a definitions.ts whose description or rule changed, with schemas not rerun, differs from the committed schemas", async () => {
    const dir = tempDir();
    symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"), "dir");
    const source = readFileSync(join(ROOT, "src", "engine", "definitions.ts"), "utf8");
    const variants: Record<string, string> = {
      unchanged: source,
      description: source.replace("lapses unanswered", "lapses unheard"),
      rule: source.replace(".max(4)", ".max(5)"),
    };
    const matches: Record<string, boolean> = {};
    for (const [name, text] of Object.entries(variants)) {
      if (name !== "unchanged")
        expect({ name, changed: text !== source }).toEqual({ name, changed: true });
      const file = join(dir, `${name}.ts`);
      writeFileSync(file, text);
      const copy = (await import(file)) as { worldJsonSchemas: () => Record<WorldKind, unknown> };
      const schemas = copy.worldJsonSchemas();
      matches[name] = KINDS.every((kind) => Bun.deepEquals(schemas[kind], committed(kind)));
    }
    expect(matches).toEqual({ unchanged: true, description: false, rule: false });
  });
});

describe("C7: write-schemas writes exactly the five schemas", () => {
  test("run on an empty directory, it holds the five <kind>.schema.json, each equal to worldJsonSchemas()", () => {
    const out = tempDir();
    const run = Bun.spawnSync(
      [process.execPath, "run", join(ROOT, "src", "engine", "write-schemas.ts"), "--out", out],
      { cwd: ROOT, stdout: "pipe", stderr: "pipe" },
    );
    expect({ exitCode: run.exitCode, stderr: run.stderr.toString() }).toEqual({
      exitCode: 0,
      stderr: "",
    });
    expect(readdirSync(out).sort()).toEqual([
      "item.schema.json",
      "person.schema.json",
      "room.schema.json",
      "values.schema.json",
      "world.schema.json",
    ]);
    const schemas = definitions.worldJsonSchemas();
    for (const kind of KINDS) {
      const written = readJson(join(out, `${kind}.schema.json`));
      expect({ kind, schema: written }).toEqual({ kind, schema: schemas[kind] });
    }
  });
});

/** The WORLD_FILES kind a world-relative file belongs to: its file name, else its directory. */
function kindOf(file: string): string | undefined {
  return Object.entries(definitions.WORLD_FILES).find(([, entry]) =>
    "file" in entry ? entry.file === file : entry.dir === dirname(file),
  )?.[0];
}

describe("C8: each world file names its kind's committed schema in $schema", () => {
  test("all 18 files exist, and each $schema resolves to the schema WORLD_FILES assigns its file or directory", () => {
    const named = [
      ...WORLD_JSON.map(([file, kind]) => ({ dir: WORLD, file, kind })),
      ...TWO_TICK_JSON.map(([file, kind]) => ({ dir: TWO_TICK, file, kind })),
    ].map(({ dir, file, kind }) => {
      const at = join(dir, file);
      if (!existsSync(at)) return { at, kind, exists: false };
      const { $schema } = readJson(at) as { $schema?: unknown };
      const target = typeof $schema === "string" ? resolve(dirname(at), $schema) : undefined;
      return {
        at,
        kind: kindOf(file),
        exists: true,
        schema: target,
        schemaExists: target !== undefined && existsSync(target),
      };
    });
    expect(named).toHaveLength(18);
    expect(named).toEqual(
      EVERY_FILE.map(({ file, kind }) => ({
        at: file,
        kind,
        exists: true,
        schema: join(SCHEMAS, `${kind}.schema.json`),
        schemaExists: true,
      })),
    );
  });
});

describe("C9: no TOML file remains under world/ or tests/worlds/", () => {
  test("no file under either, listed recursively, ends .toml", () => {
    const listed = [WORLD, join(ROOT, "tests", "worlds")].flatMap((dir) =>
      filesUnder(dir).map((file) => join(dir, file)),
    );
    expect(listed.length).toBeGreaterThan(0);
    expect(listed.filter((file) => file.endsWith(".toml"))).toEqual([]);
  });
});

describe("C10: the TOML comments that explained fields are schema descriptions", () => {
  test("offer_window_ticks, importance, a person's values and values_draft carry their explanations", () => {
    const schemas = definitions.worldJsonSchemas();
    const rated = expect.stringMatching(
      /every value is rated with an integer from 0 to 4, read by the importance words/i,
    );
    expect(schemas.world).toMatchObject({
      properties: {
        rules: {
          properties: {
            offer_window_ticks: {
              description: expect.stringMatching(
                /ticks an offer stays open before it lapses unanswered/i,
              ),
            },
          },
        },
      },
    });
    expect(schemas.values).toMatchObject({ properties: { importance: { description: rated } } });
    expect(schemas.person).toMatchObject({
      properties: {
        values: { description: rated },
        values_draft: { description: expect.stringMatching(/importances are a draft/i) },
      },
    });
  });
});

describe("C11: the TOML comments that recorded provenance are $comment", () => {
  test("both values.json cite Schwartz (2012); rogue, glitch and mux record who drafted their importances", () => {
    for (const dir of [WORLD, TWO_TICK]) {
      const file = join(dir, "values.json");
      const { $comment } = readJson(file) as { $comment?: string };
      expect({ file, $comment }).toEqual({
        file,
        $comment: expect.stringContaining(
          "Schwartz, S. H. (2012), An Overview of the Schwartz Theory of Basic Values",
        ),
      });
    }
    for (const person of ["rogue", "glitch", "mux"]) {
      const { $comment } = readJson(join(WORLD, "people", `${person}.json`)) as {
        $comment?: string;
      };
      expect({ person, $comment }).toEqual({
        person,
        $comment: expect.stringContaining(
          "drafted by the assistant, experiment-grade, rudy 2026-11-10, derived from this world's ties",
        ),
      });
    }
  });
});

describe("C12: every corpus script's world/ import names a file that exists", () => {
  test("each import specifier under world/ in corpus/experiments resolves from its file", () => {
    const experiments = join(ROOT, "corpus", "experiments");
    const specifier = /(?:import\s*\(\s*|from\s+)["']([^"']*\/world\/[^"']*)["']/g;
    const imports = filesUnder(experiments)
      .filter((file) => file.endsWith(".ts"))
      .flatMap((file) => {
        const at = join(experiments, file);
        return [...readFileSync(at, "utf8").matchAll(specifier)].map(([, named = ""]) => ({
          file,
          named,
          exists: existsSync(resolve(dirname(at), named)),
        }));
      });
    expect(imports).toHaveLength(16);
    expect(imports.filter((entry) => !entry.exists)).toEqual([]);
  });
});

describe("C13: the README's map says the world is JSON", () => {
  test("the world/ row says JSON, a schemas/ row names the derived JSON Schemas, and no line names TOML", () => {
    const lines = readFileSync(join(ROOT, "README.md"), "utf8").split("\n");
    const row = (path: string) => lines.find((line) => line.startsWith(`| \`${path}\` |`));
    expect(row("world/")).toContain("JSON");
    expect(row("schemas/")).toMatch(/JSON Schemas .*derived from the loader's rules/);
    expect(lines.filter((line) => /toml/i.test(line))).toEqual([]);
  });
});

describe("C14: the parked npc-standing notes name the JSON world files", () => {
  test("parked.md names world/values.json and world.json, and no .toml file", () => {
    const text = readFileSync(join(ROOT, "docs", "work", "npc-standing", "parked.md"), "utf8");
    expect(text).toContain("world/values.json");
    expect(text).toContain("world.json");
    expect(text.match(/\S*\.toml\b/g)).toBeNull();
  });
});

describe("C16: ajv runs the committed schemas", () => {
  test("every world file validates against its kind's schema, and mux with power 5 fails at /values/power on maximum", () => {
    const ajv = new Ajv2020({ allErrors: true });
    const validate = Object.fromEntries(
      KINDS.map((kind) => [kind, ajv.compile(committed(kind) as object)]),
    );
    const results = EVERY_FILE.map(({ file, kind }) => {
      const check = validate[kind];
      const valid = check?.(readJson(file)) ?? false;
      return { file, valid, errors: check?.errors ?? null };
    });
    expect(results).toHaveLength(18);
    expect(results).toEqual(EVERY_FILE.map(({ file }) => ({ file, valid: true, errors: null })));

    const mux = readJson(join(WORLD, "people", "mux.json")) as { values: Record<string, number> };
    mux.values.power = 5;
    const person = validate.person;
    expect(person?.(mux)).toBe(false);
    expect(person?.errors).toContainEqual(
      expect.objectContaining({ instancePath: "/values/power", keyword: "maximum" }),
    );
  });
});
