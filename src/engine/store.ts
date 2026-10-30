import { Database } from "bun:sqlite";
import { renameSync, rmSync } from "node:fs";
import type { Copy, WorldEvent } from "./events.ts";
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
`;

/** Delete the database file at `path` and its journal files, if any. */
function removeDatabase(path: string): void {
  for (const suffix of ["", "-journal", "-wal", "-shm"])
    rmSync(`${path}${suffix}`, { force: true });
}

/** The database file of one world: the event log, the live state rows and the witnessed copies. */
export class Store {
  private constructor(private readonly db: Database) {}

  /**
   * Create the database at `path` afresh: a world is never resumed, every boot replaces the
   * previous run. The new database is built beside `path` and renamed over it only once it is
   * complete, so a create that fails leaves whatever was at `path` untouched.
   */
  static create(path: string, rows: StateRow[]): Store {
    const next = `${path}.next`;
    removeDatabase(next);
    try {
      const building = new Store(new Database(next, { create: true, strict: true }));
      try {
        building.db.exec(SCHEMA);
        building.transaction(() => {
          for (const row of rows) building.writeState(row);
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

  close(): void {
    this.db.close();
  }
}
