/**
 * Arm S (jev-state): design B's per-value stage with the questions fixed and the state rebuilt as typed data. Same
 * two requests as B (`gate`: 40 nouls plus touches; `how`: chained strength for every noul at 0.4 or above), the
 * same readings, one state for both requests; only the state and the preamble differ.
 *
 * FINAL `t5`: typed events, compact; typed identity nested by entity; B's READ, unchanged, as the preamble.
 *   State, B's five top-level names kept (so READ and TOUCHES still name them):
 *     `you`          the holder's name;
 *     `who_you_are`  the holder's identity as typed facts (`IDENTITY` below, `entity` layout): `name`, `you_hold`
 *                    {thing: what it is to you}, `people` {name: {who, to_you, owes_you, ...}}, `you_owe`
 *                    {creditor: {for, behind_by, ...}}, `hunted_by` / `threats`, `money`, `health`, `work`,
 *                    `you_rely_on`, `you_fear`, as each person's identity states them;
 *     `earlier`      the holder's earlier copies, all of them, oldest first, each `{when, act, by, to, ...}` with
 *                    `when` as words ("just before", "about 20 minutes before"; 10-minute ticks, computed);
 *     `now`          the target copy, typed (`eventOf`): `act` (the subkind in words), `by` (actor), `to` (targets,
 *                    one string), `item`, `from` / `heading_to` / `room` for moves (the room only on an arrival:
 *                    `compact`), `words` as text for speech; an offer's window and a lapse said in words, never as
 *                    a tick; ids resolved through `names` (the holder is "you");
 *     `your_part`    the role, B's two sentences ("{o} did this with you directly." / "You saw this; it was not
 *                    aimed at you.").
 *   Rendered, A18 (Rogue, offer lapsed):
 *     {"you": "Rogue", "who_you_are": {"name": "Rogue", "you_hold": {"The Chrome Cassette": "the lease on this
 *     smoky bar; the bar is everything you have built", "Back Room": "the lease on the room behind the bar, which
 *     you sublet to Mux for his parts stall", "the data shard": "black-market contacts, a thousand people's jacks on
 *     it; Saito wants it badly"}, "people": {"Glitch": {"who": "a netrunner hunted by Kestrel Security after a run
 *     went wrong", "to_you": "sleeps in the Back Room because you allow it", "risk_to_you": "if Kestrel finds him
 *     here, they find you too"}, "Mux": {"to_you": "runs his parts stall in the Back Room, which you sublet to him",
 *     "owes_you": "a month behind on his rent"}, "Saito": {"who": "a corporate fixer", "wants": "the data shard,
 *     badly"}}, "you_owe": {"the Tanaka syndicate": {"for": "the lease", "behind_by": "4,000", "collectors": "come
 *     for an installment every week", "if_you_miss_enough": "they take the bar"}}, "you_rely_on": "no one",
 *     "you_fear": ["losing the bar"]}, "earlier": [{"when": "about 20 minutes before", "act": "said to", "by":
 *     "you", "to": "Glitch", "words": "Saito's men search me at midnight. Hold the shard for one hour; nobody looks
 *     at you."}, {"when": "about 20 minutes before", "act": "offered an item", "by": "you", "to": "Glitch", "item":
 *     "the data shard", "offer": "your offer stays open for about 20 minutes; Glitch can take it, refuse it, or let
 *     it run out"}], "now": {"act": "an offer ran out unanswered", "item": "the data shard", "offered_by": "you",
 *     "offered_to": "Glitch", "what_happened": "Glitch let your offer run out: Glitch neither took the data shard
 *     nor refused it"}, "your_part": "Glitch did this with you directly."}
 *   Preamble (both channels, both requests): B's READ, imported: "`now` is the latest thing that happened. Take it
 *     together with what was said just before it in `earlier`, and read it from your side (`you`, `who_you_are`,
 *     `your_part`)."
 * CONTENDER `t1`: the same state with full events (`room` on every event, `to` a list) and a preamble that names
 *   the typed sub-fields (`P_ONE`): "`now` is the latest thing that happened (`now.act`, done by `now.by`). Take it
 *   together with `earlier`, what happened just before it, oldest first, and read it from your side: you are `you`;
 *   `who_you_are` holds your own facts (what you hold, what you owe, your people, what you fear); `your_part` says
 *   whether it was aimed at you."
 * Other variants (explored, kept so their logged dev numbers reproduce): `t2` t1 with a deed preamble of its own
 *   (`P_CH`: "Judge {o}'s act itself ..."); `t3` the identity in the `topic` layout (keys in the statements' words:
 *   `your_safety`, `your_money_and_possessions`, `your_work_or_business`, `people_close_to_you`, ...) with a
 *   preamble naming those paths (`P_TOPIC`); `t4` t1's state under B's READ; `k1` the K probe (below).
 *
 * Imported unchanged: `statement` and `READ` (`../../gate-direction/arms/a.ts`); `TOUCHES`, `strength4`, `levelOf`
 * and `key4` (`../../gate-first-e2e/arms/b.ts`). The strength question is `strength4`'s, with its opening READ
 * swapped for the variant's preamble (for `t5` the swap is READ for READ, so it is strength4's text exactly);
 * `STAKE_LEVELS` and `DEED_LEVELS` arrive inside it. `ASK_STRENGTH_FROM` (0.4) is not exported there and is restated.
 * TOUCHES is sent as it stands: the state keeps the `now`, `earlier` and `you` it names.
 *
 * Identity facts: written once per person from that person's identity text (dev-material.json `identities`; the
 * same text in every set), each fact with the sentence it comes from in a comment, nothing a sentence does not
 * state. The text's sha256 is pinned: a case with any other identity text throws rather than send facts written
 * for another text. No fact comes from a case, a label or a scenario; the `topic` layout's tags are justified in
 * each comment from the fact's own words.
 *
 * Dev (40 cases, 28 scenarios; E3 decides). B is the orchestrator's dev run, scored beside. t5 and t1 have 4 reps
 * (2 in their first run, 2 in a fresh run), the rest 2.
 *   E1 / E2 / E3 / E4 (build, detract) / P1 (stake | deed) / P2 among fired / requests, questions, USD per judgment
 *   B `as-is`    28/35  7/12  0.631  0.258 (0.435, 0.080)  0.773 (0.777 | 0.774)  41/43 95%  2, 55.3 q, 2.42e-4
 *   final `t5`   28/35  8/12  0.700  0.328 (0.513, 0.144)  0.745 (0.752 | 0.738)  49/51 96%  2, 54.6 q, 2.56e-4
 *   `t1`         29/35  9/12  0.677  0.270 (0.400, 0.140)  0.745 (0.734 | 0.754)  42/44 95%  2, 54.3 q, 3.51e-4
 *   E3 per run of 2 reps: t1 0.683, 0.687; t5 0.697, 0.693; t4 0.688; t2 0.669; t3 0.665; k1 0.666.
 *   S vs B on dev (the scorer's bootstrap, decides nothing here): E3 +0.069 [-0.070, 0.187]; P1 -0.028 [-0.078,
 *   0.015]. The E3 lead survives reading every level as 1 (r alone through the combine: t5 0.694, B 0.639), so it
 *   is in the per-value readings, not the size step, though P1 (gate AUC) sits a little below B's: the typed state
 *   lowers both touched and untouched amplitude (touched mean signed r 0.33 / 0.37 stake / deed against B's 0.35 /
 *   0.40). Stage attribution (t5): gate oracle 0.736, direction oracle 0.727, both 0.766.
 * How the final was chosen: t1 and t2 first (typed, named-field preambles), then t3 (identity by topic), then t4 and
 *   t5 (B's READ over t1's state, full and compact). Every S variant read above B's 0.631 and within 0.035 of each
 *   other. Within 0.02 of the best (t5): t4 and t1's later run; the cheapest is t5 (shortest preamble and state),
 *   and a fresh run kept it highest over 4 reps. Naming typed sub-fields in the preamble (t1, t2, t3) bought
 *   nothing over READ's five top-level names and cost 35% more per judgment; per-channel and topic preambles lowered
 *   P1 (0.719 both). t1 is the contender: the full-events, named-field reading of the prereg's S.
 *
 * No arm K. `k1` (t5 plus `what_you_know`: where each known person is and who holds which item, from
 *   `knowledge.facts`, and the holder's authored ties, kind and note, from `world.ties`; READ plus a sentence naming
 *   it) ran in the same fresh run as t5: E1 26/35, E2 6/12, E3 0.666, E4 0.363 (0.502, 0.224), P1 0.741, P2 44/46,
 *   3.32e-4 USD; t5 in that run read E1 28/35, E2 8/12, E3 0.693, P1 0.744. It is below t5 on E3 (-0.027), E1 and
 *   E2 and level on P1, its only edge within-direction rho, which decides nothing. The known rows mostly restate
 *   `earlier` and `now` (where the other just is, who just offered what; the engine never teaches the holder its
 *   own holdings), and the ties add prose the misses did not turn on. `k1` stays here only so its numbers
 *   reproduce; it is neither final nor contender, and the final and contender hold nothing outside B's fields.
 *
 * docs/jev.md rules and "Building state" points it leans on: the event as typed fields from the engine copy, with
 * speech's words as text ("Build a Jev state for strata this way"); identity as typed facts, nested by entity
 * ("Nest by entity, and type what is typed"); earlier events as a list in source order with a computed `when`
 * ("Lists of like items ... keep source order", frames "oldest first with seconds_ago"; dates "become a computed
 * phrase"); rule 4 (an offer's window and a lapse in words, minutes computed in code, no tick number); 5 (no tick
 * arithmetic left to Jev); "Name the field in the instruction, with a backticked ... path" (READ names the five
 * top-level fields); batching (one state, both requests, as B). Rules it bends:
 *   - 7 (small, filtered state): as B, every question sees the whole typed state, identity included; S's brief
 *     forbids filtering (that is arm F).
 *   - "Point questions at the fact they turn on": the final names only the top-level fields, since dev measured no
 *     gain from naming sub-fields (t1, t3) and a loss of P1 from per-channel pointing (t2).
 *   - The topic tags and `people_close_to_you` (t3 only) are design, not stated facts; each is justified in its
 *     comment. The final does not use them.
 *
 * Nothing names or special-cases a dev case, scenario or variant. The identity facts are keyed by person id and
 * pinned to each person's identity text; every other field is computed from the TypedCase's copy, history copies,
 * names and role.
 *
 * Dev spend: 0.207 USD of the 0.40 cap (t1+t2 0.056; t3 0.035; t4+t5 0.041; fresh t1+t5+k1 0.075).
 */
import { createHash } from "node:crypto";
import { READ, statement } from "../../gate-direction/arms/a.ts";
import { key4, levelOf, strength4, TOUCHES } from "../../gate-first-e2e/arms/b.ts";
import type { TypedCopy } from "../build.ts";
import type { Channel, Jev, JevQuestion, JevState, Judged, StateArmModule, StateVariant, TypedCase, Value } from "../contract.ts";
import { CHANNELS, itemKey, noul } from "../contract.ts";

type Dir = "up" | "down";
const DIRS: Dir[] = ["up", "down"];

/** B's threshold for the chained strength score (`../../gate-first-e2e/arms/b.ts` `ASK_STRENGTH_FROM`, not exported there). */
const ASK_STRENGTH_FROM = 0.4;
/** build.ts boots the world with `tickMinutes: 10`. */
const TICK_MINUTES = 10;

// ---------- typed identity facts, one set per person, keyed by person id ----------

/**
 * Each person's identity as typed facts, written once from that person's identity text (dev-material.json
 * `identities`, the same in every set). Every fact's comment quotes the sentence it comes from; no fact says more
 * than its sentence. `sha256` is the identity text's hash: a case whose identity text differs is refused, so these
 * facts never stand for a text they were not written from.
 *
 * A fact is `[byEntity, byTopic, value]`: one value, and the path it takes in each of two layouts.
 *   - `entity`: nested by thing (what you hold, your people, what you owe), as the docs' examples nest by entity.
 *   - `topic`: nested under keys named in the statements' own words (docs/jev.md "Name keys the way the questions
 *     say them"): `your_safety` (security's "danger or trouble"), `your_money_and_possessions` (power's "money,
 *     possessions"), `your_work_or_business` (achievement's "your work or business"), `people_close_to_you`
 *     (benevolence's "someone close to you: a friend, someone who relies on you, or someone you rely on"),
 *     `your_health_and_comfort` (hedonism's "comfort"), `you_fear`. Each tag is justified in the fact's comment
 *     from its own words.
 */
type Path = string[];
type Fact = [entity: Path, topic: Path, value: unknown];
type Layout = "entity" | "topic";
type Identity = { sha256: string; name: string; facts: Fact[] };
const IDENTITY: Record<string, Identity> = {
  rogue: {
    sha256: "95c181e4529fb73da73f01b1d4bf3a2fd6e86b55cf819904f7a70e1a5c7fac1e",
    // "You are Rogue."
    name: "Rogue",
    facts: [
      // "You hold the lease on the Chrome Cassette, a smoky bar, and on the Back Room behind it, which you sublet to
      //  Mux for his parts stall." + "... they take the bar, and the bar is everything you have built." (her work:
      //  the bar she built)
      [["you_hold", "The Chrome Cassette"], ["your_work_or_business", "The Chrome Cassette"],
        "the lease on this smoky bar; the bar is everything you have built"],
      // (the first sentence) (business: a room she sublets for rent)
      [["you_hold", "Back Room"], ["your_work_or_business", "Back Room"],
        "the lease on the room behind the bar, which you sublet to Mux for his parts stall"],
      // "You hold a data shard of black-market contacts, a thousand people's jacks on it, that a corporate fixer
      //  named Saito wants badly." (a possession)
      [["you_hold", "the data shard"], ["your_money_and_possessions", "the data shard"],
        "black-market contacts, a thousand people's jacks on it; Saito wants it badly"],
      // "Glitch, a netrunner hunted by Kestrel Security after a run went wrong, sleeps in the Back Room because you
      //  allow it; if Kestrel finds him here, they find you too." (close: he relies on her allowing it)
      [["people", "Glitch", "who"], ["people_close_to_you", "Glitch", "who"],
        "a netrunner hunted by Kestrel Security after a run went wrong"],
      // (same sentence)
      [["people", "Glitch", "to_you"], ["people_close_to_you", "Glitch", "to_you"],
        "sleeps in the Back Room because you allow it"],
      // (same sentence) (safety: "they find you too")
      [["people", "Glitch", "risk_to_you"], ["your_safety", "Glitch"], "if Kestrel finds him here, they find you too"],
      // "... the Back Room behind it, which you sublet to Mux for his parts stall." (close: his stall stands in a
      //  room he has from her)
      [["people", "Mux", "to_you"], ["people_close_to_you", "Mux", "to_you"],
        "runs his parts stall in the Back Room, which you sublet to him"],
      // "Mux is a month behind on his rent to you." (money owed to her)
      [["people", "Mux", "owes_you"], ["your_money_and_possessions", "owed_to_you", "Mux"], "a month behind on his rent"],
      // "... that a corporate fixer named Saito wants badly." (who wants her possession)
      [["people", "Saito"], ["your_money_and_possessions", "wants_your_data_shard", "Saito"],
        { who: "a corporate fixer", wants: "the data shard, badly" }],
      // "The lease is owed to the Tanaka syndicate: you are 4,000 behind and their collectors come for an installment
      //  every week; if you miss enough of them, they take the bar, ..." (money she owes)
      [["you_owe", "the Tanaka syndicate"], ["your_money_and_possessions", "you_owe", "the Tanaka syndicate"],
        {
          for: "the lease",
          behind_by: "4,000",
          collectors: "come for an installment every week",
          if_you_miss_enough: "they take the bar",
        }],
      // "You rely on no one, and you fear losing the bar." (benevolence's "someone you rely on")
      [["you_rely_on"], ["people_close_to_you", "you_rely_on"], "no one"],
      // (same sentence)
      [["you_fear"], ["you_fear"], ["losing the bar"]],
    ],
  },
  glitch: {
    sha256: "e9d280b33753e18c4ff09f3a07703b37e3d66a4c82fc86051a564bf1af78b0a3",
    // "You are Glitch, a netrunner."
    name: "Glitch",
    facts: [
      // (same sentence) (his work)
      [["work"], ["your_work_or_business", "work"], "netrunner"],
      // "Three weeks ago a run went wrong and Kestrel Security now has your face and a bounty on you." (a danger)
      [["hunted_by", "Kestrel Security"], ["your_safety", "hunted_by", "Kestrel Security"],
        { has: "your face and a bounty on you", since: "a run went wrong three weeks ago" }],
      // "You have almost no money, your deck is failing, and your hands shake from deck burn." (money)
      [["money"], ["your_money_and_possessions", "money"], "almost none"],
      // (same sentence) (health)
      [["health"], ["your_health_and_comfort", "hands"], "your hands shake from deck burn"],
      // (same sentence) (a netrunner's deck is his work's tool)
      [["you_hold", "your deck"], ["your_work_or_business", "your deck"], "failing"],
      // "Your one stimpak is your only medical backup." (health)
      [["you_hold", "the stimpak"], ["your_health_and_comfort", "the stimpak"], "your one stimpak, your only medical backup"],
      // "You sleep in the Back Room only because Rogue tolerates it; if she puts you out, Kestrel will have you
      //  within a day." (close: someone he relies on for where he sleeps)
      [["people", "Rogue", "to_you"], ["people_close_to_you", "Rogue", "to_you"],
        "you sleep in the Back Room only because she tolerates it"],
      // (same sentence) (safety)
      [["people", "Rogue", "if_she_puts_you_out"], ["your_safety", "if Rogue puts you out"],
        "Kestrel will have you within a day"],
      // "You owe Mux 300 for parts; he is a regular supplier and the closest thing you have to a friend." (close: a
      //  friend)
      [["people", "Mux", "to_you"], ["people_close_to_you", "Mux", "to_you"],
        "a regular supplier and the closest thing you have to a friend"],
      // (same sentence) (money he owes)
      [["people", "Mux", "you_owe_him"], ["your_money_and_possessions", "you_owe", "Mux"], "300 for parts"],
    ],
  },
  mux: {
    sha256: "1315b60d6cfc27518f487475b55a7cc87b40265118f3e805e3faa805feee531b",
    // "You are Mux."
    name: "Mux",
    facts: [
      // "You run a parts and repair stall in the Back Room behind the Chrome Cassette, rented from Rogue, and you are
      //  a month behind on that rent." (his work)
      [["work"], ["your_work_or_business", "work"],
        "you run a parts and repair stall in the Back Room behind The Chrome Cassette"],
      // "Business is thin: your charge cell is the most valuable stock you have left, worth about a month's rent."
      [["business"], ["your_work_or_business", "business"], "thin"],
      // (same sentence) (a possession)
      [["you_hold", "the charge cell"], ["your_money_and_possessions", "the charge cell"],
        "the most valuable stock you have left, worth about a month's rent"],
      // (the first sentence) (close: he has his stall's room from her)
      [["people", "Rogue", "to_you"], ["people_close_to_you", "Rogue", "to_you"],
        "you rent your stall in the Back Room from her"],
      // (the first sentence) (money he owes)
      [["people", "Rogue", "you_owe_her"], ["your_money_and_possessions", "you_owe", "Rogue"],
        "a month behind on the rent"],
      // "Glitch owes you 300 for parts; he is one of your regulars and the nearest thing you have to a friend who
      //  talks back." (close: a friend)
      [["people", "Glitch", "to_you"], ["people_close_to_you", "Glitch", "to_you"],
        "one of your regulars and the nearest thing you have to a friend who talks back"],
      // (same sentence) (money owed to him)
      [["people", "Glitch", "owes_you"], ["your_money_and_possessions", "owed_to_you", "Glitch"], "300 for parts"],
      // "The Tanaka syndicate's collectors lean on every stall on the block, and you fear them and you fear eviction."
      //  (a danger)
      [["threats", "the Tanaka syndicate's collectors"], ["your_safety", "the Tanaka syndicate's collectors"],
        "they lean on every stall on the block"],
      // (same sentence)
      [["you_fear"], ["you_fear"], ["the Tanaka syndicate's collectors", "eviction"]],
    ],
  },
};

/** The topic layout's keys, in the order they are sent. */
const TOPICS = ["your_safety", "your_money_and_possessions", "your_work_or_business", "people_close_to_you", "your_health_and_comfort", "you_fear"];

function put(o: Record<string, unknown>, path: Path, value: unknown): void {
  let at = o;
  for (const k of path.slice(0, -1)) {
    const next = at[k];
    if (next === undefined) at[k] = {};
    else if (typeof next !== "object" || next === null || Array.isArray(next)) throw new Error(`fact path clash at ${k}`);
    at = at[k] as Record<string, unknown>;
  }
  const last = path[path.length - 1];
  if (last === undefined || last in at) throw new Error(`fact path clash at ${path.join(".")}`);
  at[last] = value;
}

function identityOf(c: TypedCase, layout: Layout): Record<string, unknown> {
  const id = IDENTITY[c.holder.id];
  if (!id) throw new Error(`no typed identity for ${c.holder.id}`);
  const sha = createHash("sha256").update(c.identity).digest("hex");
  if (sha !== id.sha256) throw new Error(`${c.id}: ${c.holder.id}'s identity text is not the one its facts come from`);
  const out: Record<string, unknown> = { name: id.name };
  for (const [entity, topic, value] of id.facts) put(out, layout === "entity" ? entity : topic, value);
  if (layout === "entity") return out;
  const sorted: Record<string, unknown> = { name: id.name };
  for (const t of TOPICS) if (t in out) sorted[t] = out[t];
  if (Object.keys(sorted).length !== Object.keys(out).length) throw new Error("a fact outside the topic keys");
  return sorted;
}

// ---------- the event as typed fields ----------

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const ago = (ticks: number): string =>
  ticks <= 0 ? "just before" : `about ${ticks * TICK_MINUTES} minutes before`;

/**
 * One engine copy as typed fields, ids resolved through `names` (the holder is "you"). Speech keeps its words as
 * text. An offer's window and a lapse are said in words, never as a tick (docs/jev.md rule 4). Fields the holder's
 * copy lacks (a whisper's words, an arrival's `present` for a bystander) are left out or said to be unheard.
 */
function eventOf(cp: TypedCopy, n: Record<string, string>): Record<string, unknown> {
  const name = (id: unknown) => n[str(id)] ?? str(id);
  const p = cp.payload;
  const by = name(cp.actor);
  const to = cp.targets.map(name);
  const room = cp.place === null ? undefined : name(cp.place);
  switch (cp.subkind) {
    case "speech.say":
      return { act: "said aloud to the room", by, room, words: str(p.words) };
    case "speech.say-to":
      return { act: "said to", by, to, room, words: str(p.words) };
    case "speech.whisper":
      return typeof p.words === "string"
        ? { act: "whispered to", by, to, room, words: p.words, heard_by: "only the one it was whispered to" }
        : { act: "whispered to", by, to, room, words: "(too quiet for you to hear)" };
    case "physical.depart":
      return { act: "left", by, from: name(p.from), heading_to: name(p.to) };
    case "physical.arrive": {
      const e: Record<string, unknown> = { act: "arrived", by, from: name(p.from), room: name(p.to) };
      if (Array.isArray(p.present)) e.already_there = p.present.length ? p.present.map(name) : ["nobody"];
      return e;
    }
    case "exchange.offer": {
      const who = to[0] ?? "the one offered it";
      return {
        act: "offered an item",
        by,
        to,
        room,
        item: name(p.item),
        offer: `${by === "you" ? "your" : `${by}'s`} offer stays open for about ${(Number(p.until) - cp.tick) * TICK_MINUTES} minutes; ${who} can take it, refuse it, or let it run out`,
      };
    }
    case "exchange.accept":
      return { act: "accepted an offered item", by, room, item: name(p.item), offered_by: name(p.from) };
    case "exchange.refuse":
      return { act: "refused an offered item", by, room, item: name(p.item), offered_by: name(p.from) };
    case "exchange.lapse": {
      const from = name(p.from);
      const t = name(p.to);
      return {
        act: "an offer ran out unanswered",
        item: name(p.item),
        offered_by: from,
        offered_to: t,
        what_happened: `${t} let ${from === "you" ? "your" : `${from}'s`} offer run out: ${t} neither took ${name(p.item)} nor refused it`,
      };
    }
    default:
      throw new Error(`no typed form for ${cp.subkind}`);
  }
}

// ---------- state ----------

/**
 * `events`: `full` sends every typed field; `compact` drops the room where it is only the setting (it stays on an
 * arrival, and a departure keeps `from` and `heading_to`) and sends `to` as one name or "you and X" rather than a
 * list.
 */
type Shape = { earlier: "all" | "with-other"; identity: Layout; events?: "full" | "compact"; known?: boolean };

/**
 * K's addition: the holder's known facts as of the target, typed. `where_people_are` and `who_holds_what` from
 * `knowledge.facts` (location and holder rows; the engine never teaches a person its own place or holdings), and
 * `your_ties` from `world.ties` (the holder's authored ties: kind and note). Places known and encounters are left out:
 * the first bear on no value, the second restate `earlier` and `now`.
 */
function knownOf(c: TypedCase): Record<string, unknown> {
  const name = (id: string) => c.names[id] ?? id;
  const where: Record<string, string> = {};
  const holds: Record<string, string> = {};
  for (const f of c.knowledge.facts) {
    if (f.kind === "location") {
      const v = f.value as { room?: string; transit?: { from: string; to: string } };
      where[name(f.thing)] = v.room
        ? name(v.room)
        : v.transit
          ? `on the way from ${name(v.transit.from)} to ${name(v.transit.to)}`
          : "unknown";
    } else if (f.kind === "holder") holds[name(f.thing)] = name(String(f.value));
  }
  const ties: Record<string, unknown> = {};
  for (const t of c.world.ties) ties[name(t.target)] = { kind: t.kind, note: t.note };
  const out: Record<string, unknown> = {};
  if (Object.keys(where).length) out.where_people_are = where;
  if (Object.keys(holds).length) out.who_holds_what = holds;
  if (Object.keys(ties).length) out.your_ties = ties;
  return out;
}

function shaped(e: Record<string, unknown>, shape: Shape): Record<string, unknown> {
  if (shape.events !== "compact") return e;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(e)) {
    if (k === "room" && e.act !== "arrived") continue;
    out[k] = k === "to" && Array.isArray(v) ? v.join(" and ") : v;
  }
  return out;
}

function stateOf(c: TypedCase, shape: Shape): JevState {
  const o = c.other.name;
  const hist = shape.earlier === "all" ? c.historyCopies : c.historyCopies.filter((h) => h.withOther);
  return {
    you: c.holder.name,
    who_you_are: identityOf(c, shape.identity),
    earlier: hist.length
      ? hist.map((h) => shaped({ when: ago(c.copy.tick - h.tick), ...eventOf(h, c.names) }, shape))
      : ["(nothing yet)"],
    now: shaped(eventOf(c.copy, c.names), shape),
    your_part: c.role === "direct" ? `${o} did this with you directly.` : "You saw this; it was not aimed at you.",
    ...(shape.known ? { what_you_know: knownOf(c) } : {}),
  };
}

// ---------- preambles ----------

type Preamble = (o: string, ch: Channel) => string;

/** B's READ with the typed fields named. */
const P_ONE: Preamble = () =>
  "`now` is the latest thing that happened (`now.act`, done by `now.by`). Take it together with `earlier`, what happened just before it, oldest first, and read it from your side: you are `you`; `who_you_are` holds your own facts (what you hold, what you owe, your people, what you fear); `your_part` says whether it was aimed at you.";

/** Per channel: stake points at the holder's facts, deed at the other's act and words. */
const P_CH: Preamble = (o, ch) =>
  ch === "stake"
    ? "`now` is the latest thing that happened (`now.act`, done by `now.by`). Take it together with `earlier`, what happened just before it, oldest first, and read it from your side: you are `you`; `who_you_are` holds your own facts (what you hold, what you owe, your people, what you fear); `your_part` says whether it was aimed at you."
    : `\`now\` is the latest thing that happened (\`now.act\`). Take it together with \`earlier\`, what happened just before it, oldest first: what ${o} said and did there is part of the same act. Judge ${o}'s act itself, as you (\`you\`) saw it; \`who_you_are.people\` says who each person is to you.`;

/** B's READ itself, unchanged: the typed state keeps B's five top-level field names, so READ still names them. */
const P_READ: Preamble = () => READ;

/** K: B's READ, then the known facts named. */
const P_KNOWN: Preamble = () =>
  `${READ} \`what_you_know\` holds what you know as of now: where people are, who holds what, and your ties to people.`;

/** P_ONE with the topic layout's keys named as paths. */
const P_TOPIC: Preamble = () =>
  "`now` is the latest thing that happened (`now.act`, done by `now.by`). Take it together with `earlier`, what happened just before it, oldest first, and read it from your side: you are `you`, and `who_you_are` holds your own facts (`who_you_are.your_safety`, `who_you_are.your_money_and_possessions`, `who_you_are.your_work_or_business`, `who_you_are.people_close_to_you`, `who_you_are.you_fear`); `your_part` says whether it was aimed at you.";

// ---------- the judge: B's requests over the typed state ----------

function judgeWith(shape: Shape, pre: Preamble): StateVariant["judge"] {
  return async (c: TypedCase, values: Value[], jev: Jev): Promise<Judged> => {
    const s = stateOf(c, shape);
    const o = c.other.name;
    const gates: Record<string, JevQuestion> = {};
    for (const ch of CHANNELS)
      for (const v of values)
        for (const d of DIRS)
          gates[key4(ch, v.id, d)] = { type: "noul", instructions: `${pre(o, ch)} ${statement(v.id, o, ch, d)}` };
    gates.touches = TOUCHES;
    const gate = await jev("gate", s, gates);
    const how: Record<string, JevQuestion> = {};
    for (const ch of CHANNELS)
      for (const v of values)
        for (const d of DIRS) {
          const k = key4(ch, v.id, d);
          if (noul(gate[k]) < ASK_STRENGTH_FROM) continue;
          const q = strength4(v.id, o, ch, d);
          if (!q.instructions.startsWith(READ)) throw new Error("strength4 no longer opens with READ");
          how[k] = { ...q, instructions: pre(o, ch) + q.instructions.slice(READ.length) };
        }
    const h = Object.keys(how).length ? await jev("how", s, how) : {};
    const items: Judged["items"] = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        const up = noul(gate[key4(ch, v.id, "up")]);
        const down = noul(gate[key4(ch, v.id, "down")]);
        items[itemKey(ch, v.id)] = {
          r: up - down,
          effect: up * levelOf(h[key4(ch, v.id, "up")]) - down * levelOf(h[key4(ch, v.id, "down")]),
        };
      }
    return { items, touches: noul(gate.touches) };
  };
}

const variants: StateVariant[] = [
  { id: "t1", judge: judgeWith({ earlier: "all", identity: "entity" }, P_ONE) },
  { id: "t2", judge: judgeWith({ earlier: "all", identity: "entity" }, P_CH) },
  { id: "t3", judge: judgeWith({ earlier: "all", identity: "topic" }, P_TOPIC) },
  { id: "t4", judge: judgeWith({ earlier: "all", identity: "entity" }, P_READ) },
  { id: "t5", judge: judgeWith({ earlier: "all", identity: "entity", events: "compact" }, P_READ) },
  { id: "k1", judge: judgeWith({ earlier: "all", identity: "entity", events: "compact", known: true }, P_KNOWN) },
];

const arm: StateArmModule = { arm: "S", variants, final: "t5", contenders: ["t1"] };
export default arm;

/** For a dry render of the state (no Jev). */
export { stateOf };
