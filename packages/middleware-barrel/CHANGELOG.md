# @kubb/middleware-barrel

## 5.0.0-alpha.55

### Minor Changes

- [#3135](https://github.com/kubb-labs/kubb/pull/3135) [`fd014c6`](https://github.com/kubb-labs/kubb/commit/fd014c6870ae4eefbe5ea8fac32ab9ba226defa9) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - New package: `@kubb/middleware-barrel`.

  Provides barrel-file generation as a Kubb middleware. Add `middlewareBarrel` to `config.middleware` and set `output.barrelType` (`'all'`, `'named'`, or `'propagate'`) on the root config or individual plugins.

  ```ts
  import { middlewareBarrel } from '@kubb/middleware-barrel'

  export default defineConfig({
    middleware: [middlewareBarrel],
    plugins: [pluginTs(), pluginZod()],
  })
  ```

### Patch Changes

- Updated dependencies [[`fd014c6`](https://github.com/kubb-labs/kubb/commit/fd014c6870ae4eefbe5ea8fac32ab9ba226defa9), [`535a2db`](https://github.com/kubb-labs/kubb/commit/535a2db4acbe2f37966190c1330d76f541afed00)]:
  - @kubb/core@5.0.0-alpha.55
