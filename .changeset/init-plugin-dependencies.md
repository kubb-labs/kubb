---
"@kubb/cli": patch
---

`kubb init` takes its plugins from the Kubb registry, adds them like `kubb add`, and stops before installing when a plugin's dependencies or client plugin are missing.
