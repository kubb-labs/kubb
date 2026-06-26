---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
---
Generate dedicated `*Request`/`*Response` schema variants for `readOnly`/`writeOnly` properties.

When a schema has `readOnly` or `writeOnly` properties anywhere in its tree, `@kubb/adapter-oas` now emits separate named variants: a `*Request` shape that drops `readOnly` properties (server-set fields a client may not send) and a `*Response` shape that drops `writeOnly` properties (request-only fields a server never returns). Operations point their request body at the `*Request` variant and their responses at the `*Response` variant, and nested `$ref`s are rewired to the matching variant.

Filtering happens at schema-construction time rather than through a top-level `Omit<Type, Keys>` / `.omit({ ... })`, so it now works recursively through nested objects, arrays, and composed (`allOf`) schemas. A `readOnly` field on a nested object, for example, is correctly excluded from request types. The `keysToOmit` field on `ContentNode` is removed in favor of the variant schemas. New `@kubb/ast` utilities (`buildSchemaVariant`, `computeVariantNames`, `variantName`, `analyzeSchemaForVariants`) implement the construction-time filtering.
