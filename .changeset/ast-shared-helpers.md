---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/kit': patch
---

Add shared helpers for plugins: `ast.ref`, `ast.graph`, `ast.schema`, `ast.mediaType`, `ast.http`, `ast.server` and `ast.auth` in `@kubb/ast`, `casing` and `text` in `@kubb/kit`, and `resolver.groupDir` in `@kubb/core`.

- `@kubb/adapter-oas` spreads a form-encoded OpenAPI 3.2 `querystring` object into one query parameter per property.
- `@kubb/adapter-oas` reads any `application/*+json-seq` type as a stream, and reads `multipart/mixed` as one only when it declares `itemSchema`.
- `resolver.imports({ checks: true })` skips refs in checks that cannot fail.

The top-level ref, graph and schema helpers on `ast`, `ast.isHttpOperationNode`, `ast.collectSync`, `ast.optionality`, `ast.extractStringsFromNodes`, `ast.compareEnforce`, `ast.applyMacros`, `ast.nodeKinds`, `ast.schemaTypes`, `ast.findSchema`, `ast.narrowSchema`, `ast.transform`, `ast.collect`, `ast.inlineFiles` (now under `ast.macro`, `ast.node`, `ast.schema` and `ast.file`), `ast.createPrinter` and `ast.defineMacro` (now `createPrinter` and `defineMacro` from `@kubb/kit`), and `camelCase`, `pascalCase`, `extractRefName`, `syncSchemaRef`, `isStringType` and `containsCircularRef` from `@kubb/kit` are deprecated. Each one's JSDoc names its replacement. Kubb v6 removes them.
