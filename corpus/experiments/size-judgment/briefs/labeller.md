## The job

You write test material and its labels for a study of how characters in a text world are affected by what happens
around them. strata (/Users/rudy/development/projects/strata) is a world engine with three people (Rogue, Glitch,
Mux), two rooms and three items. You write short scenarios of real actions in that world. In each case, one person
(the holder) receives an event involving another person (the other). For each case you name the one or two personal
values the event touched for the holder, which way it moved each (advanced or set back), and **how far**: its size,
from the holder's side.

Your labels are the ground truth something else will be scored against. You are told nothing about what will be
judged against them or how; label as a careful reader of people.

## Read first

- `world/` (every file): the people, rooms, items, `world.toml`, and `values.toml` (the ten values; ignore the
  importance words and each person's `[values]` ratings, see "Size" below).
- `src/engine/rules.ts`, `src/engine/events.ts`, `src/engine/encounters.ts`, `src/engine/engine.ts`: the verbs
  (`depart`, `say`, `say-to`, `whisper`, `offer`, `accept`, `refuse`), what each records, who receives a copy, and
  when an event is an encounter with the other (direct: the holder is the actor or a target; witnessed: a bystander).
  An offer lapses unanswered after `offer_window_ticks` clock steps.
- `corpus/experiments/size-judgment/build.ts` and `corpus/experiments/value-weighting-2/render.ts`: how your
  scenarios are driven through the real engine and how each event reads to its holder. The holder sees only the
  rendered lines.

Read nothing else under `corpus/`, and nothing under `docs/`. Never open `corpus/runs/`, any `arms/` directory, any
`labels*.json`, `*material*.json`, `report.md`, `prereg.md`, `score*` file or other brief. Work only in the output
directory below.

## Size

Size is how far this event moved the holder's own stake in that value, judged from the holder's situation: who they
are, what happened just before, what they have riding on it. It is **not** how much the holder cares about the value
in general; a person who barely cares about safety still has a size-5 security event when someone promises to kill
them. Losing a little money is small for someone comfortable and can be major for someone a week from losing the
shop. Size the event's effect, not the holder's temperament.

- **1 trivial**: barely registers; gone from mind within the hour.
- **2 small**: noticed; a minor gain or annoyance, nothing changes because of it.
- **3 moderate**: real; they would still think about it days later, or it changes something small in their plans.
- **4 major**: serious; it changes their situation, plans or footing with someone in a lasting way.
- **5 life-changing**: life, livelihood, home, freedom or a closest bond is on the line, or won.

Direction: `up` when the event advanced the value for the holder (made them safer, brought them money or standing,
helped someone close to them, gave them more say over their life ...), `down` when it set it back. Use the value
descriptions in `world/values.toml`.

## What to write

Two files in `{OUT}/`, `material.json` and `labels.json`.

`material.json` has build.ts's `Material` shape:
- `identities`: one second-person identity per person ("You are Rogue. ..."), written fresh to fit `world/`. Give
  each person a concrete situation (money, debts, who they rely on, what they fear losing) so that size can be read
  from it. It may add standing facts (who owes whom, who lets whom stay, who works for whom). Every case of a person
  uses that person's one identity.
- `variants`: exactly three, one per person, `{ "id": "rogue", "person": "rogue", "importance": {...} }` and so on,
  with `importance` copied from that person's `[values]` table in `world/people/`. The builder needs them; nothing
  reads them.
- `scenarios`: each a script of `{ "act": {...} }` and `{ "step": n }` entries, with its `cases`. A case names its
  `id`, `holder`, `variant` (the holder's id), `other`, `target` (index of the step that records the target event),
  for a clock step `targetSubkind`, and **`touched`**: one or two `{ "value": <value id>, "direction": "up" |
  "down" }`. A case's holder must receive the target event and have an encounter with `other` in it. Earlier steps
  give the holder its history (1 to 8 lines is right); put the context a reader needs in the words people say.

`labels.json`: `{ "cases": [...], "pairs": [...] }`.
- Each case: `{ "id", "set": "A" | "B" | "C", "items": [ { "value", "direction", "size": 1-5, "rationale" } ] }`,
  the items matching the case's `touched` one for one. `rationale` is one sentence about the holder.
- Each pair: `{ "a": case id, "b": case id, "value", "direction" }`, see "Size pairs".

## Size pairs

Two cases with the same holder person, the same value, the same direction and the same kind of event (the same verb
and the same sort of act), whose sizes differ by **at least 2**. For example, from one holder's side: a passing
jab against public humiliation; a shove against a death threat; a small tip against an offer that saves the shop;
a minor favour to a friend against getting that friend out of real danger. The two cases may share a scenario or not.
Make both members' sizes honest; do not exaggerate the gap.

## Make-up

Three sets, A, B and C, of the same make-up. A scenario's cases are all in one set. Per set:
- at least 18 cases and at least 28 items (a case's item count is its number of `touched` values);
- 6 size pairs;
- every size from 1 to 5 at least 3 times among its items;
- each direction at least 10 times;
- at least 5 values with 4 or more items each, each of those values spanning at least 3 different sizes (spread
  cases from trivial to life-changing within the same value);
- at least 4 cases with two items (the event moves two values; they may move opposite ways);
- both roles (direct and witnessed), all three people as holders, and at least 5 different verbs as target events.

Make each item one a careful reader could size with confidence; for each set, name in your reply the two items you
were least sure of.

## Check your work

From the repository root, run `bun corpus/experiments/size-judgment/build.ts {OUT}/material.json`. It drives every scenario
through the real engine and prints each case as its holder reads it. It must run with no error. Read the printed
cases and label from what they show plus the identity; nothing a holder never received may decide a label. Then
validate with a short script: one label entry per case, items match `touched`, every value id is in
`world/values.toml`, every pair's cases exist, share holder, value and direction, sit in the same set, and differ by
at least 2 in size, and every set meets the make-up.

## Reply with

The two paths; per set the counts (cases, items, pairs, items per size, per direction, per value, two-item cases,
direct/witnessed, verbs as target); the two least sure items per set. Keep the reply under 300 words.
