---
"@kubb/plugin-faker": patch
---

Fix self-referencing type infinite recursion. Detect when a type references itself and return undefined instead of making recursive calls, preventing stack overflow errors.
