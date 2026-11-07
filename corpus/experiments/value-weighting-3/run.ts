/**
 * Runs arm variants over cases built from a material file by value-weighting-2's builder, unchanged:
 * real actions through Engine.act and Engine.step on world/, each case its holder's own copies. Per
 * case and rep every selected (arm, variant) judges once, in an order rotated per rep. A judgment is
 * one or more Jev requests (named steps); a refused request ends the judgment as refused. One line
 * per judgment goes to corpus/runs/value-weighting-3/<stamp>-<tag>/judgments.jsonl, which stays
 * local, with every request's state, questions and answers. No label is read.
 *
 * usage: bun run.ts --material <material.json> --tag <tag> [--arms o1,o2] [--variants id,id|all|final|contenders]
 *                   [--reps 2] [--only case,case] [--concurrency 6]
 */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { type BuiltCase, build, type Material } from "../value-weighting-2/build.ts";
import type { ArmModule, Bag, Catalogue, Jev } from "./contract.ts";
import { ask, type Answers, type Question, type State } from "./jev3.ts";

const here = import.meta.dir;

type Request = {
  step: string;
  state: State;
  questions: Record<string, Question>;
  ok: boolean;
  answers?: Answers;
  refusal?: unknown;
  costUsd: number | null;
  ms: number;
};
class Refused extends Error {}

async function main() {
  const { values: a } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      material: { type: "string" },
      tag: { type: "string" },
      arms: { type: "string", default: "o1,o2" },
      variants: { type: "string", default: "final" },
      reps: { type: "string", default: "2" },
      only: { type: "string" },
      concurrency: { type: "string", default: "6" },
    },
  });
  if (!a.material || !a.tag) throw new Error("--material and --tag are required");
  const material = JSON.parse(readFileSync(a.material, "utf8")) as Material;
  const cases: BuiltCase[] = build(material);
  const catalogue = JSON.parse(readFileSync(join(here, "catalogue.json"), "utf8")) as Catalogue;
  const importanceOf = (c: BuiltCase) => {
    const v = material.variants.find((x) => x.id === c.holder.variant);
    if (!v) throw new Error(`no variant ${c.holder.variant}`);
    return v.importance;
  };
  const only = a.only ? new Set(a.only.split(",")) : null;
  const arms: ArmModule[] = [];
  for (const name of a.arms.split(",")) {
    const mod = (await import(join(here, "arms", `${name}.ts`))) as { default: ArmModule };
    arms.push(mod.default);
  }
  const pick = (m: ArmModule): string[] =>
    a.variants === "all"
      ? m.variants.map((v) => v.id)
      : a.variants === "final"
        ? [m.final]
        : a.variants === "contenders"
          ? m.contenders.slice(0, 4)
        : a.variants.split(",").filter((id) => m.variants.some((v) => v.id === id));
  const reps = Number(a.reps);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(here, "../../runs/value-weighting-3", `${stamp}-${a.tag}`);
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
      const requests: Request[] = [];
      const jev: Jev = async (step, state, questions) => {
        if (requests.some((r) => r.step === step)) throw new Error(`step ${step} asked twice`);
        const r = await ask(state, questions);
        if (!r.ok) {
          requests.push({ step, state, questions, ok: false, refusal: r.refusal, costUsd: null, ms: r.ms });
          throw new Refused(`${step}: ${r.refusal.kind} ${r.refusal.message}`);
        }
        requests.push({ step, state, questions, ok: true, answers: r.answers, costUsd: r.costUsd, ms: r.ms });
        return r.answers;
      };
      const imp = importanceOf(c);
      let band = 0;
      let score: number | null = null;
      let error: string | null = null;
      const t = performance.now();
      try {
        let bag: Bag;
        if (arm.arm === "O1") {
          const v = arm.variants.find((x) => x.id === variant);
          if (!v) throw new Error(variant);
          band = v.band;
          bag = await v.ask(c, imp, catalogue, jev);
          score = v.score(bag);
        } else {
          const v = arm.variants.find((x) => x.id === variant);
          if (!v) throw new Error(variant);
          band = v.band;
          bag = await v.ask(c, catalogue, jev);
          score = v.score(bag, imp, catalogue);
        }
        if (!Number.isFinite(score)) throw new Error(`score ${score}`);
      } catch (e) {
        if (!(e instanceof Refused)) throw e;
        score = null;
        error = e.message;
        refused++;
        console.error(`${c.id} ${arm.arm}/${variant} ${rep}: ${error}`);
      }
      const ms = Math.round(performance.now() - t);
      const costs = requests.map((r) => r.costUsd);
      const costUsd = costs.length && costs.every((x) => x !== null) ? costs.reduce((s, x) => s + (x as number), 0) : null;
      spent += costUsd ?? 0;
      appendFileSync(
        log,
        `${JSON.stringify({
          case: c.id,
          arm: arm.arm,
          variant,
          final: variant === arm.final,
          band,
          rep,
          ok: error === null,
          score,
          error,
          calls: requests.length,
          questionCount: requests.reduce((s, r) => s + Object.keys(r.questions).length, 0),
          costUsd,
          ms,
          requests,
        })}\n`,
      );
    }
  }
  await Promise.all(Array.from({ length: Number(a.concurrency) }, worker));
  console.log(`${jobs.length} judgments, ${refused} refused, ${spent.toFixed(4)} USD -> ${log}`);
}

await main();
