---
"@kubb/cache": minor
"@kubb/core": minor
---

New package: `@kubb/cache`, an incremental build cache.

Kubb now fingerprints the inputs that shape generated code (the spec content, the resolved config, every plugin's options, and the running version) and, when nothing changed, restores the previous output instead of regenerating it. A second run becomes near-instant, the same idea behind Nx's computation cache.

It is opt-in through the new `cache` option in `defineConfig`, which mirrors the existing `storage` option. `@kubb/core` gains the `Cache` type and the `createCache` factory; `@kubb/cache` ships the backends (`fsCache` for local disk and `memoryCache` for tests).

```ts
import { fsCache } from '@kubb/cache'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  cache: fsCache(),
})
```
