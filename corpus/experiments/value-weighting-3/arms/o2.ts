/**
 * Arm O2 (value-weighting-3): code applies importance. Jev never sees an importance, as a number or a
 * word; `ask` receives none, and only `score` (code) reads them.
 *
 * FINAL `d4-top`: composite scoring over two chained requests, then code.
 *
 * State (every request, rule 7): one JSON object with the five fields the questions name.
 *   `you` the holder's name; `who_you_are` the identity text; `earlier` the holder's own earlier copies
 *   in the scenario, one line each, oldest first; `now` the encounter as the holder received it;
 *   `your_part` "{other} did this with you directly." or "You saw this; it was not aimed at you."
 *   Every question opens with READ, which names `now`, `earlier`, `you`, `who_you_are` and `your_part`
 *   and tells Jev to take `now` together with what was said just before it (an accept takes on the
 *   terms said before it; leaving can be setting off to do what was just said), so each question
 *   stays one literal hop from the surface (rule 3).
 *
 * Step `gate` (41 nouls, one request):
 *   - per value (Schwartz's ten), per channel, per direction, one literal yes/no question about what
 *     the other person did, from the holder's side (rules 1, 2, 8):
 *       stake up / down: "Does what {o} did make you safer ...?" / "... bring danger ... closer to you?"
 *       deed  up / down: "Did {o} protect someone from danger or trouble?" / "Did {o} bring danger ...?"
 *     `stake` is what the act does to the holder's own share of the value; `deed` is whether the other
 *     person acted for or against the value (people warm to those who act on what they themselves
 *     value: Schwartz's value-similarity). The up and down nouls are separate absolute questions,
 *     never read as one another's negation (rule 9). Together they are this value's gate and
 *     direction: a value the encounter does not touch scores low on both.
 *   - `touches`: reverie's touches noul (bench-automation finding 3), the encounter-level gate.
 * Step `how` (chained, one request): for every statement whose noul is at least 0.4, a score of its
 *   strength with three levels described as concrete situations (slight / clear / big for the
 *   holder's stake; faintly / clearly / strongly shown for a deed). Read only by its most probable
 *   level (rule 6).
 * Score (code):
 *   effect(value) = sum over its four statements of sign (up +1, down -1) * P(noul) * L,
 *                   L = 1, 2, 3 by the strength's most probable level (L = 1 when no strength was
 *                   asked, the noul being under 0.4)
 *   score = P(touches) * sum_v w(imp_v) * effect(v) / sum_v w(imp_v)
 *   w(importance) = 1 for "matters a lot" (3) or "central" (4), else 0. Each noul is used as a
 *   probability and each strength only by its bucket (rule 6); no number reaches Jev (rule 4); the
 *   importances enter only here (composite scoring: weights held in code). Band 0.05.
 *
 * What the final bends, and why (measured on dev):
 *   - No separate two-sided per-value gate noul ("does it touch your X, for better or worse?").
 *     That question holds two judgments (rule 1) and read 0.2 to 0.8 on almost every value of every
 *     case, neutral ones included; the direction choice after it then picked a side of noise. Two
 *     one-sided nouls per value are sharper (on one case a single "hurts strangers or the weak?"
 *     noul read 0.79 where the two-sided gate read 0.35), and a value neither one raises scores low
 *     on both, which is the gate. The brief's starting shape (gate noul, direction choice, strength
 *     score) is kept as the contender `gc-top`.
 *   - Nouls are used as probabilities, not thresholded (the prereg allows either); thresholding at
 *     0.5 threw away the many 0.4 to 0.6 readings and lost pairs on every wording tried
 *     (contender `d4-sq-thr` keeps the thresholded reading).
 *
 * Contenders: `d4-sq` and `d4-lin` (same questions, importance weighted by its square or linearly),
 * `d4-sq-thr` (same questions, nouls thresholded at 0.5 instead of used as probabilities), and
 * `gc-top` (explicit per-value gate noul, then a direction choice and a strength score for each
 * value-channel whose gate reaches 0.3; the gate used as a probability, the choice by its pick, the
 * strength by its bucket).
 *
 * All wording is per value or per channel. Nothing names a person, place, item or event of any
 * scenario; `{o}` is the other person's name from the case.
 */
import type { BuiltCase } from "../../value-weighting-2/build.ts";
import type { Bag, Catalogue, Importance, Jev, O2Module, O2Variant } from "../contract.ts";
import type { Answer, Question, State } from "../jev3.ts";

// ---------- state ----------

/** The one state every request sees: who the holder is, what came before, and the encounter. */
function stateOf(c: BuiltCase): State {
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

const noulOf = (a: Answer | undefined) => (a?.type === "noul" ? a.noul : 0);

// ---------- four one-sided statements per value (family d4) ----------

type Channel = "stake" | "deed";
type Dir = "up" | "down";
const CHANNELS: Channel[] = ["stake", "deed"];
const DIRS: Dir[] = ["up", "down"];

/**
 * Per value, four literal statements, written after Schwartz's value definitions and Portrait Values
 * Questionnaire items (catalogue.json paraphrases the same source).
 */
type Statements = Record<Channel, Record<Dir, string>>;
const S: Record<string, (o: string) => Statements> = {
  self_direction: (o) => ({
    stake: {
      up: `Does what ${o} did give you more say over what you do, who you see or how you live?`,
      down: `Does what ${o} did take a choice out of your hands: ${o} or someone else deciding what you do, who you see or how you live?`,
    },
    deed: {
      up: `Did ${o} defy someone's wishes or orders to do what they themself chose?`,
      down: `Did ${o} decide for someone else over their head, or order them what to do?`,
    },
  }),
  stimulation: (o) => ({
    stake: {
      up: `Does what ${o} did bring excitement, risk, novelty or a challenge into your life?`,
      down: `Does what ${o} did take excitement, novelty or challenge out of your life?`,
    },
    deed: {
      up: `Did ${o} go after excitement, risk or a daring challenge?`,
      down: `Did ${o} turn away from excitement and risk for a safe, quiet life?`,
    },
  }),
  hedonism: (o) => ({
    stake: {
      up: `Does what ${o} did bring you pleasure, fun or comfort?`,
      down: `Does what ${o} did take pleasure, fun or comfort away from you?`,
    },
    deed: {
      up: `Did ${o} go after pleasure or a good time?`,
      down: `Did ${o} give up pleasure or a good time?`,
    },
  }),
  achievement: (o) => ({
    stake: {
      up: `Does what ${o} did help your success: your work or business, getting ahead, or how others rate what you can do?`,
      down: `Does what ${o} did hurt your success: your work or business, getting ahead, or how others rate what you can do?`,
    },
    deed: {
      up: `Did ${o} show ambition, or real skill at getting ahead?`,
      down: `Did ${o} fail at something, or pass up a chance to get ahead?`,
    },
  }),
  power: (o) => ({
    stake: {
      up: `Does what ${o} did bring you money, possessions, standing, or more control over people or things?`,
      down: `Does what ${o} did cost you money, possessions, standing or control, such as by defying you, belittling you or taking from you?`,
    },
    deed: {
      up: `Did ${o} take or use money, standing or control over others?`,
      down: `Did ${o} give up money, standing or control, or bow to someone?`,
    },
  }),
  security: (o) => ({
    stake: {
      up: `Does what ${o} did make you safer, or keep danger or trouble away from you?`,
      down: `Does what ${o} did bring danger, trouble or upheaval closer to you?`,
    },
    deed: {
      up: `Did ${o} protect someone from danger or trouble?`,
      down: `Did ${o} bring danger or trouble down on someone?`,
    },
  }),
  conformity: (o) => ({
    stake: {
      up: `Does what ${o} did back you in keeping to the rules or to what is expected of you?`,
      down: `Does what ${o} did push you to break a rule or go against what is expected of you?`,
    },
    deed: {
      up: `Did ${o} hold back, keeping to a rule or to what someone asked of them, when they could have done otherwise?`,
      down: `Did ${o} break a rule, go against what they were told, or upset people?`,
    },
  }),
  tradition: (o) => ({
    stake: {
      up: `Does what ${o} did honour a custom or tradition you hold to?`,
      down: `Does what ${o} did pull you away from a custom, a tradition or the way you have always done things?`,
    },
    deed: {
      up: `Did ${o} honour a custom or tradition?`,
      down: `Did ${o} break with a custom, a tradition or the way things have always been done?`,
    },
  }),
  benevolence: (o) => ({
    stake: {
      up: `Does what ${o} did help someone close to you: a friend, someone who relies on you, or someone you rely on?`,
      down: `Does what ${o} did harm someone close to you: a friend, someone who relies on you, or someone you rely on?`,
    },
    deed: {
      up: `Did ${o} help, stand by or keep faith with someone close to them?`,
      down: `Did ${o} let down, betray or hurt someone close to them?`,
    },
  }),
  universalism: (o) => ({
    stake: {
      up: `Does what ${o} did protect or help people beyond your own circle: strangers, the weak, many people?`,
      down: `Does what ${o} did harm people beyond your own circle: strangers, the weak, many people?`,
    },
    deed: {
      up: `Did ${o} protect someone weaker or worse off, or people outside their own circle, or refuse to harm them?`,
      down: `Did ${o} hurt, cheat or exploit someone weaker or worse off, or people outside their own circle?`,
    },
  }),
};

function statement(id: string, o: string, ch: Channel, d: Dir): string {
  const f = S[id];
  if (!f) throw new Error(`no wording for ${id}`);
  return f(o)[ch][d];
}

const key4 = (ch: Channel, id: string, d: Dir) => `${ch}__${id}__${d}`;

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

function strength4(id: string, o: string, ch: Channel, d: Dir): Question {
  const st = statement(id, o, ch, d);
  return ch === "stake"
    ? { type: "score", instructions: `${READ} Asked: "${st}" If so, how big is it?`, criteria: STAKE_LEVELS }
    : {
        type: "score",
        instructions: `${READ} Asked: "${st}" If so, how plainly does \`now\` show it?`,
        criteria: DEED_LEVELS,
      };
}

/** Reverie's touches noul (bench-automation finding 3), worded for this state: the encounter gate. */
const TOUCHES: Question = {
  type: "noul",
  instructions:
    "Does what just happened (`now`, after `earlier`) touch you (`you`) personally: your safety, your secrets, your people, or something you want?",
};

/** Strength is asked only for statements whose noul reaches this (the chained step). */
const ASK_STRENGTH_FROM = 0.4;

async function ask4(c: BuiltCase, catalogue: Catalogue, jev: Jev): Promise<Bag> {
  const s = stateOf(c);
  const o = c.other.name;
  const gates: Record<string, Question> = {};
  for (const ch of CHANNELS)
    for (const v of catalogue.values)
      for (const d of DIRS)
        gates[key4(ch, v.id, d)] = { type: "noul", instructions: `${READ} ${statement(v.id, o, ch, d)}` };
  gates.touches = TOUCHES;
  const gate = await jev("gate", s, gates);
  const how: Record<string, Question> = {};
  for (const ch of CHANNELS)
    for (const v of catalogue.values)
      for (const d of DIRS) {
        const k = key4(ch, v.id, d);
        if (noulOf(gate[k]) >= ASK_STRENGTH_FROM) how[k] = strength4(v.id, o, ch, d);
      }
  const bag: Bag = { gate };
  if (Object.keys(how).length) bag.how = await jev("how", s, how);
  return bag;
}

// ---------- gate noul, direction choice, strength score per value (family gc) ----------

/** `what` is what the gate and strength ask about; `more` and `less` are the direction's options. */
type Side = { what: string; more: string; less: string };
const SIDES: Record<string, { stake: Side; deed: (o: string) => Side }> = {
  self_direction: {
    stake: {
      what: "your say over what you do, who you see and how you live",
      more: "It gives you more say over your own life.",
      less: "It takes a choice out of your hands.",
    },
    deed: (o) => ({
      what: `${o} doing what they themself chose against someone's wishes, or ${o} deciding for someone else over their head`,
      more: `${o} defied someone's wishes or orders to do what they themself chose.`,
      less: `${o} decided for someone else over their head, or ordered them what to do.`,
    }),
  },
  stimulation: {
    stake: {
      what: "the excitement, risk, novelty and challenge in your life",
      more: "It brings excitement, risk, novelty or a challenge into your life.",
      less: "It takes excitement, novelty or challenge out of your life.",
    },
    deed: (o) => ({
      what: `${o} going after excitement, risk or a daring challenge, or turning away from them`,
      more: `${o} went after excitement, risk or a daring challenge.`,
      less: `${o} turned away from excitement and risk for a safe, quiet life.`,
    }),
  },
  hedonism: {
    stake: {
      what: "your pleasure, fun and comfort",
      more: "It brings you pleasure, fun or comfort.",
      less: "It takes pleasure, fun or comfort away from you.",
    },
    deed: (o) => ({
      what: `${o} going after pleasure and a good time, or giving them up`,
      more: `${o} went after pleasure or a good time.`,
      less: `${o} gave up pleasure or a good time.`,
    }),
  },
  achievement: {
    stake: {
      what: "your success: your work or business, getting ahead, and how others rate what you can do",
      more: "It helps your success or how others rate you.",
      less: "It hurts your success or how others rate you.",
    },
    deed: (o) => ({
      what: `${o} showing ambition or skill at getting ahead, or failing or passing up a chance`,
      more: `${o} showed ambition, or real skill at getting ahead.`,
      less: `${o} failed at something, or passed up a chance to get ahead.`,
    }),
  },
  power: {
    stake: {
      what: "your money, possessions, standing, and control over people and things",
      more: "It brings you money, possessions, standing or control.",
      less: "It costs you money, possessions, standing or control, such as by defying you, belittling you or taking from you.",
    },
    deed: (o) => ({
      what: `${o} taking or using money, standing or control over others, or giving them up`,
      more: `${o} took or used money, standing or control over others.`,
      less: `${o} gave up money, standing or control, or bowed to someone.`,
    }),
  },
  security: {
    stake: {
      what: "how safe you are: danger, trouble or upheaval coming closer to you or kept away",
      more: "It makes you safer, or keeps danger or trouble away from you.",
      less: "It brings danger, trouble or upheaval closer to you.",
    },
    deed: (o) => ({
      what: `${o} protecting someone from danger or trouble, or bringing danger or trouble down on someone`,
      more: `${o} protected someone from danger or trouble.`,
      less: `${o} brought danger or trouble down on someone.`,
    }),
  },
  conformity: {
    stake: {
      what: "whether you keep to the rules and to what is expected of you",
      more: "It backs you in keeping to the rules or to what is expected of you.",
      less: "It pushes you to break a rule or go against what is expected of you.",
    },
    deed: (o) => ({
      what: `${o} holding back to keep to a rule or to what someone asked, or ${o} breaking a rule, going against what they were told, or upsetting people`,
      more: `${o} held back, keeping to a rule or to what someone asked of them.`,
      less: `${o} broke a rule, went against what they were told, or upset people.`,
    }),
  },
  tradition: {
    stake: {
      what: "the customs, traditions and ways of doing things you hold to",
      more: "It honours a custom or tradition you hold to.",
      less: "It pulls you away from a custom, a tradition or the way you have always done things.",
    },
    deed: (o) => ({
      what: `${o} honouring a custom or tradition, or breaking with one`,
      more: `${o} honoured a custom or tradition.`,
      less: `${o} broke with a custom, a tradition or the way things have always been done.`,
    }),
  },
  benevolence: {
    stake: {
      what: "the welfare of someone close to you: a friend, someone who relies on you, or someone you rely on",
      more: "It helps someone close to you.",
      less: "It harms someone close to you.",
    },
    deed: (o) => ({
      what: `${o} helping, standing by or keeping faith with someone close to them, or letting down, betraying or hurting them`,
      more: `${o} helped, stood by or kept faith with someone close to them.`,
      less: `${o} let down, betrayed or hurt someone close to them.`,
    }),
  },
  universalism: {
    stake: {
      what: "the welfare of people beyond your own circle: strangers, the weak, many people",
      more: "It protects or helps people beyond your own circle.",
      less: "It harms people beyond your own circle.",
    },
    deed: (o) => ({
      what: `${o} protecting or refusing to harm someone weaker or worse off or outside their own circle, or ${o} hurting, cheating or exploiting them`,
      more: `${o} protected someone weaker or worse off, or people outside their own circle, or refused to harm them.`,
      less: `${o} hurt, cheated or exploited someone weaker or worse off, or people outside their own circle.`,
    }),
  },
};

function side(ch: Channel, id: string, o: string): Side {
  const w = SIDES[id];
  if (!w) throw new Error(`no wording for ${id}`);
  return ch === "stake" ? w.stake : w.deed(o);
}

const keyGC = (ch: Channel, id: string) => `${ch}__${id}`;

function gateGC(ch: Channel, id: string, o: string): Question {
  const s = side(ch, id, o);
  return {
    type: "noul",
    instructions:
      ch === "stake"
        ? `${READ} Does what ${o} did make a difference to ${s.what}? Answer no if it leaves that as it was.`
        : `${READ} Does what ${o} did show this: ${s.what}? Answer no if it shows nothing about that.`,
  };
}

function dirGC(ch: Channel, id: string, o: string): Question {
  const s = side(ch, id, o);
  return {
    type: "choice",
    instructions: `${READ} What ${o} did bears on ${s.what}. Which way?`,
    criteria: { more: s.more, less: s.less },
  };
}

function strengthGC(ch: Channel, id: string, o: string): Question {
  const s = side(ch, id, o);
  return ch === "stake"
    ? {
        type: "score",
        instructions: `${READ} How big a difference does what ${o} did make to ${s.what}?`,
        criteria: STAKE_LEVELS,
      }
    : {
        type: "score",
        instructions: `${READ} How plainly does what ${o} did show this: ${s.what}?`,
        criteria: DEED_LEVELS,
      };
}

/** Direction and strength are asked only for value-channels whose gate reaches this. */
const ASK_DIRECTION_FROM = 0.3;

async function askGC(c: BuiltCase, catalogue: Catalogue, jev: Jev): Promise<Bag> {
  const s = stateOf(c);
  const o = c.other.name;
  const gates: Record<string, Question> = {};
  for (const ch of CHANNELS) for (const v of catalogue.values) gates[keyGC(ch, v.id)] = gateGC(ch, v.id, o);
  gates.touches = TOUCHES;
  const gate = await jev("gate", s, gates);
  const how: Record<string, Question> = {};
  for (const ch of CHANNELS)
    for (const v of catalogue.values) {
      const k = keyGC(ch, v.id);
      if (noulOf(gate[k]) >= ASK_DIRECTION_FROM) {
        how[`${k}__dir`] = dirGC(ch, v.id, o);
        how[`${k}__str`] = strengthGC(ch, v.id, o);
      }
    }
  const bag: Bag = { gate };
  if (Object.keys(how).length) bag.how = await jev("how", s, how);
  return bag;
}

// ---------- score (code applies importance) ----------

/** Strength by its most probable level only (rule 6). */
const LEVEL_WEIGHT = [1, 2, 3];
const levelOf = (a: Answer | undefined) => (a?.type === "score" ? (LEVEL_WEIGHT[a.level] ?? 1) : 1);

type Weigh = (imp: number) => number;
/** Only what matters a lot (3) or is central (4) counts, equally. */
const top: Weigh = (i) => (i >= 3 ? 1 : 0);
const square: Weigh = (i) => i * i;
const linear: Weigh = (i) => i;

/** Weighted mean of the values' effects, scaled by the touches noul used as a probability. */
function combine(bag: Bag, imp: Importance, catalogue: Catalogue, w: Weigh, effect: (id: string) => number) {
  let num = 0;
  let den = 0;
  for (const v of catalogue.values) {
    const wi = w(imp[v.id] ?? 0);
    den += wi;
    if (wi) num += wi * effect(v.id);
  }
  return den > 0 ? (noulOf(bag.gate?.touches) * num) / den : 0;
}

/** Family d4: each statement's noul as a probability (or against `theta`) times its strength bucket. */
function score4(w: Weigh, theta: number | null) {
  return (bag: Bag, imp: Importance, catalogue: Catalogue): number =>
    combine(bag, imp, catalogue, w, (id) => {
      let e = 0;
      for (const ch of CHANNELS)
        for (const d of DIRS) {
          const k = key4(ch, id, d);
          const p = noulOf(bag.gate?.[k]);
          const sign = d === "up" ? 1 : -1;
          if (theta === null) e += sign * p * levelOf(bag.how?.[k]);
          else if (p >= theta) e += sign * levelOf(bag.how?.[k]);
        }
      return e;
    });
}

/** Family gc: the gate noul as a probability, times the direction choice's pick, times the strength bucket. */
function scoreGC(w: Weigh) {
  return (bag: Bag, imp: Importance, catalogue: Catalogue): number =>
    combine(bag, imp, catalogue, w, (id) => {
      let e = 0;
      for (const ch of CHANNELS) {
        const k = keyGC(ch, id);
        const d = bag.how?.[`${k}__dir`];
        if (d?.type !== "choice") continue;
        e += noulOf(bag.gate?.[k]) * (d.choice === "more" ? 1 : -1) * levelOf(bag.how?.[`${k}__str`]);
      }
      return e;
    });
}

// ---------- variants ----------

const variants: O2Variant[] = [
  { id: "d4-top", ask: ask4, score: score4(top, null), band: 0.05 },
  { id: "d4-sq", ask: ask4, score: score4(square, null), band: 0.05 },
  { id: "d4-lin", ask: ask4, score: score4(linear, null), band: 0.05 },
  { id: "d4-sq-thr", ask: ask4, score: score4(square, 0.5), band: 0.05 },
  { id: "gc-top", ask: askGC, score: scoreGC(top), band: 0.05 },
];

const o2: O2Module = {
  arm: "O2",
  variants,
  final: "d4-top",
  contenders: ["d4-sq", "d4-lin", "d4-sq-thr", "gc-top"],
};
export default o2;
