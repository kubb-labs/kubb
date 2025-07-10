---
"@kubb/plugin-oas": patch
---

AnyOf where `const`(empty string) is being used should not be converted to a nullable value.
