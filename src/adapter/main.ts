import { cli } from "harness/main.ts";
import { hostBench } from "./host.ts";

await cli(Bun.argv.slice(2), { host: hostBench });
