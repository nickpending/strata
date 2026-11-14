/**
 * Freeze check: each arm's final and contender keep B's questions (prereg "Arms"), with no Jev call. Every judge runs
 * on every case of a material file against a stub Jev that records each request and answers every noul 0.6 (so every
 * strength question is asked) and every score at its lowest level. Checked per judgment:
 *   - each of the 40 item nouls is asked exactly once, its instructions ending with ` ${statement(...)}`, character
 *     for character;
 *   - the touches noul is asked once; its words equal TOUCHES' with backticked field names removed;
 *   - every item noul at or above 0.4 gets one strength score with STAKE_LEVELS or DEED_LEVELS unchanged, its
 *     instructions holding `Asked: "<statement>" If so, ...` with the rest of strength4's words after the preamble,
 *     asked in a later request over a state deep-equal to its noul's;
 *   - any other question is a noul (a relevance question).
 * Also prints the number of requests and the longest chain.
 *
 * usage: bun check-arms.ts <material.json> <arm>:<variant>[,<arm>:<variant>...]
 */
import { readFileSync } from "node:fs";
import { statement } from "../gate-direction/arms/a.ts";
import { key4, strength4, TOUCHES } from "../gate-first-e2e/arms/b.ts";
import { buildTyped, type Material } from "./build.ts";
import { CHANNELS, type JevQuestion, type JevState, type StateArmModule, type Value } from "./contract.ts";

const [path, list] = Bun.argv.slice(2);
if (!path || !list) throw new Error("usage: bun check-arms.ts <material.json> <arm>:<variant>,...");
const cases = buildTyped(JSON.parse(readFileSync(path, "utf8")) as Material);
const values = ((await import("../../../world/values.json")).default as { values: Value[] }).values;
const unticked = (s: string) => s.replace(/`[^`]*`/g, "`_`");
const READ_LEN = (strength4("security", "X", "stake", "up").instructions as string).indexOf(" Asked:");

for (const spec of list.split(",")) {
  const [armName, variant] = spec.split(":") as [string, string];
  const mod = ((await import(`./arms/${armName}.ts`)) as { default: StateArmModule }).default;
  const v = mod.variants.find((x) => x.id === variant);
  if (!v) throw new Error(`${spec}: no such variant`);
  let requests = 0;
  let maxDepth = 0;
  for (const c of cases) {
    const o = c.other.name;
    type Asked = { step: string; order: number; state: JevState; q: JevQuestion };
    const asked = new Map<string, Asked[]>();
    let order = 0;
    await v.judge(c, values, async (step, state, questions) => {
      order++;
      const answers: Record<string, never> = {};
      for (const [k, q] of Object.entries(questions)) {
        const list = asked.get(k) ?? [];
        list.push({ step, order, state, q });
        asked.set(k, list);
        (answers as Record<string, unknown>)[k] =
          q.type === "noul"
            ? { noul: 0.6 }
            : q.type === "score"
              ? { score: 0, confidence: 1, probabilities: Object.fromEntries((q.criteria as unknown[]).map((_, i) => [String(i), i === 0 ? 1 : 0])), legend: {} }
              : (() => {
                  throw new Error(`${spec} ${c.id}: unexpected ${q.type}`);
                })();
      }
      return answers;
    });
    requests += order;
    const all = [...asked.values()].flat();
    const fail = (m: string) => {
      throw new Error(`${spec} ${c.id}: ${m}`);
    };
    let depth = 0;
    for (const ch of CHANNELS)
      for (const val of values)
        for (const d of ["up", "down"] as const) {
          const st = statement(val.id, o, ch, d);
          const nouls = all.filter((a) => a.q.type === "noul" && (a.q.instructions as string).endsWith(` ${st}`));
          if (nouls.length !== 1) fail(`${key4(ch, val.id, d)} asked ${nouls.length} times`);
          const n = nouls[0] as Asked;
          const ref = strength4(val.id, o, ch, d);
          const tail = (ref.instructions as string).slice(READ_LEN);
          const ss = all.filter(
            (a) => a.q.type === "score" && unticked(a.q.instructions as string).endsWith(unticked(tail)),
          );
          if (ss.length !== 1) fail(`${key4(ch, val.id, d)}: ${ss.length} strength questions`);
          const s = ss[0] as Asked;
          if (!Bun.deepEquals((s.q as { criteria: unknown }).criteria, (ref as { criteria: unknown }).criteria, true))
            fail(`${key4(ch, val.id, d)}: strength levels changed`);
          if (s.order <= n.order) fail(`${key4(ch, val.id, d)}: strength not chained after its noul`);
          if (!Bun.deepEquals(s.state, n.state, true)) fail(`${key4(ch, val.id, d)}: strength over another state`);
          depth = Math.max(depth, s.order);
        }
    const touch = all.filter(
      (a) => a.q.type === "noul" && unticked(a.q.instructions as string) === unticked(TOUCHES.instructions as string),
    );
    if (touch.length !== 1) fail(`touches asked ${touch.length} times`);
    const items = 40 * 2 + 1;
    const others = all.length - items;
    if (all.filter((a) => a.q.type !== "noul" && a.q.type !== "score").length) fail("a question of another type");
    if (others < 0) fail("fewer questions than the fixed set");
    maxDepth = Math.max(maxDepth, depth);
  }
  console.log(`${spec}: ${cases.length} cases keep B's questions; ${(requests / cases.length).toFixed(1)} requests per judgment (stub), latest strength at request ${maxDepth}`);
}
