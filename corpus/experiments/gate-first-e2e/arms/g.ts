/**
 * Arm G (gate-first-e2e): design B with gate-direction's gate-first per-value stage in place of its 40 up and down
 * nouls; the size step, touches and the combine are design B's (the last is the contract's, not this file's).
 *
 * FINAL `m3-45`: gate-direction B's `m3-45`, imported as it stands (its judge is called; nothing retyped).
 *   State (every request): v3's five fields, `stateOf` from `../../gate-direction/arms/a.ts`: `you`, `who_you_are`,
 *     `earlier`, `now`, `your_part`. Every question opens with A's READ.
 *   Step `gate`, 20 nouls, one per value and channel, the main-ness gate over gate-direction's `TOPIC3`:
 *     stake "Is this one of the main ways what {o} did changes things for you: <topic>? Answer no if it changes that
 *     only a little or in passing, or not at all."; deed "Is this one of the main things what {o} did shows: {o}
 *     <topic>? Answer no if it shows that only a little or in passing, or not at all."
 *   Step `touches`, in parallel with `gate`, on the same state: `arms/b.ts` `TOUCHES` (v3's noul), alone.
 *   Step `dir`, chained: for every value-channel whose gate G reaches 0.45, gate-direction B's direction choice
 *     (`DIR_OPTIONS3`, "What {o} did changes this for you: <topic>. Which way?"; deed "bears on this").
 *   Step `how`, chained after `dir`: for every item with r != 0, `arms/b.ts` `strength4` (v3's 3-level strength
 *     score) on v3's statement of the picked direction (up when r > 0).
 *   Reading (code): r = G signed by the choice's pick (read by its pick only), 0 below 0.45 (gate-direction B's
 *     reading, from its judge); L = `levelOf` the strength answer (1, 2 or 3, most probable level); effect = r * L.
 *     touches = P(touches). The contract's `combine` does the rest.
 * The contenders' gates: `m3-35` the same main-ness gate at 0.35 (`gateThenChoice` copied below, since no 0.35
 * variant is exported); `mg3-45` touched and main both asked, read as the lower (imported); `g3-40` the touched gate,
 * "Does what {o} did change this for you, for better or worse: <topic>? ..." / "Is what {o} did an act of <topic>?
 * Answer no if it is neither." (imported). Wording is gate-direction B's, unchanged; the copy (lines 89-332 and
 * 358-391 of its b.ts) was taken by line range and diffed equal to the source.
 *
 * Dev (40 cases, 28 scenarios, 800 items; E3 decides). B-lin is the orchestrator's dev run of arm B, scored beside.
 * Four reps for the final and contenders: two fresh (run `dev-g-fresh`) and two rescored from the exploration run.
 *   E1 / E2 / E3 / E4 (build, detract) / P1 (stake | deed) / P2 among fired / questions, USD per judgment
 *   B-lin            26/35  6/12  0.515  0.378 (0.383, 0.373)  0.698 (0.624 | 0.780)  50/51 98%  56.1 q, 2.5e-4
 *   final `m3-45`    24/35  5/12  0.456  0.394 (0.350, 0.438)  0.801 (0.768 | 0.843)  57/71 80%  34.1 q, 2.6e-4
 *   `m3-35`          23/35  4/12  0.454  0.403 (0.371, 0.434)  0.829 (0.802 | 0.864)  58/73 79%  39.2 q, 2.9e-4
 *   `g3-40`          23/35  4/12  0.443  0.378 (0.348, 0.408)  0.830 (0.789 | 0.872)  63/79 80%  37.9 q, 2.8e-4
 *   `mg3-45`         22/35  5/12  0.431  0.366 (0.378, 0.353)  0.787 (0.739 | 0.843)  54/66 82%  52.8 q, 3.4e-4
 *   G-sq (the final's answers, squared weights) E3 0.478.
 * How the final was chosen:
 *   - Exploration run (`dev-g-explore`, 2 reps): `g3-30` (gate-direction's `g3-ch30`, imported), `m3-30` (`m3-ch30`,
 *     imported) and `mg3-35` (the copy at 0.35, both gates), each with the size step on every item that passed.
 *     Each run then read at 0.35, 0.40, 0.45, 0.50 and 0.55 by zeroing |r| below the threshold, which asks nothing
 *     new (the `dir` and `how` answers for items above it are already logged). E3 per threshold 0.35 to 0.55:
 *     touched 0.442 0.435 0.423 0.422 0.424; main 0.474 0.465 0.466 0.418 0.394; both 0.440 0.447 0.445 0.402 0.427.
 *     Every reading sits below B-lin's 0.515. Lower thresholds lift P1 (0.75 to 0.85) without moving E3 much; above
 *     0.45 E3 and E4 fall on main and both.
 *   - Within 0.02 of the best in range (main at 0.35, 0.474): main at 0.40 and 0.45. Fewest questions: `m3-45`.
 *   - A fresh dev run of `m3-45`, `m3-35`, `mg3-45` and `g3-40` read 0.447, 0.431, 0.440 and 0.447; over both runs
 *     (the table) `m3-45` stays highest and asks fewest, so it is the final. `mg3-45`, gate-direction's own
 *     per-value final, is a contender to show what the second gate buys at case level; `g3-40` the touched gate.
 * Where G loses on dev (stage attribution, the scorer's): direction, not the gate. G's direction oracle lifts its E3
 * from 0.456 to 0.687, its gate oracle only to 0.506 (B's own gate oracle lowers B to 0.420). Among items G fires
 * at |r| >= 0.5, its direction is right on 80% against B's 98% on far fewer: power 11/15 and security 18/26. The
 * direction choice's wording is gate-direction's and is not a knob here.
 *
 * No arm C. gate-direction C's `cw3-z50` with the same size step, touches and combine, run on dev (2 reps, 0.019
 * USD, in `dev-g-fresh`), read E1 21/35, E2 4/12, E3 0.428, E4 0.395 (0.320, 0.470), P1 0.764, P2 63/74 (85%), 47.2
 * q, 2.3e-4 USD. It is below G on E3 (by 0.028), E1 and P1; its only edges are direction among fired (+5 points) and
 * within-detract rho, neither of which lifts the deciding metric, so it adds nothing G does not.
 *
 * docs/jev.md rules it leans on: "gate first" (whether, as a noul, before which way); chaining (`dir` only for what
 * passed the gate, `how` only for what `dir` picked, each answer code's input); a choice for which way, never
 * whether; batching (one request per step, `touches` in parallel on the same state); 4 (no importance reaches Jev);
 * 6 (the choice and the strength score read by their most probable option or level only, never interpolated); 8;
 * 9 (no threshold carried over: 0.45 is measured on this experiment's dev). Rules it bends:
 *   - 7, small state: identity and history go to every question, as in gate-direction B and design B; the stake
 *     questions need them, and gate-direction measured a smaller deed state as worse.
 *   - 1, one judgment: the gate's "main way" folds both directions into one yes, by design (whether, not which way).
 *   - The size step asks v3's one-sided statement of the picked direction, not gate-direction's topic: the prereg
 *     fixes the same size step as design B's, so the statement wording differs between `dir` and `how`.
 *
 * All wording is per value or per channel; `{o}` is the other person's name. No question, weight or threshold names
 * or special-cases a dev case, scenario or a fact only a dev scenario holds. Variants above `// final and
 * contenders` are the exploration runs, kept so their logged dev numbers can be reproduced. 7 variants.
 *
 * Dev spend: 0.195 USD of the 0.40 cap (smoke 0.001; exploration 0.081; fresh G and C 0.112).
 */
import { READ, stateOf } from "../../gate-direction/arms/a.ts";
import gd from "../../gate-direction/arms/b.ts";
import type { Variant } from "../../gate-direction/contract.ts";
import type { ArmModule, Channel, Jev, JevAnswer, JevQuestion, Judged, Variant as Arm } from "../contract.ts";
import { CHANNELS, itemKey, noul } from "../contract.ts";
import { key4, levelOf, strength4, TOUCHES } from "./b.ts";

// ---------- copied from ../../gate-direction/arms/b.ts (lines 89-332 and 358-391), character for character ----------

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

// ---------- end of copy ----------

/** gate-direction B's variant `id`, imported as it stands (its judge returns the per-value reading r per item). */
function imported(id: string): Variant["judge"] {
  const v = gd.variants.find((x) => x.id === id);
  if (!v) throw new Error(`gate-direction B has no variant ${id}`);
  return v.judge;
}

/**
 * The per-value stage `perValue` (gate, then the chained direction choice), with touches asked beside it on the same
 * state, then the size step chained after the direction step: for every item with r != 0, v3's strength score on the
 * statement of the picked direction (up when r > 0), in one request `how`. effect = r * L, L = 1, 2 or 3.
 */
function withSize(perValue: Variant["judge"]): Arm["judge"] {
  return async (c, values, jev: Jev): Promise<Judged> => {
    const s = stateOf(c);
    const o = c.other.name;
    const [r, t] = await Promise.all([perValue(c, values, jev), jev("touches", s, { touches: TOUCHES })]);
    const how: Record<string, JevQuestion> = {};
    const dirOf = (x: number): Dir => (x > 0 ? "up" : "down");
    for (const ch of CHANNELS)
      for (const v of values) {
        const x = r[itemKey(ch, v.id)] ?? 0;
        if (x !== 0) how[key4(ch, v.id, dirOf(x))] = strength4(v.id, o, ch, dirOf(x));
      }
    const h = Object.keys(how).length ? await jev("how", s, how) : {};
    const items: Judged["items"] = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        const x = r[itemKey(ch, v.id)] ?? 0;
        items[itemKey(ch, v.id)] = { r: x, effect: x === 0 ? 0 : x * levelOf(h[key4(ch, v.id, dirOf(x))]) };
      }
    return { items, touches: noul(t.touches) };
  };
}

const variants: Arm[] = [
  // explored on dev (asked low, read at higher thresholds by zeroing |r| below them)
  { id: "g3-30", judge: withSize(imported("g3-ch30")) },
  { id: "m3-30", judge: withSize(imported("m3-ch30")) },
  { id: "mg3-35", judge: withSize(gateThenChoice(0.35, TOPIC3, DIR_OPTIONS3, "both")) },
  // final and contenders
  { id: "m3-45", judge: withSize(imported("m3-45")) },
  { id: "m3-35", judge: withSize(gateThenChoice(0.35, TOPIC3, DIR_OPTIONS3, "main")) },
  { id: "mg3-45", judge: withSize(imported("mg3-45")) },
  { id: "g3-40", judge: withSize(imported("g3-40")) },
];

const arm: ArmModule = { arm: "G", variants, final: "m3-45", contenders: ["m3-35", "mg3-45", "g3-40"] };
export default arm;
