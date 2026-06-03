---
'@kubb/middleware-logger': minor
'@kubb/cli': minor
'@kubb/core': minor
---

Make the live CLI logger configurable through `kubb.config.ts`, the same way `middleware` opts into `@kubb/middleware-barrel`. `@kubb/core` adds a `logger?: Logger` field on `UserConfig`. The CLI no longer hardcodes a logger: it reads `config.logger` and falls back to a tiny inline plain-console logger when nothing is set, so `@kubb/cli` does not depend on `@kubb/middleware-logger` at all.

To opt into the consola-backed logger with inline GitHub Actions workflow command annotations, install `@kubb/middleware-logger` and set it in your config:

```ts
import { defineConfig } from 'kubb'
import { middlewareLogger } from '@kubb/middleware-logger'

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { path: './src/gen' },
  logger: middlewareLogger,
})
```

`createLogger(options)` is also exported for custom instances. `HookSinkOptions` and `HookSinkFactory` move to `@kubb/core` so any logger can declare them without depending on the middleware package.

`@clack/prompts` is removed from `@kubb/cli`. The init wizard, agent runner, and generate watcher use consola for prompts and live output.

`@kubb/core` patches a type bug in `createReporter<T>`'s no-`flush` branch so the returned `Reporter.report` discards the `T` value rather than mistyping the callback.
