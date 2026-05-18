# Changelog

## v5.0.0-beta.17 — May 18, 2026

### kubb

#### Features

- Add `@kubb/mcp` as a direct dependency so `kubb mcp` works out of the box without a separate install step. ([#3317](https://github.com/kubb-labs/kubb/pull/3317), [`4066e7a`](https://github.com/kubb-labs/kubb/commit/4066e7a776d4420960d487ab43a9c3e9851335ec))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.16 — May 18, 2026

### @kubb/core

#### Features

- Add `FileProcessor.stream()` and per-plugin incremental file flushing.
  
  ## `FileProcessor.stream()`
  
  New async generator that yields one `ParsedFile` at a time instead of batching all files through `pLimit` + `AsyncEventEmitter`.
  
  `run()` now delegates to `stream()` internally, removing duplicated parse logic and the `mode: 'sequential' | 'parallel'` option (the concurrency cap has been removed along with the `p-limit` dependency).
  
  ```ts
  import { FileProcessor, type ParsedFile } from '@kubb/core'
  
  const fp = new FileProcessor()
  
  for await (const { file, source, processed, total } of fp.stream(files)) {
    console.log(`[${processed}/${total}] ${file.path}`)
    if (source) await storage.setItem(file.path, source)
  }
  ```
  
  New exports:
  - `stream(files, options?)` — async generator on `FileProcessor`
  - `ParsedFile` — type yielded by `stream`: `{ file, source, processed, total, percentage }`
  
  ## Per-plugin incremental flushing
  
  `safeBuild()` now flushes files after each plugin rather than once at the end. A path snapshot is taken before each plugin runs; after the plugin completes (including `kubb:plugin:end` handlers), only files whose paths were not in the snapshot are written. Files shared across plugins remain in the queue and are written at the final flush.
  
  For a 4-plugin, 200-files-per-plugin build this means parsed strings from plugin N are eligible for GC before plugin N+1 begins.
  
  ## Performance vs the previous `run()` parallel approach (petStore + 4 plugins, `memoryStorage`)
  
  | Metric | before | after | delta |
  |---|---|---|---|
  | Throughput (ops/s) | 257,431 | 297,416 | **+15.5%** |
  | Mean latency (ms) | 0.0039 | 0.0034 | **−13%** |
  | First-write latency (ops/s) | 234,442 | 280,272 | **+19.6%** |
  | p999 tail latency (ms) | 0.0575 | 0.0374 | **−35%** |
  
  ## Removed
  
  - `p-limit` dependency from `@kubb/core` (and its bundled `yocto-queue`)
  - `PARALLEL_CONCURRENCY_LIMIT` constant
  - `mode: 'sequential' | 'parallel'` option from `FileProcessor.run()` ([#3310](https://github.com/kubb-labs/kubb/pull/3310), [`7dffff1`](https://github.com/kubb-labs/kubb/commit/7dffff1b4e980be28dab7018264437c494155cc3))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.15 — May 17, 2026

### @kubb/ast

#### Features

- Performance improvements for large OpenAPI specs.
  
  - **`@kubb/ast`**: Add `mergeAdjacentObjectsLazy` generator for lazy stateful merging of adjacent allOf object schemas. Memoize `collectReferencedSchemaNames` with a `WeakMap` so repeated callers pay the tree-walk cost only once per schema node.
  - **`@kubb/core`**: Parallelize per-node generator dispatch with `Promise.all` so schema and operation generators run concurrently. Defer file writes to a single flush after all plugins complete instead of flushing after each plugin. Convert `fsStorage` directory walk to an async generator for streaming filesystem traversal.
  - **`@kubb/adapter-oas`**: Replace `flatMap` content-type loop with a `for`/`push` pattern (7× faster for the typical 2–4 content-type case).
  - **`@kubb/parser-ts`**: Fix British-English spellings in JSDoc comments (`normalising` → `normalizing`, `neutralise` → `neutralize`). ([#3305](https://github.com/kubb-labs/kubb/pull/3305), [`62f72dd`](https://github.com/kubb-labs/kubb/commit/62f72dde26cc2da6f77b24ca54c9ca74a32c577f))

### @kubb/cli

#### Bug Fixes

- Show live progress for formatter, linter, and custom hooks in the CLI.
  
  Previously, hook commands (linting, formatting, and custom `hooks.done`) ran with no visible indication of activity — the CLI showed only a "started" intro and a "completed" outro, with the actual execution blocking silently between them. The clack logger now renders a live `taskLog` per hook that streams the subprocess output while it runs, and finalizes with a duration on success or keeps the log open with the error on failure. ([#3306](https://github.com/kubb-labs/kubb/pull/3306), [`dfa488a`](https://github.com/kubb-labs/kubb/commit/dfa488a42d5fac355b2f3312e56aa084ffffe653))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.14 — May 16, 2026

### @kubb/ast

#### Features

- Use generator functions for lazy AST traversal.
  
  `collectLazy()` is now exported from `@kubb/ast`. It is a generator version of `collect()` that yields results one by one without materializing an intermediate array. `collect()` is unchanged and still returns `Array<T>`.
  
  `getChildren()` and `collectRefs()` are converted to generators internally, removing per-node temporary array allocations during traversal.
  
  `containsCircularRef()` uses `collectLazy()` with an early-exit loop and stops at the first matching circular ref instead of traversing the full subtree. ([#3301](https://github.com/kubb-labs/kubb/pull/3301), [`647207f`](https://github.com/kubb-labs/kubb/commit/647207f135ae95f3b5bfcb67815eeea46954cfb8))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.13 — May 16, 2026

### @kubb/cli

#### Bug Fixes

- Fix multiple configs in `defineConfig` array stopping after the first failure.
  
  Two bugs caused only one schema to be processed when using `defineConfig` with an array of configs:
  
  1. **`@kubb/cli`**: `process.exit(1)` was called immediately when any config failed, killing the process before remaining configs could run. Each config is now processed independently; the process exits with code 1 after all configs complete if any failed.
  
  2. **`@kubb/core`**: Middleware hooks registered during `setup()` were never removed from the shared `hooks` instance between config runs, causing N middleware instances to fire for the N-th config and producing duplicate output. Middleware listeners are now tracked and removed via `SetupResult.dispose()` at the end of each build. ([#3297](https://github.com/kubb-labs/kubb/pull/3297), [`d66969f`](https://github.com/kubb-labs/kubb/commit/d66969f52bb22ea417d931dc608c885a733c086b))

### @kubb/middleware-barrel

#### Features

- `getBarrelFiles` now returns a `Generator<FileNode>` instead of `Array<FileNode>`.
  
  Iterate with `for...of` or spread into an array to preserve existing behaviour:
  
  ```ts
  // before
  const files = getBarrelFiles({ ... })
  
  // after — iterate incrementally
  for (const file of getBarrelFiles({ ... })) { ... }
  
  // after — spread to get an array
  const files = [...getBarrelFiles({ ... })]
  ``` ([#3294](https://github.com/kubb-labs/kubb/pull/3294), [`164881b`](https://github.com/kubb-labs/kubb/commit/164881b1cb18849b9f5491019971cf3f34c4f5ea))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.12 — May 15, 2026

### @kubb/adapter-oas

#### Bug Fixes

- **Performance: memoize `$ref` resolution within `parse()`**
  
  `resolvedRefCache` — within a single `parse()` call, each `$ref` is now resolved at most once. Previously, a shared schema referenced from dozens of top-level schemas caused exponential sub-tree re-expansion. Stripe (~1 400 schemas) went from OOM at 8 GB to ~840 ms / ~15 MB. ([#3293](https://github.com/kubb-labs/kubb/pull/3293), [`3f5504b`](https://github.com/kubb-labs/kubb/commit/3f5504b689106063480f72fd1d18bca742613189))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.11 — May 14, 2026

### @kubb/ast

#### Features

- Reduce peak memory by leaning on the existing `Storage` abstraction.
  
  `BuildOutput.sources`, `Kubb.sources`, and the `kubb:generation:end` hook payload no longer expose an in-memory `Map<string, string>` containing every rendered source string. They now expose a read-through `Storage` view scoped to the files written during the build and backed by `config.storage` (defaults to `fsStorage()`), so generated source bytes are not duplicated in memory.
  
  Read a generated source on demand with the existing `Storage` API:
  
  ```ts
  const { storage } = await kubb.safeBuild()
  const code = await storage.getItem('src/gen/api/getPets.ts')
  const paths = await storage.getKeys()
  ```
  
  `FileManager.dispose()` — clears the per-build FileNode cache. `PluginDriver.dispose()` calls it (and clears `inputNode`) at the end of every build so the parsed adapter graph is released once `kubb:build:end` has fired.
  
  `FileProcessor` now exposes a typed `events` property (`AsyncEventEmitter<FileProcessorEvents>`) with `start`, `update`, and `end` events. The previous `onStart`, `onUpdate`, and `onEnd` callback options have been removed. Subscribe once before calling `run()`:
  
  ```ts
  fileProcessor.events.on('update', ({ file, source }) => {
    // called for every file written
  })
  await fileProcessor.run(files, parseOptions)
  ```
  
  `Kubb.driver` and `Kubb.config` now throw if accessed before `setup()` has been called, instead of returning `undefined`. Both properties are no longer typed as `| undefined`.
  
  Migration:
  
  - `BuildOutput.sources` → `BuildOutput.storage` (type changes from `Map<string, string>` to `Storage`).
  - `KubbGenerationEndContext.files` has been removed; use `await storage.getKeys()` to enumerate the generated file paths.
  - Listeners of `kubb:generation:end` that previously called `sources.get(path)` synchronously must now `await storage.getItem(path)`.
  - The `kubb:generation:end` WebSocket payload (agent) no longer includes `files`; file paths are available as `Object.keys(storage)`.
  - `FileProcessor.run()` no longer accepts `onStart`, `onUpdate`, or `onEnd` options; attach listeners via `fileProcessor.events.on(...)` before calling `run()`.
  - `Kubb.driver` and `Kubb.config` are now non-optional — accessing them before `setup()` throws `Error('[kubb] setup() must be called before accessing …')`. ([#3285](https://github.com/kubb-labs/kubb/pull/3285), [`ec10ea8`](https://github.com/kubb-labs/kubb/commit/ec10ea83338d1b316402ea3a3040d8c177b3f3a9))

### @kubb/core

#### Bug Fixes

- Further reduce peak memory and redundant work during code generation.
  
  - **Per-plugin streaming writes**: files are written to `config.storage` after each plugin completes instead of all at once at the end of the build. Already-written files are skipped on subsequent flushes via a `writtenPaths` set.
  - **`PARALLEL_CONCURRENCY_LIMIT` lowered from 100 → 16** — each flush only processes the files one plugin generated. 16 in-flight tasks bounds the number of `CodeNode` trees alive during rendering; I/O latency is the bottleneck so higher values offer no meaningful throughput improvement.
  - **`PluginDriver.dispose()` now clears `#resolvers` and `#defaultResolvers`** so resolver closures (which may capture plugin options) are released when the driver is disposed at the end of a build.
  - **`createSourcesView.getKeys(base)` avoids materialising the full key array** before filtering — it now iterates the `Set` directly and only allocates the result array. ([#3285](https://github.com/kubb-labs/kubb/pull/3285), [`0752d86`](https://github.com/kubb-labs/kubb/commit/0752d86904b11a52ec69dfc34e4dd21b01a8db6e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.10 — May 12, 2026

### @kubb/ast

#### Bug Fixes

- Resolve this for ast ([`7a6ba31`](https://github.com/kubb-labs/kubb/commit/7a6ba31b03dd4ccb313a37a273a153e85ce0ed44))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.9 — May 12, 2026

### @kubb/core

#### Bug Fixes

- add ThisType to resolver type ([`54e54b4`](https://github.com/kubb-labs/kubb/commit/54e54b449f71badb0af72f65c3686ffb2168aad5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.8 — May 12, 2026

### @kubb/parser-ts

#### Bug Fixes

- Extract utility functions from `parserTs.ts` into a dedicated `utils.ts` module for improved testability. No public API changes. ([`0558297`](https://github.com/kubb-labs/kubb/commit/0558297712facdcd821529d8cdc0dc160b405c90))

### @kubb/renderer-jsx

#### Breaking Changes

- Remove `createRenderer` export from `@kubb/renderer-jsx`. Use `jsxRenderer()` directly to obtain a renderer instance instead.
  
  ```ts
  // Before
  import { createRenderer } from '@kubb/renderer-jsx'
  const renderer = createRenderer()
  
  // After
  import { jsxRenderer } from '@kubb/renderer-jsx'
  const renderer = jsxRenderer()
  ```
  
  `jsxRenderer` is now a plain factory function with no dependency on `@kubb/core`, which resolves the circular package dependency between `@kubb/renderer-jsx` and `@kubb/core`. ([`0558297`](https://github.com/kubb-labs/kubb/commit/0558297712facdcd821529d8cdc0dc160b405c90))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.7 — May 12, 2026

### @kubb/cli

#### Bug Fixes

- Refactor CLI runners into per-command folders (`runners/generate/`, `runners/validate/`, `runners/agent/`, `runners/init/`, `runners/mcp/`), each with a dedicated `run.ts` and `utils.ts`. Fixes `import.meta.resolve` build warning in CJS output and corrects a faulty path-traversal guard in `hasPackageJson` that caused CI test failures. ([#3268](https://github.com/kubb-labs/kubb/pull/3268), [`5030b03`](https://github.com/kubb-labs/kubb/commit/5030b030f68cc6a56987ef2ff2a2bcbb295bebd6))

### @kubb/middleware-barrel

#### Bug Fixes

- Align unplugin generation defaults with the main Kubb config flow and declare the middleware barrel AST runtime dependency. ([`2bf409c`](https://github.com/kubb-labs/kubb/commit/2bf409c5f47cb3db8e9d2d8a77d8166125f074c1))

### unplugin-kubb

#### Bug Fixes

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.6 — May 9, 2026

### @kubb/adapter-oas

#### Breaking Changes

- **Breaking change for `@kubb/adapter-oas`**: Remove `parseDocument`, `parseFromConfig`, and `validateDocument` from the public API — these are implementation details that should not be exposed. Use `adapter.validate(input, options?)` instead for validation.
  
  **New feature for `@kubb/core`**: Add required `validate` method to the `Adapter<T>` type so all adapters must implement validation support.
  
  **Internal change for `@kubb/cli`**: Update the `kubb validate` command to use `adapterOas().validate()` instead of the removed standalone functions. ([#3249](https://github.com/kubb-labs/kubb/pull/3249), [`8a666d7`](https://github.com/kubb-labs/kubb/commit/8a666d76519017d0abe25ed35fbce87dbe311815))

### @kubb/agent

#### Bug Fixes

- fix(agent): copy full jiti package in nitro compiled hook so dist/babel.cjs is available in Docker ([`62fb218`](https://github.com/kubb-labs/kubb/commit/62fb218baff1829310a3f423fe8f829808159a4b))

### @kubb/cli

#### Bug Fixes

- **Breaking change for `@kubb/adapter-oas`**: Remove `parseDocument`, `parseFromConfig`, and `validateDocument` from the public API — these are implementation details that should not be exposed. Use `adapter.validate(input, options?)` instead for validation.
  
  **New feature for `@kubb/core`**: Add required `validate` method to the `Adapter<T>` type so all adapters must implement validation support.
  
  **Internal change for `@kubb/cli`**: Update the `kubb validate` command to use `adapterOas().validate()` instead of the removed standalone functions. ([#3249](https://github.com/kubb-labs/kubb/pull/3249), [`8a666d7`](https://github.com/kubb-labs/kubb/commit/8a666d76519017d0abe25ed35fbce87dbe311815))
- **@kubb/mcp**: Replace `@modelcontextprotocol/sdk` with `tmcp` for full TypeScript inference from Zod schemas. Add `validate` and `init` MCP tools alongside the existing `generate` tool. Export `createMcpServer` for platform integration. Add HTTP transport support via `--port` flag.
  
  **@kubb/cli**: Add `--port` (`-p`) and `--host` options to the `mcp` command for HTTP MCP server mode (omit both for stdio). ([#3254](https://github.com/kubb-labs/kubb/pull/3254), [`5fa651a`](https://github.com/kubb-labs/kubb/commit/5fa651a2fac316b621fe27beb78e6241c8c00fb0))
- Make `@kubb/adapter-oas` an optional peer dependency of `@kubb/cli` for the `kubb validate` command.
  
  The CLI now lazy-loads `@kubb/adapter-oas` only when validation runs and shows install guidance when that package is not available. ([#3247](https://github.com/kubb-labs/kubb/pull/3247), [`38f92e9`](https://github.com/kubb-labs/kubb/commit/38f92e97ea1af1cac2539edb9378d468c4c42588))

### @kubb/core

#### Features

- **Breaking change for `@kubb/adapter-oas`**: Remove `parseDocument`, `parseFromConfig`, and `validateDocument` from the public API — these are implementation details that should not be exposed. Use `adapter.validate(input, options?)` instead for validation.
  
  **New feature for `@kubb/core`**: Add required `validate` method to the `Adapter<T>` type so all adapters must implement validation support.
  
  **Internal change for `@kubb/cli`**: Update the `kubb validate` command to use `adapterOas().validate()` instead of the removed standalone functions. ([#3249](https://github.com/kubb-labs/kubb/pull/3249), [`8a666d7`](https://github.com/kubb-labs/kubb/commit/8a666d76519017d0abe25ed35fbce87dbe311815))

### @kubb/mcp

#### Features

- **@kubb/mcp**: Replace `@modelcontextprotocol/sdk` with `tmcp` for full TypeScript inference from Zod schemas. Add `validate` and `init` MCP tools alongside the existing `generate` tool. Export `createMcpServer` for platform integration. Add HTTP transport support via `--port` flag.
  
  **@kubb/cli**: Add `--port` (`-p`) and `--host` options to the `mcp` command for HTTP MCP server mode (omit both for stdio). ([#3254](https://github.com/kubb-labs/kubb/pull/3254), [`5fa651a`](https://github.com/kubb-labs/kubb/commit/5fa651a2fac316b621fe27beb78e6241c8c00fb0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.5 — May 6, 2026

### @kubb/agent

#### Bug Fixes

- Add `@kubb/parser-ts` to the default `KUBB_PACKAGES` build ARG in the agent Dockerfile.
  
  `kubb.config.ts` files that import `@kubb/parser-ts` (e.g. to use `parserTs`) would fail at runtime inside the Docker container with `Cannot find package '@kubb/parser-ts'` because the package was not explicitly listed in the installer stage. It is now included alongside the other Kubb packages. ([#3233](https://github.com/kubb-labs/kubb/pull/3233), [`23d60be`](https://github.com/kubb-labs/kubb/commit/23d60bef6ac3d14100efd7b39de85f1b4cc23cce))
- Fix Docker build failure on distroless image by replacing `RUN chown` (requires a shell) with `--chown` flags on `COPY` instructions. ([#3231](https://github.com/kubb-labs/kubb/pull/3231), [`2fe62b5`](https://github.com/kubb-labs/kubb/commit/2fe62b5d8ae26f14acb44fe072608a2945736cbf))
- Replace `unrun` with `jiti` for loading TypeScript config files at runtime. `jiti` is pure JavaScript (no native binaries), eliminating platform-specific `.node` binding errors when running on `linux-arm64` or other architectures that differ from the build host. ([`ea3233b`](https://github.com/kubb-labs/kubb/commit/ea3233b3aaba0c713eaddd94be787dfe2af9ead4))

### @kubb/cli

#### Bug Fixes

- Replace `unrun` with `jiti` for loading TypeScript config files at runtime. `jiti` is pure JavaScript (no native binaries), eliminating platform-specific `.node` binding errors when running on `linux-arm64` or other architectures that differ from the build host. ([`ea3233b`](https://github.com/kubb-labs/kubb/commit/ea3233b3aaba0c713eaddd94be787dfe2af9ead4))

### @kubb/mcp

#### Bug Fixes

- Replace `unrun` with `jiti` for loading TypeScript config files at runtime. `jiti` is pure JavaScript (no native binaries), eliminating platform-specific `.node` binding errors when running on `linux-arm64` or other architectures that differ from the build host. ([`ea3233b`](https://github.com/kubb-labs/kubb/commit/ea3233b3aaba0c713eaddd94be787dfe2af9ead4))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.4 — May 3, 2026

### @kubb/adapter-oas

#### Features

- Each package now ships an `extension.yaml` file with its npm release.
  
  - `adapter-oas` → `extension.yaml` (`kind: adapter`)
  - `middleware-barrel` → `extension.yaml` (`kind: middleware`)
  - `parser-ts` → `extension.yaml` (`kind: parser`)
  
  Each file is a self-contained extension manifest: it describes the package's options, examples, and resources, and references the unified `extension.json` schema for IDE validation. Third-party adapters, middlewares, and parsers follow the same pattern — one `extension.yaml` per package with the appropriate `kind` field. ([#3224](https://github.com/kubb-labs/kubb/pull/3224), [`0542031`](https://github.com/kubb-labs/kubb/commit/054203191e62b5035a1f731a1e1d2d13e1b174f0))

### @kubb/core

#### Features

- Make `adapter` and `input` optional in `Config` and `UserConfig` to support plugin-only mode.
  
  When `adapter` is omitted, Kubb skips the spec parse phase and runs in plugin-only mode:
  - `kubb:plugin:setup` fires normally — `injectFile` works as usual
  - Files injected via `injectFile` are written through storage as usual
  - `kubb:build:start` is **not** emitted (no `inputNode`)
  - `kubb:generate:schema` / `kubb:generate:operation` are never emitted
  
  This enables scripts that use Kubb purely for its file-management layer without needing a dummy OpenAPI spec.
  
  ```ts
  // before — a dummy spec was required even for file-injection-only scripts
  export default defineConfig({
    input: { path: './dummy.yaml' },
    output: { path: '.' },
    adapter: adapterOas(),
    plugins: [myFilePlugin()],
  })
  
  // after — adapter and input can be omitted entirely
  export default defineConfig({
    output: { path: '.' },
    plugins: [myFilePlugin()],
  })
  ```
  
  When `adapter` is set but `input` is omitted, a clear runtime error is thrown: `[kubb] input is required when using an adapter`. ([#3226](https://github.com/kubb-labs/kubb/pull/3226), [`81fbfae`](https://github.com/kubb-labs/kubb/commit/81fbfae1347bd63e1f91b2aca1f9fb14d157f85f))

### @kubb/middleware-barrel

#### Features

- Each package now ships an `extension.yaml` file with its npm release.
  
  - `adapter-oas` → `extension.yaml` (`kind: adapter`)
  - `middleware-barrel` → `extension.yaml` (`kind: middleware`)
  - `parser-ts` → `extension.yaml` (`kind: parser`)
  
  Each file is a self-contained extension manifest: it describes the package's options, examples, and resources, and references the unified `extension.json` schema for IDE validation. Third-party adapters, middlewares, and parsers follow the same pattern — one `extension.yaml` per package with the appropriate `kind` field. ([#3224](https://github.com/kubb-labs/kubb/pull/3224), [`0542031`](https://github.com/kubb-labs/kubb/commit/054203191e62b5035a1f731a1e1d2d13e1b174f0))

### @kubb/parser-ts

#### Features

- Each package now ships an `extension.yaml` file with its npm release.
  
  - `adapter-oas` → `extension.yaml` (`kind: adapter`)
  - `middleware-barrel` → `extension.yaml` (`kind: middleware`)
  - `parser-ts` → `extension.yaml` (`kind: parser`)
  
  Each file is a self-contained extension manifest: it describes the package's options, examples, and resources, and references the unified `extension.json` schema for IDE validation. Third-party adapters, middlewares, and parsers follow the same pattern — one `extension.yaml` per package with the appropriate `kind` field. ([#3224](https://github.com/kubb-labs/kubb/pull/3224), [`0542031`](https://github.com/kubb-labs/kubb/commit/054203191e62b5035a1f731a1e1d2d13e1b174f0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.3 — Apr 30, 2026

### @kubb/ast

#### Bug Fixes

- Fixed `combineImports` producing duplicate object-named import specifiers.
  
  `Set`-based deduplication failed for object import names (e.g. `{ propertyName: 'fakerDE', name: 'faker' }`) because JavaScript compares objects by reference. When the same aliased specifier appeared in multiple `ImportNode`s for the same path, the merged result contained duplicate entries.
  
  The fix memoizes object import names inside `combineImports` so that identical `(propertyName, name)` pairs always reuse the same object reference, allowing `Set.add` to correctly recognise and skip duplicates. ([#3217](https://github.com/kubb-labs/kubb/pull/3217), [`4759c9c`](https://github.com/kubb-labs/kubb/commit/4759c9c2cc83e60a93c8dacec4fc9da18852e027))

### @kubb/cli

#### Bug Fixes

- Reduce default install size by moving `@kubb/agent` and `@kubb/mcp` to optional `peerDependencies`. The CLI never imports them at runtime — they expose their own `kubb-mcp` / agent entry points. Install them explicitly when needed:
  
  ```bash
  npm i @kubb/mcp     # for the MCP server
  npm i @kubb/agent   # for the HTTP agent
  ``` ([#3215](https://github.com/kubb-labs/kubb/pull/3215), [`9ecce54`](https://github.com/kubb-labs/kubb/commit/9ecce5432a26a3e3e91addb2af3f76fb2554e621))

### kubb

#### Bug Fixes

- Reduce default install size by moving `@kubb/agent` and `@kubb/mcp` to optional `peerDependencies`. The CLI never imports them at runtime — they expose their own `kubb-mcp` / agent entry points. Install them explicitly when needed:
  
  ```bash
  npm i @kubb/mcp     # for the MCP server
  npm i @kubb/agent   # for the HTTP agent
  ``` ([#3215](https://github.com/kubb-labs/kubb/pull/3215), [`9ecce54`](https://github.com/kubb-labs/kubb/commit/9ecce5432a26a3e3e91addb2af3f76fb2554e621))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.2 — Apr 30, 2026

### @kubb/adapter-oas

#### Features

- Change the default value of `integerType` from `'number'` to `'bigint'`.
  
  `int64` fields in OpenAPI specs are now mapped to `bigint` by default. To preserve the previous behaviour, set `integerType: 'number'` explicitly in your adapter options. ([#3209](https://github.com/kubb-labs/kubb/pull/3209), [`9e90cbb`](https://github.com/kubb-labs/kubb/commit/9e90cbb2d0ded12d839739b9a13ab15532d38541))

### @kubb/ast

#### Features

- Fix `include` filter not preventing generation of component schemas from excluded operations.
  
  When `include` contains operation-based filters (`tag`, `operationId`, `path`, `method`, or `contentType`), only the schemas transitively referenced by the included operations are now generated. Schemas that are only used by excluded operations are silently skipped.
  
  **New `@kubb/ast` export: `collectUsedSchemaNames`**
  
  ```ts
  import { collectUsedSchemaNames } from '@kubb/ast'
  
  // Returns the set of top-level schema names reachable from the given operations.
  const allowed = collectUsedSchemaNames(includedOperations, inputNode.schemas)
  ```
  
  **Before** (all schemas generated regardless of `include`):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  ├── ItemsResponse.ts  ✅
  ├── OrderStatus.ts    ❌ generated even though getOrders is excluded
  └── OrdersResponse.ts ❌ generated even though getOrders is excluded
  ```
  
  **After** (only schemas reachable from included operations):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  └── ItemsResponse.ts  ✅
  ```
  
  > [!NOTE]
  > When `include` contains a `schemaName` filter alongside operation filters, the new schema-scoping logic is disabled and `schemaName` rules apply instead. ([#3208](https://github.com/kubb-labs/kubb/pull/3208), [`3cd3a09`](https://github.com/kubb-labs/kubb/commit/3cd3a0984c5cd6c77bc771d791b401e134f2003a))

#### Bug Fixes

- Fixed `combineImports` incorrectly tree-shaking aliased named imports.
  
  When an import uses a local alias (e.g. `import { fakerDE as faker } from '@faker-js/faker'`), the used-check now tests the alias (`faker`) rather than the original export name (`fakerDE`). Previously, any aliased import whose propertyName did not appear verbatim in the generated source was silently dropped, leaving files with no import at all. ([#3212](https://github.com/kubb-labs/kubb/pull/3212), [`0e5bfaa`](https://github.com/kubb-labs/kubb/commit/0e5bfaabbced0e67ba560fda5bf6b3c380b63258))

### @kubb/core

#### Bug Fixes

- Fix `include` filter not preventing generation of component schemas from excluded operations.
  
  When `include` contains operation-based filters (`tag`, `operationId`, `path`, `method`, or `contentType`), only the schemas transitively referenced by the included operations are now generated. Schemas that are only used by excluded operations are silently skipped.
  
  **New `@kubb/ast` export: `collectUsedSchemaNames`**
  
  ```ts
  import { collectUsedSchemaNames } from '@kubb/ast'
  
  // Returns the set of top-level schema names reachable from the given operations.
  const allowed = collectUsedSchemaNames(includedOperations, inputNode.schemas)
  ```
  
  **Before** (all schemas generated regardless of `include`):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  ├── ItemsResponse.ts  ✅
  ├── OrderStatus.ts    ❌ generated even though getOrders is excluded
  └── OrdersResponse.ts ❌ generated even though getOrders is excluded
  ```
  
  **After** (only schemas reachable from included operations):
  
  ```
  types/
  ├── ItemStatus.ts     ✅
  └── ItemsResponse.ts  ✅
  ```
  
  > [!NOTE]
  > When `include` contains a `schemaName` filter alongside operation filters, the new schema-scoping logic is disabled and `schemaName` rules apply instead. ([#3208](https://github.com/kubb-labs/kubb/pull/3208), [`3cd3a09`](https://github.com/kubb-labs/kubb/commit/3cd3a0984c5cd6c77bc771d791b401e134f2003a))

### @kubb/middleware-barrel

#### Breaking Changes

- Refactor middleware-barrel API from string-based `barrelType` to object-based `barrel` configuration.
  
  **Breaking Changes:**
  
  - `barrelType` option replaced with `barrel` object at both config and plugin levels
  - `barrelType: 'propagate'` replaced with `barrel: { type: 'all' | 'named', nested: true }`
  - Root config: `barrel?: { type: 'all' | 'named' } | false`
  - Plugin level: `barrel?: { type: 'all' | 'named', nested?: boolean } | false`
  
  **Migration Guide:**
  
  ```ts
  // Before
  export default defineConfig({
    output: { path: 'src/gen', barrelType: 'named' },
    plugins: [
      pluginTs({ output: { path: 'types', barrelType: 'all' } }),
      pluginZod({ output: { path: 'schemas', barrelType: 'propagate' } }),
    ],
    middleware: [middlewareBarrel()],
  })
  
  // After
  export default defineConfig({
    output: { path: 'src/gen', barrel: { type: 'named' } },
    plugins: [
      pluginTs({ output: { path: 'types', barrel: { type: 'all' } } }),
      pluginZod({ output: { path: 'schemas', barrel: { type: 'all', nested: true } } }),
    ],
    middleware: [middlewareBarrel()],
  })
  ```
  
  **New Features:**
  
  - Explicit `nested` option for hierarchical barrel generation at plugin level
  - Clearer separation of export strategy (`type`) from structure (`nested`)
  - Better type safety with distinct `BarrelConfig` and `PluginBarrelConfig` types
  - `nested` parameter in `getBarrelFiles` for fine-grained control ([#3200](https://github.com/kubb-labs/kubb/pull/3200), [`3519370`](https://github.com/kubb-labs/kubb/commit/35193705080f85f60bbb20d4e525724a9f19a3c4))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.1 — Apr 29, 2026

### kubb

#### Bug Fixes

- Update packages ([`c17c092`](https://github.com/kubb-labs/kubb/commit/c17c0926ac211bbf77ec82eae68fd3d44fd0baad))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)
