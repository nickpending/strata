/**
 * Arm C (gate-direction): narrow, literal, one-sided statements. A's shape (per value and channel, an up noul and a
 * down noul, no separate gate), with every statement rewritten as a concrete situation against the catalogue's
 * description, each with the boundary that keeps it from firing on a general good or bad turn. The idea: step 1's
 * misses are misreads with the facts in the state and the nouls fire on most values, so the statements themselves
 * should be the gate, by asking what the act literally does to the holder or what it literally is, and nothing
 * broader. B asks whether and which way as two judgments; C keeps one judgment per statement and narrows it.
 *
 * FINAL `cw3-z50`.
 *   State (one request, step `both`): A's five fields, unchanged: `you`, `who_you_are`, `earlier`, `now`,
 *     `your_part`. Every question opens with A's READ.
 *   Questions: 40 nouls, `${READ} ${statement}`, per value (catalogue order), channel and direction (`S3`):
 *     stake: "Does `now` ...?" about the holder's own share, e.g. security up "Does `now` make you safer: a danger
 *       or threat to you lifted, or the shelter or money you live on made surer?", down "... put you in more danger:
 *       a threat to you, people who are after you or watching you brought closer, or the shelter or money you live
 *       on put at risk?"; benevolence down "... harm, endanger, shame or deprive someone close to you, other than
 *       you? Answer no if the harm falls only on you."; hedonism down ends "Answer no if it only worries, angers or
 *       shames you."; power is standing and hold over people (obeyed, paid what you demanded, deferred to / defied,
 *       ignored, gone over your head, replaced).
 *     deed: "In `now`, did {o} ...?" about the act, e.g. conformity up "... obey an order, pay a debt or a demanded
 *       price, or keep to a rule they are under?", down "... disobey an order, refuse a debt or a demanded price,
 *       break a rule, or insult or shame someone in front of others?"; security "... keep themself or someone else
 *       out of harm's way ..." / "... put themself or someone else directly in harm's way ..."; self_direction
 *       "... claim freedom over their own life or movements, breaking from someone's hold over them?"
 *   Reading (code): m = max(P(up), P(down)), both nouls used as probabilities. r = 0 when m < 0.5; otherwise
 *     +P(up) when P(up) > P(down), -P(down) when P(down) > P(up) (the stronger statement, signed by which it is).
 *
 * Dev (36 cases, 720 items, 2 reps each; M1 item rho / M2 direction / M3 gate AUC, overall, then stake | deed).
 * A `as-is` on the same dev: 0.380 / 0.882 / 0.743, stake 0.386 / 0.894 / 0.727 | deed 0.372 / 0.868 / 0.754.
 *   final `cw3-z50` 0.603 / 0.906 / 0.926   stake 0.553 / 0.872 / 0.893 | deed 0.664 / 0.947 / 0.960   (40 q, 1.5e-4 USD)
 *   `cw3-z60`       0.629 / 0.794 / 0.871   stake 0.578 / 0.766 / 0.845 | deed 0.686 / 0.829 / 0.897   (rescored)
 *   `cw-z50`        0.549 / 0.894 / 0.886   stake 0.538 / 0.894 / 0.883 | deed 0.553 / 0.895 / 0.888   (rescored)
 * How the final was chosen (each step a separate dev run unless marked rescored; rescored = the same logged
 * answers read with another threshold, which asks nothing new):
 *   - `cw`, the first concrete wording (`S`), read P(up) - P(down): 0.452 / 0.947 / 0.853 (A: 0.380 / 0.882 /
 *     0.743). Wording alone lifts the gate (M3) by 0.11 and direction by 0.07.
 *   - `cw-split`, the same with deed asked on its own small state (`you`, `earlier`, `now`; rule 7): 0.436 / 0.929 /
 *     0.846. Deed fell (M1 0.461 to 0.426), so one state stays.
 *   - `cw2`, the statements that fired most on untouched items narrowed (deed self_direction, achievement both
 *     channels, stake power, deed security): 0.468 / 0.947 / 0.891. Read max-signed and zeroed below 0.5,
 *     rescored: 0.595.
 *   - `cw3`, conformity deed narrowed to orders, debts, rules and public insult: 0.464 / 0.941 / 0.904; rescored
 *     max-signed and zeroed below 0.5: 0.607 / 0.906 / 0.926.
 *   - Threshold and reading, rescored on the final run's answers (the `cw3` questions): max-signed reads 0.001 to
 *     0.012 above P(up) - P(down) at every threshold. Zeroing below 0.4 / 0.45 / 0.5 / 0.55 / 0.6 gives M1 0.56 / 0.58 / 0.60 / 0.61 / 0.63 and M2 0.93 /
 *     0.92 / 0.91 / 0.87 / 0.79. Rule used (as in B): the highest dev M1 whose M2 and M3 both stay at 0.85 or more.
 *     0.55 meets it on one run (M2 0.865) and misses it on the other (0.853), for +0.01 M1, a lift no larger than
 *     the run-to-run spread, so 0.5 stays.
 *   - `cw3-z50` then run fresh on dev: the table's numbers (the selection run read 0.607 / 0.906 / 0.926).
 *
 * docs/jev.md rules it leans on: 1 (one literal one-sided statement per noul; the kinds of situation listed under
 * a statement are instances of that one judgment); 2 (literal reading, with the boundary case written into the
 * question: "Answer no if the harm falls only on you", "Answer no for danger or trouble you did not choose"); 3 (the
 * deed statements ask what the act was, not what it shows about character); 4 (no importance reaches Jev); 8 (yes
 * always means the statement holds); 9 (up and down are separate absolute questions, never read as each other's
 * negation; the 0.5 zero is measured here, not carried over); batching (one request). Rules it bends:
 *   - 7, small state: identity and history go to all 40 nouls, deed ones included; the measured smaller deed state
 *     read worse (above).
 *   - "Gate first": there is no separate gate; the stronger of the two one-sided nouls is the gate, and the zero
 *     below 0.5 makes it a hard one.
 *   - The statements were narrowed by looking at which ones fired on untouched dev items. Each change is per value
 *     and channel and names kinds of situation, never a person, place, item or event of a scenario; still, the
 *     wording is fitted to 12 dev scenarios. The contender `cw-z50` keeps the first wording, written before any dev
 *     answer was read, as a check on that fit.
 *
 * Contenders: `cw3-z60` (the final's questions zeroed below 0.6: the highest dev M1 in this arm, outside the M2
 * bar), `cw-z50` (the first wording, read as the final). Variants above the `// final and contenders` line in
 * `variants` are the explored ones, kept so their logged dev numbers can be reproduced.
 *
 * Note on M1. On dev, 635 of 720 items are untouched; a reading with no ties caps Spearman near 0.56 with this label
 * mix, so exact zeros on untouched items carry much of M1. The final run's answers read without the zero score
 * 0.478 (max-signed) or 0.466 (P(up) - P(down)), against A's 0.380; the zero adds 0.12 to 0.14. A's own answers,
 * zeroed and read the same way, score 0.406 (M2 0.753).
 *
 * All wording is per value or per channel; `{o}` is the other person's name. No question, weight or threshold names
 * or special-cases a dev case, scenario or a fact only a dev scenario holds.
 *
 * Dev spend, arms A, B and C together: 0.196 USD of the 0.40 cap (A 0.010; B and C 0.186 over five runs).
 */
import type { ArmModule, BuiltCase, Channel, JevQuestion, JevState, Variant } from "../contract.ts";
import { CHANNELS, itemKey, noul } from "../contract.ts";

type Dir = "up" | "down";

// ---------- states ----------

/** The stake state: v3's five fields (the holder's share of a value rests on who they are and what came before). */
function stakeState(c: BuiltCase): JevState {
  return {
    you: c.holder.name,
    who_you_are: c.identity,
    earlier: c.history.length ? c.history.map((h) => h.text) : ["(nothing yet)"],
    now: c.event,
    your_part:
      c.role === "direct" ? `${c.other.name} did this with you directly.` : `You saw this; it was not aimed at you.`,
  };
}

/** The deed state: what the other did, with what was said just before it. No identity, no part (rule 7). */
function deedState(c: BuiltCase): JevState {
  return {
    you: c.holder.name,
    earlier: c.history.length ? c.history.map((h) => h.text) : ["(nothing yet)"],
    now: c.event,
  };
}

const READ_STAKE =
  "`now` is the latest thing that happened. Take it together with what was said just before it in `earlier`, and read it from your side (`you`, `who_you_are`, `your_part`).";
const READ_DEED =
  "`now` is the latest thing that happened (`you` is the reader). Take it together with what was said just before it in `earlier`.";

// ---------- statements ----------

type Statements = { stake: Record<Dir, string>; deed: (o: string) => Record<Dir, string> };

/**
 * Per value, four one-sided literal statements, concrete against the catalogue's descriptions (world/values.toml),
 * each with the boundary that keeps it from firing on a general good or bad turn (rule 2).
 */
const S: Record<string, Statements> = {
  self_direction: {
    stake: {
      up: "Does `now` give you a new choice, or free you to go where you want, do what you want or live as you want?",
      down: "Does `now` take away a choice you had, or order or force you where to go, what to do or how to live?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} insist on their own choice against what someone else wanted?`,
      down: `In \`now\`, did ${o} give up their own choice and let someone else decide for them?`,
    }),
  },
  stimulation: {
    stake: {
      up: "Does `now` offer you something exciting, new or daring to do that you would want to take on? Answer no for danger or trouble you did not choose.",
      down: "Does `now` take away, or keep you from, something exciting or new you wanted to do?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} choose something exciting, risky or daring for the thrill of it?`,
      down: `In \`now\`, did ${o} turn down something exciting or daring to stay safe?`,
    }),
  },
  hedonism: {
    stake: {
      up: "Does `now` give you something to enjoy: a treat, a drink, fun, entertainment, comfort or rest? Answer no if it only eases a worry.",
      down: "Does `now` take from you, or keep you from, something to enjoy: a treat, a drink, fun, entertainment, comfort or rest? Answer no if it only worries, angers or shames you.",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} go after a pleasure or a good time for themself?`,
      down: `In \`now\`, did ${o} give up a pleasure or a good time?`,
    }),
  },
  achievement: {
    stake: {
      up: "Does `now` help your own work or business succeed, or raise your name for being good at what you do?",
      down: "Does `now` make your own work or business fail or go harder, or hurt your name for being good at what you do?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} show skill or success at their own work, or ambition to get ahead?`,
      down: `In \`now\`, did ${o} fail at their own work, or pass up a chance to get ahead?`,
    }),
  },
  power: {
    stake: {
      up: "Does `now` hand you money or goods, or show someone obeying you or giving way to you?",
      down: "Does `now` cost you money or goods, or show someone defying you, ignoring you, going over your head or taking over from you?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} use or claim control over someone or something: give orders, make demands, forbid, take from someone or push them aside?`,
      down: `In \`now\`, did ${o} give up control or standing, or submit to someone?`,
    }),
  },
  security: {
    stake: {
      up: "Does `now` make you safer: a danger or threat to you lifted, or the shelter or money you live on made surer?",
      down: "Does `now` put you in more danger: a threat to you, people who are after you or watching you brought closer, or the shelter or money you live on put at risk?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} take care to keep themself or someone else safe from danger?`,
      down: `In \`now\`, did ${o} take a risk with their own or someone else's safety, or bring danger closer to someone?`,
    }),
  },
  conformity: {
    stake: {
      up: "Does `now` help you keep a rule, an order or a promise you are under?",
      down: "Does `now` push or force you to break a rule, an order or a promise you are under?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} do what was asked, ordered or owed of them: obey, pay, or keep to a rule or a deal?`,
      down: `In \`now\`, did ${o} disobey, break a rule or a deal, or say something that offends or shames someone?`,
    }),
  },
  tradition: {
    stake: {
      up: "Does `now` honour a custom or ritual that you yourself keep?",
      down: "Does `now` stop you from keeping, or mock, a custom or ritual that you yourself keep?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} keep a custom or tradition?`,
      down: `In \`now\`, did ${o} break with a custom or tradition?`,
    }),
  },
  benevolence: {
    stake: {
      up: "Does `now` help or protect someone close to you, other than you? Answer no if the help goes only to you.",
      down: "Does `now` harm, endanger, shame or deprive someone close to you, other than you? Answer no if the harm falls only on you.",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} help, stand up for, give to or protect someone close to them?`,
      down: `In \`now\`, did ${o} betray, hurt or let down someone close to them?`,
    }),
  },
  universalism: {
    stake: {
      up: "Does `now` help or protect strangers, the weak or many people outside your own circle?",
      down: "Does `now` harm or endanger strangers, the weak or many people outside your own circle?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} help or protect strangers, the weak or people outside their own circle?`,
      down: `In \`now\`, did ${o} hurt, cheat or exploit strangers, the weak or people outside their own circle?`,
    }),
  },
};

/** Second wording: the first's most frequent false fires on dev narrowed, per value and channel. */
const S2: Record<string, Statements> = {
  ...S,
  self_direction: {
    stake: S.self_direction!.stake,
    deed: (o) => ({
      up: `In \`now\`, did ${o} claim freedom over their own life or movements, breaking from someone's hold over them?`,
      down: `In \`now\`, did ${o} give up freedom over their own life or movements to someone else's say?`,
    }),
  },
  achievement: {
    stake: {
      up: "Does `now` bring you a success at your own work or trade, or praise for your skill at it?",
      down: "Does `now` bring you a setback at your own work or trade, or blame or scorn for your skill at it?",
    },
    deed: (o) => ({
      up: `In \`now\`, did ${o} report or show a success they won by their own skill?`,
      down: `In \`now\`, did ${o} report or show a failure at their own work?`,
    }),
  },
  power: {
    stake: {
      up: "Does `now` raise your standing or your hold over other people: someone obeying you, paying what you demanded, or deferring to you?",
      down: "Does `now` lower your standing or your hold over other people: someone defying you, ignoring you, going over your head or taking your place?",
    },
    deed: S.power!.deed,
  },
  security: {
    stake: S.security!.stake,
    deed: (o) => ({
      up: `In \`now\`, did ${o} do something to keep themself or someone else out of harm's way: hiding them, covering tracks, or keeping them away from danger?`,
      down: `In \`now\`, did ${o} do something that puts themself or someone else directly in harm's way: sending them into danger, exposing them, or walking into danger?`,
    }),
  },
};

/** Third wording: the second, with the conformity deed narrowed to orders, debts, rules and public insult. */
const S3: Record<string, Statements> = {
  ...S2,
  conformity: {
    stake: S.conformity!.stake,
    deed: (o) => ({
      up: `In \`now\`, did ${o} obey an order, pay a debt or a demanded price, or keep to a rule they are under?`,
      down: `In \`now\`, did ${o} disobey an order, refuse a debt or a demanded price, break a rule, or insult or shame someone in front of others?`,
    }),
  },
};

function statement(id: string, o: string, ch: Channel, d: Dir, W: Record<string, Statements> = S): string {
  const s = W[id];
  if (!s) throw new Error(`no wording for ${id}`);
  return ch === "stake" ? s.stake[d] : s.deed(o)[d];
}

const qk = (ch: Channel, id: string, d: Dir) => `${ch}__${id}__${d}`;

/**
 * `split`: deed asked on its own small state (two requests, in parallel); else both channels on the stake state in
 * one request. `zero`: the reading is 0 unless the stronger of the two nouls reaches it. `read`: `diff` is
 * P(up) - P(down); `max` is the stronger noul's probability, signed by which of the two it is.
 */
function ask(split: boolean, zero: number, W: Record<string, Statements>, read: "diff" | "max"): Variant["judge"] {
  return async (c, values, jev) => {
    const o = c.other.name;
    const q = (ch: Channel) => {
      const qs: Record<string, JevQuestion> = {};
      const lead = ch === "stake" || !split ? READ_STAKE : READ_DEED;
      for (const v of values)
        for (const d of ["up", "down"] as Dir[])
          qs[qk(ch, v.id, d)] = { type: "noul", instructions: `${lead} ${statement(v.id, o, ch, d, W)}` };
      return qs;
    };
    const a = split
      ? Object.assign(
          {},
          ...(await Promise.all([jev("stake", stakeState(c), q("stake")), jev("deed", deedState(c), q("deed"))])),
        )
      : await jev("both", stakeState(c), { ...q("stake"), ...q("deed") });
    const r: Record<string, number> = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        const u = noul(a[qk(ch, v.id, "up")]);
        const w = noul(a[qk(ch, v.id, "down")]);
        const m = Math.max(u, w);
        r[itemKey(ch, v.id)] = m < zero ? 0 : read === "diff" ? u - w : u > w ? u : u < w ? -w : 0;
      }
    return r;
  };
}

const variants: Variant[] = [
  // explored on dev, not kept
  { id: "cw", judge: ask(false, 0, S, "diff") },
  { id: "cw-split", judge: ask(true, 0, S, "diff") },
  { id: "cw2", judge: ask(false, 0, S2, "diff") },
  { id: "cw3", judge: ask(false, 0, S3, "diff") },
  // final and contenders
  { id: "cw3-z50", judge: ask(false, 0.5, S3, "max") },
  { id: "cw3-z60", judge: ask(false, 0.6, S3, "max") },
  { id: "cw-z50", judge: ask(false, 0.5, S, "max") },
];

const arm: ArmModule = { arm: "C", variants, final: "cw3-z50", contenders: ["cw3-z60", "cw-z50"] };
export default arm;
