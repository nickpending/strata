/**
 * Arm B (jev-state): design B's per-value stage as shipped, gate-first-e2e's `arms/b.ts` imported unchanged
 * (verified there by `check-b.ts` against v4's logged requests). Its judge reads only the BuiltCase fields a
 * TypedCase carries unchanged (`check-build.ts`), so it sends exactly gate-first-e2e's B requests.
 *
 * State (every request): `{you, who_you_are, earlier, now, your_part}`, `../../gate-direction/arms/a.ts` `stateOf`.
 */
import g from "../../gate-first-e2e/arms/b.ts";
import type { StateArmModule } from "../contract.ts";

const asIs = g.variants.find((v) => v.id === "as-is");
if (!asIs) throw new Error("gate-first-e2e arm B has no as-is variant");
const arm: StateArmModule = { arm: "B", variants: [{ id: "as-is", judge: asIs.judge }], final: "as-is", contenders: [] };
export default arm;
