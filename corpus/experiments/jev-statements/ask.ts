/**
 * Design B's per-value stage with its statement table as the only parameter. `judgeWith(statement)` is
 * gate-first-e2e's `arms/b.ts` `judge` with `statement` passed in rather than imported; `judgeWith` of
 * gate-direction's `statement` sends B's requests exactly (`check-ask.ts`, against B on a stub Jev).
 *
 * Kept from B, imported rather than retyped:
 *   - the state, `stateOf` (`../gate-direction/arms/a.ts`): `{you, who_you_are, earlier, now, your_part}`;
 *   - the preamble, `READ`, before every statement;
 *   - the touches noul, `TOUCHES`, unchanged;
 *   - the size step: for every statement whose noul reached 0.4, B's 3-level strength score. Its question is
 *     B's `strength4` for the same key with B's quoted statement swapped for this table's, so the levels and every
 *     other word are B's;
 *   - the readings: r = P(up) − P(down); effect = P(up)·L(up) − P(down)·L(down), `levelOf`; touches = P(touches).
 */
import { READ, statement as statementB, stateOf } from "../gate-direction/arms/a.ts";
import { key4, levelOf, strength4, TOUCHES } from "../gate-first-e2e/arms/b.ts";
import type { Dir, Jev, JevQuestion, Judged, Statement, TypedCase, Value } from "./contract.ts";
import { CHANNELS, itemKey, noul } from "./contract.ts";

type Channel = (typeof CHANNELS)[number];
const DIRS: Dir[] = ["up", "down"];
/** B's `ASK_STRENGTH_FROM` (gate-first-e2e `arms/b.ts`, not exported there); `check-ask.ts` exercises it. */
const ASK_STRENGTH_FROM = 0.4;

/** B's strength question for the key, with B's quoted statement replaced by `st`'s. */
export function strengthWith(st: Statement, id: string, o: string, ch: Channel, d: Dir): JevQuestion {
  const ref = strength4(id, o, ch, d);
  const ins = ref.instructions as string;
  const from = `Asked: "${statementB(id, o, ch, d)}"`;
  const at = ins.indexOf(from);
  if (at < 0 || ins.indexOf(from, at + 1) >= 0) throw new Error(`strength4 ${key4(ch, id, d)}: statement not found once`);
  return { ...ref, instructions: `${ins.slice(0, at)}Asked: "${st(id, o, ch, d)}"${ins.slice(at + from.length)}` };
}

export function judgeWith(st: Statement) {
  return async function judge(c: TypedCase, values: Value[], jev: Jev): Promise<Judged> {
    const s = stateOf(c);
    const o = c.other.name;
    const gates: Record<string, JevQuestion> = {};
    for (const ch of CHANNELS)
      for (const v of values)
        for (const d of DIRS) gates[key4(ch, v.id, d)] = { type: "noul", instructions: `${READ} ${st(v.id, o, ch, d)}` };
    gates.touches = TOUCHES;
    const gate = await jev("gate", s, gates);
    const how: Record<string, JevQuestion> = {};
    for (const ch of CHANNELS)
      for (const v of values)
        for (const d of DIRS) {
          const k = key4(ch, v.id, d);
          if (noul(gate[k]) >= ASK_STRENGTH_FROM) how[k] = strengthWith(st, v.id, o, ch, d);
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
  };
}

export { statementB };
