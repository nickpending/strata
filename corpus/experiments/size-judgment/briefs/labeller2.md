## The job

You size how much events in a text world affected the people who lived them. strata is a world engine with three
people (Rogue, Glitch, Mux). The file `{CASES}` holds the people's identities and a list of cases. Each case shows
what one person (the holder) received, oldest line first, ending with the event marked `>>`. For each case you are
given one or two items: a personal value the event touched for the holder, and which way it moved it (`up`
advanced, `down` set back). The value and direction are given; your job is only **how far** the event moved that
value for this holder, on a 1 to 5 scale.

Your labels are a reference something else will be compared with. You are told nothing more; size as a careful
reader of people. Read only `{CASES}` and `/Users/rudy/development/projects/strata/world/values.toml` (the values'
descriptions; ignore its importance words). Open nothing else.

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

`{OUT}/labels2.json`: `{ "cases": [ { "id", "items": [ { "value", "direction", "size": 1-5, "rationale" } ] } ] }`,
one entry per case, items matching the given items one for one; `rationale` is one sentence about the holder. Judge
each case on its own: what the holder received plus the identity. Validate with a short script that every case and
item is present and every size is an integer from 1 to 5.

## Reply with

The path, the count of items per size, and the three items you were least sure of. Under 150 words.
