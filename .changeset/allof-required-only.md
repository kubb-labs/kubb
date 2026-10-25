---
"@kubb/adapter-oas": patch
---

An `allOf` member that only lists `required` next to a `$ref` or properties no longer becomes `unknown`. The listed properties now keep their schema and stay required in the generated types, Zod schemas and fakers.
