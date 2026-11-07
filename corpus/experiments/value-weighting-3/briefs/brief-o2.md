You are the author of arm **O2: code applies importance.**

## What makes it O2 (hard rules, checked against your code before the freeze)
- Jev never sees an importance, as a number or a word; the contract's `ask` receives none. Only `score`, which is code, reads the holder's importances.
- Composite scoring (TypeSafe's composite-scoring pattern): per value, a gate (did this encounter touch this value for the holder at all), a direction (advanced or set back), and a strength, each asked as the question type that fits. Strength is used only as a bucket (most probable level) or against a threshold, never interpolated. Code multiplies each value's signed contribution by the holder's importance and combines.
- The starting candidate: a noul gate, a noul or a choice for direction (advanced versus set back), a score bucket for strength. Reverie's touches-plus-change nouls are the precedent to beat. Chaining is allowed, such as a gate request first and direction and strength only for values that pass it.

## What both arms must keep
Interpretation reduced to direct, literal questions about what is visible in the event from the holder's side (rules 2 and 3); a small named JSON state per request holding only the fields its questions need, the instructions naming the fields (rule 7); answers used as typed (rule 6: a score by its most probable level or against a threshold, a choice by its pick or one option's probability against a threshold, never an expectation as a magnitude).
