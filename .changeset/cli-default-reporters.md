---
'@kubb/cli': patch
---

Print output and errors for a `kubb.config.ts` that does not use `defineConfig`. Such a config has no `reporters`, so `kubb generate` attached no logger and exited with code 1 without saying why. It now falls back to the built-in reporters.
