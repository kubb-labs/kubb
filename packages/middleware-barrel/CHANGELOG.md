# @kubb/middleware-barrel

## 5.0.0-alpha.63

### Minor Changes

- [`de614a0`](https://github.com/kubb-labs/kubb/commit/de614a0ab7405248dcff0584827822b7af57cc19) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Restore per-subdirectory barrel generation and fix `barrelType: false` exclusion from root barrel.

  - `barrelType: false` on a plugin now correctly excludes that plugin's files from the root `index.ts` barrel.
  - Per-subdirectory barrels (e.g. `models/ts/petController/index.ts`) are generated again when a plugin uses `group` and `barrelType: 'named'` or `'all'`. The `getBarrelFiles` utility now accepts a `recursive` option; `generatePerPluginBarrel` passes `recursive: true` while `generateRootBarrel` keeps the default of `false`.
  - Type-only re-exports now use `export type { ... }` to satisfy `verbatimModuleSyntax` (fixes TS1205).
  - `getBarrelFiles` now takes an options object `{ outputPath, files, barrelType, recursive? }` instead of positional arguments.

### Patch Changes

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.63

## 5.0.0-alpha.62

### Patch Changes

- [`bdfc4e9`](https://github.com/kubb-labs/kubb/commit/bdfc4e93c839efa60efb394fadf034d6cacac1aa) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Cleanup logic to also use excluded

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.62

## 5.0.0-alpha.61

### Patch Changes

- [`f14c2e6`](https://github.com/kubb-labs/kubb/commit/f14c2e6e21922483533c880dd68491e342f3083a) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add unit tests for `buildTree`, `getBarrelFiles`, `generatePerPluginBarrel`, and `generateRootBarrel`. Covers all three barrel strategies (`all`, `named`, `propagate`), edge cases (non-indexable sources, out-of-root files, extension filtering), and integration through the per-plugin and root barrel generators.

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.61

## 5.0.0-alpha.60

### Patch Changes

- [`29063f5`](https://github.com/kubb-labs/kubb/commit/29063f570c208cd82f93d4fa1a1688f277f2af38) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Fix `barrelType` TypeScript error when using `@kubb/middleware-barrel`.

  The global type augmentation that adds `barrelType` to `Output` was only reachable via a transitive side-effect import. TypeScript does not reliably follow side-effect imports through re-export chains, so `barrelType` appeared as an unknown property. The fix imports `./types.ts` directly in the package entry point, guaranteeing the augmentation is applied whenever the package is imported.

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.60

## 5.0.0-alpha.59

### Patch Changes

- Updated dependencies [[`a91e448`](https://github.com/kubb-labs/kubb/commit/a91e448f6f08fc78c956cfe0662ffec75fac14cd)]:
  - @kubb/core@5.0.0-alpha.59

## 5.0.0-alpha.58

### Patch Changes

- [#3151](https://github.com/kubb-labs/kubb/pull/3151) [`eb3c153`](https://github.com/kubb-labs/kubb/commit/eb3c15342d09b9936b7581702e756064790901e5) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix barrel-generation bugs in `@kubb/middleware-barrel`.

  **Bug 1 — Non-TypeScript files produced malformed barrel exports**: `getBarrelFiles()` included every file in the output directory (`.json`, `.html`, etc.). `toRelativeModulePath` strips the extension, so `.mcp.json` became `.mcp` and the TypeScript printer turned that into `./mcp/.ts` or `./.js`. Fixed by filtering `relevantFiles` to only `.ts`, `.tsx`, `.js`, and `.jsx` files.

  **Bug 2 — Files with `isIndexable: false` still appeared in barrels**: `getBarrelFilesNamed()` fell back to `export *` for files whose sources all had `isIndexable: false`, causing internal files like `.kubb/config.ts` to appear in every root barrel. Fixed by skipping such files entirely; the wildcard fallback is now only used when a file has _no_ sources at all (i.e. its exports are unknown). The same skip logic is now also applied in `getBarrelFilesAll()`.

  **Bug 3 — `output.extension` mapping not applied to barrel export paths**: `toRelativeModulePath` was stripping the `.ts` extension from every export path, so `@kubb/parser-ts` never saw an extension to map (e.g. `.ts` → `.js` for ESM output). Fixed by preserving the source extension in `toRelativeModulePath`. The `collectPropagatedBarrels` helper was also updated to reference sub-directory barrel files as `index.ts` (via `BARREL_FILENAME`) instead of the extensionless `index` (via `BARREL_BASENAME`), so the same mapping is applied correctly in propagate mode.

- Updated dependencies []:
  - @kubb/core@5.0.0-alpha.58

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
