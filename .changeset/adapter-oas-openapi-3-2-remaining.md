---
'@kubb/adapter-oas': minor
'@kubb/ast': minor
'@kubb/core': minor
---

Read the OpenAPI 3.0, 3.1 and 3.2 fields the adapter skipped, so plugins get every field that affects generated code.

### Added

- `meta` gets `summary`, `termsOfService`, `contact`, `license`, `externalDocs`, `tags` and `auth`. `InputServer` gets `name`.
- `meta.tags` entries have `summary`, `parent` and `kind`. With `group: { type: 'tag' }`, a child tag's folder sits inside its parent's, such as `animals/cats/`.
- `OperationNode` gets `externalDocs` and `auth`. `auth` comes from the operation, or else the document.
- `ResponseNode` gets `summary`, `headers` and `links`.
- `ParameterNode` gets `examples`, `deprecated` and `allowEmptyValue`. `ParameterStyle` gets the 3.2 `cookie` style.
- `ContentNode` gets `examples`, `prefixEncoding` and `itemEncoding`. `EncodingNode` gets `encoding`, `prefixEncoding` and `itemEncoding`, for `multipart/mixed` and nested multipart bodies.
- `ExampleNode` holds one example. A 3.2 `dataValue` becomes `value`, and `serializedValue` is kept.
- Schema nodes get `externalDocs` and `conditionals`: one `{ if, then, else }` entry for `if`/`then`/`else` and for each `dependentRequired` and `dependentSchemas` key.
- Array nodes get `contains` with the `schema` some items must match and, from `minContains` and `maxContains`, how many (`min`, `max`). String nodes get `content` with the `mediaType`, `encoding` and parsed `schema` of the value they encode.
- `StatusCode` includes ranges such as `2XX`.

### Changed

- `$self` sets the base URI that relative `$ref`s resolve against.
- A `$ref` to a schema's `$id`, `$anchor` or `$dynamicAnchor`, and a `$dynamicRef`, resolve like a local `$ref`. Before, an anchor ref failed as not found and an `$id` URL was fetched.
- `unevaluatedProperties` and `unevaluatedItems` close or type extra keys and tuple items when `additionalProperties` or `items` is absent, and no `allOf`, `anyOf`, `oneOf`, `if`, `dependentSchemas` or `$ref` sits beside them.
- A discriminator without `propertyName`, optional from 3.2, no longer crashes the parse. Its `defaultMapping` schema joins the union.
- A response without `description` parses.

### Deprecated

These fields stay filled, so existing code keeps working. They are removed in Kubb v6.

| Deprecated                                             | Use instead                                        |
| ------------------------------------------------------ | -------------------------------------------------- |
| `minProperties`, `maxProperties` on object nodes       | `min`, `max`, as on string, array and number nodes |
| `exclusiveMinimum`, `exclusiveMaximum` on number nodes | `exclusive: { min, max }`                          |

```diff
- { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 100 }
+ { type: 'number', exclusive: { min: 0, max: 100 } }
```

### Removed

`meta.securitySchemes` and `InputSecurityScheme` are replaced by `meta.auth` and `AuthScheme`. Each scheme's `credential` has the same shape as the `Auth` object that `@kubb/plugin-fetch` and `@kubb/plugin-axios` pass to your `auth` resolver, so the AST and the generated client share one format:

- `http` with `scheme` (`bearer`, `basic`, or another such as `digest`) and `bearerFormat`.
- `apiKey` with `in` and `name`.
- `oauth2` with its `flows`, including the 3.2 `deviceAuthorization`, and `metadataUrl`.
- `openIdConnect` with the discovery `url`.
- `mutualTLS`.

A scheme a client cannot place, such as an `apiKey` outside a header, query or cookie, is left out.

```ts
// before: meta.securitySchemes
{ name: 'api_key', type: 'apiKey', in: 'header', parameterName: 'X-API-Key' }
// after: meta.auth
{ name: 'api_key', credential: { type: 'apiKey', in: 'header', name: 'X-API-Key' } }
```

`OperationNode.auth` lists alternatives, each a list of `{ scheme, scopes }`. A 3.2 key that names a scheme by URI becomes the scheme name.
