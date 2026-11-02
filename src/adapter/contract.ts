/**
 * The bench's route bodies against what the harness declares it reads: each body type the routes
 * build their answers as must be assignable to the harness's type of the same route, so a route
 * change that would break the harness fails strata's typecheck here. Compiled by the typecheck,
 * run by nothing.
 */
import type * as Harness from "harness/bench.ts";
import type * as Served from "../server/routes.ts";

/** Compiles only when `Body` is assignable to `Declared`. */
type Serves<Body extends Declared, Declared> = [Body, Declared];

export type Contract = [
  Serves<Served.VerbsBody, Harness.VerbsBody>,
  Serves<Served.SubkindsBody, Harness.SubkindsBody>,
  Serves<Served.SnapshotBody, Harness.SnapshotBody>,
  Serves<Served.EventsBody, Harness.EventsBody>,
  Serves<Served.ReceivedBody, Harness.ReceivedBody>,
  Serves<Served.KnowledgeBody, Harness.KnowledgeBody>,
];
