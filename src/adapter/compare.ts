import { compareCli } from "harness/compare.ts";

await compareCli(Bun.argv.slice(2));
