---
"@kubb/core": minor
"kubb": minor
---

Deprecate `defineConfig` from `@kubb/core` in favor of importing it from `kubb`.

Preparing for v5, the recommended entrypoint for a Kubb configuration is now the top-level
`kubb` package, which wires up the OpenAPI adapter, the TypeScript parsers, and the barrel
plugin for you. `defineConfig` exported from `@kubb/core` is marked `@deprecated` and points
users to the new import path. `kubb` now exports its own `defineConfig` so the deprecation
does not leak through to consumers importing from `kubb`.

```ts
import { defineConfig } from '@kubb/core' // deprecated
import { defineConfig } from 'kubb' // recommended
```

See the migration guide: https://kubb.dev/docs/5.x/migration-guide
