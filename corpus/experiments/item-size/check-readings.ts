/**
 * Checks that `readings.ts` reads the logged answers the way the runs read them, before any X result is looked at.
 * For every ok judgment in the named logs (any arm: B and W share the ask), it confirms:
 *   - `readingsOf("B", ...)` equals the logged readings (r and effect) and touches to 1e-12;
 *   - the logged `how` request asks exactly the direction keys whose gate noul reached `ASK_STRENGTH_FROM`;
 *   - every X arm returns a finite effect within [-3, 3] and leaves r and touches as B's.
 * It reads no label and prints no metric.
 *
 * usage: bun check-readings.ts <judgments.jsonl>[,<judgments.jsonl>...] [arm,arm]
 */
import { readFileSync } from "node:fs";
import type { Value } from "../jev-statements/contract.ts";
import { ARMS, ASK_STRENGTH_FROM, answersOf, type LoggedRequest, readingsOf } from "./readings.ts";

const values = ((await import("../../../world/values.toml")).default as { values: Value[] }).values;
const files = (Bun.argv[2] ?? "").split(",").filter(Boolean);
if (!files.length) throw new Error("usage: bun check-readings.ts <judgments.jsonl>[,...]");
const only = Bun.argv[3] ? new Set(Bun.argv[3].split(",")) : null;
let n = 0;
for (const file of files)
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const j = JSON.parse(line) as {
      case: string;
      arm: string;
      variant: string;
      rep: number;
      ok: boolean;
      readings: Record<string, { r: number; effect: number }>;
      touches: number;
      requests: (LoggedRequest & { questions: Record<string, unknown> })[];
    };
    if (!j.ok || (only && !only.has(j.arm))) continue;
    const id = `${j.case} ${j.arm}/${j.variant} rep ${j.rep}`;
    const { gate } = answersOf(j.requests);
    const asked = new Set(Object.keys(j.requests.find((r) => r.step === "how")?.questions ?? {}));
    const due = new Set(
      Object.entries(gate)
        .filter(([k, a]) => k !== "touches" && "noul" in a && a.noul >= ASK_STRENGTH_FROM)
        .map(([k]) => k),
    );
    if (asked.size !== due.size || [...due].some((k) => !asked.has(k))) throw new Error(`${id}: how keys != gate >= 0.4`);
    const b = readingsOf("B", j.requests, values);
    if (Math.abs(b.touches - j.touches) > 1e-12) throw new Error(`${id}: touches`);
    for (const [k, x] of Object.entries(j.readings)) {
      const y = b.items[k];
      if (!y || Math.abs(y.r - x.r) > 1e-12 || Math.abs(y.effect - x.effect) > 1e-12)
        throw new Error(`${id} ${k}: logged ${JSON.stringify(x)} != B ${JSON.stringify(y)}`);
    }
    for (const arm of ARMS) {
      const a = readingsOf(arm, j.requests, values);
      if (a.touches !== b.touches) throw new Error(`${id} ${arm}: touches`);
      for (const [k, y] of Object.entries(a.items)) {
        const x = b.items[k];
        if (!x || x.r !== y.r || !Number.isFinite(y.effect) || Math.abs(y.effect) > 3) throw new Error(`${id} ${arm} ${k}`);
      }
    }
    n++;
  }
console.log(`${n} ok judgments: B readings match the logs, how keys match the 0.4 rule, every X arm in range`);
