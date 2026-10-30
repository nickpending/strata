import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { TICK_MINUTES_FLAG } from "../engine/engine.ts";
import { HOSTNAME, startServer } from "./routes.ts";

const USAGE = `usage: bun run src/server/main.ts ${TICK_MINUTES_FLAG} <n> [--world world] [--db ./strata.sqlite] [--port 4800]`;

function fail(message: string): never {
  console.error(`strata: ${message}\n${USAGE}`);
  process.exit(2);
}

let values: { "tick-minutes"?: string; world: string; db: string; port: string };
try {
  values = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "tick-minutes": { type: "string" },
      world: { type: "string", default: "world" },
      db: { type: "string", default: "./strata.sqlite" },
      port: { type: "string", default: "4800" },
    },
    strict: true,
  }).values;
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const port = Number(values.port);
if (!Number.isInteger(port) || port < 0) fail(`--port must be a port number, got "${values.port}"`);

const tickArg = values["tick-minutes"];
const started = startServer({
  world: resolve(values.world),
  dbPath: resolve(values.db),
  tickMinutes: tickArg === undefined ? undefined : Number(tickArg),
  port,
});
if (!started.ok) fail(started.refusal.message);

console.log(
  `strata bench on http://${HOSTNAME}:${started.server.port}/ (one tick = ${tickArg} minutes)`,
);
