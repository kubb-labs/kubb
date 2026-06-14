---
'@kubb/ast': major
---

Reshape function parameter and type nodes onto the `ts.factory` model.

A type reference is now a plain `string`. The `ParamsType` node (with its `reference`, `struct`, and `member` variants) and the separate `ParameterGroup` node are gone. Three new nodes replace them: `TypeLiteral` for an inline object type (`{ petId: string; name?: string }`), `IndexedAccessType` for a single field read from a named type (`PathParams['petId']`), and `ObjectBindingPattern` for a destructured binding (`{ id, name }`).

`createFunctionParameter` now takes either a `name` or a flat `properties` list. Passing `properties` builds one destructured parameter, an `ObjectBindingPattern` name paired with a `TypeLiteral` type, so a whole group is a single parameter instead of its own node type.

Migration:

- `createParamsType({ variant: 'reference', name: 'string' })` becomes the string `'string'`.
- `createParamsType({ variant: 'member', base, key })` becomes `createIndexedAccessType({ objectType: base, indexType: key })`.
- `createParamsType({ variant: 'struct', properties })` becomes `createTypeLiteral({ members })`.
- `createParameterGroup({ properties })` becomes `createFunctionParameter({ properties })`.

The 24 standalone `isXxxNode` guards that were deprecated in the previous release are also removed. Use each node's `Def.is` instead, for example `schemaDef.is(node)` over `isSchemaNode(node)`. `narrowSchema` and `isHttpOperationNode` stay.
