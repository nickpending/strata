/**
 * The value-weighting arms (prereg.md): for every labelled case and rep, one Jev call per arm, using the
 * harness's own client unchanged. Each call's state, questions and answers go to
 * corpus/runs/value-weighting/<stamp>/calls.jsonl, which stays local.
 *
 * usage: bun run.ts [reps=3]
 */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { decide, type NoulQuestion } from "../../../harness/src/jev.ts";

const here = import.meta.dir;
const read = (name: string) => JSON.parse(readFileSync(join(here, name), "utf8"));

type Value = { id: string; description: string };
type Profile = { id: string; name: string; importance: Record<string, number> };
type Event = { id: string; other: string; text: string };
type Case = { id: string; event: string; profile: string };

const values: Value[] = read("catalogue.json").values;
const profiles = new Map<string, Profile>((read("profiles.json") as Profile[]).map((p) => [p.id, p]));
const labels: { events: Event[]; cases: Case[] } = read("labels.json");
const events = new Map(labels.events.map((e) => [e.id, e]));

export function stateOf(arm: "O1" | "O2", p: Profile, e: Event): string {
  const lines = [`You are ${p.name}.`, `You have known ${e.other} for a long time.`];
  if (arm === "O1") {
    lines.push(
      "",
      "How much each of these matters to you, from 0 (not at all) to 4 (central to who you are):",
      ...values.map((v) => `- ${v.description}: ${p.importance[v.id]}`),
    );
  }
  lines.push("", `What just happened: ${e.text}`);
  return lines.join("\n");
}

export function questionsOf(arm: "O1" | "O2", e: Event): Record<string, NoulQuestion> {
  if (arm === "O1") {
    const ask = (verb: string): NoulQuestion => ({
      type: "noul",
      instructions: `Judged by what matters to you, does what just happened ${verb} your relationship with ${e.other}?`,
    });
    return { builds: ask("build on"), detracts: ask("detract from") };
  }
  const qs: Record<string, NoulQuestion> = {};
  for (const v of values) {
    qs[`adv_${v.id}`] = {
      type: "noul",
      instructions: `Does what just happened advance this for you: ${v.description}?`,
    };
    qs[`set_${v.id}`] = {
      type: "noul",
      instructions: `Does what just happened set this back for you: ${v.description}?`,
    };
  }
  return qs;
}

if (import.meta.main) {
  const reps = Number(Bun.argv[2] ?? 3);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(here, "../../runs/value-weighting", stamp);
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "calls.jsonl");
  let flip = false;
  for (const c of labels.cases) {
    const p = profiles.get(c.profile);
    const e = events.get(c.event);
    if (!p || !e) throw new Error(`case ${c.id} names a missing profile or event`);
    for (let rep = 0; rep < reps; rep++) {
      const arms: ("O1" | "O2")[] = flip ? ["O2", "O1"] : ["O1", "O2"];
      flip = !flip;
      for (const arm of arms) {
        const state = stateOf(arm, p, e);
        const questions = questionsOf(arm, e);
        const t = performance.now();
        const r = await decide(state, questions);
        const ms = Math.round(performance.now() - t);
        appendFileSync(
          log,
          `${JSON.stringify({ case: c.id, arm, rep, ms, state, questions, result: r })}\n`,
        );
        if (!r.ok) console.error(`${c.id} ${arm} ${rep}: ${r.refusal.kind} ${r.refusal.message}`);
      }
    }
  }
  console.log(log);
}
