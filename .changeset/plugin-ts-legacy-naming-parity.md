---
"@kubb/plugin-ts": minor
"@kubb/adapter-oas": minor
---

**`@kubb/plugin-ts`**: When `legacy: true`, the type generator now fully matches the v4 output:

- Grouped parameter types: `<OperationId>PathParams`, `<OperationId>QueryParams`, `<OperationId>HeaderParams`
- No `<OperationId>RequestConfig` type emitted
- Wrapper types (`Mutation`/`Query`) use `{ Response, Request?, QueryParams?, Errors }` shape
- Response union (`MutationResponse`/`QueryResponse`) contains only the 2xx type; no 2xx → `any`
- Inline enum values in parameters and responses are extracted as named declarations

Six `@deprecated` resolver methods added to `ResolverTs` for grouped parameter naming (`resolvePathParamsName`, `resolveQueryParamsName`, `resolveHeaderParamsName` and typed variants). Implemented only in `resolverTsLegacy`; will be removed in v6.

**`@kubb/adapter-oas`**: `collisionDetection` is now part of the public API with a default of `true`.

- `collisionDetection: true` (default) → full-path enum names, e.g. `OrderParamsStatusEnum`
- `collisionDetection: false` → immediate-parent enum names with numeric deduplication, e.g. `ParamsStatusEnum`, `ParamsStatusEnum2`
