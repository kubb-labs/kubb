---
'@kubb/cli': patch
'kubb': patch
---

Improve `defineConfig` usage in v5.

- Fix `defineConfig` typing in the `kubb` package so object configs keep the expected inferred shape.
- Update `kubb init` to install `kubb`, which matches the generated `import { defineConfig } from 'kubb'` config file.
