---
"@kubb/ast": minor
"@kubb/adapter-oas": patch
---

### `@kubb/ast`

- Reorganized schema helper modules into clearer categories:
  - `transformers.ts` for schema transformation helpers
  - `resolvers.ts` for lookup/derivation helpers
  - `utils.ts` for generic helper utilities
- Renamed exported helper APIs to shorter names for consistency:
  - resolvers: `findDiscriminator`, `childName`, `enumPropName`, `collectImports`
  - transformers: `setDiscriminatorEnum`, `mergeAdjacentObjects`, `simplifyUnion`, `setEnumName`, `resolveNames`
  - utils: `isStringType`, `caseParams`, `syncOptionality`
- Removed deprecated alias exports for old names.

### `@kubb/adapter-oas`

- Fixed named import shape regression in adapter import resolution.
- `adapter.getImports(...)` now correctly returns `KubbFile.Import` entries with `name` as `string[]` (for example `['PetType']`), with added regression coverage.
