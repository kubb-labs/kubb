---
"@kubb/cache": minor
"@kubb/core": minor
---

New package: `@kubb/cache`, an incremental build cache.

Kubb now fingerprints the inputs that shape generated code (the spec content, the resolved config, every plugin's options, and the running version) and, when nothing changed, restores the previous output instead of regenerating it. A second run becomes near-instant, the same idea behind Nx's computation cache and Turborepo's remote cache.

It is opt-in through the new `cache` option in `defineConfig`, which mirrors the existing `storage` option. `@kubb/core` gains the `Cache` type and the `createCache` factory; `@kubb/cache` ships the backends.

```ts
import { fsCache, tieredCache, turboCache } from '@kubb/cache'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  // Local-only, or share results across machines with a Turborepo Remote Cache:
  cache: tieredCache([fsCache(), turboCache()]),
})
```

`turboCache` speaks the Turborepo Remote Cache HTTP API, so a self-hosted Turborepo cache server or Vercel Remote Cache works without changes, reading its credentials from the standard `TURBO_*` environment variables.
