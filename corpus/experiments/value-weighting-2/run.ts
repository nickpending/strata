/**
 * Runs arm variants over built cases with the harness's Jev client, unchanged. Per case and rep,
 * every selected (arm, variant) pair is asked once, in an order that rotates per rep so drift over
 * time hits every arm. Each call's state, questions, answers and the arm's own score go to
 * corpus/runs/value-weighting-2/<stamp>-<tag>/calls.jsonl, which stays local. No label is read.
 *
 * usage: bun run.ts --cases <cases.json> --tag <tag> [--arms o1,o2] [--variants id,id|all|final]
 *                   [--reps 2] [--only case,case] [--concurrency 6]
 */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { decide } from "../../../harness/src/jev.ts";
import type { BuiltCase, Variant } from "./build.ts";
import type { ArmModule } from "./contract.ts";

const here = import.meta.dir;

type Job = { c: BuiltCase; rep: number; arm: ArmModule; variant: string };

async function main() {
  const { values: a } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      cases: { type: "string" },
      tag: { type: "string" },
      arms: { type: "string", default: "o1,o2" },
      variants: { type: "string", default: "final" },
      reps: { type: "string", default: "2" },
      only: { type: "string" },
      concurrency: { type: "string", default: "6" },
    },
  });
  if (!a.cases || !a.tag) throw new Error("--cases and --tag are required");
  const cases: BuiltCase[] = JSON.parse(readFileSync(a.cases, "utf8"));
  const variants: Variant[] = JSON.parse(readFileSync(join(here, "variants.json"), "utf8"));
  const importanceOf = (c: BuiltCase) => {
    const v = variants.find((x) => x.id === c.holder.variant);
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
        : a.variants.split(",").filter((id) => m.variants.some((v) => v.id === id));
  const reps = Number(a.reps);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(here, "../../runs/value-weighting-2", `${stamp}-${a.tag}`);
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "calls.jsonl");

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
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++] as Job;
      const { c, rep, arm, variant } = job;
      const imp = importanceOf(c);
      let state: string;
      let questions: ReturnType<ArmModule["variants"][number]["questions"]>;
      let score: (ans: Parameters<ArmModule["variants"][number]["score"]>[0]) => number;
      let band: number;
      if (arm.arm === "O1") {
        const v = arm.variants.find((x) => x.id === variant);
        if (!v) throw new Error(variant);
        band = v.band;
        state = v.state(c, imp);
        questions = v.questions(c);
        score = (ans) => v.score(ans);
      } else {
        const v = arm.variants.find((x) => x.id === variant);
        if (!v) throw new Error(variant);
        band = v.band;
        state = v.state(c);
        questions = v.questions(c);
        score = (ans) => v.score(ans, imp);
      }
      const t = performance.now();
      const r = await decide(state, questions);
      const ms = Math.round(performance.now() - t);
      const s = r.ok ? score(r.answers) : null;
      if (!r.ok) {
        refused++;
        console.error(`${c.id} ${arm.arm}/${variant} ${rep}: ${r.refusal.kind} ${r.refusal.message}`);
      }
      appendFileSync(
        log,
        `${JSON.stringify({ case: c.id, arm: arm.arm, variant, final: variant === arm.final, band, rep, ms, state, questions, result: r, score: s, questionCount: Object.keys(questions).length })}\n`,
      );
    }
  }
  await Promise.all(Array.from({ length: Number(a.concurrency) }, worker));
  console.log(`${jobs.length} calls, ${refused} refused -> ${log}`);
}

await main();
