---
'@kubb/adapter-oas': patch
---

Apply a scalar sibling `type` and `format` to `oneOf` and `anyOf` members that have no `type` of their own. `type: integer` with `anyOf: [{ minimum: 10 }, { maximum: 0 }]` now gives integer members, and `type: string, format: binary` with `contentMediaType` members now gives `Blob` members.
