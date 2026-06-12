---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

Repoint refs at duplicate top-level schemas to the first schema with the same content.

When a spec defines a schema and also references an external copy of it (for example `$ref: 'https://petstore3.swagger.io/api/v3/openapi.json#/components/schemas/Category'` next to a local `Category`), the ref bundler hoists the copy under a numeric suffix (`Category1`) and rewrites the ref sites to it, so generators typed properties against `Category1` instead of `Category`.

`buildDedupePlan` now records every later top-level schema whose content matches an earlier one in a new `aliasNames` map, `applyDedupe` repoints any ref targeting such a duplicate at the first schema with that content, and the adapter stream no longer emits the duplicate at all. The decision is purely content-based (structural signature), not name-based: `Pet.category` is typed `Category` again, no dead `Category1` model is generated, and a schema with a different shape keeps its own type. This also applies to hand-written schemas that share one content (a `Dog` identical to `Cat` collapses into `Cat`). `applyDedupe` now takes the plan lookups (`{ canonicalBySignature, aliasNames }`) instead of the bare signature map, and `@kubb/ast` exports the `DedupeCanonical` and `DedupeLookups` types.
