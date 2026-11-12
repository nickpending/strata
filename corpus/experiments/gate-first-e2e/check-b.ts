/**
 * Checks arm B's port against value-weighting-4's logged B `lin` judgments, at no Jev cost. For each logged
 * judgment it rebuilds the case from the logged state, drives `arms/b.ts` with a stand-in Jev that captures every
 * request and replays v4's logged answers, then checks:
 *   - every question key and text of both steps equals the logged one, character for character;
 *   - the contract's `combine` (linear) over the port's readings equals v4's logged score.
 * Reads v4's committed material for importances and its local logs under corpus/runs/value-weighting-4/.
 *
 * usage: bun check-b.ts <v4 judgments.jsonl> <v4 material.json>
 */
import { readFileSync } from "node:fs";
import b from "./arms/b.ts";
import type { BuiltCase, Jev, JevAnswer, JevQuestion, Value } from "./contract.ts";
import { combine } from "./contract.ts";

type V4Answer =
  | { type: "noul"; noul: number }
  | { type: "score"; score: number; confidence: number; probabilities: number[] };
type V4Request = { step: string; state: Record<string, unknown>; questions: Record<string, JevQuestion>; answers: Record<string, V4Answer> };

const [logPath, materialPath] = Bun.argv.slice(2);
if (!logPath || !materialPath) throw new Error("usage: bun check-b.ts <judgments.jsonl> <material.json>");
const material = JSON.parse(readFileSync(materialPath, "utf8")) as {
  variants: { id: string; importance: Record<string, number> }[];
  scenarios: { cases: { id: string; variant: string }[] }[];
};
const variantOf = new Map(material.scenarios.flatMap((s) => s.cases.map((c) => [c.id, c.variant] as const)));
const values = ((await import("../../../world/values.toml")).default as { values: Value[] }).values;

const toHarness = (a: V4Answer): JevAnswer =>
  a.type === "noul"
    ? { noul: a.noul }
    : {
        score: a.score,
        confidence: a.confidence,
        legend: Object.fromEntries(a.probabilities.map((_, i) => [String(i), ""])),
        probabilities: Object.fromEntries(a.probabilities.map((p, i) => [String(i), p])),
      };

let n = 0;
let questions = 0;
let maxDiff = 0;
for (const line of readFileSync(logPath, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const j = JSON.parse(line);
  if (j.arm !== "B" || j.variant !== "lin" || !j.ok) continue;
  const reqs = j.requests as V4Request[];
  const gate = reqs.find((r) => r.step === "gate");
  if (!gate) throw new Error(`${j.case}: no gate step`);
  const st = gate.state as { you: string; who_you_are: string; earlier: string[]; now: string; your_part: string };
  const m = /^Does what (.+?) did make you safer/.exec(
    (gate.questions.stake__security__up as { instructions: string }).instructions.split("`your_part`). ")[1] ?? "",
  );
  if (!m?.[1]) throw new Error(`${j.case}: other's name not found`);
  const c: BuiltCase = {
    id: j.case,
    scenario: "",
    holder: { id: "", name: st.you, variant: "" },
    other: { id: "", name: m[1] },
    identity: st.who_you_are,
    role: st.your_part.endsWith("did this with you directly.") ? "direct" : "witnessed",
    subkind: "",
    tick: 0,
    history: st.earlier[0] === "(nothing yet)" && st.earlier.length === 1 ? [] : st.earlier.map((text) => ({ tick: 0, text, withOther: false })),
    event: st.now,
  } as BuiltCase;
  const jev: Jev = async (step, state, qs) => {
    const logged = reqs.find((r) => r.step === step);
    if (!logged) throw new Error(`${j.case}: port asked step ${step}, v4 did not`);
    if (JSON.stringify(state) !== JSON.stringify(logged.state)) throw new Error(`${j.case}/${step}: state differs`);
    const a = Object.keys(qs).sort();
    const e = Object.keys(logged.questions).sort();
    if (a.join() !== e.join()) throw new Error(`${j.case}/${step}: keys differ\n port ${a}\n v4   ${e}`);
    for (const k of a) {
      const lq = logged.questions[k] as JevQuestion & { criteria?: unknown };
      const pq = qs[k] as JevQuestion & { criteria?: unknown };
      if (pq.type !== lq.type || pq.instructions !== lq.instructions || JSON.stringify(pq.criteria) !== JSON.stringify(lq.criteria))
        throw new Error(`${j.case}/${step}/${k}: question differs\n port ${JSON.stringify(pq)}\n v4   ${JSON.stringify(lq)}`);
      questions++;
    }
    return Object.fromEntries(Object.entries(logged.answers).map(([k, v]) => [k, toHarness(v)]));
  };
  const judged = await b.variants[0]!.judge(c, values, jev);
  if (reqs.length !== (reqs.some((r) => r.step === "how") ? 2 : 1)) throw new Error(`${j.case}: unexpected steps`);
  const variant = variantOf.get(j.case);
  const imp = material.variants.find((v) => v.id === variant)?.importance;
  if (!imp) throw new Error(`${j.case}: no importance`);
  const s = combine(judged, imp, values, "lin");
  maxDiff = Math.max(maxDiff, Math.abs(s - j.score));
  n++;
}
console.log(`${n} judgments, ${questions} questions identical, max |score - v4 score| = ${maxDiff.toExponential(2)}`);
if (n === 0 || maxDiff > 1e-9) process.exit(1);
