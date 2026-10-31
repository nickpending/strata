import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { TICK_MINUTES_FLAG } from "../engine/engine.ts";
import { runDriver } from "./run.ts";

const USAGE = `usage: bun run src/driver/main.ts --seed <n> --actions <n> ${TICK_MINUTES_FLAG} <n> [--world world] [--step-every 5]`;

function usage(message: string): never {
  console.error(`driver: ${message}\n${USAGE}`);
  process.exit(2);
}

/** `raw` as a whole number of at least `min`, or a usage error naming `flag`. */
function whole(flag: string, raw: string | undefined, min: number): number {
  if (raw === undefined) usage(`--${flag} is required`);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    usage(`--${flag} must be a whole number of at least ${min}, got "${raw}"`);
  }
  return value;
}

let values: Record<string, string | undefined>;
try {
  values = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      seed: { type: "string" },
      actions: { type: "string" },
      "tick-minutes": { type: "string" },
      world: { type: "string", default: "world" },
      "step-every": { type: "string", default: "5" },
    },
    strict: true,
  }).values;
} catch (error) {
  usage(error instanceof Error ? error.message : String(error));
}

const tickMinutes = Number(values["tick-minutes"]);
if (values["tick-minutes"] === undefined || !Number.isFinite(tickMinutes) || tickMinutes <= 0) {
  usage(`${TICK_MINUTES_FLAG} is required: the minutes of game time one tick stands for`);
}

const result = runDriver({
  worldDir: resolve(values.world ?? "world"),
  tickMinutes,
  seed: whole("seed", values.seed, 0),
  actions: whole("actions", values.actions, 1),
  stepEvery: whole("step-every", values["step-every"], 1),
});
if (!result.ok) {
  console.error(`driver: boot refused: ${result.refusal.message}`);
  process.exit(1);
}
console.log(JSON.stringify(result.report, null, 2));
const { failure } = result.report;
if (failure !== undefined) {
  console.error(
    `driver: ${failure.check} check failed at action ${failure.at.iteration} (${failure.at.call}): ${failure.message}`,
  );
  process.exit(1);
}
