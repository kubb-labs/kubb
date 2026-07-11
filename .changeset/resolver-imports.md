---
"@kubb/core": minor
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/kit": minor
---

Move import resolution from the adapter to the resolver: `resolver.imports` replaces `adapter.getImports`, and ref nodes carry their target's emitted name.

`resolver.imports({ node, root, output, group })` builds one import entry per `$ref` in a schema tree, resolving names and paths through the resolver's own `name` and `file` conventions. A per-call `name` callback overrides the imported identifier, for example to point enum refs at a suffixed type name.

`RefSchemaNode` gains `targetName`: the emitted name of the referenced schema when it differs from the pointer's last segment. The adapter stamps it during parsing for collision-renamed schemas, and `resolveRefName` prefers it, so refs resolve without a side-channel map. `adapter.getImports` and the `nameMapping` side channels (`adapter.options.nameMapping`, `meta.nameMapping`) are gone, and custom adapters only implement `parse` and `validate`.

The new `macroRenameSchema({ from, to })` macro renames a schema consistently: the declaration and every ref pointing at it change together, so imports stay in sync.
