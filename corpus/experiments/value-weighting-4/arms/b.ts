/**
 * Arm B (value-weighting-4): v3's O2 with the two fixes. Jev never sees an importance; `ask` receives
 * none, and only `score` (code) reads them (contract.ts).
 *
 * FINAL `lin`: v3's d4 questions, unchanged, then code.
 *
 * Questions: imported, not copied. `ask` is the `d4-*` variants' ask from
 * `../../value-weighting-3/arms/o2.ts` (its header has the full wording). In outline:
 *   State (both requests): `you` the holder's name; `who_you_are` the identity text; `earlier` the
 *     holder's own earlier copies in the scenario, one line each; `now` the encounter as the holder
 *     received it; `your_part` whether the other did it with the holder directly or the holder saw it.
 *   Step `gate`, one request, 41 nouls:
 *     - per value (Schwartz's ten), per channel, per direction, one literal yes/no question:
 *       `stake__<value>__up|down`: does what the other did advance / set back the holder's own share
 *         of the value ("Does what {o} did make you safer ...?" / "... bring danger ... closer to you?");
 *       `deed__<value>__up|down`: did the other act for / against the value ("Did {o} protect someone
 *         from danger or trouble?" / "Did {o} bring danger or trouble down on someone?").
 *     - `touches`: reverie's touches noul, "Does what just happened touch you personally: your safety,
 *       your secrets, your people, or something you want?"
 *   Step `how`, chained, one request: a 3-level score of strength (slight / clear / big for a stake;
 *     faintly / clearly / strongly shown for a deed) for every statement whose noul reached 0.4.
 *
 * Score (code), per judgment:
 *   effect(v) = sum over v's four statements of sign (up +1, down -1) * P(noul) * L,
 *               L = 1, 2, 3 by the strength's most probable level (1 when none was asked)
 *   score     = 0 if P(touches) < TAU, else P(touches) * sum_v w(imp_v) * effect(v) / sum_v w(imp_v)
 *   w(imp)    = imp (linear: 0 to 4; "matters" = 2 counts, "does not matter" = 0 drops out)
 *   TAU = 0 (no hard gate; see below). Band 0.05: |score| < 0.05 reads neutral.
 * State fields read by code: none beyond the answers and the holder's importances.
 *
 * The two fixes, each chosen by measured lift. Every candidate was rescored for free on logged d4
 * answers: v3's 88 labelled cases (dev and held-out, 8 to 14 reps a case) and this run's 36 dev cases
 * (12 reps: the probe run and the dev run of all five variants ask the same questions). Totals are over
 * the 124 cases: M5 of 124, pairs of 40, M1 of 108, neutral hits of 16, false neutrals of 108; rho is
 * the mean over the three sets; case score = mean over reps.
 *   - Weighting: v3's `top` (1 for importance 3 or 4, else 0) is barred: it zeroed a death threat on a
 *     value rated 2 (v3 a19-1, +0.04; linear scores it -0.99 on the same answers). Measured at band
 *     0.05, x touches, no gate (M5 / pairs / M1 / rho): linear 86 / 21 / 83 / 0.63; squared
 *     88 / 22 / 82 / 0.65; max(0, imp-1) 90 / 22 / 81 / 0.65; imp^1.5 88 / 21 / 81 / 0.65; 2^(imp-1)
 *     86 / 21 / 81 / 0.63; 1 for imp >= 2 83 / 20 / 80 / 0.61; imp for imp >= 2 89 / 22 / 82 / 0.65.
 *     On direction they barely differ: linear and squared disagree on 3 cases (2 to 1 for linear),
 *     linear and max(0, imp-1) on 4 (3 to 1 for linear). The M5 gaps come from cases within a few
 *     hundredths of the band. On this run's dev linear ties or leads every one on M5 and M1 (M5 23,
 *     M1 23, rho 0.65; 1 for imp >= 2 holds one more pair and reads one fewer neutral). No
 *     alternative lifts beyond the 1 to 2 cases a split moves on noise, so linear, the starting point,
 *     stays; squared and max(0, imp-1) are contenders. For the record, top scores 87 / 25 / 82 / 0.61:
 *     its pair lead is on v3's dev, the set it was chosen on (10 against linear's 7); 9 against 8 on
 *     v3's held-out, 6 and 6 on this dev.
 *   - Neutral gate: measured, no lift, so TAU = 0. The touches noul does not separate neutral from
 *     directional cases here: the 16 neutrals read 0.13 to 0.58 (case means), and 18 directional cases
 *     read 0.17 to 0.33 (the 10 of them from this run's dev are all flagged `character`: labelled for
 *     what the act shows about the other). TAU 0.18 changes nothing; 0.20 reads 1 more neutral and 2
 *     more false neutrals (M5 86, unchanged); 0.22 costs 2 pairs and 5 directions for 2 neutrals (M5
 *     87); 0.30 costs 4 pairs and 10 directions. Of the five neutrals that still leak (+0.06 to +0.48),
 *     two read touches 0.20 and 0.21, among the directional cases, and three read 0.44 to 0.58, above
 *     most of them. The best gate (TAU 0.22) is the contender `lin-g22`, so the held-out secondary run
 *     measures it on fresh material.
 *   - P(touches) still multiplies the score: without it the band must rise to about 0.2 to read
 *     neutrals, and false neutrals rise from 11 to 19 (M5 86 against 80 at TAU 0). The best
 *     unmultiplied form (TAU 0.20, band 0.02, contender `lin-g20-flat`) scores M5 88 but reads only 6
 *     of 16 neutrals. The multiplier is the soft gate that works.
 *   - Band 0.05, v3's. 0.04 scores M5 89 (3 fewer false neutrals), all three from directional cases at
 *     |0.047 to 0.050|, with a neutral at 0.039 just under it; neutral and weak directional scores
 *     interleave from 0.03 to 0.10, so neither edge is a bet on new scenarios and the band stays.
 *     0.06 and 0.10 score 85 and 83.
 *   With TAU 0 the final is v3's contender `d4-lin` in effect. The weighting fix is required (top is
 *     barred) and costs nothing measurable on fresh material; the gate fix bought nothing measurable.
 *
 * docs/jev.md rules the final leans on: 1 and 2 (one literal one-sided statement per noul; up and down
 * asked apart), 4 (no importance reaches Jev, as a number or a word), 5 (code sums and weighs), 6
 * (nouls used as probabilities, strength only by its most probable level, never its expectation), 8
 * (yes always means the statement holds), 9 (up and down never read as each other's negation; reverie's
 * 0.80 touches threshold is not carried over, TAU is measured here), composite scoring (weights held in
 * code), chaining (strength asked only after the gate), and Thresholds (band and TAU from blind labels).
 * Rules it bends, all inherited with v3's questions, which B may not change:
 *   - 7, small state: identity and history go to all 41 nouls in one state, including ones that need
 *     neither (one request is the cost argument; v3's author kept five named fields).
 *   - 1, one judgment: the touches noul lists four things (safety, secrets, people, wants) in one
 *     question; it is reverie's measured wording, kept.
  *   - "Gate first": the touches noul gates softly (a multiplier), not as a hard threshold, by the
 *     measurement above.
 *
 * Contenders (same questions, same ask; only the score differs):
 *   `lin-g22`  linear, hard gate TAU 0.22, x touches, band 0.05 (the gate fix at its best).
 *   `sq`       w = imp^2, TAU 0, x touches, band 0.05 (v3's best rho).
 *   `lin1`     w = max(0, imp - 1), TAU 0, x touches, band 0.05 (best pooled M5; zeroes only "matters
 *              a little").
 *   `lin-g20-flat` linear, TAU 0.20, touches does not multiply, band 0.02 (the unmultiplied gate).
 *
 * Not a bend but a limit: no question asks what the act shows about the other's character as the
 * holder would read it; the deed nouls ask about the act (rule 3) and the weighting carries the rest.
 * That is the gap the C arm's congruence channel tests.
 *
 * All wording is v3's, per value or per channel. No question, weight or threshold names or
 * special-cases a case, scenario or variant; cases are named above only as evidence.
 */
import o2 from "../../value-weighting-3/arms/o2.ts";
import type { Answer } from "../../value-weighting-3/jev3.ts";
import type { ArmModule, Bag, Catalogue, Importance, O2Variant } from "../contract.ts";

const d4 = o2.variants.find((v) => v.id === "d4-lin");
if (!d4) throw new Error("v3 O2 has no d4-lin variant");
/** v3's d4 ask: the gate request of 41 nouls, then the chained strength request. */
const ask = d4.ask;

const noulOf = (a: Answer | undefined) => (a?.type === "noul" ? a.noul : 0);
/** Strength by its most probable level only (rule 6). */
const LEVEL = [1, 2, 3];
const levelOf = (a: Answer | undefined) => (a?.type === "score" ? (LEVEL[a.level] ?? 1) : 1);

const CHANNELS = ["stake", "deed"] as const;
const DIRS = ["up", "down"] as const;

type Weigh = (imp: number) => number;
const linear: Weigh = (i) => i;
const square: Weigh = (i) => i * i;
const linMinus1: Weigh = (i) => Math.max(0, i - 1);

/**
 * `tau`: the score is 0 when P(touches) is under it. `multiply`: whether P(touches) scales the score
 * above it. The rest is v3's d4 effect and weighted mean.
 */
function scoreOf(w: Weigh, tau: number, multiply: boolean) {
  return (bag: Bag, imp: Importance, catalogue: Catalogue): number => {
    const touches = noulOf(bag.gate?.touches);
    if (touches < tau) return 0;
    let num = 0;
    let den = 0;
    for (const v of catalogue.values) {
      const wi = w(imp[v.id] ?? 0);
      if (!wi) continue;
      den += wi;
      let effect = 0;
      for (const ch of CHANNELS)
        for (const d of DIRS) {
          const k = `${ch}__${v.id}__${d}`;
          effect += (d === "up" ? 1 : -1) * noulOf(bag.gate?.[k]) * levelOf(bag.how?.[k]);
        }
      num += wi * effect;
    }
    if (den === 0) return 0;
    return ((multiply ? touches : 1) * num) / den;
  };
}

const variants: O2Variant[] = [
  { id: "lin", ask, score: scoreOf(linear, 0, true), band: 0.05 },
  { id: "lin-g22", ask, score: scoreOf(linear, 0.22, true), band: 0.05 },
  { id: "sq", ask, score: scoreOf(square, 0, true), band: 0.05 },
  { id: "lin1", ask, score: scoreOf(linMinus1, 0, true), band: 0.05 },
  { id: "lin-g20-flat", ask, score: scoreOf(linear, 0.2, false), band: 0.02 },
];

const b: ArmModule = {
  arm: "B",
  variants,
  final: "lin",
  contenders: ["lin-g22", "sq", "lin1", "lin-g20-flat"],
};
export default b;
