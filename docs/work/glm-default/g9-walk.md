# G9 driver walk, on main at ed6509d, 2026-11-02T04:34:48Z

The checkout's absolute path is shown as <checkout> (redact).

```
$ bun run compare --baseline anthropic/claude-haiku-5.5 --candidate z-ai/glm-5.3-flash --goals corpus/experiments/glm-default/calibration.json --goals corpus/experiments/glm-default/blind-1.json --goals corpus/experiments/glm-default/blind-2-spent.json --goals corpus/experiments/glm-default/blind-2.json
$ bun run src/adapter/compare.ts --baseline "anthropic/claude-haiku-5.5" --candidate "z-ai/glm-5.3-flash" --goals corpus/experiments/glm-default/calibration.json --goals "corpus/experiments/glm-default/blind-1.json" --goals "corpus/experiments/glm-default/blind-2-spent.json" --goals "corpus/experiments/glm-default/blind-2.json"
compare written to <checkout>/corpus/experiments/glm-default/z-ai_glm-5.3-flash.json-object-z-ai-retry.vs.anthropic_claude-haiku-5.5.json-schema-retry.compare.json and <checkout>/corpus/experiments/glm-default/z-ai_glm-5.3-flash.json-object-z-ai-retry.vs.anthropic_claude-haiku-5.5.json-schema-retry.compare.md
exit: 0

$ git status --short corpus/experiments/glm-default corpus/goals
(end of status)
$ git diff --stat corpus/experiments/glm-default corpus/goals
(end of diff)
```
