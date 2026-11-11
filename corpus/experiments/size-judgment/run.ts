/**
 * The size-judgment runner. Cases are built from a material file by value-weighting-2's builder, unchanged: real
 * actions through Engine.act and Engine.step on world/, each case its holder's own copies. Each case spec in the
 * material carries `touched`, the given items (value and direction); the runner reads no label and no size.
 * Per case and rep, every selected (arm, variant) judges once, in an order rotated per rep. A judgment is one or
 * more Jev requests through harness/src/jev.ts `decide`; a refused request ends the judgment as refused. One line
 * per judgment goes to corpus/runs/size-judgment/<stamp>-<tag>/judgments.jsonl (gitignored), with every request's
 * state, questions and answers.
 *
 * usage: bun run.ts --material <material.json> --tag <tag> [--arms a,b,c] [--variants final|contenders|all|id,id]
 *                   [--reps 2] [--only case,case] [--concurrency 6]
 */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { decide } from "../../../harness/src/jev.ts";
import { type BuiltCase, build, type Material } from "./build.ts";
import { type ArmModule, type Item, itemKey, type Jev, type Value } from "./contract.ts";

const here = import.meta.dir;
class Refused extends Error {}

type Touched = { value: string; direction: "up" | "down" };

async function main() {
  const { values: a } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      material: { type: "string" },
      tag: { type: "string" },
      arms: { type: "string", default: "a,b,c" },
      variants: { type: "string", default: "final" },
      reps: { type: "string", default: "2" },
      only: { type: "string" },
      concurrency: { type: "string", default: "6" },
    },
  });
  if (!a.material || !a.tag) throw new Error("--material and --tag are required");
  const material = JSON.parse(readFileSync(a.material, "utf8")) as Material;
  const touched = new Map<string, Touched[]>();
  for (const sc of material.scenarios)
    for (const c of sc.cases as (typeof sc.cases[number] & { touched?: Touched[] })[]) {
      if (!c.touched?.length) throw new Error(`${c.id}: no touched items`);
      touched.set(c.id, c.touched);
    }
  const cases: BuiltCase[] = build(material);
  const catalogue = (await import("../../../world/values.toml")).default as { values: Value[] };
  const values = catalogue.values;
  for (const [id, items] of touched)
    for (const i of items)
      if (!values.some((v) => v.id === i.value)) throw new Error(`${id}: ${i.value} is not a world value`);

  const only = a.only ? new Set(a.only.split(",")) : null;
  const arms: ArmModule[] = [];
  for (const name of a.arms.split(",")) arms.push(((await import(join(here, "arms", `${name}.ts`))) as { default: ArmModule }).default);
  const pick = (m: ArmModule): string[] =>
    a.variants === "all"
      ? m.variants.map((v) => v.id)
      : a.variants === "final"
        ? [m.final]
        : a.variants === "contenders"
          ? m.contenders.slice(0, 3)
          : a.variants.split(",").filter((id) => m.variants.some((v) => v.id === id));
  for (const m of arms)
    for (const v of m.variants) {
      if (v.toLabel.length !== v.levels) throw new Error(`${m.arm}/${v.id}: toLabel has ${v.toLabel.length} entries for ${v.levels} levels`);
      if (v.toLabel.some((x, i) => x < 1 || x > 5 || (i > 0 && x < (v.toLabel[i - 1] as number))))
        throw new Error(`${m.arm}/${v.id}: toLabel must be nondecreasing within 1..5`);
    }

  const reps = Number(a.reps);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(here, "../../runs/size-judgment", `${stamp}-${a.tag}`);
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "judgments.jsonl");

  type Job = { c: BuiltCase; rep: number; arm: ArmModule; variant: string };
  const jobs: Job[] = [];
  const pairs = arms.flatMap((arm) => pick(arm).map((variant) => ({ arm, variant })));
  for (const c of cases) {
    if (only && !only.has(c.id)) continue;
    for (let rep = 0; rep < reps; rep++) {
      const k = (jobs.length + rep) % Math.max(pairs.length, 1);
      for (const p of [...pairs.slice(k), ...pairs.slice(0, k)]) jobs.push({ c, rep, ...p });
    }
  }

  let next = 0;
  let refused = 0;
  let spent = 0;
  async function worker() {
    while (next < jobs.length) {
      const { c, rep, arm, variant } = jobs[next++] as Job;
      const v = arm.variants.find((x) => x.id === variant);
      if (!v) throw new Error(variant);
      const items: Item[] = touched.get(c.id) ?? [];
      const requests: unknown[] = [];
      const costs: (number | null)[] = [];
      const jev: Jev = async (step, state, questions) => {
        if (requests.some((r) => (r as { step: string }).step === step)) throw new Error(`step ${step} asked twice`);
        const t = performance.now();
        const r = await decide(state, questions);
        const ms = Math.round(performance.now() - t);
        if (!r.ok) {
          requests.push({ step, state, questions, ok: false, refusal: r.refusal, ms });
          costs.push(null);
          throw new Refused(`${step}: ${r.refusal.kind} ${r.refusal.message}`);
        }
        requests.push({ step, state, questions, ok: true, answers: r.answers, costUsd: r.costUsd, ms });
        costs.push(r.costUsd);
        return r.answers;
      };
      let levels: Record<string, number> | null = null;
      let error: string | null = null;
      const t = performance.now();
      try {
        levels = await v.judge(c, items, values, jev);
        for (const i of items) {
          const l = levels[itemKey(i)];
          if (l === undefined || !Number.isInteger(l) || l < 0 || l >= v.levels) throw new Error(`${c.id} ${arm.arm}/${variant}: bad level for ${itemKey(i)}: ${l}`);
        }
      } catch (e) {
        if (!(e instanceof Refused)) throw e;
        levels = null;
        error = e.message;
        refused++;
        console.error(`${c.id} ${arm.arm}/${variant} ${rep}: ${error}`);
      }
      const costUsd = costs.length && costs.every((x) => x !== null) ? costs.reduce((s, x) => s + (x as number), 0) : null;
      spent += costUsd ?? 0;
      appendFileSync(
        log,
        `${JSON.stringify({
          case: c.id,
          scenario: c.scenario,
          arm: arm.arm,
          variant,
          final: variant === arm.final,
          rep,
          ok: error === null,
          error,
          items: items.map((i) => ({
            key: itemKey(i),
            ...i,
            level: levels?.[itemKey(i)] ?? null,
            mapped: levels ? (v.toLabel[levels[itemKey(i)] as number] ?? null) : null,
          })),
          levels: v.levels,
          toLabel: v.toLabel,
          calls: requests.length,
          questionCount: requests.reduce((s: number, r) => s + Object.keys((r as { questions: object }).questions).length, 0),
          costUsd,
          ms: Math.round(performance.now() - t),
          requests,
        })}\n`,
      );
    }
  }
  await Promise.all(Array.from({ length: Number(a.concurrency) }, worker));
  console.log(`${jobs.length} judgments, ${refused} refused, ${spent.toFixed(4)} USD -> ${log}`);
}

await main();
