import { scoreCli } from "harness/score.ts";
import { hostBench } from "./host.ts";

await scoreCli(Bun.argv.slice(2), { host: hostBench });
