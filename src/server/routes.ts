import { existsSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { type BootRefusal, boot, type Engine } from "../engine/engine.ts";
import { verbs } from "../engine/rules.ts";

/** The loopback address the bench binds; it is never exposed beyond this machine. */
export const HOSTNAME = "127.0.0.1";

const BENCH_DIR = resolve(import.meta.dir, "../../bench");

export type ServeOptions = {
  /** The world definitions directory. */
  world: string;
  /** The database file; replaced on every boot and reset. */
  dbPath: string;
  tickMinutes?: number | undefined;
  /** 0 picks a free port. */
  port: number;
};

export type Started =
  | { ok: true; server: Bun.Server<undefined>; stop: () => void }
  | { ok: false; refusal: BootRefusal };

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function staticFile(path: string): Response {
  const file = resolve(BENCH_DIR, path);
  if (!file.startsWith(BENCH_DIR + sep) || !existsSync(file) || !statSync(file).isFile()) {
    return json({ error: "not found" }, 404);
  }
  return new Response(Bun.file(file));
}

/** The bench's routes over one booted world; a reset replaces the world with a fresh boot. */
class Bench {
  constructor(
    private engine: Engine,
    private readonly options: ServeOptions,
  ) {}

  close(): void {
    this.engine.close();
  }

  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET") {
      if (path === "/") return staticFile("index.html");
      if (path.startsWith("/bench/")) return staticFile(decodeURIComponent(path.slice(7)));
      if (path === "/api/snapshot") return json(this.engine.snapshot());
      if (path === "/api/verbs") return json({ verbs: verbs() });
      if (path === "/api/events") return this.events(url.searchParams.get("since"));
      if (path.startsWith("/api/received/")) {
        const thing = decodeURIComponent(path.slice(14));
        if (!this.engine.isPerson(thing)) return json({ error: `no person "${thing}"` }, 404);
        return json({ thing, copies: this.engine.received(thing) });
      }
    }
    if (request.method === "POST") {
      if (path === "/api/actions") return this.act(request);
      if (path === "/api/step") return json({ events: this.engine.step() });
      if (path === "/api/reset") return this.reset();
    }
    return json({ error: "not found" }, 404);
  }

  private events(since: string | null): Response {
    const seq = since === null || since === "" ? 0 : Number(since);
    if (!Number.isInteger(seq) || seq < 0) {
      return json({ error: "since must be a non-negative integer" }, 400);
    }
    return json({ events: this.engine.events(seq) });
  }

  private async act(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "the body must be a JSON action" }, 400);
    }
    const result = this.engine.act(body);
    switch (result.outcome) {
      case "recorded":
        return json({ events: result.events });
      case "refused":
        return json({ refused: result.refused }, 422);
      case "invalid":
        return json({ error: result.message }, 400);
    }
  }

  /**
   * Reboot the world. The replacement boots first; the current world is closed only once the
   * replacement is ready, so a reset that boot refuses (422) keeps serving the current world.
   */
  private reset(): Response {
    const booted = boot(this.options.world, {
      tickMinutes: this.options.tickMinutes,
      dbPath: this.options.dbPath,
    });
    if (!booted.ok) return json({ refusal: booted.refusal }, 422);
    const previous = this.engine;
    this.engine = booted.engine;
    previous.close();
    return json({ snapshot: this.engine.snapshot() });
  }
}

/** Boot the world and serve the bench on the loopback address, or return why boot refused. */
export function startServer(options: ServeOptions): Started {
  const booted = boot(options.world, { tickMinutes: options.tickMinutes, dbPath: options.dbPath });
  if (!booted.ok) return booted;
  const bench = new Bench(booted.engine, options);
  const server = Bun.serve({
    hostname: HOSTNAME,
    port: options.port,
    fetch: (request) => bench.handle(request),
  });
  return {
    ok: true,
    server,
    stop: () => {
      void server.stop(true);
      bench.close();
    },
  };
}
