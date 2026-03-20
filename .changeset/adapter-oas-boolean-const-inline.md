---
"@kubb/adapter-oas": patch
---

Boolean `const` values are now inlined as literal types instead of generating an external named enum.

Parameter schemas with an `enum` field now produce a named enum node instead of an anonymous inline literal union.
