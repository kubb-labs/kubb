---
'@kubb/ast': minor
'@kubb/core': patch
---

Make the AST node vocabulary spec-neutral so adapters for non-OpenAPI specs (AsyncAPI, GraphQL, Prisma, Arazzo) map onto built-in nodes — the model stays closed and fully typed, no adapter-defined kinds.

- `OperationNode`: `method` and `path` are now **optional** (HTTP/REST only), plus a new optional `protocol` (`'http'`) field. `@kubb/adapter-oas` still sets `method`/`path`, so OpenAPI output is unchanged.

**Breaking (types):** code reading `OperationNode.method`/`path` must handle `undefined` (an OpenAPI operation always carries them — guard or assert).
