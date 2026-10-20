---
'@kubb/studio': patch
---

Report every entry of a `defineConfig([...])` array to Studio in the connect payload (`config.configs`), each with its own current disk output, and generate from the entry Studio names through `config.config`, by position or by `name`. The `loadConfig` option of `connectAgent` is now `loadConfigs` and returns every entry; `kubb studio` passes them all.
