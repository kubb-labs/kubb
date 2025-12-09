---
"@kubb/plugin-oas": patch
---

Fix allOf failing to merge constraints like maxLength with $ref schemas. When using allOf to combine a $ref schema with inline constraints, those constraints are now properly preserved in the generated schema tree.
