---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/plugin-barrel': minor
---

Add `output.shared` so schemas that several specs define are generated once in a shared directory and imported from there.

- Writes each shared schema under `output.shared.path`, with the same plugin layout as `output.path`, and points every import of it there across all plugins.
- Detects the shared schemas in `kubb generate`: a schema is shared when every config with the same shared path defines it identically.
- Keeps a schema that the specs define differently in each config's output, and warns with its name.
- Accepts `output.shared.schemas` to list the names yourself instead.
- Writes barrel files in the shared directory when `output.barrel` is set.

```ts
const shared = { path: './src/gen/common' }

export default defineConfig([
  { input: './animals.json', output: { path: './src/gen/animals', shared }, plugins: [pluginTs()] },
  { input: './fruits.json', output: { path: './src/gen/fruits', shared }, plugins: [pluginTs()] },
])
```
