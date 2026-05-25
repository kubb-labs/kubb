---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Make the AST node vocabulary spec-neutral so adapters for non-OpenAPI specs (AsyncAPI, GraphQL, Prisma, Arazzo) map onto built-in nodes — the model stays closed and fully typed, no adapter-defined kinds.

- `OperationNode` is now a discriminated union keyed on `protocol`. `HttpOperationNode` (`protocol: 'http'`) guarantees non-nullable `method` and `path`; `GenericOperationNode` omits them for non-HTTP transports. New exports: `HttpOperationNode`, `GenericOperationNode`, `OperationNodeBase`, and the `isHttpOperationNode` guard.
- `createOperation` is overloaded: passing `method` + `path` returns an `HttpOperationNode` and auto-sets `protocol: 'http'`; otherwise it returns a `GenericOperationNode`. `@kubb/adapter-oas` sets `protocol: 'http'`, so OpenAPI output is unchanged.

**Breaking (types):** read `method`/`path` only after narrowing with `isHttpOperationNode(node)` or `node.protocol === 'http'`. `createOperation({ protocol: 'http' })` without `method`/`path` is no longer valid — provide both, or omit all three for a generic operation.
