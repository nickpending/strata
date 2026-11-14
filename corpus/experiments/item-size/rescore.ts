/**
 * Turns logged judgments into item-size's scored arms, with no Jev call. For each ok judgment of an arm's final
 * variant in the named logs, it writes one line per item-size arm (`readings.ts`: B, X1, X2, X3), read from that
 * judgment's logged answers, in the line format jev-statements' `run.ts` writes, minus `requests`:
 *   - from arm B's logs: `B`, `X1`, `X2`, `X3`;
 *   - from arm W's logs (jev-statements' W, final `w4`): `W`, `WX1`, `WX2`, `WX3`;
 *   - from any other arm A's logs: `A`, `AX1`, `AX2`, `AX3` (post-hoc rescores of jev-state's arms).
 * Each line's `scores` is the contract's `combine` over its readings and touches, linear and squared, with the holder
 * variant's importance from the material. A refused judgment is written refused for every arm. Non-final variants
 * are skipped. It reads no label.
 *
 * `--arms` limits it to the logged arms named (jev-state's F splits its requests by step and is not read here).
 *
 * usage: bun rescore.ts --calls a.jsonl[,b.jsonl] --material material.json --out arms.jsonl [--arms B,W]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { combine, type Importance, type Value } from "../jev-statements/contract.ts";
import { ARMS, type LoggedRequest, readingsOf } from "./readings.ts";

const { values: a } = parseArgs({
  args: Bun.argv.slice(2),
  options: { calls: { type: "string" }, material: { type: "string" }, out: { type: "string" }, arms: { type: "string" } },
});
if (!a.calls || !a.material || !a.out) throw new Error("usage: --calls a.jsonl[,b.jsonl] --material m.json --out f.jsonl");
const values = ((await import("../../../world/values.json")).default as { values: Value[] }).values;
const material = JSON.parse(readFileSync(a.material, "utf8")) as {
  variants: { id: string; importance: Importance }[];
  scenarios: { cases: { id: string; variant: string }[] }[];
};
const impOfVariant = new Map(material.variants.map((v) => [v.id, v.importance]));
const impOfCase = new Map<string, Importance>();
for (const sc of material.scenarios)
  for (const c of sc.cases) {
    const imp = impOfVariant.get(c.variant);
    if (!imp) throw new Error(`case ${c.id}: no variant ${c.variant}`);
    impOfCase.set(c.id, imp);
  }

const only = a.arms ? new Set(a.arms.split(",")) : null;
const out: string[] = [];
const counts = new Map<string, number>();
for (const file of a.calls.split(","))
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const j = JSON.parse(line) as Record<string, unknown> & {
      case: string;
      arm: string;
      final: boolean;
      ok: boolean;
      requests: LoggedRequest[];
    };
    if (!j.final || (only && !only.has(j.arm))) continue;
    const imp = impOfCase.get(j.case);
    if (!imp) throw new Error(`judgment for ${j.case} has no case in the material`);
    const { requests: _r, readings: _x, touches: _t, scores: _s, ...rest } = j;
    for (const arm of ARMS) {
      const name = arm === "B" ? j.arm : `${j.arm === "B" ? "" : j.arm}${arm}`;
      counts.set(name, (counts.get(name) ?? 0) + 1);
      if (!j.ok) {
        out.push(JSON.stringify({ ...rest, arm: name, readings: null, touches: null, scores: null }));
        continue;
      }
      const jd = readingsOf(arm, j.requests, values);
      out.push(
        JSON.stringify({
          ...rest,
          arm: name,
          readings: jd.items,
          touches: jd.touches,
          scores: { lin: combine(jd, imp, values, "lin"), sq: combine(jd, imp, values, "sq") },
        }),
      );
    }
  }
writeFileSync(a.out, `${out.join("\n")}\n`);
console.log(`${out.length} lines -> ${a.out}: ${[...counts].map(([k, v]) => `${k} ${v}`).join(", ")}`);
