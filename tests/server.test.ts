import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type { WorldEvent } from "../src/engine/events.ts";
import { actionSchemas, type Verb } from "../src/engine/rules.ts";
import type { Snapshot } from "../src/engine/snapshot.ts";
import { startServer } from "../src/server/routes.ts";

const ROOT = join(import.meta.dir, "..");
const WORLD = join(ROOT, "world");

type Served = { base: string; hostname: string | undefined; world: string; stop: () => void };

const temps: string[] = [];
const stops: (() => void)[] = [];

/** Serve a world on an ephemeral port: the committed one, or a private copy that a test may edit. */
function serve(copyWorld: boolean): Served {
  const dir = mkdtempSync(join(tmpdir(), "strata-server-"));
  temps.push(dir);
  let world = WORLD;
  if (copyWorld) {
    world = join(dir, "world");
    cpSync(WORLD, world, { recursive: true });
  }
  const started = startServer({
    world,
    dbPath: join(dir, "world.sqlite"),
    tickMinutes: 10,
    port: 0,
  });
  if (!started.ok) throw new Error(started.refusal.message);
  stops.push(started.stop);
  return {
    base: `http://127.0.0.1:${started.server.port}`,
    hostname: started.server.hostname,
    world,
    stop: started.stop,
  };
}

afterAll(() => {
  for (const stop of stops) stop();
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/** The HTTP calls a test makes against one served world. */
function client(served: Served) {
  async function get<T>(path: string): Promise<T> {
    const response = await fetch(`${served.base}${path}`);
    expect(response.status).toBe(200);
    return (await response.json()) as T;
  }
  async function post(path: string, body?: unknown): Promise<Response> {
    return fetch(`${served.base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async function eventsOf(response: Response): Promise<WorldEvent[]> {
    expect(response.status).toBe(200);
    return ((await response.json()) as { events: WorldEvent[] }).events;
  }
  return {
    get,
    post,
    act: async (action: Record<string, string>) => eventsOf(await post("/api/actions", action)),
    step: async () => eventsOf(await post("/api/step")),
    snapshot: () => get<Snapshot>("/api/snapshot"),
    events: async (since: number) =>
      (await get<{ events: WorldEvent[] }>(`/api/events?since=${since}`)).events,
  };
}

let main: Served;
beforeAll(() => {
  main = serve(false);
});

describe("C11: the server binds the loopback address", () => {
  test("its hostname is 127.0.0.1", () => {
    expect(main.hostname).toBe("127.0.0.1");
  });
});

describe("C10: the bench and its API over HTTP", () => {
  test("the page and its scripts are served with their content types", async () => {
    const files = [
      { path: "/", file: "bench/index.html", type: "text/html" },
      { path: "/bench/app.js", file: "bench/app.js", type: "text/javascript" },
      { path: "/bench/panels/world.js", file: "bench/panels/world.js", type: "text/javascript" },
    ];
    for (const { path, file, type } of files) {
      const response = await fetch(`${main.base}${path}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toStartWith(type);
      expect(await response.text()).toBe(readFileSync(join(ROOT, file), "utf8"));
    }
    expect((await fetch(`${main.base}/bench/../package.json`)).status).toBe(404);
  });

  test("/api/verbs lists every verb with its fields from the action schemas", async () => {
    const { verbs } = await client(main).get<{
      verbs: { verb: Verb; fields: string[]; schema: unknown }[];
    }>("/api/verbs");
    expect(verbs.map((v) => v.verb)).toEqual([
      "depart",
      "say",
      "say-to",
      "whisper",
      "offer",
      "accept",
      "refuse",
    ]);
    for (const { verb, fields, schema } of verbs) {
      const declared = actionSchemas[verb];
      expect(schema).toEqual(JSON.parse(JSON.stringify(z.toJSONSchema(declared))));
      expect(fields).toEqual(
        Object.keys(declared.shape).filter((f) => f !== "actor" && f !== "verb"),
      );
    }
  });

  test("the C5 sequence and the three C7 runs, a forbidden action and reset", async () => {
    const api = client(main);
    const booted = await api.snapshot();
    expect(booted.tick).toBe(0);
    expect(await api.events(0)).toEqual([]);
    const reset = async () => {
      expect((await api.post("/api/reset")).status).toBe(200);
      expect(await api.snapshot()).toEqual(booted);
      expect(await api.events(0)).toEqual([]);
    };
    const shard = { actor: "rogue", verb: "offer", target: "glitch", item: "data-shard" };
    const until = booted.offerWindowTicks;

    // C5: Glitch departs east, then one step brings the arrive.
    const [depart] = await api.act({ actor: "glitch", verb: "depart", exit: "east" });
    expect(depart?.subkind).toBe("physical.depart");
    expect((await api.snapshot()).views.inTransit.map((t) => t.person)).toEqual(["glitch"]);
    expect((await api.events(0)).map((e) => e.id)).toEqual([depart?.id]);
    const stepped = await api.step();
    expect(stepped.map((e) => e.subkind)).toEqual(["time.tick", "physical.arrive"]);
    const afterStep = await api.snapshot();
    expect(afterStep.tick).toBe(1);
    expect(afterStep.views.presence["back-room"]).toEqual(["glitch", "mux"]);
    expect(await api.events(depart?.seq ?? 0)).toEqual(stepped);
    const received = await api.get<{ copies: { id: string }[] }>("/api/received/mux");
    expect(received.copies.map((c) => c.id)).toEqual([stepped[1]?.id]);
    await reset();

    // C7, accept: the holder moves to Glitch.
    const [offer] = await api.act(shard);
    expect(offer?.payload).toEqual({ item: "data-shard", until });
    expect((await api.snapshot()).views.offers).toEqual([
      { item: "data-shard", from: "rogue", to: "glitch", until, offerEvent: offer?.id },
    ]);
    const [accept] = await api.act({ actor: "glitch", verb: "accept", item: "data-shard" });
    expect(accept?.subkind).toBe("exchange.accept");
    const afterAccept = await api.snapshot();
    expect(afterAccept.items["data-shard"]).toEqual({ holder: "glitch", offer: "none" });
    expect(afterAccept.schedule).toEqual([]);
    expect((await api.events(0)).map((e) => e.subkind)).toEqual([
      "exchange.offer",
      "exchange.accept",
    ]);

    const forbidden = await api.post("/api/actions", {
      actor: "rogue",
      verb: "depart",
      exit: "west",
    });
    expect(forbidden.status).toBe(422);
    expect(await forbidden.json()).toMatchObject({ refused: { code: "no-such-exit" } });
    expect((await api.events(0)).length).toBe(2);
    const malformed = await api.post("/api/actions", { actor: "rogue", verb: "fly" });
    expect(malformed.status).toBe(400);
    await reset();

    // C7, refuse: the holder stays Rogue and the offer and its lapse are cleared.
    await api.act(shard);
    const [refuse] = await api.act({ actor: "glitch", verb: "refuse", item: "data-shard" });
    expect(refuse).toMatchObject({
      subkind: "exchange.refuse",
      payload: { item: "data-shard", from: "rogue" },
    });
    const afterRefuse = await api.snapshot();
    expect(afterRefuse.items["data-shard"]).toEqual({ holder: "rogue", offer: "none" });
    expect(afterRefuse.views.offers).toEqual([]);
    expect(afterRefuse.schedule).toEqual([]);
    expect((await api.events(0)).map((e) => e.subkind)).toEqual([
      "exchange.offer",
      "exchange.refuse",
    ]);
    await reset();

    // C7, unanswered: each step shows in the snapshot and the events until the lapse at until.
    const [pending] = await api.act(shard);
    let seen = pending?.seq ?? 0;
    for (let tick = 1; tick <= until; tick++) {
      const fired = await api.step();
      expect(await api.events(seen)).toEqual(fired);
      seen = fired.at(-1)?.seq ?? seen;
      const now = await api.snapshot();
      expect(now.tick).toBe(tick);
      expect(now.items["data-shard"]?.holder).toBe("rogue");
      if (tick < until) {
        expect(fired.map((e) => e.subkind)).toEqual(["time.tick"]);
        expect(now.views.offers.map((o) => o.offerEvent)).toEqual([pending?.id]);
      } else {
        expect(fired.map((e) => [e.subkind, e.tick, e.cause])).toEqual([
          ["time.tick", until, "operator"],
          ["exchange.lapse", until, pending?.id],
        ]);
        expect(now.items["data-shard"]?.offer).toBe("none");
        expect(now.schedule).toEqual([]);
      }
    }
    await reset();
  });
});

describe("a reset that cannot boot keeps the current world", () => {
  test("a broken definition refuses the reset with 422 and the world keeps serving", async () => {
    const served = serve(true);
    const api = client(served);
    const [depart] = await api.act({ actor: "glitch", verb: "depart", exit: "east" });
    const before = await api.snapshot();

    const file = join(served.world, "items", "stimpak.toml");
    const text = readFileSync(file, "utf8");
    writeFileSync(file, text.replace('holder = "glitch"', 'holder = "nobody"'));
    const refused = await api.post("/api/reset");
    expect(refused.status).toBe(422);
    expect(await refused.json()).toMatchObject({
      refusal: { file, path: "holder", rule: "holder-names-person" },
    });

    expect(await api.snapshot()).toEqual(before);
    expect((await api.events(0)).map((e) => e.id)).toEqual([depart?.id]);
    expect((await api.step()).map((e) => e.subkind)).toEqual(["time.tick", "physical.arrive"]);

    writeFileSync(file, text);
    expect((await api.post("/api/reset")).status).toBe(200);
    expect(await api.events(0)).toEqual([]);
  });
});

/** Just enough DOM for the world panel to render into, with its text and listeners readable. */
class FakeNode {
  children: (FakeNode | string)[] = [];
  listeners: Record<string, ((event: unknown) => void)[]> = {};
  attributes: Record<string, string> = {};
  className = "";
  value = "";
  constructor(readonly tag: string) {}
  addEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners[type] ??= [];
    this.listeners[type].push(listener);
  }
  setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
  }
  append(...nodes: (FakeNode | string)[]): void {
    this.children.push(...nodes);
  }
  replaceChildren(...nodes: (FakeNode | string)[]): void {
    this.children = nodes;
  }
  get text(): string {
    return this.children.map((c) => (typeof c === "string" ? c : c.text)).join("");
  }
  find(tag: string, text = ""): FakeNode[] {
    const found: FakeNode[] = this.tag === tag && this.text.startsWith(text) ? [this] : [];
    for (const child of this.children) {
      if (typeof child !== "string") found.push(...child.find(tag, text));
    }
    return found;
  }
  fire(type: string, event: unknown): void {
    for (const listener of this.listeners[type] ?? []) listener(event);
  }
}

describe("the bench page keeps refusals, invalid actions and refused resets apart", () => {
  test("each outcome renders as itself, and a refused reset keeps the history", async () => {
    const served = serve(true);
    const http = client(served);
    const [depart] = await http.act({ actor: "glitch", verb: "depart", exit: "east" });
    const call = async (method: string, path: string, body?: unknown) => {
      const response = await fetch(`${served.base}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    const api = {
      snapshot: () => call("GET", "/api/snapshot"),
      events: (since: number) => call("GET", `/api/events?since=${since}`),
      received: (thing: string) => call("GET", `/api/received/${thing}`),
      verbs: () => call("GET", "/api/verbs"),
      act: (action: unknown) => call("POST", "/api/actions", action),
      step: () => call("POST", "/api/step"),
      reset: () => call("POST", "/api/reset"),
    };

    Object.assign(globalThis, {
      Node: FakeNode,
      document: { createElement: (tag: string) => new FakeNode(tag) },
    });
    try {
      const panel = (await import(join(ROOT, "bench", "panels", "world.js"))) as {
        mount: (root: FakeNode, api: unknown) => Promise<void>;
      };
      const root = new FakeNode("div");
      await panel.mount(root, api);
      const shows = async (text: string) => {
        for (let i = 0; i < 200 && !root.text.includes(text); i++) await Bun.sleep(5);
        expect(root.text).toContain(text);
      };
      const choose = (label: string, value: string) => {
        const [select] = root.find("label", label).flatMap((l) => l.find("select"));
        select?.fire("change", { target: { value } });
      };
      const submit = () => root.find("form")[0]?.fire("submit", { preventDefault: () => {} });
      await shows(`${depart?.id} t0 physical.depart`);

      choose("actor ", "rogue");
      choose("verb ", "say");
      submit();
      await shows("invalid action");
      expect(root.text).not.toContain("refused:");

      choose("verb ", "say-to");
      choose("target ", "rogue");
      root
        .find("label", "words ")[0]
        ?.find("input")[0]
        ?.fire("input", { target: { value: "hi" } });
      submit();
      await shows("refused: self-target");
      expect(root.text).not.toContain("invalid action");

      const file = join(served.world, "items", "stimpak.toml");
      const text = readFileSync(file, "utf8");
      writeFileSync(file, text.replace('holder = "glitch"', 'holder = "nobody"'));
      root.find("button", "Reset")[0]?.fire("click", {});
      await shows("reset refused");
      expect(root.text).toContain("holder-names-person");
      expect(root.text).toContain(`${depart?.id} t0 physical.depart`);
      writeFileSync(file, text);
    } finally {
      Reflect.deleteProperty(globalThis, "Node");
      Reflect.deleteProperty(globalThis, "document");
    }
  });
});
