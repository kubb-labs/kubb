---
'@kubb/plugin-barrel': patch
---

The `@kubb/core` peer dependency warning is gone. A plugin `output.path` that resolves outside `config.output.path` is now reported as a `KUBB_PATH_TRAVERSAL` diagnostic. Generated barrels are unchanged.
