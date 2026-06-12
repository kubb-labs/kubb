---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

Drop bundling artifacts like `Category1` from the schema stream instead of emitting alias models.

When a spec defines a schema and also references an external copy of it with the same name (for example `$ref: 'https://petstore3.swagger.io/api/v3/openapi.json#/components/schemas/Category'` next to a local `Category`), the ref bundler hoists the copy under a numeric suffix (`Category1`). The dedupe pass used to keep that entry as a named alias, so generators produced a junk `export type Category1 = Category` model and properties typed against `Category1`.

The dedupe pass now recognizes a suffixed top-level schema that is structurally identical to the schema it collided with, drops it from the stream, and points every ref back at the original name, so generated code uses `Category` directly again. Hand-named identical schemas (`Dog` next to `Cat`) still become named alias types, and a suffixed schema with a different shape is kept as its own type. `@kubb/ast` now exports the `DedupeCanonical` type alongside `DedupePlan`.
