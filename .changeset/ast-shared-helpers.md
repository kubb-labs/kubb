---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/kit': patch
---

Add shared helpers so plugins stop re-deriving facts from the spec:

- `ast.ref` (`name`, `resolve`, `isBare`, `sync`) and `ast.graph` (`refs`, `usedNames`, `circular`, `importedNames`, `containsCircular`) group the ref and schema graph helpers.
- `ast.schema` (`properties`, `literalValues`, `discriminatorName`, `jsonContent`, `isString`, `numberBounds`) reads facts from schema nodes.
- `ast.mediaType`, `ast.http` (`is`, `status`, `responses`, `parameters`, `baseURL`), `ast.server` and `ast.auth` read media types, HTTP operations, servers and auth requirements.
- `casing` in `@kubb/kit`: `casing.camel`, `casing.pascal`, `casing.snake`, `casing.screamingSnake` and `casing.capitalize`. `camelCase` and `pascalCase` from `@kubb/kit` are deprecated.
- `code` in `@kubb/kit`: `code.string`, `code.key`, `code.literal`, `code.isIdentifier` and `code.jsDoc` print safe JavaScript literals.
- `resolver.groupDir(group, value)` in `@kubb/core` returns the folder a group puts a file in.

`resolver.imports({ checks: true })` no longer imports refs from checks that cannot fail: a `contains` with `minContains: 0` and no `maxContains`, and string `content` that is not JSON or is encoded.

`@kubb/adapter-oas` spreads a form-encoded OpenAPI 3.2 `querystring` object into one `in: 'query'` parameter per property, with the `style`, `explode` and `allowReserved` of its `encoding` entry. A JSON `querystring` stays one parameter, and `ast.http.parameters` puts it in the `query` group.

`@kubb/adapter-oas` also reads any `application/*+json-seq` type as a stream, and no longer reads `multipart/mixed` as one unless it declares `itemSchema`.

`extractRefName`, `syncSchemaRef`, `isStringType` and `containsCircularRef` in `@kubb/kit` are deprecated. Use `ast.ref.name`, `ast.ref.sync`, `ast.schema.isString` and `ast.graph.containsCircular`. Kubb v6 removes them.

The top-level `ast.refName`, `ast.resolveRef`, `ast.resolveRefName`, `ast.isBareRef`, `ast.mergeRefWithSchema`, `ast.collectSchemaRefs`, `ast.collectUsedSchemaNames`, `ast.findCircularSchemas`, `ast.collectImportedRefNames`, `ast.resolveSchemaProperties`, `ast.getSchemaLiteralValues`, `ast.inferDiscriminatorPropertyName` and `ast.isHttpOperationNode` are deprecated in favor of their namespaced names. Kubb v6 removes them.
