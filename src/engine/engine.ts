import { z } from "zod";
import { dueDrafts, tickDraft } from "./clock.ts";
import { type DefinitionRefusal, loadWorld, type WorldDefs } from "./definitions.ts";
import {
  type Copy,
  type EventDraft,
  kindOf,
  participants,
  redact,
  registry,
  type WorldEvent,
} from "./events.ts";
import { actionSchema, type Refusal, rule } from "./rules.ts";
import { buildSnapshot, type Snapshot } from "./snapshot.ts";
import { Store } from "./store.ts";
import { applyPart, initialRows } from "./things.ts";

/** The launch flag that carries the tick length; boot refuses without it. */
export const TICK_MINUTES_FLAG = "--tick-minutes";

export type BootOptions = {
  /** Minutes of game time one tick stands for. Required: there is no default. */
  tickMinutes?: number | undefined;
  /** The database file. Whatever is at this path is replaced by the fresh world. */
  dbPath: string;
};

/** Why boot refused: a missing tick length, or a definition naming its file, path and rule. */
export type BootRefusal = DefinitionRefusal | { rule: "tick-minutes-required"; message: string };

export type BootResult = { ok: true; engine: Engine } | { ok: false; refusal: BootRefusal };

export type ActResult =
  | { outcome: "recorded"; events: WorldEvent[] }
  | { outcome: "refused"; refused: Refusal }
  | { outcome: "invalid"; message: string };

/**
 * Who receives a copy of `event`: every person located at its place in `snapshot` (when its
 * audience is the place), plus its actor and targets that are people. `snapshot` is the state after
 * the event is applied.
 */
export function witnessesOf(event: WorldEvent, snapshot: Snapshot): string[] {
  const witnesses = new Set<string>();
  if (event.visibility.audience === "place" && event.place !== null) {
    for (const person of snapshot.views.presence[event.place] ?? []) witnesses.add(person);
  }
  for (const id of participants(event)) {
    if (Object.hasOwn(snapshot.people, id)) witnesses.add(id);
  }
  return [...witnesses].sort();
}

/**
 * A booted world. Live state has one home, the database's state rows; the engine holds only the
 * read-only definitions and the tick length between calls.
 */
export class Engine {
  constructor(
    private readonly store: Store,
    readonly defs: WorldDefs,
    readonly tickMinutes: number,
    readonly dbPath: string,
  ) {}

  snapshot(): Snapshot {
    return buildSnapshot(this.store.readState(), this.defs, this.tickMinutes);
  }

  /** Every event with a seq greater than `since`, in order. */
  events(since = 0): WorldEvent[] {
    return this.store.events(since);
  }

  /** Every copy `thing` has witnessed, in event order. */
  received(thing: string): Copy[] {
    return this.store.received(thing);
  }

  isPerson(id: string): boolean {
    return this.defs.people.some((person) => person.id === id);
  }

  /**
   * Validate an operator's action and record its events, or return why not. A refusal or an
   * invalid action writes nothing.
   */
  act(input: unknown): ActResult {
    const parsed = actionSchema.safeParse(input);
    if (!parsed.success) return { outcome: "invalid", message: z.prettifyError(parsed.error) };
    const action = parsed.data;
    if (!this.isPerson(action.actor)) {
      return { outcome: "invalid", message: `actor "${action.actor}" names no person` };
    }
    return this.store.transaction((): ActResult => {
      const result = rule(this.snapshot(), action);
      if ("refused" in result) return { outcome: "refused", refused: result.refused };
      return { outcome: "recorded", events: result.events.map((draft) => this.record(draft)) };
    });
  }

  /** Advance the clock one tick: the `time.tick`, then every entry due, in insertion order. */
  step(): WorldEvent[] {
    return this.store.transaction(() => {
      const tick = this.snapshot().tick + 1;
      const recorded = [this.record(tickDraft(tick))];
      for (const draft of dueDrafts(this.snapshot().schedule, tick)) {
        recorded.push(this.record(draft));
      }
      return recorded;
    });
  }

  close(): void {
    this.store.close();
  }

  /**
   * The one apply path: validate the payload, append the event, run every part's reducer over its
   * own row, then witness from the state after application. Callers run it inside a transaction.
   */
  private record(draft: EventDraft): WorldEvent {
    const entry = registry[draft.subkind];
    const payload = entry.payload.parse(draft.payload);
    const seq = this.store.nextSeq();
    const event = {
      id: `e${seq}`,
      tick: draft.tick,
      seq,
      kind: kindOf(draft.subkind),
      subkind: draft.subkind,
      actor: draft.actor,
      targets: draft.targets,
      place: draft.place,
      visibility: entry.visibility,
      cause: draft.cause,
      payload,
    } as WorldEvent;
    this.store.appendEvent(event);
    for (const row of this.store.readState()) {
      const next = applyPart(row.part, row.thing, row.state, event);
      if (next !== row.state) this.store.writeState({ ...row, state: next });
    }
    for (const witness of witnessesOf(event, this.snapshot())) {
      this.store.witness(event.id, witness, redact(event, witness));
    }
    return event;
  }
}

/**
 * Boot a world from the definitions under `worldDir` into a fresh database at `options.dbPath`.
 * The tick length is checked first and the definitions second; on either refusal no database file
 * is created. On success any previous database at the path is replaced.
 */
export function boot(worldDir: string, options: BootOptions): BootResult {
  const { tickMinutes } = options;
  if (tickMinutes === undefined || !Number.isFinite(tickMinutes) || tickMinutes <= 0) {
    return {
      ok: false,
      refusal: {
        rule: "tick-minutes-required",
        message: `${TICK_MINUTES_FLAG} is required: the minutes of game time one tick stands for, a positive number`,
      },
    };
  }
  const loaded = loadWorld(worldDir);
  if (!loaded.ok) return { ok: false, refusal: loaded.refusal };
  const store = Store.create(options.dbPath, initialRows(loaded.defs));
  return { ok: true, engine: new Engine(store, loaded.defs, tickMinutes, options.dbPath) };
}
