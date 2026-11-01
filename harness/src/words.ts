/**
 * The language-model client: an OpenAI-shaped chat completion on OpenRouter, keyed as the Jev
 * client is, asking by strict json_schema for one JSON object that the same zod schema validates
 * on return. The model writes only the run's typed end state and its one line of words; both are
 * checked by code before use.
 */
import { z } from "zod";
import { described, type EndState } from "./goal.ts";
import { type ClientOptions, costOf, isRecord, postJson, type Refusal } from "./jev.ts";

export const COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
/** The player's model when none is named: it writes the target and the words. */
export const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";
/**
 * The name of the request complete() sends: strict json_schema, require_parameters, one identical
 * retry on a parse refusal. Scores and reports made under it land on paths that name it, so a
 * change to the request renames it.
 */
export const REQUEST = "json-schema-retry";

/** `schema` with every oneOf key renamed anyOf, at any depth. */
function anyOf(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(anyOf);
  if (!isRecord(schema)) return schema;
  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [key === "oneOf" ? "anyOf" : key, anyOf(value)]),
  );
}

/**
 * The JSON schema sent for `schema`: zod's, of the parsed output, with oneOf renamed anyOf, which
 * every endpoint accepts. A union's branches are disjoint on their kind, so anyOf admits exactly
 * the answers oneOf does.
 */
export function wireSchema(schema: z.ZodType): unknown {
  return anyOf(z.toJSONSchema(schema, { io: "output" }));
}

/** A chat completions client, and the model it asks: DEFAULT_MODEL when none is named. */
export type ModelOptions = ClientOptions & { model?: string | undefined };

/**
 * One post to the model that came back with a body: the cost it reported (null when none), whether
 * it was the retry, and, when its answer was refused, the refusal's message and the message content
 * exactly as sent, whole (null when the body had none).
 */
export type Attempt = {
  costUsd: number | null;
  retry: boolean;
  refused: { message: string; answer: string | null } | null;
};

/** The model's answer or the refusal, and every attempt made for it, in order. */
export type Completed<T> = ({ ok: true; value: T } | { ok: false; refusal: Refusal }) & {
  attempts: Attempt[];
};

/** One attempt's result; `attempt` is null when the post came back with no body to read. */
type Asked<T> =
  | { ok: true; value: T; attempt: Attempt }
  | { ok: false; refusal: Refusal; attempt: Attempt | null };

function parseRefusal(message: string): { ok: false; refusal: Refusal } {
  return { ok: false, refusal: { kind: "parse", message } };
}

/** The message content of the first choice, or undefined when the body has none. */
function contentOf(body: unknown): string | undefined {
  const choices = isRecord(body) && Array.isArray(body.choices) ? body.choices : [];
  const first: unknown = choices[0];
  const message = isRecord(first) && isRecord(first.message) ? first.message : {};
  return typeof message.content === "string" ? message.content : undefined;
}

/** `content` read as one JSON object matching `schema`; anything else is a `parse` refusal. */
function answerOf<T>(
  content: string | undefined,
  schema: z.ZodType<T>,
): { ok: true; value: T } | { ok: false; refusal: Refusal } {
  if (content === undefined)
    return parseRefusal("the chat completions body has no message content");
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return parseRefusal(`the model's answer is not JSON: ${content.slice(0, 80)}`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return parseRefusal(
      `the model's answer is not the asked shape: ${z.prettifyError(parsed.error)}`,
    );
  }
  return { ok: true, value: parsed.data };
}

/** Post `request` once and read its answer against `schema`. */
async function attempt<T>(
  request: unknown,
  schema: z.ZodType<T>,
  options: ModelOptions,
  retry: boolean,
): Promise<Asked<T>> {
  const posted = await postJson(COMPLETIONS_URL, "chat completions", request, options);
  if (!posted.ok) return { ...posted, attempt: null };
  const content = contentOf(posted.body);
  const read = answerOf(content, schema);
  const costUsd = costOf(posted.body);
  if (read.ok) return { ...read, attempt: { costUsd, retry, refused: null } };
  const refused = { message: read.refusal.message, answer: content ?? null };
  return { ...read, attempt: { costUsd, retry, refused } };
}

/**
 * Ask the model, by strict json_schema `name` built from `schema` on an endpoint that enforces it,
 * for one JSON object matching `schema`; anything else is a `parse` refusal. An answer refused at
 * parse is asked once more by the identical request, which carries no hint; a refusal with no body
 * (config, network, status) and a second parse refusal are final.
 */
export async function complete<T>(
  prompt: string,
  schema: z.ZodType<T>,
  name: string,
  options: ModelOptions = {},
): Promise<Completed<T>> {
  const request = {
    model: options.model ?? DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: { name, strict: true, schema: wireSchema(schema) },
    },
    provider: { require_parameters: true },
    usage: { include: true },
  };
  const first = await attempt(request, schema, options, false);
  const asked =
    first.ok || first.attempt === null
      ? [first]
      : [first, await attempt(request, schema, options, true)];
  const attempts = asked.flatMap((a) => (a.attempt === null ? [] : [a.attempt]));
  const last = asked.at(-1) ?? first;
  return last.ok
    ? { ok: true, value: last.value, attempts }
    : { ok: false, refusal: last.refusal, attempts };
}

export const wordsSchema = z.object({ words: z.string().trim().min(1) });

/**
 * The one line the run types into the words field: the model writes it for the goal's end state,
 * as the speaker would say it. Jev never writes text.
 */
export async function words(
  instruction: string,
  goal: EndState,
  options: ModelOptions = {},
): Promise<Completed<string>> {
  const prompt = [
    "You write the one line a character says in a small text world.",
    `The instruction: ${instruction}`,
    `The end state: ${described(goal)}.`,
    'Answer with one JSON object {"words": "<the line, as the character says it, one sentence>"} and nothing else.',
  ].join("\n");
  const completed = await complete(prompt, wordsSchema, "words", options);
  return completed.ok ? { ...completed, value: completed.value.words } : completed;
}
