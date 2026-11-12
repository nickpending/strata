/**
 * Arm B (gate-first-e2e): design B's per-value stage as shipped, v4's B `lin` ask. One variant, `as-is`, final, no
 * contenders. Scored with the contract's combine as `B-lin` (linear) and, secondary, `B-sq`.
 *
 * A port, not a rewrite. v4's B imports v3's `d4` ask (`../../value-weighting-3/arms/o2.ts`), which runs on v3's
 * own Jev client (`jev3.ts`, whose answers carry a `type` and a derived `level`). This experiment uses
 * `harness/src/jev.ts` `decide`, as gate-direction and size-judgment did, so the ask is re-expressed on it:
 *   - `stateOf`, `READ` and `statement` are imported from `../../gate-direction/arms/a.ts`, whose header records
 *     them as o2.ts's lines copied, not retyped, and checked against v4's logged gate requests;
 *   - `TOUCHES`, `STAKE_LEVELS`, `DEED_LEVELS`, the two `how` instruction forms and `ASK_STRENGTH_FROM` are copied
 *     from o2.ts (its `TOUCHES`, `STAKE_LEVELS`, `DEED_LEVELS`, `strength4`, `ASK_STRENGTH_FROM`);
 *   - the level is the most probable one with ties to the lower (contract `mostProbable`), as jev3.ts derives it.
 * `check-b.ts` verifies the port before any label exists: every question text against v4's logged requests, and the
 * combine against v4's logged B `lin` scores recomputed from v4's logged answers.
 *
 * State (every request): v3's five fields, `you`, `who_you_are`, `earlier`, `now`, `your_part`.
 * Step `gate`, one request, 41 nouls: per value, channel and direction, `${READ} ${statement}`; plus `touches`.
 * Step `how`, chained: for every statement whose noul reached 0.4, a 3-level strength score.
 * Reading per item: r = P(up) - P(down) (gate-direction's A reading); effect = P(up) * L(up) - P(down) * L(down),
 *   L = 1, 2, 3 by the strength's most probable level, 1 when none was asked (v4 B `scoreOf`).
 */
import { READ, statement, stateOf } from "../../gate-direction/arms/a.ts";
import type { ArmModule, BuiltCase, Jev, JevAnswer, JevQuestion, Judged, Value } from "../contract.ts";
import { CHANNELS, itemKey, mostProbable, noul } from "../contract.ts";

type Channel = (typeof CHANNELS)[number];
type Dir = "up" | "down";
const DIRS: Dir[] = ["up", "down"];

// ---------- copied from ../../value-weighting-3/arms/o2.ts ----------

const STAKE_LEVELS = [
  "Slight: small or passing.",
  "Clear: real, something you would notice and remember.",
  "Big: large or lasting, about as much as one moment could do.",
];
const DEED_LEVELS = [
  "Faintly: it only hints at it.",
  "Clearly: it plainly shows it.",
  "Strongly: a bold or costly act that shows it beyond doubt.",
];

function strength4(id: string, o: string, ch: Channel, d: Dir): JevQuestion {
  const st = statement(id, o, ch, d);
  return ch === "stake"
    ? { type: "score", instructions: `${READ} Asked: "${st}" If so, how big is it?`, criteria: STAKE_LEVELS }
    : {
        type: "score",
        instructions: `${READ} Asked: "${st}" If so, how plainly does \`now\` show it?`,
        criteria: DEED_LEVELS,
      };
}

const TOUCHES: JevQuestion = {
  type: "noul",
  instructions:
    "Does what just happened (`now`, after `earlier`) touch you (`you`) personally: your safety, your secrets, your people, or something you want?",
};

const ASK_STRENGTH_FROM = 0.4;

// ---------- end of copy ----------

const key4 = (ch: Channel, id: string, d: Dir) => `${ch}__${id}__${d}`;
const LEVEL = [1, 2, 3];
const levelOf = (a: JevAnswer | undefined) => (a === undefined ? 1 : (LEVEL[mostProbable(a)] ?? 1));

/** For arm G and C: v3's strength question, the touches noul and the level reading, shared so the size step and the combine's touches are the same in every arm. */
export { strength4, TOUCHES, levelOf, key4 };

async function judge(c: BuiltCase, values: Value[], jev: Jev): Promise<Judged> {
  const s = stateOf(c);
  const o = c.other.name;
  const gates: Record<string, JevQuestion> = {};
  for (const ch of CHANNELS)
    for (const v of values)
      for (const d of DIRS)
        gates[key4(ch, v.id, d)] = { type: "noul", instructions: `${READ} ${statement(v.id, o, ch, d)}` };
  gates.touches = TOUCHES;
  const gate = await jev("gate", s, gates);
  const how: Record<string, JevQuestion> = {};
  for (const ch of CHANNELS)
    for (const v of values)
      for (const d of DIRS) {
        const k = key4(ch, v.id, d);
        if (noul(gate[k]) >= ASK_STRENGTH_FROM) how[k] = strength4(v.id, o, ch, d);
      }
  const h = Object.keys(how).length ? await jev("how", s, how) : {};
  const items: Judged["items"] = {};
  for (const ch of CHANNELS)
    for (const v of values) {
      const up = noul(gate[key4(ch, v.id, "up")]);
      const down = noul(gate[key4(ch, v.id, "down")]);
      items[itemKey(ch, v.id)] = {
        r: up - down,
        effect: up * levelOf(h[key4(ch, v.id, "up")]) - down * levelOf(h[key4(ch, v.id, "down")]),
      };
    }
  return { items, touches: noul(gate.touches) };
}

const arm: ArmModule = { arm: "B", variants: [{ id: "as-is", judge }], final: "as-is", contenders: [] };
export default arm;
