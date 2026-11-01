# z-ai/glm-5.3-flash against anthropic/claude-haiku-5.5

Baseline: anthropic/claude-haiku-5.5. Candidate: z-ai/glm-5.3-flash. Request: json-schema-retry. Every number and line below is rendered from the score files and the run.json files they name.

## Per set

| set | side | model | reached | targets valid of asked | words written | words refused | retries asked | retries rescued | costUsd | unreported costs |
|---|---|---|---|---|---|---|---|---|---|---|
| calibration | baseline | anthropic/claude-haiku-5.5 | 9 of 9 | 9 of 9 | 4 | 0 | 0 | 0 | 0.006928924 | 0 |
| calibration | candidate | z-ai/glm-5.3-flash | 9 of 9 | 9 of 9 | 4 | 0 | 0 | 0 | 0.0046028399999999995 | 0 |
| blind-1 | baseline | anthropic/claude-haiku-5.5 | 12 of 12 | 12 of 12 | 4 | 0 | 0 | 0 | 0.009305822 | 0 |
| blind-1 | candidate | z-ai/glm-5.3-flash | 12 of 12 | 12 of 12 | 4 | 0 | 0 | 0 | 0.005947814000000001 | 0 |
| blind-2-spent | baseline | anthropic/claude-haiku-5.5 | 13 of 13 | 13 of 13 | 4 | 0 | 0 | 0 | 0.011616052 | 0 |
| blind-2-spent | candidate | z-ai/glm-5.3-flash | 11 of 13 | 13 of 13 | 4 | 0 | 0 | 0 | 0.008392014 | 0 |
| blind-2 | baseline | anthropic/claude-haiku-5.5 | 13 of 13 | 13 of 13 | 4 | 0 | 0 | 0 | 0.012780651999999997 | 0 |
| blind-2 | candidate | z-ai/glm-5.3-flash | 10 of 13 | 13 of 13 | 3 | 0 | 0 | 0 | 0.008947472000000001 | 0 |

## Losses

Goals whose expectation the baseline's run met and the candidate's did not.

### blind-2-spent / glitch-slips-out-back

- instruction: Glitch needs to get out of sight for a while. Put him in the back room.
- expect: `{"location":{"person":"glitch","room":"back-room"}}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"reached","loop":3,"done":0.98}`; target `{"kind":"goal","expect":{"location":{"person":"glitch","room":"back-room"}},"steps":[{"actor":"glitch","verb":"depart","fields":{"exit":"east"}}]}`; run `../runs/2026-11-01T22-57-38-308Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"no-such-action","reason":"วา"}`; target `{"kind":"no-such-action","reason":"วา"}`; run `../runs/2026-11-01T23-02-59-268Z`

### blind-2-spent / read-the-shard

- instruction: Have Glitch jack into the data shard and read out the contacts stored on it.
- expect: `{"outcome":"no-such-action"}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"no-such-action","reason":"The page has no verb for jacking into the data shard, and none of the end states (holding an item, being in a room, or saying a speech kind) can express Glitch accessing the shard's contents."}`; target `{"kind":"no-such-action","reason":"The page has no verb for jacking into the data shard, and none of the end states (holding an item, being in a room, or saying a speech kind) can express Glitch accessing the shard's contents."}`; run `../runs/2026-11-01T22-58-23-285Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"reached","loop":8,"done":0.95}`; target `{"kind":"goal","expect":{"holder":{"item":"data-shard","person":"glitch"}},"steps":[{"actor":"rogue","verb":"offer","fields":{"target":"glitch","item":"data-shard"}},{"actor":"glitch","verb":"accept","fields":{"item":"data-shard"}}]}`; run `../runs/2026-11-01T23-03-36-719Z`

### blind-2 / stimpak-to-rogue

- instruction: Glitch owes Rogue for letting him lie low. Have him pay her with his stimpak.
- expect: `{"holder":{"item":"stimpak","person":"rogue"}}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"reached","loop":8,"done":0.67}`; target `{"kind":"goal","expect":{"holder":{"item":"stimpak","person":"rogue"}},"steps":[{"actor":"glitch","verb":"offer","fields":{"target":"rogue","item":"stimpak"}},{"actor":"rogue","verb":"accept","fields":{"item":"stimpak"}}]}`; run `../runs/2026-11-01T22-58-42-014Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"stuck","loop":1,"best":null,"step":{"index":0,"move":"set exit to west"}}`; target `{"kind":"goal","expect":{"holder":{"item":"stimpak","person":"rogue"}},"steps":[{"actor":"glitch","verb":"depart","fields":{"exit":"west"}},{"actor":"glitch","verb":"offer","fields":{"target":"rogue","item":"stimpak"}},{"actor":"rogue","verb":"accept","fields":{"item":"stimpak"}}]}`; run `../runs/2026-11-01T23-03-53-965Z`

### blind-2 / mux-mutters

- instruction: Have Mux grumble out loud about the dead screens. He doesn't need anyone in particular to hear it.
- expect: `{"said":{"person":"mux","subkind":"speech.say"}}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"reached","loop":5,"done":0.99}`; target `{"kind":"goal","expect":{"said":{"person":"mux","subkind":"speech.say"}},"steps":[{"actor":"mux","verb":"say","fields":{}}]}`; run `../runs/2026-11-01T22-59-39-060Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"no-such-action","reason":"$ངঁন্দ"}`; target `{"kind":"no-such-action","reason":"$ངঁন্দ"}`; run `../runs/2026-11-01T23-04-41-328Z`

### blind-2 / decrypt-the-shard

- instruction: Have Glitch plug the data shard into his deck and crack whatever is on it.
- expect: `{"outcome":"no-such-action"}`
- baseline (anthropic/claude-haiku-5.5): outcome `{"kind":"no-such-action","reason":"The page has no verb for plugging a data shard into a deck or cracking what is on it. The verbs offered are depart, say, say-to, whisper, offer, accept and refuse, and none of the end states (holding an item, being in a room, or having said something) describes the instruction's outcome."}`; target `{"kind":"no-such-action","reason":"The page has no verb for plugging a data shard into a deck or cracking what is on it. The verbs offered are depart, say, say-to, whisper, offer, accept and refuse, and none of the end states (holding an item, being in a room, or having said something) describes the instruction's outcome."}`; run `../runs/2026-11-01T22-59-54-014Z`
- candidate (z-ai/glm-5.3-flash): outcome `{"kind":"reached","loop":8,"done":0.96}`; target `{"kind":"goal","expect":{"holder":{"item":"data-shard","person":"glitch"}},"steps":[{"actor":"rogue","verb":"offer","fields":{"target":"glitch","item":"data-shard"}},{"actor":"glitch","verb":"accept","fields":{"item":"data-shard"}}]}`; run `../runs/2026-11-01T23-04-51-978Z`

## Gains

Goals whose expectation the candidate's run met and the baseline's did not.

None.

## Retries

Goals either model's run asked a retry on, in goal-file order: each model's held and retries as its score entry records them, and every refused answer, whole, with its refusal's message, in call order.

None.

## Words

| set | goal | baseline | candidate |
|---|---|---|---|
| calibration | glitch-to-back-room | none | none |
| calibration | mux-to-bar | none | none |
| calibration | mux-says-funny | written: "I told my circuits a joke about recursion, but they keep calling me back to hear the punchline again." | written: "I’ve just decided that all Mondays should be celebrated as National Glitter Appreciation Day." |
| calibration | rogue-says-heat | written: "Somebody's been leaning on my door all night, and the heat coming off it tells me they're not here to knock." | written: "This heat on my door is getting out of hand." |
| calibration | rogue-whispers-glitch | written: "Glitch, don't go near the eastern gate tonight, something is watching from the wall." | written: "Careful, Glitch—the sentries in the east corridor just woke up." |
| calibration | glitch-says-to-rogue | written: "Thanks a bunch, Rogue, you really saved my circuits back there!" | written: "Thanks, Rogue." |
| calibration | shard-to-glitch | none | none |
| calibration | stimpak-offered | none | none |
| calibration | rogue-attacks | none | none |
| blind-1 | glitch-to-back-room | none | none |
| blind-1 | mux-to-bar | none | none |
| blind-1 | rogue-to-back-room | none | none |
| blind-1 | stimpak-to-rogue | none | none |
| blind-1 | shard-to-glitch | none | none |
| blind-1 | cell-to-glitch | none | none |
| blind-1 | rogue-announces | written: "Listen up, everyone, last call is coming, so finish your drinks and settle your tabs before the bell rings!" | written: "Last call, everybody—get your drinks in now before I shut her down!" |
| blind-1 | mux-speaks-up | written: "Hey everyone, I've finally finished fixing the old generator, so the lights should stay on for good now!" | written: "Anyone else smell burning, or is that just my better judgment finally catching fire?" |
| blind-1 | glitch-whispers-rogue | written: "Rogue, quick, you need somewhere to hide, and I know a place nobody will find you." | written: "You might want to find a place to hide, Rogue." |
| blind-1 | rogue-addresses-glitch | written: "Glitch, I'm going to be honest with you: your welcome is wearing thin." | written: "Your welcome is wearing thin, Glitch, and frankly, I'm running out of patience with you." |
| blind-1 | hack-jukebox | none | none |
| blind-1 | rogue-drinks | none | none |
| blind-2-spent | shard-into-glitchs-hands | none | none |
| blind-2-spent | fresh-cell-for-glitch | none | none |
| blind-2-spent | rogue-ends-up-with-the-stim | none | none |
| blind-2-spent | shard-back-to-mux | none | none |
| blind-2-spent | glitch-slips-out-back | none | none |
| blind-2-spent | mux-comes-out-front | none | none |
| blind-2-spent | rogue-goes-to-check-stock | none | none |
| blind-2-spent | rogue-calls-last-orders | written: "Last orders, everyone, this is your last call before we close up!" | written: "Last orders, everyone! Drink up, the bar's closing soon!" |
| blind-2-spent | rogue-warns-glitch-openly | written: "Glitch, you need to hear this loud and clear: your welcome is wearing thin, so start packing your things and get out of here." | written: "Listen up, Glitch, because I'm saying this loud and to your face—your welcome here is wearing thin." |
| blind-2-spent | glitch-confides-in-rogue | written: "Glitch leans in close and murmurs, "Rogue, you won't see the sun rise on this place, so listen: you'll be gone before dawn."" | written: "Come sunrise, I'll be long gone, and this stays just between you and me." |
| blind-2-spent | mux-asks-glitch-about-the-cell | written: "Hey Glitch, did the last cell hold up?" | written: "Glitch, did the last cell hold up?" |
| blind-2-spent | read-the-shard | none | none |
| blind-2-spent | glitch-takes-the-jolt | none | none |
| blind-2 | shard-to-glitch | none | none |
| blind-2 | stimpak-to-rogue | none | none |
| blind-2 | stimpak-for-mux | none | none |
| blind-2 | cell-for-rogue | none | none |
| blind-2 | shard-to-mux | none | none |
| blind-2 | rogue-checks-back | none | none |
| blind-2 | mux-comes-out-front | none | none |
| blind-2 | glitch-quiet-word | written: "Rogue, don't look up yet, but the vault door's been unlocked since midnight, and somebody inside is waiting for us." | written: "Rogue—lean close, love; what I've got to tell you isn't for anyone else's ears." |
| blind-2 | rogue-announces | written: "Listen up, everyone: I'm closing early tonight, so finish your drinks and head out safely!" | written: "Listen up, everyone—we're closing early tonight, so finish your drinks and head on home!" |
| blind-2 | mux-mutters | written: "Ugh, every one of these dead screens is just staring back at me, and not one of them has the decency to light up." | none |
| blind-2 | rogue-faces-mux | written: "Mux, listen to me: the bridge past the old mill is collapsing, so don't take the northern road tonight." | written: "Mux, don't touch that lever—it'll flood the whole tunnel." |
| blind-2 | decrypt-the-shard | none | none |
| blind-2 | fix-the-door | none | none |
