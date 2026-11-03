/** Fixtures the harness's own tests share: a page as read, and bodies a bench could serve. */
import type {
  KnowledgeBody,
  Pending,
  SnapshotBody,
  SubkindsBody,
  VerbsBody,
} from "../src/bench.ts";
import type { Control, PageRead } from "../src/page.ts";

function select(id: number, label: string, value: string, options: string[]): Control {
  return { id, kind: "select", role: "combobox", label, value, options, enabled: true, html: "" };
}

function button(id: number, label: string): Control {
  return {
    id,
    kind: "button",
    role: "button",
    label,
    value: "",
    options: [],
    enabled: true,
    html: "",
  };
}

/** Verbs a bench could serve: none of them is strata's, so nothing here leans on its engine. */
export const VERBS: VerbsBody["verbs"] = [
  { verb: "walk", fields: ["exit"] },
  { verb: "sing", fields: ["target", "words"] },
  { verb: "hand", fields: ["target", "item"] },
  { verb: "take", fields: ["item"] },
];

export const SUBKINDS: SubkindsBody["subkinds"] = [
  { subkind: "motion.walk", kind: "motion" },
  { subkind: "speech.sing", kind: "speech" },
  { subkind: "trade.hand", kind: "trade" },
  { subkind: "speech.hum", kind: "speech" },
];

export const CONTROLS: Control[] = [
  select(0, "actor", "ada", ["ada", "bo"]),
  select(
    1,
    "verb",
    "walk",
    VERBS.map((v) => v.verb),
  ),
  select(2, "exit", "north", ["north"]),
  button(3, "Act"),
  button(4, "Step"),
];

/** The page as the harness reads it, cut to the lines its vocabulary reads. */
export const PAGE: PageRead = {
  text: [
    '- heading "Rooms" [level=2]',
    '- heading "The Yard (yard)" [level=3]',
    '- text: "A yard. exits: north -> hall (1 tick)"',
    '- heading "The Hall (hall)" [level=3]',
    '- text: "A hall. exits: south -> yard (1 tick); up -> loft (2 ticks)"',
    '- heading "Items" [level=2]',
    "- list:",
    '  - listitem: "lamp: held by ada"',
    '  - listitem: "key: held by bo"',
  ].join("\n"),
  controls: CONTROLS,
};

/** A snapshot body: ada in the yard holding the lamp, bo walking to the hall holding the key. */
export const SNAPSHOT: SnapshotBody = {
  items: { lamp: { holder: "ada" }, key: { holder: "bo" } },
  people: {
    ada: { location: { room: "yard" } },
    bo: { location: { transit: { from: "yard", to: "hall", arrivesAt: 2 } } },
  },
  pending: [],
};

/**
 * What ada knows: where bo is, still true, and who holds the key, since changed out of her sight.
 * She knows nothing of the lamp's holder.
 */
export const ADA_KNOWS: KnowledgeBody = {
  person: "ada",
  facts: [
    { kind: "place", thing: "yard", stale: false },
    { kind: "location", thing: "bo", stale: false },
    { kind: "holder", thing: "key", stale: true },
  ],
};

/** What bo knows: where ada is, since changed out of his sight, and who holds the lamp, still true. */
export const BO_KNOWS: KnowledgeBody = {
  person: "bo",
  facts: [
    { kind: "location", thing: "ada", stale: true },
    { kind: "holder", thing: "lamp", stale: false },
  ],
};

/** A goal file whose goals expect knows end states, as a set's author writes one. */
export const KNOWS_GOALS = {
  set: "knows",
  author: "a fixture",
  goals: [
    {
      id: "ada-finds-bo",
      instruction: "Ada wants to know where Bo is.",
      expect: { knows: { person: "ada", location: "bo" } },
    },
    {
      id: "bo-finds-lamp",
      instruction: "Bo should find out who has the lamp.",
      expect: { knows: { person: "bo", holder: "lamp" } },
    },
  ],
};

/** Ada's offer of the lamp to bo, which bo's take closes, leaving bo the lamp. */
export const OFFER: Pending = {
  opened: {
    id: "e1",
    subkind: "trade.hand",
    actor: "ada",
    targets: ["bo"],
    payload: { item: "lamp" },
  },
  due: {
    at: 3,
    fires: "trade.lapse",
    after: { holders: { lamp: "ada" }, locations: { ada: { room: "yard" }, bo: { room: "yard" } } },
  },
  resolutions: [
    {
      by: "bo",
      action: { actor: "bo", verb: "take", item: "lamp" },
      after: {
        holders: { lamp: "bo" },
        locations: { ada: { room: "yard" }, bo: { room: "yard" } },
      },
    },
  ],
};
