---
"@kubb/plugin-ts": patch
---

**`@kubb/plugin-ts`**: In v5 non-legacy mode, operations with query parameters now emit a grouped `<OperationId>QueryParams` type in addition to the individual parameter types.

Before this fix, only individual types were generated (e.g. `ListPetsQueryLimit`), so downstream plugins (`plugin-client`, `plugin-react-query`, etc.) that reference `ListPetsQueryParams` via `OperationGenerator.getSchemas()` would encounter a missing type.

```ts
// Before — only individual param types
export type ListPetsQueryLimit = number

// After — grouped type added
export type ListPetsQueryLimit = number
export type ListPetsQueryParams = {
  limit?: ListPetsQueryLimit
}
```
