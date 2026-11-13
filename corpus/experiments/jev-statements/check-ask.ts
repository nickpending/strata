/**
 * Checks that `ask.ts` `judgeWith(statementB)` is design B's per-value stage exactly: on every case of a material
 * file, it and gate-first-e2e's `arms/b.ts` `as-is` judge run against the same deterministic stub Jev, whose noul
 * probabilities and score levels vary by case and key (so the 0.4 strength threshold is crossed both ways), and must
 * send the same requests (step, state, questions, deep-equal) and return the same readings. No Jev call, no label.
 *
 * usage: bun check-ask.ts <material.json>[,<material.json>...]
 */
import { readFileSync } from "node:fs";
import { buildTyped, type Material } from "../jev-state/build.ts";
import g from "../gate-first-e2e/arms/b.ts";
import { judgeWith, statementB } from "./ask.ts";
import type { Jev, JevQuestion, JevState, Value } from "./contract.ts";

const list = Bun.argv[2];
if (!list) throw new Error("usage: bun check-ask.ts <material.json>[,...]");
const values = ((await import("../../../world/values.toml")).default as { values: Value[] }).values;
const b = g.variants.find((v) => v.id === "as-is")?.judge;
if (!b) throw new Error("no B as-is");
const w = judgeWith(statementB);

/** A deterministic number in [0, 1) from a string (FNV-1a). */
const unit = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 2 ** 32;
};

type Req = { step: string; state: JevState; questions: Record<string, JevQuestion> };
function stub(caseId: string, log: Req[]): Jev {
  return async (step, state, questions) => {
    log.push({ step, state, questions });
    const out: Record<string, unknown> = {};
    for (const [k, q] of Object.entries(questions)) {
      const u = unit(`${caseId}|${step}|${k}`);
      if (q.type === "noul") out[k] = { noul: u };
      else if (q.type === "score") {
        const n = (q.criteria as unknown[]).length;
        const top = Math.floor(u * n);
        out[k] = {
          score: top,
          confidence: 1,
          probabilities: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i), i === top ? 0.7 : 0.3 / (n - 1)])),
          legend: {},
        };
      } else throw new Error(`unexpected ${q.type}`);
    }
    return out as never;
  };
}

let cases = 0;
let strengths = 0;
let below = 0;
for (const path of list.split(",")) {
  for (const c of buildTyped(JSON.parse(readFileSync(path, "utf8")) as Material)) {
    const lb: Req[] = [];
    const lw: Req[] = [];
    const jb = await b(c, values, stub(c.id, lb));
    const jw = await w(c, values, stub(c.id, lw));
    if (!Bun.deepEquals(lb, lw, true)) throw new Error(`${c.id}: requests differ`);
    if (!Bun.deepEquals(jb, jw, true)) throw new Error(`${c.id}: readings differ`);
    const gate = Object.keys(lb[0]?.questions ?? {}).length;
    const how = Object.keys(lb[1]?.questions ?? {}).length;
    if (gate !== 41) throw new Error(`${c.id}: gate has ${gate} questions`);
    strengths += how;
    below += 40 - how;
    cases++;
  }
}
console.log(
  `${cases} cases: judgeWith(statementB) sends B's requests and readings exactly; ${strengths} strength questions asked, ${below} nouls under 0.4 not asked`,
);
