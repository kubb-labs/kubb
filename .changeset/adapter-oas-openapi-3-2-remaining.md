---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
'@kubb/core': minor
---

Read the remaining OpenAPI 3.2 fields, so a 3.2 document no longer generates the same AST as a 3.1 document.

- `$self` sets the base URI that relative `$ref`s resolve against. A relative `$self` resolves against the file's own location first.
- Tags land on `meta.tags` with `summary`, `parent` and `kind`. With `group: { type: 'tag' }`, a child tag's folder sits inside its parent's, such as `animals/cats/`.
- `ContentNode` and `EncodingNode` get `prefixEncoding` and `itemEncoding`, and `EncodingNode` gets a nested `encoding`, for `multipart/mixed` and nested multipart bodies.
- `ContentNode` and `ParameterNode` get `examples`. A 3.2 `dataValue` becomes `value`, and `serializedValue` is kept.
- `ResponseNode` gets `summary`. A response without `description` parses.
- `InputServer` gets `name`.
- `InputSecurityScheme` gets the OAuth2 `flows`, including `deviceAuthorization`, plus `oauth2MetadataUrl` and `deprecated`.
- `stream.sentinel` holds the `data` value that ends an event stream, read from `x-sse-sentinel` or `x-speakeasy-sse-sentinel`.
- A string schema node keeps `contentMediaType` and the parsed `contentSchema`.
