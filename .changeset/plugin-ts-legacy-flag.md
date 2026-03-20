---
"@kubb/plugin-ts": minor
---

Add `legacy` option to `@kubb/plugin-ts` for backwards-compatible naming.

When `legacy: true` is set, the `typeGenerator` uses the old (pre-v2) naming conventions via a new `resolverTsLegacy` resolver:

- Response status types: `<OperationId><StatusCode>` (e.g. `CreatePets201`) instead of `<OperationId>Status201`
- Default/error responses: `<OperationId>Error` instead of `<OperationId>StatusDefault`
- Request body: `<OperationId>MutationRequest` (non-GET) / `<OperationId>QueryRequest` (GET)
- Combined responses type: `<OperationId>Mutation` (non-GET) / `<OperationId>Query` (GET)
- Response union: `<OperationId>MutationResponse` (non-GET) / `<OperationId>QueryResponse` (GET)

`resolverTsLegacy` is also exported from `@kubb/plugin-ts` for consumers that reference resolver names directly.
