/**
 * The run's target: the model turns the instruction into one typed action over what the page
 * offers, or says there is none; code then checks every name it gave against the page, so the
 * player never chases a verb, actor, item or exit the page does not show.
 */
import { z } from "zod";
import type { ClientOptions } from "./jev.ts";
import type { PageRead } from "./page.ts";
import { type Completed, complete } from "./words.ts";

const name = z.string().trim().min(1);
const field = name.nullish();

export const targetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("action"),
    actor: name,
    verb: name,
    fields: z.object({ target: field, item: field, exit: field }).default({}),
    needsWords: z.boolean(),
    done: name,
  }),
  z.object({ kind: z.literal("no-such-action"), reason: name }),
]);

export type Target = z.infer<typeof targetSchema>;
export type ActionTarget = Extract<Target, { kind: "action" }>;

/** The names the page offers: verbs and people from its form, items and exits from its text. */
export type Vocabulary = { verbs: string[]; people: string[]; items: string[]; exits: string[] };

function optionsOf(read: PageRead, label: string): string[] {
  return read.controls.find((control) => control.label === label)?.options ?? [];
}

/** Every distinct first capture of `pattern` over `text`, in order. */
function captures(text: string, pattern: RegExp): string[] {
  return [
    ...new Set([...text.matchAll(pattern)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]))),
  ];
}

/**
 * What the page offers, as read from it: the verb and actor selects' options, every item the
 * Items section lists as held, and every exit a room lists.
 */
export function vocabulary(read: PageRead): Vocabulary {
  const exitLists = captures(read.text, /exits: ([^"\n]*)/g);
  return {
    verbs: optionsOf(read, "verb"),
    people: optionsOf(read, "actor"),
    items: captures(read.text, /listitem: "?([^\s:"]+): held by /g),
    exits: [...new Set(exitLists.flatMap((list) => captures(list, /(?:^|; )([^\s;]+) -> /g)))],
  };
}

/**
 * The target as the page allows it: an action naming anything the page does not offer becomes
 * no-such-action naming the mismatch, whatever the model said.
 */
export function checked(target: Target, offered: Vocabulary): Target {
  if (target.kind === "no-such-action") return target;
  const named: [kind: string, value: string | null | undefined, among: string[]][] = [
    ["verb", target.verb, offered.verbs],
    ["actor", target.actor, offered.people],
    ["target", target.fields.target, offered.people],
    ["item", target.fields.item, offered.items],
    ["exit", target.fields.exit, offered.exits],
  ];
  for (const [kind, value, among] of named) {
    if (value === null || value === undefined || among.includes(value)) continue;
    return {
      kind: "no-such-action",
      reason: `the page offers no ${kind} "${value}" (it offers: ${among.join(", ") || "none"})`,
    };
  }
  return target;
}

function prompt(instruction: string, offered: Vocabulary, pageText: string): string {
  return [
    "You turn an instruction into the action that carries it out on a small world's control page, or say there is none.",
    `Instruction: ${instruction}`,
    `Verbs the page offers: ${offered.verbs.join(", ")}`,
    `People (actors and targets): ${offered.people.join(", ")}`,
    `Items: ${offered.items.join(", ")}`,
    `Exits: ${offered.exits.join(", ")}`,
    "The page as it reads now (each room lists its exits as <exit> -> <room it leads to>):",
    pageText,
    "",
    "An instruction may take more than one action on the page: a depart is followed by stepping the clock until the person arrives; an offer is followed by the other person's accept. Name the first action, and make done ask about the end state the instruction wants.",
    "Answer with one JSON object and nothing else, either",
    '{"kind": "action", "actor": "<person>", "verb": "<verb>", "fields": {"target": "<person, if the verb addresses one>", "item": "<item, if the verb names one>", "exit": "<exit of the actor\'s room, if the verb departs>"}, "needsWords": <true when the verb speaks words>, "done": "<one yes/no question about the page that is yes once the instruction is carried out>"}',
    'or {"kind": "no-such-action", "reason": "<why no offered verb does it>"} when no verb above can carry the instruction out.',
    "Use only the names listed above; leave out fields the verb does not take.",
  ].join("\n");
}

/** Ask the model for the target, then check it against the page. */
export async function askTarget(
  instruction: string,
  read: PageRead,
  options: ClientOptions = {},
): Promise<Completed<Target>> {
  const offered = vocabulary(read);
  const answered = await complete(prompt(instruction, offered, read.text), targetSchema, options);
  return answered.ok ? { ...answered, value: checked(answered.value, offered) } : answered;
}
