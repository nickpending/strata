/**
 * Arm A (gate-direction): design B's gate request, as-is. One variant, `as-is`, final, no contenders.
 *
 * Ported from `../../value-weighting-3/arms/o2.ts` (family `d4`) by copying its source lines, not retyping:
 * `stateOf`, `READ`, the `Statements` type, `S` and `statement` are that file's lines 68-80 and 86-203, with only
 * `State` renamed to this contract's `JevState` and v3's local `CHANNELS` (line 88) left out for the contract's.
 * The touches noul and the chained `how` step are dropped (they are not this stage).
 *
 * State (one request, step `gate`): v3's five fields. `you` the holder's name; `who_you_are` the identity text;
 *   `earlier` the holder's own earlier copies in the scenario, one line each, oldest first ("(nothing yet)" when
 *   none); `now` the encounter as the holder received it; `your_part` "{other} did this with you directly." or "You
 *   saw this; it was not aimed at you."
 * Questions: 40 nouls, `${READ} ${statement}`, one per value (catalogue order), channel and direction:
 *   stake up / down: does what {o} did advance / set back the holder's own share of the value ("Does what {o} did
 *     make you safer, or keep danger or trouble away from you?" / "... bring danger, trouble or upheaval closer to
 *     you?");
 *   deed up / down: did {o} act for / against the value ("Did {o} protect someone from danger or trouble?" / "Did
 *     {o} bring danger or trouble down on someone?").
 *   The full wording is `S` below, character for character v3's.
 * Reading (code): per item, P(up) - P(down), each noul used as a probability.
 *
 * Dev (36 cases, 720 items, 2 reps; M1 item rho / M2 direction / M3 gate AUC): 0.380 / 0.882 / 0.743; stake 0.386 /
 *   0.894 / 0.727; deed 0.372 / 0.868 / 0.754. 40 questions, 1.4e-4 USD per judgment; spend 0.010 USD. Its 40
 *   question texts, with the other's name put back as {o}, match v4's logged `gate` requests
 *   (corpus/runs/value-weighting-4/*-dev-b-final) key for key, character for character.
 *   Where it loses (dev): the gate. Untouched items fire at |r| >= 0.5 in 77.5 of 635 per rep, touched ones stay
 *   under 0.5 in 43.5 of 85; a bad turn moves many stake values down together (hedonism, achievement, power,
 *   benevolence), and a good one moves them up.
 *
 * docs/jev.md rules it leans on: 1 and 2 (one literal one-sided statement per noul), 8 (yes means the statement
 * holds), 9 (up and down asked apart, never read as each other's negation), batching (one request). Rules it bends,
 * inherited with v3's questions, which A may not change: 7 (identity and history go to all 40 nouls, deed ones
 * included, in one state), and "gate first" (no separate gate; the up and down nouls are the gate and the
 * direction at once).
 */
import type { ArmModule, BuiltCase, JevQuestion, JevState, Value, Variant } from "../contract.ts";
import { CHANNELS, itemKey, noul } from "../contract.ts";

// ---------- copied from ../../value-weighting-3/arms/o2.ts (lines 68-80) ----------

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

// ---------- copied from ../../value-weighting-3/arms/o2.ts (lines 86-203) ----------

type Channel = "stake" | "deed";
type Dir = "up" | "down";
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

// ---------- arm A ----------

const qkey = (ch: Channel, id: string, d: Dir) => `${ch}__${id}__${d}`;

async function judge(c: BuiltCase, values: Value[], jev: Parameters<Variant["judge"]>[2]) {
  const s = stateOf(c);
  const o = c.other.name;
  const qs: Record<string, JevQuestion> = {};
  for (const ch of CHANNELS)
    for (const v of values)
      for (const d of DIRS) qs[qkey(ch, v.id, d)] = { type: "noul", instructions: `${READ} ${statement(v.id, o, ch, d)}` };
  const a = await jev("gate", s, qs);
  const r: Record<string, number> = {};
  for (const ch of CHANNELS)
    for (const v of values) r[itemKey(ch, v.id)] = noul(a[qkey(ch, v.id, "up")]) - noul(a[qkey(ch, v.id, "down")]);
  return r;
}

const arm: ArmModule = { arm: "A", variants: [{ id: "as-is", judge }], final: "as-is", contenders: [] };
export default arm;

/** For arm B, which asks A's statements as its direction step. */
export { READ, statement, stateOf };
