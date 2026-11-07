/**
 * Scores a value-weighting run against the labels by the pre-registered rule (prereg.md) and prints
 * the tables as markdown.
 *
 * usage: bun score.ts <calls.jsonl>
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dir;
const read = (name: string) => JSON.parse(readFileSync(join(here, name), "utf8"));
type Value = { id: string };
type Profile = { id: string; importance: Record<string, number> };
type Touch = { value: string; direction: "advance" | "setback" };
type Event = { id: string; touches: Touch[] };
type Case = {
  id: string;
  event: string;
  profile: string;
  kind: string;
  pair: string | null;
  direction: "build" | "detract" | "neutral";
  magnitude: number;
};
type Row = {
  case: string;
  arm: "O1" | "O2";
  rep: number;
  ms: number;
  result:
    | { ok: true; answers: Record<string, { noul: number }>; costUsd: number | null }
    | { ok: false };
};

const values: Value[] = read("catalogue.json").values;
const profiles = new Map<string, Profile>((read("profiles.json") as Profile[]).map((p) => [p.id, p]));
const labels: { events: Event[]; cases: Case[] } = read("labels.json");
const events = new Map(labels.events.map((e) => [e.id, e]));
const cases = new Map(labels.cases.map((c) => [c.id, c]));
const path = Bun.argv[2];
if (!path) throw new Error("usage: bun score.ts <calls.jsonl>");
const rows: Row[] = readFileSync(path, "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

const BAND = 0.25;
const GATE = 0.5;
type Arm = "O1" | "O2" | "O2-gated";
const ARMS: Arm[] = ["O1", "O2", "O2-gated"];

function scoreOf(arm: Arm, c: Case, a: Record<string, { noul: number }>): number {
  const n = (k: string) => a[k]?.noul ?? Number.NaN;
  if (arm === "O1") return n("builds") - n("detracts");
  const w = profiles.get(c.profile)?.importance ?? {};
  let s = 0;
  for (const v of values) {
    const adv = n(`adv_${v.id}`);
    const set = n(`set_${v.id}`);
    if (arm === "O2-gated" && Math.max(adv, set) < GATE) continue;
    s += (w[v.id] ?? 0) * (adv - set);
  }
  return s / 4;
}

const signed = (c: Case) =>
  c.direction === "build" ? c.magnitude : c.direction === "detract" ? -c.magnitude : 0;
const signOk = (c: Case, s: number) => (c.direction === "build" ? s > 0 : s < 0);
const threeWay = (s: number) => (Math.abs(s) < BAND ? "neutral" : s > 0 ? "build" : "detract");
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};
function ranks(xs: number[]): number[] {
  const order = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(xs.length);
  for (let i = 0; i < order.length; ) {
    let j = i;
    while (j + 1 < order.length && order[j + 1]?.[0] === order[i]?.[0]) j++;
    for (let k = i; k <= j; k++) r[order[k]?.[1] as number] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}
function spearman(x: number[], y: number[]): number {
  const rx = ranks(x);
  const ry = ranks(y);
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    const a = (rx[i] as number) - mx;
    const b = (ry[i] as number) - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  return num / Math.sqrt(dx * dy);
}

const refused = rows.filter((r) => !r.result.ok);
const ok = rows.filter((r) => r.result.ok) as (Row & {
  result: { ok: true; answers: Record<string, { noul: number }>; costUsd: number | null };
})[];
const reps = [...new Set(rows.map((r) => r.rep))].sort();

// per arm, per case: the score of each rep
const per: Record<Arm, Map<string, number[]>> = {
  O1: new Map(),
  O2: new Map(),
  "O2-gated": new Map(),
};
for (const r of ok) {
  const c = cases.get(r.case);
  if (!c) continue;
  const arms: Arm[] = r.arm === "O1" ? ["O1"] : ["O2", "O2-gated"];
  for (const arm of arms) {
    const list = per[arm].get(c.id) ?? [];
    list[r.rep] = scoreOf(arm, c, r.result.answers);
    per[arm].set(c.id, list);
  }
}

const all = labels.cases;
const directional = all.filter((c) => c.direction !== "neutral");
const out: string[] = [];
const fmt = (x: number) => (Number.isNaN(x) ? "NaN" : x.toFixed(2));
const m = (arm: Arm, c: Case) => mean((per[arm].get(c.id) ?? []).filter((x) => x !== undefined));

out.push(
  `Calls: ${rows.length} (${refused.length} refused). Reps: ${reps.length}. Cases: ${all.length} (${directional.length} build or detract).`,
  "",
  "| metric | O1 | O2 | O2-gated (secondary) |",
  "|---|---|---|---|",
);
const row = (name: string, f: (arm: Arm) => string) =>
  out.push(`| ${name} | ${ARMS.map(f).join(" | ")} |`);
row("M1 direction, mean score", (a) => `${directional.filter((c) => signOk(c, m(a, c))).length} / ${directional.length}`);
row("M1 direction, per rep", (a) =>
  reps
    .map((rep) => directional.filter((c) => signOk(c, per[a].get(c.id)?.[rep] ?? Number.NaN)).length)
    .join(" / "),
);
row("M2 Spearman ρ", (a) => fmt(spearman(all.map((c) => m(a, c)), all.map(signed))));
const pairs = all
  .filter((c) => c.pair && c.id < c.pair)
  .map((c) => [c, cases.get(c.pair as string) as Case] as const);
row("M3 opposite pairs held", (a) => `${pairs.filter(([x, y]) => signOk(x, m(a, x)) && signOk(y, m(a, y))).length} / ${pairs.length}`);
const conflict = all.filter((c) => c.kind === "conflict" && c.direction !== "neutral");
row("M4 conflict direction", (a) => `${conflict.filter((c) => signOk(c, m(a, c))).length} / ${conflict.length}`);
row("M5 three-way (band 0.25)", (a) => `${all.filter((c) => threeWay(m(a, c)) === c.direction).length} / ${all.length}`);
const neutral = all.filter((c) => c.direction === "neutral");
row("neutral cases' abs score, median / max", (a) => {
  const xs = neutral.map((c) => Math.abs(m(a, c)));
  return xs.length ? `${fmt(median(xs))} / ${fmt(Math.max(...xs))}` : "-";
});
row("M6 rerun spread, median / max", (a) => {
  const xs = all.map((c) => {
    const s = per[a].get(c.id) ?? [];
    return Math.max(...s) - Math.min(...s);
  });
  return `${fmt(median(xs))} / ${fmt(Math.max(...xs))}`;
});
for (const arm of ["O1", "O2"] as const) {
  const rs = ok.filter((r) => r.arm === arm);
  const cost = rs.map((r) => r.result.costUsd ?? 0);
  out.push(
    `| M7 ${arm}: questions, USD, median ms per judgment | ${arm === "O1" ? 2 : 20} nouls in 1 call | ${(mean(cost)).toExponential(2)} | ${median(rs.map((r) => r.ms))} |`,
  );
}

// D1: O2's per-value answers against the labeller's touches, averaged over reps
let touchOk = 0;
let touchN = 0;
const touchMiss: string[] = [];
const seenEvents = new Set<string>();
for (const c of all) {
  if (seenEvents.has(c.event)) continue;
  seenEvents.add(c.event);
  const e = events.get(c.event);
  const rs = ok.filter((r) => r.arm === "O2" && cases.get(r.case)?.event === c.event);
  for (const t of e?.touches ?? []) {
    const adv = mean(rs.map((r) => r.result.answers[`adv_${t.value}`]?.noul ?? Number.NaN));
    const set = mean(rs.map((r) => r.result.answers[`set_${t.value}`]?.noul ?? Number.NaN));
    touchN++;
    if (t.direction === "advance" ? adv > set : set > adv) touchOk++;
    else touchMiss.push(`${c.event}/${t.value} ${t.direction} (adv ${fmt(adv)}, set ${fmt(set)})`);
  }
}
out.push("", `D1 O2 per-value direction vs labelled touches: ${touchOk} / ${touchN}.`);
if (touchMiss.length) out.push(`Misses: ${touchMiss.join("; ")}.`);

out.push("", "| case | kind | label | O1 | O2 | O2-gated | O1 reps | O2 reps |", "|---|---|---|---|---|---|---|---|");
for (const c of all) {
  const mark = (a: Arm) => {
    const s = m(a, c);
    const good = c.direction === "neutral" ? Math.abs(s) < BAND : signOk(c, s);
    return `${fmt(s)}${good ? "" : " ✗"}`;
  };
  const repsOf = (a: Arm) => (per[a].get(c.id) ?? []).map(fmt).join(", ");
  out.push(
    `| ${c.id} | ${c.kind}${c.pair ? ` ↔ ${c.pair}` : ""} | ${c.direction} ${c.magnitude} | ${mark("O1")} | ${mark("O2")} | ${mark("O2-gated")} | ${repsOf("O1")} | ${repsOf("O2")} |`,
  );
}
console.log(out.join("\n"));
