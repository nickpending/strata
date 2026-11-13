## The job

You write test material and its labels for a study of how characters in a text world react to each other. strata
(/Users/rudy/development/projects/strata) is a world engine with three people (Rogue, Glitch, Mux), two rooms and
three items. You write short scenarios of real actions in that world. In each case, one person (the holder) receives
an event involving another person (the other). For each case you label two things, both from the holder's side:

1. **The case:** would this event make the holder think better of the other (build), worse (detract), or change
   nothing (neutral), and by how much, judged as that particular holder: their identity, what happened just before,
   and how much each of ten personal values matters to them.
2. **Each value:** for every one of the ten values, what the event did to it, on two channels, without regard to how
   much the value matters to this holder.

Your labels are the ground truth something else will be compared with. You are told nothing about what will be
judged against them or how. Label as a careful reader of people.

## Read first

- `world/` (every file): the people, rooms, items, `world.toml`, and `values.toml` (the ten values and the 0 to 4
  importance words). Each person file's `[values]` table is that person's own importances.
- `src/engine/rules.ts`, `src/engine/events.ts`, `src/engine/encounters.ts`, `src/engine/engine.ts`: the verbs
  (`depart`, `say`, `say-to`, `whisper`, `offer`, `accept`, `refuse`), what each records, who receives a copy, and
  when an event is an encounter with the other (direct: the holder is the actor or a target; witnessed: a bystander).
  An offer lapses unanswered after `offer_window_ticks` clock steps.
- `corpus/experiments/size-judgment/build.ts` and `corpus/experiments/value-weighting-2/render.ts`: how your
  scenarios are driven through the real engine and how each event reads to its holder. The holder sees only the
  rendered lines.

Read nothing else under `corpus/` and nothing under `docs/`. Never open `corpus/runs/`, any `arms/` directory, any
`labels*.json`, `*material*.json`, `report.md`, `prereg.md`, `score*` file or other brief. Work only in the output
directory below.

## What to write

Two files in `{OUT}/`, `material.json` and `labels.json`.

`material.json` has build.ts's `Material` shape:
- `identities`: one second-person identity per person ("You are Rogue. ..."), written fresh to fit `world/`. Give
  each person a concrete situation (money, debts, who they rely on, what they fear) so stakes can be read from it. It
  may add standing facts (who owes whom, who lets whom stay, who works for whom). Every case of a person uses that
  person's one identity.
- `variants`: nine, three per person. `rogue-w`, `glitch-w`, `mux-w` copy `importance` exactly from that person's
  `[values]` table in `world/people/`. `rogue-s`, `rogue-t`, `glitch-s`, ..., `mux-t` are yours: give all ten values an
  importance from 0 to 4, and make a person's three variants differ sharply in what matters to them, as real people
  do, so the same event can land differently on each.
- `scenarios`: each a script of `{ "act": {...} }` and `{ "step": n }` entries, with its `cases`. A case names its
  `id`, `holder`, `variant` (a variant of that holder), `other`, `target` (index of the step that records the target
  event) and, for a clock step, `targetSubkind`. A case's holder must receive the target event and have an encounter
  with `other` in it. Earlier steps give the holder its history (1 to 8 lines is right); put the context a reader
  needs in the words people say.

`labels.json`: `{ "cases": [ ... ] }`, one entry per case:
```
{ "id", "set": "A" | "B" | "C",
  "direction": "build" | "detract" | "neutral",
  "magnitude": 1 | 2 | 3 | 4 | 5   (0 for neutral),
  "kind": "opposite" | "conflict" | "neutral" | "plain",
  "pair": opposite partner id or null,
  "size_pair": size partner id or null,
  "character": true | false,
  "exposure": true | false,
  "stake": { <value id>: "up" | "down" | "none", ... all ten },
  "deed":  { <value id>: "up" | "down" | "none", ... all ten },
  "rationale": "one or two sentences: why the case label, and which values moved" }
```

## How to label the case

- **Magnitude**, how much better or worse the holder now thinks of the other because of this event:
  1. barely: a flicker, forgotten by tomorrow;
  2. slight: noticed, a small tilt;
  3. clear: a real shift they would remember;
  4. strong: it changes how they will deal with the other;
  5. decisive: about as much as one moment could do (a rescue, a betrayal).
- **opposite**: two cases of the same target event, the same holder person, two different variants, labelled in
  opposite directions because of who that variant is. Each names the other in `pair`.
- **conflict**: an event that pulls this holder both ways at once (something they care about gained, something else
  they care about lost), with the direction set by what weighs more for them.
- **neutral**: an event that changes nothing for this holder: routine, ordinary, nothing riding on it. All 20
  value labels are usually `none`.
- **plain**: an ordinary build or detract that is none of the above.
- **size pair** (plain cases only): two cases with the same holder variant, the same verb as target event and the same
  direction, whose magnitudes differ by 2 or more because of what came before. Each names the other in `size_pair`.
- **character**: true when the label rests mainly on what the other's act says about the kind of person they are,
  rather than on what the act does to the holder's own interests. Include cases where those two point opposite ways.
  A neutral case is never `character`.
- **exposure**: true when the label turns on what the act exposes the holder to or lets happen to them next (danger
  brought nearer, a debt deepened, heat drawn to their door), not on what it does at once.

## How to label each value

- **stake**: did this event advance (`up`) the holder's own share of that value, set it back (`down`), or neither
  (`none`)? Judge it from the holder's situation: who they are, what happened just before, what rides on it for
  them. Count what the act exposes them to or lets happen next.
- **deed**: in this act, did the other act for that value (`up`: served it, protected it, lived it out) or against
  it (`down`: violated it, undermined it), or neither (`none`)?
- **Touched means a careful reader would say so.** Label `up` or `down` only when the event plainly moves the value
  (stake) or the act plainly bears on it (deed). A faint association is `none`. Most of a case's 20 labels will be
  `none`; a case usually touches one to four values per channel.
- **Ignore the variant's importances here.** These labels say what the event did, not how much it matters to this
  variant. The two cases of an opposite pair share one event, one identity and one history, so their 20 value labels
  will usually be the same; the case labels differ because the variants weigh those values differently.
- A deed label can differ from the stake label on the same value: someone can act bravely for others (deed `up` on
  benevolence) in a way that puts the holder in danger (stake `down` on security).

Judge each case only from what its holder received, the identity and the variant's importances; nothing a holder
never received may decide a label.

## Make-up

Three sets, A, B and C, of the same make-up. A scenario's cases are all in one set. Per set, 40 cases:
- 12 opposite pairs (24 cases), 5 conflict, 5 neutral, 6 plain forming 3 size pairs;
- at least 6 `character` cases, at least 2 of them in opposite pairs whose two variants read the other's act in
  opposite ways;
- at least 5 `exposure` cases;
- within build, each magnitude 1 to 5 at least twice; within detract, the same;
- every verb as a target event (including a lapsed offer, a whisper, an arrival and a departure), both roles (direct
  and witnessed), all nine variants and all three people as holders;
- value labels: on stake at least 12 `up` and 12 `down`, on deed at least 10 `up` and 10 `down`, and at least 5
  values touched on stake 4 or more times (don't let one value dominate). Use conformity and benevolence where a
  careful reader would.

Vary who wants what, what is at stake and how plainly it is said. Make each label one a careful reader could give
with confidence. For each set, name in your reply the two cases and the three value labels you were least sure of.

## Check your work

From the repository root, run `bun corpus/experiments/size-judgment/build.ts {OUT}/material.json`. It drives every
scenario through the real engine and prints each case as its holder reads it. It must run with no error. Read the
printed cases and label from what they show plus the identity and the variant's importances. Then validate with a
short script: one label entry per case; all ten values on both channels with ids from `world/values.toml`; every
`pair` and `size_pair` points both ways; the `-w` variants equal the world's tables; every set meets the make-up.

## Reply with

The two paths; per set the counts (cases, scenarios, opposite pairs, conflict, neutral, plain, size pairs, character,
exposure, build and detract cases per magnitude, direct and witnessed, each verb as target, stake up/down/none, deed
up/down/none, stake touches per value); the least sure cases and value labels per set. Under 350 words.
