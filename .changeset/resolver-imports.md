---
"@kubb/core": minor
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/kit": minor
---

Move import resolution from the adapter to the resolver: `adapter.getImports` is replaced by `resolver.imports`.

`resolver.imports({ node, meta, root, output, group })` builds one import entry per `$ref` in a schema tree, resolving names and paths through the resolver's own `name` and `file` conventions. A per-call `name` callback overrides the imported identifier, for example to point enum refs at a suffixed type name.

The adapter now records its collision renames in `meta.nameMapping` (raw ref pointer to emitted schema name) instead of exposing a `getImports` hook, so custom adapters only implement `parse` and `validate`.
