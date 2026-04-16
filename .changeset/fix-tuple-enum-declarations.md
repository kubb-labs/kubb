---
'@kubb/adapter-oas': patch
---

Generate named enum declarations for tuple elements.

Enum values in tuple positions (`prefixItems`) now emit standalone `as const` enum exports instead of inline literal unions. Also restores `...any[]` rest element when `items` is absent.
