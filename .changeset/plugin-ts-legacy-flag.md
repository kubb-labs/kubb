---
"@kubb/plugin-ts": minor
---

Add `legacy` option to `@kubb/plugin-ts` for backwards-compatible (v4) naming conventions.

When `legacy: true`, the `typeGenerator` uses `resolverTsLegacy` with old naming:
- Response status: `<OperationId><StatusCode>` (e.g. `CreatePets201`)
- Default/error: `<OperationId>Error`
- Request body: `<OperationId>MutationRequest` / `<OperationId>QueryRequest`
- Responses wrapper: `<OperationId>Mutation` / `<OperationId>Query`
- Response union: `<OperationId>MutationResponse` / `<OperationId>QueryResponse`

`resolverTsLegacy` is exported from `@kubb/plugin-ts`.
