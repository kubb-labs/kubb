---
'@kubb/cli': patch
---

Run `output.format`, `output.lint` and `output.postGenerate` through `@kubb/core` instead of the CLI's own copies, so every host runs the same passes.
