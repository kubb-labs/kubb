---
'@kubb/ast': patch
---

Trim the AST package to the nodes and helpers that are used.

- Remove `OutputNode`, `createOutput` and the `output` visitor key.
- Remove `ast.factory.update` and the `InferSchemaNode` helper types. `createSchema` now returns `SchemaNodeByType[type]`.
- Replace `Ipv4SchemaNode` and `Ipv6SchemaNode` with `'ipv4' | 'ipv6'` in `ScalarSchemaType`.
- Remove the `@kubb/ast/types` subpath. Import types from `@kubb/ast`.
- Add `ast.refName(ref)` to read the last segment of a `$ref`.
