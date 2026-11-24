---
'@kubb/adapter-oas': patch
---

Apply an `enum` next to a nullable `type` or a `oneOf`/`anyOf` in OpenAPI 3.1 documents, so the generated type only allows the listed values.

- `type: ['string', 'null']` with an `enum` that leaves out `null` is no longer nullable.
- A `oneOf` or `anyOf` with a sibling `enum` becomes an intersection with that enum, so `(Color | null) & ('red' | 'green')` replaces `Color | null`.
- Swagger 2.0 and OpenAPI 3.0 documents keep allowing `null` for `nullable: true`, even when the `enum` does not list it.
