import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { worldJsonSchemas } from "./definitions.ts";

const USAGE = "usage: bun run src/engine/write-schemas.ts [--out schemas]";

let out: string;
try {
  out = resolve(
    parseArgs({
      args: Bun.argv.slice(2),
      options: { out: { type: "string", default: "schemas" } },
      strict: true,
    }).values.out,
  );
} catch (error) {
  console.error(
    `write-schemas: ${error instanceof Error ? error.message : String(error)}\n${USAGE}`,
  );
  process.exit(2);
}

mkdirSync(out, { recursive: true });
for (const [kind, schema] of Object.entries(worldJsonSchemas())) {
  const file = join(out, `${kind}.schema.json`);
  writeFileSync(file, `${JSON.stringify(schema, null, 2)}\n`);
  console.log(`wrote ${file}`);
}
