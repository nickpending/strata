import { existsSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { type BootRefusal, boot, type Engine } from "../engine/engine.ts";
import type { Pending } from "../engine/pending.ts";
import { verbs } from "../engine/rules.ts";
import type { Snapshot } from "../engine/snapshot.ts";

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

/** The body of GET /api/snapshot: the snapshot's fields, and every pending state beside them. */
export type SnapshotBody = Snapshot & { pending: Pending[] };

export type Started =
  | { ok: true; server: Bun.Server<undefined>; stop: () => void }
  | { ok: false; refusal: BootRefusal };

/** The names the bench answers to; a request carrying any other Host is a rebinding page. */
const LOOPBACK_NAMES = new Set([HOSTNAME, "localhost"]);

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function sameHost(origin: string, host: string): boolean {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Refuse what crosses the loopback boundary from a browser: a Host that is not a loopback name
 * (DNS rebinding), a POST from another origin, and a POST that is not JSON, which no other page can
 * send without a CORS preflight the bench never answers. Null when the request may proceed.
 */
function boundaryRefusal(request: Request): Response | null {
  const host = request.headers.get("host");
  if (host === null || !LOOPBACK_NAMES.has(host.replace(/:\d+$/, ""))) {
    return json({ error: "the bench answers only on its loopback address" }, 403);
  }
  if (request.method !== "POST") return null;
  const origin = request.headers.get("origin");
  if (origin !== null && !sameHost(origin, host)) {
    return json({ error: "requests from another origin are refused" }, 403);
  }
  if (!/^application\/json\s*(;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return json({ error: "a POST must be sent as application/json" }, 415);
  }
  return null;
}

/** A path segment decoded, or null when its percent-encoding is malformed. */
function decoded(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

const MALFORMED_PATH = { error: "the path is not valid percent-encoding" };

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
    const refusal = boundaryRefusal(request);
    if (refusal !== null) return refusal;
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET") {
      if (path === "/") return staticFile("index.html");
      if (path.startsWith("/bench/")) {
        const file = decoded(path.slice(7));
        return file === null ? json(MALFORMED_PATH, 400) : staticFile(file);
      }
      if (path === "/api/snapshot") {
        return json({ ...this.engine.snapshot(), pending: this.engine.pending() });
      }
      if (path === "/api/verbs") return json({ verbs: verbs() });
      if (path === "/api/events") return this.events(url.searchParams.get("since"));
      if (path.startsWith("/api/received/")) {
        const thing = decoded(path.slice(14));
        if (thing === null) return json(MALFORMED_PATH, 400);
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
    return json({ snapshot: this.engine.snapshot(), pending: this.engine.pending() });
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
    // Bun's development error page carries the cwd, source paths and source lines; never serve it.
    development: false,
    fetch: (request) => bench.handle(request),
    error: (error) => {
      console.error("strata: request failed:", error);
      return json({ error: "internal error" }, 500);
    },
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
