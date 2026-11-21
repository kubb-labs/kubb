---
'@kubb/adapter-oas': patch
---

Keep a sibling scalar `type` and `format` on `oneOf` / `anyOf` members that declare no `type` of their own. `type: 'integer', anyOf: [{ minimum: 10 }, { maximum: 0 }]` now stays an integer, and `type: 'string', format: 'binary'` with `contentMediaType` members stays a `Blob`.
