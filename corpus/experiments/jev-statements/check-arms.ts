/**
 * Freeze check: each W variant named differs from B only in its statements (prereg "Arms"). No Jev call, no label.
 * On every case of the material files, B's `as-is` judge and the variant run against a stub Jev that answers every
 * noul 0.6 (so every strength question is asked) and every score at its lowest level. Checked per judgment:
 *   - the same steps, in the same order, over deep-equal states (B's state);
 *   - the same question keys; touches identical;
 *   - every item noul's instructions equal B's with B's statement for that key replaced by the variant's, and
 *     nothing else changed (so `READ` is B's);
 *   - every strength score's criteria equal B's, and its instructions equal B's with the quoted statement replaced.
 * And per statement table, with the other named "Zed" (no one in the world):
 *   - 40 statements, each a non-empty question ending in "?", each holding "Zed" for stake and deed alike, none
 *     holding a double quote (the strength question quotes the statement);
 *   - no person, room or item name from world/ (a statement must hold for any holder), and no capitalised word after
 *     the first except "Zed", which are printed for the orchestrator to read.
 *
 * usage: bun check-arms.ts <material.json>[,<material.json>...] w:<variant>[,w:<variant>...]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import g from "../gate-first-e2e/arms/b.ts";
import { buildTyped, type Material } from "../jev-state/build.ts";
import { statementB } from "./ask.ts";
import { CHANNELS, type Dir, type Jev, type JevQuestion, type JevState, type StatementArmModule, type Value } from "./contract.ts";

const [paths, list] = Bun.argv.slice(2);
if (!paths || !list) throw new Error("usage: bun check-arms.ts <material.json>[,...] w:<variant>[,...]");
const values = ((await import("../../../world/values.json")).default as { values: Value[] }).values;
const cases = paths.split(",").flatMap((p) => buildTyped(JSON.parse(readFileSync(p, "utf8")) as Material));
const b = g.variants.find((v) => v.id === "as-is")?.judge;
if (!b) throw new Error("no B as-is");
const DIRS: Dir[] = ["up", "down"];

const WORLD = join(import.meta.dir, "../../../world");
const worldNames: string[] = [];
for (const dir of ["people", "rooms", "items"])
  for (const f of readdirSync(join(WORLD, dir))) {
    const m = readFileSync(join(WORLD, dir, f), "utf8").match(/^name = "(.*)"$/m);
    if (m?.[1]) worldNames.push(m[1]);
  }

type Req = { step: string; state: JevState; questions: Record<string, JevQuestion> };
const stub =
  (log: Req[]): Jev =>
  async (step, state, questions) => {
    log.push({ step, state, questions });
    const out: Record<string, unknown> = {};
    for (const [k, q] of Object.entries(questions))
      out[k] =
        q.type === "noul"
          ? { noul: 0.6 }
          : {
              score: 0,
              confidence: 1,
              probabilities: Object.fromEntries((q.criteria as unknown[]).map((_, i) => [String(i), i === 0 ? 1 : 0])),
              legend: {},
            };
    return out as never;
  };

for (const spec of list.split(",")) {
  const [armName, variant] = spec.split(":") as [string, string];
  const mod = ((await import(`./arms/${armName}.ts`)) as { default: StatementArmModule }).default;
  const v = mod.variants.find((x) => x.id === variant);
  if (!v) throw new Error(`${spec}: no such variant`);
  const fail = (m: string) => {
    throw new Error(`${spec}: ${m}`);
  };

  const capitals = new Set<string>();
  for (const ch of CHANNELS)
    for (const val of values)
      for (const d of DIRS) {
        const s = v.statement(val.id, "Zed", ch, d);
        const k = `${ch}__${val.id}__${d}`;
        if (typeof s !== "string" || !s.trim().endsWith("?")) fail(`${k}: not a question`);
        if (!s.includes("Zed")) fail(`${k}: does not name the other`);
        if (s.includes('"')) fail(`${k}: holds a double quote, which would break the strength question's quoting`);
        for (const n of worldNames) if (s.toLowerCase().includes(n.toLowerCase())) fail(`${k}: names "${n}"`);
        for (const word of s.split(/\s+/).slice(1))
          if (/^[A-Z]/.test(word) && !word.startsWith("Zed")) capitals.add(`${k}: ${word}`);
      }

  for (const c of cases) {
    const o = c.other.name;
    const lb: Req[] = [];
    const lw: Req[] = [];
    await b(c, values, stub(lb));
    await v.judge(c, values, stub(lw));
    if (lb.length !== lw.length) fail(`${c.id}: ${lw.length} requests, B sends ${lb.length}`);
    for (let i = 0; i < lb.length; i++) {
      const rb = lb[i] as Req;
      const rw = lw[i] as Req;
      if (rb.step !== rw.step) fail(`${c.id}: step ${rw.step}, B ${rb.step}`);
      if (!Bun.deepEquals(rb.state, rw.state, true)) fail(`${c.id} ${rb.step}: state differs from B's`);
      const kb = Object.keys(rb.questions).sort();
      const kw = Object.keys(rw.questions).sort();
      if (!Bun.deepEquals(kb, kw, true)) fail(`${c.id} ${rb.step}: question keys differ`);
      for (const k of kb) {
        const qb = rb.questions[k] as JevQuestion;
        const qw = rw.questions[k] as JevQuestion;
        if (k === "touches") {
          if (!Bun.deepEquals(qb, qw, true)) fail(`${c.id}: touches changed`);
          continue;
        }
        const [ch, id, d] = k.split("__") as [(typeof CHANNELS)[number], string, Dir];
        const sb = statementB(id, o, ch, d);
        const sw = v.statement(id, o, ch, d);
        const ib = qb.instructions as string;
        if (qb.type !== qw.type) fail(`${c.id} ${k}: type changed`);
        if (!Bun.deepEquals((qb as { criteria?: unknown }).criteria, (qw as { criteria?: unknown }).criteria, true))
          fail(`${c.id} ${k}: criteria changed`);
        const at = ib.lastIndexOf(sb);
        if (at < 0) fail(`${c.id} ${k}: B's statement not in B's question`);
        const want = `${ib.slice(0, at)}${sw}${ib.slice(at + sb.length)}`;
        if (qw.instructions !== want) fail(`${c.id} ${rb.step} ${k}: more than the statement changed`);
      }
    }
  }
  console.log(`${spec}: ${cases.length} cases, only the 40 statements differ from B (state, READ, touches, levels kept)`);
  console.log(capitals.size ? `  capitalised words to read: ${[...capitals].join("; ")}` : "  no capitalised word after the first");
}
