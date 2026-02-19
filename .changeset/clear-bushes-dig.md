---
"@kubb/plugin-zod": minor
---

Add a new `guidType` option to control how OpenAPI `format: uuid` is generated in Zod schemas.

- `guidType` accepts `'uuid'` and `'guid'`
- default is `'uuid'`
- `'guid'` is only applied when `version: '4'` (v3 falls back to UUID generation)
