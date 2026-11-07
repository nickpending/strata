#!/usr/bin/env bun
/*
 * score.ts - scorer for value-weighting-2 (spec: prereg.md "Scoring" and "Comparison").
 * usage: bun score.ts --calls <calls.jsonl> --labels <labels.json> [--cases a,b,...]
 *
 * Choices where the spec is silent (plain reading):
 *  1. Case set: labelled cases that appear in the calls (any arm/variant), intersected with --cases when given.
 *     Calls for unlabelled or unselected cases are ignored (count printed).
 *  2. A call is "refused" when result.ok is false or score is null. Refused calls are excluded from the case mean
 *     and from per-rep counts. A case with no non-refused call for a (arm, variant) has no score: it counts as
 *     wrong in M1/M3/M4/M5 (stays in the denominator) and is left out of Spearman and the noise spread.
 *  3. Sign test: right sign means sign(score) equals the label's sign (build +, detract -, neutral 0); a score of
 *     exactly 0 is therefore wrong for build/detract in M1.
 *  4. Band: taken from the calls' `band` for that (arm, variant); if it varies, the first call's band is used and
 *     a warning is printed. M5 reads neutral when |score| < band, else by sign (score 0 with band 0 reads neutral
 *     only if 0 < 0, i.e. never; it then reads sign 0 which is no direction and counts wrong for build/detract).
 *  5. Pairs (M3): on an opposite case `pair` is the id of its partner. A pair is the unordered {id, pair}, both
 *     labelled opposite and pointing at each other; counted once. It holds when both members get the right sign
 *     (M1 rule on the case mean); a member lacking a score fails. A pair whose partner is outside the case set
 *     is dropped from the count and printed in the header. An opposite case whose partner is unlabelled, not
 *     opposite, or does not point back is an error naming both ids (exit 1).
 *  6. M4: kind == "conflict" and direction build/detract, M1 rule.
 *  7. Spearman is over cases with a score; label values are +magnitude / -magnitude / 0. Within-build and
 *     within-detract use the same score vs signed label over that direction only (constant labels give NaN).
 *  8. M6 spread: max - min of the non-refused rep scores per case, over cases with >= 2 such scores.
 *     Per-rep M1 / M5: correct count over calls of that rep (refused excluded), shown as k/n; "range" is the
 *     min..max of the k across reps (with the n shown alongside).
 *  9. M7: calls per judgment is 1 by construction (one decide call each). Questions per call = mean questionCount
 *     over all calls. Mean USD per judgment = mean costUsd over ok calls with non-null cost (count of nulls
 *     shown). Median ms over all calls (refused included).
 * 10. Comparison: uses the variants flagged final; needs exactly one final variant per arm. Step 1: an arm is
 *     disqualified when held pairs * 2 < total pairs (fewer than half); no pairs means no disqualification. One
 *     disqualified -> the other wins; both -> no verdict. Step 2: McNemar on M5 correctness over the case set,
 *     decided when p < 0.05, in favour of the arm correct on more of the discordant cases. Step 3: same on M1
 *     over build/detract cases. Step 4: |rho_O1 - rho_O2| > 0.10 (strict), NaN does not decide. Step 5: tie.
 *     Printing stops at the deciding step.
 * 11. Duplicate (case, arm, variant, rep) calls are each treated as a call; nothing is deduplicated.
 * 12. Reps in the header = distinct `rep` values over scored calls.
 */
import { readFileSync } from "node:fs";

type Label = {
  id: string;
  direction: "build" | "detract" | "neutral";
  magnitude: number;
  kind: "plain" | "opposite" | "conflict" | "neutral";
  pair: string | null;
  set: string;
  rationale?: string;
};
type Call = {
  case: string;
  arm: string;
  variant: string;
  final: boolean;
  band: number;
  rep: number | string;
  ms: number;
  questionCount: number;
  score: number | null;
  result: { ok: true; answers?: unknown; costUsd: number | null } | { ok: false; refusal?: unknown };
};

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const callsPath = arg("--calls");
const labelsPath = arg("--labels");
if (!callsPath || !labelsPath) {
  console.error("usage: bun score.ts --calls <calls.jsonl> --labels <labels.json> [--cases a,b,...]");
  process.exit(2);
}
const caseFilter = arg("--cases")?.split(",").map((s) => s.trim()).filter(Boolean);

const labels: Label[] = JSON.parse(readFileSync(labelsPath, "utf8"));
const labelById = new Map(labels.map((l) => [l.id, l]));
const allCalls: Call[] = readFileSync(callsPath, "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

const appearing = new Set(allCalls.map((c) => c.case));
const caseIds = labels
  .map((l) => l.id)
  .filter((id) => appearing.has(id) && (!caseFilter || caseFilter.includes(id)));
const caseSet = new Set(caseIds);
const calls = allCalls.filter((c) => caseSet.has(c.case));
const ignored = allCalls.length - calls.length;

// ---------- helpers ----------
const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
const dirSign = { build: 1, detract: -1, neutral: 0 } as const;
const signedLabel = (l: Label) => dirSign[l.direction] * (l.direction === "neutral" ? 0 : l.magnitude);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
function median(xs: number[]) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const max = (xs: number[]) => (xs.length ? Math.max(...xs) : NaN);
const f = (x: number, d = 3) => (Number.isNaN(x) ? "NaN" : Number.isInteger(x) && d === 3 ? String(x) : x.toFixed(d));
const isRefused = (c: Call) => !(c.result && c.result.ok === true) || c.score === null || c.score === undefined;

function ranks(xs: number[]): number[] {
  const idx = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(xs.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}
function spearman(x: number[], y: number[]): number {
  if (x.length < 2) return NaN;
  if (new Set(x).size < 2 || new Set(y).size < 2) return NaN;
  const rx = ranks(x), ry = ranks(y);
  const mx = mean(rx), my = mean(ry);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < rx.length; i++) {
    sxy += (rx[i] - mx) * (ry[i] - my);
    sxx += (rx[i] - mx) ** 2;
    syy += (ry[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}
function mcnemar(b: number, c: number): number {
  const n = b + c;
  if (n === 0) return 1;
  let sum = 0;
  let coef = 1; // C(n,0)
  const m = Math.min(b, c);
  for (let i = 0; i <= m; i++) {
    sum += coef;
    coef = (coef * (n - i)) / (i + 1);
  }
  return Math.min(1, (2 * sum) / 2 ** n);
}

// ---------- opposite pairs ----------
// `pair` on an opposite case is the id of its partner. A pair is the unordered {id, pair}; each counted once.
const PAIRS: [string, string][] = [];
const droppedPairs: string[] = [];
{
  const seen = new Set<string>();
  for (const l of labels) {
    if (l.kind !== "opposite") continue;
    if (!caseSet.has(l.id)) continue;
    const pid = l.pair;
    const partner = pid ? labelById.get(pid) : undefined;
    if (!pid || !partner || partner.kind !== "opposite" || partner.pair !== l.id) {
      console.error(`ERROR: opposite case ${l.id} has pair ${pid ?? "null"}, but ${pid ?? "(none)"} ` +
        `${!partner ? "is not a labelled case" : partner.kind !== "opposite" ? "is not opposite" : `points to ${partner.pair ?? "null"}, not back to ${l.id}`}`);
      process.exit(1);
    }
    if (!caseSet.has(pid)) { droppedPairs.push(`${l.id}~${pid}`); continue; }
    const key = [l.id, pid].sort().join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    PAIRS.push([l.id, pid]);
  }
}

// ---------- per (arm, variant) ----------
const keys: string[] = [];
const byKey = new Map<string, Call[]>();
for (const c of calls) {
  const k = `${c.arm}/${c.variant}`;
  if (!byKey.has(k)) {
    byKey.set(k, []);
    keys.push(k);
  }
  byKey.get(k)!.push(c);
}
keys.sort();

type Stats = {
  key: string;
  arm: string;
  variant: string;
  final: boolean;
  calls: Call[];
  band: number;
  bandVaries: boolean;
  caseScore: Map<string, number | null>;
  repScores: Map<string, Map<string, (number | null)[]>>; // case -> rep -> scores
  m1ok: Map<string, boolean>; // directional cases only
  m5ok: Map<string, boolean>; // all cases
  pairsHeld: number;
  pairsTotal: number;
  rho: number;
};
const readM5 = (s: number, band: number) => (Math.abs(s) < band ? 0 : sign(s));

function compute(key: string): Stats {
  const cs = byKey.get(key)!;
  const arm = cs[0].arm, variant = cs[0].variant;
  const bands = [...new Set(cs.map((c) => c.band))];
  const band = cs[0].band;
  const caseScore = new Map<string, number | null>();
  const repScores = new Map<string, Map<string, (number | null)[]>>();
  for (const id of caseIds) {
    const mine = cs.filter((c) => c.case === id);
    const ok = mine.filter((c) => !isRefused(c)).map((c) => c.score as number);
    caseScore.set(id, ok.length ? mean(ok) : null);
    const reps = new Map<string, (number | null)[]>();
    for (const c of mine) {
      const r = String(c.rep);
      if (!reps.has(r)) reps.set(r, []);
      reps.get(r)!.push(isRefused(c) ? null : (c.score as number));
    }
    repScores.set(id, reps);
  }
  const m1ok = new Map<string, boolean>();
  const m5ok = new Map<string, boolean>();
  for (const id of caseIds) {
    const l = labelById.get(id)!;
    const s = caseScore.get(id)!;
    if (l.direction !== "neutral") m1ok.set(id, s !== null && sign(s) === dirSign[l.direction]);
    m5ok.set(id, s !== null && readM5(s, band) === dirSign[l.direction]);
  }
  // pairs (computed once, see PAIRS below)
  let held = 0;
  const total = PAIRS.length;
  const rightSign = (id: string) => {
    const s = caseScore.get(id)!;
    return s !== null && sign(s) === dirSign[labelById.get(id)!.direction];
  };
  for (const [x, y] of PAIRS) if (rightSign(x) && rightSign(y)) held++;
  const xs: number[] = [], ys: number[] = [];
  for (const id of caseIds) {
    const s = caseScore.get(id)!;
    if (s !== null) {
      xs.push(s);
      ys.push(signedLabel(labelById.get(id)!));
    }
  }
  return {
    key, arm, variant,
    final: cs.some((c) => c.final),
    calls: cs, band, bandVaries: bands.length > 1,
    caseScore, repScores, m1ok, m5ok,
    pairsHeld: held, pairsTotal: total,
    rho: spearman(xs, ys),
  };
}
const stats = keys.map(compute);

function rho(st: Stats, filter: (l: Label) => boolean): number {
  const xs: number[] = [], ys: number[] = [];
  for (const id of caseIds) {
    const l = labelById.get(id)!;
    const s = st.caseScore.get(id)!;
    if (s !== null && filter(l)) {
      xs.push(s);
      ys.push(signedLabel(l));
    }
  }
  return spearman(xs, ys);
}
const countTrue = (m: Map<string, boolean>, ids: string[]) => ids.filter((i) => m.get(i)).length;
const frac = (k: number, n: number) => `${k}/${n}${n ? ` = ${f(k / n)}` : ""}`;

// ---------- output ----------
const out: string[] = [];
const P = (s = "") => out.push(s);

P("# value-weighting-2 scoring");
P();
P("## Header");
P();
const refusedCalls = calls.filter(isRefused);
P(`- calls: ${calls.length}${ignored ? ` (${ignored} more ignored: case unlabelled or not selected)` : ""}`);
P(`- refusals: ${refusedCalls.length}`);
for (const st of stats) {
  const n = st.calls.filter(isRefused).length;
  P(`  - ${st.key}${st.final ? " (final)" : ""}: ${n} of ${st.calls.length}`);
}
const repsAll = [...new Set(calls.map((c) => String(c.rep)))].sort();
P(`- reps: ${repsAll.length} (${repsAll.join(", ")})`);
P(`- cases: ${caseIds.length}`);
P(`- opposite pairs: ${PAIRS.length}${droppedPairs.length ? ` (dropped, partner outside the case set: ${droppedPairs.join(", ")})` : ""}`);
const tally = (g: (l: Label) => string) => {
  const m = new Map<string, number>();
  for (const id of caseIds) {
    const k = g(labelById.get(id)!);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m].sort().map(([k, v]) => `${k} ${v}`).join(", ");
};
P(`  - by kind: ${tally((l) => l.kind)}`);
P(`  - by direction: ${tally((l) => l.direction)}`);
P();

for (const st of stats) {
  const ids = caseIds;
  const dirIds = ids.filter((i) => labelById.get(i)!.direction !== "neutral");
  const neuIds = ids.filter((i) => labelById.get(i)!.direction === "neutral");
  const confIds = dirIds.filter((i) => labelById.get(i)!.kind === "conflict");
  const noScore = ids.filter((i) => st.caseScore.get(i) === null);
  P(`## ${st.key}${st.final ? " (final)" : ""}`);
  P();
  P(`band ${f(st.band)}${st.bandVaries ? " (WARNING: band varies across calls; first call's band used)" : ""}; ` +
    `refused calls excluded from case means: ${st.calls.filter(isRefused).length}; ` +
    `cases with no scored call: ${noScore.length}${noScore.length ? ` (${noScore.join(", ")}; counted wrong)` : ""}`);
  P();
  // per-rep helper
  const repNames = [...new Set(st.calls.map((c) => String(c.rep)))].sort();
  const perRep = (judge: (id: string, s: number) => boolean | null) =>
    repNames.map((r) => {
      let k = 0, n = 0;
      for (const id of ids) {
        for (const s of st.repScores.get(id)!.get(r) ?? []) {
          if (s === null) continue;
          const j = judge(id, s);
          if (j === null) continue;
          n++;
          if (j) k++;
        }
      }
      return { r, k, n };
    });
  const m1rep = perRep((id, s) => {
    const l = labelById.get(id)!;
    return l.direction === "neutral" ? null : sign(s) === dirSign[l.direction];
  });
  const m5rep = perRep((id, s) => readM5(s, st.band) === dirSign[labelById.get(id)!.direction]);
  const rng = (a: { k: number }[]) => (a.length ? `${Math.min(...a.map((x) => x.k))}..${Math.max(...a.map((x) => x.k))}` : "n/a");

  P(`- **M1 direction** (build/detract, sign of case mean): ${frac(countTrue(st.m1ok, dirIds), dirIds.length)}`);
  P(`  - per rep: ${m1rep.map((x) => `rep ${x.r}: ${frac(x.k, x.n)}`).join("; ")}`);
  const bi = ids.filter((i) => labelById.get(i)!.direction === "build");
  const di = ids.filter((i) => labelById.get(i)!.direction === "detract");
  P(`- **M2 magnitude** (Spearman, score vs signed label): rho ${f(st.rho)}; within build ${f(rho(st, (l) => l.direction === "build"))}; within detract ${f(rho(st, (l) => l.direction === "detract"))} (build ${bi.length}, detract ${di.length})`);
  P(`- **M3 opposite pairs**: ${frac(st.pairsHeld, st.pairsTotal)}`);
  P(`- **M4 conflict** (build/detract conflict cases): ${frac(countTrue(st.m1ok, confIds), confIds.length)}`);
  const hits = countTrue(st.m5ok, neuIds);
  const falseNeu = dirIds.filter((i) => {
    const s = st.caseScore.get(i)!;
    return s !== null && readM5(s, st.band) === 0;
  }).length;
  const neuAbs = neuIds.map((i) => st.caseScore.get(i)).filter((s): s is number => s !== null).map(Math.abs);
  P(`- **M5 three-way**: accuracy ${frac(countTrue(st.m5ok, ids), ids.length)}; neutral read neutral ${frac(hits, neuIds.length)}; ` +
    `false neutrals (directional read neutral) ${frac(falseNeu, dirIds.length)}; neutral |score| median ${f(median(neuAbs))}, max ${f(max(neuAbs))}`);
  const spreads: number[] = [];
  for (const id of ids) {
    const v = st.calls.filter((c) => c.case === id && !isRefused(c)).map((c) => c.score as number);
    if (v.length >= 2) spreads.push(Math.max(...v) - Math.min(...v));
  }
  P(`- **M6 noise**: spread (max-min over reps, ${spreads.length} cases with >=2 scored reps) median ${f(median(spreads))}, max ${f(max(spreads))}; ` +
    `per-rep M1 correct range ${rng(m1rep)} (n ${m1rep.map((x) => x.n).join(",")}); per-rep M5 correct range ${rng(m5rep)} (n ${m5rep.map((x) => x.n).join(",")})`);
  const costs = st.calls.filter((c) => !isRefused(c) && c.result.ok && (c.result as any).costUsd != null).map((c) => (c.result as any).costUsd as number);
  const okCalls = st.calls.filter((c) => !isRefused(c)).length;
  P(`- **M7 cost**: calls per judgment 1; questions per call ${f(mean(st.calls.map((c) => c.questionCount)))}; ` +
    `mean USD per judgment ${costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : "NaN"} (${costs.length} of ${okCalls} ok calls report cost); median ms ${f(median(st.calls.map((c) => c.ms)))}`);
  P();
}

// ---------- comparison ----------
const finals = stats.filter((s) => s.final);
const o1f = finals.filter((s) => s.arm === "O1");
const o2f = finals.filter((s) => s.arm === "O2");
P("## Comparison");
P();
if (o1f.length === 1 && o2f.length === 1) {
  const a = o1f[0], b = o2f[0];
  P(`O1 = ${a.key}, O2 = ${b.key}`);
  P();
  let verdict = "";
  const dq = (s: Stats) => s.pairsTotal > 0 && s.pairsHeld * 2 < s.pairsTotal;
  P(`1. Disqualification (fewer than half the opposite pairs): O1 holds ${s2(a)}, ${dq(a) ? "DISQUALIFIED" : "ok"}; O2 holds ${s2(b)}, ${dq(b) ? "DISQUALIFIED" : "ok"}`);
  if (dq(a) && dq(b)) verdict = "VERDICT: no verdict, both arms disqualified (step 1)";
  else if (dq(a)) verdict = "VERDICT: O2 (O1 disqualified, step 1)";
  else if (dq(b)) verdict = "VERDICT: O1 (O2 disqualified, step 1)";
  function s2(s: Stats) { return `${s.pairsHeld} of ${s.pairsTotal}`; }
  const mc = (label: string, ids: string[], ok1: Map<string, boolean>, ok2: Map<string, boolean>) => {
    let bb = 0, cc = 0; // bb: O1 right, O2 wrong; cc: O1 wrong, O2 right
    for (const id of ids) {
      const x = !!ok1.get(id), y = !!ok2.get(id);
      if (x && !y) bb++;
      else if (!x && y) cc++;
    }
    const p = mcnemar(bb, cc);
    P(`   ${label}: O1 right/O2 wrong b=${bb}, O1 wrong/O2 right c=${cc}, n=${bb + cc}, exact two-sided p=${f(p, 4)}`);
    return { bb, cc, p };
  };
  if (!verdict) {
    P("2. M5 (McNemar over all cases):");
    const r = mc("M5", caseIds, a.m5ok, b.m5ok);
    if (r.p < 0.05) verdict = `VERDICT: ${r.bb > r.cc ? "O1" : "O2"} (M5, p=${f(r.p, 4)} < 0.05, step 2)`;
    else P("   p >= 0.05: not decided");
  }
  if (!verdict) {
    P("3. M1 (McNemar over build and detract cases):");
    const dirIds = caseIds.filter((i) => labelById.get(i)!.direction !== "neutral");
    const r = mc("M1", dirIds, a.m1ok, b.m1ok);
    if (r.p < 0.05) verdict = `VERDICT: ${r.bb > r.cc ? "O1" : "O2"} (M1, p=${f(r.p, 4)} < 0.05, step 3)`;
    else P("   p >= 0.05: not decided");
  }
  if (!verdict) {
    const d = a.rho - b.rho;
    P(`4. M2 rho difference: O1 ${f(a.rho)}, O2 ${f(b.rho)}, O1 - O2 = ${f(d)} (decides when |diff| > 0.10)`);
    if (!Number.isNaN(d) && Math.abs(d) > 0.1) verdict = `VERDICT: ${d > 0 ? "O1" : "O2"} (M2 rho difference ${f(d)}, step 4)`;
    else P("   not decided");
  }
  if (!verdict) {
    P("5. Tie on accuracy; the recommendation rests on cost and structure.");
    P(`   mean USD per judgment: O1 ${costOf(a)}, O2 ${costOf(b)}; questions per call: O1 ${f(mean(a.calls.map((c) => c.questionCount)))}, O2 ${f(mean(b.calls.map((c) => c.questionCount)))}`);
    verdict = "VERDICT: tie on accuracy (step 5); decide on cost and structure";
  }
  function costOf(s: Stats) {
    const v = s.calls.filter((c) => !isRefused(c) && (c.result as any).costUsd != null).map((c) => (c.result as any).costUsd as number);
    return v.length ? String(mean(v)) : "NaN";
  }
  P();
  P(verdict);
} else {
  P(`Not run: needs exactly one final variant per arm for both O1 and O2 (found O1 ${o1f.length}, O2 ${o2f.length}).`);
}
P();

// ---------- per case ----------
P("## Per case");
P();
P("| case | kind | pair | label | " + stats.map((s) => `${s.key}${s.final ? " (final)" : ""}`).join(" | ") + " |");
P("|---|---|---|---|" + stats.map(() => "---").join("|") + "|");
for (const id of caseIds) {
  const l = labelById.get(id)!;
  const cells = stats.map((st) => {
    const s = st.caseScore.get(id)!;
    const reps = [...st.calls.filter((c) => c.case === id)]
      .sort((x, y) => String(x.rep).localeCompare(String(y.rep), undefined, { numeric: true }))
      .map((c) => (isRefused(c) ? "refused" : f(c.score as number)));
    return `${s === null ? "n/a" : f(s)}${st.m5ok.get(id) ? "" : " ✗"} [${reps.join(", ")}]`;
  });
  P(`| ${id} | ${l.kind} | ${l.pair ?? ""} | ${l.direction}${l.direction === "neutral" ? "" : " " + l.magnitude} | ${cells.join(" | ")} |`);
}
P();
console.log(out.join("\n"));
