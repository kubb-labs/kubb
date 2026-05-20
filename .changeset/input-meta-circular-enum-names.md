---
'@kubb/ast': minor
'@kubb/core': minor
---

`InputMeta` gains two pre-computed fields that plugins previously had to derive themselves by iterating the full schema list.

- `circularNames` — names of schemas that participate in a circular reference chain. Replaces calling `ast.findCircularSchemas(inputNode.schemas)` inside each plugin.
- `enumNames` — names of every enum schema in the document. Replaces filtering the schema stream by type.

Both fields are plain `readonly string[]` arrays, keeping `InputMeta` fully JSON-serializable.

`GeneratorContext` now exposes `meta: InputMeta` instead of `inputNode: InputNode`. Plugins that previously destructured `inputNode` to access circular or enum information should switch to `ctx.meta.circularNames` and `ctx.meta.enumNames`.
