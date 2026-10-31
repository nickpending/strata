/**
 * The bench host strata gives the harness: a fresh bench over the world, on an ephemeral loopback
 * port, over a database in a new temporary directory that stopping it removes.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Hosted } from "harness/run.ts";
import { startServer } from "../server/routes.ts";

/** Boot a fresh bench, or say why boot refused; stop closes it and removes its directory. */
export function hostBench(bench: { worldDir: string; tickMinutes: number }): Hosted {
  const dir = mkdtempSync(join(tmpdir(), "strata-harness-"));
  const served = startServer({
    world: bench.worldDir,
    dbPath: join(dir, "world.sqlite"),
    tickMinutes: bench.tickMinutes,
    port: 0,
  });
  if (!served.ok) {
    rmSync(dir, { recursive: true, force: true });
    return { ok: false, message: served.refusal.message };
  }
  return {
    ok: true,
    base: `http://127.0.0.1:${served.server.port}/`,
    stop: () => {
      served.stop();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
