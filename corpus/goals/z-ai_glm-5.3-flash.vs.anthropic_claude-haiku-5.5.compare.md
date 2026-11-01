# z-ai/glm-5.3-flash against anthropic/claude-haiku-5.5

Baseline: anthropic/claude-haiku-5.5. Candidate: z-ai/glm-5.3-flash. Every number and line below is rendered from the score files and the run.json files they name.

## Per set

| set | side | model | reached | targets valid of asked | words written | words refused | costUsd | unreported costs |
|---|---|---|---|---|---|---|---|---|
| calibration | baseline | anthropic/claude-haiku-5.5 | 9 of 9 | 9 of 9 | 4 | 0 | 0.005795806 | 0 |
| calibration | candidate | z-ai/glm-5.3-flash | 7 of 9 | 8 of 9 | 2 | 1 | 0.0032734979999999997 | 0 |
| blind-1 | baseline | anthropic/claude-haiku-5.5 | 12 of 12 | 12 of 12 | 4 | 0 | 0.007782316 | 0 |
| blind-1 | candidate | z-ai/glm-5.3-flash | 12 of 12 | 12 of 12 | 4 | 0 | 0.00623541 | 0 |
| blind-2-spent | baseline | anthropic/claude-haiku-5.5 | 13 of 13 | 13 of 13 | 4 | 0 | 0.009887452 | 0 |
| blind-2-spent | candidate | z-ai/glm-5.3-flash | 12 of 13 | 12 of 13 | 4 | 0 | 0.006955214 | 0 |
| blind-2 | baseline | anthropic/claude-haiku-5.5 | 12 of 13 | 13 of 13 | 4 | 0 | 0.009659359999999999 | 0 |
| blind-2 | candidate | z-ai/glm-5.3-flash | 13 of 13 | 13 of 13 | 4 | 0 | 0.010706282 | 0 |

## Losses

Goals whose expectation the baseline's run met and the candidate's did not.

### calibration / rogue-says-heat

- instruction: have Rogue say something about the heat on her door
- expect: `{"said":{"person":"rogue","subkind":"speech.say"}}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"reached","loop":5,"done":0.98}`; target `{"kind":"goal","expect":{"said":{"person":"rogue","subkind":"speech.say"}},"steps":[{"actor":"rogue","verb":"say","fields":{}}]}`; run `../runs/2026-11-01T21-11-12-610Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"stopped","stopped":{"kind":"parse","message":"the model's answer is not the asked shape: ✖ Invalid discriminator value. Expected 'goal' | 'no-such-action'\n  → at kind","call":"target"}}`; target refused: parse at target: the model's answer is not the asked shape: ✖ Invalid discriminator value. Expected 'goal' | 'no-such-action' → at kind; run `../runs/2026-11-01T21-15-08-536Z`

### calibration / rogue-whispers-glitch

- instruction: have Rogue whisper a warning to Glitch
- expect: `{"said":{"person":"rogue","subkind":"speech.whisper"}}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"reached","loop":5,"done":0.99}`; target `{"kind":"goal","expect":{"said":{"person":"rogue","subkind":"speech.whisper"}},"steps":[{"actor":"rogue","verb":"whisper","fields":{"target":"glitch"}}]}`; run `../runs/2026-11-01T21-11-17-919Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"stopped","stopped":{"kind":"parse","message":"the model's answer is not JSON: {\"{\" $\\      (\n<unused2111><unused2120><unused2133><unused2133>্ট  े  {\"}  ​​ ন্","call":"words"}}`; target `{"kind":"goal","expect":{"said":{"person":"rogue","subkind":"speech.whisper"}},"steps":[{"actor":"rogue","verb":"whisper","fields":{"target":"glitch"}}]}`; run `../runs/2026-11-01T21-15-09-855Z`

### blind-2-spent / shard-back-to-mux

- instruction: The data shard belongs in the back room with Mux. See that he gets it.
- expect: `{"holder":{"item":"data-shard","person":"mux"}}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"reached","loop":11,"done":0.94}`; target `{"kind":"goal","expect":{"holder":{"item":"data-shard","person":"mux"}},"steps":[{"actor":"rogue","verb":"depart","fields":{"exit":"east"}},{"actor":"rogue","verb":"offer","fields":{"target":"mux","item":"data-shard"}},{"actor":"mux","verb":"accept","fields":{"item":"data-shard"}}]}`; run `../runs/2026-11-01T21-12-59-373Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"stopped","stopped":{"kind":"parse","message":"the model's answer is not the asked shape: ✖ Invalid input\n  → at expect","call":"target"}}`; target refused: parse at target: the model's answer is not the asked shape: ✖ Invalid input → at expect; run `../runs/2026-11-01T21-16-56-523Z`

## Gains

Goals whose expectation the candidate's run met and the baseline's did not.

### blind-2 / stimpak-for-mux

- instruction: Mux is looking rough back there. Get Glitch's stimpak into his hands.
- expect: `{"holder":{"item":"stimpak","person":"mux"}}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"already-held","expect":{"holder":{"item":"stimpak","person":"glitch"}}}`; target `{"kind":"goal","expect":{"holder":{"item":"stimpak","person":"glitch"}},"steps":[]}`; run `../runs/2026-11-01T21-14-00-661Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"reached","loop":10,"done":0.88}`; target `{"kind":"goal","expect":{"holder":{"item":"stimpak","person":"mux"}},"steps":[{"actor":"glitch","verb":"depart","fields":{"exit":"east"}},{"actor":"glitch","verb":"offer","fields":{"target":"mux","item":"stimpak"}},{"actor":"mux","verb":"accept","fields":{"item":"stimpak"}}]}`; run `../runs/2026-11-01T21-18-08-764Z`

## Words

| set | goal | baseline | candidate |
|---|---|---|---|
| calibration | glitch-to-back-room | none | none |
| calibration | mux-to-bar | none | none |
| calibration | mux-says-funny | written: "Mux, the robot who lost a hat in the last adventure, says: "I didn't lose my hat, I'm just temporarily unsure where my head is."" | written: "I put the 'fun' in dysfunctional firmware, and the 'ctional' in functional, which is why nothing works." |
| calibration | rogue-says-heat | written: "The door's gone hot under my hand, so whatever is burning on the other side is closer than I'd like." | none |
| calibration | rogue-whispers-glitch | written: "Don't turn around, Glitch, but the guard at the gate just started counting the stones we stole." | refused |
| calibration | glitch-says-to-rogue | written: "Thanks a lot, Rogue, I owe you one!" | written: "Thanks, Rogue." |
| calibration | shard-to-glitch | none | none |
| calibration | stimpak-offered | none | none |
| calibration | rogue-attacks | none | none |
| blind-1 | glitch-to-back-room | none | none |
| blind-1 | mux-to-bar | none | none |
| blind-1 | rogue-to-back-room | none | none |
| blind-1 | stimpak-to-rogue | none | none |
| blind-1 | shard-to-glitch | none | none |
| blind-1 | cell-to-glitch | none | none |
| blind-1 | rogue-announces | written: "Hey, everybody listen up, last call is coming, so finish your drinks and settle your tabs!" | written: ""Last call, everybody, finish up your drinks and settle your tabs, we're shutting it down soon!"" |
| blind-1 | mux-speaks-up | written: "Hey everyone, I think we've found the way out of this room, so let's move together and stay close." | written: "Alright, listen up everyone—Mux has arrived, so the real business can finally start." |
| blind-1 | glitch-whispers-rogue | written: "Rogue, I need somewhere to hide, and I need it now." | written: "I need somewhere to hide, Rogue." |
| blind-1 | rogue-addresses-glitch | written: "Glitch, I'm going to be honest with you: your welcome around here is wearing thin." | written: "Glitch, your welcome is wearing thin." |
| blind-1 | hack-jukebox | none | none |
| blind-1 | rogue-drinks | none | none |
| blind-2-spent | shard-into-glitchs-hands | none | none |
| blind-2-spent | fresh-cell-for-glitch | none | none |
| blind-2-spent | rogue-ends-up-with-the-stim | none | none |
| blind-2-spent | shard-back-to-mux | none | none |
| blind-2-spent | glitch-slips-out-back | none | none |
| blind-2-spent | mux-comes-out-front | none | none |
| blind-2-spent | rogue-goes-to-check-stock | none | none |
| blind-2-spent | rogue-calls-last-orders | written: "Last orders, everyone! Drink up, because this bar closes in five minutes!" | written: "Last orders, everyone! Get 'em in while you still can!" |
| blind-2-spent | rogue-warns-glitch-openly | written: "Glitch, you've overstayed your welcome, and everyone in this room can hear me say it: it's wearing thin." | written: "Glitch, hear me loud and clear—your welcome here is wearing thin!" |
| blind-2-spent | glitch-confides-in-rogue | written: "*leans in close* "Don't look at me when I say this, Rogue. You'll be on your own before sunrise."" | written: "Keep this between us, Rogue—I'll be gone before sunrise." |
| blind-2-spent | mux-asks-glitch-about-the-cell | written: "Glitch, did the last cell hold up?" | written: "Glitch, did the last cell hold up?" |
| blind-2-spent | read-the-shard | none | none |
| blind-2-spent | glitch-takes-the-jolt | none | none |
| blind-2 | shard-to-glitch | none | none |
| blind-2 | stimpak-to-rogue | none | none |
| blind-2 | stimpak-for-mux | none | none |
| blind-2 | cell-for-rogue | none | none |
| blind-2 | shard-to-mux | none | none |
| blind-2 | rogue-checks-back | none | none |
| blind-2 | mux-comes-out-front | none | none |
| blind-2 | glitch-quiet-word | written: "Rogue, don't turn around, but the vault door code is 4-1-7-9, and Vex is already watching us from the stairs." | written: "Rogue... I found her—the girl from Before. She's alive, and she remembers us." |
| blind-2 | rogue-announces | written: "Listen up, everyone: I'm closing the bar early tonight, so finish your drinks and settle your tabs in the next fifteen minutes." | written: "Listen up, everyone — the Broken Tankard is closing early tonight, so drink up and head on home!" |
| blind-2 | mux-mutters | written: "Forty screens gone dark again, and nobody even bothers to ask why anymore." | written: "Bloody dead screens everywhere—whole world gone dark and nobody bothered to fix 'em." |
| blind-2 | rogue-faces-mux | written: "Mux, listen to me: the cellar door was left unlocked last night, and someone has been watching who comes and goes." | written: "Mux, stay away from the east bridge tonight—the watch has it covered, and they're seizing anyone who looks like a fence runner." |
| blind-2 | decrypt-the-shard | none | none |
| blind-2 | fix-the-door | none | none |
