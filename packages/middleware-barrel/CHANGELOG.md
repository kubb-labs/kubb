# @kubb/middleware-barrel

## 5.0.0-alpha.57

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.57

## 5.0.0-alpha.56

### Patch Changes

- [#3146](https://github.com/kubb-labs/kubb/pull/3146) [`45acd89`](https://github.com/kubb-labs/kubb/commit/45acd890db6c022c654de8102c284ee898d019b8) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix barrel file generation in `@kubb/middleware-barrel`.

  **Bug 1 — Wrong per-plugin output path**: `generatePerPluginBarrel` was resolving the plugin output directory as `resolve(config.root, plugin.output.path)`, but plugin paths are relative to `config.output.path`. Fixed to `resolve(config.root, config.output.path, plugin.output.path)`.

  **Bug 2 — Root barrel generated after file writing**: The root barrel was generated inside `kubb:build:end`, which fires after `fileProcessor.run()` has already written files to disk — so the barrel was never persisted. A new `kubb:plugins:end` lifecycle hook now fires after all plugins have run but before files are written, and the root barrel is generated there.

- Updated dependencies [[`45acd89`](https://github.com/kubb-labs/kubb/commit/45acd890db6c022c654de8102c284ee898d019b8)]:
  - @kubb/core@5.0.0-alpha.56

## 5.0.0-alpha.55

### Minor Changes

- [#3135](https://github.com/kubb-labs/kubb/pull/3135) [`fd014c6`](https://github.com/kubb-labs/kubb/commit/fd014c6870ae4eefbe5ea8fac32ab9ba226defa9) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - New package: `@kubb/middleware-barrel`.

  Provides barrel-file generation as a Kubb middleware. Add `middlewareBarrel` to `config.middleware` and set `output.barrelType` (`'all'`, `'named'`, or `'propagate'`) on the root config or individual plugins.

  ```ts
  import { middlewareBarrel } from "@kubb/middleware-barrel";

  export default defineConfig({
    middleware: [middlewareBarrel],
    plugins: [pluginTs(), pluginZod()],
  });
  ```

### Patch Changes

- Updated dependencies [[`fd014c6`](https://github.com/kubb-labs/kubb/commit/fd014c6870ae4eefbe5ea8fac32ab9ba226defa9), [`535a2db`](https://github.com/kubb-labs/kubb/commit/535a2db4acbe2f37966190c1330d76f541afed00)]:
  - @kubb/core@5.0.0-alpha.55
