/**
 * Arm C (size-judgment): five levels anchored per value: what a move of each size looks like for this value.
 *
 * FINAL `c5-given`.
 *   State (one request per case): A's five fields, unchanged (`stateOf` from b.ts, v3's): `you`, `who_you_are`,
 *     `earlier`, `now`, `your_part`. Size is read from the holder's situation, which lives in `who_you_are` and
 *     `earlier`.
 *   Question: one score per given item, a case's items in one request:
 *     `${READ} <GIVEN[value](other)[direction]> How big a change is that for you?`
 *     (GIVEN from b.ts: v3's stake statement as a statement of fact, since the direction is given.)
 *   Levels: the same five size words for every value (Trivial / Small / Moderate / Major / Life-changing), each
 *     followed by that value's anchor (ANCHORS below), written for all ten values and both directions at once
 *     ("... made secure, or put in serious danger"). For security, for example: a passing unease or reassurance; a
 *     small worry or relief that does not change how safe you are; a real threat or protection carried for days;
 *     safety, living or home in serious danger or made secure for weeks; life, livelihood or home on the line or
 *     made safe.
 *   Reading: the most probable level only (contract.ts `mostProbable`, rule 6).
 *   toLabel [1, 2, 3, 4, 5]: the anchors are written to the 1 to 5 scale. Dev exact-or-adjacent 0.96, exact 0.65
 *     (the highest exact of any variant); [2, 2, 3, 4, 5] reads 0.97 / 0.61 on the first run, one item, so the
 *     identity stays.
 *   Dev (4 reps over two runs): pooled rho 0.83 (reps 0.79 to 0.84), up 0.91, down 0.71; 6/6 pairs.
 *
 * Each knob, with its dev lift (pooled Spearman, mean of 4 reps over two runs; 32 items, 6 pairs; every variant
 * held 6/6 pairs; rerun noise up to 0.05):
 *   - Per-value anchors in place of B's shared concrete levels, same question: 0.73 (B's final `b5c-given`) ->
 *     0.83; up-direction rho 0.88 -> 0.91, down 0.51 -> 0.71. Against A: 0.56 -> 0.83.
 *   - Direction given as fact in place of A's "Asked: ... If so, how big is it?": 0.79 -> 0.83 (down 0.62 -> 0.71).
 *   - Five levels in place of four (trivial and small merged): 0.77 -> 0.83.
 *   - B's stakes clause ("Judge it by what rides on it for you ..."): 0.82 against 0.83, no lift, so the final
 *     leaves it out (contender `c5-given-st`). The anchors already carry what is at stake.
 *
 * docs/jev.md rules it leans on: 2 (literal per-value boundary cases in the levels), 4 (no importance, as a number
 * or a word), 6 (most probable level only), 7 (the levels a question sees are only its own value's), 8 (higher level
 * always means bigger), batching (a case's items in one request). Rules it bends:
 *   - 1, one snap judgment: as in B, size folds what is at stake with how far this moment moved it. The anchors make
 *     that one judgment closer to the surface: each level names what is moved for this value, so Jev matches a
 *     situation rather than weighing two factors.
 *   - 7, small state: identity and history go to every question, as in A; the size depends on both.
 *   - Each anchor covers both directions in one line ("made secure, or put in serious danger"); the question states
 *     which way it went.
 *
 * Contenders:
 *   `c5-given-st` the final plus B's stakes clause (dev 0.82); toLabel [1, 2, 3, 4, 5].
 *   `c5-asked`    A's question verbatim with the final's anchored levels: the anchors alone (dev 0.79); toLabel
 *                 [2, 2, 3, 4, 5] (exact-or-adjacent 0.97 against the identity's 0.94).
 *   `c4-given`    four anchored levels, trivial and small merged (dev 0.77); toLabel [2, 3, 4, 5].
 *
 * No arm D. A chained or comparative form would have to end in one score's most probable level (contract.ts). The
 * composite shape docs/jev.md recommends for a judgment with two factors (score what is at stake and how far it
 * moved, combine in code) yields a level no score answered, so the contract bars it. A chain that writes a first
 * answer into the state of the size question hands Jev its own reading back and adds a request, and on dev there is
 * no gap for it to close: the final orders 6 of 6 pairs and keeps 96% of items within one size; its misses are
 * single items (a conditional threat read as major, a bounty read as major rather than life-changing).
 *
 * Wording is per value, per direction or per level. Nothing names or special-cases a dev case, scenario or fact.
 */
import type { ArmModule, BuiltCase, Item, Jev, JevQuestion, Value, Variant } from "../contract.ts";
import { itemKey, mostProbable } from "../contract.ts";
import { ASKED, type Dir, GIVEN, line, READ, stateOf } from "./b.ts";

const WORDS = ["Trivial", "Small", "Moderate", "Major", "Life-changing"];

/** Per value, five anchors, lowest first: what a move of each size looks like for this value, either way. */
const ANCHORS: Record<string, string[]> = {
  self_direction: [
    "a trivial choice opened or closed to you, like a small setting or what to drink.",
    "a minor freedom or limit for a day or so, like doing one task someone else's way.",
    "a real freedom or limit on how you act or spend your days, for a while.",
    "lasting say over your own work, movement or way of living given to you or taken from you.",
    "your freedom itself: you are confined or controlled by someone else for good, or set free for good.",
  ],
  stimulation: [
    "a passing bit of novelty or boredom.",
    "a small thrill, or a dull stretch, that soon passes.",
    "a real adventure, risk or challenge brought into your life or taken out of it for a while.",
    "your life opened up to new challenge, or locked into dull routine, for a long time.",
    "the whole way you live turned into adventure, or shut down into a life with none.",
  ],
  hedonism: [
    "a passing pleasure or discomfort, like a sip of something or a small annoyance.",
    "a small treat or discomfort, like a free drink, a good meal or a bad night.",
    "a real pleasure or comfort for days, or its loss.",
    "your comfort and enjoyment of life raised or ruined for weeks.",
    "your ability to enjoy life at all given back or taken away.",
  ],
  achievement: [
    "a passing word about your work that nobody will remember.",
    "a small compliment or complaint about your work, or a minor slip someone noticed.",
    "real praise or criticism of your work from someone whose word counts, or a job done well or badly that people will remember.",
    "your name as someone good at what you do made or badly damaged where many will hear of it, or a big piece of work won or lost.",
    "the work your living and your name rest on made or ended.",
  ],
  power: [
    "a passing nod or slight, or a token gift.",
    "a small sum, or a minor sign of respect or disrespect.",
    "real money or goods, or your authority affirmed or defied in front of others.",
    "your standing badly shaken or much strengthened, real property gained or lost, or a rival gaining or losing ground on you.",
    "your whole position or everything you own won or lost: you become someone, or no one.",
  ],
  security: [
    "a passing unease or reassurance, like a stranger's look or a kind word; how safe you are does not change.",
    "a small worry or relief you notice, like a minor risk, a small expense or a little help, without changing how safe or settled you are.",
    "a real threat or protection you will carry for days, like danger brought nearer or kept off, a debt eased or deepened, or your place made shakier or firmer.",
    "your safety, your living or your home put in serious danger, or made secure, for weeks to come.",
    "your life, your livelihood or your home now on the line, or made safe from what threatened it.",
  ],
  conformity: [
    "a passing nudge to keep to or bend a small expectation.",
    "a small rule bent or kept, with mild awkwardness or approval.",
    "pushed to break, or helped to keep, a real rule or expectation others would notice.",
    "pushed into a serious breach of what is expected of you, or kept from one, with real consequences for how people treat you.",
    "pushed into, or kept from, a breach that would make you an outcast or put you outside the law for good.",
  ],
  tradition: [
    "a passing nod to, or slight on, a custom.",
    "a small custom of yours kept or skipped.",
    "a custom you hold to honoured or broken in a way you will remember.",
    "a central custom or rite of yours kept, or lost, for a long time.",
    "your faith or the way of life you were raised in kept alive, or taken from you.",
  ],
  benevolence: [
    "a passing kindness or slight to someone close to you.",
    "a small help or harm to someone close to you, like a little money or a minor worry eased or added.",
    "real help or harm to someone close to you, or a worry about them you will carry for days: their need met, or left open, for now.",
    "the safety, living or place of someone close to you made secure, or put in real danger, for weeks or for good.",
    "the life, livelihood or home of someone closest to you now on the line or made safe, or your bond with them made or broken.",
  ],
  universalism: [
    "a passing kindness or harm to strangers.",
    "a small help or harm to a few people outside your circle.",
    "real help or harm to strangers or the weak that you will remember.",
    "serious harm to, or protection of, many people or the defenceless.",
    "the lives of many people, or of the defenceless, lost or saved.",
  ],
};

function levelsOf(id: string, four: boolean): string[] {
  const a = ANCHORS[id];
  if (!a) throw new Error(`no anchors for ${id}`);
  const five = a.map((t, i) => `${WORDS[i]}: ${t}`);
  if (!four) return five;
  // Four levels: trivial and small merged into one bottom level.
  return [`Small: ${(a[0] as string).replace(/\.$/, "")}; or ${a[1]}`, ...five.slice(2)];
}

const STAKES = " Judge it by what rides on it for you, as `who_you_are` and `earlier` tell it.";

type Form = "asked" | "given";

function question(form: Form, id: string, o: string, d: Dir, extra: string, four: boolean): JevQuestion {
  const instructions =
    form === "asked"
      ? `${READ} Asked: "${line(ASKED, id, o, d)}" If so, how big is it?${extra}`
      : `${READ} ${line(GIVEN, id, o, d)} How big a change is that for you?${extra}`;
  return { type: "score", instructions, criteria: levelsOf(id, four) };
}

function variant(id: string, form: Form, toLabel: number[], extra: string): Variant {
  const four = toLabel.length === 4;
  return {
    id,
    levels: toLabel.length,
    toLabel,
    judge: async (c: BuiltCase, items: Item[], _values: Value[], jev: Jev) => {
      const qs: Record<string, JevQuestion> = {};
      for (const i of items) qs[itemKey(i)] = question(form, i.value, c.other.name, i.direction, extra, four);
      const a = await jev("size", stateOf(c), qs);
      const out: Record<string, number> = {};
      for (const i of items) out[itemKey(i)] = mostProbable(a[itemKey(i)]);
      return out;
    },
  };
}

const variants: Variant[] = [
  variant("c5-given", "given", [1, 2, 3, 4, 5], ""),
  variant("c5-given-st", "given", [1, 2, 3, 4, 5], STAKES),
  variant("c5-asked", "asked", [2, 2, 3, 4, 5], ""),
  variant("c4-given", "given", [2, 3, 4, 5], ""),
];

const c: ArmModule = { arm: "C", variants, final: "c5-given", contenders: ["c5-given-st", "c5-asked", "c4-given"] };
export default c;
