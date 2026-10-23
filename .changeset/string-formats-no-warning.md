---
'@kubb/adapter-oas': patch
---

Map `iri`, `iri-reference`, `base64url`, `jwt`, `ulid`, `iban` and `duration` to a `string` node, so they no longer raise `KUBB_UNSUPPORTED_FORMAT`. Their generated output is unchanged. A numeric schema with one of these formats, such as `type: integer, format: duration`, keeps its declared type.
