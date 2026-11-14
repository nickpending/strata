---
type: design
date: 2026-11-14
title: "Design: world-json"
description: "strata's authored world is written and read as JSON, checked by the same zod rules, with a JSON Schema derived from those rules that an editor uses to validate each file as it is written, so no TOML world file remains (#20)."
purpose: "The recorded design of the world-json work order, read by its plan and its builders."
producer: cli:shape
---

# Design: world-json

## Purpose

strata's authored world is written and read as JSON, checked by the same zod rules, with a JSON Schema derived from those rules that an editor uses to validate each file as it is written, so no TOML world file remains (#20).

## Form

src/engine/definitions.ts stays the one loader and the one source of rules. parseFile (src/engine/definitions.ts:85) reads with JSON.parse and refuses a parse failure as rule json-syntax with an empty path, where it refused toml-syntax. listToml (src/engine/definitions.ts:102) becomes a lister of names ending .json, and loadWorld (src/engine/definitions.ts:217) names world.json and values.json. One table in definitions.ts, WORLD_FILES, holds each kind (world, values, room, person, item) with its file name or directory (world.json, values.json, rooms, people, items) and its file schema; loadWorld, worldJsonSchemas() and the tests read that table, so the kind-to-schema mapping lives in one place. Each kind's file schema is its zod schema wrapped once, adding two optional authoring keys at the file root: $schema (a string, the relative path to that kind's committed JSON Schema) and $comment (a non-empty string, an authoring note). parseFile drops both before the definition is returned, so WorldDefs, the snapshot (which takes rooms whole at src/engine/snapshot.ts:59) and every reader see exactly the fields they see today. Any other unknown key still refuses as unrecognized_keys. personSchema gains one optional typed field, values_draft (boolean): true when the person's importances are a draft not yet settled; it is the only field this work adds to a person, by strata-d3's ruling that a draft is a fact about the data. Meaning the TOML comments carried moves as follows: the offer window's explanation becomes .describe() text on rules.offer_window_ticks; the 0-to-4 rating rule becomes .describe() text on personSchema.values and on valuesFileSchema.importance; the Schwartz (2012) citation becomes values.json's $comment in both worlds; the drafted-importance note becomes values_draft: true on rogue, glitch and mux with the rest of its sentence (drafted by the assistant, experiment-grade, rudy 2026-11-10, derived from this world's ties) kept as each file's $comment. definitions.ts exports worldJsonSchemas(), mapping each kind in WORLD_FILES to z.toJSONSchema of its file schema. A new command, src/engine/write-schemas.ts, run by `bun run schemas` (package.json), writes them to schemas/<kind>.schema.json and the script then formats them with biome, since biome format-checks JSON (biome.json:10). Each of the 18 world files under world/ and tests/worlds/two-tick/ is rewritten as JSON with the same content, its first key $schema naming the relative path to its kind's schema (world/people/mux.json names ../../schemas/person.schema.json). A new test file, tests/world-json.test.ts, holds the tests that are not an existing file's: the committed schemas deep-equal worldJsonSchemas() as parsed JSON, so a zod change without `bun run schemas` fails; every JSON file under world/ and tests/worlds/ names its kind's schema; no .toml file exists under world/ or tests/worlds/; every corpus script's world import resolves to an existing file. The refusal tests in boot, values, knowledge and server tests edit JSON (parse, change, write) instead of TOML text and keep their paths and rules, with files now .json; V3 asserts values_draft. The 16 corpus scripts' world/values.toml imports move to world/values.json; README.md:78 says the definitions are JSON with their schemas under schemas/; docs/work/npc-standing/parked.md's world/values.toml and world.toml pointers move to .json, its planned TOML tables named as JSON keys. Corpus prose, closed docs/work design and work-order files and the closed explorations stay as the dated record. bunfig.toml and the tests' apiconf config.toml are untouched.

Acts on the gap: World definitions gain a JSON form, read by the same rules, and a JSON Schema derived from those rules that each file names in $schema, so an editor validates the file as written; the TOML form is removed and a test keeps it removed.

## Size

Net product lines: +60

- extends `src/engine/definitions.ts`
- extends `package.json`
- replaces `world`
- replaces `tests/worlds/two-tick`
- new `src/engine/write-schemas.ts`: Writing the schema files is a command run when the rules change; the loader reads and never writes, and no existing command writes repository files from the engine's rules.
- new `schemas`: Editors resolve $schema to a file; the derived JSON Schemas must be committed somewhere every world file can name by a relative path, and no existing directory holds schemas.

## Commitments

- One source of rules: the zod schemas in src/engine/definitions.ts check the JSON and generate the JSON Schema, and one table (WORLD_FILES) maps each kind to its file and schema for the loader, the generator and the tests; the committed schema is a derived artifact, held equal to its source by a test.
- Every refusal the TOML loader named still refuses with the same path and rule, the file named .json; a JSON syntax error refuses as json-syntax with an empty path.
- The loaded definitions are what they were: $schema and $comment are dropped at the loader and reach no def, snapshot or reader; values_draft is the only added field, typed, by strata-d3's ruling.
- No TOML comment's meaning is dropped: field explanations become schema descriptions an editor shows; provenance becomes $comment; the draft mark becomes the typed values_draft.
- No TOML file remains under world/ or tests/worlds/, and a test fails when one appears; bunfig.toml stays TOML.
- Every runnable world reader, including the 16 corpus scripts, reads .json; dated records keep the paths they recorded.

## Sacrifices

- A JSON world file with a duplicate key loads with the last value, where TOML refused it; biome's noDuplicateObjectKeys refuses it in every committed world, so only a world kept outside the repository and loaded by --world goes unchecked. (0 of 2 every world directory strata's code and tests load)
- No test runs the committed JSON Schema as a validator over the world files: no JSON Schema validator is a dependency, so acceptance rests on the schema equalling zod's derivation of the rules that accept every file, and on the operator's editor walk. (not a case: It is a check left to derivation and the operator's editor walk, not a usage path: every committed world file is loaded by the zod rules the schema is derived from, and the drift test holds the schema equal to that derivation.)
- The JSON Schema carries shape rules only: the seven cross-reference rules (exit to names a room, location, tie target, place, value names the catalogue, every value rated, holder) are not expressible in it, so an editor does not flag them and boot still refuses them. (7 of 12 every named refusal rule in the loader)
- unique-id (an id defined in two files of one kind) and unique-value-id (a value id repeated in values.json) are not expressible in a per-file JSON Schema either, so an editor does not flag them and boot still refuses them. (2 of 12 every named refusal rule in the loader)
- Dated records keep the .toml paths they recorded: corpus preregistrations, briefs and comments, closed docs/work design and work-order files, and the closed npc-knowledge and npc-relationships explorations (strata-d3's ruling). (60 of 61 48 corpus prose lines and 13 docs files naming TOML, less parked.md which moves)

## Risk

If $schema or $comment were not dropped, a room's $schema would ride into the snapshot and the bench page; the def-equality tests catch it. If the committed schema drifted, editors would validate against stale rules; the drift test fails the gate. If zod's toJSONSchema output changes on a zod upgrade, the drift test fails until `bun run schemas` is rerun, a one-command fix. A corpus script missed would fail only when run; the resolution test covers every corpus import of world/.

## Licensed by

docs/work/world-json/shape/evidence/issue-20.txt:21
