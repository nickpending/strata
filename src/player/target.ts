/**
 * The run's target: the model turns the instruction into a typed plan over what the page shows,
 * the end state the run is for and the ordered typed actions it expects to reach it, or says there
 * is none; code then checks every name it gave against the page and the registry's speech kinds,
 * so the player never chases a verb, person, item, room, exit or speech kind that is not there.
 */
import { z } from "zod";
import { kindOf, subkinds } from "../engine/events.ts";
import { verbs } from "../engine/rules.ts";
import { type EndState, endStateSchema } from "./goal.ts";
import type { ClientOptions } from "./jev.ts";
import type { PageRead } from "./page.ts";
import { type Completed, complete } from "./words.ts";

const name = z.string().trim().min(1);
const field = name.nullish();

const stepFieldsSchema = z.object({ target: field, item: field, exit: field });

/** The fields a plan's step names: those whose values are ids; free text is the run's words. */
export const STEP_FIELDS: readonly string[] = Object.keys(stepFieldsSchema.shape);

/** One typed action of a plan: who takes it, the verb, and the fields it names besides words. */
export const stepSchema = z.object({
  actor: name,
  verb: name,
  fields: stepFieldsSchema.default({}),
});
export type Step = z.infer<typeof stepSchema>;

export const targetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("goal"),
    expect: endStateSchema,
    /**
     * The model's say on words, taken when it gives one and recorded with the target. It decides
     * nothing: writesWords does, so an answer without it is accepted.
     */
    needsWords: z.boolean().optional(),
    steps: z.array(stepSchema).default([]),
  }),
  z.object({ kind: z.literal("no-such-action"), reason: name }),
]);

export type Target = z.infer<typeof targetSchema>;
export type GoalTarget = Extract<Target, { kind: "goal" }>;

/**
 * The target runs recorded before targets were end states: one action and a done question. Kept
 * as a type only, so their run.json files still read as run records; the player never makes one.
 */
export type ActionTarget = {
  kind: "action";
  actor: string;
  verb: string;
  fields: { target?: string | null; item?: string | null; exit?: string | null };
  needsWords: boolean;
  done: string;
};

/** A target as a run.json records it. */
export type RecordedTarget = Target | ActionTarget;

/**
 * The names a target may use: the verbs, people, items, rooms and exits the page shows, and the
 * speech kinds the registry records.
 */
export type Vocabulary = {
  verbs: string[];
  people: string[];
  items: string[];
  rooms: string[];
  exits: string[];
  speech: string[];
};

/** Every subkind the registry records whose kind is speech. */
export function speechKinds(): string[] {
  return subkinds.filter((subkind) => kindOf(subkind) === "speech");
}

/** The fields `verb` takes besides actor and verb, as verbs() serves them. */
function fieldsOf(verb: string): string[] {
  return verbs().find((v) => v.verb === verb)?.fields ?? [];
}

/** Whether the run writes words: when its end state is speech, or a step's verb takes words. */
export function writesWords(target: GoalTarget): boolean {
  return "said" in target.expect || target.steps.some((s) => fieldsOf(s.verb).includes("words"));
}

/** Every distinct first capture of `pattern` over `text`, in order. */
function captures(text: string, pattern: RegExp): string[] {
  return [
    ...new Set([...text.matchAll(pattern)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]))),
  ];
}

function optionsOf(read: PageRead, label: string): string[] {
  return read.controls.find((control) => control.label === label)?.options ?? [];
}

/**
 * What the page shows, as read from it: the verb and actor selects' options, every item the Items
 * section lists as held, every room the Rooms section heads and every exit a room lists; and the
 * registry's speech kinds.
 */
export function vocabulary(read: PageRead): Vocabulary {
  const exitLists = captures(read.text, /exits: ([^"\n]*)/g);
  return {
    verbs: optionsOf(read, "verb"),
    people: optionsOf(read, "actor"),
    items: captures(read.text, /listitem: "?([^\s:"]+): held by /g),
    rooms: captures(read.text, /heading "[^"\n]*\(([^()\s"]+)\)" \[level=3\]/g),
    exits: [...new Set(exitLists.flatMap((list) => captures(list, /(?:^|; )([^\s;]+) -> /g)))],
    speech: speechKinds(),
  };
}

type Named = [kind: string, value: string | null | undefined, among: string[]];

/** Each name `endState` gives: what it names, the name, and the names it must be one of. */
function namesOf(endState: EndState, offered: Vocabulary): Named[] {
  if ("holder" in endState) {
    return [
      ["item", endState.holder.item, offered.items],
      ["person", endState.holder.person, offered.people],
    ];
  }
  if ("location" in endState) {
    return [
      ["person", endState.location.person, offered.people],
      ["room", endState.location.room, offered.rooms],
    ];
  }
  return [
    ["person", endState.said.person, offered.people],
    ["speech kind", endState.said.subkind, offered.speech],
  ];
}

/** Each name a plan's step gives, against what the page offers. */
function stepNames(step: Step, offered: Vocabulary): Named[] {
  return [
    ["verb", step.verb, offered.verbs],
    ["person", step.actor, offered.people],
    ["person", step.fields.target, offered.people],
    ["item", step.fields.item, offered.items],
    ["exit", step.fields.exit, offered.exits],
  ];
}

/**
 * The target as the page allows it: an end state or a step naming anything the page does not
 * show, or a speech kind the registry lacks, becomes no-such-action naming the mismatch, whatever
 * the model said.
 */
export function checked(target: Target, offered: Vocabulary): Target {
  if (target.kind === "no-such-action") return target;
  const named = [
    ...namesOf(target.expect, offered),
    ...target.steps.flatMap((step) => stepNames(step, offered)),
  ];
  for (const [kind, value, among] of named) {
    if (value === null || value === undefined || among.includes(value)) continue;
    const where = kind === "speech kind" ? "the registry has" : "the page shows";
    return {
      kind: "no-such-action",
      reason: `${where} no ${kind} "${value}" (it has: ${among.join(", ") || "none"})`,
    };
  }
  return target;
}

function prompt(instruction: string, offered: Vocabulary, pageText: string): string {
  const verbLines = offered.verbs.map((verb) => {
    const fields = fieldsOf(verb);
    return `  ${verb}${fields.length > 0 ? ` (fields: ${fields.join(", ")})` : ""}`;
  });
  return [
    "You turn an instruction into a plan for a small world shown on a control page: the end state the instruction wants, and the ordered actions on the page that reach it. Or you say there is none.",
    `Instruction: ${instruction}`,
    "Verbs the page offers, each with the fields it takes besides actor:",
    ...verbLines,
    `People (actors and targets): ${offered.people.join(", ")}`,
    `Items: ${offered.items.join(", ")}`,
    `Rooms: ${offered.rooms.join(", ")}`,
    `Exits: ${offered.exits.join(", ")}`,
    `Speech kinds: ${offered.speech.join(", ")}`,
    "The page as it reads now (each room lists its exits as <exit> -> <room it leads to>, and who is in it):",
    pageText,
    "",
    "Answer with one JSON object and nothing else, either",
    '{"kind": "goal", "expect": <the end state>, "steps": [<action>, ...]}',
    "where the end state is one of",
    '{"holder": {"item": "<item>", "person": "<person>"}} (the person holds the item),',
    '{"location": {"person": "<person>", "room": "<room>"}} (the person is in the room),',
    '{"said": {"person": "<person>", "subkind": "<speech kind>"}} (the person has said something of that kind);',
    'and each action is {"actor": "<person>", "verb": "<verb>", "fields": {"target": "<person>", "item": "<item>", "exit": "<exit>"}}, with only the fields its verb takes (words are written for you; leave them out).',
    "List every action the end state needs, in order, by whoever must take it: an item changes hands when its holder offers it to someone in the same room and that person accepts it; a person must be in the same room as anyone they offer to or speak to, and walks there first by departing through an exit of the room they are in. Leave out stepping the clock: it is stepped for you while someone walks.",
    'Or answer {"kind": "no-such-action", "reason": "<why no end state above is what the instruction wants>"} when none of them carries the instruction out.',
    "Use only the names listed above.",
  ].join("\n");
}

/** Ask the model for the target, then check it against the page and the registry. */
export async function askTarget(
  instruction: string,
  read: PageRead,
  options: ClientOptions = {},
): Promise<Completed<Target>> {
  const offered = vocabulary(read);
  const answered = await complete(prompt(instruction, offered, read.text), targetSchema, options);
  return answered.ok ? { ...answered, value: checked(answered.value, offered) } : answered;
}
