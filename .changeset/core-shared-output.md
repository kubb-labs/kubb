---
'@kubb/core': minor
---

Add `output.shared` so schemas that several specs define are generated once in a shared directory and imported from there.

- Writes each schema listed in `output.shared.schemas` under `output.shared.path`, with the same plugin layout as `output.path`.
- Points every import of a listed schema at the shared directory, across all plugins.
- Sets the default for every plugin, and a plugin can set its own `output.shared`.

```ts
const shared = { path: './src/gen/common', schemas: ['Name', 'Color'] }

export default defineConfig([
  { input: './animals.json', output: { path: './src/gen/animals', shared }, plugins: [pluginTs()] },
  { input: './fruits.json', output: { path: './src/gen/fruits', shared }, plugins: [pluginTs()] },
])
```
