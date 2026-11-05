---
'@kubb/kit': patch
---

Keep the enum values in a union of a plain scalar and an enum, such as `anyOf: [{ type: string }, { type: string, enum: [gpt-a, gpt-b] }]`. Before, the enum was dropped and the union generated as plain `string` or `z.string()`. With `@kubb/plugin-ts` and `@kubb/plugin-zod` it now generates `(string & {}) | 'gpt-a' | 'gpt-b'` and `z.union([z.string(), z.enum(['gpt-a', 'gpt-b'])])`.
