/**
 * The jev-statements runner: jev-state's runner (`../jev-state/run.ts`) copied, with three changes: this
 * experiment's arms and contract, and its log directory. Cases are built by `../jev-state/build.ts` `buildTyped`, whose
 * BuiltCase fields equal `../size-judgment/build.ts`'s (`../jev-state/check-build.ts`): real actions through Engine.act
 * and Engine.step on world/, each case its holder's own copies. No label is read. Per case and rep every selected
 * (arm, variant) judges once, in an order rotated per rep. A judgment is one or more Jev requests through
 * harness/src/jev.ts `decide`; a refused request ends the judgment as refused. One line per judgment goes to
 * corpus/runs/jev-statements/<stamp>-<tag>/judgments.jsonl (gitignored), with every request's state, questions and
 * answers, the 20 readings ({r, effect}), touches, and the case score under the contract's combine, linear and
 * squared, from the holder variant's importance in the material (the material carries no label).
 *
 * usage: bun run.ts --material <material.json> --tag <tag> [--arms b,w] [--variants final|contenders|all|id,id]
 *                   [--reps 2] [--only case,case] [--concurrency 6]
 */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { decide } from "../../../harness/src/jev.ts";
import { buildTyped, type Material, type TypedCase } from "../jev-state/build.ts";
import { type StatementArmModule as ArmModule, CHANNELS, combine, itemKey, type Jev, type Judged, type Value } from "./contract.ts";

const here = import.meta.dir;
class Refused extends Error {}

async function main() {
  const { values: a } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      material: { type: "string" },
      tag: { type: "string" },
      arms: { type: "string", default: "b" },
      variants: { type: "string", default: "final" },
      reps: { type: "string", default: "2" },
      only: { type: "string" },
      concurrency: { type: "string", default: "6" },
    },
  });
  if (!a.material || !a.tag) throw new Error("--material and --tag are required");
  const material = JSON.parse(readFileSync(a.material, "utf8")) as Material;
  const cases: TypedCase[] = buildTyped(material);
  const values = ((await import("../../../world/values.json")).default as { values: Value[] }).values;
  const keys = CHANNELS.flatMap((ch) => values.map((v) => itemKey(ch, v.id)));
  const importanceOf = (c: TypedCase) => {
    const v = material.variants.find((x) => x.id === c.holder.variant);
    if (!v) throw new Error(`no variant ${c.holder.variant}`);
    return v.importance;
  };

  const only = a.only ? new Set(a.only.split(",")) : null;
  const arms: ArmModule[] = [];
  for (const name of a.arms.split(","))
    arms.push(((await import(join(here, "arms", `${name}.ts`))) as { default: ArmModule }).default);
  const pick = (m: ArmModule): string[] =>
    a.variants === "all"
      ? m.variants.map((v) => v.id)
      : a.variants === "final"
        ? [m.final]
        : a.variants === "contenders"
          ? m.contenders.slice(0, 1)
          : a.variants.split(",").filter((id) => m.variants.some((v) => v.id === id));

  const reps = Number(a.reps);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(here, "../../runs/jev-statements", `${stamp}-${a.tag}`);
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "judgments.jsonl");

  type Job = { c: TypedCase; rep: number; arm: ArmModule; variant: string };
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
      let judged: Judged | null = null;
      let error: string | null = null;
      const t = performance.now();
      try {
        judged = await v.judge(c, values, jev);
        for (const k of keys) {
          const x = judged.items[k];
          if (!x || !Number.isFinite(x.r) || x.r < -1 || x.r > 1 || !Number.isFinite(x.effect) || Math.abs(x.effect) > 3)
            throw new Error(`${c.id} ${arm.arm}/${variant}: bad reading for ${k}: ${JSON.stringify(x)}`);
        }
        if (!Number.isFinite(judged.touches) || judged.touches < 0 || judged.touches > 1)
          throw new Error(`${c.id} ${arm.arm}/${variant}: bad touches ${judged.touches}`);
      } catch (e) {
        if (!(e instanceof Refused)) throw e;
        judged = null;
        error = e.message;
        refused++;
        console.error(`${c.id} ${arm.arm}/${variant} ${rep}: ${error}`);
      }
      const costUsd =
        costs.length && costs.every((x) => x !== null) ? costs.reduce((s: number, x) => s + (x as number), 0) : null;
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
          readings: judged ? Object.fromEntries(keys.map((k) => [k, judged?.items[k]])) : null,
          touches: judged?.touches ?? null,
          scores: judged
            ? { lin: combine(judged, importanceOf(c), values, "lin"), sq: combine(judged, importanceOf(c), values, "sq") }
            : null,
          calls: requests.length,
          questionCount: requests.reduce(
            (s: number, r) => s + Object.keys((r as { questions: object }).questions).length,
            0,
          ),
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
