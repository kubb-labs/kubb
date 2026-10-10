---
'@kubb/plugin-barrel': patch
---

Depend on `@kubb/kit` only, which removes the `@kubb/core` peer dependency warning, and report a plugin output path that escapes the output directory as a `KUBB_PATH_TRAVERSAL` diagnostic; generated barrels are unchanged.
