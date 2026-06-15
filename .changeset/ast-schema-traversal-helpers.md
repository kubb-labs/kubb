---
"@kubb/ast": minor
---

Add shared schema-traversal helpers to `@kubb/ast/utils` for printers to build on. `mapSchemaProperties`, `mapSchemaMembers`, and `mapSchemaItems` walk an object's properties, a union or intersection's members, and an array or tuple's items, pairing each child with its transformed output. They are generic over the output type, so a printer can return `string` or `ts.TypeNode`. `lazyGetter` emits the `get key() { return body }` form for circular-ref positions, and `resolveRefName` is now exported from the subpath as the shared ref-name resolver. Pure addition, no behavior change.
