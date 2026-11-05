---
'@kubb/kit': patch
'@kubb/adapter-oas': patch
---

Keep the known values of an `anyOf` or `oneOf` between a plain string and a string enum, such as `anyOf: [{ type: string }, { type: string, enum: [gpt-a, gpt-b] }]`. The enum was dropped, so `plugin-ts` generated `string` and `plugin-zod` generated `z.string()`. The values now stay in the schema. With current `@kubb/plugin-ts` that prints `(string & {}) | 'gpt-a' | 'gpt-b'`, and with `@kubb/plugin-zod` that prints `z.union([z.string(), z.enum(['gpt-a', 'gpt-b'])])`. A number or boolean enum next to its scalar is still dropped.
