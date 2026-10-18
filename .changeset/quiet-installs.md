---
'@kubb/cli': patch
---

Keep the package manager's own output off the terminal while `kubb add`, `kubb update`, and `kubb init` install, so it no longer breaks up the spinner. A failed install shows the last lines of that output in its error.
