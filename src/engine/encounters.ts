/**
 * What has passed between one person and each other: read on every request from the copies the
 * person holds, never stored. One encounter per other person among a copy's actor and targets,
 * read from the copy's envelope alone (never its payload, never a registry entry), so a subkind
 * added later yields encounters with no change here. Nothing in the rules or the apply path reads it.
 */
import type { Copy, Subkind } from "./events.ts";

/** Direct when the holder is the copy's actor or one of its targets; witnessed otherwise. */
export type Role = "direct" | "witnessed";

/** One encounter: who with, in which role, of which subkind, at which tick, from which event. */
export type Encounter = { with: string; role: Role; subkind: Subkind; tick: number; event: string };

/** One person's encounters, as the operator reads them. */
export type EncountersView = { person: string; name: string; encounters: Encounter[] };

/**
 * `holder`'s encounters from its own `copies`, in the order given: per copy, its actor then its
 * targets, less the holder, any id that is no person and any repeat within the copy.
 */
export function encountersOf(
  copies: Copy[],
  holder: string,
  isPerson: (id: string) => boolean,
): Encounter[] {
  return copies.flatMap((copy) => {
    const named = [copy.actor, ...copy.targets];
    const role: Role = named.includes(holder) ? "direct" : "witnessed";
    const others = new Set(named.filter((id) => id !== holder && isPerson(id)));
    return [...others].map(
      (other): Encounter => ({
        with: other,
        role,
        subkind: copy.subkind,
        tick: copy.tick,
        event: copy.id,
      }),
    );
  });
}
