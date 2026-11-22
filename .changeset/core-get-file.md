---
'@kubb/core': patch
---

Add `ctx.getFile(path)` to the plugin context, which returns a file as the build holds it now, such as one an earlier plugin wrote. Use it in place of `ctx.driver.fileManager.files`.
