---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
'@kubb/core': patch
---

Make `@kubb/ast` a spec-neutral AST that adapters for non-OpenAPI specs (AsyncAPI, GraphQL, Prisma, Arazzo) can target, alongside `@kubb/adapter-oas`. The model stays closed and fully typed, with no adapter-defined kinds.

- `OperationNode` is now a discriminated union keyed on `protocol`. `HttpOperationNode` (`protocol: 'http'`) guarantees non-nullable `method` and `path`, while `GenericOperationNode` omits them for non-HTTP transports. New exports: `HttpOperationNode`, `GenericOperationNode`, `OperationNodeBase`, and the `isHttpOperationNode` guard. `createOperation` is overloaded: passing `method` + `path` returns an `HttpOperationNode` and auto-sets `protocol: 'http'`, otherwise it returns a `GenericOperationNode`. `@kubb/adapter-oas` sets `protocol: 'http'`, so OpenAPI output is unchanged.
- The spec-specific schema decisions (nullability, `$ref` detection and resolution, discriminator, binary) are isolated behind a `SchemaDialect<TSchema, TRef, TDiscriminated, TDocument>` type and a `defineSchemaDialect` helper, alongside a generic `dispatch` match/convert table. `@kubb/adapter-oas` builds `oasDialect` with `ast.defineSchemaDialect`, so the JSON-Schema-family seam is shared across adapters instead of living inside the OAS parser alone.

Breaking (types): read `method`/`path` on an operation only after narrowing with `isHttpOperationNode(node)` or `node.protocol === 'http'`. `createOperation({ protocol: 'http' })` without `method`/`path` is no longer valid. Provide both, or omit all three for a generic operation.
