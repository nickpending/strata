/**
 * What an arm module of jev-statements exports. gate-first-e2e's contract (`../gate-first-e2e/contract.ts`),
 * unchanged (its combine with `lin` and `sq`, readings, item keys, `noul`, `mostProbable`), re-exported through
 * jev-state's (`../jev-state/contract.ts`, whose judge takes a `TypedCase`, a superset of the `BuiltCase` B reads).
 *
 * Arms: B (design B's per-value stage as shipped) and W (B with its 40 statements rewritten). The single step that
 * differs between them is the statement table; `ask.ts` is the one ask both run. Squared weighting is not an arm
 * module: B-sq and W-sq are B's and W's logged judgments read through the contract's `combine(..., "sq")`.
 */
import type { Channel, TypedCase } from "../jev-state/contract.ts";
import type { Jev, Judged, Value } from "../jev-state/contract.ts";

export * from "../jev-state/contract.ts";

export type Dir = "up" | "down";
/** One statement per value, channel and direction, with the other's display name put in. */
export type Statement = (value: string, other: string, ch: Channel, d: Dir) => string;

export type StatementVariant = {
  id: string;
  /** The statement table this variant asks; `check-arms.ts` reads it. */
  statement: Statement;
  judge: (c: TypedCase, values: Value[], jev: Jev) => Promise<Judged>;
};

/** `contenders`: at most 1 non-final variant id for the secondary held-out run, which never decides. */
export type StatementArmModule = { arm: "B" | "W"; variants: StatementVariant[]; final: string; contenders: string[] };
