---
'@kubb/studio': minor
---

Report every entry of a `defineConfig([...])` array to Studio in the connect payload (`config.configs`), and generate from the entry Studio names through `config.config`, by position or by `name`. `loadConfig` may now return an array, and `kubb studio` passes every entry.
