---
"@kubb/adapter-oas": major
"@kubb/ast": major
---

`@kubb/adapter-oas` no longer deduplicates schemas, and the `dedupe` option is removed. Every named schema in the spec becomes its own type, and inline shapes stay inline.

Earlier versions collapsed structurally identical schemas into one shared definition and hoisted repeated inline shapes under an invented name. That hoisting could collide with a generated operation type (a shared `{ error?: string }` 400 response became `PostV1WorkoutsStatus400`, the same name the response-status type uses), producing a self-referential `export type X = X` and duplicate exports. Output is now faithful to the spec: to share a shape, name it as a component and `$ref` it.

`@kubb/ast`: the dialect `dedupe` seam is now optional, so an adapter can omit it. The `signatureOf` and `isSchemaEqual` helpers are removed, since deduplication was their only consumer.
