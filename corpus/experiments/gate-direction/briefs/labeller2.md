## The job

You read how events in a text world bear on the people who lived them. strata is a world engine with three people
(Rogue, Glitch, Mux). The file `{CASES}` holds the people's identities and a list of cases. Each case shows what one
person (the holder) received, oldest line first, ending with the event marked `>>`, and names the other person in
that event. For each case and for **every one of the ten values** in
`/Users/rudy/development/projects/strata/world/values.toml`, label two things from the holder's side:

- **stake**: did this event advance (`up`) the holder's own share of that value, set it back (`down`), or neither
  (`none`)?
- **deed**: in this act, did the other act for that value (`up`: served it, protected it, lived it out) or against
  it (`down`: violated it, undermined it), or neither (`none`)?

Your labels are a reference something else will be compared with. You are told nothing more. Label as a careful
reader of people. Read only `{CASES}` and `world/values.toml` (the values' descriptions; ignore its importance words).
Open nothing else.

## How to label

- **Touched means a careful reader would say so.** Label `up` or `down` only when the event plainly moves the value
  for this holder (stake) or the act plainly bears on it (deed). A faint association is `none`. Most labels will be
  `none`.
- **Stake is judged from the holder's situation**: who they are, what happened just before, what rides on it for
  them. Count what the act exposes the holder to or lets happen to them next, not only what it does at once.
- **Deed is about the other's act**, read from where the holder stands. It can differ from stake on the same value.

## What to write

`{OUT}/labels2.json`: `{ "cases": [ { "id", "stake": { <value id>: "up" | "down" | "none", ... all ten }, "deed":
{ ... all ten } } ] }`, one entry per case. Judge each case on its own. Validate with a short script that every case
has all ten values on both channels with a valid label.

## Reply with

The path, the counts of up, down and none per channel, and the three labels you were least sure of. Under 150 words.
