#!/usr/bin/env bun
/*
 * score.ts - scorer for gate-direction (spec: prereg.md "Scoring" and "Comparison, decided now").
 * usage: bun score.ts --calls a.jsonl[,b.jsonl] --labels labels.json [--labels2 labels2.json] [--seed 1] [--resamples 10000]
 * Output: Markdown on stdout.
 *
 * Choices where the spec is silent (plain reading):
 *  1. Scored cases: labelled cases that appear in the judgments. Items: every `<channel>__<value>` key in the first
 *     labeller's stake and deed maps for those cases. Judgments for unlabelled cases are ignored (count printed).
 *  2. A judgment is refused when ok is false or readings is null; it contributes no readings to that rep. An item with
 *     no finite reading in a rep is left out of that rep's metrics. Duplicate (case, arm, variant, rep) lines: the later
 *     line wins for readings; cost/call/ms stats count every line. "Reps" = distinct rep values per (arm, variant).
 *  3. Every metric is computed per rep, then averaged over reps ignoring NaN reps (all NaN -> NaN). SD over reps is the
 *     sample SD (n-1), NaN with fewer than 2 usable reps. Spearman = Pearson on average ranks (exact, tie-corrected),
 *     NaN for a constant input or fewer than 2 items. M2 is NaN with no touched item; M3 is NaN when either class is empty.
 *  4. M3 AUC = Mann-Whitney U over average ranks of |r| (ties count half), touched (y != 0) against untouched.
 *  5. M5: a value qualifies with 8+ touched items (both channels pooled) in the scored set; its M2 and M3 use that
 *     value's items on both channels.
 *  6. M6: per rep counts, then mean over reps: false fires = untouched with |r| >= 0.5; misses = touched with
 *     |r| < 0.5 or sign(r) != y, split in quiet (|r| < 0.5) and wrong-sign-and-loud for information.
 *  7. M7: share of items (with readings in 2+ reps) whose sign(r) (-1, 0, +1) is not the same in every rep.
 *  8. M8: requests = calls, questions = questionCount, mean over all lines (refused included); USD mean over ok lines
 *     with non-null cost; median ms over all lines; "per judgment" = per line (one case).
 *  9. Ceiling: second labeller's label as r over items both labelled, M1, M2, M3 pooled and per channel; "touched"
 *     is still the first labeller's y. Consensus subset: items where y1 == y2; M1 and M2 per arm over it (M3 too).
 * 10. Bootstrap: scenarios (the judgment's `scenario`) drawn with replacement; every item of a drawn scenario enters
 *     with its multiplicity (a weighted Spearman, identical to replicating the items). Per resample, each arm's M1 is
 *     the mean over reps (NaN reps ignored); resamples where either is NaN are dropped (count printed). Interval =
 *     percentiles alpha/2 and 1-alpha/2 with alpha = 0.05 / m, m = number of challenger finals present (2 in the
 *     prereg, so 97.5%). Seeded mulberry32. Beats A: lower bound > 0.
 * 11. Recommendation: beater with highest M1; beaters within 0.02 of it compete on fewer questions per judgment, then
 *     higher M1. No beater: A. "A" is the arm whose final is flagged `final` with arm "A".
 * 12. Grade on the recommended final, overall M1/M2/M3: (a) M1 >= ceiling M1 - 0.10; (b) M2 >= 0.85; (c) M3 >= 0.85.
 *     All hold: yes; (a) fails with (b),(c) holding: partly; otherwise no. Without --labels2 (a) cannot be judged:
 *     the grade is "undetermined" when (b) and (c) hold, else "no".
 * 13. Step 4: A's larger loss = gate if 1-M3 > 1-M2, direction if smaller, "equal" if identical. The weaker channel
 *     is the one with the lower M1 (M4 of the spec); M2 and M3 per channel are printed beside it.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

type Lab = { id: string; stake: Record<string, string>; deed: Record<string, string>; [k: string]: unknown };
type Line = {
  case: string; scenario: string; arm: string; variant: string; final: boolean; rep: number; ok: boolean;
  readings: Record<string, number> | null; calls: number; questionCount: number; costUsd: number | null; ms: number;
};
type Item = { key: string; caseId: string; scenario: string; ch: string; value: string; y: number };
type Group = {
  arm: string; variant: string; final: boolean; lines: Line[]; reps: number[]; r: Map<number, Float64Array>;
};

const { values: a } = parseArgs({
  options: { calls: { type: "string" }, labels: { type: "string" }, labels2: { type: "string" }, seed: { type: "string", default: "1" }, resamples: { type: "string", default: "10000" } },
});
if (!a.calls || !a.labels) { console.error("usage: bun score.ts --calls a.jsonl[,b.jsonl] --labels labels.json [--labels2 labels2.json] [--seed 1] [--resamples 10000]"); process.exit(1); }
const seed = Number(a.seed), resamples = Number(a.resamples);

// ---------- stats ----------
function avgRanks(x: number[]): number[] {
  const idx = x.map((_, i) => i).sort((p, q) => x[p]! - x[q]!);
  const r = new Array<number>(x.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && x[idx[j + 1]!] === x[idx[i]!]) j++;
    for (let k = i; k <= j; k++) r[idx[k]!] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}
function pearson(a1: number[], b1: number[]): number {
  const n = a1.length;
  if (n < 2) return NaN;
  const ma = a1.reduce((s, v) => s + v, 0) / n, mb = b1.reduce((s, v) => s + v, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { sab += (a1[i]! - ma) * (b1[i]! - mb); saa += (a1[i]! - ma) ** 2; sbb += (b1[i]! - mb) ** 2; }
  if (saa === 0 || sbb === 0) return NaN;
  return sab / Math.sqrt(saa * sbb);
}
const spearman = (x: number[], y: number[]) => (x.length < 2 ? NaN : pearson(avgRanks(x), avgRanks(y)));
function auc(score: number[], pos: boolean[]): number {
  const r = avgRanks(score);
  let n1 = 0, s = 0;
  for (let i = 0; i < r.length; i++) if (pos[i]) { n1++; s += r[i]!; }
  const n0 = r.length - n1;
  if (!n1 || !n0) return NaN;
  return (s - (n1 * (n1 + 1)) / 2) / (n1 * n0);
}
const finite = (x: number[]) => x.filter((n) => !Number.isNaN(n));
const mean = (x: number[]) => { const v = finite(x); return v.length ? v.reduce((s, n) => s + n, 0) / v.length : NaN; };
const sd = (x: number[]) => {
  const v = finite(x);
  if (v.length < 2) return NaN;
  const m = mean(v);
  return Math.sqrt(v.reduce((s, n) => s + (n - m) ** 2, 0) / (v.length - 1));
};
const median = (x: number[]) => {
  if (!x.length) return NaN;
  const s = [...x].sort((p, q) => p - q), n = s.length;
  return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
};
const f = (n: number, d = 3) => (Number.isNaN(n) ? "NaN" : n.toFixed(d));
function mulberry32(s: number) {
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pct = (sorted: number[], p: number) => {
  const pos = p * (sorted.length - 1), lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
};
const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);

// ---------- load ----------
const yOf = (s: string) => (s === "up" ? 1 : s === "down" ? -1 : s === "none" ? 0 : NaN);
const labels = JSON.parse(readFileSync(a.labels, "utf8")) as { cases: Lab[] };
const labels2 = a.labels2 ? (JSON.parse(readFileSync(a.labels2, "utf8")) as { cases: Lab[] }) : null;
const lines = new Map<string, Line>(); // dedupe: later wins for readings
const allLines: Line[] = [];
for (const p of a.calls.split(",")) {
  for (const l of readFileSync(p, "utf8").split("\n")) {
    if (!l.trim()) continue;
    const j = JSON.parse(l) as Line;
    allLines.push(j);
    lines.set(`${j.case}|${j.arm}|${j.variant}|${j.rep}`, j);
  }
}
const labelled = new Map(labels.cases.map((c) => [c.id, c]));
const caseSet = new Set([...new Set(allLines.map((l) => l.case))].filter((id) => labelled.has(id)));
const scenarioOf = new Map<string, string>();
for (const l of allLines) scenarioOf.set(l.case, l.scenario);

const items: Item[] = [];
const idxOf = new Map<string, number>();
for (const id of [...caseSet].sort()) {
  const c = labelled.get(id)!;
  for (const ch of ["stake", "deed"] as const) {
    for (const [v, s] of Object.entries(c[ch] ?? {})) {
      const y = yOf(s);
      if (Number.isNaN(y)) continue;
      idxOf.set(`${id}|${ch}__${v}`, items.length);
      items.push({ key: `${ch}__${v}`, caseId: id, scenario: scenarioOf.get(id)!, ch, value: v, y });
    }
  }
}
const N = items.length;
const y2 = new Float64Array(N).fill(NaN);
if (labels2) for (const c of labels2.cases) for (const ch of ["stake", "deed"] as const) for (const [v, s] of Object.entries(c[ch] ?? {})) {
  const i = idxOf.get(`${c.id}|${ch}__${v}`);
  if (i !== undefined) y2[i] = yOf(s);
}

// ---------- groups ----------
const groups = new Map<string, Group>();
for (const l of allLines) {
  const key = `${l.arm}/${l.variant}`;
  if (!groups.has(key)) groups.set(key, { arm: l.arm, variant: l.variant, final: l.final, lines: [], reps: [], r: new Map() });
  const g = groups.get(key)!;
  if (caseSet.has(l.case)) g.lines.push(l);
  if (!g.r.has(l.rep)) g.r.set(l.rep, new Float64Array(N).fill(NaN));
}
for (const l of lines.values()) {
  if (!caseSet.has(l.case)) continue;
  const g = groups.get(`${l.arm}/${l.variant}`)!;
  const arr = g.r.get(l.rep)!;
  if (l.ok && l.readings) for (const [k, x] of Object.entries(l.readings)) {
    const i = idxOf.get(`${l.case}|${k}`);
    if (i !== undefined && Number.isFinite(x)) arr[i] = x;
  }
}
for (const g of groups.values()) g.reps = [...g.r.keys()].sort((p, q) => p - q);
const sorted = [...groups.values()].sort((p, q) => Number(q.final) - Number(p.final) || p.arm.localeCompare(q.arm) || p.variant.localeCompare(q.variant));

// ---------- metrics ----------
const all: number[] = Array.from({ length: N }, (_, i) => i);
const where = (p: (it: Item) => boolean) => all.filter((i) => p(items[i]!));
type M = { m1: number; m2: number; m3: number };
function metrics(r: ArrayLike<number>, ids: number[]): M {
  const xs: number[] = [], ys: number[] = [];
  let ok = 0, t = 0;
  const sc: number[] = [], pos: boolean[] = [];
  for (const i of ids) {
    const x = r[i]!;
    if (Number.isNaN(x)) continue;
    xs.push(x); ys.push(items[i]!.y);
    sc.push(Math.abs(x)); pos.push(items[i]!.y !== 0);
    if (items[i]!.y !== 0) { t++; if (sign(x) === items[i]!.y) ok++; }
  }
  return { m1: spearman(xs, ys), m2: t ? ok / t : NaN, m3: auc(sc, pos) };
}
const repM = (g: Group, ids: number[]) => g.reps.map((rep) => metrics(g.r.get(rep)!, ids));
const meanM = (ms: M[]): M => ({ m1: mean(ms.map((m) => m.m1)), m2: mean(ms.map((m) => m.m2)), m3: mean(ms.map((m) => m.m3)) });
const mline = (m: M) => `M1 ${f(m.m1)}, M2 ${f(m.m2)}, M3 ${f(m.m3)}`;

const touchedCount = new Map<string, number>();
for (const it of items) if (it.y !== 0) touchedCount.set(it.value, (touchedCount.get(it.value) ?? 0) + 1);
const bigValues = [...touchedCount].filter(([, n]) => n >= 8).map(([v]) => v).sort();

// ---------- header ----------
const out: string[] = [];
const P = (s = "") => out.push(s);
P("# gate-direction scoring");
P();
const scenarios = [...new Set(items.map((it) => it.scenario))].sort();
P(`judgments: ${allLines.length} lines (${allLines.filter((l) => !caseSet.has(l.case)).length} ignored, case unlabelled); cases ${caseSet.size}; scenarios ${scenarios.length}; items ${N}; seed ${seed}, resamples ${resamples}`);
const tc = (ch: string, y: number) => items.filter((it) => it.ch === ch && it.y === y).length;
P(`touched items: stake up ${tc("stake", 1)}, stake down ${tc("stake", -1)}, deed up ${tc("deed", 1)}, deed down ${tc("deed", -1)}; untouched: stake ${tc("stake", 0)}, deed ${tc("deed", 0)}`);
P(`values with 8+ touched items: ${bigValues.join(", ") || "none"}`);
P();
P("| arm / variant | final | judgments | refused | reps | refused per rep |");
P("|---|---|---|---|---|---|");
for (const g of sorted) {
  const ref = g.lines.filter((l) => !l.ok || !l.readings);
  P(`| ${g.arm} / ${g.variant} | ${g.final ? "yes" : "no"} | ${g.lines.length} | ${ref.length} | ${g.reps.length} | ${g.reps.map((r) => ref.filter((l) => l.rep === r).length).join(", ")} |`);
}
P();

// ---------- per group ----------
for (const g of sorted) {
  const ms = repM(g, all);
  P(`## ${g.arm} / ${g.variant}${g.final ? " (final)" : " (contender)"}`);
  P(`- M1 (primary) item rho: per rep [${ms.map((m) => f(m.m1)).join(", ")}], mean ${f(mean(ms.map((m) => m.m1)))}`);
  P(`- M2 direction ${f(mean(ms.map((m) => m.m2)))}; M3 gate AUC ${f(mean(ms.map((m) => m.m3)))}`);
  for (const ch of ["stake", "deed"]) P(`- M4 ${ch}: ${mline(meanM(repM(g, where((it) => it.ch === ch))))}`);
  P(`- M5 per value (8+ touched): ` + (bigValues.map((v) => { const m = meanM(repM(g, where((it) => it.value === v))); return `${v} M2 ${f(m.m2)} M3 ${f(m.m3)}`; }).join("; ") || "none"));
  let ff = [], miss = [], quiet = [];
  for (const rep of g.reps) {
    const r = g.r.get(rep)!;
    let a1 = 0, b1 = 0, c1 = 0;
    for (const i of all) {
      const x = r[i]!;
      if (Number.isNaN(x)) continue;
      const y = items[i]!.y;
      if (y === 0 && Math.abs(x) >= 0.5) a1++;
      if (y !== 0 && (Math.abs(x) < 0.5 || sign(x) !== y)) { b1++; if (Math.abs(x) < 0.5) c1++; }
    }
    ff.push(a1); miss.push(b1); quiet.push(c1);
  }
  P(`- M6 at 0.5 (mean over reps): false fires ${f(mean(ff), 1)} of ${items.filter((it) => it.y === 0).length} untouched; misses ${f(mean(miss), 1)} of ${items.filter((it) => it.y !== 0).length} touched (of which quiet ${f(mean(quiet), 1)})`);
  let chg = 0, multi = 0;
  for (const i of all) {
    const ss = new Set<number>();
    for (const rep of g.reps) { const x = g.r.get(rep)![i]!; if (!Number.isNaN(x)) ss.add(sign(x)); }
    const n = g.reps.filter((rep) => !Number.isNaN(g.r.get(rep)![i]!)).length;
    if (n >= 2) { multi++; if (ss.size > 1) chg++; }
  }
  P(`- M7 share of items whose sign changes across reps ${f(multi ? chg / multi : NaN)} (${chg}/${multi}); SD of M1 over reps ${f(sd(ms.map((m) => m.m1)))}`);
  const okc = g.lines.filter((l) => l.ok && l.costUsd !== null);
  P(`- M8 requests/judgment ${f(mean(g.lines.map((l) => l.calls)), 2)}, questions/judgment ${f(mean(g.lines.map((l) => l.questionCount)), 2)}, USD/judgment ${okc.length ? (okc.reduce((s, l) => s + l.costUsd!, 0) / okc.length).toExponential(2) : "NaN"}, median ms ${f(median(g.lines.map((l) => l.ms)), 0)}`);
  P();
}

// ---------- ceiling and consensus ----------
let ceil: M = { m1: NaN, m2: NaN, m3: NaN };
if (labels2) {
  P("## Ceiling: second labeller as an arm");
  const both = all.filter((i) => !Number.isNaN(y2[i]!));
  P(`- items labelled by both: ${both.length} of ${N}`);
  ceil = metrics(y2, both);
  P(`- overall: ${mline(ceil)}`);
  for (const ch of ["stake", "deed"]) P(`- ${ch}: ${mline(metrics(y2, both.filter((i) => items[i]!.ch === ch)))}`);
  const cons = both.filter((i) => y2[i] === items[i]!.y);
  P();
  P(`## Consensus subset (both labellers agree): ${cons.length} items, ${cons.filter((i) => items[i]!.y !== 0).length} touched`);
  for (const g of sorted) P(`- ${g.arm}/${g.variant}${g.final ? " (final)" : ""}: ${mline(meanM(repM(g, cons)))}`);
  P();
}

// ---------- comparison ----------
P("## Comparison (finals)");
const finals = sorted.filter((g) => g.final);
const A = finals.find((g) => g.arm === "A");
const chal = finals.filter((g) => g.arm !== "A");
const point = new Map<Group, M>(finals.map((g) => [g, meanM(repM(g, all))]));
let verdict = "VERDICT: no A final present, no comparison";
if (A) {
  const m = chal.length, alpha = 0.05 / Math.max(m, 1);
  P(`Step 1. Paired scenario bootstrap on M1: ${scenarios.length} scenarios, ${resamples} resamples, seed ${seed}; ${m} challenger(s), interval ${f((1 - alpha) * 100, 2)}%.`);
  const sIdx = new Map(scenarios.map((s, i) => [s, i]));
  const scenOfItem = Int32Array.from(items.map((it) => sIdx.get(it.scenario)!));
  // presort per (group, rep): items with readings, ordered by reading and by label, with tie-group starts
  type Prep = { idx: Int32Array; ox: Int32Array; nx: Uint8Array; oy: Int32Array; ny: Uint8Array; rx: Float64Array; ry: Float64Array };
  const prep = (g: Group): Prep[] => g.reps.map((rep) => {
    const r = g.r.get(rep)!;
    const idx = Int32Array.from(all.filter((i) => !Number.isNaN(r[i]!)));
    const n = idx.length;
    const mk = (val: (i: number) => number) => {
      const o = Int32Array.from({ length: n }, (_, k) => k).sort((p, q) => val(idx[p]!) - val(idx[q]!));
      const nw = new Uint8Array(n);
      for (let k = 0; k < n; k++) nw[k] = k === 0 || val(idx[o[k]!]!) !== val(idx[o[k - 1]!]!) ? 1 : 0;
      return { o, nw };
    };
    const X = mk((i) => r[i]!), Y = mk((i) => items[i]!.y);
    return { idx, ox: X.o, nx: X.nw, oy: Y.o, ny: Y.nw, rx: new Float64Array(n), ry: new Float64Array(n) };
  });
  const wrank = (o: Int32Array, nw: Uint8Array, w: Float64Array, out2: Float64Array) => {
    const n = o.length;
    let cum = 0, k = 0;
    while (k < n) {
      let j = k, W = w[o[k]!]!;
      while (j + 1 < n && !nw[j + 1]) { j++; W += w[o[j]!]!; }
      const rk = cum + (W + 1) / 2;
      for (let q = k; q <= j; q++) out2[o[q]!] = rk;
      cum += W; k = j + 1;
    }
  };
  const wspear = (p: Prep, wi: Float64Array): number => {
    const n = p.idx.length;
    wrank(p.ox, p.nx, wi, p.rx); wrank(p.oy, p.ny, wi, p.ry);
    let sw = 0, mx = 0, my = 0;
    for (let k = 0; k < n; k++) { const w = wi[k]!; sw += w; mx += w * p.rx[k]!; my += w * p.ry[k]!; }
    if (sw < 2) return NaN;
    mx /= sw; my /= sw;
    let sxy = 0, sxx = 0, syy = 0;
    for (let k = 0; k < n; k++) { const w = wi[k]!; const dx = p.rx[k]! - mx, dy = p.ry[k]! - my; sxy += w * dx * dy; sxx += w * dx * dx; syy += w * dy * dy; }
    if (sxx === 0 || syy === 0) return NaN;
    return sxy / Math.sqrt(sxx * syy);
  };
  const preps = new Map<Group, Prep[]>([A, ...chal].map((g) => [g, prep(g)]));
  // sanity: unit weights reproduce the plain M1
  const unit = (g: Group) => mean(preps.get(g)!.map((p) => wspear(p, new Float64Array(p.idx.length).fill(1))));
  P(`(weighted-Spearman check at unit weights: A ${f(unit(A), 6)} vs plain ${f(point.get(A)!.m1, 6)})`);
  const rng = mulberry32(seed);
  const cnt = new Float64Array(scenarios.length);
  const draws: Float64Array[] = [];
  for (let b = 0; b < resamples; b++) {
    cnt.fill(0);
    for (let s = 0; s < scenarios.length; s++) cnt[Math.floor(rng() * scenarios.length)]!++;
    draws.push(Float64Array.from(cnt));
  }
  const beaters: Group[] = [];
  const diffsBy = new Map<Group, string>();
  for (const c of chal) {
    const diffs: number[] = [];
    let dropped = 0;
    const pa = preps.get(A)!, pc = preps.get(c)!;
    const wa = pa.map((p) => new Float64Array(p.idx.length)), wc = pc.map((p) => new Float64Array(p.idx.length));
    for (const d of draws) {
      const val = (ps: Prep[], ws: Float64Array[]) => mean(ps.map((p, r) => { const w = ws[r]!; for (let k = 0; k < p.idx.length; k++) w[k] = d[scenOfItem[p.idx[k]!]!]!; return wspear(p, w); }));
      const xa = val(pa, wa), xc = val(pc, wc);
      if (Number.isNaN(xa) || Number.isNaN(xc)) dropped++; else diffs.push(xc - xa);
    }
    diffs.sort((p, q) => p - q);
    const lo = diffs.length ? pct(diffs, alpha / 2) : NaN, hi = diffs.length ? pct(diffs, 1 - alpha / 2) : NaN;
    const outcome = lo > 0 ? "beats A" : hi < 0 ? "A is better" : "no difference";
    if (lo > 0) beaters.push(c);
    diffsBy.set(c, outcome);
    P(`- ${c.arm}/${c.variant}: M1 ${f(point.get(c)!.m1)} vs A ${f(point.get(A)!.m1)}, difference ${f(point.get(c)!.m1 - point.get(A)!.m1)}; interval [${f(lo)}, ${f(hi)}] (${diffs.length} resamples used, ${dropped} dropped as NaN): ${outcome}`);
  }
  P();
  const qpj = (g: Group) => mean(g.lines.map((l) => l.questionCount));
  let rec: Group = A;
  if (!beaters.length) P(`Step 2. No challenger beats A; recommended: A (${A.variant}).`);
  else {
    const top = beaters.reduce((b, g) => (point.get(g)!.m1 > point.get(b)!.m1 ? g : b));
    const rivals = beaters.filter((g) => point.get(top)!.m1 - point.get(g)!.m1 <= 0.02).sort((p, q) => qpj(p) - qpj(q) || point.get(q)!.m1 - point.get(p)!.m1);
    rec = rivals[0]!;
    P(`Step 2. Beaters: ${beaters.map((g) => g.arm).join(", ")}; top M1 ${top.arm} ${f(point.get(top)!.m1)}; within 0.02 of top: ${rivals.map((g) => `${g.arm} (${f(qpj(g), 2)} questions/judgment)`).join(", ")}; recommended: ${rec.arm}/${rec.variant}.`);
  }
  P();
  const pm = point.get(rec)!;
  const bOk = pm.m2 >= 0.85, cOk = pm.m3 >= 0.85;
  let grade: string;
  P(`Step 3. Grade of ${rec.arm}/${rec.variant}:`);
  P(`- (b) M2 ${f(pm.m2)} >= 0.85: ${bOk ? "holds" : "fails"}`);
  P(`- (c) M3 ${f(pm.m3)} >= 0.85: ${cOk ? "holds" : "fails"}`);
  if (!labels2) {
    P(`- (a) M1 ${f(pm.m1)} against ceiling M1 - 0.10: cannot be judged, no --labels2`);
    grade = bOk && cOk ? "undetermined" : "no";
  } else {
    const aOk = pm.m1 >= ceil.m1 - 0.1;
    P(`- (a) M1 ${f(pm.m1)} >= ceiling ${f(ceil.m1)} - 0.10 = ${f(ceil.m1 - 0.1)}: ${aOk ? "holds" : "fails"}`);
    grade = aOk && bOk && cOk ? "yes" : !aOk && bOk && cOk ? "partly" : "no";
  }
  P(`- Grade: ${grade}`);
  P();
  const pa = point.get(A)!;
  const gateLoss = 1 - pa.m3, dirLoss = 1 - pa.m2;
  const larger = gateLoss > dirLoss ? "gate" : gateLoss < dirLoss ? "direction" : "equal";
  const chm = ["stake", "deed"].map((ch) => ({ ch, m: meanM(repM(A, where((it) => it.ch === ch))) }));
  const weaker = chm[0]!.m.m1 < chm[1]!.m.m1 ? "stake" : chm[0]!.m.m1 > chm[1]!.m.m1 ? "deed" : "equal";
  P(`Step 4. A's loss: gate (1 - M3) ${f(gateLoss)} vs direction (1 - M2) ${f(dirLoss)}: larger is ${larger}.`);
  P(`Weaker channel by M4 (lower M1): ${weaker} (${chm.map((c) => `${c.ch} ${mline(c.m)}`).join("; ")}).`);
  verdict = `VERDICT: recommended ${rec.arm}/${rec.variant}; beats A: ${beaters.map((g) => g.arm).join(", ") || "none"}; grade ${grade}; A's larger loss: ${larger}; weaker channel: ${weaker}`;
}
P();
P(verdict);
console.log(out.join("\n"));
