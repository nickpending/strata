---
type: note
date: 2026-11-13
title: "npc-standing: parked at resolve"
description: "Where the npc-standing shape (#18, #19) stood when rudy paused it for the NPC-structure exploration: what is recorded, the one open question, rudy's numbers, the approved spend and the design draft."
purpose: "Lets a later worker resume npc-standing without redoing problem, ground or the settled questions."
producer: assistant
---

# npc-standing: parked at resolve

Paused 2026-11-13 by rudy, through strata-d3. Q-A showed that strata has nowhere to keep the facts the judgment was measured with, so the NPC's own structure (facts, obligations, affiliations, temperament, origin) is being explored first. A new worker resumes this shape after that exploration closes.

## Recorded in the shape journal (`ember shape step --slug npc-standing`)

The journal and its records sit under `docs/work/npc-standing/shape/`, which is gitignored. They exist only in this checkout.

- **problem:** a need, for #18 and #19.
- **ground:** 0 ADRs. Related issues are #17 and #12. The measures it cites are in `ground-measures.txt` beside this note (M1 to M4).
- **resolved-1 (evidence):** the judge runs in the bench server, outside act() and step(). Every new encounter is queued and judged by its own async Jev calls. Each reading lands as an appended judgment row, and standing is updated in the same store transaction, following the known-rows precedent, so no event kind is added. Player runs judge too.
- **resolved-2 (evidence):** a judgment is asked once, with no retry. A refused one adds nothing to the tallies and still adds the fixed amount to familiarity. The bench shows the refused count per pair.
- **resolved-3 (rudy):** Jev judges only encounters whose other person is the event's actor. Every other encounter adds only the fixed amount to familiarity.

## Still open: Q-A

The question is what the judgment's `who_you_are` holds. Its `earlier` half is settled from evidence: the holder's last 5 world copies before the event (M1: the adopted arm was measured on at most 5, a mean of 2.4). Record it with the Q-A answer as one resolved record.

Every measured result used an experiment-written identity paragraph of about 700 characters, and the world has no such field. Two points were raised against a typed-state answer:
- Putting "values in words" in the state would show importances to Jev, which design B forbids (exploration item 18; O1 dropped as D38).
- Putting standing toward the other in the state would make each judgment read what earlier judgments built, a feedback loop no experiment measured.

jev-state never ran arm K on held-out. On dev, adding known facts read slightly below arm S (`corpus/experiments/jev-state/report.md:44`).

## Settled outside the journal (strata-d3, for rudy)

- **Numbers:** a fixed amount of 1 per encounter, a formation line of 20, and role weights of 1.0 for direct and 0.5 for witnessed. They are required world config with no default.
- **Spend:** a $0.15 ceiling is approved across R1 and R2, and it goes in the criteria's given.
  - R1 is a scripted real-engine run of the judgment on world/.
  - R2 is the four player sets with the judge live, against npc-values' 43 of 44.
- **Statements:** the 40 per-value statements live in world/values.toml beside each value as `{other}` templates. They are generated from jev-statements' W4 by putting "{other}" for the name, and a test checks them against W4. That keeps value ids out of code, as npc-values committed.

## Design draft (not recorded)

1. **world.toml `[standing]`:**
   - `familiarity_per_encounter`, `formation_line`, `role_weights.direct` and `role_weights.witnessed` are all required.
   - Boot refuses a missing one with its file, path and rule, and refuses witnessed ≥ direct.
   - The two-tick test world authors them too.
2. **Person files:** `[[standing]]` entries replace `[[ties]]`. Each has `toward`, `summary` (voice only) and `[standing.tallies]` over every catalogue value.
   - Drafts come from the ties notes, marked as drafts: Rogue→Glitch security −4, power +2; Glitch→Rogue security +3, self_direction −2; Mux→Glitch achievement +3, benevolence +3. Every other value is 0.
   - Each summary is the tie's kind and note.
   - Authored pairs start formed. If the NPC-structure exploration gives people more typed facts, redraft from them.
3. **`src/engine/standing.ts`, pure:**
   - Per value, delta = role weight × touches × (stake effect + deed effect).
   - Weighted effect = Σ importance × delta, and familiarity grows by fixed + |weighted effect|.
   - Regard = Σ importance × tally.
   - formed = authored, or familiarity ≥ line.
4. **Store:**
   - A `standing (holder, toward, json)` table, with authored rows written at create.
   - A `judged` table that is append-only and unique on (event, holder, toward), with outcome judged, refused or unjudged.
   - One transaction appends the row and updates standing.
   - Standing stays out of the snapshot, so it is private and never reaches the player.
5. **Engine:** `encountersOfEvent`, `judgmentState` (whose `who_you_are` builder waits on Q-A; it is one function of holder and other), `judge(row)` and `standing(person)`.
6. **`src/mind/judgment.ts`:** the adopted ask, ported from `corpus/experiments/jev-statements/ask.ts` with W4.
   - It keeps READ, TOUCHES, the stake and deed levels, the strength form, the 0.4 threshold and the readings.
   - A stub-Jev test shows it sends exactly W4's requests on the same state, as `check-arms.ts` does.
7. **`src/mind/render.ts`:** `value-weighting-2/render.ts` moves here, and the corpus file re-exports it.
8. **`src/server/judge.ts`:**
   - Holds the queue, at concurrency 6 (the runners' default, with 0 refused).
   - Writes unjudged rows at once and runs Jev-judged ones async.
   - A reset drops what is still queued.
   - Keeps an optional JSONL log, which the adapter writes with a `--judgments <dir>` flag so real runs can total their cost.
9. **Routes:** add `/api/standing/<person>`. `ServeOptions.decide` is required: `main.ts` and `host.ts` pass the real `decide`, and tests pass a stub.
10. **Bench:**
    - A `bench/panels/relationships.js` section in the operator aside. Per person and per other person it shows each value's tally with its importance, overall regard, familiarity against the line, formed or not (authored, or by familiarity), the summary, and the judged, refused, unjudged and waiting counts.
    - The Rooms section in the player region loses its tie lines.
11. **Ties removed:** knowledge's people read authored standing targets as known at boot, and `tiesPart` and `PersonState.ties` go.

Estimated net product lines: about +650.
