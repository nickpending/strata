/**
 * Arm O2: code applies the importances. Jev reads who the holder is, the relationship so far and
 * the encounter, never the importances, and answers per Schwartz value (all in one call) whether the
 * encounter serves the value, goes against it or leaves it untouched, plus whether it is anything
 * beyond routine. The score is code: each value's P(serves) - P(goes against) weighted by the
 * holder's importance, so an untouched value adds nothing, scaled by the routine gate.
 *
 * Final (C-hyb-top-sig2): the personal-focus values are asked as the holder's own stake, the
 * social-focus values as the other person's conduct; only values the holder rates 3 or 4 count;
 * significance squared gates routine encounters to near zero.
 */
import catalogue from "../catalogue.json";
import type { JevAnswer, JevQuestion } from "../../../../harness/src/jev.ts";
import type { BuiltCase } from "../build.ts";
import type { Answers, Importance, O2Module, O2Variant } from "../contract.ts";

type Value = { id: string; description: string };
const VALUES: Value[] = catalogue.values;
const label = (id: string) => id.replace(/_/g, "-");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- state ----------

function state(c: BuiltCase): string {
  const o = c.other.name;
  const lines = c.history.map((h) => `- ${h.withOther ? "* " : ""}${h.text}`);
  const role =
    c.role === "direct"
      ? `This happened to you directly.`
      : `You saw this happen; it was not done to you.`;
  return [
    c.identity,
    "",
    lines.length
      ? `What you have seen and done so far, oldest first (lines marked * involve ${o}):\n${lines.join("\n")}`
      : `Nothing has passed between you and ${o} yet in this stretch.`,
    "",
    `Now, the encounter with ${o}:`,
    `>> ${c.event}`,
    role,
  ].join("\n");
}

// ---------- questions ----------

/** F: per-value effect for you, a choice of advances / sets back / untouched. */
function forYouQuestions(c: BuiltCase): Record<string, JevQuestion> {
  const o = c.other.name;
  const q: Record<string, JevQuestion> = {};
  for (const v of VALUES) {
    q[v.id] = {
      type: "choice",
      instructions: `Think only of ${label(v.id)} as something you yourself want: ${v.description}, for you, not for ${o}. Through ${o}'s part in this latest encounter, is that helped for you, hurt for you, or left untouched?`,
      criteria: {
        advances: `${o}'s part in it helps your own ${label(v.id)}.`,
        sets_back: `${o}'s part in it hurts your own ${label(v.id)}.`,
        untouched: `It leaves your ${label(v.id)} untouched; most encounters leave most values untouched.`,
      },
    };
  }
  return q;
}

/**
 * What a holder of each value cares about, in the words of Schwartz's Portrait Values Questionnaire
 * items (Schwartz 2012, the source the catalogue paraphrases). General to the value, written from the
 * questionnaire, not from any case.
 */
const CUES: Record<string, string> = {
  self_direction:
    "making your own decisions about what you do, being free and independent, doing things your own way, not depending on others",
  stimulation: "new and exciting things, adventure, taking risks, variety and challenge",
  hedonism: "having a good time, enjoying life's pleasures, doing things that are fun for you",
  achievement:
    "being successful, showing your abilities, being recognised and admired for what you can do, getting ahead",
  power:
    "money and possessions, being in charge, having others do what you say, being respected for your standing, keeping face in front of others",
  security:
    "living in safe surroundings, avoiding danger and trouble, order and stability, favours and debts being repaid, being looked after",
  conformity:
    "following the rules, behaving properly, not upsetting or harming others, keeping to what is expected of you",
  tradition: "the customs and ways you were brought up with, modesty, accepting your portion in life",
  benevolence:
    "helping the people close to you, caring for their wellbeing, being loyal to friends, being someone they can rely on, honesty with them",
  universalism:
    "fairness and justice for everyone, protecting the weak, tolerance and understanding of people who are different",
};

/**
 * Schwartz's personal-focus values (openness and self-enhancement) concern what the holder gets for
 * themself; the social-focus values (conservation and self-transcendence) concern how people around
 * them are treated and behave. The question asks each kind the way it bears on the holder.
 */
const PERSONAL = new Set(["self_direction", "stimulation", "hedonism", "achievement", "power"]);

/** Gate question: is there anything in this encounter beyond the routine. */
function significance(o: string): JevQuestion {
  return {
    type: "noul",
    instructions: `Is there anything in this latest encounter with ${o} that could make you think differently of ${o}, for better or worse? Answer no if it is routine: coming and going, small talk, ordinary business that changes nothing.`,
  };
}

type FocusOpts = {
  /** Add the PVQ items to each value's description. */
  cues: boolean;
  /** Ask the significance gate question too. */
  gate: boolean;
  /** Ask about what the encounter changes, read against what came before, not the background. */
  change?: boolean;
  /** Name the other person among the people whose wellbeing the social values cover. */
  circle?: boolean;
  /** Five levels (strongly / somewhat, either way, or untouched) in place of three. */
  levels5?: boolean;
  /** Leave out the reminder that most encounters leave most values untouched. */
  noPrior?: boolean;
  /** Ask the social-focus values about the other person's conduct, not what comes of it. */
  socialConduct?: boolean;
};

/** P: per-value focus framing, a choice of serves / works against / untouched, plus the gate. */
function focusQuestions(opts: FocusOpts) {
  return (c: BuiltCase): Record<string, JevQuestion> => {
    const o = c.other.name;
    const q: Record<string, JevQuestion> = {};
    const tail = opts.change
      ? ` Read the latest encounter in light of what came before it, and judge what it changes, not the situation it happens in.`
      : "";
    const prior = opts.noPrior ? "" : " Most encounters leave most values untouched.";
    const people = opts.circle ? `you and the people around you, ${o} among them` : `you and the people around you`;
    for (const v of VALUES) {
      const what = opts.cues ? `${v.description}; that is, ${CUES[v.id]}` : v.description;
      const instructions = PERSONAL.has(v.id)
        ? `Your own ${label(v.id)}: ${what}. Think of yourself, not ${o}: does this latest encounter with ${o} give you more of this, cost you some of it, or leave it untouched? ${o} gaining it is not you gaining it.`
        : opts.socialConduct
          ? `${cap(label(v.id))}: ${what}. In this latest encounter, does ${o}'s own conduct, what ${o} chose to do or say, uphold this, go against it, or leave it untouched, as you see it?`
          : `${cap(label(v.id))}: ${what}. As you see it, does this latest encounter with ${o}, what ${o} did and what comes of it for ${people}, serve this, go against it, or leave it untouched?`;
      q[v.id] = {
        type: "choice",
        instructions: `${instructions}${tail} Judge this value on its own: one encounter can serve one value and go against another.`,
        criteria: opts.levels5
          ? {
              strong_up: `It clearly serves your ${label(v.id)}, and it matters.`,
              up: `It serves your ${label(v.id)} a little.`,
              untouched: `It leaves ${label(v.id)} untouched.${prior}`,
              down: `It goes against your ${label(v.id)} a little.`,
              strong_down: `It clearly goes against your ${label(v.id)}, and it matters.`,
            }
          : {
              serves: `It serves your ${label(v.id)}.`,
              works_against: `It goes against your ${label(v.id)}.`,
              untouched: `It leaves ${label(v.id)} untouched.${prior}`,
            },
      };
    }
    if (opts.gate) q.significance = significance(o);
    return q;
  };
}

/**
 * C: per value, two choices: the holder's stake (as in P) and the other person's conduct, whether
 * what they did upholds the value or goes against it. People think better of those who act on what
 * they themselves value (Schwartz's value-similarity), so conduct is a second channel per value.
 */
function conductQuestions(opts: FocusOpts) {
  const stake = focusQuestions(opts);
  return (c: BuiltCase): Record<string, JevQuestion> => {
    const o = c.other.name;
    const q = stake(c);
    for (const v of VALUES) {
      const what = opts.cues ? `${v.description}; that is, ${CUES[v.id]}` : v.description;
      q[`${v.id}__conduct`] = {
        type: "choice",
        instructions: `${cap(label(v.id))}: ${what}. In this latest encounter, does ${o}'s own conduct, what ${o} chose to do or say, uphold this value or go against it, or has it nothing to do with it? Judge ${o}'s conduct, not what it does for you, and this value on its own.`,
        criteria: {
          serves: `${o}'s conduct upholds ${label(v.id)}.`,
          works_against: `${o}'s conduct goes against ${label(v.id)}.`,
          untouched: `${o}'s conduct has nothing to do with ${label(v.id)}.`,
        },
      };
    }
    return q;
  };
}

/**
 * E: the relationship looks forward. Per value, what this encounter shows of the other person:
 * someone who brings the holder more of a personal-focus value or costs them some, now or later;
 * someone who stands for a social-focus value or goes against it.
 */
function expectQuestions(c: BuiltCase): Record<string, JevQuestion> {
  const o = c.other.name;
  const q: Record<string, JevQuestion> = {};
  for (const v of VALUES) {
    const what = `${v.description}; that is, ${CUES[v.id]}`;
    const instructions = PERSONAL.has(v.id)
      ? `Your own ${label(v.id)}: ${what}. Going by this latest encounter, read in light of what came before, does ${o} look like someone who brings you more of this or costs you some of it, now or down the line, or does it say nothing about that? Think of yourself: ${o} having it is not you having it.`
      : `${cap(label(v.id))}: ${what}. Going by this latest encounter, read in light of what came before, does ${o} look like someone who stands for this or goes against it, as you see it, or does it say nothing about that?`;
    q[v.id] = {
      type: "choice",
      instructions: `${instructions} Judge this value on its own: one encounter can say one thing about one value and the opposite about another.`,
      criteria: {
        serves: PERSONAL.has(v.id)
          ? `${o} looks like someone who brings you more ${label(v.id)}.`
          : `${o} looks like someone who stands for ${label(v.id)}.`,
        works_against: PERSONAL.has(v.id)
          ? `${o} looks like someone who costs you ${label(v.id)}.`
          : `${o} looks like someone who goes against ${label(v.id)}.`,
        untouched: `This encounter says nothing about ${o} and ${label(v.id)}.`,
      },
    };
  }
  q.significance = significance(o);
  return q;
}

// ---------- scores ----------

const probs = (a: JevAnswer | undefined): Record<string, number> =>
  a && "probabilities" in a ? a.probabilities : {};
const noul = (a: JevAnswer | undefined): number => (a && "noul" in a ? a.noul : 0);

/** A value's signed effect in [-1, 1] and the probability mass that it is touched at all. */
type Effect = { dir: number; touched: number };

/** Three-way choice: P(up) - P(down); P(untouched) contributes nothing. */
function choiceEffect(a: JevAnswer | undefined, up: string, down: string): Effect {
  const p = probs(a);
  const pu = p[up] ?? 0;
  const pd = p[down] ?? 0;
  return { dir: pu - pd, touched: pu + pd };
}

/** Five-level choice: expected direction, strong 1 and a little 0.5 either way. */
function levelEffect(a: JevAnswer | undefined): Effect {
  const p = probs(a);
  const g = (k: string) => p[k] ?? 0;
  return {
    dir: g("strong_up") + 0.5 * g("up") - 0.5 * g("down") - g("strong_down"),
    touched: 1 - g("untouched"),
  };
}

type Effects = Record<string, Effect>;
const each = (f: (id: string) => Effect): Effects =>
  Object.fromEntries(VALUES.map((v) => [v.id, f(v.id)]));
const forYouEffects = (ans: Answers) =>
  each((id) => choiceEffect(ans[id], "advances", "sets_back"));
const focusEffects = (ans: Answers) => each((id) => choiceEffect(ans[id], "serves", "works_against"));
const levelEffects = (ans: Answers) => each((id) => levelEffect(ans[id]));
/** Stake for the personal-focus values, the other's conduct for the social-focus values. */
const hybridEffects = (ans: Answers) =>
  each((id) =>
    choiceEffect(ans[PERSONAL.has(id) ? id : `${id}__conduct`], "serves", "works_against"),
  );

/** Weight of a value by its importance to the holder. */
type Weigh = (imp: number) => number;
const linear: Weigh = (i) => i;
/** Only what matters a lot (3) or is central (4) counts, equally. */
const top: Weigh = (i) => (i >= 3 ? 1 : 0);
/** What matters a lot counts once, what is central twice; the rest nothing. */
const above: Weigh = (i) => Math.max(i - 2, 0);

/**
 * Hard gate (the first attempt's): Σ w(imp)·dir over values whose touched mass reaches `gate`,
 * divided by Σ w(imp), so the score sits in [-1, 1] whatever the profile.
 */
function thresholded(effects: Effects, imp: Importance, w: Weigh, gate: number): number {
  let num = 0;
  let den = 0;
  for (const v of VALUES) {
    const wi = w(imp[v.id] ?? 0);
    den += wi;
    const e = effects[v.id];
    if (!e || e.touched < gate) continue;
    num += wi * e.dir;
  }
  return den > 0 ? num / den : 0;
}

/**
 * Soft gates: each value counts by P(serves) - P(goes against), so an untouched value adds nothing,
 * and the whole is scaled by the probability that the encounter is anything beyond routine (raised
 * to `sharp`: 2 presses a routine encounter, significance 0.3, to 0.09). Divided by Σ w(imp): the
 * weighted mean effect on what the holder cares about, in [-1, 1].
 */
function gatedMean(effects: Effects, imp: Importance, w: Weigh, ans: Answers, sharp = 1): number {
  let num = 0;
  let den = 0;
  for (const v of VALUES) {
    const wi = w(imp[v.id] ?? 0);
    den += wi;
    num += wi * (effects[v.id]?.dir ?? 0);
  }
  return den > 0 ? (noul(ans.significance) ** sharp * num) / den : 0;
}

// ---------- variants ----------

const P = focusQuestions({ cues: true, gate: true });
const P2 = focusQuestions({ cues: true, gate: true, change: true, circle: true });

const variants: O2Variant[] = [
  {
    // The first attempt's shape with the real context: per-value for-you choice, linear, hard gate.
    id: "F-lin-gate",
    state,
    questions: forYouQuestions,
    score: (a, imp) => thresholded(forYouEffects(a), imp, linear, 0.5),
    band: 0.05,
  },
  {
    id: "P-lin-sig",
    state,
    questions: P,
    score: (a, imp) => gatedMean(focusEffects(a), imp, linear, a),
    band: 0.035,
  },
  {
    id: "P-top-sig",
    state,
    questions: P,
    score: (a, imp) => gatedMean(focusEffects(a), imp, top, a),
    band: 0.03,
  },
  {
    id: "P-above-sig",
    state,
    questions: P,
    score: (a, imp) => gatedMean(focusEffects(a), imp, above, a),
    band: 0.03,
  },
  {
    id: "P2-top-sig",
    state,
    questions: P2,
    score: (a, imp) => gatedMean(focusEffects(a), imp, top, a),
    band: 0.035,
  },
  {
    id: "P3-top-sig",
    state,
    questions: focusQuestions({ cues: true, gate: true, change: true, circle: true, levels5: true }),
    score: (a, imp) => gatedMean(levelEffects(a), imp, top, a),
    band: 0.02,
  },
  {
    id: "P4-top-sig",
    state,
    questions: focusQuestions({ cues: true, gate: true, change: true, circle: true, noPrior: true }),
    score: (a, imp) => gatedMean(focusEffects(a), imp, top, a),
    band: 0.035,
  },
  {
    id: "C-hyb-top-sig",
    state,
    questions: conductQuestions({ cues: true, gate: true }),
    score: (a, imp) => gatedMean(hybridEffects(a), imp, top, a),
    band: 0.04,
  },
  {
    // Final. Stake for the personal-focus values, the other's conduct for the social-focus ones;
    // only the holder's values at 3 or 4 count; significance squared as the routine gate.
    id: "C-hyb-top-sig2",
    state,
    questions: conductQuestions({ cues: true, gate: true }),
    score: (a, imp) => gatedMean(hybridEffects(a), imp, top, a, 2),
    band: 0.03,
  },
  {
    id: "E-top-sig",
    state,
    questions: expectQuestions,
    score: (a, imp) => gatedMean(focusEffects(a), imp, top, a),
    band: 0.07,
  },
];

const o2: O2Module = { arm: "O2", variants, final: "C-hyb-top-sig2" };
export default o2;
