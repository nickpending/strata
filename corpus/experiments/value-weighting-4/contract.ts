/**
 * What an arm module (arms/b.ts, arms/c.ts, optionally arms/c2.ts) exports. Every arm is code-applied
 * importance (value-weighting-3's O2): Jev never sees an importance, and only `score` reads them, so
 * each variant is value-weighting-3's `O2Variant`, unchanged. `arm` names which module this is.
 */
import type { O2Variant } from "../value-weighting-3/contract.ts";

export type { Bag, Catalogue, Importance, Jev, O2Variant } from "../value-weighting-3/contract.ts";

/** `contenders`: up to 4 non-final variant ids for the secondary held-out run, which never decides. */
export type ArmModule = { arm: "B" | "C" | "C2"; variants: O2Variant[]; final: string; contenders: string[] };
