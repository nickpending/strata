/**
 * What an arm module (arms/o1.ts, arms/o2.ts) exports. The type keeps the arms honest: O1's state
 * receives the holder's importances, because Jev applies them; O2's state never does, and only its
 * score, which is code, reads them.
 */
import type { JevAnswer, JevQuestion } from "../../../harness/src/jev.ts";
import type { BuiltCase } from "./build.ts";

/** Value id to importance, 0 to 4. */
export type Importance = Record<string, number>;
export type Answers = Record<string, JevAnswer>;

export type O1Variant = {
  id: string;
  state: (c: BuiltCase, importance: Importance) => string;
  questions: (c: BuiltCase) => Record<string, JevQuestion>;
  /** Signed: above zero builds, below detracts. */
  score: (answers: Answers) => number;
  /** |score| under this reads as neutral. */
  band: number;
};

export type O2Variant = {
  id: string;
  state: (c: BuiltCase) => string;
  questions: (c: BuiltCase) => Record<string, JevQuestion>;
  score: (answers: Answers, importance: Importance) => number;
  band: number;
};

export type O1Module = { arm: "O1"; variants: O1Variant[]; final: string };
export type O2Module = { arm: "O2"; variants: O2Variant[]; final: string };
export type ArmModule = O1Module | O2Module;
