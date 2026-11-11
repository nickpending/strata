#!/usr/bin/env bun
/*
 * score.ts - scorer for size-judgment (spec: prereg.md "Scoring" and "Comparison, decided now").
 * usage: bun score.ts --calls a.jsonl[,b.jsonl] --labels labels.json [--labels2 labels2.json] [--cases a,b] [--seed 1] [--resamples 10000]
 *
 * Choices where the spec is silent (plain reading):
 *  1. Case set: labelled cases that appear in the judgments (any arm/variant), intersected with --cases. Judgments for
 *     other cases are ignored. This is "the scored set"; labels' `set` is only tallied in the header, never filtered.
 *  2. Item universe: judgment items (case, value__direction) that have a first-labeller size. Others are ignored.
 *  3. A judgment is refused when ok is false or an item's level is null; it drops its items for that rep only. A rep's
 *     metrics use the items that have a level in that rep. Duplicate (case, arm, variant, rep) lines: the later line
 *     overwrites the earlier for the levels; calls/cost/ms stats count every line.
 *  4. M1/M2 per rep, then mean over reps ignoring NaN reps (all NaN -> NaN). SD over reps is the sample SD (n-1),
 *     NaN with fewer than 2 usable reps. Spearman needs 2+ items; a constant input gives NaN.
 *  5. M2 per value covers both directions of the value among scored-set labelled items; a value qualifies with 8+ such items.
 *  6. M3: pair {a,b,value,direction} refers to the item (value__direction) in cases a and b. The bigger-labelled item
 *     must be strictly higher (ordered), equal (tied) or lower (reversed). A pair with equal labels, or whose items are
 *     not both in the scored set, is dropped (count printed). A pair lacking a level in a rep skips that rep. Counts
 *     are means over the reps in which the pair was scored. "Ordered in at least 4 of 5 reps": a pair counts when ordered in >= 4 reps with 5 reps; with fewer reps, in a strict majority of the reps present (reps = distinct rep values of that arm/variant).
 *  7. M4: the judgment's own `mapped` (toLabel[level]) against the label; per-rep rate, then mean over reps.
 *  8. M5: distinct levels per item over reps where the item has a level (mean over items with 1+ levels); "changes"
 *     share is over items with 2+ levels observed.
 *  9. M6: mean calls, questions per judgment over all lines (refused included); mean USD over ok lines with non-null
 *     cost; median ms over all lines. Refused = lines with ok false.
 * 10. Ceiling (labels2): items present in both labellers within the scored set. rho pooled / per direction / per value
 *     (8+ items) between the two sizes; exact and |d|<=1 agreement; pairs where the second labeller orders the
 *     bigger-first item strictly higher (equal or reversed does not count; pairs needing an item the second lacks are
 *     dropped). Consensus subset: items with |s1 - s2| <= 1; M1 over it per arm/variant; M3 over pairs with both items in it.
 * 11. Comparison: each non-A arm's final (final true) against A's final; the items are the same for both arms (items
 *     with a level in a rep for the arm in question; resamples draw scenarios with replacement, the `scenario` field of
 *     the judgment, all items of drawn scenarios entering with multiplicity). The statistic per resample is each arm's
 *     mean-over-reps rho (NaN reps ignored), resamples where either is NaN are dropped (count printed). Interval:
 *     percentiles alpha/2 and 1-alpha/2, alpha = 0.05 / m, m = number of non-A finals present. Seeded mulberry32.
 * 12. Recommendation: the beaters of A; top = highest point M1; rivals within 0.02 of top compete on fewer questions per
 *     judgment, then fewer levels, then higher M1. No beater: A.
 * 13. Grade: judged on the recommended final. (b) = M3 ordered mean over reps / pairs scored >= 0.80 (no pairs: fails).
 *     (c) both directions' M2 >= 0.5 (NaN fails). (a) needs --labels2 (ceiling pooled rho); without it the grade is
 *     printed as undetermined unless (b) fails, which is "no" whatever (a) is.
 */
import { readFileSync } from "node:fs";

type LItem = { value: string; direction: "up" | "down"; size: number; rationale?: string };
type LCase = { id: string; set?: string; items: LItem[] };
type Pair = { a: string; b: string; value: string; direction: "up" | "down" };
type Item = { id: string; caseId: string; scenario: string; value: string; direction: string; size: number };
type Line = {
  case: string; scenario: string; arm: string; variant: string; final: boolean; rep: number; ok: boolean;
  items: { key: string; value: string; direction: string; level: number | null; mapped: number | null }[];
  levels: number; toLabel: number[]; calls: number; questionCount: number; costUsd: number | null; ms: number;
};
type Group = {
  arm: string; variant: string; final: boolean; lines: Line[]; levels: number;
  reps: number[]; lv: Map<number, Map<string, number>>; mp: Map<number, Map<string, number>>;
};

const args = new Map<string, string>();
{
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) args.set(a[i]!.replace(/^--/, ""), a[i + 1] ?? "");
}
const need = (k: string) => { const v = args.get(k); if (!v) { console.error(`missing --${k}`); process.exit(1); } return v; };
const seed = Number(args.get("seed") ?? 1);
const resamples = Number(args.get("resamples") ?? 10000);

// ---------- stats ----------
function ranks(x: number[]): number[] {
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
function spearman(x: number[], y: number[]): number {
  if (x.length < 2) return NaN;
  const a = ranks(x), b = ranks(y);
  const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { sab += (a[i]! - ma) * (b[i]! - mb); saa += (a[i]! - ma) ** 2; sbb += (b[i]! - mb) ** 2; }
  if (saa === 0 || sbb === 0) return NaN;
  return sab / Math.sqrt(saa * sbb);
}
const mean = (x: number[]) => { const v = x.filter((n) => !Number.isNaN(n)); return v.length ? v.reduce((s, n) => s + n, 0) / v.length : NaN; };
const sd = (x: number[]) => {
  const v = x.filter((n) => !Number.isNaN(n));
  if (v.length < 2) return NaN;
  const m = mean(v);
  return Math.sqrt(v.reduce((s, n) => s + (n - m) ** 2, 0) / (v.length - 1));
};
const median = (x: number[]) => {
  if (!x.length) return NaN;
  const s = [...x].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
};
const f = (n: number, d = 3) => (Number.isNaN(n) ? "NaN" : n.toFixed(d));
function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pct = (sorted: number[], p: number) => {
  const pos = p * (sorted.length - 1), lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
};

// ---------- load ----------
const labels = JSON.parse(readFileSync(need("labels"), "utf8")) as { cases: LCase[]; pairs: Pair[] };
const labels2 = args.get("labels2") ? (JSON.parse(readFileSync(args.get("labels2")!, "utf8")) as { cases: LCase[] }) : null;
const lines: Line[] = [];
for (const p of need("calls").split(",")) {
  for (const l of readFileSync(p, "utf8").split("\n")) if (l.trim()) lines.push(JSON.parse(l) as Line);
}
const restrict = args.get("cases") ? new Set(args.get("cases")!.split(",")) : null;
const labelled = new Map(labels.cases.map((c) => [c.id, c]));
const seen = new Set(lines.map((l) => l.case));
const caseSet = new Set([...seen].filter((id) => labelled.has(id) && (!restrict || restrict.has(id))));
const scenarioOf = new Map<string, string>();
for (const l of lines) scenarioOf.set(l.case, l.scenario);
const ik = (c: string, v: string, d: string) => `${c}|${v}__${d}`;

const items = new Map<string, Item>();
const judged = new Set<string>();
for (const l of lines) for (const it of l.items) judged.add(ik(l.case, it.value, it.direction));
for (const id of caseSet) for (const li of labelled.get(id)!.items) {
  const k = ik(id, li.value, li.direction);
  if (judged.has(k)) items.set(k, { id: k, caseId: id, scenario: scenarioOf.get(id)!, value: li.value, direction: li.direction, size: li.size });
}
const size2 = new Map<string, number>();
if (labels2) for (const c of labels2.cases) for (const li of c.items) size2.set(ik(c.id, li.value, li.direction), li.size);

const valueCount = new Map<string, number>();
for (const it of items.values()) valueCount.set(it.value, (valueCount.get(it.value) ?? 0) + 1);
const bigValues = [...valueCount].filter(([, n]) => n >= 8).map(([v]) => v).sort();

// ---------- groups ----------
const groups = new Map<string, Group>();
for (const l of lines) {
  if (!caseSet.has(l.case)) continue;
  const key = `${l.arm}/${l.variant}`;
  let g = groups.get(key);
  if (!g) { g = { arm: l.arm, variant: l.variant, final: l.final, lines: [], levels: l.levels, reps: [], lv: new Map(), mp: new Map() }; groups.set(key, g); }
  g.lines.push(l);
  if (!g.lv.has(l.rep)) { g.lv.set(l.rep, new Map()); g.mp.set(l.rep, new Map()); }
  if (l.ok) for (const it of l.items) {
    if (it.level === null) continue;
    g.lv.get(l.rep)!.set(ik(l.case, it.value, it.direction), it.level);
    if (it.mapped !== null) g.mp.get(l.rep)!.set(ik(l.case, it.value, it.direction), it.mapped);
  }
}
for (const g of groups.values()) g.reps = [...g.lv.keys()].sort((a, b) => a - b);
const sortedGroups = [...groups.values()].sort((a, b) => a.arm.localeCompare(b.arm) || Number(b.final) - Number(a.final) || a.variant.localeCompare(b.variant));

const rhoRep = (g: Group, rep: number, ids: string[], bySize: (i: Item) => number | undefined = (i) => i.size) => {
  const x: number[] = [], y: number[] = [];
  for (const id of ids) {
    const lv = g.lv.get(rep)!.get(id), s = bySize(items.get(id)!);
    if (lv !== undefined && s !== undefined) { x.push(lv); y.push(s); }
  }
  return spearman(x, y);
};
const allIds = [...items.keys()];
const m1Reps = (g: Group, ids = allIds) => g.reps.map((r) => rhoRep(g, r, ids));
const m1 = (g: Group, ids = allIds) => mean(m1Reps(g, ids));
const idsWhere = (p: (i: Item) => boolean) => allIds.filter((k) => p(items.get(k)!));

// pairs
type PairR = { a: string; b: string; hi: string; lo: string };
let droppedPairs = 0;
const pairsAll: PairR[] = [];
for (const p of labels.pairs ?? []) {
  const a = ik(p.a, p.value, p.direction), b = ik(p.b, p.value, p.direction);
  const ia = items.get(a), ib = items.get(b);
  if (!ia || !ib || ia.size === ib.size) { droppedPairs++; continue; }
  pairsAll.push(ia.size > ib.size ? { a: p.a, b: p.b, hi: a, lo: b } : { a: p.a, b: p.b, hi: b, lo: a });
}
function m3(g: Group, pairs: PairR[]) {
  let o = 0, t = 0, r = 0, n = 0, good = 0;
  const need = g.reps.length === 5 ? 4 : Math.floor(g.reps.length / 2) + 1;
  for (const p of pairs) {
    let po = 0, pt = 0, pr = 0, k = 0;
    for (const rep of g.reps) {
      const h = g.lv.get(rep)!.get(p.hi), l = g.lv.get(rep)!.get(p.lo);
      if (h === undefined || l === undefined) continue;
      k++;
      if (h > l) po++; else if (h === l) pt++; else pr++;
    }
    if (!k) continue;
    n++; o += po / k; t += pt / k; r += pr / k;
    if (po >= need) good++;
  }
  return { n, o: n ? o : NaN, t: n ? t : NaN, r: n ? r : NaN, good, need };
}
const m3Line = (g: Group, pairs: PairR[]) => {
  const m = m3(g, pairs);
  return { m, text: `ordered ${f(m.o, 2)} / tied ${f(m.t, 2)} / reversed ${f(m.r, 2)} of ${m.n} pairs (means over reps); pairs ordered in >= ${m.need} of ${g.reps.length} reps: ${m.good}` };
};

// ---------- output ----------
const out: string[] = [];
const P = (s = "") => out.push(s);
P("# size-judgment scoring");
P();
const setTally = new Map<string, number>();
for (const id of caseSet) { const s = labelled.get(id)!.set ?? "?"; setTally.set(s, (setTally.get(s) ?? 0) + 1); }
P(`cases scored: ${caseSet.size} (by set: ${[...setTally].map(([s, n]) => `${s} ${n}`).join(", ") || "none"}); items: ${items.size}; pairs scored: ${pairsAll.length}, dropped: ${droppedPairs}`);
P(`judgment lines: ${lines.length}; ignored (case unlabelled or not selected): ${lines.filter((l) => !caseSet.has(l.case)).length}`);
P(`values with 8+ items: ${bigValues.join(", ") || "none"}; seed ${seed}, resamples ${resamples}`);
P();

for (const g of sortedGroups) {
  const reps = m1Reps(g);
  P(`## ${g.arm} / ${g.variant}${g.final ? " (final)" : " (contender)"}  levels ${g.levels}`);
  P(`- M1 pooled rho: per rep [${reps.map((x) => f(x)).join(", ")}], mean ${f(mean(reps))}, SD over reps ${f(sd(reps))}`);
  const within = (ids: string[]) => f(mean(g.reps.map((r) => rhoRep(g, r, ids))));
  P(`- M2 within rho: up ${within(idsWhere((i) => i.direction === "up"))}, down ${within(idsWhere((i) => i.direction === "down"))}` +
    bigValues.map((v) => `, ${v} ${within(idsWhere((i) => i.value === v))}`).join(""));
  P(`- M3 ${m3Line(g, pairsAll).text}`);
  const acc = (tol: number) => mean(g.reps.map((r) => {
    let k = 0, n = 0;
    for (const [id, m] of g.mp.get(r)!) { n++; if (Math.abs(m - items.get(id)!.size) <= tol) k++; }
    return n ? k / n : NaN;
  }));
  P(`- M4 exact ${f(acc(0))}, exact-or-adjacent ${f(acc(1))}`);
  const distinct: number[] = []; let changed = 0, multi = 0;
  for (const id of allIds) {
    const s = new Set<number>(); let n = 0;
    for (const r of g.reps) { const v = g.lv.get(r)!.get(id); if (v !== undefined) { s.add(v); n++; } }
    if (n) distinct.push(s.size);
    if (n >= 2) { multi++; if (s.size > 1) changed++; }
  }
  P(`- M5 mean distinct levels per item ${f(mean(distinct))}, share of items whose level changes across reps ${f(multi ? changed / multi : NaN)} (${changed}/${multi}); SD of M1 over reps ${f(sd(reps))}`);
  const n = g.lines.length, okc = g.lines.filter((l) => l.ok && l.costUsd !== null);
  P(`- M6 requests/judgment ${f(mean(g.lines.map((l) => l.calls)), 2)}, questions/judgment ${f(mean(g.lines.map((l) => l.questionCount)), 2)}, USD/judgment ${okc.length ? (okc.reduce((s, l) => s + l.costUsd!, 0) / okc.length).toExponential(2) : "NaN"}, median ms ${f(median(g.lines.map((l) => l.ms)), 0)}; judgments ${n}, refused ${g.lines.filter((l) => !l.ok).length}`);
  P();
}

// ceiling
let ceilingRho = NaN;
let consensus: string[] = [];
if (labels2) {
  P("## Ceiling: second labeller against the first");
  const both = allIds.filter((k) => size2.has(k));
  const rho2 = (ids: string[]) => spearman(ids.map((k) => items.get(k)!.size), ids.map((k) => size2.get(k)!));
  ceilingRho = rho2(both);
  const bo = both.filter((k) => items.get(k)!.size !== undefined);
  const ex = bo.filter((k) => size2.get(k) === items.get(k)!.size).length;
  const adj = bo.filter((k) => Math.abs(size2.get(k)! - items.get(k)!.size) <= 1).length;
  P(`- items labelled by both: ${both.length} of ${allIds.length}`);
  P(`- rho pooled ${f(ceilingRho)}; up ${f(rho2(both.filter((k) => items.get(k)!.direction === "up")))}; down ${f(rho2(both.filter((k) => items.get(k)!.direction === "down")))}` +
    bigValues.map((v) => `; ${v} ${f(rho2(both.filter((k) => items.get(k)!.value === v)))}`).join(""));
  P(`- exact ${ex}/${bo.length} = ${f(bo.length ? ex / bo.length : NaN)}; exact-or-adjacent ${adj}/${bo.length} = ${f(bo.length ? adj / bo.length : NaN)}`);
  const pp = pairsAll.filter((p) => size2.has(p.hi) && size2.has(p.lo));
  const same = pp.filter((p) => size2.get(p.hi)! > size2.get(p.lo)!).length;
  P(`- size pairs the second labeller orders the same way: ${same}/${pp.length} = ${f(pp.length ? same / pp.length : NaN)}`);
  consensus = both.filter((k) => Math.abs(size2.get(k)! - items.get(k)!.size) <= 1);
  const cs = new Set(consensus);
  const cpairs = pairsAll.filter((p) => cs.has(p.hi) && cs.has(p.lo));
  P();
  P(`## Consensus subset (|s1 - s2| <= 1): ${consensus.length} items, ${cpairs.length} pairs`);
  for (const g of sortedGroups) P(`- ${g.arm}/${g.variant}${g.final ? " (final)" : ""}: M1 ${f(m1(g, consensus))}; M3 ${m3Line(g, cpairs).text}`);
  P();
}

// comparison
P("## Comparison against A (finals only)");
const finals = sortedGroups.filter((g) => g.final);
const A = finals.find((g) => g.arm === "A");
const chal = finals.filter((g) => g.arm !== "A");
let recommended: Group | null = null;
if (!A) P("no A final present: no comparison.");
else {
  const m = chal.length, alpha = 0.05 / Math.max(m, 1);
  const scenarios = [...new Set(allIds.map((k) => items.get(k)!.scenario))].sort();
  const byScen = new Map<string, string[]>();
  for (const k of allIds) { const s = items.get(k)!.scenario; if (!byScen.has(s)) byScen.set(s, []); byScen.get(s)!.push(k); }
  P(`${scenarios.length} scenarios, ${m} non-A final(s), alpha ${alpha.toFixed(4)} per challenger (interval ${f((1 - alpha) * 100, 2)}%), A final = ${A.variant}`);
  const rng = mulberry32(seed);
  const draws: number[][] = [];
  for (let i = 0; i < resamples; i++) draws.push(Array.from({ length: scenarios.length }, () => Math.floor(rng() * scenarios.length)));
  const beaters: Group[] = [];
  const point = new Map<Group, number>([[A, m1(A)]]);
  for (const c of chal) {
    point.set(c, m1(c));
    const diffs: number[] = [];
    let dropped = 0;
    for (const d of draws) {
      const ids = d.flatMap((si) => byScen.get(scenarios[si]!)!);
      const x = m1(c, ids), a = m1(A, ids);
      if (Number.isNaN(x) || Number.isNaN(a)) dropped++; else diffs.push(x - a);
    }
    diffs.sort((p, q) => p - q);
    const lo = diffs.length ? pct(diffs, alpha / 2) : NaN, hi = diffs.length ? pct(diffs, 1 - alpha / 2) : NaN;
    const outcome = lo > 0 ? "beats A" : hi < 0 ? "A beats" : "tie";
    if (outcome === "beats A") beaters.push(c);
    P(`- ${c.arm}/${c.variant}: M1 ${f(point.get(c)!)} vs A ${f(point.get(A)!)}, diff ${f(point.get(c)! - point.get(A)!)}; interval [${f(lo)}, ${f(hi)}] (${diffs.length} resamples used, ${dropped} dropped as NaN): ${outcome}`);
  }
  P();
  const qpj = (g: Group) => mean(g.lines.map((l) => l.questionCount));
  if (!beaters.length) { recommended = A; P(`Recommended: A (${A.variant}); no challenger beats A, design B is unchanged.`); }
  else {
    const top = beaters.reduce((b, g) => (point.get(g)! > point.get(b)! ? g : b));
    const rivals = beaters.filter((g) => point.get(top)! - point.get(g)! <= 0.02);
    rivals.sort((p, q) => qpj(p) - qpj(q) || p.levels - q.levels || point.get(q)! - point.get(p)!);
    recommended = rivals[0]!;
    P(`Recommended: ${recommended.arm}/${recommended.variant} (top M1 ${top.arm} ${f(point.get(top)!)}; rivals within 0.02: ${rivals.map((g) => g.arm).join(", ")}; questions/judgment ${f(qpj(recommended), 2)}, levels ${recommended.levels}).`);
  }
  P();
  P("## Good enough to drive standing (recommended final)");
  const g = recommended;
  const mm1 = m1(g);
  const up = mean(g.reps.map((r) => rhoRep(g, r, idsWhere((i) => i.direction === "up"))));
  const down = mean(g.reps.map((r) => rhoRep(g, r, idsWhere((i) => i.direction === "down"))));
  const m3r = m3(g, pairsAll);
  const bOrdered = m3r.n ? m3r.o / m3r.n : NaN;
  const bOk = bOrdered >= 0.8, cOk = up >= 0.5 && down >= 0.5;
  P(`- (b) M3 ordered ${f(bOrdered, 2)} (>= 0.80): ${bOk ? "holds" : "fails"}`);
  P(`- (c) M2 up ${f(up)}, down ${f(down)} (both >= 0.5): ${cOk ? "holds" : "fails"}`);
  if (!labels2) {
    P(`- (a) M1 ${f(mm1)} against ceiling rho - 0.10: cannot be judged, no --labels2 given`);
    P(`- Grade: ${bOk ? "undetermined without (a)" : "no"}`);
  } else {
    const aOk = mm1 >= ceilingRho - 0.1;
    P(`- (a) M1 ${f(mm1)} >= ceiling ${f(ceilingRho)} - 0.10 = ${f(ceilingRho - 0.1)}: ${aOk ? "holds" : "fails"}`);
    P(`- Grade: ${aOk && bOk && cOk ? "yes" : bOk ? "partly" : "no"}`);
  }
}
console.log(out.join("\n"));
