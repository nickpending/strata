/**
 * jev-state's builder: `../size-judgment/build.ts`, plus the typed engine data a structured state is built from.
 * Every BuiltCase field is computed exactly as size-judgment's builder computes it (`check-build.ts` checks that
 * `buildTyped(m)` minus the added fields deep-equals size-judgment's `build(m)` on the material). Added, per case,
 * all read from the holder's own received copies the way size-judgment's builder reads them, never a later one:
 *   - `copy`: the holder's copy of the target, typed (subkind, kind, tick, actor, targets, place, payload, with ids);
 *   - `historyCopies`: the holder's earlier copies (time.tick dropped), typed, each with `withOther`;
 *   - `knowledge`: the holder's known rows as of the target (authored at boot, or taught by a copy at or before the
 *     target), the latest per (kind, thing), and the people it knows by an authored tie or an encounter so far;
 *   - `encounters`: the holder's encounters from copies at or before the target;
 *   - `names`: id to display name as the holder reads it (the holder is "you"), and `world`: the rooms', items' and
 *     people's names and descriptions, the holder's authored ties.
 * No engine or harness change: it reads `Engine.received`, `Engine.knowledge`, `Engine.encounters` and `engine.defs`.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Encounter } from "../../../src/engine/encounters.ts";
import { boot } from "../../../src/engine/engine.ts";
import type { Copy, WorldEvent } from "../../../src/engine/events.ts";
import type { BuiltCase, Material } from "../size-judgment/build.ts";
import { namer, render } from "../value-weighting-2/render.ts";

export type { BuiltCase, Material };

const WORLD = join(import.meta.dir, "../../../world");

/** An engine copy as data: the envelope's ids and the payload the holder holds. */
export type TypedCopy = {
  id: string;
  seq: number;
  subkind: string;
  kind: string;
  tick: number;
  actor: string;
  targets: string[];
  place: string | null;
  payload: Record<string, unknown>;
};
export type KnownFactRow = { kind: string; thing: string; value: unknown; tick: number; source: string };
export type KnownPersonRow = { person: string; since: number; how: "tie" | "encounter" };
export type TypedCase = BuiltCase & {
  copy: TypedCopy;
  historyCopies: (TypedCopy & { withOther: boolean })[];
  knowledge: { facts: KnownFactRow[]; people: KnownPersonRow[] };
  encounters: Encounter[];
  names: Record<string, string>;
  world: {
    rooms: { id: string; name: string; description: string }[];
    items: { id: string; name: string; description: string }[];
    people: { id: string; name: string }[];
    ties: { target: string; kind: string; note: string }[];
  };
};

const typed = (cp: Copy): TypedCopy => ({
  id: cp.id,
  seq: cp.seq,
  subkind: cp.subkind,
  kind: cp.kind,
  tick: cp.tick,
  actor: cp.actor,
  targets: [...cp.targets],
  place: cp.place,
  payload: { ...cp.payload },
});

export function buildTyped(material: Material): TypedCase[] {
  const out: TypedCase[] = [];
  for (const sc of material.scenarios) {
    const dir = mkdtempSync(join(tmpdir(), "js-"));
    const booted = boot(WORLD, { tickMinutes: 10, dbPath: join(dir, "world.sqlite") });
    if (!booted.ok) throw new Error(booted.refusal.message);
    const engine = booted.engine;
    try {
      const recorded: WorldEvent[][] = [];
      sc.steps.forEach((s, i) => {
        if ("act" in s) {
          const r = engine.act(s.act);
          if (r.outcome !== "recorded") throw new Error(`${sc.id} step ${i}: ${r.outcome} ${JSON.stringify(r)}`);
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
        if (!variant || variant.person !== c.holder)
          throw new Error(`${c.id}: variant ${c.variant} is not a variant of ${c.holder}`);
        const evs = (recorded[c.target] ?? []).filter((e) =>
          c.targetSubkind ? e.subkind === c.targetSubkind : e.subkind !== "time.tick",
        );
        if (evs.length !== 1) throw new Error(`${c.id}: target step names ${evs.length} events`);
        const target = evs[0] as WorldEvent;
        const copies = engine.received(c.holder);
        const mine = copies.find((cp) => cp.id === target.id);
        if (!mine) throw new Error(`${c.id}: ${c.holder} received no copy of the target`);
        const encounters = engine.encounters(c.holder).encounters;
        const enc = encounters.find((e) => e.event === target.id && e.with === c.other);
        if (!enc) throw new Error(`${c.id}: the target is no encounter of ${c.holder} with ${c.other}`);
        const earlier = copies.filter((cp) => cp.seq < target.seq && cp.subkind !== "time.tick");
        const history = earlier.map((cp) => ({
          tick: cp.tick,
          text: render(cp, defs, c.holder),
          withOther: encounters.some((e) => e.event === cp.id && e.with === c.other),
        }));
        const identity = material.identities[c.holder];
        if (identity === undefined) throw new Error(`${c.id}: no identity for ${c.holder}`);

        // As of the target: copies at or before it; known rows authored at boot or taught by such a copy.
        const seqOf = new Map(copies.map((cp) => [cp.id, cp.seq]));
        const upTo = (event: string | null) => event === null || (seqOf.get(event) ?? Infinity) <= target.seq;
        const encSoFar = encounters.filter((e) => upTo(e.event));
        const view = engine.knowledge(c.holder);
        const rows = view.history.filter((r) => r.source === "authored" || upTo(r.source));
        const latest = new Map<string, KnownFactRow>();
        for (const r of rows)
          latest.set(`${r.kind}|${r.thing}`, { kind: r.kind, thing: r.thing, value: r.value, tick: r.tick, source: r.source });
        const def = defs.people.find((p) => p.id === c.holder);
        if (!def) throw new Error(`${c.id}: no person ${c.holder}`);
        const people = new Map<string, KnownPersonRow>();
        for (const t of def.ties) people.set(t.target, { person: t.target, since: 0, how: "tie" });
        for (const e of encSoFar)
          if (!people.has(e.with)) people.set(e.with, { person: e.with, since: e.tick, how: "encounter" });
        const n = namer(defs, c.holder);
        const names: Record<string, string> = {};
        for (const x of [...defs.people, ...defs.rooms, ...defs.items]) names[x.id] = n(x.id);

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
          copy: typed(mine),
          historyCopies: earlier.map((cp) => ({
            ...typed(cp),
            withOther: encounters.some((e) => e.event === cp.id && e.with === c.other),
          })),
          knowledge: { facts: [...latest.values()], people: [...people.values()] },
          encounters: encSoFar,
          names,
          world: {
            rooms: defs.rooms.map((r) => ({ id: r.id, name: r.name, description: r.description })),
            items: defs.items.map((i) => ({ id: i.id, name: i.name, description: i.description })),
            people: defs.people.map((p) => ({ id: p.id, name: p.name })),
            ties: def.ties.map((t) => ({ target: t.target, kind: t.kind, note: t.note })),
          },
        });
      }
    } finally {
      engine.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }
  return out;
}
