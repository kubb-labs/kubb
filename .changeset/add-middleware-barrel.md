---
"@kubb/middleware-barrel": minor
---

New package: `@kubb/middleware-barrel`.

Provides barrel-file generation as a Kubb middleware. Add `middlewareBarrel` to `config.middleware` and set `output.barrelType` (`'all'`, `'named'`, or `'propagate'`) on the root config or individual plugins.

```ts
import { middlewareBarrel } from '@kubb/middleware-barrel'

export default defineConfig({
  middleware: [middlewareBarrel],
  plugins: [pluginTs(), pluginZod()],
})
```
