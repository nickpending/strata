import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const id = z.string().min(1);

export const worldFileSchema = z.strictObject({
  rules: z.strictObject({ offer_window_ticks: z.number().int().positive() }),
});

export const exitSchema = z.strictObject({ to: id, travel_ticks: z.number().int().positive() });

export const roomSchema = z.strictObject({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  exits: z.record(id, exitSchema),
});

export const tieSchema = z.strictObject({ target: id, kind: z.string().min(1), note: z.string() });

export const personSchema = z.strictObject({
  id,
  name: z.string().min(1),
  location: id,
  ties: z.array(tieSchema),
  /** The rooms the person knows of from boot. */
  places: z.array(id),
});

export const itemSchema = z.strictObject({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  holder: id,
});

export type RoomDef = z.infer<typeof roomSchema>;
export type PersonDef = z.infer<typeof personSchema>;
export type ItemDef = z.infer<typeof itemSchema>;
export type Tie = z.infer<typeof tieSchema>;

/** The validated world, each definition keyed by id and sorted by id. */
export type WorldDefs = {
  dir: string;
  offerWindowTicks: number;
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

function parseFile<T>(file: string, schema: z.ZodType<T>): T {
  let raw: unknown;
  try {
    raw = Bun.TOML.parse(readFileSync(file, "utf8"));
  } catch (error) {
    refuse(file, "", "toml-syntax", error instanceof Error ? error.message : String(error));
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue === undefined) refuse(file, "", "schema", "failed its schema");
    refuse(file, issue.path.map(String).join("."), issue.code, issue.message);
  }
  return parsed.data;
}

function listToml(dir: string): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    refuse(dir, "", "missing-directory", "the world directory has no such subdirectory");
  }
  return readdirSync(dir)
    .filter((name) => name.endsWith(".toml"))
    .sort()
    .map((name) => join(dir, name));
}

function loadKind<T extends { id: string }>(
  dir: string,
  schema: z.ZodType<T>,
): { file: string; def: T }[] {
  const loaded = listToml(dir).map((file) => ({ file, def: parseFile(file, schema) }));
  const seen = new Set<string>();
  for (const { file, def } of loaded) {
    if (seen.has(def.id)) refuse(file, "id", "unique-id", `id "${def.id}" is defined twice`);
    seen.add(def.id);
  }
  return loaded.sort((a, b) => a.def.id.localeCompare(b.def.id));
}

/** Cross-reference checks: every id a definition names must be defined. */
function checkReferences(
  rooms: { file: string; def: RoomDef }[],
  people: { file: string; def: PersonDef }[],
  items: { file: string; def: ItemDef }[],
): void {
  const roomIds = new Set(rooms.map((r) => r.def.id));
  const personIds = new Set(people.map((p) => p.def.id));
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
  }
  for (const { file, def } of items) {
    if (!personIds.has(def.holder)) {
      refuse(file, "holder", "holder-names-person", `holder "${def.holder}" names no person`);
    }
  }
}

/**
 * Read and validate every definition under `dir` (world.toml, rooms/, people/, items/). Nothing is
 * written. The first broken definition refuses the load, naming its file, path and rule.
 */
export function loadWorld(dir: string): LoadResult {
  try {
    const world = parseFile(join(dir, "world.toml"), worldFileSchema);
    const rooms = loadKind(join(dir, "rooms"), roomSchema);
    const people = loadKind(join(dir, "people"), personSchema);
    const items = loadKind(join(dir, "items"), itemSchema);
    checkReferences(rooms, people, items);
    return {
      ok: true,
      defs: {
        dir,
        offerWindowTicks: world.rules.offer_window_ticks,
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
