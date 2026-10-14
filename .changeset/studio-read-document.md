---
"@kubb/studio": minor
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/cli": patch
---

Agents granted `--allow-read` keep the Kubb AST (`InputNode`) of each generation and return it through the new `readInput` call, so Kubb Studio can describe your API in the names Kubb generates. The permission prompt now mentions the parsed spec.

`InputMeta` gains `servers` and `securitySchemes`: every server and authentication scheme the spec declares. `@kubb/adapter-oas` fills both, also for Swagger 2.0 documents.
