/**
 * Arm F (jev-state): design B's per-value stage with the questions fixed and the state filtered. Each group of
 * questions is asked over a state that holds only what its judgment turns on, drawn from a B case's own fields (the
 * event, the history, the identity, the role) and the world's names. The touches noul, the size step and every
 * reading are design B's; the combine is the contract's.
 *
 * FINAL `g4-prose`: five groups, each its own request, all in parallel, each chained to its own size request.
 *   - Four stake groups, by what the holder's facts about them share (`GROUPS4`):
 *       `safety` security, power, achievement; `self` self_direction, stimulation, hedonism;
 *       `norms` conformity, tradition; `people` benevolence, universalism.
 *     State: `you` {`name`, `who_you_are`: only the identity's sentences that carry a fact tagged with one of the
 *     group's values, in the identity's order (left out when none do)}, `event` (the rendered line the holder
 *     read), `before` (the holder's earlier lines with the other, `history[].withOther`, oldest first, or
 *     "(nothing)"), `your_part` (B's `your_part` sentence).
 *   - One deed group, all 20 deed nouls. State: `event`, `before`, and `you_and_them.who_you_are`: only the
 *     identity's sentences that carry a fact naming the other (left out when none do).
 *   - `touches` in a request of its own over the full stake state (every sentence).
 *   Rendered, holder Mux (the identity, the same in every set), stake `self`, an event from Rogue:
 *     {"you": {"name": "Mux"}, "event": "Rogue said to you: \"...\"", "before": ["Rogue arrived in Back Room from
 *      The Chrome Cassette.", "Rogue said to you: \"...\""], "your_part": "Rogue did this with you directly."}
 *   and stake `norms` for the same event holds `you.who_you_are`: "You run a parts and repair stall in the Back Room
 *   behind the Chrome Cassette, rented from Rogue, and you are a month behind on that rent."; deed holds that
 *   sentence too (it names Rogue) as `you_and_them.who_you_are`; `safety` holds four of Mux's five sentences.
 * CONTENDER `pv`: per value. Ten stake requests, each over `you` built from the typed facts tagged with that value
 *   only, plus the deed request over the typed facts naming the other; the event and the earlier lines as typed
 *   engine fields (`eventOf`: `act`, `who`, `to`, `where`, `item`, `words`, ...; ids resolved to the names the
 *   holder reads), `before` filtered as above; `touches` over every fact. The most filtered state F tried.
 *
 * Preambles (each gate noul is `<preamble> <statement>`; its size score opens with the same preamble):
 *   stake: "`event` is the latest thing that happened. Take it together with what was said and done just before it
 *     in `before`, oldest first, and read it from your side (`you`, `you.who_you_are`, `your_part`)." (without
 *     `you.who_you_are` when the group holds no sentence); typed (`pv` and the typed variants): "..., and read it
 *     from your side (`you`, `your_part`), against what you have at stake: `you.<key>`, ..." naming every fact
 *     field the state holds.
 *   deed: "`event` is ... oldest first. `you_and_them` is what you know of {o} and you." (the second sentence only
 *     when the state holds it).
 *
 * Imported unchanged: `statement` and `READ` (`../../gate-direction/arms/a.ts`); `TOUCHES`, `strength4`, `levelOf`
 * and `key4` (`../../gate-first-e2e/arms/b.ts`). TOUCHES' words are kept and only its field names swapped (`now` ->
 * `event`, `earlier` -> `before`). The size score is `strength4`'s question with its opening READ replaced by this
 * state's preamble and `now` by `event` (`strengthF`), so its levels and instruction form are B's. The 0.4 from which
 * the size step is asked is B's `ASK_STRENGTH_FROM`, restated (not exported). Readings as B: r = P(up) - P(down);
 * effect = P(up)·L(up) - P(down)·L(down); touches = P(touches).
 *
 * Selection: the holder's identity written once per person as typed facts (`FACTS`, keyed by person id). Each fact
 * names the sentence it comes from (`src`, checked against the case's identity text at run time: if any is missing
 * the whole identity goes as prose), states nothing that sentence doesn't, and carries `tags` (the values whose stake
 * it bears on, justified in its comment from its own words) and `people` (the others it names). A group keeps the
 * facts with one of its values' tags; the deed group the facts whose `people` hold the other. `before` keeps the lines
 * `history[].withOther` marks. The relevance-noul selection (`rel`) was tried and is not the final.
 *
 * Dev (40 cases, 28 scenarios; E3 decides; B is the orchestrator's dev run of arm B, scored beside, 2 reps).
 *   E1 / E2 / E3 / E4 (build, detract) / P1 (stake | deed) / P2 among fired / requests (in sequence), q, USD per judgment
 *   B                  28/35  7/12  0.631  0.435, 0.080   0.773 (0.777 | 0.774)  41/43 95%  2 (2), 55.3 q, 2.4e-4
 *   final `g4-prose`*  29/35  8/12  0.582  0.354, 0.084   0.745 (0.726 | 0.762)  46/50 92%  10.3 (2), 55.6 q, 4.0e-4
 *   contender `pv`*    26/35  6/12  0.576  0.333, 0.043   0.735 (0.715 | 0.760)  37/39 95%  19.1 (2), 55.6 q, 6.5e-4
 *   (* 4 reps: the first 2 in the runs below, 2 fresh in `dev-f-r5`, which alone read 0.572 and 0.583.)
 *   explored, 2 reps:
 *   `g4` typed, groups  26/35  6/12  0.543  0.291, 0.075   0.736 (0.704 | 0.767)  38/39      10.1 (2), 4.8e-4
 *   `pv` typed, per value 26/35 6/12 0.584  0.330, 0.067   0.731 (0.708 | 0.758)  37/39      19.1 (2), 6.5e-4
 *   `ch` typed, stake one request over every fact, deed over facts naming the other
 *                       26/35  6/12  0.558  0.275, 0.136   0.718 (0.674 | 0.759)  40/41      4.0 (2), 3.9e-4
 *   `ch-bare` as `ch`, deed over the event and lines only
 *                       25/35  5/12  0.562  0.253, 0.125   0.691 (0.670 | 0.712)  44/44      3.9 (2), 3.5e-4
 *   `rel` relevance nouls pick `you`'s fields, then `ch-bare`
 *                       24/35  4/12  0.480  0.211, 0.136   0.692 (0.666 | 0.714)  39/39      4.9 (3), 3.7e-4
 *   `ch-prose` `ch` in the final's prose form
 *                       27/35  7/12  0.542  0.403, 0.014   0.747 (0.739 | 0.755)  47/52      4.0 (2), 2.9e-4
 *   `g4-prose`          29/35  8/12  0.592  0.423, 0.107   0.749 (0.730 | 0.766)  47/51      10.3 (2), 4.0e-4
 *   `g4-prose-dw` the final with deed over the whole identity
 *                       26/35  6/12  0.522  0.340, -0.031  0.735 (0.725 | 0.747)  41/41      9.2 (2), 3.9e-4
 * How the final was chosen: highest dev E3 over 2 reps (`g4-prose` 0.592, `pv` 0.584 within 0.02, and `g4-prose`
 * the cheaper). A fresh 2-rep run of both kept the order over 4 reps (0.582 against 0.576). `pv` is the contender:
 * the per-value filter, the design's limit, at the same E3.
 * No F variant reaches B on dev, on E3 or P1. What dev says, item by item:
 *   - Filtering stake removes some false fires (untouched items fall in |r|) but weakens touched ones, and drops
 *     B's "halo": false fires that lean with the encounter's overall valence and so help the case score.
 *   - A group with no fact of its own reads loss where the whole identity held it off: a rent rise read as lost
 *     comfort and choice (hedonism, self_direction down) by a holder whose `self` group is empty.
 *   - Deed loses context it needs when cut to facts naming the other (a protection offer read as endangering when
 *     the threat it answers is in a sentence that doesn't name the actor); with no identity at all, deed P1 fell to
 *     0.71. Yet deed over the whole identity (`g4-prose-dw`) read lower (0.747) than over the naming sentences.
 *   - Typed event and facts read stake worse than the same content in prose (`ch` 0.674 against `ch-prose` 0.739;
 *     `g4` 0.704 against `g4-prose` 0.730); deed barely moves.
 *   - Relevance selection kept too little: E3 0.480, the lowest.
 *   - Dev is near its noise: `ch-prose`, close to B's own state split in two, read E3 0.542 against B's 0.631.
 *
 * docs/jev.md rules leaned on: 7 and "Building state" (each group gets the facts its judgment turns on, "give each
 * question only the context it needs"; history filtered to the lines with the other); "Pointing questions at
 * fields" (each preamble names the fields its state holds, with backticked paths); "Shared state or one per
 * question" (a separate request only where the content differs, every question sharing a state batched in one);
 * chaining (the size step over the same state as its noul); 1, 2, 8 and 9 as B's questions keep them. "Filtering
 * and gating": `rel`'s relevance nouls decide only what the stake state holds and never enter a reading.
 * Rules it bends:
 *   - "Building state", typed fields: the final sends the event, the lines and the identity as prose (the rendered
 *     lines, the identity's own sentences). Typed forms read stake P1 lower on dev in both pairings, and the
 *     prose final had the highest E3; the identity facts are typed, and they decide what each state holds.
 *   - "Shared state or one per question", fewer requests: the final sends ten requests where B sends two, because
 *     the groups' states differ. All five gates go in parallel, so two are in sequence.
 *
 * All wording is per value, per group or per channel; `{o}` is the other's name. Nothing names or special-cases a
 * dev case, scenario or variant; the facts are the three identities, the same in every set. 8 variants.
 *
 * Dev spend: 0.353 USD of the 0.40 cap (smoke 0.004; `g4`, `pv` 0.091; `ch`, `ch-bare`, `rel` 0.089; `ch-prose`,
 * `g4-prose` 0.055; `g4-prose-dw` 0.031; fresh `g4-prose`, `pv` 0.084).
 */
import { READ, statement } from "../../gate-direction/arms/a.ts";
import { key4, levelOf, strength4, TOUCHES } from "../../gate-first-e2e/arms/b.ts";
import type { Jev, JevQuestion, JevState, Judged, StateArmModule, StateVariant, TypedCase, Value } from "../contract.ts";
import { CHANNELS, itemKey, noul } from "../contract.ts";
import type { TypedCopy } from "../build.ts";

type Channel = (typeof CHANNELS)[number];
type Dir = "up" | "down";
const DIRS: Dir[] = ["up", "down"];
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

// ---------- the holder's identity as typed facts ----------

/**
 * One fact from a person's identity text. `src` is the sentence it comes from, word for word; the fact states nothing
 * that sentence doesn't. `key` is the field it goes under in `you` (facts sharing a key become one list, in this
 * file's order). `tags` are the values whose stake judgment the fact bears on, each justified in the comment from the
 * fact's own words. `people` are the person ids the fact is about, besides the holder.
 */
type Fact = { src: string; key: string; value: Json; tags: string[]; people: string[] };

const R1 =
  "You hold the lease on the Chrome Cassette, a smoky bar, and on the Back Room behind it, which you sublet to Mux for his parts stall.";
const R2 =
  "The lease is owed to the Tanaka syndicate: you are 4,000 behind and their collectors come for an installment every week; if you miss enough of them, they take the bar, and the bar is everything you have built.";
const R3 =
  "You hold a data shard of black-market contacts, a thousand people's jacks on it, that a corporate fixer named Saito wants badly.";
const R4 =
  "Glitch, a netrunner hunted by Kestrel Security after a run went wrong, sleeps in the Back Room because you allow it; if Kestrel finds him here, they find you too.";
const R5 = "Mux is a month behind on his rent to you.";
const R6 = "You rely on no one, and you fear losing the bar.";

const G1 = "You are Glitch, a netrunner.";
const G2 = "Three weeks ago a run went wrong and Kestrel Security now has your face and a bounty on you.";
const G3 = "You have almost no money, your deck is failing, and your hands shake from deck burn.";
const G4 = "You sleep in the Back Room only because Rogue tolerates it; if she puts you out, Kestrel will have you within a day.";
const G5 = "You owe Mux 300 for parts; he is a regular supplier and the closest thing you have to a friend.";
const G6 = "Your one stimpak is your only medical backup.";

const M2 =
  "You run a parts and repair stall in the Back Room behind the Chrome Cassette, rented from Rogue, and you are a month behind on that rent.";
const M3 = "Business is thin: your charge cell is the most valuable stock you have left, worth about a month's rent.";
const M4 =
  "Glitch owes you 300 for parts; he is one of your regulars and the nearest thing you have to a friend who talks back.";
const M5 = "The Tanaka syndicate's collectors lean on every stall on the block, and you fear them and you fear eviction.";

const FACTS: Record<string, Fact[]> = {
  rogue: [
    // R1. power: a lease is a holding. (No achievement tag: R1 says nothing of work or success.)
    { src: R1, key: "you_hold", value: { what: "the lease on the Chrome Cassette, a smoky bar, and on the Back Room behind it" }, tags: ["power"], people: [] },
    // R1. power: a sublet to Mux is control over a room he uses; people: Mux.
    { src: R1, key: "you_sublet", value: { room: "the Back Room", to: "Mux", for: "his parts stall" }, tags: ["power"], people: ["mux"] },
    // R2. security: they take the bar if you miss; power: money owed; conformity: a debt you are bound to pay.
    {
      src: R2,
      key: "you_owe",
      value: { to: "the Tanaka syndicate", for: "the lease", behind_by: 4000, collectors_come: "every week, for an installment", if_you_miss_enough: "they take the bar" },
      tags: ["security", "power", "conformity"],
      people: [],
    },
    // R2. achievement: "everything you have built"; security and power: the bar is what they would take.
    { src: R2, key: "the_bar", value: "everything you have built", tags: ["achievement", "security", "power"], people: [] },
    // R3. power: a possession someone wants badly; universalism: a thousand people's jacks are on it.
    {
      src: R3,
      key: "you_hold",
      value: { what: "a data shard of black-market contacts", on_it: "a thousand people's jacks", wanted_badly_by: "Saito, a corporate fixer" },
      tags: ["power", "universalism"],
      people: [],
    },
    // R4. benevolence: someone who relies on you for a bed; power: "because you allow it"; people: Glitch.
    {
      src: R4,
      key: "people",
      value: { who: "Glitch", is: "a netrunner hunted by Kestrel Security after a run went wrong", sleeps_in: "the Back Room, because you allow it" },
      tags: ["benevolence", "power"],
      people: ["glitch"],
    },
    // R4. security: "they find you too"; people: Glitch.
    { src: R4, key: "danger", value: "if Kestrel Security finds Glitch here, they find you too", tags: ["security"], people: ["glitch"] },
    // R5. power: money owed to you; people: Mux.
    { src: R5, key: "owed_to_you", value: { by: "Mux", for: "his rent", behind_by: "a month" }, tags: ["power"], people: ["mux"] },
    // R6. benevolence: whom you rely on.
    { src: R6, key: "you_rely_on", value: "no one", tags: ["benevolence"], people: [] },
    // R6. security: "you fear losing"; achievement: the bar is a business you would lose; power: a holding you would lose.
    { src: R6, key: "you_fear", value: "losing the bar", tags: ["security", "achievement", "power"], people: [] },
  ],
  glitch: [
    // G1. achievement: your trade.
    { src: G1, key: "work", value: "netrunner", tags: ["achievement"], people: [] },
    // G2. security: a bounty on you; achievement: a run that went wrong is a failure at your trade.
    { src: G2, key: "danger", value: { from: "Kestrel Security", they_have: "your face and a bounty on you", since: "a run went wrong three weeks ago" }, tags: ["security", "achievement"], people: [] },
    // G3. power and security: no money.
    { src: G3, key: "money", value: "almost none", tags: ["power", "security"], people: [] },
    // G3. achievement: the deck is your trade's tool.
    { src: G3, key: "your_deck", value: "failing", tags: ["achievement"], people: [] },
    // G3. hedonism: bodily discomfort; security: health.
    { src: G3, key: "health", value: "your hands shake from deck burn", tags: ["hedonism", "security"], people: [] },
    // G4. security: Kestrel within a day if put out; self_direction and power: only because Rogue tolerates it.
    {
      src: G4,
      key: "shelter",
      value: { where: "the Back Room", only_because: "Rogue tolerates it", if_she_puts_you_out: "Kestrel will have you within a day" },
      tags: ["security", "self_direction", "power"],
      people: ["rogue"],
    },
    // G5. power: money you owe; conformity: a debt you are bound to pay.
    { src: G5, key: "you_owe", value: { to: "Mux", amount: 300, for: "parts" }, tags: ["power", "conformity"], people: ["mux"] },
    // G5. benevolence: "the closest thing you have to a friend".
    { src: G5, key: "people", value: { who: "Mux", is: "a regular supplier and the closest thing you have to a friend" }, tags: ["benevolence"], people: ["mux"] },
    // G6. security: your only medical backup; power: a possession.
    { src: G6, key: "you_hold", value: { what: "one stimpak", is: "your only medical backup" }, tags: ["security", "power"], people: [] },
  ],
  mux: [
    // M2. achievement: your trade and business; power: what you run.
    { src: M2, key: "work", value: { runs: "a parts and repair stall", where: "the Back Room behind the Chrome Cassette", rented_from: "Rogue" }, tags: ["achievement", "power"], people: ["rogue"] },
    // M2. security: being behind on the rent for the stall you work from is trouble over you; power: money owed;
    // conformity: a debt you are bound to pay.
    { src: M2, key: "you_owe", value: { to: "Rogue", for: "the stall's rent", behind_by: "a month" }, tags: ["security", "power", "conformity"], people: ["rogue"] },
    // M3. achievement: your business; power and security: thin business is thin money.
    { src: M3, key: "business", value: "thin", tags: ["achievement", "power", "security"], people: [] },
    // M3. power: a possession of worth; achievement: stock is your business.
    { src: M3, key: "you_hold", value: { what: "your charge cell", is: "the most valuable stock you have left", worth: "about a month's rent" }, tags: ["power", "achievement"], people: [] },
    // M4. power: money owed to you; people: Glitch.
    { src: M4, key: "owed_to_you", value: { by: "Glitch", amount: 300, for: "parts" }, tags: ["power"], people: ["glitch"] },
    // M4. benevolence: "the nearest thing you have to a friend"; achievement: one of your regulars.
    { src: M4, key: "people", value: { who: "Glitch", is: "one of your regulars and the nearest thing you have to a friend who talks back" }, tags: ["benevolence", "achievement"], people: ["glitch"] },
    // M5. security and power: collectors lean on every stall.
    { src: M5, key: "danger", value: "the Tanaka syndicate's collectors lean on every stall on the block", tags: ["security", "power"], people: [] },
    // M5. security: fear.
    { src: M5, key: "you_fear", value: ["the Tanaka syndicate's collectors", "eviction"], tags: ["security"], people: [] },
  ],
};

/** The holder's facts, or null when its identity text is not the one they were written from (then the prose goes). */
function factsOf(c: TypedCase): Fact[] | null {
  const fs = FACTS[c.holder.id];
  if (!fs || !fs.every((f) => c.identity.includes(f.src))) return null;
  return fs;
}

/**
 * `you`: the holder's name, then the kept facts as fields (facts sharing a key become one list, in order); or, when
 * the identity is not the one the facts were written from, the name and the identity prose as `who_you_are`.
 */
function youOf(c: TypedCase, keep: (f: Fact) => boolean): Record<string, Json> {
  const fs = factsOf(c);
  if (!fs) return { name: c.holder.name, who_you_are: c.identity };
  const out: Record<string, Json> = { name: c.holder.name };
  for (const f of fs)
    if (keep(f)) {
      const cur = out[f.key];
      out[f.key] = Array.isArray(cur) ? [...cur, f.value] : [f.value];
    }
  return out;
}
const pathsOf = (o: Record<string, Json>, root: string) =>
  Object.keys(o)
    .filter((k) => k !== "name")
    .map((k) => `\`${root}.${k}\``);

// ---------- the event and the lines before it, typed ----------

/** One engine copy as typed fields, ids resolved to the names the holder reads ("you" for the holder). */
function eventOf(cp: TypedCopy, names: Record<string, string>): Record<string, Json> {
  const n = (id: unknown) => (typeof id === "string" ? (names[id] ?? id) : "");
  const p = cp.payload;
  const who = n(cp.actor);
  const to = cp.targets.map(n);
  const words = typeof p.words === "string" ? p.words : undefined;
  switch (cp.subkind) {
    case "physical.depart":
      return { act: "left", who, from: n(p.from), heading_for: n(p.to) };
    case "physical.arrive": {
      const e: Record<string, Json> = { act: "arrived", who, in: n(p.to), from: n(p.from) };
      if (Array.isArray(p.present)) e.present = p.present.length ? p.present.map(n) : ["nobody"];
      return e;
    }
    case "speech.say":
      return { act: "said to the room", who, where: n(cp.place), words: words ?? "" };
    case "speech.say-to":
      return { act: "said to", who, to, where: n(cp.place), words: words ?? "" };
    case "speech.whisper":
      return words === undefined
        ? { act: "whispered to", who, to, where: n(cp.place), words: "(you could not hear the words)" }
        : { act: "whispered to", who, to, where: n(cp.place), words };
    case "exchange.offer":
      return { act: "offered", who, item: n(p.item), to, where: n(cp.place) };
    case "exchange.accept":
      return { act: "accepted", who, item: n(p.item), from: n(p.from) };
    case "exchange.refuse":
      return { act: "refused", who, item: n(p.item), from: n(p.from) };
    case "exchange.lapse":
      return { act: "offer lapsed unanswered", item: n(p.item), offered_by: n(p.from), offered_to: n(p.to) };
    default:
      return { act: cp.subkind, who };
  }
}

type Hist = "other" | "all";
/**
 * How a state is written. `typed`: the event and the lines before it as engine fields (`eventOf`), and `you` as the
 * typed facts. `prose`: the event and the lines before it as the rendered lines the holder reads (`c.event`,
 * `c.history[].text`), and `you.who_you_are` as the identity's own sentences that the kept facts come from, in the
 * identity's order (all of it when every fact is kept).
 */
type Form = "typed" | "prose";
type Opts = { hist: Hist; form: Form };

function beforeOf(c: TypedCase, o: Opts): Json[] {
  if (o.form === "prose") {
    const hs = c.history.filter((h) => o.hist === "all" || h.withOther);
    return hs.length ? hs.map((h) => h.text) : ["(nothing)"];
  }
  const hs = c.historyCopies.filter((h) => o.hist === "all" || h.withOther);
  return hs.length ? hs.map((h) => eventOf(h, c.names)) : ["(nothing)"];
}
const nowOf = (c: TypedCase, o: Opts): Json => (o.form === "prose" ? c.event : eventOf(c.copy, c.names));

const partOf = (c: TypedCase) =>
  c.role === "direct" ? `${c.other.name} did this with you directly.` : "You saw this; it was not aimed at you.";

/** The identity's sentences that the kept facts come from, in the identity's order; the whole text if all are kept. */
function sentencesOf(c: TypedCase, keep: (f: Fact) => boolean): string | null {
  const fs = factsOf(c);
  if (fs === null || fs.every(keep)) return c.identity;
  const srcs = new Set(fs.filter(keep).map((f) => f.src));
  if (!srcs.size) return null;
  return [...srcs].sort((a, b) => c.identity.indexOf(a) - c.identity.indexOf(b)).join(" ");
}

// ---------- states and preambles ----------

/** A state plus the preamble that names its fields; every question asked over it opens with the preamble. */
type Built = { state: JevState; pre: string };

const LEAD = "`event` is the latest thing that happened. Take it together with what was said and done just before it in `before`, oldest first";

/** A stake state: the event, the lines before it, your part, and the holder's facts the group's values bear on. */
function stakeState(c: TypedCase, keep: (f: Fact) => boolean, o: Opts): Built {
  let you: Record<string, Json>;
  if (o.form === "prose") {
    const who = sentencesOf(c, keep);
    you = who === null ? { name: c.holder.name } : { name: c.holder.name, who_you_are: who };
  } else you = youOf(c, keep);
  const state: Record<string, Json> = { you, event: nowOf(c, o), before: beforeOf(c, o), your_part: partOf(c) };
  const paths = pathsOf(you, "you");
  const pre =
    o.form === "prose"
      ? paths.length
        ? `${LEAD}, and read it from your side (\`you\`, ${paths.join(", ")}, \`your_part\`).`
        : `${LEAD}, and read it from your side (\`you\`, \`your_part\`).`
      : paths.length
        ? `${LEAD}, and read it from your side (\`you\`, \`your_part\`), against what you have at stake: ${paths.join(", ")}.`
        : `${LEAD}, and read it from your side (\`you\`, \`your_part\`).`;
  return { state, pre };
}

/**
 * The deed state: the event and the lines before it, plus the holder's facts by `them`: `none`, those that name the
 * other (`names`), or every one (`all`, under `you`, as a stake state holds them).
 */
type Them = "none" | "names" | "all";
function deedState(c: TypedCase, o: Opts, them: Them): Built {
  const state: Record<string, Json> = { event: nowOf(c, o), before: beforeOf(c, o) };
  if (them === "none") return { state, pre: `${LEAD}.` };
  if (them === "all") {
    const s = stakeState(c, () => true, o);
    const st = s.state as Record<string, Json>;
    return { state: { you: st.you ?? null, ...state, your_part: partOf(c) }, pre: s.pre };
  }
  const names = (f: Fact) => f.people.includes(c.other.id);
  let ut: Record<string, Json>;
  if (o.form === "prose") {
    const fs = factsOf(c);
    const who = fs === null ? c.identity : sentencesOf(c, names);
    ut = who === null ? {} : { who_you_are: who };
  } else {
    ut = factsOf(c) === null ? { who_you_are: c.identity } : youOf(c, names);
    delete ut.name;
  }
  if (!Object.keys(ut).length) return { state, pre: `${LEAD}.` };
  state.you_and_them = ut;
  return { state, pre: `${LEAD}. \`you_and_them\` is what you know of ${c.other.name} and you.` };
}

/** TOUCHES, its words unchanged but the field names: `now` -> `event`, `earlier` -> `before`. */
const touchesQ: JevQuestion = {
  ...TOUCHES,
  instructions: TOUCHES.instructions.replace("`now`", "`event`").replace("`earlier`", "`before`"),
};

/** v3's strength score (`strength4`, imported) with B's READ swapped for this state's preamble and `now` for `event`. */
function strengthF(pre: string, id: string, o: string, ch: Channel, d: Dir): JevQuestion {
  const q = strength4(id, o, ch, d);
  if (!q.instructions.startsWith(READ)) throw new Error("strength4 no longer opens with READ");
  return { ...q, instructions: `${pre}${q.instructions.slice(READ.length)}`.replace("`now`", "`event`") };
}

// ---------- the judge ----------

/**
 * One request's worth: a name, the state and preamble, and the (channel, value) items asked over it; `touches` puts
 * the touches noul in this request too (over this state), in place of a request of its own.
 */
type Ask = { name: string; built: Built; items: [Channel, string][]; touches?: boolean };

type Plan = (c: TypedCase, values: Value[], jev: Jev) => Promise<Ask[]>;

function judgeWith(plan: Plan, o: Opts): StateVariant["judge"] {
  return async (c, values, jev: Jev): Promise<Judged> => {
    const on = c.other.name;
    const ups: Record<string, number> = {};
    const lv: Record<string, number> = {};
    let touches: number | undefined;
    const run = async (a: Ask) => {
      const gates: Record<string, JevQuestion> = {};
      for (const [ch, id] of a.items)
        for (const d of DIRS) gates[key4(ch, id, d)] = { type: "noul", instructions: `${a.built.pre} ${statement(id, on, ch, d)}` };
      const g = await jev(`gate-${a.name}`, a.built.state, a.touches ? { ...gates, touches: touchesQ } : gates);
      if (a.touches) touches = noul(g.touches);
      const how: Record<string, JevQuestion> = {};
      for (const k of Object.keys(gates)) {
        ups[k] = noul(g[k]);
        const [ch, id, d] = k.split("__") as [Channel, string, Dir];
        if (ups[k] >= ASK_STRENGTH_FROM) how[k] = strengthF(a.built.pre, id, on, ch, d);
      }
      const h = Object.keys(how).length ? await jev(`how-${a.name}`, a.built.state, how) : {};
      for (const k of Object.keys(gates)) lv[k] = levelOf(h[k]);
    };
    const own = async () => {
      const t = stakeState(c, () => true, o);
      touches = noul((await jev("touches", t.state, { touches: touchesQ })).touches);
    };
    const asks = await plan(c, values, jev);
    await Promise.all([...asks.map(run), ...(asks.some((a) => a.touches) ? [] : [own()])]);
    if (touches === undefined) throw new Error("no touches");
    const items: Judged["items"] = {};
    for (const ch of CHANNELS)
      for (const v of values) {
        const u = ups[key4(ch, v.id, "up")];
        const dn = ups[key4(ch, v.id, "down")];
        if (u === undefined || dn === undefined) throw new Error(`no ask for ${ch} ${v.id}`);
        items[itemKey(ch, v.id)] = {
          r: u - dn,
          effect: u * (lv[key4(ch, v.id, "up")] ?? 1) - dn * (lv[key4(ch, v.id, "down")] ?? 1),
        };
      }
    return { items, touches };
  };
}

/** gate-first-e2e B's `ASK_STRENGTH_FROM` (not exported there): the size step is asked from a noul of 0.4. */
const ASK_STRENGTH_FROM = 0.4;

/** Stake values grouped by what the holder's facts about them share; any value not named here gets its own group. */
const GROUPS4: Record<string, string[]> = {
  safety: ["security", "power", "achievement"],
  self: ["self_direction", "stimulation", "hedonism"],
  norms: ["conformity", "tradition"],
  people: ["benevolence", "universalism"],
};

const deedAsk = (c: TypedCase, ids: string[], o: Opts, deedThem: Them): Ask => ({
  name: "deed",
  built: deedState(c, o, deedThem),
  items: ids.map((v) => ["deed", v] as [Channel, string]),
});

function grouped(groups: Record<string, string[]> | "per-value", o: Opts, deedThem: Them): Plan {
  return async (c, values) => {
    const ids = values.map((v) => v.id);
    const gs: Record<string, string[]> = {};
    if (groups === "per-value") for (const id of ids) gs[id] = [id];
    else {
      for (const [g, vs] of Object.entries(groups)) {
        const in_ = vs.filter((v) => ids.includes(v));
        if (in_.length) gs[g] = in_;
      }
      for (const id of ids) if (!Object.values(gs).some((vs) => vs.includes(id))) gs[id] = [id];
    }
    const asks: Ask[] = Object.entries(gs).map(([g, vs]) => ({
      name: `stake-${g}`,
      built: stakeState(c, (f) => f.tags.some((t) => vs.includes(t)), o),
      items: vs.map((v) => ["stake", v] as [Channel, string]),
    }));
    // With every fact, the deed state is the touches state, so touches rides in the deed request.
    asks.push({ ...deedAsk(c, ids, o, deedThem), touches: deedThem === "all" });
    return asks;
  };
}

/** Stake in one request over every fact (touches beside it), deed in another. */
function byChannel(o: Opts, deedThem: Them): Plan {
  return async (c, values) => {
    const ids = values.map((v) => v.id);
    return [
      { name: "stake", built: stakeState(c, () => true, o), items: ids.map((v) => ["stake", v] as [Channel, string]), touches: true },
      deedAsk(c, ids, o, deedThem),
    ];
  };
}

/** A fact field as one line of text for a relevance noul: `you_owe: to the Tanaka syndicate; behind by 4000; ...`. */
function lineOf(key: string, vals: Json): string {
  const one = (v: Json): string =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.entries(v)
          .map(([k, x]) => `${k.replace(/_/g, " ")} ${one(x)}`)
          .join("; ")
      : Array.isArray(v)
        ? v.map(one).join(" | ")
        : String(v);
  return `${key.replace(/_/g, " ")}: ${one(vals)}`;
}

const REL_FROM = 0.5;

/**
 * Relevance first (step `select`): over the event, the lines before it and your part, one noul per field of `you`
 * ("does what happened bear on this, for better or worse"); only the fields at `REL_FROM` or above go into the stake
 * state. The answers decide only what that state holds and never enter a reading. Then stake in one request over
 * the kept fields (touches beside it), deed in another (asked in parallel with `select`).
 */
function selected(o: Opts, deedThem: Them): Plan {
  return async (c, values, jev) => {
    const ids = values.map((v) => v.id);
    const all = youOf(c, () => true);
    const keys = Object.keys(all).filter((k) => k !== "name" && k !== "who_you_are");
    let keep = new Set(keys);
    if (keys.length) {
      const state: Record<string, Json> = { you: { name: c.holder.name }, event: nowOf(c, o), before: beforeOf(c, o), your_part: partOf(c) };
      const qs: Record<string, JevQuestion> = {};
      for (const k of keys)
        qs[`rel__${k}`] = {
          type: "noul",
          instructions: `${LEAD}, and read it from your side (\`you\`, \`your_part\`). Does what happened bear on this part of your situation, for better or worse? ${lineOf(k, all[k] ?? null)}`,
        };
      const a = await jev("select", state, qs);
      keep = new Set(keys.filter((k) => noul(a[`rel__${k}`]) >= REL_FROM));
    }
    const facts = factsOf(c);
    return [
      {
        name: "stake",
        built: stakeState(c, (f) => facts === null || keep.has(f.key), o),
        items: ids.map((v) => ["stake", v] as [Channel, string]),
        touches: true,
      },
      deedAsk(c, ids, o, deedThem),
    ];
  };
}

const TYPED: Opts = { hist: "other", form: "typed" };
const PROSE: Opts = { hist: "other", form: "prose" };

const variants: StateVariant[] = [
  // explored on dev, 2 reps each (header table)
  { id: "g4", judge: judgeWith(grouped(GROUPS4, TYPED, "names"), TYPED) },
  { id: "pv", judge: judgeWith(grouped("per-value", TYPED, "names"), TYPED) },
  { id: "ch", judge: judgeWith(byChannel(TYPED, "names"), TYPED) },
  { id: "ch-bare", judge: judgeWith(byChannel(TYPED, "none"), TYPED) },
  { id: "rel", judge: judgeWith(selected(TYPED, "none"), TYPED) },
  { id: "ch-prose", judge: judgeWith(byChannel(PROSE, "names"), PROSE) },
  // final (`g4-prose`) and contender (`pv`, above)
  { id: "g4-prose", judge: judgeWith(grouped(GROUPS4, PROSE, "names"), PROSE) },
  { id: "g4-prose-dw", judge: judgeWith(grouped(GROUPS4, PROSE, "all"), PROSE) },
];

const arm: StateArmModule = { arm: "F", variants, final: "g4-prose", contenders: ["pv"] };
export default arm;
