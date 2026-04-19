---
'@kubb/adapter-oas': patch
---

Fix boolean `const` values and parameter enums.

- Boolean `const` values are now inlined as literal types instead of generating external enums
- Parameter schemas with `enum` fields now produce named enum nodes instead of anonymous inline literal unions
