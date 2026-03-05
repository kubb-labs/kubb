---
"@kubb/plugin-ts": patch
---

Fix barrel file exporting non-existent runtime `const` when an enum schema is empty.

**When does this happen?**

Two scenarios can produce an enum with no runtime values:

1. **`enum: [null]`** — OpenAPI allows a property whose only valid value is `null`. Kubb filters `null` out of the `as const` object (nullable is represented separately as `| null` in the TypeScript union). When `null` is the only value, the filtered list is empty.
2. **`enum: []`** — Some specs define a placeholder empty enum, which is valid JSON Schema.

**What was broken?**

With `enumType: 'asConst'` or `'asPascalConst'`, `factory.createEnumDeclaration` always returned a `VariableStatement` even when there were no enum values. The truthy `nameNode` caused `Type.tsx` to register the symbol as indexable, so the barrel emitted `export { myConst }` pointing to a `const` that was never written to the file — breaking `tsc` and any bundler that performs type-checking.

**What changed?**

When `enums.length === 0`, `createEnumDeclaration` now returns `[undefined, neverTypeAlias]` instead of `[emptyVariableStatement, brokenTypeAlias]`. The `undefined` nameNode is skipped by the `{nameNode && …}` guard in `Type.tsx`, so no const is registered and the barrel omits the value export. The generated type becomes `export type XKey = never`, which is semantically correct (an empty enum has no valid values) and self-contained (no dangling const reference).
