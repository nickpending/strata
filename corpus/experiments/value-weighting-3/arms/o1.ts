/**
 * Arm O1 of value-weighting-3: Jev applies the holder's importance.
 *
 * Final: `nogate-sides-sq`. One judgment is one Jev request per value the holder holds, in parallel:
 *
 * 1. Steps `v:<value>` (values whose bucket is "does not matter" are left out with their questions, the one
 *    thing code may do with an importance). State: `you_are` (the holder's identity, second person), `earlier`
 *    (the holder's earlier copies in this scenario, rendered), `just_now` (the target copy, rendered),
 *    `other_person` (the other's name) and `value: { what, how_much }`, where `what` is the value in plain
 *    second-person words (one fixed line per value, `PLAIN` below) and `how_much` its bucket in words ("matters a little to you", "matters to you",
 *    "matters a lot to you", "central to who you are"). Never a number (rule 4). Two questions:
 *      `dir` (choice): "Take `just_now` together with what led up to it in `earlier`. Judging only by
 *        `value.what`, which is it?" Options: `serves` and `harms`, each a literal, per-value description of
 *        what serving or harming that value looks like from the holder's side (`SIDES` below; for power:
 *        "It undercuts your standing or your control, or <other> defies you or goes over your head."), and
 *        `neither`: "Neither: it does not touch this."
 *      `care` (score, 4 levels): "`value.what` `value.how_much`. How much do you care about what `just_now`
 *        does to it?" Levels: not at all / a little, it soon passes / a lot, it stays with you / deeply, it
 *        hits something central to who you are. This is where Jev applies the importance: the bucket in words
 *        sits in the state beside the value, and the answer is how much this person cares.
 * 2. Score (code, no importance): for every value step alike, direction d = +1 when P(serves) >= 0.6, -1 when
 *    P(harms) >= 0.6, else 0 (one option's probability against a threshold, rule 6); weight W = [0, 1, 4, 9]
 *    indexed by `care`'s most probable level (a score by its most probable level, rule 6; the same map for
 *    every value and every bucket, and code never sees which bucket a step carried). Score = sum of W * d
 *    over the value steps, equal weights. Band 2: |score| < 2 reads neutral.
 *
 * The gated contenders first ask one importance-free request, step `gate`, with the four scene fields and one
 * noul, `about`: "Does `just_now` give you a real reason to think better or worse of `other_person`?". Below
 * 0.4 the judgment stops and scores 0 (docs/jev.md "Gate first"); the gate sees no value and no importance.
 * On dev it read every neutral case neutral but can only cost direction (a zeroed build or detract case is
 * wrong), so the final, chosen for the opposite-pair bar, runs ungated with a band instead.
 *
 * Rules leaned on (docs/jev.md): 1 (direction and how much it counts are separate questions, and each value
 * its own request), 2 (literal: each option states what serving or harming the value concretely looks like;
 * the instruction names `earlier` because the meaning of an offer, accept or arrival is in the talk before it),
 * 3 (a value is judged against the event, not against a character trait inferred from it), 4 (buckets in
 * words), 6 (typed reads only), 7 (small named state, fields named in every instruction), 8 (high means yes),
 * "Composite scoring" (independent per-value answers combined in code); the contenders add "Gate first" and
 * "Chaining". Bent: rule 7 in that every per-value request carries the
 * identity and the scenario history (1 to 8 lines): a dev run without the identity did worse, because standing
 * facts (cover, debts, rent) live there. The 3-option choice is not "one choice over candidates": its option
 * keys are generic and no state text names them; it is read by one option's probability, never by expectation.
 *
 * Contenders (secondary run only), all gated, band 1: `gate-sides-sq` (the final plus the gate),
 * `gate-sides-lin` (W = [0, 1, 2, 3]), `gate-generic-sq` (one generic forward/back wording for every value
 * instead of per-value sides), `gate-sides-nouls-sq` (one noul per side, each against 0.6, not the choice).
 *
 * All wording is general, per value or per question, and names no dev case, scenario, variant or fact.
 */
import type { BuiltCase } from "../../value-weighting-2/build.ts";
import type { Bag, Catalogue, Importance, Jev, O1Module, O1Variant } from "../contract.ts";
import type { Answers, Question, State } from "../jev3.ts";

/** Importance to words, second person. 0 ("does not matter") is left out with its questions. */
const BUCKET: Record<number, string> = {
  1: "matters a little to you",
  2: "matters to you",
  3: "matters a lot to you",
  4: "central to who you are",
};

/** Each value in concrete second-person words, one general line per value. */
const PLAIN: Record<string, string> = {
  self_direction: "making your own choices and running your own life, with nobody else deciding for you",
  stimulation: "excitement, risk, novelty and challenge",
  hedonism: "your own pleasure, comfort and good times",
  achievement: "succeeding and being seen to be good at what you do: earnings, skill, a name that counts",
  power: "your standing and control: having the say over people and what goes on around you, and being deferred to",
  security: "safety and stability for you and yours: keeping danger, heat and trouble away",
  conformity: "keeping to the rules and to what is expected, and not crossing or upsetting others",
  tradition: "respect for custom and for the way things have always been done",
  benevolence: "the welfare of the people close to you: your friends and the people you look out for",
  universalism: "fairness and the welfare of everyone, strangers included: nobody exploited or harmed",
};

/** Per value: what serving it and harming it look like from the holder's side. `{o}` is the other person. */
const SIDES: Record<string, { serves: string; harms: string }> = {
  self_direction: {
    serves: "It gives you more say over your own life, or more room to go your own way.",
    harms: "It takes a decision about your life out of your hands, or {o} tries to run your life for you.",
  },
  stimulation: {
    serves: "It brings excitement, risk, novelty or challenge into your life.",
    harms: "It makes your life duller or tamer, or takes excitement and challenge away from you.",
  },
  hedonism: {
    serves: "It brings you pleasure, comfort or a good time.",
    harms: "It spoils your pleasure, comfort or good time.",
  },
  achievement: {
    serves: "It brings you earnings, business or success, or shows you are good at what you do.",
    harms: "It costs you earnings, business or success, or makes you look bad at what you do.",
  },
  power: {
    serves: "It adds to your standing or your control over people and what goes on around you, or {o} defers to you.",
    harms: "It undercuts your standing or your control, or {o} defies you or goes over your head.",
  },
  security: {
    serves: "It keeps you and yours safe, or keeps danger, heat and trouble away from you.",
    harms: "It brings danger, heat or trouble toward you and yours, or makes your situation less stable.",
  },
  conformity: {
    serves: "It keeps you, or {o}, within the rules and what is expected, without crossing or upsetting others.",
    harms: "It pushes you, or {o}, to break the rules or what is expected, or to cross or upset others.",
  },
  tradition: {
    serves: "It keeps you, or {o}, to custom and the way things have always been done.",
    harms: "It pushes you, or {o}, to break with custom or the way things have always been done.",
  },
  benevolence: {
    serves: "It is good for the people close to you, or {o} looks after them.",
    harms: "It is bad for the people close to you, or {o} harms or uses them, or asks you to.",
  },
  universalism: {
    serves: "{o} is fair to people or protects people at large from harm.",
    harms: "{o} harms, cheats or exploits people, strangers included, or asks you to.",
  },
};

const TAKE = "Take `just_now` together with what led up to it in `earlier`.";
const GATE_AT = 0.4;
const SIDE_AT = 0.6;
const SQ = [0, 1, 4, 9];
const LIN = [0, 1, 2, 3];

function scene(c: BuiltCase): State {
  return {
    you_are: c.identity,
    earlier: c.history.map((h) => h.text),
    just_now: c.event,
    other_person: c.other.name,
  };
}

type Held = { id: string; what: string; how_much: string };

/** The values whose bucket is not "does not matter", in catalogue order, each in words. */
function held(imp: Importance, cat: Catalogue): Held[] {
  return cat.values
    .filter((v) => (imp[v.id] ?? 0) > 0)
    .map((v) => ({ id: v.id, what: PLAIN[v.id] ?? v.description, how_much: BUCKET[imp[v.id] as number] as string }));
}

function sides(id: string, o: string): { serves: string; harms: string } {
  const s = SIDES[id] as { serves: string; harms: string };
  return { serves: s.serves.replaceAll("{o}", o), harms: s.harms.replaceAll("{o}", o) };
}

const GATE: Record<string, Question> = {
  about: {
    type: "noul",
    instructions: "Does `just_now` give you a real reason to think better or worse of `other_person`?",
  },
};

const CARE: Question = {
  type: "score",
  instructions: "`value.what` `value.how_much`. How much do you care about what `just_now` does to it?",
  criteria: [
    "Not at all: it does nothing to this, or this barely matters to you.",
    "A little: you notice it, and it soon passes.",
    "A lot: it stays with you.",
    "Deeply: it hits something central to who you are.",
  ],
};

type Dir = "sides" | "generic" | "nouls";

function valueQs(id: string, o: string, dir: Dir): Record<string, Question> {
  const sd = sides(id, o);
  if (dir === "nouls") {
    return {
      serves: { type: "noul", instructions: `${TAKE} Judging only by \`value.what\`: ${sd.serves}` },
      harms: { type: "noul", instructions: `${TAKE} Judging only by \`value.what\`: ${sd.harms}` },
      care: CARE,
    };
  }
  const criteria =
    dir === "sides"
      ? { serves: sd.serves, harms: sd.harms, neither: "Neither: it does not touch this." }
      : {
          serves: `It moves this forward for you, or ${o} stands up for it.`,
          harms: `It sets this back for you, or ${o} goes against it.`,
          neither: "It does not touch this either way.",
        };
  const instructions =
    dir === "sides"
      ? `${TAKE} Judging only by \`value.what\`, which is it?`
      : `${TAKE} Judging only by \`value.what\`, what does it do?`;
  return { dir: { type: "choice", instructions, criteria }, care: CARE };
}

async function ask(c: BuiltCase, imp: Importance, cat: Catalogue, jev: Jev, gate: boolean, dir: Dir): Promise<Bag> {
  const base = scene(c);
  const bag: Bag = {};
  if (gate) {
    bag.gate = await jev("gate", base, GATE);
    const a = bag.gate.about;
    if (!a || a.type !== "noul" || a.noul < GATE_AT) return bag;
  }
  await Promise.all(
    held(imp, cat).map(async (v) => {
      bag[`v:${v.id}`] = await jev(
        `v:${v.id}`,
        { ...base, value: { what: v.what, how_much: v.how_much } },
        valueQs(v.id, c.other.name, dir),
      );
    }),
  );
  return bag;
}

/** +1, -1 or 0 for one value step: one option's (or one noul's) probability against SIDE_AT. */
function direction(a: Answers): number {
  const d = a.dir;
  if (d?.type === "choice") {
    if ((d.probabilities.serves ?? 0) >= SIDE_AT) return 1;
    if ((d.probabilities.harms ?? 0) >= SIDE_AT) return -1;
    return 0;
  }
  const s = a.serves?.type === "noul" && a.serves.noul >= SIDE_AT ? 1 : 0;
  const h = a.harms?.type === "noul" && a.harms.noul >= SIDE_AT ? 1 : 0;
  return s - h;
}

/** Sum over value steps, every value alike: W[care's most probable level] times direction. */
function scorer(w: number[]): (bag: Bag) => number {
  return (bag) => {
    let s = 0;
    for (const [step, a] of Object.entries(bag)) {
      if (!step.startsWith("v:")) continue;
      const care = a.care;
      const level = care?.type === "score" ? care.level : 0;
      s += (w[level] ?? 0) * direction(a);
    }
    return s;
  };
}

const variant = (id: string, gate: boolean, dir: Dir, w: number[], band: number): O1Variant => ({
  id,
  ask: (c, imp, cat, jev) => ask(c, imp, cat, jev, gate, dir),
  score: scorer(w),
  band,
});

const mod: O1Module = {
  arm: "O1",
  variants: [
    variant("gate-sides-sq", true, "sides", SQ, 1),
    variant("nogate-sides-sq", false, "sides", SQ, 2),
    variant("gate-sides-lin", true, "sides", LIN, 1),
    variant("gate-generic-sq", true, "generic", SQ, 1),
    variant("gate-sides-nouls-sq", true, "nouls", SQ, 1),
  ],
  final: "nogate-sides-sq",
  contenders: ["gate-sides-sq", "gate-sides-lin", "gate-generic-sq", "gate-sides-nouls-sq"],
};
export default mod;
