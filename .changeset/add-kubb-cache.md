---
"@kubb/core": minor
---

Add an opt-in incremental build cache.

Kubb now fingerprints the inputs that shape generated code (the spec content, the resolved config, every plugin's options, and the running version) and, when nothing changed, restores the previous output instead of regenerating it. A second run becomes near-instant, the same idea behind Nx's computation cache.

`defineConfig` turns this on by default with `fsCache()` (local disk under `node_modules/.cache/kubb`). Set `cache: false` to turn it off, or pass another backend through the new `cache` option, which mirrors the existing `storage` option. `@kubb/core` ships the `fsCache()` backend, plus the `Cache` type and `createCache` factory for custom ones. A bare `createKubb` leaves caching off unless a cache is passed.

```ts
import { defineConfig } from 'kubb'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  // cache: fsCache() is applied by default; set `cache: false` to turn it off.
})
```

When the spec changes, the cache also rebuilds incrementally: it fingerprints each schema and operation, then regenerates only the ones that changed (and their dependents) while replaying the rest from the previous run. This applies when a node maps to its own file; single-file and grouped output fall back to a full rebuild.
