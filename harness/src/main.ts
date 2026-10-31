import { parseArgs } from "node:util";
import { drive, type Host, optionsFromFlags, RUN_FLAGS, RUN_USAGE } from "./run.ts";

const USAGE = `usage: bun run harness "<instruction>" ${RUN_USAGE} [--url <bench>]`;

function usage(message: string): never {
  console.error(`harness: ${message}\n${USAGE}`);
  process.exit(2);
}

/**
 * The harness's command line over `args`: one run toward the instruction, on the bench at --url or
 * one `host` hosts; it exits 1 unless the run reached its end state with every bench read answered.
 */
export async function cli(args: string[], bench: { host?: Host } = {}): Promise<void> {
  let parsed: ReturnType<typeof parse>;
  function parse() {
    return parseArgs({
      args,
      options: { ...RUN_FLAGS, url: { type: "string" } },
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

  const { runDir, record } = await drive({
    ...options,
    instruction,
    url: parsed.values.url,
    host: bench.host,
  });
  console.log(`run written to ${runDir}`);
  const { outcome } = record;
  for (const failure of record.benchFailures) {
    console.error(`harness: bench: the ${failure.call} read failed: ${failure.message}`);
  }
  if (outcome?.kind !== "reached" || record.benchFailures.length > 0) {
    const why =
      outcome === null
        ? "no outcome"
        : outcome.kind === "stopped"
          ? `stopped: ${outcome.stopped.kind} at ${outcome.stopped.call}: ${outcome.stopped.message}`
          : JSON.stringify(outcome);
    console.error(`harness: ${outcome?.kind ?? "unfinished"}: ${why}`);
    process.exit(1);
  }
}

if (import.meta.main) await cli(Bun.argv.slice(2));
