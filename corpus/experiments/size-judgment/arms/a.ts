/**
 * Arm A (size-judgment): the baseline, as is. Design B's `how` question for a stake statement, copied character for
 * character from `../../value-weighting-3/arms/o2.ts` (its helpers are not exported): `stateOf`, `READ`, the
 * per-value `S[value](other).stake[direction]` statements and `STAKE_LEVELS`.
 *
 * FINAL `as-is`, the only variant.
 *   State (one request per case): `you` the holder's name; `who_you_are` the identity text; `earlier` the holder's
 *     own earlier copies in the scenario, one line each, oldest first ("(nothing yet)" when there are none); `now`
 *     the encounter as the holder received it; `your_part` "{other} did this with you directly." or "You saw this;
 *     it was not aimed at you.".
 *   Questions: one score per given item, all of a case's items in the one request:
 *     `${READ} Asked: "<S[value](other).stake[direction]>" If so, how big is it?`
 *     levels "Slight: small or passing." / "Clear: real, something you would notice and remember." / "Big: large or
 *     lasting, about as much as one moment could do.".
 *   Reading: the most probable level only (contract.ts `mostProbable`, rule 6).
 *   toLabel [2, 3, 4]: chosen on dev by exact-or-adjacent (the only metric it moves). Each of A's three levels holds
 *     a wide spread of sizes on dev (Clear holds 1s through 4s), so the middle mapping keeps most items within one:
 *     [2, 3, 4] 0.88 (exact 0.33), tied by [2, 2, 4] 0.88 (exact 0.38), against [1, 2, 4] 0.84, [1, 2, 3] 0.81,
 *     [2, 3, 5] 0.73 and [1, 3, 5] 0.70. [2, 3, 4] is kept over [2, 2, 4] because it gives each level its own size.
 *   Dev: pooled rho 0.56 (up 0.63, down 0.46), 6/6 pairs ordered.
 *
 * docs/jev.md rules it leans on: 1 and 2 (one literal stake statement per question), 4 (no importance reaches Jev),
 * 6 (most probable level only), 7 (five named fields, the ones the question names), batching (a case's items in one
 * request). Rules it bends, inherited and not changeable here:
 *   - 2, literal reading: "If so" makes the size conditional on the statement, which Jev may read as doubt about the
 *     direction rather than the size; the direction is given here, but A keeps its wording.
 *   - 7, small state: identity and history go to every question, as in v3 and v4.
 *   - The three levels are generic, not concrete situations; "Big" is capped at "as much as one moment could do".
 *
 * No contenders: the brief allows one variant only.
 */
import type { ArmModule, BuiltCase, Item, Jev, JevQuestion, JevState, Value, Variant } from "../contract.ts";
import { itemKey, mostProbable } from "../contract.ts";

// ---------- copied verbatim from ../../value-weighting-3/arms/o2.ts ----------

function stateOf(c: BuiltCase): JevState {
  return {
    you: c.holder.name,
    who_you_are: c.identity,
    earlier: c.history.length ? c.history.map((h) => h.text) : ["(nothing yet)"],
    now: c.event,
    your_part:
      c.role === "direct" ? `${c.other.name} did this with you directly.` : `You saw this; it was not aimed at you.`,
  };
}

const READ =
  "`now` is the latest thing that happened. Take it together with what was said just before it in `earlier`, and read it from your side (`you`, `who_you_are`, `your_part`).";

type Dir = "up" | "down";
/** The stake half of v3's per-value statements (the deed half is not tested here). */
const S: Record<string, (o: string) => { stake: Record<Dir, string> }> = {
  self_direction: (o) => ({
    stake: {
      up: `Does what ${o} did give you more say over what you do, who you see or how you live?`,
      down: `Does what ${o} did take a choice out of your hands: ${o} or someone else deciding what you do, who you see or how you live?`,
    },
  }),
  stimulation: (o) => ({
    stake: {
      up: `Does what ${o} did bring excitement, risk, novelty or a challenge into your life?`,
      down: `Does what ${o} did take excitement, novelty or challenge out of your life?`,
    },
  }),
  hedonism: (o) => ({
    stake: {
      up: `Does what ${o} did bring you pleasure, fun or comfort?`,
      down: `Does what ${o} did take pleasure, fun or comfort away from you?`,
    },
  }),
  achievement: (o) => ({
    stake: {
      up: `Does what ${o} did help your success: your work or business, getting ahead, or how others rate what you can do?`,
      down: `Does what ${o} did hurt your success: your work or business, getting ahead, or how others rate what you can do?`,
    },
  }),
  power: (o) => ({
    stake: {
      up: `Does what ${o} did bring you money, possessions, standing, or more control over people or things?`,
      down: `Does what ${o} did cost you money, possessions, standing or control, such as by defying you, belittling you or taking from you?`,
    },
  }),
  security: (o) => ({
    stake: {
      up: `Does what ${o} did make you safer, or keep danger or trouble away from you?`,
      down: `Does what ${o} did bring danger, trouble or upheaval closer to you?`,
    },
  }),
  conformity: (o) => ({
    stake: {
      up: `Does what ${o} did back you in keeping to the rules or to what is expected of you?`,
      down: `Does what ${o} did push you to break a rule or go against what is expected of you?`,
    },
  }),
  tradition: (o) => ({
    stake: {
      up: `Does what ${o} did honour a custom or tradition you hold to?`,
      down: `Does what ${o} did pull you away from a custom, a tradition or the way you have always done things?`,
    },
  }),
  benevolence: (o) => ({
    stake: {
      up: `Does what ${o} did help someone close to you: a friend, someone who relies on you, or someone you rely on?`,
      down: `Does what ${o} did harm someone close to you: a friend, someone who relies on you, or someone you rely on?`,
    },
  }),
  universalism: (o) => ({
    stake: {
      up: `Does what ${o} did protect or help people beyond your own circle: strangers, the weak, many people?`,
      down: `Does what ${o} did harm people beyond your own circle: strangers, the weak, many people?`,
    },
  }),
};

const STAKE_LEVELS = [
  "Slight: small or passing.",
  "Clear: real, something you would notice and remember.",
  "Big: large or lasting, about as much as one moment could do.",
];

function strength(id: string, o: string, d: Dir): JevQuestion {
  const f = S[id];
  if (!f) throw new Error(`no wording for ${id}`);
  const st = f(o).stake[d];
  return { type: "score", instructions: `${READ} Asked: "${st}" If so, how big is it?`, criteria: STAKE_LEVELS };
}

// ---------- the arm ----------

async function judge(c: BuiltCase, items: Item[], _values: Value[], jev: Jev): Promise<Record<string, number>> {
  const qs: Record<string, JevQuestion> = {};
  for (const i of items) qs[itemKey(i)] = strength(i.value, c.other.name, i.direction);
  const a = await jev("how", stateOf(c), qs);
  const out: Record<string, number> = {};
  for (const i of items) out[itemKey(i)] = mostProbable(a[itemKey(i)]);
  return out;
}

const variants: Variant[] = [{ id: "as-is", levels: 3, toLabel: [2, 3, 4], judge }];

const a: ArmModule = { arm: "A", variants, final: "as-is", contenders: [] };
export default a;
