/**
 * What has passed between one person and each other: read on every request from the copies the
 * person holds, never stored. One encounter per other person who received the same event, read from
 * who received it and the copy's envelope alone (never its payload, never a registry entry, never a
 * subkind's own case), so a subkind added later yields encounters with no change here. The one home
 * of who a copy is with: knowledge's people read it too. Nothing in the rules or the apply path
 * reads it.
 */
import type { Copy, Subkind } from "./events.ts";

/** Direct when the holder is the copy's actor or one of its targets; witnessed otherwise. */
export type Role = "direct" | "witnessed";

/** One encounter: who with, in which role, of which subkind, at which tick, from which event. */
export type Encounter = { with: string; role: Role; subkind: Subkind; tick: number; event: string };

/** One person's encounters, as the operator reads them. */
export type EncountersView = { person: string; name: string; encounters: Encounter[] };

/**
 * `holder`'s encounters from its own `copies`, in the order given: per copy, one per id `others`
 * gives for its event (every other recipient of that event, as the caller reads them), in that
 * order. Every recipient is a person, so no id is filtered.
 */
export function encountersOf(
  copies: Copy[],
  holder: string,
  others: (event: string) => string[],
): Encounter[] {
  return copies.flatMap((copy) => {
    const role: Role =
      copy.actor === holder || copy.targets.includes(holder) ? "direct" : "witnessed";
    return others(copy.id).map(
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
