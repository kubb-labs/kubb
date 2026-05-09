---
'@kubb/plugin-faker': patch
---

Fix faker parser handling for indirect references in nested schemas, including cyclic structures, to prevent recursion issues and generate safer mock object output.
