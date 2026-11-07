/**
 * Arm O1: Jev applies the holder's importances. The state presents the holder as the final game
 * would (identity, what it cares about in words derived from its importances, the relationship so
 * far, the encounter); the score is a fixed mapping of Jev's answers with no importance in it.
 */
import type { JevQuestion } from "../../../../harness/src/jev.ts";
import catalogue from "../catalogue.json";
import type { BuiltCase } from "../build.ts";
import type { Answers, Importance, O1Module, O1Variant } from "../contract.ts";

type Value = { id: string; description: string };
const VALUES = (catalogue as { values: Value[] }).values;
const SCALE = (catalogue as { importance_scale: Record<string, string> }).importance_scale;

/**
 * Each value in the holder's own terms, second person: what caring about it looks like, and what
 * not caring about it looks like. Generic paraphrases of the catalogue's descriptions, no scenario.
 */
const VOICE: Record<string, { high: string; low: string }> = {
  self_direction: {
    high: "making your own choices and going your own way; nobody else runs your life",
    low: "you don't need to call your own shots; going along with others' plans is fine by you",
  },
  stimulation: {
    high: "excitement, risk and something new; a dull, safe life is the worst thing",
    low: "you have no appetite for thrills or risk for their own sake",
  },
  hedonism: {
    high: "enjoying yourself; pleasure and comfort are what life is for",
    low: "your own pleasure and comfort don't drive you",
  },
  achievement: {
    high: "being good at what you do and being seen to be; success, earnings and a name that counts",
    low: "you don't care about proving yourself or being seen to succeed",
  },
  power: {
    high: "standing and control: having the say over people and what moves, and being respected for it",
    low: "you have no wish to be on top of anyone or to control what they do",
  },
  security: {
    high: "safety and stability for yourself and those around you; keeping danger and trouble away",
    low: "safety and stability aren't what you live for; you shrug off danger",
  },
  conformity: {
    high: "keeping to the rules and to what's expected; not doing things that upset, cross or harm people",
    low: "you don't care about rules or what's expected; you'll cross a line if it suits you",
  },
  tradition: {
    high: "respect for custom, for the old ways and for the commitments you were raised to honour",
    low: "custom and the old ways mean nothing to you",
  },
  benevolence: {
    high: "looking after the people close to you; their welfare comes before your own gain",
    low: "the welfare of the people around you isn't your concern; you look out for yourself",
  },
  universalism: {
    high: "fairness and decency toward everyone, strangers included, and harm to no one",
    low: "you don't concern yourself with fairness or harm to people at large",
  },
};

/**
 * Each value turned toward other people, second person: how someone who holds it high, or not at
 * all, warms to or resents what others do. The relationship question is about another person, so
 * the values are put in the terms that question is asked in. Generic, no scenario.
 */
const LENS: Record<string, { high: string; low: string }> = {
  self_direction: {
    high: "You warm to people who go their own way and let you go yours. You resent anyone who meddles in your affairs, speaks for you or decides for you.",
    low: "Whether people let you run your own affairs doesn't bother you; you're happy to have others step in and decide.",
  },
  stimulation: {
    high: "You warm to people with nerve, who take risks and bring something new. You have no patience for caution, timidity or a dull life.",
    low: "You have no taste for risk or thrills; daring for its own sake doesn't impress you.",
  },
  hedonism: {
    high: "You warm to people who bring you pleasure, comfort and a good time. You resent anyone who spoils your enjoyment.",
    low: "Your own pleasure and comfort hardly enter into how you judge people.",
  },
  achievement: {
    high: "You warm to people who respect your skill and help you succeed and earn. You resent anyone who belittles your work or costs you success.",
    low: "Success and recognition don't move you; whether someone helps or hurts your standing hardly matters to you.",
  },
  power: {
    high: "You warm to people who respect your say and add to your standing and control. You resent anyone who defies you, undercuts your authority or takes from what is yours.",
    low: "You don't need anyone to defer to you; who has the upper hand doesn't concern you.",
  },
  security: {
    high: "You warm to people who keep things safe and steady and keep danger away from you and yours. You resent anyone who brings risk, trouble or instability near you.",
    low: "Safety and stability aren't what you live for; people who play it safe don't impress you.",
  },
  conformity: {
    high: "You warm to people who keep to the rules and to what is expected, and don't upset or cross others. You resent rule-breakers and people who make trouble.",
    low: "Rules and what is expected mean little to you; you don't hold it against anyone for crossing a line.",
  },
  tradition: {
    high: "You warm to people who honour custom, keep their word and respect the way things have always been done. You resent anyone who breaks faith with them.",
    low: "Custom and the old ways mean nothing to you, in yourself or in others.",
  },
  benevolence: {
    high: "You warm to people who look after others and to anything that keeps the people close to you safe and well, even at a cost to you. You resent anyone who harms, uses or neglects those close to you.",
    low: "Kindness and sacrifice don't move you; the welfare of the people around you isn't your concern, and you look out for yourself.",
  },
  universalism: {
    high: "You warm to people who are fair and decent to everyone. You resent cruelty, cheating and anyone who exploits others.",
    low: "Fairness to people at large isn't your concern; you don't judge anyone by how they treat strangers.",
  },
};

/** Values turned toward others: central and strong ones first, then the ones that leave the holder cold. */
function lens(imp: Importance, opts: { middle: boolean }): string {
  const lines: string[] = [];
  const central = byLevel(imp, [4]);
  const strong = byLevel(imp, [3]);
  const cold = byLevel(imp, [0]);
  if (central.length)
    lines.push(`Central to who you are:\n${central.map((v) => `  - ${LENS[v.id]?.high}`).join("\n")}`);
  if (strong.length)
    lines.push(`Matters a lot to you:\n${strong.map((v) => `  - ${LENS[v.id]?.high}`).join("\n")}`);
  if (opts.middle) {
    const mid = byLevel(imp, [2]).map((v) => v.description.split(":")[0]);
    if (mid.length) lines.push(`You care somewhat about ${mid.join("; ")}.`);
    const weak = byLevel(imp, [1]).map((v) => v.description.split(":")[0]);
    if (weak.length) lines.push(`You care only a little about ${weak.join("; ")}.`);
  }
  if (cold.length)
    lines.push(`Doesn't matter to you at all:\n${cold.map((v) => `  - ${LENS[v.id]?.low}`).join("\n")}`);
  return lines.join("\n");
}

const firstName = (c: BuiltCase) => c.holder.name;

function historyText(c: BuiltCase, mark: boolean): string {
  if (c.history.length === 0) return "(nothing yet: this is the first thing that has happened)";
  return c.history
    .map((h) => `- ${h.text}${mark && h.withOther ? ` [involves ${c.other.name}]` : ""}`)
    .join("\n");
}

function encounterLine(c: BuiltCase): string {
  return c.role === "direct"
    ? `It happened to you directly, with ${c.other.name}.`
    : `You witnessed it: it involves ${c.other.name}, and you saw or heard it.`;
}

const byLevel = (imp: Importance, levels: number[]) =>
  VALUES.filter((v) => levels.includes(imp[v.id] ?? 0));

/** All ten values, grouped under the catalogue's own wording for each importance tier. */
function tiers(imp: Importance): string {
  const out: string[] = [];
  for (const level of [4, 3, 2, 1, 0]) {
    const vs = byLevel(imp, [level]);
    if (!vs.length) continue;
    const head = (SCALE[String(level)] ?? "")
      .replace("who this person is", "who you are")
      .replace("does not matter to this person", "does not matter to you")
      .replace("matters", "matter to you");
    out.push(`${head[0]?.toUpperCase()}${head.slice(1)}:\n${vs.map((v) => `  - ${v.description}`).join("\n")}`);
  }
  return out.join("\n");
}

/** A short paragraph in the holder's terms: what drives it, then what leaves it cold. */
function outlook(imp: Importance): string {
  const central = byLevel(imp, [4]).map((v) => VOICE[v.id]?.high);
  const strong = byLevel(imp, [3]).map((v) => VOICE[v.id]?.high);
  const middling = byLevel(imp, [2]).map((v) => v.description.split(":")[0]);
  const cold = byLevel(imp, [0]).map((v) => VOICE[v.id]?.low);
  const lines: string[] = [];
  const bullets = (xs: (string | undefined)[]) => xs.map((x) => `  - ${x}`).join("\n");
  if (central.length) lines.push(`What you live by, above everything:\n${bullets(central)}`);
  if (strong.length) lines.push(`What matters a lot to you:\n${bullets(strong)}`);
  if (middling.length) lines.push(`You care, but not deeply, about ${middling.join(", ")}.`);
  const weak = byLevel(imp, [1]).map((v) => v.description.split(":")[0]);
  if (weak.length) lines.push(`You give little weight to ${weak.join(", ")}.`);
  if (cold.length) lines.push(`What leaves you cold:\n${bullets(cold)}`);
  return lines.join("\n");
}

const LENS_NOTE = (name: string) =>
  `This is how you, ${name}, see everything: the same event can sit well with one person and badly with another, depending on what each of them cares about. You weigh what happens by your own values, above all the ones central to you, not by what a typical person would feel.`;

/** Identity, history and the encounter first; what the holder cares about last, next to the question. */
function frameLate(c: BuiltCase, cares: string, opts: { reads?: boolean } = {}): string {
  const name = firstName(c);
  return [
    c.identity,
    "",
    `## What has happened so far`,
    historyText(c, true),
    "",
    `## What just happened`,
    c.event,
    encounterLine(c),
    ...(opts.reads
      ? [
          c.role === "direct"
            ? `What ${c.other.name} does to you or with you shows you where you stand with them.`
            : `What ${c.other.name} does, even when it isn't done to you, shows you who they are and what they mean for you and what you care about.`,
        ]
      : []),
    "",
    `## How you, ${name}, judge people`,
    cares,
    "",
    LENS_NOTE(name),
  ].join("\n");
}

function frame(c: BuiltCase, cares: string, opts: { mark: boolean; lens: boolean }): string {
  const name = firstName(c);
  return [
    c.identity,
    "",
    `## What you care about`,
    cares,
    ...(opts.lens
      ? ["", LENS_NOTE(name)]
      : []),
    "",
    `## What has happened so far`,
    historyText(c, opts.mark),
    "",
    `## What just happened`,
    c.event,
    encounterLine(c),
  ].join("\n");
}

// ---------- questions ----------

const SCALE5_W: Record<string, number> = {
  much_better: 2,
  better: 1,
  no_change: 0,
  worse: -1,
  much_worse: -2,
};

function scale5(c: BuiltCase): Record<string, JevQuestion> {
  const n = firstName(c);
  const o = c.other.name;
  return {
    relationship: {
      type: "choice",
      instructions: `Judging as ${n}, by what ${n} cares about, how does what just happened change how ${n} feels about ${o}?`,
      criteria: {
        much_better: `${n} thinks clearly better of ${o} or feels much closer to them: it serves something ${n} cares about deeply`,
        better: `${n} thinks a little better of ${o}`,
        no_change: `Nothing changes between ${n} and ${o}: it is routine, small talk, or touches nothing ${n} cares about`,
        worse: `${n} thinks a little worse of ${o}`,
        much_worse: `${n} thinks clearly worse of ${o} or feels pushed away: it goes against something ${n} cares about deeply`,
      },
    },
  };
}

/** The scale plus a gate: does this touch anything the holder cares about at all? */
function gatedScale5(c: BuiltCase): Record<string, JevQuestion> {
  const n = firstName(c);
  return {
    touches: {
      type: "noul",
      instructions: `Does what just happened touch anything ${n} cares about (any of ${n}'s values that matter to ${n}), rather than being routine or beside the point for ${n}?`,
    },
    ...scale5(c),
  };
}

function showScale5(c: BuiltCase): Record<string, JevQuestion> {
  const n = firstName(c);
  const o = c.other.name;
  return {
    relationship: {
      type: "choice",
      instructions: `Measured against what ${n} cares about, what does what just happened show ${n} about ${o}, and so how does ${n} now feel about ${o}?`,
      criteria: {
        much_better: `${o} clearly stands with what ${n} cares about most: ${n} thinks much better of ${o}`,
        better: `It sits a little well with what ${n} cares about: ${n} thinks a little better of ${o}`,
        no_change: `It shows nothing either way: routine, small talk, or nothing ${n} cares about is at stake`,
        worse: `It sits a little badly with what ${n} cares about: ${n} thinks a little worse of ${o}`,
        much_worse: `${o} clearly goes against what ${n} cares about most: ${n} thinks much worse of ${o}`,
      },
    },
  };
}

const expect = (a: Answers, key: string, w: Record<string, number>): number => {
  const ans = a[key];
  if (!ans || !("probabilities" in ans)) return 0;
  let s = 0;
  for (const [k, p] of Object.entries(ans.probabilities)) s += (w[k] ?? 0) * p;
  return s;
};

function choice3(c: BuiltCase): Record<string, JevQuestion> {
  const n = firstName(c);
  const o = c.other.name;
  return {
    relationship: {
      type: "choice",
      instructions: `From ${n}'s own point of view, given what ${n} cares about, does what just happened build on, detract from, or leave unchanged ${n}'s relationship with ${o}?`,
      criteria: {
        build: `It builds on the relationship: ${n} now thinks better of ${o}`,
        neutral: `It leaves the relationship as it was: nothing ${n} cares about is touched`,
        detract: `It detracts from the relationship: ${n} now thinks worse of ${o}`,
      },
    },
  };
}
const W3: Record<string, number> = { build: 1, neutral: 0, detract: -1 };

function nouls(c: BuiltCase): Record<string, JevQuestion> {
  const n = firstName(c);
  const o = c.other.name;
  return {
    builds: {
      type: "noul",
      instructions: `Judging as ${n}, by what ${n} cares about most: does what just happened make ${n} think better of ${o} or feel closer to them?`,
    },
    detracts: {
      type: "noul",
      instructions: `Judging as ${n}, by what ${n} cares about most: does what just happened make ${n} think worse of ${o} or feel further from them?`,
    },
  };
}
const nv = (a: Answers, k: string) => {
  const x = a[k];
  return x && "noul" in x ? x.noul : 0;
};

// ---------- variants ----------

const variants: O1Variant[] = [
  {
    id: "tiers-c3",
    state: (c, imp) => frame(c, tiers(imp), { mark: true, lens: false }),
    questions: choice3,
    score: (a) => expect(a, "relationship", W3),
    band: 0.05,
  },
  {
    id: "tiers-s5",
    state: (c, imp) => frame(c, tiers(imp), { mark: true, lens: true }),
    questions: scale5,
    score: (a) => expect(a, "relationship", SCALE5_W),
    band: 0.25,
  },
  {
    id: "outlook-s5",
    state: (c, imp) => frame(c, outlook(imp), { mark: true, lens: true }),
    questions: scale5,
    score: (a) => expect(a, "relationship", SCALE5_W),
    band: 0.13,
  },
  {
    id: "outlook-nouls",
    state: (c, imp) => frame(c, outlook(imp), { mark: true, lens: true }),
    questions: nouls,
    score: (a) => nv(a, "builds") - nv(a, "detracts"),
    band: 0.01,
  },
  {
    id: "lens-s5",
    state: (c, imp) => frame(c, lens(imp, { middle: true }), { mark: true, lens: true }),
    questions: scale5,
    score: (a) => expect(a, "relationship", SCALE5_W),
    band: 0.2,
  },
  {
    id: "lens-late-s5",
    state: (c, imp) => frameLate(c, lens(imp, { middle: true })),
    questions: scale5,
    score: (a) => expect(a, "relationship", SCALE5_W),
    band: 0.1,
  },
  {
    id: "lens-ext-s5",
    state: (c, imp) => frame(c, lens(imp, { middle: false }), { mark: true, lens: true }),
    questions: scale5,
    score: (a) => expect(a, "relationship", SCALE5_W),
    band: 0.2,
  },
  {
    id: "lens-c3",
    state: (c, imp) => frame(c, lens(imp, { middle: true }), { mark: true, lens: true }),
    questions: choice3,
    score: (a) => expect(a, "relationship", W3),
    band: 0.12,
  },
  {
    id: "lens-show-s5",
    state: (c, imp) => frame(c, lens(imp, { middle: true }), { mark: true, lens: true }),
    questions: showScale5,
    score: (a) => expect(a, "relationship", SCALE5_W),
    band: 0.14,
  },
  {
    id: "lens-late-gate",
    state: (c, imp) => frameLate(c, lens(imp, { middle: true })),
    questions: gatedScale5,
    score: (a) => expect(a, "relationship", SCALE5_W) * nv(a, "touches"),
    band: 0.2,
  },
  {
    id: "lens-late-reads",
    state: (c, imp) => frameLate(c, lens(imp, { middle: true }), { reads: true }),
    questions: scale5,
    score: (a) => expect(a, "relationship", SCALE5_W),
    band: 0.25,
  },
  {
    id: "lens-late-ens",
    state: (c, imp) => frameLate(c, lens(imp, { middle: true })),
    questions: (c) => ({ ...scale5(c), shows: showScale5(c).relationship as JevQuestion }),
    score: (a) => (expect(a, "relationship", SCALE5_W) + expect(a, "shows", SCALE5_W)) / 2,
    band: 0.2,
  },
];

const o1: O1Module = { arm: "O1", variants, final: "lens-late-s5" };
export default o1;
