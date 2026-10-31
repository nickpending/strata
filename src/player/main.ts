import { parseArgs } from "node:util";
import { optionsFromFlags, PLAYER_FLAGS, PLAYER_USAGE, runPlayer } from "./run.ts";

const USAGE = `usage: bun run src/player/main.ts "<instruction>" ${PLAYER_USAGE} [--url <bench>]`;

function usage(message: string): never {
  console.error(`player: ${message}\n${USAGE}`);
  process.exit(2);
}

let parsed: ReturnType<typeof parse>;
function parse() {
  return parseArgs({
    args: Bun.argv.slice(2),
    options: { ...PLAYER_FLAGS, url: { type: "string" } },
    allowPositionals: true,
    strict: true,
  });
}
try {
  parsed = parse();
} catch (error) {
  usage(error instanceof Error ? error.message : String(error));
}

const [instruction, ...extra] = parsed.positionals;
if (instruction === undefined || instruction.trim() === "") usage("the instruction is required");
if (extra.length > 0) usage(`one instruction only, got also: ${extra.join(" ")}`);
const options = optionsFromFlags(parsed.values);
if ("error" in options) usage(options.error);

const { runDir, record } = await runPlayer({ ...options, instruction, url: parsed.values.url });
console.log(`run written to ${runDir}`);
const { outcome } = record;
if (outcome?.kind !== "reached") {
  const why =
    outcome === null
      ? "no outcome"
      : outcome.kind === "stopped"
        ? `stopped: ${outcome.stopped.kind} at ${outcome.stopped.call}: ${outcome.stopped.message}`
        : JSON.stringify(outcome);
  console.error(`player: ${outcome?.kind ?? "unfinished"}: ${why}`);
  process.exit(1);
}
