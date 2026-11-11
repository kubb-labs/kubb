---
'@kubb/ast': minor
'@kubb/adapter-oas': patch
'@kubb/core': minor
'@kubb/kit': minor
---

Add shared helpers so plugins stop re-deriving facts from the spec:

- `ast.mediaType`, `ast.http` (`is`, `status`, `responses`, `parameters`, `baseURL`), `ast.server`, `ast.auth`, `ast.schema` (`jsonContent`, `isString`, `numberBounds`), `ast.ref.sync` and `ast.graph.containsCircular`.
- `code` in `@kubb/kit`: `code.string`, `code.key`, `code.literal`, `code.isIdentifier` and `code.jsDoc` print safe JavaScript literals.
- `resolver.groupDir(group, value)` in `@kubb/core` returns the folder a group puts a file in.
- `content.stream.framing` (`'events'` or `'lines'`) and `content.stream.textData`, set by `@kubb/adapter-oas` on stream content.

`resolver.imports({ checks: true })` no longer imports refs from checks that cannot fail: a `contains` with `minContains: 0` and no `maxContains`, and string `content` that is not JSON or is encoded.

`@kubb/adapter-oas` spreads a form-encoded OpenAPI 3.2 `querystring` object into one `in: 'query'` parameter per property, with the `style`, `explode` and `allowReserved` of its `encoding` entry. A JSON `querystring` stays one parameter, and `ast.http.parameters` puts it in the `query` group.

`@kubb/adapter-oas` also reads any `application/*+json-seq` type as a stream, and no longer reads `multipart/mixed` as one unless it declares `itemSchema`.

`extractRefName`, `syncSchemaRef`, `isStringType` and `containsCircularRef` in `@kubb/kit` are deprecated. Use `ast.refName`, `ast.ref.sync`, `ast.schema.isString` and `ast.graph.containsCircular`. They are removed in Kubb v6.
