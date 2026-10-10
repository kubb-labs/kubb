---
'@kubb/core': patch
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/cli': patch
'kubb': patch
---

Import types from the modules that define them instead of internal re-export barrels. The public exports are unchanged.
