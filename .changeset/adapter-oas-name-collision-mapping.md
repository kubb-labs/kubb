---
'@kubb/adapter-oas': patch
---

Resolve imports to the renamed target when a component name collides.

When two components share a name across sections or by case (e.g. `#/components/schemas/Order` and `#/components/requestBodies/Order`), `getSchemas` disambiguates them (`OrderSchema`, `OrderRequest`) and records the rename in a `nameMapping` keyed by the full `$ref` path. `getImports` looked the map up by the short ref name, always missed, and emitted an import for the un-disambiguated name — a dangling import that did not match the generated file.

`getImports` now resolves the collision-renamed name via `nameMapping.get(schemaRef.ref)` before falling back to the short ref name, so the import targets the file that was actually generated. The map is already exposed on `adapter.options.nameMapping` for plugins that resolve a reference's type/schema name through it.
