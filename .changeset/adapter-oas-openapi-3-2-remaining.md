---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
'@kubb/core': minor
---

Read the remaining OpenAPI 3.2 fields, so a 3.2 document no longer generates the same AST as a 3.1 document, and the 3.0 and 3.1 fields the adapter skipped.

- `$self` sets the base URI that relative `$ref`s resolve against. A relative `$self` resolves against the file's own location first.
- Tags land on `meta.tags` with `summary`, `parent` and `kind`. With `group: { type: 'tag' }`, a child tag's folder sits inside its parent's, such as `animals/cats/`.
- `ContentNode` and `EncodingNode` get `prefixEncoding` and `itemEncoding`, and `EncodingNode` gets a nested `encoding`, for `multipart/mixed` and nested multipart bodies.
- `ContentNode` and `ParameterNode` get `examples`. A 3.2 `dataValue` becomes `value`, and `serializedValue` is kept.
- `ResponseNode` gets `summary`. A response without `description` parses.
- `InputServer` gets `name`.
- `InputSecurityScheme` gets the OAuth2 `flows`, including `deviceAuthorization`, plus `oauth2MetadataUrl` and `deprecated`.
- A string schema node gets `content` with the `mediaType`, `encoding` and parsed `schema` of the value it encodes.
- `ParameterStyle` gets the 3.2 `cookie` style.
- A discriminator without `propertyName`, optional from 3.2, no longer crashes the parse. Its `defaultMapping` schema is added to the union.
- 3.0 and 3.1 fields that were not read before: `info` `summary`, `termsOfService`, `contact` and `license` on `meta`; `externalDocs` on the document, tags, operations and schemas; response `headers` and `links`; parameter `deprecated` and `allowEmptyValue`; and `openIdConnectUrl`.
- JSON Schema 2020-12: `unevaluatedProperties` and `unevaluatedItems` close or type extra keys and tuple items when `additionalProperties` or `items` is absent. Schema nodes get `conditional` for `if`/`then`/`else`, object nodes get `dependentRequired` and `dependentSchemas`, and array nodes get `contains`, `minContains` and `maxContains`.
- A `$ref` to a schema's `$id`, `$anchor` or `$dynamicAnchor`, and a `$dynamicRef`, now resolve like a local `$ref`. Before, an anchor ref failed as not found and an `$id` URL was fetched.
- `StatusCode` includes ranges such as `2XX`, which responses already used.
- `OperationNode` gets `security`, from the operation or else the document. A 3.2 key that names a scheme by URI becomes the scheme name.
