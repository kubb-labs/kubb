---
"@kubb/adapter-oas": minor
---

`dedupe` now only collapses schemas the spec already names, and is always on. The `dedupe` option is removed.

Previously dedupe also hoisted anonymous inline shapes into a new shared type under an invented name. For an operation body that name (`<operation>Status<code>`, e.g. a shared `{ error?: string }` 400 response → `PostV1WorkoutsStatus400`) collided with the response-status type the generators emit for that operation, producing a self-referential `export type X = X` and duplicate barrel exports across the type, zod, and faker output.

Now an inline shape is only collapsed when it matches a named top-level component; otherwise it stays inline. Duplicate named components still collapse into one shared type. To share a repeated inline shape, name it as a component in the spec and `$ref` it.
