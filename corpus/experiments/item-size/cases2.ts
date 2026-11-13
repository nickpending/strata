/**
 * The second labeller's input: every case of a material built through the real engine (`../size-judgment/build.ts`
 * `build`, the BuiltCase each holder reads), with the identities and each holder variant's importances. It carries
 * nothing from labels.json and no kind, pair or set. Each case's `lines` are what the holder received, oldest
 * first, ending with the target event marked `>>`.
 *
 * usage: bun cases2.ts <material.json> <out-cases.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { build, type Material } from "../size-judgment/build.ts";

const [path, out] = Bun.argv.slice(2);
if (!path || !out) throw new Error("usage: bun cases2.ts <material.json> <out-cases.json>");
const material = JSON.parse(readFileSync(path, "utf8")) as Material;
const cases = build(material).map(({ id, holder, other, role, subkind, history, event }) => ({
  id,
  holder,
  other,
  role,
  subkind,
  lines: [...history.map((h) => h.text), `>> ${event}`],
}));
writeFileSync(
  out,
  `${JSON.stringify({ identities: material.identities, variants: material.variants, cases }, null, 2)}\n`,
);
console.log(`${cases.length} cases -> ${out}`);
