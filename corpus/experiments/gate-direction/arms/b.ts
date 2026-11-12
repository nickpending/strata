/**
 * Arm B (gate-direction): gate first, then direction. Per value and channel, a noul asks whether the encounter
 * bears on that value at all, either way; a direction choice follows, chained, only for what the gate let through.
 * The idea is the "gate first" shape of docs/jev.md: step 1 found A's up and down nouls both firing on most items,
 * leaning up, so whether a value moved and which way it moved are asked as two different judgments here.
 *
 * FINAL `mg3-45`.
 *   State (both requests): A's five fields, unchanged (v3's `stateOf`, imported from a.ts): `you`, `who_you_are`,
 *     `earlier`, `now`, `your_part`. Every question opens with A's READ.
 *   Step `gate`, one request, 40 nouls, two per value-channel, each over a concrete topic (`TOPIC3`, written from
 *     the catalogue's descriptions; for a deed, the act and its opposite, e.g. security: "keeping themself or someone
 *     else out of harm's way ..., or putting themself or someone else directly in harm's way ..."):
 *       touched, stake: "Does what {o} did change this for you, for better or worse: <topic>? Answer no if it leaves
 *         that as it was, or touches you only in some other way."
 *       touched, deed: "Is what {o} did an act of <topic>? Answer no if it is neither."
 *       main, stake: "Is this one of the main ways what {o} did changes things for you: <topic>? Answer no if it
 *         changes that only a little or in passing, or not at all."
 *       main, deed: "Is this one of the main things what {o} did shows: {o} <topic>? Answer no if it shows that only
 *         a little or in passing, or not at all."
 *   Step `dir`, chained, one request: for every value-channel whose gate G reaches 0.45, a choice between two
 *     options (`DIR_OPTIONS3`, e.g. stake security: up "It makes you safer, or your home or living surer." / down
 *     "It puts you in more danger, or your home or living at risk."), asked as "What {o} did changes this for you:
 *     <topic>. Which way?" (deed: "bears on this").
 *   Reading (code): G = min(P(touched), P(main)), both nouls used as probabilities (both must hold). r = G signed
 *     by the choice's pick (+ for up, - for down) when G >= 0.45; 0 otherwise. The choice is read by its pick only
 *     (rule 6), never its probabilities.
 *
 * Dev (36 cases, 720 items, 2 reps each; M1 item rho / M2 direction / M3 gate AUC, overall, then stake | deed).
 * A `as-is` on the same dev: 0.380 / 0.882 / 0.743, stake 0.386 / 0.894 / 0.727 | deed 0.372 / 0.868 / 0.754.
 *   final `mg3-45`  0.585 / 0.876 / 0.898   stake 0.589 / 0.862 / 0.877 | deed 0.584 / 0.895 / 0.926   (45.5 q, 2.5e-4 USD)
 *   `m3-45`         0.561 / 0.894 / 0.904   stake 0.589 / 0.894 / 0.892 | deed 0.538 / 0.895 / 0.924   (26.4 q, 1.8e-4 USD)
 *   `g3-40`         0.514 / 0.929 / 0.929   stake 0.492 / 0.915 / 0.906 | deed 0.538 / 0.947 / 0.955   (28.3 q, 1.8e-4 USD)
 *   `mg3-50`        0.594 / 0.818 / 0.877   stake 0.572 / 0.766 / 0.841 | deed 0.624 / 0.882 / 0.922   (rescored, below)
 * How the final was chosen (each step a separate dev run unless marked rescored; rescored = the same logged
 * answers read with another threshold, which asks nothing new):
 *   - `g-a`, the first touched gate (`TOPIC`) asked beside A's 40 nouls, read G x (P(up) - P(down)) / (P(up) +
 *     P(down)): 0.389 / 0.882 / 0.764. The gate alone separates touched from untouched at AUC 0.85, but A's
 *     normalised direction shrinks touched items where both of A's nouls fire.
 *   - `g-ch30`, the same gate with a chained direction choice from G >= 0.3: 0.427 / 0.935 / 0.844. The choice
 *     reads direction better than A's noul pair (M2 0.935 against 0.882).
 *   - `g2-ch30`, topics narrowed where the first gate fired on most untouched items (deed self_direction fired 0.78
 *     on average, untouched; deed security, stake power, conformity): 0.465 / 0.941 / 0.895.
 *   - `m-ch30`, the main-ness gate in place of the touched gate: 0.482 / 0.947 / 0.901. The labels mark about one
 *     value per channel per case; "one of the main ways" asks for that parsimony as one literal judgment.
 *   - `m3-ch30` and `g3-ch30`, topics narrowed again to C's vocabulary (so that B and C differ in shape, not in
 *     words): 0.487 / 0.929 / 0.927 and 0.474 / 0.929 / 0.928.
 *   - Threshold, rescored on those runs: zeroing below 0.4 to 0.5 lifts M1 by 0.04 to 0.08 (M1 is a Spearman over
 *     720 items of which 635 are untouched, so exact zeros on untouched items are what lifts it; see the note at
 *     the end), and M2 falls once the threshold passes about 0.45. Rule used for every final: the highest dev M1
 *     whose dev M2 and M3 both stay at 0.85 or more (the prereg's grade bars (b) and (c)), so that a final does not
 *     buy rho by reading touched items as 0.
 *   - The two gates combined (both must hold, the lower one read) estimated at 0.569 on the m3 and g3 runs'
 *     answers; then `m3-45`, `mg3-45` and `g3-40` were run fresh on dev (the numbers in the table). `mg3-45` has
 *     the highest M1 within the rule; `mg3-50` scores higher M1 but M2 0.818, outside it.
 *
 * docs/jev.md rules it leans on: "gate first" (whether, then which way); chaining (the direction choice is asked
 * only for what the gate passed, and its pick is code's input, not Jev's); a choice for which way, never whether
 * (a choice is relative, so it is asked only after a noul has said the value is in play); composite scoring and rule
 * 1 (touched and main are two judgments asked apart and combined in code, as the lower of two probabilities); 2
 * (boundary cases in each gate's "Answer no if"); 4 (no importance reaches Jev); 6 (the choice by its pick only); 8
 * (yes always means the value is in play); 9 (no threshold carried over; 0.45 is measured on these labels).
 * Rules it bends:
 *   - 7, small state: identity and history go to every question, as in A. The stake questions need both; a deed-only
 *     smaller state was tried in arm C and read slightly worse there (C `cw-split`), so B kept one state.
 *   - 1, one judgment: a two-sided gate ("for better or worse", "an act of X, or its opposite") folds both
 *     directions into one question. That is deliberate (the gate asks whether, not which way), but it is two
 *     situations under one yes, and the touched gate keeps a floor of about 0.3 to 0.5 on untouched items.
 *   - The topics are long for a few values (security, power, conformity): each lists the kinds of act or effect that
 *     count, which rule 2 asks for, at some cost to "one snap judgment".
 *
 * Contenders: `m3-45` (main-ness gate alone, the same direction step; 20 fewer gate questions), `g3-40` (touched
 * gate alone, chained and zeroed at 0.4), `mg3-50` (the final with the threshold at 0.5: the highest dev M1 in this
 * arm, outside the M2 bar). Variants above the `// final and contenders` line in `variants` are the explored ones,
 * kept so their logged dev numbers can be reproduced.
 *
 * Note on M1. On dev, 635 of 720 items are untouched. A reading with no ties ranks every untouched item somewhere,
 * and with this label mix even a perfect order caps Spearman near 0.56; only exact zeros let the untouched items tie
 * in the middle. Most of B's lift over A on M1 comes from the gate wording (M3 0.74 to 0.90) together with reading
 * an ungated item as exactly 0.
 *
 * All wording is per value or per channel; `{o}` is the other person's name. No question, weight or threshold names
 * or special-cases a dev case, scenario or a fact only a dev scenario holds. Total dev spend for arms B and C: see
 * c.ts.
 */
import type { ArmModule, Channel, Jev, JevAnswer, JevQuestion, Variant } from "../contract.ts";
import { CHANNELS, itemKey, noul } from "../contract.ts";
import { READ, statement, stateOf } from "./a.ts";

type Dir = "up" | "down";

/**
 * Per value, what the gate asks about, concretely, after the catalogue's descriptions (world/values.toml): for
 * `stake` the holder's own share of the value, for `deed` the kind of act that bears on it, with both of its
 * sides. `{o}` is the other person's name.
 */
type Topic = { stake: string; deed: string };
const TOPIC: Record<string, Topic> = {
  self_direction: {
    stake: "your freedom to choose for yourself where you go, what you do and how you live",
    deed: "doing what they themself choose, or deciding for someone else what that person may do",
  },
  stimulation: {
    stake: "the excitement, novelty or daring challenge you have in your life",
    deed: "going after excitement, novelty or a daring challenge, or turning away from it",
  },
  hedonism: {
    stake: "your pleasures and comforts: good drink, food, fun, rest",
    deed: "going after pleasure or a good time, or giving it up",
  },
  achievement: {
    stake: "your work or business, and your name for being good at it",
    deed: "showing skill or ambition in their work, or failing at it",
  },
  power: {
    stake: "your money and goods, and your control or standing over other people",
    deed: "taking or using control over people, money or goods, or giving it up",
  },
  security: {
    stake: "your safety: danger or threats to you, being exposed to people who are after you, and how sure your home and your living are",
    deed: "keeping someone safe from danger, or putting someone in danger",
  },
  conformity: {
    stake: "your keeping to the rules, to your word and to what others expect of you",
    deed: "doing what was asked of them, owed or expected, or breaking a rule, an order or a deal",
  },
  tradition: {
    stake: "the customs and rituals you keep",
    deed: "keeping a custom or tradition, or breaking with one",
  },
  benevolence: {
    stake: "the welfare of someone close to you (not you yourself): a friend, someone who relies on you, or someone you rely on",
    deed: "helping or standing by someone close to them, or letting them down or hurting them",
  },
  universalism: {
    stake: "the welfare of people beyond your own circle: strangers, the weak, many people",
    deed: "protecting or helping strangers or the weak, or hurting or exploiting them",
  },
};

/** Second wording: the first's false fires (dev) narrowed, per value and channel. Everything else is the first's. */
const TOPIC2: Record<string, Topic> = {
  ...TOPIC,
  self_direction: {
    stake: TOPIC.self_direction!.stake,
    deed: "insisting on their own choice against what someone else wanted, or giving up their own choice to someone else",
  },
  achievement: {
    stake: "how your own work or business is going, and your name for being good at it",
    deed: TOPIC.achievement!.deed,
  },
  power: {
    stake: "your money and goods, and your hold over other people: whether they obey, defer to or defy you",
    deed: "giving orders, making demands, forbidding, taking from someone or pushing them aside, or giving up control or submitting to someone",
  },
  security: {
    stake: "your own safety: threats to you, people who are after you finding you, and whether your shelter and the money you live on are sure",
    deed: "taking care to keep themself or someone else safe, or taking a risk with their own or someone else's safety",
  },
  conformity: {
    stake: "whether you yourself are pushed to break, or helped to keep, a rule, an order or a promise you are under",
    deed: "doing or paying what was asked, ordered or owed of them, or defying it, breaking a rule or a deal, or offending people",
  },
};
type Wording = Record<string, Topic>;

function topicOf(id: string, ch: Channel, T: Wording = TOPIC): string {
  const t = T[id];
  if (!t) throw new Error(`no topic for ${id}`);
  return t[ch];
}

/** The per value-channel gate: does the encounter bear on this at all, either way. */
function gateQ(id: string, o: string, ch: Channel, T: Wording = TOPIC): JevQuestion {
  const topic = (i: string, c: Channel) => topicOf(i, c, T);
  return {
    type: "noul",
    instructions:
      ch === "stake"
        ? `${READ} Does what ${o} did change this for you, for better or worse: ${topic(id, ch)}? Answer no if it leaves that as it was, or touches you only in some other way.`
        : `${READ} Is what ${o} did an act of ${topic(id, ch)}? Answer no if it is neither.`,
  };
}

/** The main-ness gate: is this one of the main ways the encounter bears on the holder (or what the act shows). */
function mainQ(id: string, o: string, ch: Channel, T: Wording): JevQuestion {
  return {
    type: "noul",
    instructions:
      ch === "stake"
        ? `${READ} Is this one of the main ways what ${o} did changes things for you: ${topicOf(id, ch, T)}? Answer no if it changes that only a little or in passing, or not at all.`
        : `${READ} Is this one of the main things what ${o} did shows: ${o} ${topicOf(id, ch, T)}? Answer no if it shows that only a little or in passing, or not at all.`,
  };
}

/** The direction choice, asked only for what the gate let through: which way, given it bears on it. */
const DIR_OPTIONS: Record<string, { stake: Record<Dir, string>; deed: (o: string) => Record<Dir, string> }> = {
  self_direction: {
    stake: { up: "It gives you more freedom to choose for yourself.", down: "It takes a choice away from you, or tells you what you may or must do." },
    deed: (o) => ({ up: `${o} did what they themself chose.`, down: `${o} decided for someone else what that person may or must do.` }),
  },
  stimulation: {
    stake: { up: "It brings excitement, novelty or a challenge into your life.", down: "It takes excitement, novelty or a challenge out of your life." },
    deed: (o) => ({ up: `${o} went after excitement, novelty or a daring challenge.`, down: `${o} turned away from excitement or risk.` }),
  },
  hedonism: {
    stake: { up: "It gives you a pleasure or comfort.", down: "It takes a pleasure or comfort away from you." },
    deed: (o) => ({ up: `${o} went after pleasure or a good time.`, down: `${o} gave up pleasure or a good time.` }),
  },
  achievement: {
    stake: { up: "It helps your work, business or name for being good at it.", down: "It hurts your work, business or name for being good at it." },
    deed: (o) => ({ up: `${o} showed skill or ambition in their work.`, down: `${o} failed at their work, or passed up a chance to get ahead.` }),
  },
  power: {
    stake: { up: "It gives you money, goods, or more control or standing over others.", down: "It costs you money, goods, or control or standing over others." },
    deed: (o) => ({ up: `${o} took or used control over people, money or goods.`, down: `${o} gave up control over people, money or goods, or bowed to someone.` }),
  },
  security: {
    stake: { up: "It makes you safer, or your home or living surer.", down: "It puts you in more danger, or your home or living at risk." },
    deed: (o) => ({ up: `${o} kept someone safe from danger.`, down: `${o} put someone in danger.` }),
  },
  conformity: {
    stake: { up: "It helps you keep to the rules, your word or what is expected of you.", down: "It pushes you to break a rule, your word or what is expected of you." },
    deed: (o) => ({ up: `${o} did what was asked of them, owed or expected.`, down: `${o} broke a rule, an order or a deal, or upset people.` }),
  },
  tradition: {
    stake: { up: "It honours a custom or ritual you keep.", down: "It breaks or stops a custom or ritual you keep." },
    deed: (o) => ({ up: `${o} kept a custom or tradition.`, down: `${o} broke with a custom or tradition.` }),
  },
  benevolence: {
    stake: { up: "It helps someone close to you.", down: "It harms, endangers or shames someone close to you." },
    deed: (o) => ({ up: `${o} helped or stood by someone close to them.`, down: `${o} let down, betrayed or hurt someone close to them.` }),
  },
  universalism: {
    stake: { up: "It helps or protects people beyond your own circle.", down: "It harms people beyond your own circle." },
    deed: (o) => ({ up: `${o} protected or helped strangers or the weak.`, down: `${o} hurt or exploited strangers or the weak.` }),
  },
};

/** Options to match the second wording's narrowed topics. */
const DIR_OPTIONS2: typeof DIR_OPTIONS = {
  ...DIR_OPTIONS,
  self_direction: {
    stake: DIR_OPTIONS.self_direction!.stake,
    deed: (o) => ({ up: `${o} insisted on their own choice against what someone else wanted.`, down: `${o} gave up their own choice to someone else.` }),
  },
  power: {
    stake: { up: "Others obey or defer to you more, or you gain money or goods.", down: "Someone defies, ignores or pushes you aside, or you lose money or goods." },
    deed: (o) => ({ up: `${o} gave orders, made demands, forbade, took from someone or pushed them aside.`, down: `${o} gave up control or submitted to someone.` }),
  },
  security: {
    stake: DIR_OPTIONS.security!.stake,
    deed: (o) => ({ up: `${o} took care to keep themself or someone else safe.`, down: `${o} took a risk with their own or someone else's safety.` }),
  },
  conformity: {
    stake: { up: "It helps you keep a rule, an order or a promise you are under.", down: "It pushes you to break a rule, an order or a promise you are under." },
    deed: (o) => ({ up: `${o} did or paid what was asked, ordered or owed of them.`, down: `${o} defied what was asked or ordered, broke a rule or a deal, or offended people.` }),
  },
};

/**
 * Third wording: C's narrowed statements (c.ts S3) for self_direction (deed), achievement, power (stake) and security
 * (deed), and the narrowed conformity deed, each made two-sided, so B and C differ in shape and not in vocabulary.
 */
const TOPIC3: Wording = {
  ...TOPIC2,
  self_direction: {
    stake: TOPIC.self_direction!.stake,
    deed: "claiming freedom over their own life or movements from someone's hold over them, or giving it up to someone else's say",
  },
  achievement: {
    stake: "success or setbacks at your own work or trade, and praise or scorn for your skill at it",
    deed: "showing a success they won by their own skill, or a failure at their own work",
  },
  power: {
    stake: "your standing and your hold over other people: whether they obey you, pay what you demanded and defer to you, or defy you, ignore you, go over your head or take your place",
    deed: TOPIC2.power!.deed,
  },
  security: {
    stake: TOPIC2.security!.stake,
    deed: "keeping themself or someone else out of harm's way (hiding them, covering tracks, keeping them from danger), or putting themself or someone else directly in harm's way (sending them into danger, exposing them, walking into danger)",
  },
  conformity: {
    stake: TOPIC2.conformity!.stake,
    deed: "obeying an order, paying a debt or a demanded price, or keeping to a rule they are under; or disobeying, refusing a debt or demanded price, breaking a rule, or insulting or shaming someone in front of others",
  },
};
const DIR_OPTIONS3: typeof DIR_OPTIONS = {
  ...DIR_OPTIONS2,
  self_direction: {
    stake: DIR_OPTIONS.self_direction!.stake,
    deed: (o) => ({ up: `${o} claimed freedom over their own life or movements.`, down: `${o} gave up freedom over their own life or movements to someone else's say.` }),
  },
  achievement: {
    stake: { up: "A success at your work or trade, or praise for your skill.", down: "A setback at your work or trade, or scorn for your skill." },
    deed: (o) => ({ up: `${o} showed a success won by their own skill.`, down: `${o} showed a failure at their own work.` }),
  },
  power: {
    stake: { up: "Others obey you, pay what you demanded or defer to you.", down: "Someone defies you, ignores you, goes over your head or takes your place." },
    deed: DIR_OPTIONS2.power!.deed,
  },
  security: {
    stake: DIR_OPTIONS.security!.stake,
    deed: (o) => ({ up: `${o} kept themself or someone else out of harm's way.`, down: `${o} put themself or someone else in harm's way.` }),
  },
  conformity: {
    stake: DIR_OPTIONS2.conformity!.stake,
    deed: (o) => ({ up: `${o} obeyed, paid what was owed or demanded, or kept to a rule.`, down: `${o} disobeyed, refused what was owed, broke a rule, or insulted or shamed someone.` }),
  },
};

function dirQ(id: string, o: string, ch: Channel, T: Wording = TOPIC, OPT = DIR_OPTIONS): JevQuestion {
  const topic = (i: string, c: Channel) => topicOf(i, c, T);
  const w = OPT[id];
  if (!w) throw new Error(`no options for ${id}`);
  const criteria = ch === "stake" ? w.stake : w.deed(o);
  return {
    type: "choice",
    instructions:
      ch === "stake"
        ? `${READ} What ${o} did changes this for you: ${topic(id, ch)}. Which way?`
        : `${READ} What ${o} did bears on this: ${topic(id, ch)}. Which way?`,
    criteria,
  };
}

const gk = (ch: Channel, id: string) => `${ch}__${id}__gate`;
const mk = (ch: Channel, id: string) => `${ch}__${id}__main`;
const dk = (ch: Channel, id: string, d: Dir) => `${ch}__${id}__${d}`;
const choiceOf = (a: JevAnswer | undefined): string => {
  if (!a || !("choice" in a)) throw new Error("not a choice answer");
  return a.choice;
};

/** Gate nouls, plus A's 40 one-sided nouls in the same request; direction = (P(up) - P(down)) / (P(up) + P(down)). */
function gateWithA(): Variant["judge"] {
  return async (c, values, jev) => {
    const s = stateOf(c);
    const o = c.other.name;
    const qs: Record<string, JevQuestion> = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        qs[gk(ch, v.id)] = gateQ(v.id, o, ch);
        for (const d of ["up", "down"] as Dir[])
          qs[dk(ch, v.id, d)] = { type: "noul", instructions: `${READ} ${statement(v.id, o, ch, d)}` };
      }
    const a = await jev("gate", s, qs);
    const r: Record<string, number> = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        const u = noul(a[dk(ch, v.id, "up")]);
        const w = noul(a[dk(ch, v.id, "down")]);
        r[itemKey(ch, v.id)] = noul(a[gk(ch, v.id)]) * (u + w > 0 ? (u - w) / (u + w) : 0);
      }
    return r;
  };
}

type Gate = "touched" | "main" | "both";

/**
 * Gate nouls (`touched`: does it change this, either way; `main`: is this one of the main ways; `both`: the two
 * asked side by side and read as the lower of the two); then, chained, a direction choice for every value-channel
 * whose gate reaches `from`. Reading: the gate's probability, signed by the choice's pick; 0 where no choice was
 * asked.
 */
function gateThenChoice(from: number, T: Wording, OPT: typeof DIR_OPTIONS, gate: Gate): Variant["judge"] {
  return async (c, values, jev: Jev) => {
    const s = stateOf(c);
    const o = c.other.name;
    const qs: Record<string, JevQuestion> = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        qs[gk(ch, v.id)] = gate === "main" ? mainQ(v.id, o, ch, T) : gateQ(v.id, o, ch, T);
        if (gate === "both") qs[mk(ch, v.id)] = mainQ(v.id, o, ch, T);
      }
    const g = await jev("gate", s, qs);
    const G = (ch: Channel, id: string) =>
      gate === "both" ? Math.min(noul(g[gk(ch, id)]), noul(g[mk(ch, id)])) : noul(g[gk(ch, id)]);
    const dq: Record<string, JevQuestion> = {};
    for (const ch of CHANNELS)
      for (const v of values) if (G(ch, v.id) >= from) dq[`${ch}__${v.id}__dir`] = dirQ(v.id, o, ch, T, OPT);
    const d = Object.keys(dq).length ? await jev("dir", s, dq) : {};
    const r: Record<string, number> = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        const k = `${ch}__${v.id}__dir`;
        r[itemKey(ch, v.id)] = k in dq ? G(ch, v.id) * (choiceOf(d[k]) === "up" ? 1 : -1) : 0;
      }
    return r;
  };
}

const variants: Variant[] = [
  // explored on dev, not kept
  { id: "g-a", judge: gateWithA() },
  { id: "g-ch30", judge: gateThenChoice(0.3, TOPIC, DIR_OPTIONS, "touched") },
  { id: "g2-ch30", judge: gateThenChoice(0.3, TOPIC2, DIR_OPTIONS2, "touched") },
  { id: "m-ch30", judge: gateThenChoice(0.3, TOPIC2, DIR_OPTIONS2, "main") },
  { id: "m3-ch30", judge: gateThenChoice(0.3, TOPIC3, DIR_OPTIONS3, "main") },
  { id: "g3-ch30", judge: gateThenChoice(0.3, TOPIC3, DIR_OPTIONS3, "touched") },
  // final and contenders
  { id: "m3-45", judge: gateThenChoice(0.45, TOPIC3, DIR_OPTIONS3, "main") },
  { id: "mg3-45", judge: gateThenChoice(0.45, TOPIC3, DIR_OPTIONS3, "both") },
  { id: "g3-40", judge: gateThenChoice(0.4, TOPIC3, DIR_OPTIONS3, "touched") },
  { id: "mg3-50", judge: gateThenChoice(0.5, TOPIC3, DIR_OPTIONS3, "both") },
];

const arm: ArmModule = { arm: "B", variants, final: "mg3-45", contenders: ["m3-45", "g3-40", "mg3-50"] };
export default arm;
