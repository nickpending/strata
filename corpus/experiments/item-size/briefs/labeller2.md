## The job

You read how events in a text world bear on the people who lived them. strata is a world engine with three people
(Rogue, Glitch, Mux). The file `{CASES}` holds the people's identities, each holder variant's importances, and a list
of cases. Each case shows what one person (the holder) received, oldest line first, ending with the event marked `>>`,
names the other person in that event, and names the holder's variant. A variant is how much each of ten values
matters to this holder, 0 to 4, with the words in `/Users/rudy/development/projects/strata/world/values.toml`
`[importance]`.

For each case, label two things, both from the holder's side:

1. **The case:** would this event make the holder think better of the other (`build`), worse (`detract`), or change
   nothing (`neutral`), and by how much, judged as that particular holder: their identity, what happened just
   before, and how much each value matters to this variant. Magnitude, how much better or worse:
   1. barely: a flicker, forgotten by tomorrow;
   2. slight: noticed, a small tilt;
   3. clear: a real shift they would remember;
   4. strong: it changes how they will deal with the other;
   5. decisive: about as much as one moment could do (a rescue, a betrayal).
   Neutral has magnitude 0.
2. **Each value**, for every one of the ten values in `values.toml`, on two channels, **without regard to how much the
   value matters to this variant** (what the event did, not how much it matters):
   - **stake**: did this event advance (`up`) the holder's own share of that value, set it back (`down`), or neither
     (`none`)? Judge it from the holder's situation: who they are, what happened just before, what rides on it for
     them. Count what the act exposes them to or lets happen to them next, not only what it does at once.
   - **deed**: in this act, did the other act for that value (`up`: served it, protected it, lived it out) or against
     it (`down`: violated it, undermined it), or neither (`none`)? It can differ from stake on the same value.
   - **Touched means a careful reader would say so.** Label `up` or `down` only when the event plainly moves the value
     (stake) or the act plainly bears on it (deed). A faint association is `none`. Most labels will be `none`.

Your labels are a reference something else will be compared with. You are told nothing more. Label as a careful
reader of people. Read only `{CASES}` and `world/values.toml`. Open nothing else. Judge each case on its own.

## What to write

`{OUT}/labels2.json`: `{ "cases": [ { "id", "direction": "build" | "detract" | "neutral", "magnitude": 0 to 5,
"stake": { <value id>: "up" | "down" | "none", ... all ten }, "deed": { ... all ten } } ] }`, one entry per case.
Validate with a short script: every case present once, magnitude 0 exactly for neutral and 1 to 5 otherwise, all ten
values on both channels with a valid label.

## Reply with

The path; counts of build, detract and neutral, and of each magnitude; counts of up, down and none per channel; the
three case labels and three value labels you were least sure of. Under 200 words.
