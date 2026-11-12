/**
 * Scorer for gate-first-e2e, written from prereg.md ("Scoring", "Stage attribution", "Comparisons") and contract.ts.
 *
 * usage: bun score.ts --calls a.jsonl[,b.jsonl] --material material.json --labels labels.json [--labels2 labels2.json]
 *                     [--seed 20261112] [--resamples 10000]      (Markdown to stdout)
 *
 * Choices where the spec is silent (plain reading):
 *  - A case's score is the mean over its ok reps of the logged score; a case with no ok rep is dropped from that arm
 *    (its n is shown). Comparisons use the cases both arms scored. A judgment whose logged scores differ from
 *    `combine` over its logged readings and touches (importance from the material) by more than 1e-9 aborts the run.
 *    A null reading is read as {r: 0, effect: 0}.
 *  - Scored arms: B-lin (arm B final, lin), B-sq, G (arm G final, lin), G-sq, C (arm C final, lin), then every
 *    non-final variant as "<arm>/<variant>" (lin) and "<arm>/<variant> sq". Primary rows first; B-sq and every non-final
 *    are secondary. Rows ending sq share their judgments with the lin row, so P1 to P3 and E6 to E8 are shown once
 *    (lin rows only).
 *  - E4 per direction is reported separately; the headline E4 (and the bootstrapped one) is the mean of the build and
 *    detract rho, n/a if either is n/a. Spearman is Pearson on average ranks (exact under ties); n/a when either
 *    variable has fewer than 3 distinct values or zero variance.
 *  - E1 per rep: the E1 share computed on each rep's scores, shown as the mean and the min to max over reps.
 *  - E2 counts pairs with kind "opposite" where both cases are scored; a pair is held when both are right by E1.
 *  - E5: predicted class is the sign when |score| > 0.05, else neutral; accuracy over all scored cases against the
 *    label's direction. Neutral |score| median and max over neutral cases.
 *  - E6: conflict, character and exposure direction are E1 restricted to those cases (neutral labels excluded). Size
 *    pairs ordered: pairs by `size_pair` with different signed labels; ordered when the score difference has the label
 *    difference's sign (a tie counts wrong).
 *  - E7 over cases with at least 2 ok reps. E8: calls per judgment (the logged `calls`), questions per judgment, total
 *    and per-judgment USD over judgments with a cost (n shown), median ms.
 *  - P1 uses |r| averaged over reps, P2 the sign of r averaged over reps, "fired" when the mean |r| >= 0.5; a mean r of
 *    exactly 0 is wrong for direction. AUC needs both classes, else n/a.
 *  - Ceiling (second labeller L2): case score = signed label2; per value r = +1/-1/0 from label2's stake and deed. It
 *    is scored on the cases it covers. Consensus subset: cases where both labellers give the same direction.
 *  - Attribution swaps use the linear weights, applied per rep to logged readings and touches, then averaged over
 *    reps. "Labels only" uses no answer and is printed in each final arm's table for lin and sq over that arm's cases.
 *    Recovery share: (E3_arm - E3_B) / (E3_ceiling - E3_B), n/a when the denominator is not above 0.
 *  - Bootstrap: resamples scenarios with replacement over the cases both arms scored; a resampled case set may repeat
 *    cases; resamples with an undefined statistic are skipped (count shown). The interval is the percentile one at
 *    1 - 0.05/k, k = the number of comparisons present. The same seeded resample sequence is used for every comparison.
 *  - Recommendation follows prereg "Comparisons" 4, using E3 point estimates for the C-or-G tie and the mean
 *    questions per judgment for the within-0.02 rule.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  CHANNELS,
  combine,
  type Importance,
  itemKey,
  type Judged,
  type Value,
  type Weighting,
} from "./contract.ts";

// ---------- types ----------
type Reading = { r: number; effect: number };
type Judgment = {
  case: string;
  scenario: string;
  arm: string;
  variant: string;
  final: boolean;
  rep: number;
  ok: boolean;
  readings: Record<string, Reading | null> | null;
  touches: number | null;
  scores: { lin: number; sq: number } | null;
  calls: number;
  questionCount: number;
  costUsd: number | null;
  ms: number;
};
type StakeLab = Record<string, "up" | "down" | "none">;
type CaseLabel = {
  id: string;
  set?: string;
  direction: "build" | "detract" | "neutral";
  magnitude: number;
  kind?: string;
  pair?: string | null;
  size_pair?: string | null;
  character?: boolean;
  exposure?: boolean;
  stake: StakeLab;
  deed: StakeLab;
};
type Label2 = { id: string; direction: CaseLabel["direction"]; magnitude: number; stake: StakeLab; deed: StakeLab };
type MaterialShape = {
  variants: { id: string; importance: Importance }[];
  scenarios: { id: string; cases: { id: string; variant: string }[] }[];
};

// ---------- numerics ----------
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : Number.NaN);
const median = (a: number[]) => {
  if (!a.length) return Number.NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
};
const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);

function ranks(a: number[]): number[] {
  const idx = a.map((_, i) => i).sort((i, j) => (a[i] as number) - (a[j] as number));
  const out = new Array<number>(a.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && a[idx[j + 1] as number] === a[idx[i] as number]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k] as number] = r;
    i = j + 1;
  }
  return out;
}
/** Spearman = Pearson over average ranks. NaN (n/a) when either side has under 3 distinct values or no variance. */
function spearman(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return Number.NaN;
  if (new Set(x).size < 3 || new Set(y).size < 3) return Number.NaN;
  const rx = ranks(x);
  const ry = ranks(y);
  const mx = mean(rx);
  const my = mean(ry);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < rx.length; i++) {
    const dx = (rx[i] as number) - mx;
    const dy = (ry[i] as number) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxx === 0 || syy === 0 ? Number.NaN : sxy / Math.sqrt(sxx * syy);
}
/** AUC of score for positives against negatives, ties half. NaN when a class is empty. */
function auc(pos: number[], neg: number[]): number {
  if (!pos.length || !neg.length) return Number.NaN;
  let s = 0;
  for (const p of pos) for (const n of neg) s += p > n ? 1 : p === n ? 0.5 : 0;
  return s / (pos.length * neg.length);
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Exact two-sided McNemar: b and c the discordant counts. */
function mcnemar(b: number, c: number): number {
  const n = b + c;
  if (n === 0) return 1;
  let term = 0.5 ** n;
  let cum = 0;
  for (let k = 0; k <= Math.min(b, c); k++) {
    cum += term;
    term = (term * (n - k)) / (k + 1);
  }
  return Math.min(1, 2 * cum);
}
const f = (x: number | undefined | null, d = 3) => (x === undefined || x === null || Number.isNaN(x) ? "n/a" : x.toFixed(d));
const pct = (k: number, n: number) => (n ? `${k}/${n} (${((100 * k) / n).toFixed(0)}%)` : "n/a");
const table = (head: string[], rows: string[][]) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");

// ---------- inputs ----------
const { values: args } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    calls: { type: "string" },
    material: { type: "string" },
    labels: { type: "string" },
    labels2: { type: "string" },
    seed: { type: "string", default: "20261112" },
    resamples: { type: "string", default: "10000" },
  },
});
if (!args.calls || !args.material || !args.labels) {
  throw new Error("usage: --calls a.jsonl[,b.jsonl] --material material.json --labels labels.json [--labels2 f]");
}
const SEED = Number(args.seed);
const RESAMPLES = Number(args.resamples);
const readJson = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
const values = ((await import("../../../world/values.toml")).default as { values: Value[] }).values;
const KEYS = CHANNELS.flatMap((ch) => values.map((v) => ({ key: itemKey(ch, v.id), ch, v: v.id })));

const material = readJson<MaterialShape>(args.material);
const importanceOfVariant = new Map(material.variants.map((v) => [v.id, v.importance]));
const importanceOfCase = new Map<string, Importance>();
for (const sc of material.scenarios)
  for (const c of sc.cases) {
    const imp = importanceOfVariant.get(c.variant);
    if (!imp) throw new Error(`case ${c.id}: no variant ${c.variant} in the material`);
    importanceOfCase.set(c.id, imp);
  }

const labelOf = new Map(readJson<{ cases: CaseLabel[] }>(args.labels).cases.map((c) => [c.id, c]));
const labels2 = args.labels2
  ? new Map(readJson<{ cases: Label2[] }>(args.labels2).cases.map((c) => [c.id, c]))
  : null;
const y = (c: CaseLabel | Label2) => (c.direction === "build" ? c.magnitude : c.direction === "detract" ? -c.magnitude : 0);
const itemLab = (c: CaseLabel | Label2, ch: string, v: string) => {
  const s = ((ch === "stake" ? c.stake : c.deed) as StakeLab)[v];
  if (s === undefined) throw new Error(`case ${c.id}: no ${ch} label for ${v}`);
  return s === "up" ? 1 : s === "down" ? -1 : 0;
};

const judgments: Judgment[] = [];
const seen = new Set<string>();
for (const file of args.calls.split(",")) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const j = JSON.parse(line) as Judgment;
    const id = `${j.case}|${j.arm}|${j.variant}|${j.rep}`;
    if (seen.has(id)) throw new Error(`duplicate judgment ${id} (${file})`);
    seen.add(id);
    if (!labelOf.has(j.case)) throw new Error(`judgment for ${j.case} has no label`);
    if (!importanceOfCase.has(j.case)) throw new Error(`judgment for ${j.case} has no case in the material`);
    judgments.push(j);
  }
}

const judgedOf = (j: Judgment): Judged => {
  if (!j.readings || j.touches === null) throw new Error(`ok judgment ${j.case} has no readings`);
  const items: Record<string, Reading> = {};
  for (const k of KEYS) items[k.key] = j.readings[k.key] ?? { r: 0, effect: 0 };
  return { items, touches: j.touches };
};
// fail loudly: the logged scores must equal the contract's combine
for (const j of judgments) {
  if (!j.ok) continue;
  if (!j.scores) throw new Error(`ok judgment ${j.case} ${j.arm}/${j.variant} has no scores`);
  const jd = judgedOf(j);
  const imp = importanceOfCase.get(j.case) as Importance;
  for (const w of ["lin", "sq"] as Weighting[]) {
    const c = combine(jd, imp, values, w);
    if (Math.abs(c - j.scores[w]) > 1e-9)
      throw new Error(`logged ${w} score ${j.scores[w]} != combine ${c} for ${j.case} ${j.arm}/${j.variant} rep ${j.rep}`);
  }
}

// ---------- scored arms ----------
type Scored = { name: string; arm: string; variant: string; w: Weighting; primary: boolean; final: boolean; js: Judgment[] };
const groups = new Map<string, Judgment[]>();
for (const j of judgments) {
  const g = `${j.arm}\t${j.variant}`;
  groups.set(g, [...(groups.get(g) ?? []), j]);
}
const scored: Scored[] = [];
const finalOfArm = new Map<string, string>();
for (const [g, js] of groups) {
  const [arm, variant] = g.split("\t") as [string, string];
  const fin = js.some((j) => j.final);
  if (fin) {
    if (finalOfArm.has(arm)) throw new Error(`arm ${arm} has two final variants`);
    finalOfArm.set(arm, variant);
  }
  const mk = (name: string, w: Weighting, primary: boolean) =>
    scored.push({ name, arm, variant, w, primary, final: fin, js });
  if (fin) {
    if (arm === "B") {
      mk("B-lin", "lin", true);
      mk("B-sq", "sq", false);
    } else if (arm === "G") {
      mk("G", "lin", true);
      mk("G-sq", "sq", true);
    } else {
      mk(arm, "lin", true);
      mk(`${arm}-sq`, "sq", false);
    }
  } else {
    mk(`${arm}/${variant}`, "lin", false);
    mk(`${arm}/${variant} sq`, "sq", false);
  }
}
const order = ["B-lin", "G", "G-sq", "C"];
scored.sort((a, b) => {
  const ka = a.final && a.primary ? order.indexOf(a.name) : 99;
  const kb = b.final && b.primary ? order.indexOf(b.name) : 99;
  return (ka < 0 ? 98 : ka) - (kb < 0 ? 98 : kb) || (a.final === b.final ? 0 : a.final ? -1 : 1);
});
const byName = (n: string) => scored.find((s) => s.name === n);

// ---------- per-arm case scores ----------
type CaseScores = Map<string, { mean: number; reps: number[]; repNo: number[] }>;
type Swap = (jd: Judged, c: CaseLabel) => Judged;
function caseScores(js: Judgment[], w: Weighting, swap?: Swap): CaseScores {
  const per = new Map<string, { s: number; rep: number }[]>();
  for (const j of js) {
    if (!j.ok) continue;
    const c = labelOf.get(j.case) as CaseLabel;
    let s: number;
    if (swap) s = combine(swap(judgedOf(j), c), importanceOfCase.get(j.case) as Importance, values, w);
    else s = (j.scores as { lin: number; sq: number })[w];
    per.set(j.case, [...(per.get(j.case) ?? []), { s, rep: j.rep }]);
  }
  const out: CaseScores = new Map();
  for (const [k, v] of per) out.set(k, { mean: mean(v.map((x) => x.s)), reps: v.map((x) => x.s), repNo: v.map((x) => x.rep) });
  return out;
}
const meanMap = (cs: CaseScores) => new Map([...cs].map(([k, v]) => [k, v.mean]));

// ---------- case-level metrics over a score map ----------
type Sm = Map<string, number>;
const isRight = (c: CaseLabel, s: number) => c.direction !== "neutral" && sign(s) === (c.direction === "build" ? 1 : -1);
function e1(sm: Sm, ids?: Iterable<string>): { k: number; n: number } {
  let k = 0;
  let n = 0;
  for (const id of ids ?? sm.keys()) {
    const s = sm.get(id);
    const c = labelOf.get(id);
    if (s === undefined || !c || c.direction === "neutral") continue;
    n++;
    if (isRight(c, s)) k++;
  }
  return { k, n };
}
function e2(sm: Sm): { k: number; n: number } {
  let k = 0;
  let n = 0;
  for (const [id, s] of sm) {
    const c = labelOf.get(id) as CaseLabel;
    if (c.kind !== "opposite" || !c.pair || id > c.pair) continue;
    const s2 = sm.get(c.pair);
    if (s2 === undefined) continue;
    n++;
    if (isRight(c, s) && isRight(labelOf.get(c.pair) as CaseLabel, s2)) k++;
  }
  return { k, n };
}
function e3(sm: Sm, ids?: string[]): number {
  const keys = ids ?? [...sm.keys()];
  return spearman(
    keys.map((k) => sm.get(k) as number),
    keys.map((k) => y(labelOf.get(k) as CaseLabel)),
  );
}
function e4(sm: Sm, ids?: string[]): { build: number; detract: number; both: number } {
  const keys = ids ?? [...sm.keys()];
  const part = (d: "build" | "detract") => {
    const ks = keys.filter((k) => (labelOf.get(k) as CaseLabel).direction === d);
    return spearman(
      ks.map((k) => (d === "build" ? 1 : -1) * (sm.get(k) as number)),
      ks.map((k) => (labelOf.get(k) as CaseLabel).magnitude),
    );
  };
  const b = part("build");
  const d = part("detract");
  return { build: b, detract: d, both: (b + d) / 2 };
}
function e5(sm: Sm) {
  let k = 0;
  const neutral: number[] = [];
  for (const [id, s] of sm) {
    const c = labelOf.get(id) as CaseLabel;
    const pred = Math.abs(s) > 0.05 ? sign(s) : 0;
    const lab = c.direction === "build" ? 1 : c.direction === "detract" ? -1 : 0;
    if (pred === lab) k++;
    if (c.direction === "neutral") neutral.push(Math.abs(s));
  }
  return { k, n: sm.size, med: median(neutral), max: neutral.length ? Math.max(...neutral) : Number.NaN };
}
function e6(sm: Sm) {
  const sub = (pred: (c: CaseLabel) => boolean) => e1(sm, [...sm.keys()].filter((id) => pred(labelOf.get(id) as CaseLabel)));
  let k = 0;
  let n = 0;
  for (const [id, s] of sm) {
    const c = labelOf.get(id) as CaseLabel;
    if (!c.size_pair || id > c.size_pair) continue;
    const s2 = sm.get(c.size_pair);
    const c2 = labelOf.get(c.size_pair);
    if (s2 === undefined || !c2 || y(c) === y(c2)) continue;
    n++;
    if (sign(s - s2) === sign(y(c) - y(c2))) k++;
  }
  return {
    conflict: sub((c) => c.kind === "conflict"),
    character: sub((c) => c.character === true),
    exposure: sub((c) => c.exposure === true),
    sizePairs: { k, n },
  };
}

// ---------- per-value metrics ----------
type Item = { ch: string; v: string; gate: number; r: number; lab: number };
function itemsOfArm(js: Judgment[], ids: string[]): Item[] {
  const out: Item[] = [];
  for (const id of ids) {
    const c = labelOf.get(id) as CaseLabel;
    const oks = js.filter((j) => j.ok && j.case === id);
    if (!oks.length) continue;
    for (const k of KEYS) {
      const rs = oks.map((j) => (j.readings?.[k.key] ?? { r: 0 }).r);
      out.push({ ch: k.ch, v: k.v, gate: mean(rs.map(Math.abs)), r: mean(rs), lab: itemLab(c, k.ch, k.v) });
    }
  }
  return out;
}
function itemsOfLabeller2(ids: string[]): Item[] {
  const out: Item[] = [];
  for (const id of ids) {
    const l2 = labels2?.get(id);
    const c = labelOf.get(id);
    if (!l2 || !c) continue;
    for (const k of KEYS) {
      const r = itemLab(l2, k.ch, k.v);
      out.push({ ch: k.ch, v: k.v, gate: Math.abs(r), r, lab: itemLab(c, k.ch, k.v) });
    }
  }
  return out;
}
function pMetrics(items: Item[]) {
  const touched = items.filter((i) => i.lab !== 0);
  const p1 = auc(touched.map((i) => i.gate), items.filter((i) => i.lab === 0).map((i) => i.gate));
  const fired = touched.filter((i) => i.gate >= 0.5);
  const right = (i: Item) => sign(i.r) === i.lab;
  return {
    nTouched: touched.length,
    p1,
    nFired: fired.length,
    dirFired: fired.filter(right).length,
    dirAll: touched.filter(right).length,
  };
}

// ---------- header ----------
const universe = [...new Set(judgments.map((j) => j.case))].sort();
const out: string[] = [];
const say = (s = "") => out.push(s);
say("# gate-first-e2e scoring");
say();
say(`calls: ${args.calls}; material: ${args.material}; labels: ${args.labels}; labels2: ${args.labels2 ?? "none"}; seed ${SEED}; resamples ${RESAMPLES}`);
say();
say("## Header");
say();
say(
  table(
    ["arm", "variant", "final", "judgments", "ok", "refused", "reps", "cases"],
    [...groups].map(([g, js]) => {
      const [arm, variant] = g.split("\t") as [string, string];
      return [
        arm,
        variant,
        js.some((j) => j.final) ? "yes" : "no",
        String(js.length),
        String(js.filter((j) => j.ok).length),
        String(js.filter((j) => !j.ok).length),
        String(new Set(js.map((j) => j.rep)).size),
        String(new Set(js.filter((j) => j.ok).map((j) => j.case)).size),
      ];
    }),
  ),
);
say();
const uniLabels = universe.map((id) => labelOf.get(id) as CaseLabel);
say(
  `cases ${universe.length}; scenarios ${new Set(judgments.map((j) => j.scenario)).size}; items per case ${KEYS.length} (${CHANNELS.length} channels x ${values.length} values); items ${universe.length * KEYS.length}`,
);
say();
say("Case labels per direction and magnitude:");
say();
say(
  table(
    ["direction", "0", "1", "2", "3", "4", "5", "total"],
    (["build", "detract", "neutral"] as const).map((d) => {
      const cs = uniLabels.filter((c) => c.direction === d);
      return [d, ...[0, 1, 2, 3, 4, 5].map((m) => String(cs.filter((c) => c.magnitude === m).length)), String(cs.length)];
    }),
  ),
);
say();
say("Touched items per channel and direction (first labeller):");
say();
say(
  table(
    ["channel", "up", "down", "none"],
    CHANNELS.map((ch) => {
      const cnt = { 1: 0, [-1]: 0, 0: 0 } as Record<number, number>;
      for (const c of uniLabels) for (const v of values) cnt[itemLab(c, ch, v.id)]!++;
      return [ch, String(cnt[1]), String(cnt[-1]), String(cnt[0])];
    }),
  ),
);
say();

// ---------- case-level tables ----------
type Row = { name: string; primary: boolean; sm: Sm; cs: CaseScores | null; s: Scored | null };
const rows: Row[] = scored.map((s) => {
  const cs = caseScores(s.js, s.w);
  return { name: s.name + (s.primary ? "" : " (secondary)"), primary: s.primary, sm: meanMap(cs), cs, s };
});
const ceilSm: Sm | null = labels2
  ? new Map([...labels2].filter(([id]) => labelOf.has(id)).map(([id, c]) => [id, y(c)]))
  : null;
const ceilRow: Row | null = ceilSm ? { name: "L2 (ceiling)", primary: true, sm: ceilSm, cs: null, s: null } : null;
const allRows = ceilRow ? [...rows, ceilRow] : rows;

say("## Case level: E1 to E5");
say();
say("E3 decides. E4 is the mean of the build and detract rho. Ceiling row: second labeller's signed label as the score.");
say();
say(
  table(
    ["arm", "n", "E1", "E1 per rep (mean, min-max)", "E2 pairs held", "E3 pooled rho", "E4 build", "E4 detract", "E4", "E5 3-way", "neutral |score| med", "neutral max"],
    allRows.map((r) => {
      const a = e1(r.sm);
      const p = e2(r.sm);
      const d = e4(r.sm);
      const q = e5(r.sm);
      let perRep = "n/a";
      if (r.cs) {
        const reps = [...new Set([...r.cs.values()].flatMap((v) => v.repNo))].sort((x, z) => x - z);
        const shares = reps.map((rep) => {
          const sm: Sm = new Map();
          for (const [id, v] of r.cs as CaseScores) {
            const i = v.repNo.indexOf(rep);
            if (i >= 0) sm.set(id, v.reps[i] as number);
          }
          const e = e1(sm);
          return e.k / e.n;
        });
        perRep = `${f(mean(shares))} (${f(Math.min(...shares))}-${f(Math.max(...shares))})`;
      }
      return [r.name, String(r.sm.size), pct(a.k, a.n), perRep, pct(p.k, p.n), f(e3(r.sm)), f(d.build), f(d.detract), f(d.both), pct(q.k, q.n), f(q.med), f(q.max)];
    }),
  ),
);
say();

say("## Case level: E6 to E8");
say();
say(
  table(
    ["arm", "conflict dir", "character dir", "exposure dir", "size pairs ordered", "E7 spread med", "E7 spread max", "calls/judg", "questions/judg", "USD total", "USD/judg", "ms median"],
    rows
      .filter((r) => (r.s as Scored).w === "lin" || (r.s as Scored).arm === "")
      .map((r) => {
        const s = r.s as Scored;
        const m6 = e6(r.sm);
        const spreads = [...(r.cs as CaseScores).values()].filter((v) => v.reps.length >= 2).map((v) => Math.max(...v.reps) - Math.min(...v.reps));
        const costs = s.js.filter((j) => j.costUsd !== null).map((j) => j.costUsd as number);
        return [
          r.name,
          pct(m6.conflict.k, m6.conflict.n),
          pct(m6.character.k, m6.character.n),
          pct(m6.exposure.k, m6.exposure.n),
          pct(m6.sizePairs.k, m6.sizePairs.n),
          f(median(spreads)),
          f(spreads.length ? Math.max(...spreads) : Number.NaN),
          f(mean(s.js.map((j) => j.calls)), 1),
          f(mean(s.js.map((j) => j.questionCount)), 1),
          `${costs.reduce((a, b) => a + b, 0).toFixed(4)} (n=${costs.length})`,
          f(mean(costs), 6),
          f(median(s.js.map((j) => j.ms)), 0),
        ];
      }),
  ),
);
say();
say("Rows ending sq share their judgments with the lin row; E6 to E8 are shown for lin rows (sq rows differ only in E6 direction/pairs).");
say();

// ---------- per-value ----------
type PRow = { name: string; items: Item[] };
const pRows: PRow[] = rows
  .filter((r) => (r.s as Scored).w === "lin")
  .map((r) => ({ name: r.name, items: itemsOfArm((r.s as Scored).js, [...r.sm.keys()]) }));
if (labels2) pRows.push({ name: "L2 (ceiling)", items: itemsOfLabeller2([...(ceilSm as Sm).keys()]) });

say("## Per-value stage: P1 and P2");
say();
say("P1 gate AUC of |r| (touched vs untouched); P2 direction among items with mean |r| >= 0.5; all-touched direction counts a 0 reading wrong. -sq rows have the same readings as their lin row.");
say();
say(
  table(
    ["arm", "touched n", "P1 all", "P1 stake", "P1 deed", "P2 fired n", "P2 dir among fired", "dir over all touched"],
    pRows.map((p) => {
      const m = pMetrics(p.items);
      return [
        p.name,
        String(m.nTouched),
        f(m.p1),
        f(pMetrics(p.items.filter((i) => i.ch === "stake")).p1),
        f(pMetrics(p.items.filter((i) => i.ch === "deed")).p1),
        String(m.nFired),
        pct(m.dirFired, m.nFired),
        pct(m.dirAll, m.nTouched),
      ];
    }),
  ),
);
say();
say("## P3 per value (both channels pooled; n = touched items)");
say();
for (const p of pRows) {
  say(`### ${p.name}`);
  say();
  say(
    table(
      ["value", "touched n", "P1", "fired n", "P2 dir among fired", "dir over all touched"],
      values.map((v) => {
        const m = pMetrics(p.items.filter((i) => i.v === v.id));
        const tag = v.id === "conformity" || v.id === "benevolence" ? " *" : "";
        return [v.id + tag, String(m.nTouched), f(m.p1), String(m.nFired), pct(m.dirFired, m.nFired), pct(m.dirAll, m.nTouched)];
      }),
    ),
  );
  say();
}
say("(* conformity and benevolence are reported whatever their n.)");
say();

// ---------- consensus ----------
say("## Consensus subset (both labellers give the same direction)");
say();
if (!labels2 || !ceilSm) say("No labels2 given: n/a.");
else {
  const ids = [...ceilSm.keys()].filter((id) => (labels2.get(id) as Label2).direction === (labelOf.get(id) as CaseLabel).direction);
  say(`${ids.length} of ${ceilSm.size} cases.`);
  say();
  say(
    table(
      ["arm", "n", "E1", "E3"],
      allRows.map((r) => {
        const sub = ids.filter((id) => r.sm.has(id));
        const sm: Sm = new Map(sub.map((id) => [id, r.sm.get(id) as number]));
        const a = e1(sm);
        return [r.name, String(sub.length), pct(a.k, a.n), f(e3(sm, sub))];
      }),
    ),
  );
}
say();

// ---------- attribution ----------
say("## Stage attribution (from logged answers, linear weights unless stated; never decides)");
say();
const swaps: { name: string; swap: Swap }[] = [
  { name: "none (logged)", swap: (jd) => jd },
  {
    name: "gate oracle",
    swap: (jd, c) => ({
      touches: jd.touches,
      items: Object.fromEntries(
        KEYS.map((k) => [k.key, { ...(jd.items[k.key] as Reading), effect: itemLab(c, k.ch, k.v) === 0 ? 0 : (jd.items[k.key] as Reading).effect }]),
      ),
    }),
  },
  {
    name: "direction oracle",
    swap: (jd, c) => ({
      touches: jd.touches,
      items: Object.fromEntries(
        KEYS.map((k) => {
          const l = itemLab(c, k.ch, k.v);
          const r = jd.items[k.key] as Reading;
          return [k.key, { ...r, effect: l === 0 ? r.effect : l * Math.abs(r.effect) }];
        }),
      ),
    }),
  },
  {
    name: "gate and direction oracle",
    swap: (jd, c) => ({
      touches: jd.touches,
      items: Object.fromEntries(
        KEYS.map((k) => {
          const l = itemLab(c, k.ch, k.v);
          const r = jd.items[k.key] as Reading;
          return [k.key, { ...r, effect: l * Math.abs(r.effect) }];
        }),
      ),
    }),
  },
  { name: "no touches", swap: (jd) => ({ ...jd, touches: 1 }) },
];
const labelsOnly: Swap = (_jd, c) => ({
  touches: 1,
  items: Object.fromEntries(KEYS.map((k) => [k.key, { r: itemLab(c, k.ch, k.v), effect: 2 * itemLab(c, k.ch, k.v) }])),
});
const finals = ["B-lin", "G", "C"].map(byName).filter((s): s is Scored => !!s);
const attrE3 = new Map<string, Map<string, number>>(); // arm name -> swap name -> E3
for (const s of finals) {
  say(`### ${s.name}`);
  say();
  const trs: string[][] = [];
  const e3s = new Map<string, number>();
  for (const sw of swaps) {
    const sm = meanMap(caseScores(s.js, "lin", sw.swap));
    const a = e1(sm);
    const e3v = e3(sm);
    e3s.set(sw.name, e3v);
    trs.push([sw.name, pct(a.k, a.n), f(e3v), f(e4(sm).both)]);
  }
  for (const w of ["lin", "sq"] as Weighting[]) {
    const sm = meanMap(caseScores(s.js, w, labelsOnly));
    const a = e1(sm);
    trs.push([`labels only (${w})`, pct(a.k, a.n), f(e3(sm)), f(e4(sm).both)]);
  }
  attrE3.set(s.name, e3s);
  say(table(["swap", "E1", "E3", "E4"], trs));
  say();
}
say("### Recovery shares: (E3_arm - E3_B) / (E3_ceiling - E3_B), over each arm's own cases");
say();
{
  const b = byName("B-lin");
  const l2e3 = ceilSm ? e3(ceilSm) : Number.NaN;
  const bOracle = attrE3.get("B-lin")?.get("gate and direction oracle") ?? Number.NaN;
  const bE3 = attrE3.get("B-lin")?.get("none (logged)") ?? Number.NaN;
  const share = (a: number, c: number) => (c - bE3 > 0 ? f((a - bE3) / (c - bE3)) : "n/a");
  const trs = finals
    .filter((s) => s.name !== "B-lin")
    .map((s) => {
      const a = attrE3.get(s.name)?.get("none (logged)") ?? Number.NaN;
      return [s.name, f(a), share(a, l2e3), share(a, bOracle)];
    });
  if (!b || !trs.length) say("Needs B-lin and G or C: n/a.");
  else {
    say(`B-lin E3 ${f(bE3)}; ceiling as second labeller's E3 ${f(l2e3)}; ceiling as B's gate and direction oracle E3 ${f(bOracle)}.`);
    say();
    say(table(["arm", "E3", "share, ceiling = L2's E3", "share, ceiling = B gate+direction oracle"], trs));
  }
}
say();

// ---------- comparisons ----------
say("## Comparisons (paired scenario bootstrap on E3; decides)");
say();
const scenarioOf = new Map(judgments.map((j) => [j.case, j.scenario]));
type Cmp = { name: string; base: Scored | undefined; chall: Scored | undefined };
const cmps: Cmp[] = [
  { name: "Gate fix: G vs B-lin", base: byName("B-lin"), chall: byName("G") },
  { name: "Squared: G-sq vs G", base: byName("G"), chall: byName("G-sq") },
  { name: "C vs B-lin", base: byName("B-lin"), chall: byName("C") },
].filter((c) => c.name !== "C vs B-lin" || c.chall);
const present = cmps.filter((c) => c.base && c.chall);
const K = present.length;
const alpha = K ? 0.05 / K : 0.05;
const verdicts = new Map<string, "wins" | "loses" | "ties">();
const e3Of = new Map<string, number>();
for (const c of cmps) {
  say(`### ${c.name}`);
  say();
  if (!c.base || !c.chall) {
    say("Skipped: an arm is absent from the input.");
    say();
    continue;
  }
  const A = meanMap(caseScores(c.base.js, c.base.w));
  const B = meanMap(caseScores(c.chall.js, c.chall.w));
  const ids = [...A.keys()].filter((id) => B.has(id)).sort();
  const sa: Sm = new Map(ids.map((id) => [id, A.get(id) as number]));
  const sb: Sm = new Map(ids.map((id) => [id, B.get(id) as number]));
  const scenarios = [...new Set(ids.map((id) => scenarioOf.get(id) as string))].sort();
  const casesOf = new Map(scenarios.map((s) => [s, ids.filter((id) => scenarioOf.get(id) === s)]));
  const boot = (stat: (ids: string[]) => number) => {
    const rng = mulberry32(SEED);
    const diffs: number[] = [];
    let skipped = 0;
    for (let i = 0; i < RESAMPLES; i++) {
      const pick: string[] = [];
      for (let k = 0; k < scenarios.length; k++) pick.push(...(casesOf.get(scenarios[Math.floor(rng() * scenarios.length)] as string) as string[]));
      const d = stat(pick);
      if (Number.isNaN(d)) skipped++;
      else diffs.push(d);
    }
    diffs.sort((x, z) => x - z);
    const q = (p: number) => diffs[Math.min(diffs.length - 1, Math.max(0, Math.floor(p * diffs.length)))] ?? Number.NaN;
    return { point: stat(ids), lo: q(alpha / 2), hi: q(1 - alpha / 2), skipped };
  };
  // statistics over a resampled multiset: duplicate case ids are expanded to distinct synthetic keys
  const e3Diff = (pick: string[]) => {
    const xs = pick.map((id) => sb.get(id) as number);
    const xa = pick.map((id) => sa.get(id) as number);
    const yy = pick.map((id) => y(labelOf.get(id) as CaseLabel));
    return spearman(xs, yy) - spearman(xa, yy);
  };
  const e4Of = (m: Sm, pick: string[]) => {
    const part = (d: "build" | "detract") => {
      const ks = pick.filter((k) => (labelOf.get(k) as CaseLabel).direction === d);
      return spearman(
        ks.map((k) => (d === "build" ? 1 : -1) * (m.get(k) as number)),
        ks.map((k) => (labelOf.get(k) as CaseLabel).magnitude),
      );
    };
    return (part("build") + part("detract")) / 2;
  };
  const e4Diff = (pick: string[]) => e4Of(sb, pick) - e4Of(sa, pick);
  const r3 = boot(e3Diff);
  const verdict = r3.lo > 0 ? "wins" : r3.hi < 0 ? "loses" : "ties";
  verdicts.set(c.name, verdict);
  e3Of.set(c.chall.name, e3(sb));
  const ci = `${((1 - alpha) * 100).toFixed(2)}%`;
  say(`n ${ids.length} cases, ${scenarios.length} scenarios. E3 ${c.base.name} ${f(e3(sa))}, ${c.chall.name} ${f(e3(sb))}.`);
  say();
  say(`**E3 difference ${f(r3.point)}, ${ci} interval [${f(r3.lo)}, ${f(r3.hi)}] (skipped resamples ${r3.skipped}): ${c.chall.name} ${verdict}.**`);
  say();
  const mc = (fn: (m: Sm) => Map<string, boolean>) => {
    const ma = fn(sa);
    const mb = fn(sb);
    let bOnly = 0;
    let aOnly = 0;
    for (const [k, v] of mb) {
      const o = ma.get(k);
      if (o === undefined) continue;
      if (v && !o) bOnly++;
      if (!v && o) aOnly++;
    }
    return { bOnly, aOnly, p: mcnemar(bOnly, aOnly) };
  };
  const r1 = mc((m) => new Map(ids.filter((id) => (labelOf.get(id) as CaseLabel).direction !== "neutral").map((id) => [id, isRight(labelOf.get(id) as CaseLabel, m.get(id) as number)])));
  const r2 = mc((m) => {
    const o = new Map<string, boolean>();
    for (const id of ids) {
      const l = labelOf.get(id) as CaseLabel;
      if (l.kind !== "opposite" || !l.pair || id > l.pair || !m.has(l.pair)) continue;
      o.set(id, isRight(l, m.get(id) as number) && isRight(labelOf.get(l.pair) as CaseLabel, m.get(l.pair) as number));
    }
    return o;
  });
  const r4 = boot(e4Diff);
  say(
    table(
      ["descriptive", `${c.chall.name} only right/held`, `${c.base.name} only right/held`, "exact McNemar p / interval"],
      [
        ["E1 (discordant cases)", String(r1.bOnly), String(r1.aOnly), f(r1.p)],
        ["E2 (discordant pairs)", String(r2.bOnly), String(r2.aOnly), f(r2.p)],
        ["E4 difference", f(r4.point), "", `[${f(r4.lo)}, ${f(r4.hi)}] bootstrap`],
      ],
    ),
  );
  say();
}

// ---------- recommendation ----------
const g = verdicts.get("Gate fix: G vs B-lin");
const sq = verdicts.get("Squared: G-sq vs G");
const cv = verdicts.get("C vs B-lin");
const qs = (n: string) => mean((byName(n)?.js ?? []).map((j) => j.questionCount));
let rec: string;
if (!g && !cv) rec = "no challenger comparison present in the input.";
else {
  const gW = g === "wins";
  const cW = cv === "wins";
  let stage: string;
  if (gW && cW) {
    const eg = e3Of.get("G") ?? Number.NaN;
    const ec = e3Of.get("C") ?? Number.NaN;
    const pickC = Math.abs(ec - eg) <= 0.02 ? qs("C") < qs("G") : ec > eg;
    stage = pickC ? "C replaces B's per-value stage" : "G replaces B's per-value stage";
  } else if (gW) stage = "G replaces B's per-value stage";
  else if (cW) stage = "C replaces B's per-value stage";
  else stage = "B's per-value stage stays (no challenger wins on E3)";
  rec = `${stage}; weighting: ${sq === "wins" ? "squared replaces linear (G-sq wins against G)" : sq ? `linear stays (G-sq ${sq} against G)` : "linear stays (G-sq not compared)"}.`;
}
say(`RECOMMENDATION: ${rec}`);
console.log(out.join("\n"));
