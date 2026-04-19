---
"@kubb/ast": minor
"@kubb/adapter-oas": patch
---

Reorganize schema helper modules into clearer categories.

### `@kubb/ast`

Schema helpers are now split across three modules:

- `transformers.ts` — schema transformation helpers (`setDiscriminatorEnum`, `mergeAdjacentObjects`, `simplifyUnion`, `setEnumName`, `resolveNames`)
- `resolvers.ts` — lookup and derivation helpers (`findDiscriminator`, `childName`, `enumPropName`, `collectImports`)
- `utils.ts` — generic utilities (`isStringType`, `caseParams`, `syncOptionality`)

Deprecated alias exports for old names have been removed.

### `@kubb/adapter-oas`

Fix named import shape regression in adapter import resolution. `adapter.getImports(...)` now correctly returns `KubbFile.Import` entries with `name` as `string[]`.
