---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
'@kubb/core': minor
'@kubb/kit': minor
---

Add shared helpers so plugins stop re-deriving facts from the spec:

- Ref, schema graph and schema property helpers are grouped into `ast.ref` (`name`, `resolve`, `resolveName`, `isBare`, `merge`, `sync`), `ast.graph` (`refs`, `usedNames`, `circular`, `importedNames`, `containsCircular`) and `ast.schema` (`properties`, `literalValues`, `discriminatorName`).
- `ast.mediaType`, `ast.http` (`is`, `status`, `responses`, `parameters`, `baseURL`), `ast.server`, `ast.auth`, and `ast.schema` (`jsonContent`, `isString`, `numberBounds`).
- `code` in `@kubb/kit`: `code.string`, `code.key`, `code.literal`, `code.isIdentifier` and `code.jsDoc` print safe JavaScript literals.
- `resolver.groupDir(group, value)` in `@kubb/core` returns the folder a group puts a file in.
- `content.stream.framing` (`'events'` or `'lines'`) and `content.stream.textData`, set by `@kubb/adapter-oas` on stream content.

`resolver.imports({ checks: true })` no longer imports refs from checks that cannot fail: a `contains` with `minContains: 0` and no `maxContains`, and string `content` that is not JSON or is encoded.

`@kubb/adapter-oas` spreads a form-encoded OpenAPI 3.2 `querystring` object into one `in: 'query'` parameter per property, with the `style`, `explode` and `allowReserved` of its `encoding` entry. A JSON `querystring` stays one parameter, and `ast.http.parameters` puts it in the `query` group.

`@kubb/adapter-oas` also reads any `application/*+json-seq` type as a stream, and no longer reads `multipart/mixed` as one unless it declares `itemSchema`.

`extractRefName`, `syncSchemaRef`, `isStringType` and `containsCircularRef` in `@kubb/kit` are deprecated. Use `ast.refName`, `ast.ref.sync`, `ast.schema.isString` and `ast.graph.containsCircular`. They are removed in Kubb v6.

The top-level `ast.refName`, `ast.resolveRef`, `ast.resolveRefName`, `ast.isBareRef`, `ast.mergeRefWithSchema`, `ast.collectSchemaRefs`, `ast.collectUsedSchemaNames`, `ast.findCircularSchemas`, `ast.collectImportedRefNames`, `ast.resolveSchemaProperties`, `ast.getSchemaLiteralValues` and `ast.inferDiscriminatorPropertyName` are deprecated in favor of their namespaced names, and are removed in Kubb v6.
