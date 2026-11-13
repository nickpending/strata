/**
 * Arm W (jev-statements): design B's per-value stage with its 40 statements rewritten, everything else held.
 *
 * Imported unchanged: every variant's judge is `judgeWith(table)` from `../ask.ts`, so from B it keeps the state
 * (`stateOf`: `you`, `who_you_are`, `earlier`, `now`, `your_part`), the preamble `READ` before every statement, the
 * touches noul, the size step (B's 3-level strength score, asked for every statement whose noul reaches 0.4, with this
 * table's statement quoted where B's was) and the readings (r = P(up) - P(down); effect = P(up)·L(up) - P(down)·L(down);
 * touches = P(touches)). `check-arms.ts` passes on the dev material for every variant here: only the 40 statements
 * differ from B's requests.
 *
 * FINAL `w4`. Every statement points at the kind of act or change in strata's world the judgment turns on, rather
 * than the Schwartz description. Stake asks "Does what {o} did ...?" about the holder's own share; deed asks "In
 * `now`, did {o} ...?" about the act. In outline:
 *   self_direction: a new freedom to go, do or run things your own way / your freedom restricted; deed: {o} broke
 *     from someone's order or hold over their own life, or told someone a choice is theirs / gave up their own choice.
 *   stimulation: something exciting offered to you (a run, a job, a night out), other than a threat or demand / called
 *     off or forbidden; deed: {o} themself took on something daring, not only asking someone else to / turned down a
 *     daring chance to stay safe.
 *   hedonism: something to enjoy given / taken or forbidden ("Answer no if it only worries, angers or shames you");
 *     deed: went after / gave up a pleasure (drinks, a high, a party, fun).
 *   achievement: a chance to earn at your own work or trade, or praise for your skill / your work made to fail, or
 *     blame; deed: showed or reported a success / a failure at their own work or trade.
 *   power: your hold over people raised (obeyed, deferred to, paid, told what others hid) / lowered (defied, ignored,
 *     lied to, what you claimed taken or spent); deed: used a hold over someone (a debt, rent, shelter, a place) to give
 *     orders, make demands or set terms / backed down or handed over what was demanded under pressure.
 *   conformity: helped / made to break a rule, order or promise you are under; deed: did what someone with authority
 *     over them ordered, or paid what they owed / defied that authority, broke a rule, promise or deal, dodged a
 *     debt, or planned a theft or a crime.
 *   tradition: a ritual, holiday or custom of your people or faith honoured / stopped or mocked; deed: kept / broke.
 *   universalism: strangers, the weak or many people outside your circle protected or helped in real need / harmed;
 *     deed: protected them, or refused to harm them for gain / harmed, cheated or sold them out.
 *   security, in full:
 *     stake up   "Does what {o} did protect you or what you live on: people who could hurt you, or who draw danger to
 *                you, kept away from you, a threat to you lifted, or your shelter, your place, or money you live on
 *                or are owed made surer?"
 *     stake down "Count only danger that {o}'s act adds. Does what {o} did bring people who could hurt you closer to
 *                you, or put you at risk of harm, arrest, or losing your shelter, your place, or money you live on or
 *                are owed?"
 *     deed up    "In `now`, did {o} act to keep themself or someone else out of danger: turning down a dangerous job,
 *                sheltering someone, sending a threat away, or keeping people who could hurt someone off them?"
 *     deed down  "In `now`, did {o} put themself or someone else in danger: pushing someone toward people who could
 *                hurt them, walking into a threat, or exposing someone to harm?"
 *   benevolence, in full:
 *     stake up   "Does what {o} did help, protect or provide for someone close to you other than yourself, such as a
 *                friend, family, or someone in your care?"
 *     stake down "Does what {o} did harm, endanger, abandon or deprive someone close to you other than yourself, such
 *                as a friend, family, or someone in your care?"
 *     deed up    "In `now`, did {o} give up something of their own, take a risk, or turn down a gain, to help or
 *                protect a friend or someone close to them other than you?"
 *     deed down  "In `now`, did {o} betray, give away the secrets of, or cut off someone close to them, or refuse
 *                help to someone close to them or nearby who was in trouble, hurt or in need?"
 *
 * Dev (A: 40 cases, 28 scenarios, 800 items, 116 touched), scored by `../score.ts` beside B's dev run
 * (corpus/runs/jev-statements/2026-11-13T01-18-32-465Z-dev-b, 2 reps). Linear. E4 is build / detract. P2 is direction
 * among fired (mean |r| >= 0.5), then over all touched items. sec / ben: per value P1 (both channels) and direction
 * among fired.
 *
 *   variant        reps E1     E2    E3     E4             P1     P2              sec P1 / dir   ben P1 / dir
 *   B as-is         2   27/35  5/12  0.661  0.266 / 0.221  0.750  42/43, 101/116  0.748  15/15   0.511  2/2
 *   w1              2   28/35  6/12  0.710  0.305 / 0.169  0.844  64/64, 108/116  0.733  18/18   0.735  7/7
 *   c3              2   27/35  5/12  0.714  0.477 / 0.239  0.756  35/35, 104/116  0.719  14/14   0.560  1/1
 *   w2              2   30/35  7/12  0.712  0.219 / 0.196  0.881  61/61, 109/116  0.717  16/16   0.900  5/5
 *   w3              2   30/35  7/12  0.761  0.262 / 0.266  0.894  61/61, 109/116  0.770  16/16   0.897  5/5
 *   w4              2   31/35  8/12  0.783  0.262 / 0.209  0.887  62/62, 109/116  0.763  16/16   0.892  5/5
 *   selection run, w3, w4 and w5 together, 4 reps each:
 *   w3              4   30/35  7/12  0.754  0.232 / 0.209  0.894  62/62, 109/116  0.766  16/16   0.892  5/5
 *   w4 (final)      4   31/35  8/12  0.781  0.262 / 0.186  0.893  62/62, 109/116  0.768  16/16   0.890  5/5
 *   w5              4   31/35  8/12  0.761  0.232 / 0.233  0.896  62/62, 109/116  0.765  16/16   0.895  5/5
 *
 *   Per channel, final (4 reps) against B: P1 stake 0.863 / 0.717, deed 0.920 / 0.781. Security stake 0.806 / 0.792,
 *   deed 0.767 / 0.693. Benevolence stake 0.760 / 0.505, deed 0.992 / 0.544. Squared (rescored, never chosen on):
 *   final E3 0.859 against B-sq's 0.705.
 *
 * The variants, in the order run (each a complete table of 40):
 *   - `w1`: the first wording, written after reading world/, the engine's verbs, the dev labels and B's dev misses,
 *     before any W answer was read. Benevolence's stake excludes the holder ("other than yourself"); security names
 *     threats, shelter, place and the money you live on.
 *   - `c3`: gate-direction's arm C `S3`, retyped, its stake statements opened "Does what {o} did in `now` ..." so each
 *     names the other. Read through B's soft P(up) - P(down) and B's size step, it barely moves the gate on this dev
 *     (0.756 against B's 0.750).
 *   - `w2`: w1 with the statements that fired most on untouched dev items narrowed. Stake self-direction up drops
 *     "a choice left to you"; deed self-direction up asks for an order, warning or advice defied; deed power up asks
 *     for a hold the other has over someone, and down for backing down under pressure; deed conformity asks for
 *     authority over the other; tradition names rituals, holidays and customs of a people or faith; deed benevolence
 *     up asks for a cost to the other and excludes help to the holder, and its down drops "a favour asked" for
 *     "trouble, hurt or need"; security's stake is asked against "before".
 *   - `w3`: w2 with security's stake rewritten: up as "protect you or what you live on", without "someone sent away"
 *     (which fired whenever the other left the room), and down led by "Count only danger that {o}'s act adds";
 *     deed self-direction led by "Answer no if {o} only turned down a request or an offer."
 *   - `w4`: w3 with deed self-direction asked as breaking from someone's order or hold over the other's own life;
 *     stimulation's downs narrowed to something called off or forbidden, and a daring chance turned down; deed
 *     achievement asked about the other's own work or trade.
 *   - `w5`: w4 with w3's deed self-direction.
 * Selection: the brief's rule, on the 4-rep run that asked w3, w4 and w5 on the same cases. The best P1 is w5's
 * 0.896; w3 (0.894) and w4 (0.893) sit within 0.01, and w4 has the highest E3 (0.781), so w4 is final. The 2-rep runs
 * agree (w3 0.894 / 0.761, w4 0.887 / 0.783). The three differ only inside the run-to-run noise.
 *
 * Contender `w1`: the first wording, written before any W answer was read, as a check on how much of the final is fit
 * to dev.
 *
 * Where the final still loses on dev:
 *   - Security stops at 0.77, against B's 0.75. Up items read both ways. When the other's act protects the holder
 *     against a danger that is in `now` (a hunted man put out, hunters turned away, rent cut on a condition), the
 *     down noul still reads that danger (0.6 to 0.8), and r stays near 0. "Than before" (w2) and "count only danger
 *     the act adds" (w3) moved it little.
 *   - Deed self-direction fires on refusals and defiance the labels file under other values. Stake achievement fires
 *     on threats to the holder's trade the labels file under security.
 *
 * Requests per judgment: 1.9 (gate, and how when any statement reaches 0.4); questions 48.7 (B 55.3); 2.35e-4 USD
 * per judgment (B 2.45e-4), within the 5e-4 cap. Fewer statements reach 0.4, so the size step asks fewer scores.
 * Dev spend: 0.207 USD of the 0.40 cap (w1 and c3 0.038, w2 0.019, w3 0.019, w4 0.019, the 4-rep selection run 0.113).
 *
 * docs/jev.md rules it leans on:
 *   - 1: one literal judgment per statement; a list after a colon names instances of that one judgment;
 *   - 2: boundary cases written into the statement ("other than yourself", "rather than only asking someone else",
 *     "other than a threat or a demand made on you", "Answer no if it only worries, angers or shames you", "Count only
 *     danger that {o}'s act adds");
 *   - 3: each statement asks what the act did, or what it was, in the world's own terms (an order, a debt, shelter,
 *     a ritual), never what it shows;
 *   - 8: yes always means the statement holds; up and down stay separate questions;
 *   - 9: up and down are never read as each other's negation.
 * Rules it bends:
 *   - Two boundaries ("Answer no if it only worries ...", "Count only danger ...") lead their question rather than
 *     follow it, because `check-arms.ts` needs every statement to end in "?".
 *   - A few lists join two instances of one judgment that sit on different people: deed self-direction (the other
 *     breaks from someone's hold, or hands someone a choice) and deed benevolence down (betrays someone close, or
 *     refuses help to someone in need). Each is one act for or against the value.
 *   - 7, small state, inherited from B: W may not change the state.
 *   - Generic wording: no person, room or item is named. A few lists name kinds of thing this world has, which dev
 *     scenarios also use: "a run" and "a raid" (stimulation), "rent" and "shelter" (deed power), "shelter" and "money
 *     you are owed" (security). Each names a kind, not a particular debt, deal or person. The orchestrator should read
 *     them at the freeze.
 * Nothing names or special-cases a dev case, scenario or variant.
 */
import { judgeWith } from "../ask.ts";
import type { Channel, Dir, Statement, StatementArmModule, StatementVariant } from "../contract.ts";

/** Per value: the four statements, given the other's display name. */
type Four = Record<Channel, Record<Dir, string>>;
type Table = Record<string, (o: string) => Four>;

/** One value's four statements from a table. */
function four(T: Table, id: string, o: string): Four {
  const f = T[id];
  if (!f) throw new Error(`no wording for ${id}`);
  return f(o);
}

const tableOf =
  (T: Table): Statement =>
  (id, o, ch, d) =>
    four(T, id, o)[ch][d];

const N = "`now`";

/** First wording: every statement points at the kind of act or change in strata's world the judgment turns on. */
const W1: Table = {
  self_direction: (o) => ({
    stake: {
      up: `Does what ${o} did give you a free hand: a choice left to you, or freedom to go where you want, do what you want or run things your own way?`,
      down: `Does what ${o} did restrict your freedom: where you may go, who you may talk to, or how you live day to day?`,
    },
    deed: {
      up: `In ${N}, did ${o} go their own way against someone's order or warning, or leave a choice for someone else to make for themself?`,
      down: `In ${N}, did ${o} give up their own choice and let someone else decide for them?`,
    },
  }),
  stimulation: (o) => ({
    stake: {
      up: `Does what ${o} did offer you something exciting, new or daring to do, such as a run, a job, a night out or a challenge you could take on, other than a threat or a demand made on you?`,
      down: `Does what ${o} did take away, or keep you from, something exciting or new you wanted to do?`,
    },
    deed: {
      up: `In ${N}, did ${o} themself take on something risky, daring or exciting, such as a raid, a dangerous run or facing a threat head on, rather than only asking someone else to take the risk?`,
      down: `In ${N}, did ${o} turn down something risky, daring or exciting to stay safe?`,
    },
  }),
  hedonism: (o) => ({
    stake: {
      up: `Does what ${o} did give you something to enjoy: a drink, food, a treat, a high, music, a party or fun?`,
      down: `Answer no if it only worries, angers or shames you. Does what ${o} did take from you, or forbid you, something you enjoy: a drink, food, a treat, a high, music, a party or fun?`,
    },
    deed: {
      up: `In ${N}, did ${o} go after pleasure or a good time: drinks, a high, a party or fun?`,
      down: `In ${N}, did ${o} give up or turn down a pleasure: a drink, a high, a party or fun?`,
    },
  }),
  achievement: (o) => ({
    stake: {
      up: `Does what ${o} did give you a chance to earn or win at your own work or trade, or bring you praise for your skill at it?`,
      down: `Does what ${o} did make your own work or trade fail or go harder, or bring you blame or scorn for your skill at it?`,
    },
    deed: {
      up: `In ${N}, did ${o} show or report a success they won by their own skill or work?`,
      down: `In ${N}, did ${o} show or report a failure at their own work or trade?`,
    },
  }),
  power: (o) => ({
    stake: {
      up: `Does what ${o} did raise your hold over people or what goes on around you: someone obeying you, deferring to you, paying what you demanded, or telling you what others hid from you?`,
      down: `Does what ${o} did lower your hold over people or what goes on around you: someone defying your word or claim, ignoring you, lying to you, or taking or spending what you claimed as yours?`,
    },
    deed: {
      up: `In ${N}, did ${o} press their control over someone: give orders, make demands or set terms backed by money, a debt owed, shelter or a place they hold?`,
      down: `In ${N}, did ${o} give way to someone's demand or order, or bow to someone's authority?`,
    },
  }),
  security: (o) => ({
    stake: {
      up: `Does what ${o} did make you safer: someone who draws danger to you sent away, people who could hurt you kept off, a threat to you lifted, or your shelter, your place or the money you live on made surer?`,
      down: `Does what ${o} did bring people who could hurt you closer to you, or put you at risk of harm, arrest, or losing your shelter, your place or the money you live on?`,
    },
    deed: {
      up: `In ${N}, did ${o} act to keep themself or someone else out of danger: turning down a dangerous job, sheltering someone, sending a threat away, or keeping people who could hurt someone off them?`,
      down: `In ${N}, did ${o} put themself or someone else in danger: pushing someone toward people who could hurt them, walking into a threat, or exposing someone to harm?`,
    },
  }),
  conformity: (o) => ({
    stake: {
      up: `Does what ${o} did help you keep to a rule, an order or a promise you are under, or spare you from breaking one?`,
      down: `Does what ${o} did make you break, or force you to break, a rule, an order or a promise you are under?`,
    },
    deed: {
      up: `In ${N}, did ${o} obey an order, pay a debt or a price owed, or keep to a rule, a promise or a deal they are under?`,
      down: `In ${N}, did ${o} defy an order or a claim from someone they answer to, break a rule, a promise or a deal, dodge a debt, or plan a theft or a crime?`,
    },
  }),
  tradition: (o) => ({
    stake: {
      up: `Does what ${o} did honour or keep up a custom, ritual or observance that you yourself keep?`,
      down: `Does what ${o} did stop you from keeping, or mock or break, a custom, ritual or observance that you yourself keep?`,
    },
    deed: {
      up: `In ${N}, did ${o} keep or honour a custom, ritual or observance?`,
      down: `In ${N}, did ${o} break, skip or mock a custom, ritual or observance?`,
    },
  }),
  benevolence: (o) => ({
    stake: {
      up: `Does what ${o} did help, protect or provide for someone close to you other than yourself, such as a friend, family, or someone in your care?`,
      down: `Does what ${o} did harm, endanger, abandon or deprive someone close to you other than yourself, such as a friend, family, or someone in your care?`,
    },
    deed: {
      up: `In ${N}, did ${o} give up something of their own, or take a risk, to help or protect a friend or someone close to them?`,
      down: `In ${N}, did ${o} betray or cut off someone close to them, or refuse to help someone around them who was in need or asked a favour?`,
    },
  }),
  universalism: (o) => ({
    stake: {
      up: `Does what ${o} did protect strangers, the weak or many people outside your own circle from harm, or help them in real need?`,
      down: `Does what ${o} did harm or endanger strangers, the weak or many people outside your own circle?`,
    },
    deed: {
      up: `In ${N}, did ${o} protect strangers, the weak or many people outside their own circle from harm, or refuse to harm them for gain?`,
      down: `In ${N}, did ${o} harm, cheat or sell out strangers, the weak or many people outside their own circle?`,
    },
  }),
};

/**
 * gate-direction's arm C wording (`S3`, its final), retyped. C's stake statements open "Does `now` ..."; here they
 * open "Does what {o} did in `now` ...", so every statement names the other as B's do. Its deed statements are C's.
 */
const C3: Table = {
  self_direction: (o) => ({
    stake: {
      up: `Does what ${o} did in ${N} give you a new choice, or free you to go where you want, do what you want or live as you want?`,
      down: `Does what ${o} did in ${N} take away a choice you had, or order or force you where to go, what to do or how to live?`,
    },
    deed: {
      up: `In ${N}, did ${o} claim freedom over their own life or movements, breaking from someone's hold over them?`,
      down: `In ${N}, did ${o} give up freedom over their own life or movements to someone else's say?`,
    },
  }),
  stimulation: (o) => ({
    stake: {
      up: `Answer no for danger or trouble you did not choose. Does what ${o} did in ${N} offer you something exciting, new or daring to do that you would want to take on?`,
      down: `Does what ${o} did in ${N} take away, or keep you from, something exciting or new you wanted to do?`,
    },
    deed: {
      up: `In ${N}, did ${o} choose something exciting, risky or daring for the thrill of it?`,
      down: `In ${N}, did ${o} turn down something exciting or daring to stay safe?`,
    },
  }),
  hedonism: (o) => ({
    stake: {
      up: `Answer no if it only eases a worry. Does what ${o} did in ${N} give you something to enjoy: a treat, a drink, fun, entertainment, comfort or rest?`,
      down: `Answer no if it only worries, angers or shames you. Does what ${o} did in ${N} take from you, or keep you from, something to enjoy: a treat, a drink, fun, entertainment, comfort or rest?`,
    },
    deed: {
      up: `In ${N}, did ${o} go after a pleasure or a good time for themself?`,
      down: `In ${N}, did ${o} give up a pleasure or a good time?`,
    },
  }),
  achievement: (o) => ({
    stake: {
      up: `Does what ${o} did in ${N} bring you a success at your own work or trade, or praise for your skill at it?`,
      down: `Does what ${o} did in ${N} bring you a setback at your own work or trade, or blame or scorn for your skill at it?`,
    },
    deed: {
      up: `In ${N}, did ${o} report or show a success they won by their own skill?`,
      down: `In ${N}, did ${o} report or show a failure at their own work?`,
    },
  }),
  power: (o) => ({
    stake: {
      up: `Does what ${o} did in ${N} raise your standing or your hold over other people: someone obeying you, paying what you demanded, or deferring to you?`,
      down: `Does what ${o} did in ${N} lower your standing or your hold over other people: someone defying you, ignoring you, going over your head or taking your place?`,
    },
    deed: {
      up: `In ${N}, did ${o} use or claim control over someone or something: give orders, make demands, forbid, take from someone or push them aside?`,
      down: `In ${N}, did ${o} give up control or standing, or submit to someone?`,
    },
  }),
  security: (o) => ({
    stake: {
      up: `Does what ${o} did in ${N} make you safer: a danger or threat to you lifted, or the shelter or money you live on made surer?`,
      down: `Does what ${o} did in ${N} put you in more danger: a threat to you, people who are after you or watching you brought closer, or the shelter or money you live on put at risk?`,
    },
    deed: {
      up: `In ${N}, did ${o} do something to keep themself or someone else out of harm's way: hiding them, covering tracks, or keeping them away from danger?`,
      down: `In ${N}, did ${o} do something that puts themself or someone else directly in harm's way: sending them into danger, exposing them, or walking into danger?`,
    },
  }),
  conformity: (o) => ({
    stake: {
      up: `Does what ${o} did in ${N} help you keep a rule, an order or a promise you are under?`,
      down: `Does what ${o} did in ${N} push or force you to break a rule, an order or a promise you are under?`,
    },
    deed: {
      up: `In ${N}, did ${o} obey an order, pay a debt or a demanded price, or keep to a rule they are under?`,
      down: `In ${N}, did ${o} disobey an order, refuse a debt or a demanded price, break a rule, or insult or shame someone in front of others?`,
    },
  }),
  tradition: (o) => ({
    stake: {
      up: `Does what ${o} did in ${N} honour a custom or ritual that you yourself keep?`,
      down: `Does what ${o} did in ${N} stop you from keeping, or mock, a custom or ritual that you yourself keep?`,
    },
    deed: {
      up: `In ${N}, did ${o} keep a custom or tradition?`,
      down: `In ${N}, did ${o} break with a custom or tradition?`,
    },
  }),
  benevolence: (o) => ({
    stake: {
      up: `Answer no if the help goes only to you. Does what ${o} did in ${N} help or protect someone close to you, other than you?`,
      down: `Answer no if the harm falls only on you. Does what ${o} did in ${N} harm, endanger, shame or deprive someone close to you, other than you?`,
    },
    deed: {
      up: `In ${N}, did ${o} help, stand up for, give to or protect someone close to them?`,
      down: `In ${N}, did ${o} betray, hurt or let down someone close to them?`,
    },
  }),
  universalism: (o) => ({
    stake: {
      up: `Does what ${o} did in ${N} help or protect strangers, the weak or many people outside your own circle?`,
      down: `Does what ${o} did in ${N} harm or endanger strangers, the weak or many people outside your own circle?`,
    },
    deed: {
      up: `In ${N}, did ${o} help or protect strangers, the weak or people outside their own circle?`,
      down: `In ${N}, did ${o} hurt, cheat or exploit strangers, the weak or people outside their own circle?`,
    },
  }),
};

/** Second wording: w1 with the statements that fired most on untouched dev items narrowed, per value and channel. */
const W2: Table = {
  ...W1,
  self_direction: (o) => ({
    stake: {
      up: `Does what ${o} did give you a new freedom of your own: to go where you want, do what you want or run things your own way?`,
      down: four(W1, "self_direction", o).stake.down,
    },
    deed: {
      up: `In ${N}, did ${o} defy an order, a warning or advice they were given, to do as they themself chose, or tell someone else that a choice is theirs to make?`,
      down: `In ${N}, did ${o} give up their own choice and let someone else decide for them?`,
    },
  }),
  power: (o) => ({
    stake: four(W1, "power", o).stake,
    deed: {
      up: `In ${N}, did ${o} use a hold they have over someone, such as a debt owed, rent, shelter or a place they control, to give orders, make demands or set terms?`,
      down: `In ${N}, did ${o} back down, or hand over what someone demanded of them, under pressure or a threat?`,
    },
  }),
  security: (o) => ({
    stake: {
      up: `Does what ${o} did leave you safer than before: someone who draws danger to you sent away, people who could hurt you kept off, a threat to you lifted, or your shelter, your place, or money you live on or are owed made surer?`,
      down: `Does what ${o} did leave you in more danger than before: people who could hurt you brought closer, or a new risk of harm, arrest, or losing your shelter, your place, or money you live on or are owed?`,
    },
    deed: four(W1, "security", o).deed,
  }),
  conformity: (o) => ({
    stake: four(W1, "conformity", o).stake,
    deed: {
      up: `In ${N}, did ${o} do what someone with authority over them ordered, or pay a debt or a price they owed?`,
      down: `In ${N}, did ${o} defy someone with authority over them, break a rule, a promise or a deal, dodge a debt, or plan a theft or a crime?`,
    },
  }),
  tradition: (o) => ({
    stake: {
      up: `Does what ${o} did honour or keep up a ritual, a holiday or a custom of your people or faith that you yourself keep?`,
      down: `Does what ${o} did stop you from keeping, or mock or break, a ritual, a holiday or a custom of your people or faith that you yourself keep?`,
    },
    deed: {
      up: `In ${N}, did ${o} keep or honour a ritual, a holiday or a custom of their people or faith?`,
      down: `In ${N}, did ${o} break, skip or mock a ritual, a holiday or a custom of their people or faith?`,
    },
  }),
  benevolence: (o) => ({
    stake: four(W1, "benevolence", o).stake,
    deed: {
      up: `In ${N}, did ${o} give up something of their own, take a risk, or turn down a gain, to help or protect a friend or someone close to them other than you?`,
      down: `In ${N}, did ${o} betray, give away the secrets of, or cut off someone close to them, or refuse help to someone close to them or nearby who was in trouble, hurt or in need?`,
    },
  }),
};

/** Third wording: w2 with security's stake asked about the danger the other's act adds, and refusals kept out of self-direction's deed. */
const W3: Table = {
  ...W2,
  self_direction: (o) => ({
    stake: four(W2, "self_direction", o).stake,
    deed: {
      up: `Answer no if ${o} only turned down a request or an offer. In ${N}, did ${o} defy an order, a warning or advice to go their own way, or tell someone else that a choice is theirs to make?`,
      down: `In ${N}, did ${o} give up their own choice and let someone else decide for them?`,
    },
  }),
  security: (o) => ({
    stake: {
      up: `Does what ${o} did protect you or what you live on: people who could hurt you, or who draw danger to you, kept away from you, a threat to you lifted, or your shelter, your place, or money you live on or are owed made surer?`,
      down: `Count only danger that ${o}'s act adds. Does what ${o} did bring people who could hurt you closer to you, or put you at risk of harm, arrest, or losing your shelter, your place, or money you live on or are owed?`,
    },
    deed: four(W2, "security", o).deed,
  }),
};

/** Fourth wording: w3 with self-direction's deed about a hold over the other's own life, and stimulation's downs and achievement's deed up narrowed. */
const W4: Table = {
  ...W3,
  self_direction: (o) => ({
    stake: four(W3, "self_direction", o).stake,
    deed: {
      up: `In ${N}, did ${o} break from someone's order or hold over where they go or how they live, or tell someone else that a choice is theirs to make?`,
      down: `In ${N}, did ${o} give up their own choice and let someone else decide for them?`,
    },
  }),
  stimulation: (o) => ({
    stake: {
      up: four(W3, "stimulation", o).stake.up,
      down: `Does what ${o} did call off, block or forbid something exciting or new that you wanted to do?`,
    },
    deed: {
      up: four(W3, "stimulation", o).deed.up,
      down: `In ${N}, did ${o} turn down a risky, daring or exciting chance offered to them, to stay safe?`,
    },
  }),
  achievement: (o) => ({
    stake: four(W3, "achievement", o).stake,
    deed: {
      up: `In ${N}, did ${o} show or report a success at their own work or trade, won by their skill?`,
      down: `In ${N}, did ${o} show or report a failure at their own work or trade?`,
    },
  }),
};

/** Fifth wording: w4 with w3's self-direction deed (it read better on dev than w4's). */
const W5: Table = { ...W4, self_direction: (o) => four(W3, "self_direction", o) };

const variant = (id: string, T: Table): StatementVariant => {
  const statement = tableOf(T);
  return { id, statement, judge: judgeWith(statement) };
};

const variants: StatementVariant[] = [variant("w1", W1), variant("c3", C3), variant("w2", W2), variant("w3", W3), variant("w4", W4), variant("w5", W5)];

const arm: StatementArmModule = { arm: "W", variants, final: "w4", contenders: ["w1"] };
export default arm;
