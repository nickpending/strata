/**
 * item-size's arms: how design B turns one item's logged Jev answers into an amount. Code only. Every arm reads the
 * same logged answers of one judgment (the `gate` request's 41 nouls and the `how` request's strength scores, as
 * jev-statements' `run.ts` logs them) and returns a `Judged` for the contract's `combine`, unchanged. No arm asks
 * Jev anything, and none sees a label or an importance.
 *
 * Per item (channel, value): P_up and P_down are the two direction nouls; L_up and L_down are the most probable level
 * (1, 2, 3; ties to the lower; 1 when not asked) of the strength score that B asks for a direction whose noul reached
 * 0.4 (`levelOf` and `ASK_STRENGTH_FROM` of gate-first-e2e's B, imported or restated, and checked by
 * `check-readings.ts` against the logged readings).
 *
 * The single step that differs between the arms is `effect`. `r` (P_up − P_down) and `touches` are B's in every arm.
 *   - B  : effect = P_up·L_up − P_down·L_down (design B as shipped: the noul's probability times the level).
 *   - X1 : fired when max(P_up, P_down) ≥ 0.4 (B's own threshold for asking the size), direction d = sign(P_up −
 *          P_down); effect = 2·d when fired, else 0. A fixed size; no probability multiplier.
 *   - X2 : fired and d as X1; effect = d·L_d, the most probable level of the winning direction's strength score.
 *          The level applies only once the gate says touched; probability never scales it.
 *   - X3 : X2 on stake items, X1 on deed items. The deed levels ("Faintly: it only hints at it", "Clearly: it plainly
 *          shows it", "Strongly: ... beyond doubt") grade how plainly `now` shows the act, which is a confidence, not
 *          a size; the stake levels ("Slight", "Clear", "Big") grade a size, and only they were tested in isolation
 *          (size-judgment).
 * X1's 2 is the labels-only bound's size (jev-statements `score.ts` `labelsOnly`); any constant gives the same ranks.
 */
import { key4, levelOf } from "../gate-first-e2e/arms/b.ts";
import type { Judged, JevAnswer, Value } from "../jev-statements/contract.ts";
import { CHANNELS, itemKey, noul } from "../jev-statements/contract.ts";

export const ARMS = ["B", "X1", "X2", "X3"] as const;
export type Arm = (typeof ARMS)[number];

/** gate-first-e2e B's `ASK_STRENGTH_FROM` (not exported there); `check-readings.ts` confirms every logged `how` asks exactly the keys at or above it. */
export const ASK_STRENGTH_FROM = 0.4;
const FIXED = 2;

type Channel = (typeof CHANNELS)[number];

export type LoggedRequest = { step: string; ok: boolean; answers?: Record<string, JevAnswer> };

/** The logged answers of one ok judgment, by step. Throws if `gate` is missing. */
export function answersOf(requests: LoggedRequest[]) {
  const gate = requests.find((r) => r.step === "gate")?.answers;
  if (!gate) throw new Error("no gate answers");
  const how = requests.find((r) => r.step === "how")?.answers ?? {};
  return { gate, how };
}

function sizeOf(arm: Exclude<Arm, "B">, ch: Channel, level: number): number {
  if (arm === "X1") return FIXED;
  if (arm === "X2") return level;
  return ch === "stake" ? level : FIXED;
}

/** One judgment's readings under `arm`, from its logged answers. */
export function readingsOf(arm: Arm, requests: LoggedRequest[], values: Value[]): Judged {
  const { gate, how } = answersOf(requests);
  const items: Judged["items"] = {};
  for (const ch of CHANNELS)
    for (const v of values) {
      const up = noul(gate[key4(ch, v.id, "up")]);
      const down = noul(gate[key4(ch, v.id, "down")]);
      const lUp = levelOf(how[key4(ch, v.id, "up")]);
      const lDown = levelOf(how[key4(ch, v.id, "down")]);
      let effect: number;
      if (arm === "B") effect = up * lUp - down * lDown;
      else if (Math.max(up, down) < ASK_STRENGTH_FROM || up === down) effect = 0;
      else {
        const d = up > down ? "up" : "down";
        if (how[key4(ch, v.id, d)] === undefined) throw new Error(`${key4(ch, v.id, d)} fired but has no strength answer`);
        effect = (d === "up" ? 1 : -1) * sizeOf(arm, ch, d === "up" ? lUp : lDown);
      }
      items[itemKey(ch, v.id)] = { r: up - down, effect };
    }
  return { items, touches: noul(gate.touches) };
}
