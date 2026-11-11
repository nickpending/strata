/**
 * What an arm module (arms/a.ts, arms/b.ts, arms/c.ts, optionally arms/d.ts) exports, and the one rule every arm
 * reads a score by. Read docs/jev.md before writing any question.
 *
 * The experiment isolates one judgment: given the value an encounter touched for its holder and which way it moved
 * it (both given, labelled), how far did it move it, from the holder's side. An arm sees the case and the given
 * items, never an importance and never a label. For each item it returns one level index of a score question it
 * asked, read by that answer's most probable level only (docs/jev.md rule 6; `mostProbable` below). `toLabel` maps
 * each level onto the labellers' 1 to 5 size scale; it is fixed per variant at the freeze and used only by the
 * scorer's exact-or-adjacent metric, never by the rank metrics.
 */
import type { BuiltCase } from "./build.ts";
import type { JevAnswer, JevQuestion, JevState, ScoreAnswer } from "../../../harness/src/jev.ts";

export type { BuiltCase };
export type { JevAnswer, JevQuestion, JevState, ScoreAnswer };

/** One given: the value the encounter touched for the holder, and the direction (up advances it, down sets it back). */
export type Item = { value: string; direction: "up" | "down" };
export const itemKey = (i: Item) => `${i.value}__${i.direction}`;

/** The world's catalogue (world/values.toml), in file order. */
export type Value = { id: string; description: string };

/** One Jev request. `step` names it in the log and must be unique per judgment. */
export type Jev = (step: string, state: JevState, questions: Record<string, JevQuestion>) => Promise<Record<string, JevAnswer>>;

export type Variant = {
  id: string;
  /** How many levels the variant's final reading has (2 to 10). */
  levels: number;
  /** Per level, lowest first, the 1 to 5 size it stands for; nondecreasing; length `levels`. */
  toLabel: number[];
  /** Per item (by itemKey), a level index 0..levels-1, each the most probable level of a score answer. */
  judge: (c: BuiltCase, items: Item[], values: Value[], jev: Jev) => Promise<Record<string, number>>;
};

/** `contenders`: up to 3 non-final variant ids for the secondary held-out run, which never decides. */
export type ArmModule = { arm: "A" | "B" | "C" | "D"; variants: Variant[]; final: string; contenders: string[] };

/** The most probable level of a score answer (rule 6). Ties go to the lower level. Throws on a non-score answer. */
export function mostProbable(a: JevAnswer | undefined): number {
  if (!a || !("probabilities" in a) || !("legend" in a)) throw new Error("not a score answer");
  const p = (a as ScoreAnswer).probabilities;
  let best = 0;
  for (let i = 1; p[String(i)] !== undefined; i++) if ((p[String(i)] ?? 0) > (p[String(best)] ?? 0)) best = i;
  return best;
}
