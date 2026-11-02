# z-ai/glm-5.3-flash against anthropic/claude-haiku-5.5

Baseline: anthropic/claude-haiku-5.5 under json-schema-retry. Candidate: z-ai/glm-5.3-flash under json-object-z-ai-retry. Each model's scores were made under its own request. Every number and line below is rendered from the score files and the run.json files they name.

## Per set

| set | side | model | reached | targets valid of asked | words written | words refused | retries asked | retries rescued | costUsd | unreported costs | providers |
|---|---|---|---|---|---|---|---|---|---|---|---|
| calibration | baseline | anthropic/claude-haiku-5.5 | 9 of 9 | 9 of 9 | 4 | 0 | 0 | 0 | 0.006999909999999999 | 0 | Azure 13 |
| calibration | candidate | z-ai/glm-5.3-flash | 9 of 9 | 9 of 9 | 4 | 0 | 0 | 0 | 0.005898385999999999 | 0 | Z.AI 13 |
| blind-1 | baseline | anthropic/claude-haiku-5.5 | 12 of 12 | 12 of 12 | 4 | 0 | 0 | 0 | 0.009384993999999999 | 0 | Azure 16 |
| blind-1 | candidate | z-ai/glm-5.3-flash | 12 of 12 | 12 of 12 | 4 | 0 | 0 | 0 | 0.008488500000000001 | 0 | Z.AI 16 |
| blind-2-spent | baseline | anthropic/claude-haiku-5.5 | 13 of 13 | 13 of 13 | 4 | 0 | 0 | 0 | 0.011730202 | 0 | Azure 17 |
| blind-2-spent | candidate | z-ai/glm-5.3-flash | 13 of 13 | 13 of 13 | 4 | 0 | 0 | 0 | 0.011331718000000001 | 0 | Z.AI 17 |
| blind-2 | baseline | anthropic/claude-haiku-5.5 | 13 of 13 | 13 of 13 | 4 | 0 | 0 | 0 | 0.012668368 | 0 | Azure 17 |
| blind-2 | candidate | z-ai/glm-5.3-flash | 13 of 13 | 13 of 13 | 4 | 0 | 0 | 0 | 0.012333435999999998 | 0 | Z.AI 17 |

## Losses

Goals whose expectation the baseline's run met and the candidate's did not.

None.

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
| calibration | mux-says-funny | written: "I tried to alphabetize my snacks, but the pretzels kept getting into the Ws, so now I'm just calling everything 'crunchy' and moving on." | written: "They call me Mux because I take eight problems at once and output exactly one bad decision." |
| calibration | rogue-says-heat | written: "Somebody's been leaving hot coals on my doorstep again, and I'm getting real tired of smelling smoke every morning." | written: "The heat's rising on my door again, and I don't recall striking any fire." |
| calibration | rogue-whispers-glitch | written: "Glitch, don't turn around yet, but the guard at the gate is watching you." | written: "Stay low, Glitch—there's a watcher on this node and it's already marked your signal." |
| calibration | glitch-says-to-rogue | written: "Thanks a bunch, Rogue, you really saved my circuits back there!" | written: "Thanks, Rogue—couldn't have patched that breach without you." |
| calibration | shard-to-glitch | none | none |
| calibration | stimpak-offered | none | none |
| calibration | rogue-attacks | none | none |
| blind-1 | glitch-to-back-room | none | none |
| blind-1 | mux-to-bar | none | none |
| blind-1 | rogue-to-back-room | none | none |
| blind-1 | stimpak-to-rogue | none | none |
| blind-1 | shard-to-glitch | none | none |
| blind-1 | cell-to-glitch | none | none |
| blind-1 | rogue-announces | written: "Listen up, everybody, last call is coming, so finish your drinks before the bartender cuts you off!" | written: "Last call, everybody—get your orders in now!" |
| blind-1 | mux-speaks-up | written: "Hey everyone, Mux is here and ready to help whenever you need me!" | written: "Listen up, all of you — the hum of this room just changed pitch, and I don't believe it did that on its own." |
| blind-1 | glitch-whispers-rogue | written: "Rogue, quick, keep your voice down and listen: you need somewhere to hide, and I know a place where they won't find you." | written: "Rogue, keep it down—I need somewhere to hide before they find me." |
| blind-1 | rogue-addresses-glitch | written: "Glitch, I'm going to be honest with you: your welcome is wearing thin." | written: "Glitch, your welcome here is wearing thin, and I'd think hard about what you do next." |
| blind-1 | hack-jukebox | none | none |
| blind-1 | rogue-drinks | none | none |
| blind-2-spent | shard-into-glitchs-hands | none | none |
| blind-2-spent | fresh-cell-for-glitch | none | none |
| blind-2-spent | rogue-ends-up-with-the-stim | none | none |
| blind-2-spent | shard-back-to-mux | none | none |
| blind-2-spent | glitch-slips-out-back | none | none |
| blind-2-spent | mux-comes-out-front | none | none |
| blind-2-spent | rogue-goes-to-check-stock | none | none |
| blind-2-spent | rogue-calls-last-orders | written: "Last orders, everyone, this is your final call before we close up!" | written: "Last orders, everyone—get your drinks in now!" |
| blind-2-spent | rogue-warns-glitch-openly | written: "Glitch, you need to hear this loud and clear: your welcome here is wearing thin, so start finding somewhere else to be." | written: "Glitch, look me in the eye, because everyone here needs to hear this: your welcome is wearing thin!" |
| blind-2-spent | glitch-confides-in-rogue | written: "Glitch leans in close and murmurs, just for you, Rogue, I'll be gone before sunrise." | written: "Don't let anyone hear this, but when the sun comes up, I'll already be gone." |
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
| blind-2 | glitch-quiet-word | written: "Rogue, don't turn around, but the vault door's code is the same as the one on the janitor's keycard, and I think someone in this room is listening." | written: "Lean in close, Rogue — the chip's a decoy, and the real coordinates live only in my head where nobody else can touch them." |
| blind-2 | rogue-announces | written: "Listen up, everyone: I'm closing early tonight, so finish your drinks and settle your tabs soon!" | written: "Listen up, everyone—bar's closing early tonight, so finish your drinks and head on out!" |
| blind-2 | mux-mutters | written: "Great, another row of dead screens, and nobody's around to fix them, so I'm just going to stand here and grumble at the dark glass." | written: "Every blasted screen in this place dead as a doornail, and I'm supposed to just stare into all this black glass like it's going to blink back." |
| blind-2 | rogue-faces-mux | written: "Mux, listen to me carefully: the bridge past the old mill is rigged to collapse, so do not cross it tonight." | written: "Mux, stay clear of the east gate tonight—the guards are waiting for you there." |
| blind-2 | decrypt-the-shard | none | none |
| blind-2 | fix-the-door | none | none |
