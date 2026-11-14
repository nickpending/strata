import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const id = z.string().min(1);

export const worldFileSchema = z.strictObject({
  rules: z.strictObject({
    offer_window_ticks: z
      .number()
      .int()
      .positive()
      .describe("Ticks an offer stays open before it lapses unanswered."),
  }),
});

export const exitSchema = z.strictObject({ to: id, travel_ticks: z.number().int().positive() });

export const roomSchema = z.strictObject({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  exits: z.record(id, exitSchema),
});

const phrase = z.string().min(1);

/**
 * values.json: the words for each importance from 0 to 4, and the world's values in their authored
 * order. Every value id and description is data read from this file, never named in code.
 */
export const valuesFileSchema = z.strictObject({
  importance: z
    .strictObject({ "0": phrase, "1": phrase, "2": phrase, "3": phrase, "4": phrase })
    .describe(
      "The words for each importance. Every value is rated with an integer from 0 to 4, read by the importance words.",
    ),
  values: z.array(z.strictObject({ id, description: phrase })).min(1),
});

export const tieSchema = z.strictObject({ target: id, kind: z.string().min(1), note: z.string() });

export const personSchema = z.strictObject({
  id,
  name: z.string().min(1),
  location: id,
  ties: z.array(tieSchema),
  /** The rooms the person knows of from boot. */
  places: z.array(id),
  values: z
    .record(id, z.number().int().min(0).max(4))
    .describe(
      "How much each catalogue value matters to the person. Every value is rated with an integer from 0 to 4, read by the importance words.",
    ),
  values_draft: z
    .boolean()
    .optional()
    .describe("True when this person's importances are a draft, not yet settled."),
});

export const itemSchema = z.strictObject({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  holder: id,
});

/** The keys any world file may carry at its root for an editor or a reader; the loader drops them. */
const annotations = {
  $schema: z.string().optional().describe("The JSON Schema this file follows, for an editor."),
  $comment: z.string().min(1).optional().describe("A note for whoever reads this file."),
};

type Annotated<T> = T & { $schema?: string; $comment?: string };

/**
 * Every kind of world file: the one file it is, or the directory holding one file per definition,
 * and the schema each file is checked against, its kind's rules plus the root annotations. The
 * loader and `worldJsonSchemas`, which schemas/ is written from, read this table alone.
 */
export const WORLD_FILES = {
  world: { file: "world.json", schema: worldFileSchema.extend(annotations) },
  values: { file: "values.json", schema: valuesFileSchema.extend(annotations) },
  room: { dir: "rooms", schema: roomSchema.extend(annotations) },
  person: { dir: "people", schema: personSchema.extend(annotations) },
  item: { dir: "items", schema: itemSchema.extend(annotations) },
} as const;

export type WorldKind = keyof typeof WORLD_FILES;

export type WorldJsonSchema = z.core.JSONSchema.BaseSchema;

/** Each kind's JSON Schema, derived from its WORLD_FILES schema; `bun run schemas` commits them. */
export function worldJsonSchemas(): Record<WorldKind, WorldJsonSchema> {
  return Object.fromEntries(
    Object.entries(WORLD_FILES).map(([kind, { schema }]): [string, WorldJsonSchema] => [
      kind,
      z.toJSONSchema(schema),
    ]),
  ) as Record<WorldKind, WorldJsonSchema>;
}

export type RoomDef = z.infer<typeof roomSchema>;
export type PersonDef = z.infer<typeof personSchema>;
export type ItemDef = z.infer<typeof itemSchema>;
export type Tie = z.infer<typeof tieSchema>;
export type ValueDef = { id: string; description: string };

/** The validated world, each definition keyed by id and sorted by id. */
export type WorldDefs = {
  dir: string;
  offerWindowTicks: number;
  /** The world's values, in values.json's order. */
  values: ValueDef[];
  /** The words for each importance, indexed 0 to 4. */
  importanceWords: string[];
  rooms: RoomDef[];
  people: PersonDef[];
  items: ItemDef[];
};

/** Why a world directory cannot boot: the file, the path inside it, and the rule it broke. */
export type DefinitionRefusal = { file: string; path: string; rule: string; message: string };

export type LoadResult = { ok: true; defs: WorldDefs } | { ok: false; refusal: DefinitionRefusal };

class Refused extends Error {
  constructor(readonly refusal: DefinitionRefusal) {
    super(refusal.message);
  }
}

function refuse(file: string, path: string, rule: string, message: string): never {
  throw new Refused({ file, path, rule, message: `${file} ${path || "(root)"}: ${message}` });
}

/** `file` parsed as JSON and checked by `schema`, its root annotations dropped. */
function parseFile<T>(file: string, schema: z.ZodType<Annotated<T>>): T {
  if (!existsSync(file)) refuse(file, "", "missing-file", "the world directory has no such file");
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    refuse(file, "", "json-syntax", error instanceof Error ? error.message : String(error));
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue === undefined) refuse(file, "", "schema", "failed its schema");
    refuse(file, issue.path.map(String).join("."), issue.code, issue.message);
  }
  const def = parsed.data;
  delete def.$schema;
  delete def.$comment;
  return def;
}

function listJson(dir: string): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    refuse(dir, "", "missing-directory", "the world directory has no such subdirectory");
  }
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => join(dir, name));
}

function loadKind<T extends { id: string }>(
  dir: string,
  schema: z.ZodType<Annotated<T>>,
): { file: string; def: T }[] {
  const loaded = listJson(dir).map((file) => ({ file, def: parseFile(file, schema) }));
  const seen = new Set<string>();
  for (const { file, def } of loaded) {
    if (seen.has(def.id)) refuse(file, "id", "unique-id", `id "${def.id}" is defined twice`);
    seen.add(def.id);
  }
  return loaded.sort((a, b) => a.def.id.localeCompare(b.def.id));
}

/** values.json read and checked: its values in file order, each id once, and the importance words. */
function loadValues(file: string): { values: ValueDef[]; importanceWords: string[] } {
  const parsed = parseFile(file, WORLD_FILES.values.schema);
  const seen = new Set<string>();
  parsed.values.forEach(({ id }, i) => {
    if (seen.has(id)) {
      refuse(file, `values.${i}.id`, "unique-value-id", `value "${id}" is defined twice`);
    }
    seen.add(id);
  });
  const { importance } = parsed;
  return {
    values: parsed.values,
    importanceWords: [
      importance["0"],
      importance["1"],
      importance["2"],
      importance["3"],
      importance["4"],
    ],
  };
}

/** Cross-reference checks: every id a definition names must be defined, and every value rated. */
function checkReferences(
  values: ValueDef[],
  rooms: { file: string; def: RoomDef }[],
  people: { file: string; def: PersonDef }[],
  items: { file: string; def: ItemDef }[],
): void {
  const roomIds = new Set(rooms.map((r) => r.def.id));
  const personIds = new Set(people.map((p) => p.def.id));
  const valueIds = new Set(values.map((v) => v.id));
  for (const { file, def } of rooms) {
    for (const [exit, { to }] of Object.entries(def.exits)) {
      if (!roomIds.has(to)) {
        refuse(
          file,
          `exits.${exit}.to`,
          "exit-to-names-room",
          `exit "${exit}" leads to "${to}", which names no room`,
        );
      }
    }
  }
  for (const { file, def } of people) {
    if (!roomIds.has(def.location)) {
      refuse(file, "location", "location-names-room", `location "${def.location}" names no room`);
    }
    def.ties.forEach((tie, i) => {
      if (!personIds.has(tie.target)) {
        refuse(
          file,
          `ties.${i}.target`,
          "tie-target-names-person",
          `tie target "${tie.target}" names no person`,
        );
      }
    });
    def.places.forEach((place, i) => {
      if (!roomIds.has(place)) {
        refuse(file, `places.${i}`, "place-names-room", `place "${place}" names no room`);
      }
    });
    for (const value of Object.keys(def.values)) {
      if (!valueIds.has(value)) {
        refuse(
          file,
          `values.${value}`,
          "value-names-catalogue",
          `value "${value}" names no value in values.json`,
        );
      }
    }
    for (const { id: value } of values) {
      if (!Object.hasOwn(def.values, value)) {
        refuse(file, `values.${value}`, "value-rated", `value "${value}" is not rated`);
      }
    }
  }
  for (const { file, def } of items) {
    if (!personIds.has(def.holder)) {
      refuse(file, "holder", "holder-names-person", `holder "${def.holder}" names no person`);
    }
  }
}

/**
 * Read and validate every definition under `dir` (world.json, values.json, rooms/, people/,
 * items/). Nothing is written. The first broken definition refuses the load, naming its file, path
 * and rule.
 */
export function loadWorld(dir: string): LoadResult {
  try {
    const world = parseFile(join(dir, WORLD_FILES.world.file), WORLD_FILES.world.schema);
    const { values, importanceWords } = loadValues(join(dir, WORLD_FILES.values.file));
    const rooms = loadKind(join(dir, WORLD_FILES.room.dir), WORLD_FILES.room.schema);
    const people = loadKind(join(dir, WORLD_FILES.person.dir), WORLD_FILES.person.schema);
    const items = loadKind(join(dir, WORLD_FILES.item.dir), WORLD_FILES.item.schema);
    checkReferences(values, rooms, people, items);
    return {
      ok: true,
      defs: {
        dir,
        offerWindowTicks: world.rules.offer_window_ticks,
        values,
        importanceWords,
        rooms: rooms.map((r) => r.def),
        people: people.map((p) => p.def),
        items: items.map((i) => i.def),
      },
    };
  } catch (error) {
    if (error instanceof Refused) return { ok: false, refusal: error.refusal };
    throw error;
  }
}
