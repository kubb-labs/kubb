---
"@kubb/core": minor
---

Add an opt-in incremental build cache.

Kubb now fingerprints the inputs that shape generated code (the spec content, the resolved config, every plugin's options, and the running version) and, when nothing changed, restores the previous output instead of regenerating it. A second run becomes near-instant, the same idea behind Nx's computation cache.

Enable it through the new `cache` option in `defineConfig`, which mirrors the existing `storage` option. `@kubb/core` ships the `fsCache()` (local disk) and `memoryCache()` backends, plus the `Cache` type and `createCache` factory for custom ones.

```ts
import { defineConfig } from 'kubb'
import { fsCache } from '@kubb/core'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  cache: fsCache(),
})
```

When the spec changes, the cache also rebuilds incrementally: it fingerprints each schema and operation, then regenerates only the ones that changed (and their dependents) while replaying the rest from the previous run. This applies when a node maps to its own file; single-file and grouped output fall back to a full rebuild.
