/**
 * Arm B (jev-statements): design B's per-value stage as shipped, gate-first-e2e's `arms/b.ts` `as-is` judge
 * imported unchanged (its port verified there by `check-b.ts` against v4's logs; jev-state reused it the same way).
 * Scored linear as `B` and squared as `B-sq`, from the same judgments.
 *
 * Statements: gate-direction's `statement` (v3's 40, character for character). `check-ask.ts` shows that
 * `judgeWith(statement)` in `../ask.ts`, the ask arm W runs with its own table, sends exactly these requests.
 */
import g from "../../gate-first-e2e/arms/b.ts";
import { statementB } from "../ask.ts";
import type { StatementArmModule } from "../contract.ts";

const asIs = g.variants.find((v) => v.id === "as-is");
if (!asIs) throw new Error("gate-first-e2e arm B has no as-is variant");
const arm: StatementArmModule = {
  arm: "B",
  variants: [{ id: "as-is", statement: statementB, judge: asIs.judge }],
  final: "as-is",
  contenders: [],
};
export default arm;
