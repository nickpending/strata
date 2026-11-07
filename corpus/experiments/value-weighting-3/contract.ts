/**
 * What an arm module (arms/o1.ts, arms/o2.ts) exports. A judgment may take several Jev requests,
 * each a named step whose state can carry earlier answers (docs/jev.md, "Chaining"); the runner
 * logs every request. The types keep the arms apart:
 * - O1's `ask` receives the holder's importances, because Jev applies them. Code may turn them into
 *   named words in a state, and nothing else: no question asked, no step taken and no part of the
 *   score depends on an importance. O1's `score` never receives them.
 * - O2's `ask` never receives them. Only its `score`, which is code, reads them.
 */
import type { BuiltCase } from "../value-weighting-2/build.ts";
import type { Answers, Question, State } from "./jev3.ts";

/** Value id to importance, 0 to 4 (catalogue.json `importance_scale`). */
export type Importance = Record<string, number>;
export type Value = { id: string; description: string };
export type Catalogue = {
  importance_scale: Record<string, string>;
  values: Value[];
};

/** One Jev request. `step` names it in the log and keys its answers in the bag; it must be unique per judgment. */
export type Jev = (step: string, state: State, questions: Record<string, Question>) => Promise<Answers>;
/** Every step's answers, by step name. */
export type Bag = Record<string, Answers>;

export type O1Variant = {
  id: string;
  ask: (c: BuiltCase, importance: Importance, catalogue: Catalogue, jev: Jev) => Promise<Bag>;
  /** Signed: above zero builds, below detracts. */
  score: (bag: Bag) => number;
  /** |score| under this reads as neutral. */
  band: number;
};

export type O2Variant = {
  id: string;
  ask: (c: BuiltCase, catalogue: Catalogue, jev: Jev) => Promise<Bag>;
  score: (bag: Bag, importance: Importance, catalogue: Catalogue) => number;
  band: number;
};

/** `contenders`: up to 4 non-final variant ids for the secondary held-out run, which never decides. */
export type O1Module = { arm: "O1"; variants: O1Variant[]; final: string; contenders: string[] };
export type O2Module = { arm: "O2"; variants: O2Variant[]; final: string; contenders: string[] };
export type ArmModule = O1Module | O2Module;
