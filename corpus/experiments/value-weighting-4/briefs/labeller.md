## The job

You write test material and its labels for a study of how characters in a text world react to each other. strata
(/Users/rudy/development/projects/strata) is a world engine with three people (Rogue, Glitch, Mux), two rooms and
three items. You write short scenarios of real actions in that world. In each, one person (the holder) receives an
event involving another person (the other). You label whether that event would make the holder think better of the
other (build), worse (detract), or change nothing (neutral), judged as that particular holder: their identity, what
happened just before, and how much each of ten personal values matters to them.

Your labels are the ground truth something else will be scored against. You are told nothing about what will be
judged against them or how; label as a careful reader of people.

## Read first

- `world/` (every file): the people, rooms, items and `world.toml`.
- `src/engine/rules.ts`, `src/engine/events.ts`, `src/engine/encounters.ts`, `src/engine/engine.ts`: the verbs
  (`depart`, `say`, `say-to`, `whisper`, `offer`, `accept`, `refuse`), what each records, who receives a copy, and
  when an event is an encounter with the other (direct: the holder is the actor or a target; witnessed: a bystander).
  An offer lapses unanswered after `offer_window_ticks` clock steps.
- `corpus/experiments/value-weighting-2/build.ts` and `render.ts`: how your scenarios are driven through the real
  engine and how each event reads to its holder. The holder sees only the rendered lines.
- `corpus/experiments/value-weighting-3/catalogue.json`: the ten values (Schwartz's) and the 0 to 4 importance scale.

Read nothing else under `corpus/`, and nothing under `docs/`. Never open `corpus/runs/`, any `arms/` directory, any
`labels*.json`, `*material*.json`, `report.md`, `prereg.md` or `score*` file. Work only in the output directory below.

## What to write

Two files in `{OUT}/`, `material.json` and `labels.json`.

`material.json` has build.ts's `Material` shape:
- `identities`: one second-person identity per person ("You are Rogue. ..."), written fresh. It may add standing
  facts (who owes whom, who lets whom stay, who works for whom) as long as they fit `world/`. Every case of a person
  uses that person's one identity.
- `variants`: nine, three per person, ids `rogue-s`, `rogue-t`, `rogue-u`, `glitch-s`, ..., `mux-u`. Each gives all
  ten values an importance from 0 to 4. Make the three variants of a person differ sharply in what matters to them,
  as real people do, so the same event can land differently on each.
- `scenarios`: each a script of `{ "act": {...} }` and `{ "step": n }` entries, with its `cases`. A case names its
  `holder`, `variant` (a variant of that holder), `other`, `target` (index of the step that records the target
  event) and, for a clock step, `targetSubkind`. A case's holder must receive the target event and have an
  encounter with `other` in it. Earlier steps give the holder its history (1 to 8 lines is right); put the context
  a reader needs in the words people say.

`labels.json` is an array, one entry per case:
`{ "id", "direction": "build" | "detract" | "neutral", "magnitude": 1 | 2 | 3 (0 for neutral), "kind": "plain" |
"opposite" | "conflict" | "neutral", "pair": partner id or null, "set": "A" | "B" | "C", "character": true | false,
"rationale": one or two sentences in the holder's voice or about the holder }`.

- **Magnitude**: 1 slight, 2 clear, 3 strong.
- **opposite**: two cases of the same target event, the same holder person, two different variants, labelled in
  opposite directions because of who that variant is. Each names the other in `pair`.
- **conflict**: an event that pulls this holder both ways at once (something they care about gained, something else
  they care about lost, or two things they hold in tension), with the direction set by what weighs more for them.
- **neutral**: an event that changes nothing for this holder: routine, ordinary, nothing riding on it.
- **plain**: an ordinary build or detract that is none of the above.
- **character**: true when the label rests mainly on what the other's act says about the kind of person they are,
  rather than on what the act does to the holder's own interests. Include cases where those two point opposite
  ways: an act that helps the holder but reads badly to them, or costs the holder but reads well. Mark false
  otherwise. A neutral case is never `character`.

## Make-up

Three sets, A, B and C, of the same make-up. A scenario's cases are all in one set. Per set: 12 opposite pairs (24
cases), 4 conflict, 4 neutral and 4 plain cases, 36 cases; so 108 in all. Per set, at least 6 cases are
`character: true`, and at least 2 of those are opposite pairs whose two variants read the other's act in opposite
ways. Across each set, use every verb as a target event (including a lapsed offer, a whisper, an arrival and a
departure), both roles (direct and witnessed), all nine variants and all three people as holders. Vary who wants
what, what is at stake, and how plainly it is said. Make each case one a careful reader could label with
confidence; for each set, name in your reply the two cases you were least sure of.

## Check your work

From `corpus/experiments/value-weighting-2/`, run `bun build.ts {OUT}/material.json`. It drives every scenario
through the real engine and prints each case as its holder reads it. It must run with no error. Read the printed
cases and label from what they show plus the identity and the variant's importances; nothing a holder never received
may decide a label. Validate that `labels.json` has one entry per case and that every pair points both ways.

## Reply with

The two paths; counts per set (pairs, conflict, neutral, plain, character, direct, witnessed, each verb as target);
the two least sure cases per set. Keep the reply under 300 words.
