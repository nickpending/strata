/**
 * What an arm module of jev-state exports. gate-first-e2e's contract (`../gate-first-e2e/contract.ts`), unchanged
 * (its combine, readings, item keys, `noul` and `mostProbable`), with two differences: an arm's `judge` receives a
 * `TypedCase` (`./build.ts`: the BuiltCase every earlier arm read, plus the holder's typed engine copies, known
 * facts as of the target, encounters and the world's names), and the arm ids are this experiment's.
 *
 * Arms: B (design B's per-value stage as shipped, gate-first-e2e's `arms/b.ts`), S (state-structured), F
 * (state-filtered), K (optional: state plus the holder's known facts). The questions are fixed (prereg "Arms");
 * an arm owns only the state it sends and how its instructions name that state's fields.
 */
import type { TypedCase } from "./build.ts";
import type { Jev, Judged, Value } from "../gate-first-e2e/contract.ts";

export * from "../gate-first-e2e/contract.ts";
export type { TypedCase };

export type StateVariant = {
  id: string;
  judge: (c: TypedCase, values: Value[], jev: Jev) => Promise<Judged>;
};

/** `contenders`: at most 1 non-final variant id for the secondary held-out run, which never decides. */
export type StateArmModule = { arm: "B" | "S" | "F" | "K"; variants: StateVariant[]; final: string; contenders: string[] };
