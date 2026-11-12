/**
 * What an arm module (arms/b.ts, arms/g.ts, optionally arms/c.ts) exports, and design B's combine, which every arm
 * shares. Read docs/jev.md before writing any question.
 *
 * Design B splits a relationship judgment into a per-value stage (Jev) and a combine (code). An arm owns only the
 * per-value stage. It sees the built case and the catalogue, never a label and never an importance. Per case it
 * returns, for each item (`itemKey`: both channels, every catalogue value), two numbers:
 *   - `r` in [-1, 1]: the item's reading for the per-value metrics. Its sign is the direction (up positive) and its
 *     absolute value is how clearly the item fired.
 *   - `effect` in [-3, 3]: what the item adds to the case sum, a probability times a size level (1, 2 or 3, the
 *     size step's most probable level; docs/jev.md rule 6), signed by direction.
 * and `touches`, P(touches) from reverie's touches noul, which the combine multiplies by.
 *
 * The combine is fixed here, not in an arm (`combine`): design B's, as v4's B `lin` computes it
 * (`../value-weighting-4/arms/b.ts`, `scoreOf`):
 *   score = touches * sum_v w(imp_v) * (effect(stake, v) + effect(deed, v)) / sum_v w(imp_v)
 * with w linear (`lin`) or squared (`sq`). Importance enters only here.
 *
 * Channels: `stake`, the encounter advanced (up) or set back (down) the holder's own share of the value; `deed`, the
 * other, in this act, acted for (up) or against (down) the value.
 */
import type { JevAnswer, JevQuestion, JevState } from "../../../harness/src/jev.ts";
import type { BuiltCase } from "../size-judgment/build.ts";

export type { BuiltCase, JevAnswer, JevQuestion, JevState };

export const CHANNELS = ["stake", "deed"] as const;
export type Channel = (typeof CHANNELS)[number];
export const itemKey = (ch: Channel, value: string) => `${ch}__${value}`;

/** The world's catalogue (world/values.toml), in file order. */
export type Value = { id: string; description: string };
/** Value id to importance, 0 to 4. */
export type Importance = Record<string, number>;

/** One Jev request. `step` names it in the log and must be unique per judgment. */
export type Jev = (
  step: string,
  state: JevState,
  questions: Record<string, JevQuestion>,
) => Promise<Record<string, JevAnswer>>;

export type Reading = { r: number; effect: number };
export type Judged = { items: Record<string, Reading>; touches: number };

export type Variant = {
  id: string;
  judge: (c: BuiltCase, values: Value[], jev: Jev) => Promise<Judged>;
};

/** `contenders`: up to 3 non-final variant ids for the secondary held-out run, which never decides. */
export type ArmModule = { arm: "B" | "G" | "C"; variants: Variant[]; final: string; contenders: string[] };

export type Weighting = "lin" | "sq";
export const WEIGH: Record<Weighting, (imp: number) => number> = { lin: (i) => i, sq: (i) => i * i };

/** Design B's combine (v4 B `scoreOf` with tau 0, multiplied by touches). Signed: above 0 builds, below detracts. */
export function combine(j: Judged, imp: Importance, values: Value[], w: Weighting): number {
  let num = 0;
  let den = 0;
  for (const v of values) {
    const wi = WEIGH[w](imp[v.id] ?? 0);
    if (!wi) continue;
    den += wi;
    for (const ch of CHANNELS) num += wi * (j.items[itemKey(ch, v.id)]?.effect ?? 0);
  }
  return den === 0 ? 0 : (j.touches * num) / den;
}

/** A noul answer's probability; throws on any other answer, so a wrong question type cannot read as 0. */
export function noul(a: JevAnswer | undefined): number {
  if (!a || !("noul" in a)) throw new Error("not a noul answer");
  return a.noul;
}

/** The most probable level index of a score answer (rule 6). Ties go to the lower level. Throws on a non-score answer. */
export function mostProbable(a: JevAnswer | undefined): number {
  if (!a || !("probabilities" in a) || !("legend" in a)) throw new Error("not a score answer");
  const p = a.probabilities;
  let best = 0;
  for (let i = 1; p[String(i)] !== undefined; i++) if ((p[String(i)] ?? 0) > (p[String(best)] ?? 0)) best = i;
  return best;
}
