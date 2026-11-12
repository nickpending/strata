## The job

You write test material and its labels for a study of how characters in a text world read what happens around them.
strata (/Users/rudy/development/projects/strata) is a world engine with three people (Rogue, Glitch, Mux), two rooms
and three items. You write short scenarios of real actions in that world. In each case, one person (the holder)
receives an event involving another person (the other). For each case, and for **every one of the ten values** in
`world/values.toml`, you label two things from the holder's side:

- **stake**: did this event advance (`up`) the holder's own share of that value, set it back (`down`), or neither
  (`none`)?
- **deed**: in this act, did the other act for that value (`up`: served it, protected it, lived it out) or against
  it (`down`: violated it, undermined it), or neither (`none`)?

Your labels are the ground truth something else will be compared with. You are told nothing about what will be
judged against them or how. Label as a careful reader of people.

## Read first

- `world/` (every file): the people, rooms, items, `world.toml`, and `values.toml` (the ten values; ignore the
  importance words and each person's `[values]` ratings).
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

## How to label

- **Touched means a careful reader would say so.** Label `up` or `down` only when the event plainly moves the value
  for this holder (stake) or the act plainly bears on it (deed). A faint association is `none`. Most of a case's 20
  labels will be `none`; a case usually touches one to four values per channel.
- **Stake is judged from the holder's situation**: who they are, what happened just before, what rides on it for
  them. The same act can set one holder back and advance another. Count what the act exposes the holder to or lets
  happen to them next (danger brought nearer, a debt deepened, heat drawn to their door), not only what it does at
  once.
- **Deed is about the other's act**, read from where the holder stands: what the other did, and what it shows they
  served or trampled. A deed label can differ from the stake label on the same value: someone can act bravely for
  others (deed `up` on benevolence) in a way that puts the holder in danger (stake `down` on security).
- Use the value descriptions in `world/values.toml`. Judge each case only from what its holder received plus the
  identity; nothing a holder never received may decide a label.

## What to write

Two files in `{OUT}/`, `material.json` and `labels.json`.

`material.json` has build.ts's `Material` shape:
- `identities`: one second-person identity per person ("You are Rogue. ..."), written fresh to fit `world/`. Give
  each person a concrete situation (money, debts, who they rely on, what they fear) so stakes can be read from it. It
  may add standing facts (who owes whom, who lets whom stay, who works for whom). Every case of a person uses that
  person's one identity.
- `variants`: exactly three, one per person, `{ "id": "rogue", "person": "rogue", "importance": {...} }` and so on,
  with `importance` copied from that person's `[values]` table in `world/people/`. The builder needs them; nothing
  reads them.
- `scenarios`: each a script of `{ "act": {...} }` and `{ "step": n }` entries, with its `cases`. A case names its
  `id`, `holder`, `variant` (the holder's id), `other`, `target` (index of the step that records the target event),
  and for a clock step `targetSubkind`. A case's holder must receive the target event and have an encounter with
  `other` in it. Earlier steps give the holder its history (1 to 8 lines is right); put the context a reader needs in
  the words people say.

`labels.json`: `{ "cases": [ { "id", "set": "A" | "B" | "C", "stake": { <value id>: "up" | "down" | "none", ... all
ten }, "deed": { ... all ten }, "rationale": "<one or two sentences on the touched items, from the holder's side>" }
] }`.

## Make-up

Three sets, A, B and C, of the same make-up. A scenario's cases are all in one set. Per set:
- at least 24 cases in at least 8 scenarios;
- all three people as holders, both roles (direct and witnessed), at least 5 different verbs as target events;
- stake: at least 12 `up` and 12 `down` labels; deed: at least 10 `up` and 10 `down`;
- at least 5 values touched on stake at least 4 times each (don't let one value dominate);
- at least 6 cases whose stake label turns on what the act exposes the holder to or lets happen to them later;
- at least 6 cases where what the act says about the other points a different way, or on a different value, from
  what it does to the holder's stake;
- at least 4 cases where two values move opposite ways for the holder;
- at least 3 routine cases where nothing is touched on either channel (all 20 `none`).

Make each label one a careful reader could give with confidence. For each set, name in your reply the three labels
you were least sure of.

## Check your work

From the repository root, run `bun corpus/experiments/size-judgment/build.ts {OUT}/material.json`. It drives every
scenario through the real engine and prints each case as its holder reads it. It must run with no error. Read the
printed cases and label from what they show plus the identity. Then validate with a short script: one label entry per
case, all ten values on both channels, every value id in `world/values.toml`, and every set meets the make-up.

## Reply with

The two paths; per set the counts (cases, scenarios, stake up/down/none, deed up/down/none, stake touches per value,
all-none cases, direct/witnessed, verbs as target); the three least sure labels per set. Under 300 words.
