---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/oas': patch
'@kubb/plugin-oas': patch
---

Extract node-native and pure-TypeScript utilities into `@kubb/utils`.

The following utilities have been moved from `@kubb/core`, `@kubb/cli`, and `@kubb/plugin-oas` into the private `@kubb/utils` package and are now bundled into each consumer at build time:

- **`@kubb/core`** → `@kubb/utils`: `clean`, `exists`/`existsSync`, `read`/`readSync`, `write`, `getRelativePath` (fs utilities), `formatHrtime`/`formatMs`/`getElapsedMs`, `spawnAsync`, `executeIfOnline`/`isOnline`, `canUseTTY`/`isCIEnvironment`/`isGitHubActions`, `serializePluginOptions`
- **`@kubb/cli`** → `@kubb/utils`: `randomCliColor`/`randomColors`, `formatMsWithColor`, `toError`/`getErrorMessage`/`toCause`
- **`@kubb/plugin-oas`** → `@kubb/oas`: `resolveServerUrl` (moved to `@kubb/oas` as it depends on OAS types)

The `@kubb/core/fs` and `@kubb/core/utils` subpath exports have been removed. All symbols previously accessible via these subpaths are now exported from the main `@kubb/core` entry point.

Consumers that imported from `@kubb/core/fs` or `@kubb/core/utils` should update their imports to use `@kubb/core` directly.
