---
'@kubb/ast': minor
'@kubb/core': patch
---

Make the AST node vocabulary spec-neutral so adapters for non-OpenAPI specs (AsyncAPI, GraphQL, Prisma, Arazzo) map onto built-in nodes — the model stays closed and fully typed, no adapter-defined kinds.

- `OperationNode`: `method` and `path` are now **optional** (HTTP/REST only), plus new optional `protocol` (`'http'`/`'graphql'`/`'kafka'`/…), `action` (`'send'`/`'receive'`/`'query'`/`'mutation'`/`'subscription'`/…), and `channel` fields for non-HTTP specs. `@kubb/adapter-oas` still sets `method`/`path`, so OpenAPI output is unchanged.
- New `Workflow` and `Step` node kinds (Arazzo) with `createWorkflow`/`createStep` factories, `isWorkflowNode`/`isStepNode` guards, `workflow`/`step` visitor callbacks, and an optional `workflows` collection on the root.

**Breaking (types):** code reading `OperationNode.method`/`path` must handle `undefined` (an OpenAPI operation always carries them — guard or assert).
