---
"@kubb/plugin-ts": major
---

Remove deprecated options from `@kubb/plugin-ts` that were moved to the adapter layer in v5.

The following options have been removed — use the corresponding `adapterOas(...)` option instead:

| Removed plugin option | Replacement |
|---|---|
| `enumSuffix` | `adapterOas({ enumSuffix })` |
| `dateType` | `adapterOas({ dateType })` |
| `integerType` | `adapterOas({ integerType })` |
| `unknownType` | `adapterOas({ unknownType })` |
| `emptySchemaType` | `adapterOas({ emptySchemaType })` |
