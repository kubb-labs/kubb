---
'@kubb/ast': minor
'@kubb/kit': minor
---

`@kubb/ast` now answers common questions about nodes, so plugins outside the plugins repo can use the same helpers:

- `ast.schema.is(node, kind, { follow })` checks whether a schema is `binary`, `string`, `text`, `scalar`, `const`, `enumLike`, or `untyped`. With `follow: ['ref', 'array']`, it also looks through refs and array items.
- `ast.schema.getObjectKind`, `ast.schema.getChecks`, and `ast.schema.getOptionality` describe an object's shape, the checks it runs on raw input, and whether a property is optional, nullable, or nullish.
- `ast.schema.getNumberBounds` now takes a number node and applies its integer format range and `multipleOf`.
- `ast.mediaType.getKind` and `ast.mediaType.getStreamFraming` classify a content entry.
- `ast.http.getRequestGroups`, `ast.http.responses.getStream`, and `ast.http.responses.getUnion` summarize a request, a streamed response, and the union of success responses.

`ast.schema.isString` and the `followRefs` option of `ast.schema.find` are deprecated. Use `ast.schema.is(node, 'string')` and `follow: ['ref']`. Both are removed in Kubb v6.
