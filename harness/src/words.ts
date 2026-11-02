/**
 * The language-model client: an OpenAI-shaped chat completion on OpenRouter, keyed as the Jev
 * client is, asking each model by its own request (requestFor) for one JSON object that a zod
 * schema validates on return. The model writes only the run's typed end state and its one line of
 * words; both are checked by code before use.
 */
import { z } from "zod";
import { described, type EndState } from "./goal.ts";
import { type ClientOptions, costOf, isRecord, postJson, type Refusal } from "./jev.ts";

export const COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
/** The player's model when none is named: it writes the target and the words. */
export const DEFAULT_MODEL = "z-ai/glm-5.3-flash";

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

/**
 * How complete() asks a model: the request's name, and the chat completions body it posts for a
 * prompt and the schema `name` its answer must match. Every request is answered through the same
 * parse and the same one identical retry on a parse refusal. Scores and reports made under a
 * request land on paths that name it, so a change to a body renames its request.
 */
export type Request = {
  name: string;
  body: (model: string, prompt: string, schema: z.ZodType, name: string) => Record<string, unknown>;
};

/** Strict json_schema on an endpoint that enforces it (require_parameters). */
export const JSON_SCHEMA_RETRY: Request = {
  name: "json-schema-retry",
  body: (model, prompt, schema, name) => ({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: { name, strict: true, schema: wireSchema(schema) },
    },
    provider: { require_parameters: true },
    usage: { include: true },
  }),
};

/**
 * Any JSON object, served by Z.AI alone with no fallback. Z.AI takes response_format but not
 * structured_outputs, so the body carries no schema and no require_parameters: the prompt asks for
 * the shape, and zod checks it on return.
 */
export const JSON_OBJECT_Z_AI: Request = {
  name: "json-object-z-ai-retry",
  body: (model, prompt) => ({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    provider: { order: ["z-ai"], allow_fallbacks: false },
    usage: { include: true },
  }),
};

/** The models asked by a request of their own, by exact id; every other is asked by JSON_SCHEMA_RETRY. */
export const REQUESTS: Readonly<Record<string, Request>> = {
  "z-ai/glm-5.3-flash": JSON_OBJECT_Z_AI,
};

/** The request `model` is asked by. */
export function requestFor(model: string): Request {
  return REQUESTS[model] ?? JSON_SCHEMA_RETRY;
}

/** A chat completions client, and the model it asks: DEFAULT_MODEL when none is named. */
export type ModelOptions = ClientOptions & { model?: string | undefined };

/** The model `options` asks: the one place the default is applied. */
export function modelOf(options: ModelOptions): string {
  return options.model ?? DEFAULT_MODEL;
}

/**
 * One post to the model that came back with a body: the cost it reported (null when none), the
 * provider OpenRouter reported serving it (null when none), whether it was the retry, and, when its
 * answer was refused, the refusal's message and the message content exactly as sent, whole (null
 * when the body had none).
 */
export type Attempt = {
  costUsd: number | null;
  provider: string | null;
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

/** The provider the chat completions body reports serving it, or null when it names none. */
function providerOf(body: unknown): string | null {
  return isRecord(body) && typeof body.provider === "string" ? body.provider : null;
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
  const provider = providerOf(posted.body);
  if (read.ok) return { ...read, attempt: { costUsd, provider, retry, refused: null } };
  const refused = { message: read.refusal.message, answer: content ?? null };
  return { ...read, attempt: { costUsd, provider, retry, refused } };
}

/**
 * Ask the model, by the request its model is asked by (requestFor), for one JSON object matching
 * `schema`, named `name`; anything else is a `parse` refusal. An answer refused at parse is asked
 * once more by the identical request, which carries no hint; a refusal with no body (config,
 * network, status) and a second parse refusal are final.
 */
export async function complete<T>(
  prompt: string,
  schema: z.ZodType<T>,
  name: string,
  options: ModelOptions = {},
): Promise<Completed<T>> {
  const model = modelOf(options);
  const request = requestFor(model).body(model, prompt, schema, name);
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
