---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
---

Promote the schema dialect to `@kubb/ast` as a first-class, spec-agnostic contract: add a generic, guard-preserving `SchemaDialect<TSchema, TRef, TDiscriminated, TDocument>` type and a `defineSchemaDialect` helper, alongside `dispatch`. `@kubb/adapter-oas` now builds `oasDialect` with `ast.defineSchemaDialect`, so the JSON-Schema-family seam (nullability, `$ref`, discriminator, binary, ref resolution) is shared across adapters. An AsyncAPI adapter supplies its own dialect and reuses the converter pipeline and dispatch rules. No change to generated output.
