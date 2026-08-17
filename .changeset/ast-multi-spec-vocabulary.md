---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Make `@kubb/ast` a spec-neutral AST that adapters for non-OpenAPI specs (AsyncAPI, GraphQL, Prisma, Arazzo) can target, alongside `@kubb/adapter-oas`. The model stays closed and fully typed, with no adapter-defined kinds.

- `OperationNode` is now a discriminated union keyed on `protocol`. `HttpOperationNode` (`protocol: 'http'`) guarantees non-nullable `method` and `path`, while `GenericOperationNode` omits them for non-HTTP transports. New exports: `HttpOperationNode`, `GenericOperationNode`, and the `isHttpOperationNode` guard. `createOperation` is overloaded: passing `method` + `path` returns an `HttpOperationNode` and auto-sets `protocol: 'http'`, otherwise it returns a `GenericOperationNode`. `@kubb/adapter-oas` sets `protocol: 'http'`, so OpenAPI output is unchanged.
- The spec-specific schema decisions (nullability, `$ref` detection and resolution, discriminator, binary) are isolated behind an ordered `SchemaRule` match/convert table (`schemaRules`), so the dispatch logic that used to be scattered through the OAS parser now lives as one declarative list in `@kubb/adapter-oas`.

Breaking (types): read `method`/`path` on an operation only after narrowing with `isHttpOperationNode(node)` or `node.protocol === 'http'`. `createOperation({ protocol: 'http' })` without `method`/`path` is no longer valid. Provide both, or omit all three for a generic operation.
