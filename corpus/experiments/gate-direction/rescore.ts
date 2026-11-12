#!/usr/bin/env bun
/**
 * gate-direction step 1: rescore value-weighting-4's logged design-B answers stage by stage, at no Jev cost.
 *
 * Reads the local logs under corpus/runs/value-weighting-4/ (gitignored) and v4's committed labels and material.
 * Every run that asked B's d4 questions is usable, since the gate and how requests are the same in B's final, B's
 * contenders and every C variant. The primary set is the run v4's report scored (B `lin`, held-out finals, 5 reps),
 * so the baseline reproduces v4's numbers; dev is B `lin` in dev-b-final (2 reps); pooled is both (108 cases).
 *
 * v4's labels are per case only (direction, magnitude 1 to 3, kind, character). They name no touched value and no
 * per-value direction, so every "truth" used here is the case's own label. Per-value gate recall and false fires
 * cannot be computed from them; see report.md.
 *
 * usage: bun rescore.ts > step1.md
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "../../..");
const RUNS = join(root, "corpus/runs/value-weighting-4");
const V4 = join(root, "corpus/experiments/value-weighting-4");
const VALS: string[] = (
  JSON.parse(readFileSync(join(root, "corpus/experiments/value-weighting-3/catalogue.json"), "utf8")) as {
    values: { id: string }[];
  }
).values.map((v) => v.id);
const LEV = [1, 2, 3];
const CH = ["stake", "deed"] as const;
const DIR = ["up", "down"] as const;

type Dir = "build" | "detract" | "neutral";
type Label = { id: string; direction: Dir; magnitude: number; character?: boolean };
type Imp = Record<string, number>;
type Judgment = { g: Record<string, number>; h: Record<string, number | null> };
type Data = { L: Map<string, Label>; imp: Map<string, Imp>; scen: Map<string, string>; B: Map<string, Judgment[]> };
const SGN: Record<Dir, number> = { build: 1, detract: -1, neutral: 0 };
const signed = (l: Label) => SGN[l.direction] * (l.direction === "neutral" ? 0 : l.magnitude);

function load(split: "heldout" | "dev", run: string, keep: (r: { arm: string; variant: string }) => boolean): Data {
  const L = new Map((JSON.parse(readFileSync(join(V4, `${split}-labels.json`), "utf8")) as Label[]).map((l) => [l.id, l]));
  const m = JSON.parse(readFileSync(join(V4, `${split}-material.json`), "utf8")) as {
    variants: { id: string; importance: Imp }[];
    scenarios: { id: string; cases: { id: string; variant: string }[] }[];
  };
  const byVariant = new Map(m.variants.map((v) => [v.id, v.importance]));
  const imp = new Map<string, Imp>();
  const scen = new Map<string, string>();
  for (const s of m.scenarios)
    for (const c of s.cases) {
      imp.set(c.id, byVariant.get(c.variant) as Imp);
      scen.set(c.id, s.id);
    }
  const dir = readdirSync(RUNS).find((d) => d.endsWith(run));
  if (!dir) throw new Error(`no run ${run}`);
  const B = new Map<string, Judgment[]>();
  for (const line of readFileSync(join(RUNS, dir, "judgments.jsonl"), "utf8").split("\n")) {
    if (!line) continue;
    const r = JSON.parse(line);
    if (!r.ok || !keep(r)) continue;
    const j: Judgment = { g: {}, h: {} };
    for (const q of r.requests) {
      if (q.step === "gate") for (const [k, a] of Object.entries(q.answers)) j.g[k] = (a as { noul: number }).noul;
      if (q.step === "how") for (const [k, a] of Object.entries(q.answers)) j.h[k] = (a as { level: number | null }).level;
    }
    B.set(r.case, [...(B.get(r.case) ?? []), j]);
  }
  return { L, imp, scen, B };
}
const merge = (a: Data, b: Data): Data => ({
  L: new Map([...a.L, ...b.L]),
  imp: new Map([...a.imp, ...b.imp]),
  scen: new Map([...a.scen, ...b.scen]),
  B: new Map([...a.B, ...b.B]),
});

function ranks(x: number[]): number[] {
  const o = x.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(x.length);
  for (let i = 0; i < o.length; ) {
    let j = i;
    while (j + 1 < o.length && o[j + 1]?.[0] === o[i]?.[0]) j++;
    for (let k = i; k <= j; k++) r[(o[k] as readonly [number, number])[1]] = (i + j) / 2;
    i = j + 1;
  }
  return r;
}
function spearman(x: number[], y: number[]): number {
  if (x.length < 2) return Number.NaN;
  const rx = ranks(x);
  const ry = ranks(y);
  const mx = rx.reduce((s, v) => s + v, 0) / rx.length;
  const my = ry.reduce((s, v) => s + v, 0) / ry.length;
  let n = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    const a = (rx[i] as number) - mx;
    const b = (ry[i] as number) - my;
    n += a * b;
    dx += a * a;
    dy += b * b;
  }
  return dx && dy ? n / Math.sqrt(dx * dy) : Number.NaN;
}
const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;

/** One stage swap. Every option's default is B `lin` as frozen in v4 (arms/b.ts). */
type Cfg = {
  w?: (imp: number) => number;
  touches?: "mult" | "none" | "oracle";
  chans?: readonly ("stake" | "deed")[];
  level?: "how" | "one";
  combine?: "mean" | "sum" | "firedMean" | "max";
  thr?: number;
  /** Keep only statements whose sign matches the case label (a statement-level direction oracle). */
  keepLabelSign?: boolean;
  /** Case-level direction oracle: the case's sign is the label's, its size |score|. */
  dirOracle?: boolean;
  /** Down statements count this many times an up statement. */
  down?: number;
};
function score(j: Judgment, imp: Imp, l: Label, c: Cfg): number {
  const w = c.w ?? ((i: number) => i);
  let t = j.g.touches ?? 0;
  if (c.touches === "none") t = 1;
  if (c.touches === "oracle") t = l.direction === "neutral" ? 0 : 1;
  let num = 0;
  let den = 0;
  let best = 0;
  for (const v of VALS) {
    const wi = w(imp[v] ?? 0);
    if (!wi) continue;
    let e = 0;
    for (const ch of c.chans ?? CH)
      for (const d of DIR) {
        const s = d === "up" ? 1 : -1;
        const sw = d === "up" ? 1 : -(c.down ?? 1);
        if (c.keepLabelSign && s !== SGN[l.direction]) continue;
        const k = `${ch}__${v}__${d}`;
        let p = j.g[k] ?? 0;
        if (c.thr !== undefined) p = p >= c.thr ? 1 : 0;
        const lv = j.h[k];
        e += sw * p * (c.level !== "one" && lv !== undefined && lv !== null ? (LEV[lv] ?? 1) : 1);
      }
    if (c.combine !== "firedMean" || Math.abs(e) > 1e-9) den += wi;
    num += wi * e;
    if (Math.abs(wi * e) > Math.abs(best)) best = wi * e;
  }
  const s = c.combine === "max" ? best : c.combine === "sum" ? num : den ? num / den : 0;
  return t * s;
}
function caseScores(D: Data, c: Cfg): Map<string, number> {
  const out = new Map<string, number>();
  for (const [id, js] of D.B) {
    const l = D.L.get(id) as Label;
    let s = mean(js.map((j) => score(j, D.imp.get(id) as Imp, l, c)));
    if ((c.dirOracle || c.keepLabelSign) && l.direction !== "neutral") s = SGN[l.direction] * Math.abs(s);
    out.set(id, s);
  }
  return out;
}
function metrics(D: Data, xs: Map<string, number>, ids = [...D.B.keys()]) {
  const rho = (f: (l: Label) => boolean) => {
    const sel = ids.filter((i) => f(D.L.get(i) as Label));
    return spearman(
      sel.map((i) => xs.get(i) as number),
      sel.map((i) => signed(D.L.get(i) as Label)),
    );
  };
  const dirc = ids.filter((i) => D.L.get(i)?.direction !== "neutral");
  return {
    all: rho(() => true),
    build: rho((l) => l.direction === "build"),
    detract: rho((l) => l.direction === "detract"),
    m1: dirc.filter((i) => (xs.get(i) as number) * signed(D.L.get(i) as Label) > 0).length,
    n: dirc.length,
  };
}
const f2 = (x: number) => (Number.isNaN(x) ? "n/a" : x.toFixed(2));
const P = (s: string) => console.log(s);

const held = load("heldout", "heldout-final", (r) => r.arm === "B");
const dev = load("dev", "dev-b-final", (r) => r.variant === "lin");
const pooled = merge(held, dev);
const SETS: [string, Data][] = [
  ["held-out (72)", held],
  ["dev (36)", dev],
  ["pooled (108)", pooled],
];

const ONE = (i: number) => (i > 0 ? 1 : 0);
const STAGES: [string, Cfg][] = [
  ["baseline: B `lin` as frozen", {}],
  ["touches: not multiplied", { touches: "none" }],
  ["touches: oracle (0 on neutral cases, 1 else)", { touches: "oracle" }],
  ["combine: plain sum (no denominator)", { combine: "sum" }],
  ["combine: mean over fired values only", { combine: "firedMean" }],
  ["combine: the single largest weighted value", { combine: "max" }],
  ["weights: 1 per value rated above 0", { w: ONE }],
  ["weights: none (every value 1)", { w: () => 1 }],
  ["weights: importance squared", { w: (i) => i * i }],
  ["how: every level 1 (size step removed)", { level: "one" }],
  ["channel: stake only", { chans: ["stake"] }],
  ["channel: deed only", { chans: ["deed"] }],
  ["gate: noul >= 0.5 counts 1, else 0", { thr: 0.5 }],
  ["direction: down statements count x1.5", { down: 1.5 }],
  ["direction: down statements count x2", { down: 2 }],
  ["direction: case sign from the label (oracle)", { dirOracle: true }],
  ["direction: only label-signed statements (oracle)", { keepLabelSign: true }],
];

P("# gate-direction step 1: v4 design B rescored stage by stage");
P("");
P("Generated by `rescore.ts` from the local v4 logs. Each row swaps one stage of B `lin` and keeps the rest.");
P("rho is Spearman against the signed label (+m build, -m detract, 0 neutral); within build and detract use the");
P("same score over that direction's cases. M1 is the sign of the case mean against build and detract labels.");
for (const [name, D] of SETS) {
  P("");
  P(`## ${name}, reps per case ${[...new Set([...D.B.values()].map((v) => v.length))].join("/")}`);
  P("");
  P("| stage swap | rho all | within build | within detract | M1 |");
  P("|---|---|---|---|---|");
  for (const [n, c] of STAGES) {
    const m = metrics(D, caseScores(D, c));
    P(`| ${n} | ${f2(m.all)} | ${f2(m.build)} | ${f2(m.detract)} | ${m.m1}/${m.n} |`);
  }
}

// Ceiling: the second labeller against the first, held-out only (dev has no second label).
const L2 = new Map(
  (JSON.parse(readFileSync(join(V4, "heldout-labels2.json"), "utf8")) as Label[]).map((l) => [l.id, l]),
);
const x2 = new Map([...held.B.keys()].map((i) => [i, signed(L2.get(i) as Label)]));
const c2 = metrics(held, x2);
P("");
P("## Ceiling: v4's second labeller scored as an arm (held-out)");
P("");
P(`rho all ${f2(c2.all)}, within build ${f2(c2.build)}, within detract ${f2(c2.detract)}, M1 ${c2.m1}/${c2.n}.`);
P("Labels per direction (first labeller):");
for (const d of ["build", "detract"] as const) {
  const cnt = new Map<number, number>();
  for (const l of held.L.values()) if (l.direction === d) cnt.set(l.magnitude, (cnt.get(l.magnitude) ?? 0) + 1);
  P(`- ${d}: ${[...cnt].sort().map(([k, v]) => `magnitude ${k} x${v}`).join(", ")}`);
}

// Scenario bootstrap of the within-direction rho, baseline and ceiling.
let seed = 1;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
function boot(D: Data, xs: Map<string, number>) {
  const byScen = new Map<string, string[]>();
  for (const i of D.B.keys()) byScen.set(D.scen.get(i) as string, [...(byScen.get(D.scen.get(i) as string) ?? []), i]);
  const sk = [...byScen.keys()];
  const res: Record<string, number[]> = { all: [], build: [], detract: [] };
  for (let r = 0; r < 2000; r++) {
    const ids = sk.flatMap(() => byScen.get(sk[Math.floor(rnd() * sk.length)] as string) as string[]);
    const m = metrics(D, xs, ids);
    for (const k of ["all", "build", "detract"] as const) if (!Number.isNaN(m[k])) res[k]?.push(m[k]);
  }
  return Object.fromEntries(
    Object.entries(res).map(([k, v]) => {
      v.sort((a, b) => a - b);
      return [k, `[${f2(v[Math.floor(v.length * 0.025)] as number)}, ${f2(v[Math.floor(v.length * 0.975)] as number)}]`];
    }),
  );
}
P("");
P("## Scenario bootstrap, 95% intervals (2,000 resamples, held-out)");
P("");
P("| | rho all | within build | within detract |");
P("|---|---|---|---|");
for (const [n, xs] of [
  ["baseline B `lin`", caseScores(held, {})],
  ["second labeller", x2],
] as const) {
  const b = boot(held, xs);
  P(`| ${n} | ${b.all} | ${b.build} | ${b.detract} |`);
}

// Fires per channel: statements with P >= 0.5 per judgment, mean over judgments, by the case's label.
P("");
P("## What fires (statements with P >= 0.5, per judgment, on values rated above 0)");
for (const [name, D] of SETS) {
  P("");
  P(`### ${name}`);
  P("");
  P("| case label | cases | stake fires | deed fires | of which against the case label | touches |");
  P("|---|---|---|---|---|---|");
  for (const d of ["neutral", "build", "detract"] as const) {
    const ids = [...D.B.keys()].filter((i) => D.L.get(i)?.direction === d);
    let st = 0;
    let de = 0;
    let against = 0;
    let n = 0;
    let t = 0;
    for (const i of ids)
      for (const j of D.B.get(i) as Judgment[]) {
        n++;
        t += j.g.touches ?? 0;
        for (const v of VALS) {
          if (!(D.imp.get(i) as Imp)[v]) continue;
          for (const ch of CH)
            for (const dd of DIR)
              if ((j.g[`${ch}__${v}__${dd}`] ?? 0) >= 0.5) {
                if (ch === "stake") st++;
                else de++;
                if (d !== "neutral" && (dd === "up" ? 1 : -1) !== SGN[d]) against++;
              }
        }
      }
    P(
      `| ${d} | ${ids.length} | ${f2(st / n)} | ${f2(de / n)} | ${d === "neutral" ? "all" : `${f2(against / n)} (${Math.round((100 * against) / (st + de))}%)`} | ${f2(t / n)} |`,
    );
  }
}

// Channel sign agreement on directional cases.
P("");
P("## Channel signs against the case label (pooled 108, directional cases)");
P("");
const sStake = caseScores(pooled, { chans: ["stake"] });
const sDeed = caseScores(pooled, { chans: ["deed"] });
const sBoth = caseScores(pooled, {});
const tally = new Map<string, number>();
for (const [i, l] of pooled.L) {
  if (l.direction === "neutral" || !pooled.B.has(i)) continue;
  const s = SGN[l.direction];
  const k = `stake ${(sStake.get(i) as number) * s > 0 ? "right" : "wrong"}, deed ${(sDeed.get(i) as number) * s > 0 ? "right" : "wrong"} -> B ${(sBoth.get(i) as number) * s > 0 ? "right" : "wrong"}`;
  tally.set(k, (tally.get(k) ?? 0) + 1);
}
P("| channels | cases |");
P("|---|---|");
for (const [k, v] of [...tally].sort((a, b) => b[1] - a[1])) P(`| ${k} | ${v} |`);

// The held-out misses: label-signed mass R against opposite mass W, weighted as B weighs.
P("");
P("## Held-out direction misses: weighted mass for (R) and against (W) the case label");
P("");
P("| case | label | character | second labeller | R | W | B score | three largest weighted statements |");
P("|---|---|---|---|---|---|---|---|");
const rw: { hit: boolean; R: number; W: number }[] = [];
for (const [i, js] of held.B) {
  const l = held.L.get(i) as Label;
  if (l.direction === "neutral") continue;
  const imp = held.imp.get(i) as Imp;
  const den = VALS.reduce((s, v) => s + (imp[v] ?? 0), 0);
  const agg = new Map<string, number>();
  for (const j of js)
    for (const v of VALS)
      for (const ch of CH)
        for (const d of DIR) {
          const k = `${ch}__${v}__${d}`;
          const lv = j.h[k];
          const x = ((imp[v] ?? 0) * (j.g[k] ?? 0) * (lv !== undefined && lv !== null ? (LEV[lv] ?? 1) : 1) * (d === "up" ? 1 : -1)) / den / js.length;
          agg.set(`${v}.${ch}.${d}`, (agg.get(`${v}.${ch}.${d}`) ?? 0) + x);
        }
  const s = SGN[l.direction];
  const R = [...agg.values()].filter((x) => x * s > 0).reduce((a, x) => a + Math.abs(x), 0);
  const W = [...agg.values()].filter((x) => x * s < 0).reduce((a, x) => a + Math.abs(x), 0);
  rw.push({ hit: R > W, R, W });
  if (R > W) continue;
  const top = [...agg].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
  P(
    `| ${i} | ${l.direction} ${l.magnitude} | ${l.character ? "Y" : ""} | ${L2.get(i)?.direction} | ${f2(R)} | ${f2(W)} | ${f2((sBoth.get(i) as number) ?? Number.NaN)} | ${top.map(([k, x]) => `${k} ${f2(x)}`).join("; ")} |`,
  );
}
const hits = rw.filter((r) => r.hit);
const misses = rw.filter((r) => !r.hit);
P("");
P(
  `Mean R / W: hits ${f2(mean(hits.map((r) => r.R)))} / ${f2(mean(hits.map((r) => r.W)))} (${hits.length}); misses ${f2(mean(misses.map((r) => r.R)))} / ${f2(mean(misses.map((r) => r.W)))} (${misses.length}). R and W are before P(touches), so B's score is (R - W) x P(touches) in sign.`,
);

// Importance bands: which values carry the direction signal.
const auc = (pos: number[], neg: number[]) => {
  let s = 0;
  for (const p of pos) for (const n of neg) s += p > n ? 1 : p === n ? 0.5 : 0;
  return s / (pos.length * neg.length);
};
P("");
P("## Importance bands");
P("");
P("Per case, the summed P(up) - P(down) over the holder's values in one importance band, one channel, unweighted.");
P("AUC is the chance that a build case's net is above a detract case's (0.5 is no signal, under 0.5 points the wrong way).");
P("");
P("| set | band | stake AUC | deed AUC |");
P("|---|---|---|---|");
const BANDS: [string, (i: number) => boolean][] = [
  ["rated 0", (i) => i === 0],
  ["rated 1 to 2", (i) => i >= 1 && i <= 2],
  ["rated 3 to 4", (i) => i >= 3],
];
for (const [name, D] of SETS)
  for (const [bn, inBand] of BANDS) {
    const cells = CH.map((ch) => {
      const net = (id: string) =>
        mean(
          (D.B.get(id) as Judgment[]).map((j) =>
            VALS.filter((v) => inBand((D.imp.get(id) as Imp)[v] ?? 0)).reduce(
              (s, v) => s + (j.g[`${ch}__${v}__up`] ?? 0) - (j.g[`${ch}__${v}__down`] ?? 0),
              0,
            ),
          ),
        );
      const ids = [...D.B.keys()];
      return f2(
        auc(
          ids.filter((i) => D.L.get(i)?.direction === "build").map(net),
          ids.filter((i) => D.L.get(i)?.direction === "detract").map(net),
        ),
      );
    });
    P(`| ${name} | ${bn} | ${cells.join(" | ")} |`);
  }
P("");
P("B scored with only one band's values weighted (linear within the band), and with other weightings:");
P("");
P("| weighting | held-out rho / build / detract / M1 | dev | pooled |");
P("|---|---|---|---|");
for (const [n, w] of [
  ["linear (B)", (i: number) => i],
  ["only values rated 3 to 4", (i: number) => (i >= 3 ? i : 0)],
  ["only values rated 1 to 2", (i: number) => (i <= 2 ? i : 0)],
  ["importance squared", (i: number) => i * i],
  ["max(0, importance - 1)", (i: number) => Math.max(0, i - 1)],
] as const) {
  const cells = SETS.map(([, D]) => {
    const m = metrics(D, caseScores(D, { w }));
    return `${f2(m.all)} / ${f2(m.build)} / ${f2(m.detract)} / ${m.m1}/${m.n}`;
  });
  P(`| ${n} | ${cells.join(" | ")} |`);
}

// Up and down mass by label: does the gate lean one way whatever happened?
P("");
P("## Summed P(up) and P(down) per judgment, all 10 values, both channels, unweighted");
P("");
P("| set | label | sum P(up) | sum P(down) |");
P("|---|---|---|---|");
for (const [name, D] of SETS)
  for (const d of ["neutral", "build", "detract"] as const) {
    const js = [...D.B].filter(([i]) => D.L.get(i)?.direction === d).flatMap(([, v]) => v);
    const sum = (dd: string) =>
      mean(js.map((j) => VALS.reduce((s, v) => s + CH.reduce((t, ch) => t + (j.g[`${ch}__${v}__${dd}`] ?? 0), 0), 0)));
    P(`| ${name} | ${d} | ${f2(sum("up"))} | ${f2(sum("down"))} |`);
  }

// Sign loss split by whether the second labeller disputes the miss.
P("");
P("## Direction oracle, split by label dispute (held-out)");
P("");
const base = caseScores(held, {});
const missIds = [...base].filter(([i, s]) => held.L.get(i)?.direction !== "neutral" && s * signed(held.L.get(i) as Label) <= 0).map(([i]) => i);
const disputed = missIds.filter((i) => L2.get(i)?.direction !== held.L.get(i)?.direction);
const undisputed = missIds.filter((i) => !disputed.includes(i));
P("| misses given the label's sign | rho all | within build | within detract |");
P("|---|---|---|---|");
for (const [n, fix] of [
  ["none (baseline)", []],
  [`the ${undisputed.length} the second labeller agrees with: ${undisputed.join(", ")}`, undisputed],
  [`the ${disputed.length} it labels otherwise: ${disputed.join(", ")}`, disputed],
  ["all", missIds],
] as const) {
  const x = new Map(base);
  for (const i of fix) x.set(i, SGN[(held.L.get(i) as Label).direction] * Math.abs(base.get(i) as number));
  const m = metrics(held, x);
  P(`| ${n} | ${f2(m.all)} | ${f2(m.build)} | ${f2(m.detract)} |`);
}
