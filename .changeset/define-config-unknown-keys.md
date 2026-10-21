---
'kubb': patch
---

`defineConfig` now reports unknown config keys, such as a misspelled `output.clean`. Values returned from a callback or a Promise are not checked by TypeScript; add `satisfies UserConfig` there.
