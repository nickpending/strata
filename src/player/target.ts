/**
 * The run's target: the model turns the instruction into one typed end state over what the page
 * shows, or says there is none; code then checks every name it gave against the page and the
 * registry's speech kinds, so the player never chases a person, item, room or speech kind that is
 * not there.
 */
import { z } from "zod";
import { kindOf, subkinds } from "../engine/events.ts";
import { type EndState, endStateSchema } from "./goal.ts";
import type { ClientOptions } from "./jev.ts";
import type { PageRead } from "./page.ts";
import { type Completed, complete } from "./words.ts";

const name = z.string().trim().min(1);

export const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("goal"), expect: endStateSchema, needsWords: z.boolean() }),
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
 * The names a goal may use: the people, items and rooms the page shows, and the speech kinds the
 * registry records.
 */
export type Vocabulary = { people: string[]; items: string[]; rooms: string[]; speech: string[] };

/** Every subkind the registry records whose kind is speech. */
export function speechKinds(): string[] {
  return subkinds.filter((subkind) => kindOf(subkind) === "speech");
}

/** Every distinct first capture of `pattern` over `text`, in order. */
function captures(text: string, pattern: RegExp): string[] {
  return [
    ...new Set([...text.matchAll(pattern)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]))),
  ];
}

/**
 * What the page shows, as read from it: the actor select's options, every item the Items section
 * lists as held and every room the Rooms section heads; and the registry's speech kinds.
 */
export function vocabulary(read: PageRead): Vocabulary {
  return {
    people: read.controls.find((control) => control.label === "actor")?.options ?? [],
    items: captures(read.text, /listitem: "?([^\s:"]+): held by /g),
    rooms: captures(read.text, /heading "[^"\n]*\(([^()\s"]+)\)" \[level=3\]/g),
    speech: speechKinds(),
  };
}

/** Each name `endState` gives: what it names, the name, and the names it must be one of. */
function namesOf(endState: EndState, offered: Vocabulary): [string, string, string[]][] {
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

/**
 * The target as the page allows it: an end state naming anything the page does not show, or a
 * speech kind the registry lacks, becomes no-such-action naming the mismatch, whatever the model
 * said.
 */
export function checked(target: Target, offered: Vocabulary): Target {
  if (target.kind === "no-such-action") return target;
  for (const [kind, value, among] of namesOf(target.expect, offered)) {
    if (among.includes(value)) continue;
    const where = kind === "speech kind" ? "the registry has" : "the page shows";
    return {
      kind: "no-such-action",
      reason: `${where} no ${kind} "${value}" (it has: ${among.join(", ") || "none"})`,
    };
  }
  return target;
}

function prompt(instruction: string, offered: Vocabulary, pageText: string): string {
  return [
    "You turn an instruction into the end state that carries it out in a small world shown on a control page, or say there is none.",
    `Instruction: ${instruction}`,
    `People: ${offered.people.join(", ")}`,
    `Items: ${offered.items.join(", ")}`,
    `Rooms: ${offered.rooms.join(", ")}`,
    `Speech kinds: ${offered.speech.join(", ")}`,
    "The page as it reads now:",
    pageText,
    "",
    "Answer with one JSON object and nothing else, either",
    '{"kind": "goal", "expect": <the end state>, "needsWords": <true when the end state is someone saying something>}',
    "where the end state is one of",
    '{"holder": {"item": "<item>", "person": "<person>"}} (the person holds the item),',
    '{"location": {"person": "<person>", "room": "<room>"}} (the person is in the room),',
    '{"said": {"person": "<person>", "subkind": "<speech kind>"}} (the person has said something of that kind);',
    'or {"kind": "no-such-action", "reason": "<why no end state above is what the instruction wants>"} when none of them carries the instruction out.',
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
