/**
 * One live decisions call, run once, to capture the wire shape of a score answer. It asks a JSON
 * state { event: { text } } one noul, one choice and one three-level score question, each naming
 * `event.text`, through the harness's decide() with the default model and key. The raw body, cut to
 * its answers, model and usage, goes to harness/test/fixtures/jev-score-body.json; the run's date,
 * cost and decide()'s parse go to probe.txt beside this file. Each run is a paid call.
 *
 * usage: bun corpus/experiments/npc-values/probe.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { costOf, DECISIONS_URL, decide, type JevQuestion } from "../../../harness/src/jev.ts";

const ROOT = join(import.meta.dir, "..", "..", "..");
const FIXTURE = join(ROOT, "harness", "test", "fixtures", "jev-score-body.json");
const RECORD = join(import.meta.dir, "probe.txt");

const STATE = { event: { text: "Rogue lets Glitch stay in her bar for one more night." } };

const QUESTIONS: Record<string, JevQuestion> = {
  lets: { type: "noul", instructions: "Does `event.text` say that Rogue lets Glitch stay?" },
  who: {
    type: "choice",
    instructions: "Who does `event.text` say is allowed to stay?",
    criteria: { glitch: "Glitch", rogue: "Rogue", nobody: "nobody" },
  },
  warmth: {
    type: "score",
    instructions: "How warmly does `event.text` describe what Rogue does for Glitch?",
    criteria: ["coldly", "neutrally", "warmly"],
  },
};

/** The decisions body as it came, kept by wrapping fetch for this one call. */
let raw: string | null = null;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
  const response = await realFetch(input, init);
  if (String(input) === DECISIONS_URL) raw = await response.clone().text();
  return response;
}) as typeof fetch;

const result = await decide(STATE, QUESTIONS);
globalThis.fetch = realFetch;
if (raw === null) throw new Error(`no decisions body was received: ${JSON.stringify(result)}`);

const body = JSON.parse(raw) as Record<string, unknown>;
const scrubbed = { answers: body.answers, model: body.model, usage: body.usage };
writeFileSync(FIXTURE, `${JSON.stringify(scrubbed, null, 2)}\n`);

const record = [
  `date: ${new Date().toISOString()}`,
  `model in body: ${body.model}`,
  `top-level keys received: ${Object.keys(body).join(", ")}`,
  `costUsd: ${costOf(body)}`,
  `state: ${JSON.stringify(STATE)}`,
  `questions: ${JSON.stringify(QUESTIONS)}`,
  `decide() returned: ${JSON.stringify(result, null, 2)}`,
  "",
].join("\n");
writeFileSync(RECORD, record);
console.log(record);
