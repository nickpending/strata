/**
 * The language-model client: an OpenAI-shaped chat completion on OpenRouter, keyed as the Jev
 * client is, asking for one JSON object that a zod schema validates on return. The model writes
 * only the run's typed end state and its one line of words; both are checked by code before use.
 */
import { z } from "zod";
import { described, type EndState } from "./goal.ts";
import { type ClientOptions, costOf, isRecord, postJson, type Refusal } from "./jev.ts";

export const COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
/** The player's model when none is named: it writes the target and the words. */
export const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";

/** A chat completions client, and the model it asks: DEFAULT_MODEL when none is named. */
export type ModelOptions = ClientOptions & { model?: string | undefined };

export type Completed<T> =
  | { ok: true; value: T; costUsd: number | null }
  | { ok: false; refusal: Refusal };

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

/** Ask the model for one JSON object matching `schema`; anything else is a `parse` refusal. */
export async function complete<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options: ModelOptions = {},
): Promise<Completed<T>> {
  const posted = await postJson(
    COMPLETIONS_URL,
    "chat completions",
    {
      model: options.model ?? DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      usage: { include: true },
    },
    options,
  );
  if (!posted.ok) return posted;
  const content = contentOf(posted.body);
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
  return { ok: true, value: parsed.data, costUsd: costOf(posted.body) };
}

const wordsSchema = z.object({ words: z.string().trim().min(1) });

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
  const completed = await complete(prompt, wordsSchema, options);
  return completed.ok ? { ...completed, value: completed.value.words } : completed;
}
