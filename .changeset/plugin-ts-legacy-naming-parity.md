---
"@kubb/plugin-ts": minor
"@kubb/adapter-oas": minor
---

**`@kubb/plugin-ts`**: When `legacy: true` is set, the `typeGenerator` now fully reproduces the v4 exported type structure:

- **Grouped parameter types** instead of individual parameter types — `<OperationId>PathParams`, `<OperationId>QueryParams`, and `<OperationId>HeaderParams` interfaces are generated (one per parameter group per operation) rather than one type per individual parameter.
- **No `RequestConfig` type** — `<OperationId>RequestConfig` is no longer emitted in legacy mode (it was absent in v4).
- **Legacy wrapper types** — `<OperationId>Mutation` / `<OperationId>Query` now emit `{ Response, Request?, QueryParams?, Errors }` objects (matching v4) instead of a numeric-keyed responses map.
- **Response union is success-only** — `<OperationId>MutationResponse` / `<OperationId>QueryResponse` contains only the 2xx success type (matching v4), not a union of all responses. Operations without a 2xx response emit `any`.

Six deprecated resolver methods were added to `ResolverTs` to support grouped parameter naming in legacy mode (`resolvePathParamsName`, `resolvePathParamsTypedName`, `resolveQueryParamsName`, `resolveQueryParamsTypedName`, `resolveHeaderParamsName`, `resolveHeaderParamsTypedName`). These are implemented only in `resolverTsLegacy`; calling them on the default resolver throws an error. All six are marked `@deprecated` and will be removed in v6.

**`@kubb/adapter-oas`**: `collisionDetection` is replaced by the `legacy` flag in the public API of `adapterOas(...)`.

- `legacy: false` (default, v5 behaviour) → full-path enum names, e.g. `OrderParamsStatusEnum`
- `legacy: true` (v4 behaviour) → immediate-parent enum names, e.g. `ParamsStatusEnum`

`collisionDetection` remains an internal implementation detail and is no longer part of the public `OasAdapterOptions` / `OasAdapterResolvedOptions` types.
