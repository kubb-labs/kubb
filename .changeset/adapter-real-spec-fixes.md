---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
---

Fix schemas found in real OpenAPI documents.

- An `allOf` member that points at an alias `$ref` gives its properties to a `required`-only sibling, where they were `unknown`.
- A discriminator member with a nullable enum keeps its own value, where it got the schema name.
- A boolean schema (`true` or `false`) no longer stops the run.
- A `content` parameter keeps its `encoding` on the new `ParameterNode.encoding` field.
