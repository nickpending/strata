/**
 * Checks jev-state's builder against size-judgment's: on a material file, every case of `buildTyped`, with the
 * added fields removed, deep-equals size-judgment's `build` case; and nothing added postdates the target (every
 * typed history copy and every encounter is at or before the target's seq, every known fact's source too).
 *
 * usage: bun check-build.ts <material.json>
 */
import { readFileSync } from "node:fs";
import { build, type Material } from "../size-judgment/build.ts";
import { buildTyped } from "./build.ts";

const path = Bun.argv[2];
if (!path) throw new Error("usage: bun check-build.ts <material.json>");
const m = JSON.parse(readFileSync(path, "utf8")) as Material;
const plain = build(m);
const typed = buildTyped(m);
if (plain.length !== typed.length) throw new Error(`case count ${plain.length} != ${typed.length}`);
let facts = 0;
for (let i = 0; i < plain.length; i++) {
  const { copy, historyCopies, knowledge, encounters, names, world, ...rest } = typed[i] as (typeof typed)[number];
  const p = plain[i];
  if (!Bun.deepEquals(rest, p, true)) throw new Error(`case ${p?.id}: builders differ`);
  if (historyCopies.length !== rest.history.length) throw new Error(`${p?.id}: history length`);
  if (historyCopies.some((h) => h.seq >= copy.seq)) throw new Error(`${p?.id}: a history copy postdates the target`);
  const seqs = new Map([...historyCopies, copy].map((h) => [h.id, h.seq]));
  for (const e of encounters) if (e.tick > copy.tick) throw new Error(`${p?.id}: encounter after target`);
  for (const f of knowledge.facts) {
    facts++;
    if (f.source !== "authored" && !seqs.has(f.source)) throw new Error(`${p?.id}: fact from an unseen copy`);
  }
  if (!names[rest.holder.id] || names[rest.holder.id] !== "you") throw new Error(`${p?.id}: holder not "you"`);
  if (!world.items.length) throw new Error("no items");
}
console.log(`${typed.length} cases: typed builder equals size-judgment's; ${facts} known facts, none after its target`);
