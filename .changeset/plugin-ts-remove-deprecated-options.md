---
"@kubb/plugin-ts": major
---

Remove deprecated options from `@kubb/plugin-ts`. Use `adapterOas(...)` instead:

| Removed | Replacement |
|---|---|
| `enumSuffix` | `adapterOas({ enumSuffix })` |
| `dateType` | `adapterOas({ dateType })` |
| `integerType` | `adapterOas({ integerType })` |
| `unknownType` | `adapterOas({ unknownType })` |
| `emptySchemaType` | `adapterOas({ emptySchemaType })` |
