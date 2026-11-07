/**
 * Turns the labeller's scenarios into cases by driving strata's real engine over the real world:
 * each scenario boots a fresh world, acts its steps through Engine.act and Engine.step, and each
 * case reads its holder's own copies. The target encounter's role comes from encountersOf
 * (src/engine/encounters.ts) over the holder's copies; a case whose holder has no encounter with
 * `other` from the target event is refused. Nothing here reads a label.
 *
 * usage: bun build.ts <material.json> [out-cases.json]
 *   prints every case as its holder reads it; with an out path, writes the built cases as JSON.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Encounter, encountersOf, type Role } from "../../../src/engine/encounters.ts";
import { boot } from "../../../src/engine/engine.ts";
import type { WorldEvent } from "../../../src/engine/events.ts";
import { render } from "./render.ts";

const WORLD = join(import.meta.dir, "../../../world");

export type Step = { act: Record<string, string> } | { step: number };
export type CaseSpec = {
  id: string;
  holder: string;
  variant: string;
  other: string;
  /** Index into the scenario's steps of the step that records the target event. */
  target: number;
  /** For a clock step, which fired subkind is the target. */
  targetSubkind?: string;
};
export type Scenario = { id: string; steps: Step[]; cases: CaseSpec[] };
export type Variant = {
  id: string;
  person: string;
  importance: Record<string, number>;
};
export type Material = {
  identities: Record<string, string>;
  variants: Variant[];
  scenarios: Scenario[];
};

export type Line = { tick: number; text: string; withOther: boolean };
/** One built case: what the holder has received, as it reads it. No label, no importance. */
export type BuiltCase = {
  id: string;
  scenario: string;
  holder: { id: string; name: string; variant: string };
  other: { id: string; name: string };
  identity: string;
  role: Role;
  subkind: string;
  tick: number;
  /** Every copy the holder received in this scenario before the target, oldest first. */
  history: Line[];
  event: string;
};

export function build(material: Material): BuiltCase[] {
  const out: BuiltCase[] = [];
  for (const sc of material.scenarios) {
    const dir = mkdtempSync(join(tmpdir(), "vw2-"));
    const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
    if (!booted.ok) throw new Error(booted.refusal.message);
    const engine = booted.engine;
    try {
      const recorded: WorldEvent[][] = [];
      sc.steps.forEach((s, i) => {
        if ("act" in s) {
          const r = engine.act(s.act);
          if (r.outcome !== "recorded") {
            throw new Error(`${sc.id} step ${i}: ${r.outcome} ${JSON.stringify(r)}`);
          }
          recorded.push(r.events);
        } else {
          const evs: WorldEvent[] = [];
          for (let k = 0; k < s.step; k++) evs.push(...engine.step());
          recorded.push(evs);
        }
      });
      const defs = engine.defs;
      const nameOf = (id: string) => defs.people.find((p) => p.id === id)?.name ?? id;
      for (const c of sc.cases) {
        const variant = material.variants.find((v) => v.id === c.variant);
        if (!variant || variant.person !== c.holder) {
          throw new Error(`${c.id}: variant ${c.variant} is not a variant of ${c.holder}`);
        }
        const evs = (recorded[c.target] ?? []).filter((e) =>
          c.targetSubkind ? e.subkind === c.targetSubkind : e.subkind !== "time.tick",
        );
        if (evs.length !== 1) throw new Error(`${c.id}: target step names ${evs.length} events`);
        const target = evs[0] as WorldEvent;
        const copies = engine.received(c.holder);
        const mine = copies.find((cp) => cp.id === target.id);
        if (!mine) throw new Error(`${c.id}: ${c.holder} received no copy of the target`);
        const isPerson = (id: string) => engine.isPerson(id);
        const enc: Encounter | undefined = encountersOf([mine], c.holder, isPerson).find(
          (e) => e.with === c.other,
        );
        if (!enc) throw new Error(`${c.id}: the target is no encounter of ${c.holder} with ${c.other}`);
        const history = copies
          .filter((cp) => cp.seq < target.seq && cp.subkind !== "time.tick")
          .map((cp) => ({
            tick: cp.tick,
            text: render(cp, defs, c.holder),
            withOther: encountersOf([cp], c.holder, isPerson).some((e) => e.with === c.other),
          }));
        const identity = material.identities[c.holder];
        if (identity === undefined) throw new Error(`${c.id}: no identity for ${c.holder}`);
        out.push({
          id: c.id,
          scenario: sc.id,
          holder: { id: c.holder, name: nameOf(c.holder), variant: c.variant },
          other: { id: c.other, name: nameOf(c.other) },
          identity,
          role: enc.role,
          subkind: mine.subkind,
          tick: mine.tick,
          history,
          event: render(mine, defs, c.holder),
        });
      }
    } finally {
      engine.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }
  return out;
}

export function show(c: BuiltCase): string {
  const lines = [
    `## ${c.id} (${c.scenario}) holder ${c.holder.name} [${c.holder.variant}], other ${c.other.name}, role ${c.role}, ${c.subkind}`,
  ];
  for (const h of c.history) lines.push(`  [tick ${h.tick}]${h.withOther ? " *" : "  "} ${h.text}`);
  lines.push(`  [tick ${c.tick}] >> ${c.event}`);
  return lines.join("\n");
}

if (import.meta.main) {
  const [path, outPath] = Bun.argv.slice(2);
  if (!path) throw new Error("usage: bun build.ts <material.json> [out-cases.json]");
  const material = JSON.parse(readFileSync(path, "utf8")) as Material;
  const cases = build(material);
  console.log(cases.map(show).join("\n\n"));
  if (outPath) writeFileSync(outPath, `${JSON.stringify(cases, null, 2)}\n`);
}
