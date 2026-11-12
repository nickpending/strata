/**
 * What an arm module (arms/a.ts, arms/b.ts, arms/c.ts) exports. Read docs/jev.md before writing any question.
 *
 * The experiment isolates one stage of design B: per value and per channel, does the encounter touch the value for
 * the holder, and which way. An arm sees the built case and the catalogue, never a label and never an importance.
 * Per case it returns one reading per item (`itemKey`, all 20): a number in [-1, 1] whose sign is the direction (up
 * positive) and whose absolute value is how clearly the item fired. Code computes it from Jev answers: a noul may be
 * used as a probability; a score or choice is read by its most probable level or option only (docs/jev.md rule 6).
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

/** One Jev request. `step` names it in the log and must be unique per judgment. */
export type Jev = (
  step: string,
  state: JevState,
  questions: Record<string, JevQuestion>,
) => Promise<Record<string, JevAnswer>>;

export type Variant = {
  id: string;
  /** Per item (itemKey for both channels and every catalogue value), a reading in [-1, 1]. */
  judge: (c: BuiltCase, values: Value[], jev: Jev) => Promise<Record<string, number>>;
};

/** `contenders`: up to 3 non-final variant ids for the secondary held-out run, which never decides. */
export type ArmModule = { arm: "A" | "B" | "C"; variants: Variant[]; final: string; contenders: string[] };

/** A noul answer's probability; throws on any other answer, so a wrong question type cannot read as 0. */
export function noul(a: JevAnswer | undefined): number {
  if (!a || !("noul" in a)) throw new Error("not a noul answer");
  return a.noul;
}
