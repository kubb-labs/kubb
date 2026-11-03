---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/plugin-barrel': minor
---

Add `output.shared` so schemas that several specs define are generated once in a shared directory and imported from there.

- Detects the shared schemas in `kubb generate`: a schema is shared when two or more configs with the same `output.shared.path` define it, all identically.
- Writes each shared schema under `output.shared.path`, with the same plugin layout as `output.path`, and points every import of it there across all plugins.
- Keeps a schema that the specs define differently in each config's output, and warns with its name.
- Re-exports the shared schemas a config defines from that config's barrels when `output.barrel` is set, so existing imports keep working. The shared directory gets no barrels of its own.
- Runs `output.format` and `output.lint` over the shared directory.
- Wipes the shared directory once per run when `output.clean` is set, before the first config that uses it writes its files.

```ts
const shared = { path: './src/gen/common' }

export default defineConfig([
  { input: './animals.json', output: { path: './src/gen/animals', shared }, plugins: [pluginTs()] },
  { input: './fruits.json', output: { path: './src/gen/fruits', shared }, plugins: [pluginTs()] },
])
```
