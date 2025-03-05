---
"@kubb/oas": patch
---

It is possible for discriminated unions to have no properties. This change checks whether the current childSchema has "properties" before continuing execution.
