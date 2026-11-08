/**
 * Arm C (value-weighting-4): B plus a congruence channel. Jev never sees an importance; `ask` receives
 * none, and only `score` (code) reads them (contract.ts).
 *
 * FINAL `put-rt`: B's final, unchanged, plus one congruence request, then code.
 *
 * Steps (one judgment, three requests; `cong` runs in parallel with B's two, so latency is B's):
 *   `gate`, `how`: B's final `lin` ask, imported from ./b.ts and called as is (v3's d4 questions: 40
 *     stake/deed nouls and the touches noul, then the chained strength scores). Nothing in them changes.
 *   `cong`: one request, 21 nouls, on a small state of three fields: `you` the holder's name,
 *     `earlier` the holder's own earlier copies in the scenario, `now` the encounter as the holder
 *     received it. The holder's identity and `your_part` are left out: every question here is about
 *     the other person (rule 7; measured, below). Every question opens with READ ("`now` is the latest
 *     thing that happened. Take it together with what was said just before it in `earlier`. `you` is
 *     the person reading this.") and then asks one thing:
 *     - `cong__<value>__up`, noul: "In what {o} did, did they put <X> first?"
 *     - `cong__<value>__down`, noul (the mirror): "In what {o} did, did they set <X> aside for
 *       something else?"
 *       X per value is a literal, concrete paraphrase of the catalogue's description (`X` below), e.g.
 *       security "safety and stability, for themself or the people around them", benevolence "the good
 *       of the people close to them". Up and down are separate absolute questions, never read as each
 *       other's negation (rule 9).
 *     - `reveal`, noul, the channel's own gate: "Does what {o} did tell you something about what kind
 *       of person {o} is?"
 *
 * Score (code), per judgment:
 *   cong      = sum_v w(imp_v) * (P(cong__v__up) - P(cong__v__down)) / sum_v w(imp_v),  w(imp) = imp
 *               (B's linear weighting; a value rated 0 drops out, "matters" counts)
 *   channel   = [P(reveal) >= 0.7] * (1 - P(touches)) * cong       (P(touches) from B's gate request)
 *   score     = B.score + K * channel,  K = 1.  Band 0.05: |score| < 0.05 reads neutral.
 * B.score is B's final unchanged: P(touches) * sum_v imp_v * effect_v / sum_v imp_v. So the two terms
 * split the encounter by the one noul they share: what touches the holder personally is read through
 * B's stake and deed channels, weighted by P(touches); what does not is read as what the act shows about
 * the other, weighted by 1 - P(touches). B's hard gate is TAU 0, so there is no B gate to apply.
 *
 * Every knob, with its measured lift. Candidates were rescored at no cost on logged answers: B's d4
 * answers (v3's 88 labelled cases, 8 to 14 reps; this dev's 36 cases, 12 reps from the B author's runs)
 * plus scratch probes of the `cong` request alone on all 124 cases (1 rep each; a second rep moved
 * nouls by a median 0.01, max 0.09). Totals are M5 / pairs / M1 / neutral hits over 124 cases, 40 pairs,
 * 108 directional, 16 neutral; B's final scores 86 / 21 / 83 / 11 on the same answers.
 *   - Wording (each under the final structure): the orchestrator's starting wording, "Does what {o} did
 *     show that they care about <catalogue description>?" / "... show them acting against <...>?",
 *     90 / 22 / 85 / 10 with identity in the state and 90 / 23 / 85 / 11 without; the same over the
 *     concrete X 91 / 21 / 82 / 11; a trait wording ("show them to be careful and steady: ...") 92 / 21
 *     / 83 / 10; motive ("do this for the sake of X" / "at the cost of X") 90 / 22 / 85 / 11; "show
 *     that X matters a lot / matters little to them" 93 / 24 / 86 / 11; `first` ("show that X comes
 *     first for them" / "counts for little with them") 93 / 24 / 87 / 10; `put` 92 / 23 / 86 / 10. On
 *     the channel alone (sign of cong, no B) put reads direction on 82 of 108 (first 81, care 76, B's
 *     deed channel 75), and 13 of this dev's 15 character cases (care 8). The spread between the top
 *     four is 1 to 2 cases, so the wording choice is weak. On this dev's runs (2 reps each) put-rt beat
 *     first-rt on M5 (25 and 26 against 24, M1 and pairs equal). put is kept because it is the closest
 *     to the surface (rule 3) at no measured cost; `first` and `care` are contenders.
 *   - State: identity and `your_part` left out. With them `first` scored 82 / 22 / 84 / 3 (K 1, x (1 -
 *     touches), no reveal gate) against 90 / 24 / 87 / 7 without; care 90 / 22 / 85 against 90 / 23 / 85.
 *   - The `reveal` gate, threshold 0.7: put without it 85 / 23 / 86 / 3, with it 92 / 23 / 86 / 10. It
 *     is what keeps neutrals neutral: the channel reads +-0.1 on routine acts. P(reveal) on the 124
 *     cases: every character-flagged case 0.78 to 0.87, directional cases from 0.62 (quartiles 0.80,
 *     0.85, 0.87), neutrals 0.26 to 0.81 (13 of 16 under 0.7). Thresholds 0.6, 0.75, 0.8 score 91 /
 *     91 / 92 on M5; 0.7 sits mid-plateau. Two other gate wordings ("a choice that says something about
 *     their character, rather than something routine"; "show what {o} cares about or how {o} treats
 *     people") separated no better.
 *   - (1 - P(touches)): small. For put: 92 / 23 / 86 / 10, against 93 / 23 / 84 / 10 with no touches
 *     factor at K 1, 92 / 24 / 85 / 10 at K 2, 93 / 23 / 83 / 11 with P(touches) as the multiplier (K
 *     1.5). It bought +1 to +3 M1 on each of the three leading wordings (first +2 M1 and +2 M5), and it
 *     has a reason: an act that touches the holder is already read by B's stake nouls, and without the
 *     factor the channel drags those cases (a refusal that puts the holder's place at risk reads as
 *     the other putting safety first). Measured again on dev: put-r (no factor, K 2) M1 24 against 25.
 *   - K 1: for put K 0.5 / 1 / 1.5 / 2 / 3 score 92 / 92 / 92 / 92 / 91 on M5, 86 / 86 / 85 / 84 / 82
 *     on M1; first 90 / 93 / 93 / 92 / 91 and 85 / 87 / 85 / 85 / 86.
 *   - Weighting: B's linear. Squared 93 / 23 / 85 / 10; `top` (only imp 3 or 4, C2's shape) 93 / 23 /
 *     83 / 11, and 95 / 27 / 86 / 10 at K 4 with no touches factor, a lone peak (first: 1 to 4 cases
 *     lower at its neighbours). No measured lift that is not a peak, so linear, and no C2.
 *   - Band 0.05, B's: 0.03 / 0.04 / 0.06 / 0.08 score 91 / 93 / 93 / 91 on M5.
 *
 * Dev (36 cases, 2 reps, `bun score.ts`): put-rt M1 25/32 (B 23), pairs 7/12 (6), M5 25/36 (24),
 * neutrals 2/4 (3), false neutrals 2 (3), M8 11/15 character cases (9), rho 0.64 (0.66); 2.9e-4 USD and
 * 3 requests per judgment (B 2.2e-4, 2).
 *
 * docs/jev.md rules the final leans on: 1 and 2 (one literal statement per noul; up and down asked
 * apart), 4 (no importance reaches Jev), 5 and 6 (code weighs and sums; nouls used as probabilities;
 * the reveal noul only against a threshold), 7 (the cong request gets only the three fields it needs),
 * 8 (yes always means the statement holds), 9 (up and down never read as each other's negation; the
 * touches noul's complement is a weight in code, not read as the answer to another question),
 * composite scoring (weights in code), gate first (the reveal noul gates the channel), and Thresholds
 * (0.7, K and the band from blind dev labels).
 * Rules it bends:
 *   - 3, no indirection. "In what {o} did, did they put X first?" asks about the act, one hop nearer the
 *     surface than "show that they care about X", but reading a priority off an act is still a step
 *     past it; the reveal noul ("tell you something about what kind of person {o} is") is a judgment of
 *     character outright. Both are the channel's point: B's gap is exactly that reading. Kept because the
 *     two-hop wordings measured no better (above), and code, not Jev, still carries what the priority
 *     means to the holder.
 *   - 1, one judgment: X lists two or three things for some values ("money, standing, or control over
 *     others"), as B's own statements do.
 *   - B's inherited bends (rule 7 in its own requests, the touches noul's four-part list) stand, since B
 *     may not change.
 *
 * Contenders (the same three requests; only the cong wording or the score differs):
 *   `first-rt`  "Does what {o} did show that X comes first for them?" / "... counts for little with
 *               them?", same structure (the two-hop wording that led on the 124 cases by a case).
 *   `care-rt`   the orchestrator's starting wording over the catalogue descriptions, same structure.
 *   `put-r`     put, reveal gate, no touches factor, K 2 (the channel independent of B's touches).
 *   `put-t`     put, x (1 - touches), K 1, no reveal gate (what the gate buys on fresh neutrals).
 * `first-r` and `first-t` are the same two ablations on first, measured on dev only.
 *
 * All wording is per value or per channel. No question, weight or threshold names or special-cases a
 * case, scenario or variant; `{o}` is the other person's name from the case.
 */
import type { BuiltCase } from "../../value-weighting-2/build.ts";
import type { Answer, Question, State } from "../../value-weighting-3/jev3.ts";
import type { ArmModule, Bag, Catalogue, Importance, Jev, O2Variant } from "../contract.ts";
import b from "./b.ts";

const bFinal = b.variants.find((v) => v.id === b.final);
if (!bFinal) throw new Error("arm B has no final variant");
/** B's final, frozen: its ask (gate and how requests) and its score, unchanged. */
const B = bFinal;

const noulOf = (a: Answer | undefined) => (a?.type === "noul" ? a.noul : 0);

// ---------- state ----------

/** The congruence questions are about the other person, so the holder's identity is left out (rule 7). */
function stateOf(c: BuiltCase): State {
  return {
    you: c.holder.name,
    earlier: c.history.length ? c.history.map((h) => h.text) : ["(nothing yet)"],
    now: c.event,
  };
}

const READ =
  "`now` is the latest thing that happened. Take it together with what was said just before it in `earlier`. `you` is the person reading this.";

// ---------- congruence wording, per value ----------

type Pair = { up: string; down: string };
type Family = (o: string) => Record<string, Pair>;

/** Each value as the concrete thing a person can put first or count for little, third person. */
const X: Record<string, string> = {
  self_direction: "their own freedom to choose what they do",
  stimulation: "excitement, novelty or a thrill",
  hedonism: "their own pleasure, fun or comfort",
  achievement: "their own success and getting ahead",
  power: "money, standing, or control over others",
  security: "safety and stability, for themself or the people around them",
  conformity: "keeping to the rules and not upsetting people",
  tradition: "custom and the way things have always been done",
  benevolence: "the good of the people close to them",
  universalism: "the good of strangers, the weak, or people in general",
};

const fromX =
  (up: (o: string, x: string) => string, down: (o: string, x: string) => string): Family =>
  (o) =>
    Object.fromEntries(Object.entries(X).map(([id, x]) => [id, { up: up(o, x), down: down(o, x) }]));

/** Contender: what the act shows comes first for them, and what counts for little with them. */
const first = fromX(
  (o, x) => `Does what ${o} did show that ${x} comes first for them?`,
  (o, x) => `Does what ${o} did show that ${x} counts for little with them?`,
);

/** Final: closer to the surface, about the act itself. */
const put = fromX(
  (o, x) => `In what ${o} did, did they put ${x} first?`,
  (o, x) => `In what ${o} did, did they set ${x} aside for something else?`,
);

/**
 * Contender: the orchestrator's starting wording over the catalogue's descriptions in the third person
 * (conformity's spelled out so that "acting against" it reads at once).
 */
const DESC: Record<string, string> = {
  self_direction: "thinking and acting for themself: choosing their own course, creating, exploring",
  stimulation: "excitement, novelty and challenge in life",
  hedonism: "pleasure and enjoyment for themself",
  achievement: "personal success, shown through competence by the standards of those around them",
  power: "status and prestige, or control over people and resources",
  security: "safety, harmony and stability for themself, their relationships and the community around them",
  conformity: "restraint: holding back from what would upset or harm others or break what is expected",
  tradition: "respect for the customs and ways of doing things handed down to them",
  benevolence: "the welfare of the people close to them",
  universalism: "the welfare of all people, strangers and the weak included, and of nature",
};
const care: Family = (o) =>
  Object.fromEntries(
    Object.entries(DESC).map(([id, d]) => [
      id,
      {
        up: `Does what ${o} did show that they care about ${d}?`,
        down: `Does what ${o} did show them acting against ${d}?`,
      },
    ]),
  );

export const FAMILIES: Record<string, Family> = { first, put, care };

/** The channel's gate: does the act say anything about the other's character at all. */
const REVEAL = (o: string) => `Does what ${o} did tell you something about what kind of person ${o} is?`;

const keyC = (id: string, d: "up" | "down") => `cong__${id}__${d}`;

/** The congruence request: one noul per value per direction, each absolute (rule 9), and the reveal noul. */
export function congRequest(
  c: BuiltCase,
  catalogue: Catalogue,
  family: string,
): { state: State; questions: Record<string, Question> } {
  const f = FAMILIES[family];
  if (!f) throw new Error(`no family ${family}`);
  const words = f(c.other.name);
  const questions: Record<string, Question> = {};
  for (const v of catalogue.values) {
    const w = words[v.id];
    if (!w) throw new Error(`no wording for ${v.id}`);
    questions[keyC(v.id, "up")] = { type: "noul", instructions: `${READ} ${w.up}` };
    questions[keyC(v.id, "down")] = { type: "noul", instructions: `${READ} ${w.down}` };
  }
  questions.reveal = { type: "noul", instructions: `${READ} ${REVEAL(c.other.name)}` };
  return { state: stateOf(c), questions };
}

/** B's two requests and the congruence request, in parallel. */
function askC(family: string) {
  return async (c: BuiltCase, catalogue: Catalogue, jev: Jev): Promise<Bag> => {
    const { state, questions } = congRequest(c, catalogue, family);
    const [bag, cong] = await Promise.all([B.ask(c, catalogue, jev), jev("cong", state, questions)]);
    return { ...bag, cong };
  };
}

// ---------- score ----------

/** Weighted mean over values of P(up) - P(down), weight = importance (B's linear weighting). */
function congOf(bag: Bag, imp: Importance, catalogue: Catalogue): number {
  let num = 0;
  let den = 0;
  for (const v of catalogue.values) {
    const wi = imp[v.id] ?? 0;
    if (!wi) continue;
    den += wi;
    num += wi * (noulOf(bag.cong?.[keyC(v.id, "up")]) - noulOf(bag.cong?.[keyC(v.id, "down")]));
  }
  return den ? num / den : 0;
}

/**
 * `k` the channel's weight; `reveal` the threshold on P(reveal) (null: no gate); `untouched` whether
 * the channel is weighted by 1 - P(touches).
 */
function scoreC(k: number, reveal: number | null, untouched: boolean) {
  return (bag: Bag, imp: Importance, catalogue: Catalogue): number => {
    const base = B.score(bag, imp, catalogue);
    if (reveal !== null && noulOf(bag.cong?.reveal) < reveal) return base;
    const t = untouched ? 1 - noulOf(bag.gate?.touches) : 1;
    return base + k * t * congOf(bag, imp, catalogue);
  };
}

const variants: O2Variant[] = [
  { id: "put-rt", ask: askC("put"), score: scoreC(1, 0.7, true), band: 0.05 },
  { id: "first-rt", ask: askC("first"), score: scoreC(1, 0.7, true), band: 0.05 },
  { id: "care-rt", ask: askC("care"), score: scoreC(1, 0.7, true), band: 0.05 },
  { id: "put-r", ask: askC("put"), score: scoreC(2, 0.7, false), band: 0.05 },
  { id: "put-t", ask: askC("put"), score: scoreC(1, null, true), band: 0.05 },
  { id: "first-r", ask: askC("first"), score: scoreC(2, 0.7, false), band: 0.05 },
  { id: "first-t", ask: askC("first"), score: scoreC(1, null, true), band: 0.05 },
];

const c: ArmModule = {
  arm: "C",
  variants,
  final: "put-rt",
  contenders: ["first-rt", "care-rt", "put-r", "put-t"],
};
export default c;
