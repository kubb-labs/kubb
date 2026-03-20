---
"@kubb/plugin-ts": minor
"@kubb/adapter-oas": minor
---

**`@kubb/plugin-ts`**: When `legacy: true` is set, the `typeGenerator` now fully reproduces the v4 exported type structure:

- **Grouped parameter types** instead of individual parameter types — `<OperationId>PathParams`, `<OperationId>QueryParams`, and `<OperationId>HeaderParams` interfaces are generated (one per parameter group per operation) rather than one type per individual parameter.
- **No `RequestConfig` type** — `<OperationId>RequestConfig` is no longer emitted in legacy mode (it was absent in v4).
- **Legacy wrapper types** — `<OperationId>Mutation` / `<OperationId>Query` now emit `{ Response, Request?, QueryParams?, Errors }` objects (matching v4) instead of a numeric-keyed responses map.
- **Response union is success-only** — `<OperationId>MutationResponse` / `<OperationId>QueryResponse` contains only the 2xx success type (matching v4), not a union of all responses. Operations without a 2xx response emit `any`.
- **Operation-level enum extraction** — Inline enum values in query parameters and response schemas are now extracted as named `const` / `enum` declarations (e.g. `FindPetsByStatusQueryParamsStatusEnum`, `DeletePet200Enum`) instead of being inlined as union literals.

Six deprecated resolver methods were added to `ResolverTs` to support grouped parameter naming in legacy mode (`resolvePathParamsName`, `resolvePathParamsTypedName`, `resolveQueryParamsName`, `resolveQueryParamsTypedName`, `resolveHeaderParamsName`, `resolveHeaderParamsTypedName`). These are implemented only in `resolverTsLegacy`; calling them on the default resolver throws an error. All six are marked `@deprecated` and will be removed in v6.

**`@kubb/adapter-oas`**: `collisionDetection` is replaced by the `legacy` flag in the public API of `adapterOas(...)`.

- `legacy: false` (default, v5 behaviour) → full-path enum names with collision resolution, e.g. `OrderParamsStatusEnum`
- `legacy: true` (v4 behaviour) → immediate-parent enum names with numeric deduplication, e.g. `ParamsStatusEnum`, `ParamsStatusEnum2`

Legacy enum naming rules:
- **Nested property enums** use only the immediate parent key: `ParamsStatusEnum` (not `OrderParamsStatusEnum`).
- **Collision deduplication** appends a numeric suffix when the same enum name appears more than once: `ParamsStatusEnum`, `ParamsStatusEnum2`.
- **`oneOf`/`anyOf` shared property enums** omit the schema name: `StatusEnum` (not `PetStatusEnum`).
- **Array items enums** use the array property name: `DeletePet200Enum`.

`collisionDetection` remains an internal implementation detail and is no longer part of the public `OasAdapterOptions` / `OasAdapterResolvedOptions` types.
