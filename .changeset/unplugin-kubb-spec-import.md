---
'unplugin-kubb': minor
---

Import a spec named `*.openapi.yaml` or `*.openapi.yml` from your code. The import holds the output of every plugin in `config` as one JavaScript module, with no files written, and also works in the Vite development server.

```ts
import { getPetById, petSchema } from './petStore.openapi.yaml'
```

A `config` without `input` now skips the build-time generation, so it can serve these imports only.

`generateModule`, `findConfigFile` and `loadConfigFile` are exported for the `openapi-import` TypeScript content mapper, so `tsc` and the editor see the same exports as the bundler.
