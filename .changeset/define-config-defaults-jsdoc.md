---
'kubb': patch
---

Correct the JSDoc on `defineConfig`: `output.format` and `output.lint` default to `false`, not `'auto'`. The code already applies `false` when the user does not set either option. Only the comment was wrong.
