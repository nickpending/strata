#!/usr/bin/env bun
/**
 * A-z50 (prereg.md, "Freeze addendum"): arm A's own logged answers re-read with C's reading rule, at no Jev cost.
 * Per item, m = max(P(up), P(down)) over A's two one-sided nouls; the reading is +m when P(up) >= P(down), else -m,
 * and 0 when m < 0.5. Reported only; it never decides.
 *
 * usage: bun az50.ts <finals judgments.jsonl> > a-z50.jsonl
 *   writes one line per A judgment, as arm "A", variant "a-z50", final false, with the new readings.
 */
import { readFileSync } from "node:fs";

const src = process.argv[2];
if (!src) throw new Error("usage: bun az50.ts <judgments.jsonl>");
for (const line of readFileSync(src, "utf8").split("\n")) {
  if (!line) continue;
  const r = JSON.parse(line);
  if (r.arm !== "A") continue;
  let readings: Record<string, number> | null = null;
  if (r.ok) {
    const gate = r.requests.find((q: { step: string }) => q.step === "gate");
    const p = (k: string) => (gate.answers[k] as { noul: number }).noul;
    readings = {};
    for (const key of Object.keys(r.readings)) {
      const up = p(`${key}__up`);
      const down = p(`${key}__down`);
      const m = Math.max(up, down);
      readings[key] = m < 0.5 ? 0 : up >= down ? m : -m;
    }
  }
  console.log(JSON.stringify({ ...r, variant: "a-z50", final: false, readings, requests: [] }));
}
