---
'kubb': patch
---

`kubb` now depends on `@kubb/kit` and `@kubb/renderer-jsx` with a caret range, like `@kubb/core`, so a plugin built against a newer patch or minor shares one copy with `kubb` instead of installing a second one.
