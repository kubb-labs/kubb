---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---

Add a `dedupe` option to `adapterOas` that collapses structurally identical schemas and enums into a single shared definition.

OpenAPI specs repeat the same shape often, most often an inline enum (e.g. `['active', 'inactive']`) duplicated across many properties, or an identical object reused across schemas and operations. Each unique shape is now emitted once: duplicated inline shapes are hoisted into a named schema, and every other occurrence (including a structurally identical top-level component) becomes a `ref` to it. Equality is shape-only, so differences in documentation such as `description` or `example` do not block deduplication. Deduplication is on by default. Set `adapterOas({ dedupe: false })` to keep every occurrence inline and reproduce the previous output.

`@kubb/ast` gains the spec-agnostic primitives that power this: `schemaSignature` (a content hash of a schema's shape), `isSchemaEqual`, `buildDedupePlan`, and `applyDedupe`.
