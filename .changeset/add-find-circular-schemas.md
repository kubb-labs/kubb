---
'@kubb/ast': minor
---

Added shared schema-graph helpers to `@kubb/ast` so plugins can stop reimplementing reference traversal and cycle detection:

- `resolveRefName(node)` — extracts the referenced schema name from a `ref` node (with sensible fallbacks).
- `collectReferencedSchemaNames(node)` — collects every schema name reachable via `ref` edges.
- `findCircularSchemas(schemas)` — returns the set of named schemas that participate in a reference cycle (direct self-loops or indirect cycles such as `Pet → Cat → Pet`).
- `containsCircularRef(node, { circularSchemas, excludeName? })` — checks whether a schema (or any nested node) references a circular schema, with optional self-name exclusion.
