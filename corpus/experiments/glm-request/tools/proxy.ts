/**
 * Experiment proxy: the harness posts its json-schema-retry request here (--model-endpoint); the
 * proxy rewrites the request into one arm's form, forwards it to OpenRouter with the key, logs the
 * provider OpenRouter reports and the whole answer, and returns OpenRouter's answer unchanged.
 *
 * usage: bun proxy.ts <port> <arm A|B|C|E> <log.jsonl> [ignore,providers|-] [provider prefs JSON]
 */
import { appendFileSync } from "node:fs";
import { getKey } from "/Users/rudy/development/projects/strata/node_modules/@voidwire/apiconf/dist/index.js";

const [portArg, arm, logPath, ignoreArg] = Bun.argv.slice(2);
if (!portArg || !arm || !logPath || !["A", "B", "C", "E"].includes(arm)) {
  console.error("usage: bun proxy.ts <port> <A|B|C> <log.jsonl> [ignore,providers]");
  process.exit(2);
}
const ignore = ignoreArg && ignoreArg !== "-" ? ignoreArg.split(",") : [];
/** Further provider preferences merged into the sent request, as JSON (arms F and G). */
const extraProvider: Record<string, unknown> = Bun.argv[6] ? JSON.parse(Bun.argv[6]) : {};
const KEY = getKey("sable-openrouter");
const UPSTREAM = "https://openrouter.ai/api/v1/chat/completions";

const str = (description: string) => ({ type: "string", minLength: 1, description });
const opt = (description: string) => ({ type: ["string", "null"], minLength: 1, description });
const pair = (a: string, b: string, description: string, da: string, db: string) => ({
  type: "object",
  description,
  properties: { [a]: str(da), [b]: str(db) },
  required: [a, b],
  additionalProperties: false,
});

/** Arm C: one flat object per call; kind an enum, the rest optional, no anyOf, no default. */
export const FLAT: Record<string, unknown> = {
  target: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: ["goal", "no-such-action"],
        description: "goal when an end state below carries the instruction out, else no-such-action",
      },
      expect: {
        type: "object",
        description: "kind goal only: the end state, exactly one of holder, location or said",
        properties: {
          holder: pair("item", "person", "the person holds the item", "an item listed", "a person listed"),
          location: pair("person", "room", "the person is in the room", "a person listed", "a room listed"),
          said: pair("person", "subkind", "the person has said something of that kind", "a person listed", "a speech kind listed"),
        },
        additionalProperties: false,
      },
      steps: {
        type: "array",
        description: "kind goal only: every action the end state needs, in order",
        items: {
          type: "object",
          properties: {
            actor: str("the person who takes the action"),
            verb: str("a verb listed"),
            fields: {
              type: "object",
              description: "only the fields the verb takes besides actor; never words",
              properties: {
                target: opt("a person listed, or null when the verb takes no target"),
                item: opt("an item listed, or null when the verb takes no item"),
                exit: opt("an exit listed, or null when the verb takes no exit"),
              },
              additionalProperties: false,
            },
          },
          required: ["actor", "verb", "fields"],
          additionalProperties: false,
        },
      },
      reason: str("kind no-such-action only: why no end state carries the instruction out"),
    },
    required: ["kind"],
    additionalProperties: false,
  },
  words: {
    type: "object",
    properties: { words: str("the line, as the character says it, one sentence") },
    required: ["words"],
    additionalProperties: false,
  },
};

type Body = {
  model: string;
  messages: unknown;
  response_format: { type: string; json_schema: { name: string; strict: boolean; schema: unknown } };
  provider?: Record<string, unknown>;
  usage: unknown;
};

/** Arm E: the names the prompt lists, read back from its lines. */
function vocabOf(prompt: string): Record<string, string[]> {
  const list = (label: string) => {
    const line = prompt.split("\n").find((l) => l.startsWith(`${label}: `));
    return line ? line.slice(label.length + 2).split(", ").filter((x) => x !== "") : [];
  };
  const lines = prompt.split("\n");
  const from = lines.findIndex((l) => l.startsWith("Verbs the page offers"));
  const verbs: string[] = [];
  for (let i = from + 1; i > 0 && i < lines.length && lines[i]?.startsWith("  "); i++) {
    verbs.push((lines[i] ?? "").trim().split(" ")[0] ?? "");
  }
  const people = list("People (actors and targets)");
  return {
    person: people, actor: people, target: people,
    item: list("Items"), room: list("Rooms"), exit: list("Exits"),
    subkind: list("Speech kinds"), verb: verbs,
  };
}

/** Arm E: every string a name property takes becomes an enum of the names the prompt lists. */
function enumify(node: unknown, vocab: Record<string, string[]>, under?: string): unknown {
  if (Array.isArray(node)) return node.map((n) => enumify(n, vocab, under));
  if (node === null || typeof node !== "object") return node;
  const o = node as Record<string, unknown>;
  const names = under === undefined ? undefined : vocab[under];
  if (o.type === "string" && names !== undefined && names.length > 0) {
    const { minLength: _drop, ...rest } = o;
    return { ...rest, enum: names };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === "properties" && v && typeof v === "object") {
      out[k] = Object.fromEntries(
        Object.entries(v as Record<string, unknown>).map(([pk, pv]) => [pk, enumify(pv, vocab, pk)]),
      );
    } else if (k === "anyOf") out[k] = enumify(v, vocab, under);
    else out[k] = enumify(v, vocab, undefined);
  }
  return out;
}

function rewrite(body: Body): { purpose: string; sent: Record<string, unknown> } {
  const purpose = body.response_format.json_schema.name;
  const base = { model: body.model, messages: body.messages, usage: body.usage };
  let sent: Record<string, unknown>;
  if (arm === "A") sent = { ...base, response_format: { type: "json_object" } };
  else if (arm === "B") sent = { ...body };
  else if (arm === "E") {
    const text = (body.messages as { content: string }[])[0]?.content ?? "";
    const schema = enumify(structuredClone(body.response_format.json_schema.schema), vocabOf(text));
    sent = {
      ...body,
      response_format: { type: "json_schema", json_schema: { ...body.response_format.json_schema, schema } },
    };
  }
  else {
    sent = {
      ...base,
      response_format: {
        type: "json_schema",
        json_schema: { name: purpose, strict: true, schema: FLAT[purpose] },
      },
      provider: { require_parameters: true },
    };
  }
  if (ignore.length > 0) {
    sent.provider = { ...((sent.provider as Record<string, unknown>) ?? {}), ignore };
  }
  if (Object.keys(extraProvider).length > 0) {
    sent.provider = { ...((sent.provider as Record<string, unknown>) ?? {}), ...extraProvider };
  }
  return { purpose, sent };
}

Bun.serve({
  port: Number(portArg),
  hostname: "127.0.0.1",
  async fetch(request) {
    const body = (await request.json()) as Body;
    const { purpose, sent } = rewrite(body);
    const t0 = new Date().toISOString();
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(sent),
    });
    const text = await upstream.text();
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(text);
    } catch {}
    const choice = parsed.choices?.[0];
    appendFileSync(
      logPath,
      `${JSON.stringify({
        t0,
        t1: new Date().toISOString(),
        arm,
        ignore,
        extraProvider,
        purpose,
        status: upstream.status,
        provider: parsed.provider ?? null,
        servedModel: parsed.model ?? null,
        finish: choice?.finish_reason ?? null,
        cost: parsed.usage?.cost ?? null,
        content: choice?.message?.content ?? null,
        error: upstream.ok ? null : text.slice(0, 500),
        ...(arm === "E" ? { sentSchema: (sent.response_format as any).json_schema.schema } : {}),
      })}\n`,
    );
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  },
});
console.log(`proxy arm ${arm} on ${portArg}, ignore=[${ignore}] -> ${logPath}`);
