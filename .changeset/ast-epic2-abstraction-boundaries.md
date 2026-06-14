---
"@kubb/ast": minor
"@kubb/adapter-oas": patch
---

Clarify the `@kubb/ast` abstraction boundaries. No runtime behavior changes.

`dedupe.ts` and `utils/fileMerge.ts` each gained a header that explains the split. `dedupe.ts` collapses duplicate schema shapes by structural signature, while `fileMerge.ts` merges one file's imports, exports, and sources.

`syncSchemaRef` now lives in `transformers.ts` next to the other `SchemaNode` transforms. It is still exported from `@kubb/ast/utils`, so its import path is unchanged.

`createOperationParams` is no longer surfaced through the `factory` namespace. It is a high-level builder, not a `ts.factory` primitive, so import it from `@kubb/ast/utils` instead of `ast.factory`.

The OpenAPI discriminator helpers `createDiscriminantNode` and `findDiscriminator` moved out of `@kubb/ast` into `@kubb/adapter-oas`, since the OAS adapter was their only consumer. This keeps `@kubb/ast` spec-agnostic.
