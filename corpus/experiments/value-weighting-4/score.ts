#!/usr/bin/env bun
/*
 * score.ts - scorer for value-weighting-4 (spec: prereg.md "Scoring" and "Comparison, decided now"; M1 to M7 as in
 * ../value-weighting-3/prereg.md). Arms are B, C and optionally C2.
 * usage: bun score.ts --calls <judgments.jsonl[,more.jsonl]> --labels <labels.json> [--labels2 <labels2.json>] [--cases a,b,...]
 *
 * Choices where the spec is silent (plain reading):
 *  1. Case set: labelled cases that appear in the judgments (any arm/variant), intersected with --cases when given.
 *     Judgments for unlabelled or unselected cases are ignored (count printed). --calls may list several paths,
 *     comma-separated; their lines are concatenated (nothing deduplicated).
 *  2. A judgment is "refused" when ok is false or score is null. Refused judgments are excluded from the case mean
 *     and from per-rep counts. A case with no non-refused judgment for a (arm, variant) has no score: it counts as
 *     wrong in M1/M3/M4/M5 (stays in the denominator) and is left out of Spearman and the noise spread.
 *  3. Sign test: right sign means sign(score) equals the label's sign (build +, detract -, neutral 0); a score of
 *     exactly 0 is therefore wrong for build/detract in M1.
 *  4. Band: taken from the judgments' `band` for that (arm, variant); if it varies, the first judgment's band is
 *     used and a warning is printed. M5 reads neutral when |score| < band, else by sign (score 0 with band 0 reads
 *     sign 0, which counts wrong for build/detract and right for neutral only through sign 0 = neutral label).
 *  5. Pairs (M3): on an opposite case `pair` is the id of its partner. A pair is the unordered {id, pair}, both
 *     labelled opposite and pointing at each other; counted once. It holds when both members get the right sign
 *     (M1 rule on the case mean); a member lacking a score fails. A pair whose partner is outside the case set
 *     is dropped from the count and printed in the header. An opposite case whose partner is unlabelled, not
 *     opposite, or does not point back is an error naming both ids (exit 1).
 *  6. M4: kind == "conflict" and direction build/detract, M1 rule.
 *  7. Spearman is over cases with a score; label values are +magnitude / -magnitude / 0. Within-build and
 *     within-detract use the same score vs signed label over that direction only (constant labels give NaN).
 *  8. M6 spread: max - min of the non-refused rep scores per case, over cases with >= 2 such scores.
 *     Per-rep M1 / M5: correct count over judgments of that rep (refused excluded), shown as k/n; "range" is the
 *     min..max of the k across reps (with the n shown alongside).
 *  9. M7: requests per judgment = mean `calls` and questions per judgment = mean `questionCount`, both over all
 *     judgments of the (arm, variant) (refused included, they count what was spent). Mean USD per judgment = mean
 *     costUsd over ok judgments with non-null cost (the number of ok judgments lacking cost is shown). Median ms
 *     over all judgments (refused included).
 * 10. Comparison: uses the variants flagged final; needs exactly one final variant for B and for each challenger run (arm
 *     names matched case-insensitively). C vs B, and C2 vs B when any C2 judgment exists, are separate five-step
 *     comparisons. Step 1: an arm is disqualified when held pairs * 2 < total pairs; no pairs means no
 *     disqualification; one disqualified -> the other wins; both -> no verdict. Step 2: McNemar on M5 correctness over
 *     the case set, decided when p < 0.05 for the arm correct on more discordant cases. Step 3: same on M1 over
 *     build/detract cases. Step 4: |rho_chal - rho_B| > 0.10 (strict), NaN does not decide. Step 5: tie, B recommended.
 *     Printing stops at the deciding step (M8 is then printed). "Congruence moved the needle" = C or C2 wins at step
 *     2, 3 or 4 (a step-1 win does not count). Bonferroni: when C2 judgments exist, a C2 win at step 2 or 3 with
 *     0.025 <= p < 0.05 prints a NOTE that it does not survive correction and the needle line marks it; the VERDICT
 *     line itself is still the uncorrected one. The note is applied to C2 only, as the prereg words it; C's own
 *     p is checked against 0.05 only. A step-4 C2 win has no p and is not flagged.
 * 11. Duplicate (case, arm, variant, rep) judgments are each treated as a judgment; nothing is deduplicated.
 * 12. Reps in the header = distinct `rep` values over judgments.
 * 13. Second labeller (--labels2): never touches the Comparison. Agreement is over case-set cases that have a
 *     labels2 entry (cases lacking one are counted and named, not agreed). The confusion table has rows = first
 *     labeller, columns = second. Spearman is between signed labels (+magnitude / -magnitude / 0 for neutral) over the
 *     same cases. The consensus subset = case-set cases where both give the same direction (neutral/neutral
 *     included). On it, M1 = build/detract consensus cases right on sign of the case mean (first labeller's
 *     direction, which equals the second's); M5 = three-way accuracy over all consensus cases; M3 = pairs with both
 *     members in the subset (opposite pairs from the first labeller's pair field). A case without a score counts
 *     wrong, as in the main metrics.
 * 14. M8: character case = label.character === true. Case part = M1 (sign of case mean) over character cases that are
 *     build or detract, k/n. Pair part = a pair counts as a character pair when either member has character true;
 *     held by the M3 rule; k/n. The M8 McNemar uses only the case part (M1 correctness over character build/detract
 *     cases); the pair counts are printed beside it. Missing `character` reads as false.
 * 15. Per-case table gains a `char` column (Y or blank) and a `set` column is not added; labels' `set` is read but only
 *     used in the header tally (cases by set).
 */
import { readFileSync } from "node:fs";

type Label = {
  id: string;
  direction: "build" | "detract" | "neutral";
  magnitude: number;
  kind: "plain" | "opposite" | "conflict" | "neutral";
  pair: string | null;
  set: "A" | "B" | "C";
  character?: boolean;
  rationale?: string;
};
type Label2 = { id: string; direction: "build" | "detract" | "neutral"; magnitude: number };
type Call = {
  case: string;
  arm: string;
  variant: string;
  final: boolean;
  band: number;
  rep: number | string;
  ok: boolean;
  score: number | null;
  error: string | null;
  calls: number;
  questionCount: number;
  costUsd: number | null;
  ms: number;
  requests?: unknown[];
};

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const callsPath = arg("--calls");
const labelsPath = arg("--labels");
if (!callsPath || !labelsPath) {
  console.error("usage: bun score.ts --calls <judgments.jsonl[,more.jsonl]> --labels <labels.json> [--labels2 <labels2.json>] [--cases a,b,...]");
  process.exit(2);
}
const caseFilter = arg("--cases")?.split(",").map((s) => s.trim()).filter(Boolean);

const labels: Label[] = JSON.parse(readFileSync(labelsPath, "utf8"));
const labelById = new Map(labels.map((l) => [l.id, l]));
const labels2Path = arg("--labels2");
const labels2: Label2[] | null = labels2Path ? JSON.parse(readFileSync(labels2Path, "utf8")) : null;
const labels2ById = new Map((labels2 ?? []).map((l) => [l.id, l]));
const allCalls: Call[] = callsPath
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .flatMap((p) =>
    readFileSync(p, "utf8")
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as Call),
  );

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
const signedLabel = (l: { direction: "build" | "detract" | "neutral"; magnitude: number }) => dirSign[l.direction] * (l.direction === "neutral" ? 0 : l.magnitude);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
function median(xs: number[]) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const max = (xs: number[]) => (xs.length ? Math.max(...xs) : NaN);
const f = (x: number, d = 3) => (Number.isNaN(x) ? "NaN" : Number.isInteger(x) && d === 3 ? String(x) : x.toFixed(d));
const isRefused = (c: Call) => c.ok !== true || c.score === null || c.score === undefined;

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
  charPairsHeld: number;
  charPairsTotal: number;
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
  const isCharPair = ([x, y]: [string, string]) => labelById.get(x)!.character === true || labelById.get(y)!.character === true;
  let cHeld = 0, cTotal = 0;
  for (const pr of PAIRS) {
    const h = rightSign(pr[0]) && rightSign(pr[1]);
    if (h) held++;
    if (isCharPair(pr)) { cTotal++; if (h) cHeld++; }
  }
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
    pairsHeld: held, pairsTotal: total, charPairsHeld: cHeld, charPairsTotal: cTotal,
    rho: spearman(xs, ys),
  };
}
const stats = keys.map(compute);
function costOf(s: { calls: Call[] }): number[] {
  return s.calls.filter((c) => !isRefused(c) && c.costUsd != null).map((c) => c.costUsd as number);
}

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

P("# value-weighting-4 scoring");
P();
P("## Header");
P();
const refusedCalls = calls.filter(isRefused);
P(`- judgments: ${calls.length}${ignored ? ` (${ignored} more ignored: case unlabelled or not selected)` : ""}`);
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
P(`  - by set: ${tally((l) => String(l.set))}`);
P(`  - character cases: ${tally((l) => (l.character ? "character" : "other"))}`);
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
  const chIds = dirIds.filter((i) => labelById.get(i)!.character === true);
  P(`- **M8 character** (reported): M1 on character build/detract cases ${frac(countTrue(st.m1ok, chIds), chIds.length)}; character opposite pairs held ${frac(st.charPairsHeld, st.charPairsTotal)}`);
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
  const costs = costOf(st);
  const okCalls = st.calls.filter((c) => !isRefused(c)).length;
  P(`- **M7 cost**: requests per judgment ${f(mean(st.calls.map((c) => c.calls)))}; questions per judgment ${f(mean(st.calls.map((c) => c.questionCount)))}; ` +
    `mean USD per judgment ${costs.length ? Number(mean(costs).toPrecision(6)) : "NaN"} (${costs.length} of ${okCalls} ok judgments report cost, ${okCalls - costs.length} lacking); median ms per judgment ${f(median(st.calls.map((c) => c.ms)))}`);
  P();
}

// ---------- comparison ----------
const finals = stats.filter((s) => s.final);
const finalOf = (name: string) => finals.filter((s) => s.arm.toUpperCase() === name);
const dirIdsAll = caseIds.filter((i) => labelById.get(i)!.direction !== "neutral");
const charDirIds = dirIdsAll.filter((i) => labelById.get(i)!.character === true);
const mcCount = (ids: string[], okA: Map<string, boolean>, okB: Map<string, boolean>) => {
  let bb = 0, cc = 0; // bb: A right, B wrong; cc: A wrong, B right
  for (const id of ids) {
    const x = !!okA.get(id), y = !!okB.get(id);
    if (x && !y) bb++;
    else if (!x && y) cc++;
  }
  return { bb, cc, p: mcnemar(bb, cc) };
};
type Outcome = { verdict: string; winner: "B" | "chal" | null; step: number | null; p: number | null };
function compare(chalName: string, ch: Stats, base: Stats, bonferroni: boolean): Outcome {
  const B = "B";
  P(`### ${chalName} vs B`);
  P();
  P(`B = ${base.key}, ${chalName} = ${ch.key}`);
  P();
  let verdict = "";
  let winner: Outcome["winner"] = null, step: number | null = null, pDec: number | null = null;
  const dq = (s: Stats) => s.pairsTotal > 0 && s.pairsHeld * 2 < s.pairsTotal;
  const s2 = (s: Stats) => `${s.pairsHeld} of ${s.pairsTotal}`;
  P(`1. Disqualification (fewer than half the opposite pairs): B holds ${s2(base)}, ${dq(base) ? "DISQUALIFIED" : "ok"}; ${chalName} holds ${s2(ch)}, ${dq(ch) ? "DISQUALIFIED" : "ok"}`);
  if (dq(base) && dq(ch)) { verdict = `VERDICT (${chalName} vs B): no verdict, both arms disqualified (step 1)`; step = 1; }
  else if (dq(base)) { verdict = `VERDICT (${chalName} vs B): ${chalName} (B disqualified, step 1)`; winner = "chal"; step = 1; }
  else if (dq(ch)) { verdict = `VERDICT (${chalName} vs B): B (${chalName} disqualified, step 1)`; winner = "B"; step = 1; }
  const show = (label: string, ids: string[], okB: Map<string, boolean>, okC: Map<string, boolean>) => {
    const r = mcCount(ids, okB, okC); // bb: B right/chal wrong
    P(`   ${label}: B right/${chalName} wrong b=${r.bb}, B wrong/${chalName} right c=${r.cc}, n=${r.bb + r.cc}, exact two-sided p=${f(r.p, 4)}`);
    return r;
  };
  const decide = (name: string, r: { bb: number; cc: number; p: number }, st: number) => {
    if (r.p < 0.05) {
      winner = r.bb > r.cc ? "B" : "chal"; step = st; pDec = r.p;
      verdict = `VERDICT (${chalName} vs B): ${winner === "B" ? "B" : chalName} (${name}, p=${f(r.p, 4)} < 0.05, step ${st})`;
    } else P("   p >= 0.05: not decided");
  };
  if (!verdict) { P("2. M5 (McNemar over all cases):"); decide("M5", show("M5", caseIds, base.m5ok, ch.m5ok), 2); }
  if (!verdict) { P("3. M1 (McNemar over build and detract cases):"); decide("M1", show("M1", dirIdsAll, base.m1ok, ch.m1ok), 3); }
  if (!verdict) {
    const d = ch.rho - base.rho;
    P(`4. M2 rho difference: B ${f(base.rho)}, ${chalName} ${f(ch.rho)}, ${chalName} - B = ${f(d)} (decides when |diff| > 0.10)`);
    if (!Number.isNaN(d) && Math.abs(d) > 0.1) {
      winner = d > 0 ? "chal" : "B"; step = 4;
      verdict = `VERDICT (${chalName} vs B): ${winner === "B" ? "B" : chalName} (M2 rho difference ${f(d)}, step 4)`;
    } else P("   not decided");
  }
  if (!verdict) {
    P("5. Tie on accuracy; B is recommended: it asks fewer questions.");
    const usd = (s: Stats) => (costOf(s).length ? String(Number(mean(costOf(s)).toPrecision(6))) : "NaN");
    const per = (s: Stats, k: "calls" | "questionCount") => f(mean(s.calls.map((c) => c[k])));
    P(`   mean USD per judgment: B ${usd(base)}, ${chalName} ${usd(ch)}; requests per judgment: B ${per(base, "calls")}, ${chalName} ${per(ch, "calls")}; questions per judgment: B ${per(base, "questionCount")}, ${chalName} ${per(ch, "questionCount")}`);
    verdict = `VERDICT (${chalName} vs B): tie on accuracy (step 5); B recommended, it asks fewer questions`;
    step = 5;
  }
  if (bonferroni && winner === "chal" && step !== null && step <= 3 && pDec !== null && pDec >= 0.025) {
    P(`   NOTE: two comparisons against B (C and C2); ${chalName} win at p=${f(pDec, 4)} is between 0.025 and 0.05 and does not survive a Bonferroni correction.`);
  }
  // M8 (reported, never decides)
  const m8 = mcCount(charDirIds, base.m1ok, ch.m1ok);
  P(`   M8 character (reported, never decides): McNemar on M1 correctness over character build/detract cases (n=${charDirIds.length}): ` +
    `B right/${chalName} wrong b=${m8.bb}, B wrong/${chalName} right c=${m8.cc}, exact two-sided p=${f(m8.p, 4)}; ` +
    `character pairs held: B ${base.charPairsHeld}/${base.charPairsTotal}, ${chalName} ${ch.charPairsHeld}/${ch.charPairsTotal}`);
  P();
  P(verdict);
  P();
  void B;
  return { verdict, winner, step, p: pDec };
}
P("## Comparison");
P();
const bF = finalOf("B"), cF = finalOf("C"), c2F = finalOf("C2");
const c2Present = calls.some((c) => c.arm.toUpperCase() === "C2");
if (bF.length === 1 && (cF.length === 1 || c2F.length === 1)) {
  const outs: { name: string; o: Outcome }[] = [];
  if (cF.length === 1) outs.push({ name: "C", o: compare("C", cF[0], bF[0], c2Present) });
  else P("C: no single final variant; comparison not run.");
  if (c2Present) {
    if (c2F.length === 1) outs.push({ name: "C2", o: compare("C2", c2F[0], bF[0], true) });
    else P(`C2: judgments exist but found ${c2F.length} final variants; comparison not run.`);
  }
  const moved = outs.filter(({ o }) => o.winner === "chal" && o.step !== null && o.step >= 2 && o.step <= 4);
  const survives = (n: string, o: Outcome) => !(n === "C2" && o.step !== null && o.step <= 3 && o.p !== null && o.p >= 0.025);
  P(moved.length
    ? `Congruence moved the needle: YES (${moved.map(({ name, o }) => `${name} wins at step ${o.step}${survives(name, o) ? "" : ", not surviving Bonferroni"}`).join("; ")})`
    : "Congruence moved the needle: NO (neither C nor C2 wins at step 2, 3 or 4)");
} else {
  P(`Not run: needs exactly one final variant for B and at least one of C, C2 (found B ${bF.length}, C ${cF.length}, C2 ${c2F.length}).`);
}
P();

// ---------- second labeller (reported, never decides) ----------
if (labels2) {
  P("## Second labeller (reported only; never affects the Comparison)");
  P();
  const both = caseIds.filter((i) => labels2ById.has(i));
  const missing = caseIds.filter((i) => !labels2ById.has(i));
  const dirs = ["build", "detract", "neutral"] as const;
  const agree = both.filter((i) => labelById.get(i)!.direction === labels2ById.get(i)!.direction);
  P(`- direction agreement: ${frac(agree.length, both.length)}${missing.length ? ` (${missing.length} case-set cases lack a second label: ${missing.join(", ")})` : ""}`);
  P("- confusion (rows = first labeller, columns = second):");
  P();
  P("| first \\ second | build | detract | neutral |");
  P("|---|---|---|---|");
  for (const d1 of dirs) {
    P(`| ${d1} | ${dirs.map((d2) => both.filter((i) => labelById.get(i)!.direction === d1 && labels2ById.get(i)!.direction === d2).length).join(" | ")} |`);
  }
  P();
  P(`- Spearman between signed labels (${both.length} cases): ${f(spearman(both.map((i) => signedLabel(labelById.get(i)!)), both.map((i) => signedLabel(labels2ById.get(i)!))))}`);
  const cons = new Set(agree);
  const consIds = caseIds.filter((i) => cons.has(i));
  const consDir = consIds.filter((i) => labelById.get(i)!.direction !== "neutral");
  const consPairs = PAIRS.filter(([x, y]) => cons.has(x) && cons.has(y));
  P(`- consensus subset: ${consIds.length} cases (${consDir.length} build/detract), ${consPairs.length} of ${PAIRS.length} pairs`);
  P();
  for (const st of stats) {
    const right = (id: string) => {
      const s = st.caseScore.get(id)!;
      return s !== null && sign(s) === dirSign[labelById.get(id)!.direction];
    };
    const held = consPairs.filter(([x, y]) => right(x) && right(y)).length;
    P(`- ${st.key}${st.final ? " (final)" : ""}: M1 ${frac(countTrue(st.m1ok, consDir), consDir.length)}; M3 ${frac(held, consPairs.length)}; M5 ${frac(countTrue(st.m5ok, consIds), consIds.length)}`);
  }
  P();
}

// ---------- per case ----------
P("## Per case");
P();
P("| case | kind | char | pair | label | " + stats.map((s) => `${s.key}${s.final ? " (final)" : ""}`).join(" | ") + " |");
P("|---|---|---|---|---|" + stats.map(() => "---").join("|") + "|");
for (const id of caseIds) {
  const l = labelById.get(id)!;
  const cells = stats.map((st) => {
    const s = st.caseScore.get(id)!;
    const reps = [...st.calls.filter((c) => c.case === id)]
      .sort((x, y) => String(x.rep).localeCompare(String(y.rep), undefined, { numeric: true }))
      .map((c) => (isRefused(c) ? "refused" : f(c.score as number)));
    return `${s === null ? "n/a" : f(s)}${st.m5ok.get(id) ? "" : " ✗"} [${reps.join(", ")}]`;
  });
  P(`| ${id} | ${l.kind} | ${l.character ? "Y" : ""} | ${l.pair ?? ""} | ${l.direction}${l.direction === "neutral" ? "" : " " + l.magnitude} | ${cells.join(" | ")} |`);
}
P();
console.log(out.join("\n"));
