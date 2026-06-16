---
"@kubb/plugin-ts": patch
---

Fix empty string enum values being dropped from generated TypeScript types.

OpenAPI enums containing `""` (empty string) were silently omitted from the emitted
TypeScript type in all enum modes (`asConst`, `asPascalConst`, `literal`, `inlineLiteral`,
`enum`, `constEnum`). The Zod plugin already handled empty strings correctly, causing a
mismatch and a broken cast (`as unknown as z.ZodType<...>`).

Root cause: three truthiness guards (`if (value)` / `if (key)`) in
`createEnumDeclaration` treated `''` as falsy. Replaced all three with explicit
`!== null && !== undefined` checks.
