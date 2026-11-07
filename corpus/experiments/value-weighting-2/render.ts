/**
 * One engine copy as the line its holder reads: every fact comes from the copy's envelope and the
 * payload that holder holds, ids resolved to names from the world's definitions, the holder as
 * "you". A field the copy lacks (a whisper's words, an arrive's `present` for a bystander) is never
 * filled in. Shared by the labeller and both arms, so all three read the same event.
 */
import type { WorldDefs } from "../../../src/engine/definitions.ts";
import type { Copy } from "../../../src/engine/events.ts";

export function namer(defs: WorldDefs, holder: string): (id: string) => string {
  const names = new Map<string, string>();
  for (const p of defs.people) names.set(p.id, p.name);
  for (const r of defs.rooms) names.set(r.id, r.name);
  for (const i of defs.items) names.set(i.id, `the ${i.name}`);
  return (id) => (id === holder ? "you" : (names.get(id) ?? id));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export function render(copy: Copy, defs: WorldDefs, holder: string): string {
  const n = namer(defs, holder);
  const p = copy.payload;
  const actor = cap(n(copy.actor));
  const target = copy.targets[0] === undefined ? "" : n(copy.targets[0]);
  switch (copy.subkind) {
    case "physical.depart":
      return `${actor} left ${n(str(p.from) ?? "")} by the ${str(p.exit)} exit, heading for ${n(str(p.to) ?? "")}.`;
    case "physical.arrive": {
      const present = Array.isArray(p.present) ? (p.present as string[]) : undefined;
      const base = `${actor} arrived in ${n(str(p.to) ?? "")} from ${n(str(p.from) ?? "")}.`;
      if (present === undefined) return base;
      return `${base} Present: ${present.length ? present.map(n).join(", ") : "nobody"}.`;
    }
    case "speech.say":
      return `${actor} said to the room: "${str(p.words)}"`;
    case "speech.say-to":
      return `${actor} said to ${target}: "${str(p.words)}"`;
    case "speech.whisper": {
      const words = str(p.words);
      return words === undefined
        ? `${actor} whispered something to ${target}. You could not hear the words.`
        : `${actor} whispered to ${target}: "${words}"`;
    }
    case "exchange.offer":
      return `${actor} offered ${n(str(p.item) ?? "")} to ${target}, open until tick ${p.until}.`;
    case "exchange.accept":
      return `${actor} accepted ${n(str(p.item) ?? "")} from ${n(str(p.from) ?? "")}.`;
    case "exchange.refuse":
      return `${actor} refused ${n(str(p.item) ?? "")} from ${n(str(p.from) ?? "")}.`;
    case "exchange.lapse":
    {
      const from = str(p.from) ?? "";
      const whose = from === holder ? "Your" : `${n(from)}'s`;
      return `${whose} offer of ${n(str(p.item) ?? "")} to ${n(str(p.to) ?? "")} lapsed unanswered.`;
    }
    case "time.tick":
      return `Tick ${copy.tick}.`;
  }
}
