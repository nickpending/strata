/**
 * Arm B (size-judgment): five levels, each described as a concrete situation, the same for every value.
 *
 * FINAL `b5c-given`.
 *   State (one request per case): A's five fields, unchanged (v3's `stateOf`): `you`, `who_you_are`, `earlier`,
 *     `now`, `your_part`. The size of a move is read from the holder's situation, and that situation lives in
 *     `who_you_are` (debts, dependants, what they live on) and `earlier`, so nothing is dropped.
 *   Question: one score per given item, a case's items in one request:
 *     `${READ} <GIVEN[value](other)[direction]> How big a change is that for you?`
 *     GIVEN is v3's stake statement turned from a question into a statement of fact ("What {o} did brings danger,
 *     trouble or upheaval closer to you."): the direction is given, so nothing asks whether it holds.
 *   Levels (L5c): Trivial / Small / Moderate / Major / Life-changing, each a concrete situation with examples that
 *     span the values (a passing remark or token gift; a little money or a small compliment; real money, praise from
 *     someone whose word counts, danger brought nearer, a debt eased; a name made or broken where many hear, lasting
 *     say over your life, safety or home in serious danger; life, livelihood, home, freedom or closest bond on the
 *     line or made safe).
 *   Reading: the most probable level only (contract.ts `mostProbable`, rule 6).
 *   toLabel [1, 2, 3, 4, 5]: dev exact-or-adjacent 0.94 (exact 0.38), tied by [2, 2, 3, 4, 5]; the levels are
 *     written to the 1 to 5 scale, so the identity stays.
 *   Dev (4 reps over two runs): pooled rho 0.73 (every rep 0.73), up 0.88, down 0.51; 6/6 pairs.
 *
 * Each knob, with its dev lift (pooled Spearman; 32 items, 6 pairs; every variant held 6/6 pairs). Rerun noise on
 * dev is up to 0.05 for a variant whose levels move, so only lifts larger than that count:
 *   - Five concrete levels in place of A's three generic ones, A's question unchanged: 0.56 -> 0.67 (a first, narrow
 *     list of examples) and 0.69 (L5c, `b5c-asked`). Four concrete levels: 0.64 against five's 0.67 on the same
 *     wording (`b4-given`).
 *   - Top level "now on the line, or made safe from what threatened it" in place of "saved or lost on it": 0.67 ->
 *     0.69. Small, kept on rule 2: the labels' top size is life, livelihood, home or bond put on the line, and Jev
 *     would not pick a top level that demanded the loss had already happened.
 *   - Examples widened to span the values (L5c) in place of the narrow list: 0.69 -> 0.73 (given form); up-direction
 *     rho 0.77 -> 0.88.
 *   - Direction given as fact in place of A's "Asked: ... If so, how big is it?": 0.69 -> 0.73 with L5c; a tie (0.67
 *     both) with the narrow levels. Kept also on rule 2: "If so" invites Jev to fold doubt about the direction into
 *     the size.
 *   - Not kept: a stakes clause after the question ("Judge it by what rides on it for you, as `who_you_are` and
 *     `earlier` tell it."). With L5c, 0.74 against 0.73 over 4 reps, with a rep spread of 0.69 to 0.78. It lifts
 *     down-direction rho (0.51 -> 0.63) and costs up (0.88 -> 0.83): no pooled lift, so it is the contender
 *     `b5c-given-st`.
 *
 * docs/jev.md rules it leans on: 2 (a literal statement of the given direction; boundary cases in the levels), 4 (no
 * importance, as a number or a word), 6 (most probable level only), 8 (higher level always means bigger), batching
 * (a case's items in one request). Rules it bends:
 *   - 1, one snap judgment: size folds what is at stake for the holder with how far this moment moved it. Splitting
 *     them would need a code combination of two scores, which the contract's one-score reading bars, or a chain
 *     that hands Jev its own first answer (see the D note in c.ts). The level examples carry both at once.
 *   - 7, small state: identity and history go to every question, as in A; the size depends on both.
 *   - Long criteria: each level carries several examples. They name kinds of situation across the values, never a
 *     person, place or event of any scenario.
 *
 * Contenders:
 *   `b5c-given-st` the final plus the stakes clause (dev 0.74, up 0.83, down 0.63); toLabel [1, 2, 2, 3, 5], the
 *                  best dev exact-or-adjacent with Life-changing kept at 5 (0.94 against the identity's 0.92): with
 *                  the clause Jev reads the middle levels about a step high.
 *   `b5c-asked`    A's question verbatim with the final's levels: the level change alone (dev 0.69); toLabel
 *                  [2, 2, 3, 4, 5] (exact-or-adjacent 0.94 against the identity's 0.91).
 *   `b4-given`     four narrower levels, given form (dev 0.64); toLabel [2, 3, 4, 5].
 *
 * Wording is per value, per direction or per level. Nothing names or special-cases a dev case, scenario or fact.
 */
import type { ArmModule, BuiltCase, Item, Jev, JevQuestion, JevState, Value, Variant } from "../contract.ts";
import { itemKey, mostProbable } from "../contract.ts";

// ---------- state: A's five fields (v3's stateOf), unchanged ----------

export function stateOf(c: BuiltCase): JevState {
  return {
    you: c.holder.name,
    who_you_are: c.identity,
    earlier: c.history.length ? c.history.map((h) => h.text) : ["(nothing yet)"],
    now: c.event,
    your_part:
      c.role === "direct" ? `${c.other.name} did this with you directly.` : `You saw this; it was not aimed at you.`,
  };
}

export const READ =
  "`now` is the latest thing that happened. Take it together with what was said just before it in `earlier`, and read it from your side (`you`, `who_you_are`, `your_part`).";

export type Dir = "up" | "down";

/** v3's stake statements as questions (A's wording). */
export const ASKED: Record<string, (o: string) => Record<Dir, string>> = {
  self_direction: (o) => ({
    up: `Does what ${o} did give you more say over what you do, who you see or how you live?`,
    down: `Does what ${o} did take a choice out of your hands: ${o} or someone else deciding what you do, who you see or how you live?`,
  }),
  stimulation: (o) => ({
    up: `Does what ${o} did bring excitement, risk, novelty or a challenge into your life?`,
    down: `Does what ${o} did take excitement, novelty or challenge out of your life?`,
  }),
  hedonism: (o) => ({
    up: `Does what ${o} did bring you pleasure, fun or comfort?`,
    down: `Does what ${o} did take pleasure, fun or comfort away from you?`,
  }),
  achievement: (o) => ({
    up: `Does what ${o} did help your success: your work or business, getting ahead, or how others rate what you can do?`,
    down: `Does what ${o} did hurt your success: your work or business, getting ahead, or how others rate what you can do?`,
  }),
  power: (o) => ({
    up: `Does what ${o} did bring you money, possessions, standing, or more control over people or things?`,
    down: `Does what ${o} did cost you money, possessions, standing or control, such as by defying you, belittling you or taking from you?`,
  }),
  security: (o) => ({
    up: `Does what ${o} did make you safer, or keep danger or trouble away from you?`,
    down: `Does what ${o} did bring danger, trouble or upheaval closer to you?`,
  }),
  conformity: (o) => ({
    up: `Does what ${o} did back you in keeping to the rules or to what is expected of you?`,
    down: `Does what ${o} did push you to break a rule or go against what is expected of you?`,
  }),
  tradition: (o) => ({
    up: `Does what ${o} did honour a custom or tradition you hold to?`,
    down: `Does what ${o} did pull you away from a custom, a tradition or the way you have always done things?`,
  }),
  benevolence: (o) => ({
    up: `Does what ${o} did help someone close to you: a friend, someone who relies on you, or someone you rely on?`,
    down: `Does what ${o} did harm someone close to you: a friend, someone who relies on you, or someone you rely on?`,
  }),
  universalism: (o) => ({
    up: `Does what ${o} did protect or help people beyond your own circle: strangers, the weak, many people?`,
    down: `Does what ${o} did harm people beyond your own circle: strangers, the weak, many people?`,
  }),
};

/** The same statements, given as fact: the direction is known, so nothing asks whether it holds. */
export const GIVEN: Record<string, (o: string) => Record<Dir, string>> = {
  self_direction: (o) => ({
    up: `What ${o} did gives you more say over what you do, who you see or how you live.`,
    down: `What ${o} did takes a choice out of your hands: ${o} or someone else now decides what you do, who you see or how you live.`,
  }),
  stimulation: (o) => ({
    up: `What ${o} did brings excitement, risk, novelty or a challenge into your life.`,
    down: `What ${o} did takes excitement, novelty or challenge out of your life.`,
  }),
  hedonism: (o) => ({
    up: `What ${o} did brings you pleasure, fun or comfort.`,
    down: `What ${o} did takes pleasure, fun or comfort away from you.`,
  }),
  achievement: (o) => ({
    up: `What ${o} did helps your success: your work or business, getting ahead, or how others rate what you can do.`,
    down: `What ${o} did hurts your success: your work or business, getting ahead, or how others rate what you can do.`,
  }),
  power: (o) => ({
    up: `What ${o} did brings you money, possessions, standing, or more control over people or things.`,
    down: `What ${o} did costs you money, possessions, standing or control, such as by defying you, belittling you or taking from you.`,
  }),
  security: (o) => ({
    up: `What ${o} did makes you safer, or keeps danger or trouble away from you.`,
    down: `What ${o} did brings danger, trouble or upheaval closer to you.`,
  }),
  conformity: (o) => ({
    up: `What ${o} did backs you in keeping to the rules or to what is expected of you.`,
    down: `What ${o} did pushes you to break a rule or go against what is expected of you.`,
  }),
  tradition: (o) => ({
    up: `What ${o} did honours a custom or tradition you hold to.`,
    down: `What ${o} did pulls you away from a custom, a tradition or the way you have always done things.`,
  }),
  benevolence: (o) => ({
    up: `What ${o} did helps someone close to you: a friend, someone who relies on you, or someone you rely on.`,
    down: `What ${o} did harms someone close to you: a friend, someone who relies on you, or someone you rely on.`,
  }),
  universalism: (o) => ({
    up: `What ${o} did protects or helps people beyond your own circle: strangers, the weak, many people.`,
    down: `What ${o} did harms people beyond your own circle: strangers, the weak, many people.`,
  }),
};

export function line(map: Record<string, (o: string) => Record<Dir, string>>, id: string, o: string, d: Dir): string {
  const f = map[id];
  if (!f) throw new Error(`no wording for ${id}`);
  return f(o)[d];
}

// ---------- levels: concrete situations, the same for every value ----------

/** Four levels (an earlier, narrower wording): trivial and small merged. */
const L4 = [
  "Small: it barely registers or is a minor thing, like a passing look, a courtesy, a little money or a small worry; your situation is the same as before.",
  "Moderate: a real gain or setback you will carry for days, like a paying job, a debt eased or deepened, a real worry or relief, a blow to or boost for your name.",
  "Major: it changes your situation for weeks or for good, like a lasting freedom or restriction, your work or name badly hurt or made, someone close to you made safe or put at risk, your living or home put in real danger or taken out of it.",
  "Life-changing: your life, your livelihood, your home or your closest bond is saved or lost on it.",
];

/** Five levels, each a concrete situation, with examples spanning the values a move can touch. */
const L5c = [
  "Trivial: it barely registers and is forgotten within the hour, like a passing look or remark, a token gift, a small courtesy or a trivial choice opened or closed.",
  "Small: you notice it, but your situation is the same as before, like a little money, a small compliment or complaint, a minor worry or relief, a minor limit for a day, or a small help to someone close to you.",
  "Moderate: a real gain or setback you will carry for days, like real money or goods, praise or criticism from someone whose word counts, danger brought nearer or kept off, a debt eased or deepened, your authority affirmed or defied in front of others, or a real worry about someone close to you.",
  "Major: it changes your situation for weeks or for good, like your name at your work made or badly damaged where many will hear of it, lasting say over your own life given or taken, your safety, living or home put in serious danger or made secure, or someone close to you made safe or put in real danger.",
  "Life-changing: your life, your livelihood, your home, your freedom or your closest bond is now on the line, or is made safe from what threatened it.",
];

/** Said after the question: size is read from what rides on it for the holder, as `who_you_are` and `earlier` tell it. */
const STAKES = " Judge it by what rides on it for you, as `who_you_are` and `earlier` tell it.";

type Form = "asked" | "given";

function question(form: Form, id: string, o: string, d: Dir, levels: string[], extra: string): JevQuestion {
  const instructions =
    form === "asked"
      ? `${READ} Asked: "${line(ASKED, id, o, d)}" If so, how big is it?${extra}`
      : `${READ} ${line(GIVEN, id, o, d)} How big a change is that for you?${extra}`;
  return { type: "score", instructions, criteria: levels };
}

function variant(id: string, form: Form, levels: string[], toLabel: number[], extra = ""): Variant {
  return {
    id,
    levels: levels.length,
    toLabel,
    judge: async (c: BuiltCase, items: Item[], _values: Value[], jev: Jev) => {
      const qs: Record<string, JevQuestion> = {};
      for (const i of items) qs[itemKey(i)] = question(form, i.value, c.other.name, i.direction, levels, extra);
      const a = await jev("size", stateOf(c), qs);
      const out: Record<string, number> = {};
      for (const i of items) out[itemKey(i)] = mostProbable(a[itemKey(i)]);
      return out;
    },
  };
}

const variants: Variant[] = [
  variant("b5c-given", "given", L5c, [1, 2, 3, 4, 5]),
  variant("b5c-given-st", "given", L5c, [1, 2, 2, 3, 5], STAKES),
  variant("b5c-asked", "asked", L5c, [2, 2, 3, 4, 5]),
  variant("b4-given", "given", L4, [2, 3, 4, 5]),
];

const b: ArmModule = { arm: "B", variants, final: "b5c-given", contenders: ["b5c-given-st", "b5c-asked", "b4-given"] };
export default b;
