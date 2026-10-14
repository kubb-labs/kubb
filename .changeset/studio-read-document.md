---
"@kubb/studio": minor
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/cli": patch
---

Agents keep the Kubb AST (`InputNode`) of each generation and return it through the new `readInput` call, so Kubb Studio can describe your API in the names Kubb generates. Like `readFiles`, it is refused unless the agent was granted `--allow-read`, and the permission prompt now mentions the parsed spec.

`InputMeta` gains `servers` and `securitySchemes`: every server and authentication scheme the spec declares. `@kubb/adapter-oas` fills both, also for Swagger 2.0 documents.
