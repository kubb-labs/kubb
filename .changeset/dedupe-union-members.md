---
"@kubb/kit": patch
---

Drop repeated members from unions, so `oneOf: [string, string, number]` becomes `string | number` for every plugin.
