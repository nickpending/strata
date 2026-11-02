import { Database } from "bun:sqlite";
import { renameSync, rmSync } from "node:fs";
import type { Copy, WorldEvent } from "./events.ts";
import type { KnownRow, StoredKnown } from "./knowledge.ts";
import type { PartName, StateRow } from "./things.ts";

const SCHEMA = `
CREATE TABLE events (
  seq INTEGER PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  tick INTEGER NOT NULL,
  subkind TEXT NOT NULL,
  json TEXT NOT NULL
);
CREATE TABLE state (
  thing TEXT NOT NULL,
  part TEXT NOT NULL,
  json TEXT NOT NULL,
  PRIMARY KEY (thing, part)
);
CREATE TABLE witnessed (
  event TEXT NOT NULL REFERENCES events (id),
  witness TEXT NOT NULL,
  json TEXT NOT NULL,
  PRIMARY KEY (event, witness)
);
CREATE TABLE known (
  seq INTEGER PRIMARY KEY,
  witness TEXT NOT NULL,
  kind TEXT NOT NULL,
  thing TEXT NOT NULL,
  json TEXT NOT NULL,
  tick INTEGER NOT NULL,
  event TEXT,
  FOREIGN KEY (event, witness) REFERENCES witnessed (event, witness)
);
CREATE VIEW known_latest AS
  SELECT * FROM known k
  WHERE k.seq = (
    SELECT max(seq) FROM known
    WHERE witness = k.witness AND kind = k.kind AND thing = k.thing
  );
`;

type KnownSql = {
  seq: number;
  witness: string;
  kind: string;
  thing: string;
  json: string;
  tick: number;
  event: string | null;
  subkind: string | null;
};

function knownOf(row: KnownSql): StoredKnown {
  const { json, ...rest } = row;
  return { ...rest, value: JSON.parse(json) } as StoredKnown;
}

/** Delete the database file at `path` and its journal files, if any. */
function removeDatabase(path: string): void {
  for (const suffix of ["", "-journal", "-wal", "-shm"])
    rmSync(`${path}${suffix}`, { force: true });
}

/**
 * The database file of one world: the event log, the live state rows, the witnessed copies and the
 * known rows beside them. Known rows are only ever inserted.
 */
export class Store {
  private constructor(private readonly db: Database) {}

  /**
   * Create the database at `path` afresh: a world is never resumed, every boot replaces the
   * previous run. The new database is built beside `path` and renamed over it only once it is
   * complete, so a create that fails leaves whatever was at `path` untouched. `known` is the
   * authored rows, written in the same transaction as the state rows.
   */
  static create(path: string, rows: StateRow[], known: KnownRow[]): Store {
    const next = `${path}.next`;
    removeDatabase(next);
    try {
      const building = new Store(new Database(next, { create: true, strict: true }));
      try {
        building.db.exec(SCHEMA);
        building.transaction(() => {
          for (const row of rows) building.writeState(row);
          for (const row of known) building.know(row);
        });
      } finally {
        building.close();
      }
      removeDatabase(path);
      renameSync(next, path);
    } catch (error) {
      removeDatabase(next);
      throw error;
    }
    const db = new Database(path, { strict: true });
    db.exec("PRAGMA foreign_keys = ON;");
    return new Store(db);
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  nextSeq(): number {
    const row = this.db
      .query<{ seq: number | null }, []>("SELECT max(seq) AS seq FROM events")
      .get();
    return (row?.seq ?? 0) + 1;
  }

  appendEvent(event: WorldEvent): void {
    this.db
      .query("INSERT INTO events (seq, id, tick, subkind, json) VALUES (?, ?, ?, ?, ?)")
      .run(event.seq, event.id, event.tick, event.subkind, JSON.stringify(event));
  }

  events(since: number): WorldEvent[] {
    return this.db
      .query<{ json: string }, [number]>("SELECT json FROM events WHERE seq > ? ORDER BY seq")
      .all(since)
      .map((row) => JSON.parse(row.json) as WorldEvent);
  }

  readState(): StateRow[] {
    return this.db
      .query<{ thing: string; part: string; json: string }, []>(
        "SELECT thing, part, json FROM state ORDER BY thing, part",
      )
      .all()
      .map((row) => ({
        thing: row.thing,
        part: row.part as PartName,
        state: JSON.parse(row.json),
      }));
  }

  writeState(row: StateRow): void {
    this.db
      .query(
        "INSERT INTO state (thing, part, json) VALUES (?, ?, ?) " +
          "ON CONFLICT (thing, part) DO UPDATE SET json = excluded.json",
      )
      .run(row.thing, row.part, JSON.stringify(row.state));
  }

  witness(event: string, witness: string, copy: Copy): void {
    this.db
      .query("INSERT INTO witnessed (event, witness, json) VALUES (?, ?, ?)")
      .run(event, witness, JSON.stringify(copy));
  }

  /** Every copy `witness` holds, in event order. */
  received(witness: string): Copy[] {
    return this.db
      .query<{ json: string }, [string]>(
        "SELECT w.json FROM witnessed w JOIN events e ON e.id = w.event " +
          "WHERE w.witness = ? ORDER BY e.seq",
      )
      .all(witness)
      .map((row) => JSON.parse(row.json) as Copy);
  }

  /** Append one known row. A taught row must stand beside its witness's copy of its event. */
  know(row: KnownRow): void {
    this.db
      .query(
        "INSERT INTO known (witness, kind, thing, json, tick, event) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(row.witness, row.kind, row.thing, JSON.stringify(row.value), row.tick, row.event);
  }

  /** Every known row `witness` holds, in seq order, with its teaching event's subkind. */
  known(witness: string): StoredKnown[] {
    return this.knownFrom("known", witness);
  }

  /** The latest known row per (kind, thing) that `witness` holds, in seq order. */
  latestKnown(witness: string): StoredKnown[] {
    return this.knownFrom("known_latest", witness);
  }

  private knownFrom(table: "known" | "known_latest", witness: string): StoredKnown[] {
    return this.db
      .query<KnownSql, [string]>(
        `SELECT k.seq, k.witness, k.kind, k.thing, k.json, k.tick, k.event, e.subkind FROM ${table} k ` +
          "LEFT JOIN events e ON e.id = k.event WHERE k.witness = ? ORDER BY k.seq",
      )
      .all(witness)
      .map(knownOf);
  }

  close(): void {
    this.db.close();
  }
}
