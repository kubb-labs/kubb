# Changelog

## v5.0.0-beta.21 — May 20, 2026

### @kubb/ast

#### Features

- Standardize `null` vs `undefined` across the codebase: Kubb-controlled "absent" or "skip" states now use `null` explicitly; `undefined` is reserved for optional TypeScript properties and external/user-supplied values.
  
  ## Breaking changes
  
  ### `@kubb/ast`
  
  **`narrowSchema`** now returns `T | null` instead of `T | undefined` when the node type does not match.
  
  ```ts
  // Before
  const objectNode = narrowSchema(node, 'object') // ObjectSchemaNode | undefined
  
  // After
  const objectNode = narrowSchema(node, 'object') // ObjectSchemaNode | null
  ```
  
  **`collectImports`** `resolve` callback must return `TImport | null` (instead of `TImport | undefined`) to skip an import.
  
  ```ts
  // Before
  collectImports({ node, nameMapping, resolve: (name) => undefined })
  
  // After
  collectImports({ node, nameMapping, resolve: (name) => null })
  ```
  
  **`CollectVisitor<T>`** callbacks may now return `T | null | undefined`; both `null` and `undefined` are treated as "skip this node".
  
  **`RefSchemaNode.schema`** is now `SchemaNode | null | undefined` — `null` means the ref was resolved but circular or unresolvable; `undefined` means resolution was not attempted.
  
  **`keysToOmit`** on `RequestBodyContent` and `ResponseNode` now accepts `Array<string> | null`.
  
  **`InputMeta.baseURL`** is now `string | null`.
  
  ### `@kubb/core`
  
  **`FileManager.setOnUpsert`** now accepts `null` to detach the callback (previously `undefined`).
  
  ### `@kubb/adapter-oas`
  
  **`resolveBaseUrl`** now returns `string | null` (previously `string | undefined`) when `serverIndex` is omitted or out of range. ([#3334](https://github.com/kubb-labs/kubb/pull/3334), [`2164a73`](https://github.com/kubb-labs/kubb/commit/2164a738f367cf04436be21c4000b68eb1c4e7a5))

### @kubb/core

#### Features

- Performance improvements and event API cleanup in `KubbDriver` and `FileManager`.
  
  ## Breaking changes
  
  `kubb:file:processing:update` (singular, fired once per file) is replaced by `kubb:files:processing:update` (plural, fired once per flush chunk with a `files` array). Update any listener from:
  
  ```ts
  hooks.on('kubb:file:processing:update', ({ file, source, processed, total, percentage, config }) => {
    // handle one file
  })
  ```
  
  to:
  
  ```ts
  hooks.on('kubb:files:processing:update', ({ files }) => {
    for (const { file, source, processed, total, percentage, config } of files) {
      // handle each file
    }
  })
  ```
  
  `KubbFileProcessingUpdateContext` is renamed to `KubbFileProcessingUpdate` (the per-item type). A new `KubbFilesProcessingUpdateContext` wraps `files: Array<KubbFileProcessingUpdate>`.
  
  ## Performance improvements
  
  - `FileManager` sorts lazily: the sorted view is rebuilt from `#cache` only when `files` is read, not on every `add`/`upsert`. Upserts are now O(1) with a single `null` assignment to mark the view stale.
  - `FileManager.#store` fast-paths single-file calls (the common case) — skips the intermediate deduplication `Map`.
  - `mergeFile` avoids unnecessary array allocations when one side's `sources`/`imports`/`exports` is empty — returns the non-empty reference directly.
  - `createFile` (SHA-256 + import/export combining) is skipped for new files that don't require merging with an existing cache entry.
  - `kubb:generate:schema` and `kubb:generate:operation` are gated on `listenerCount` — for builds with no listeners on these channels the per-node emit overhead is eliminated entirely.
  - `FileProcessor` is a long-lived class field on `KubbDriver` rather than a per-`run()` scoped resource.
  - `dispose()` methods added to `FileProcessor`, `Kubb`, and `Renderer` implementations, with `[Symbol.dispose]()` delegating to them consistently across the codebase. ([#3334](https://github.com/kubb-labs/kubb/pull/3334), [`2164a73`](https://github.com/kubb-labs/kubb/commit/2164a738f367cf04436be21c4000b68eb1c4e7a5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.20 — May 20, 2026

### @kubb/adapter-oas

#### Features

- All OpenAPI specs now go through the streaming path, removing the size-based threshold that previously switched between eager and lazy parsing.
  
  The adapter's internal streaming logic is extracted into a dedicated `stream.ts` module (`preScan`, `createInputStream`, `resolveBaseUrl`) so it can be tested in isolation without going through the full adapter pipeline.
  
  `preScan` and the other internal `ensure*` helpers each run at most once per adapter instance. Concurrent callers (e.g. `stream()` and `parse()` called simultaneously) share the same in-flight work and cannot trigger duplicate parses or validation passes. ([#3331](https://github.com/kubb-labs/kubb/pull/3331), [`fd3a585`](https://github.com/kubb-labs/kubb/commit/fd3a585d5fd1052177d999d7ce030412b76b2bf1))

### @kubb/ast

#### Features

- `InputMeta` gains two pre-computed fields that plugins previously had to derive themselves by iterating the full schema list.
  
  - `circularNames` — names of schemas that participate in a circular reference chain. Replaces calling `ast.findCircularSchemas(inputNode.schemas)` inside each plugin.
  - `enumNames` — names of every enum schema in the document. Replaces filtering the schema stream by type.
  
  Both fields are plain `readonly string[]` arrays, keeping `InputMeta` fully JSON-serializable.
  
  `GeneratorContext` now exposes `meta: InputMeta` instead of `inputNode: InputNode`. Plugins that previously destructured `inputNode` to access circular or enum information should switch to `ctx.meta.circularNames` and `ctx.meta.enumNames`. ([#3331](https://github.com/kubb-labs/kubb/pull/3331), [`fd3a585`](https://github.com/kubb-labs/kubb/commit/fd3a585d5fd1052177d999d7ce030412b76b2bf1))

### @kubb/core

#### Features

- `KubbDriver` and `createKubb` are cleaned up around the always-stream architecture.
  
  - `STREAM_SCHEMA_THRESHOLD` constant is removed. All builds now go through the streaming code path regardless of spec size.
  - Studio-related state (`source`, `isOpen`, `inputNode`) is consolidated into a single `#studio` object on `KubbDriver` instead of three separate private fields.
  - `runAstPlugin` is removed from `createKubb`. `runPlugins` is the only plugin runner now.
  - Plugin lifecycle events (`kubb:plugin:start`, `kubb:plugin:end`) fire for every plugin, including those without an adapter configured.
  - `middlewareListeners`, `#eventGeneratorPlugins`, and `hasEventGenerators` replace the previous public `middlewareListeners`, `#pluginsWithEventGenerators`, and `hasRegisteredGenerators` for naming consistency.
  - `forBatches` no longer accepts a `flushInterval` option. The `flush` callback now runs after every batch; callers that need coalescing should do so inside their own `flush` implementation. ([#3331](https://github.com/kubb-labs/kubb/pull/3331), [`fd3a585`](https://github.com/kubb-labs/kubb/commit/fd3a585d5fd1052177d999d7ce030412b76b2bf1))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.19 — May 19, 2026

### @kubb/core

#### Bug Fixes

- Significantly reduce per-file overhead in the code-generation pipeline.
  
  - `@kubb/parser-ts` `parse` is now synchronous — returns `string` directly instead of `Promise<string> | string`. `FileProcessor.stream` is a plain `Generator` instead of `AsyncGenerator`, removing a microtask per file. The `emitImport` / `emitExport` string-emit helpers have been removed; import and export statements are generated through the TypeScript compiler API as before.
  - `@kubb/core` `Renderer.stream` now returns `Iterable<FileNode>` only — `AsyncIterable` support has been dropped. `Parser.parse` is typed as `string` (synchronous). Adapter initialisation consolidates the streaming / non-streaming branches, removing a duplicate debug-log path. `flushPendingFiles` removes a dead `snapshot` parameter.
  - `@kubb/adapter-oas` caches the underlying `BaseOas` instance and the schema parser at adapter scope so the schemas and operations iterables share one instance instead of rebuilding indexes per pass.
  - `@kubb/renderer-jsx` `jsxRendererSync` returns a synchronous `Generator` from `stream`, letting consumers skip the per-file microtask. ([#3327](https://github.com/kubb-labs/kubb/pull/3327), [`014004f`](https://github.com/kubb-labs/kubb/commit/014004f5b0036a05b2a9825c3dd657192bae8f8a))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.18 — May 18, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Add format property to SchemaNodeBase. ([#3315](https://github.com/kubb-labs/kubb/pull/3315), [`5d84bad`](https://github.com/kubb-labs/kubb/commit/5d84badfedb7100221a5d3a6e1a109a2f10c54b3))

### @kubb/core

#### Bug Fixes

- Add `Symbol.dispose` support: `FileManager` and `PluginDriver` implement `[Symbol.dispose]()`. `safeBuild()` uses `using` instead of `try/finally`. Fix resource leaks: chokidar watcher closes on `SIGINT`/`SIGTERM`; Studio WebSocket `message` listener removed in `cleanup()`; MCP HTTP server closes gracefully on signal. ([#3321](https://github.com/kubb-labs/kubb/pull/3321), [`03ad8ce`](https://github.com/kubb-labs/kubb/commit/03ad8ce7757bdbe408ed291185424b2f2d9fe5ed))

### @kubb/renderer-jsx

#### Bug Fixes

- Add `jsxRendererSync` — a React-free recursive renderer 2–4× faster than `jsxRenderer`. Add `stream()` for incremental file processing. Node attributes use plain objects instead of `Map`. `jsxRenderer` is unchanged; all new APIs are additive. ([#3319](https://github.com/kubb-labs/kubb/pull/3319), [`6ab3a5e`](https://github.com/kubb-labs/kubb/commit/6ab3a5e97750e7a572a61ffadfb3ccb2ad2b0fe1))

### Contributors

Thanks to everyone who contributed to this release:

[@Ericlm](https://github.com/Ericlm), [@stijnvanhulle](https://github.com/stijnvanhulle)

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

- Add `FileProcessor.stream()` — an async generator that yields one `ParsedFile` at a time. `run()` now delegates to `stream()` internally, removing the `mode: 'sequential' | 'parallel'` option and the `p-limit` dependency. `safeBuild()` now flushes files after each plugin rather than all at once. ([#3310](https://github.com/kubb-labs/kubb/pull/3310), [`7dffff1`](https://github.com/kubb-labs/kubb/commit/7dffff1b4e980be28dab7018264437c494155cc3))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.15 — May 17, 2026

### @kubb/ast

#### Features

- Performance improvements for large OpenAPI specs: add `mergeAdjacentObjectsLazy` for lazy stateful merging of adjacent allOf schemas; memoize `collectReferencedSchemaNames` with a `WeakMap`. ([#3305](https://github.com/kubb-labs/kubb/pull/3305), [`62f72dd`](https://github.com/kubb-labs/kubb/commit/62f72dde26cc2da6f77b24ca54c9ca74a32c577f))

### @kubb/adapter-oas

#### Bug Fixes

- Replace `flatMap` content-type loop with `for`/`push` (7× faster for typical 2–4 content types). ([#3305](https://github.com/kubb-labs/kubb/pull/3305), [`62f72dd`](https://github.com/kubb-labs/kubb/commit/62f72dde26cc2da6f77b24ca54c9ca74a32c577f))

### @kubb/core

#### Features

- Parallelize per-node generator dispatch with `Promise.all`. Convert `fsStorage` directory walk to an async generator for streaming traversal. ([#3305](https://github.com/kubb-labs/kubb/pull/3305), [`62f72dd`](https://github.com/kubb-labs/kubb/commit/62f72dde26cc2da6f77b24ca54c9ca74a32c577f))

### @kubb/cli

#### Bug Fixes

- Show live progress for formatter, linter, and custom hooks in the CLI. The clack logger now renders a live `taskLog` per hook that streams subprocess output while it runs. ([#3306](https://github.com/kubb-labs/kubb/pull/3306), [`dfa488a`](https://github.com/kubb-labs/kubb/commit/dfa488a42d5fac355b2f3312e56aa084ffffe653))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.14 — May 16, 2026

### @kubb/ast

#### Features

- Export `collectLazy()` — a generator version of `collect()` that yields results one at a time without materializing an intermediate array. `getChildren()` and `collectRefs()` are now generators internally. `containsCircularRef()` exits at the first match. ([#3301](https://github.com/kubb-labs/kubb/pull/3301), [`647207f`](https://github.com/kubb-labs/kubb/commit/647207f135ae95f3b5bfcb67815eeea46954cfb8))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.13 — May 16, 2026

### @kubb/cli

#### Bug Fixes

- Fix multiple configs in `defineConfig` array stopping after the first failure. Each config is now processed independently; the process exits with code 1 after all configs complete if any failed. Middleware listeners are tracked and removed via `SetupResult.dispose()` between runs to prevent duplicate output. ([#3297](https://github.com/kubb-labs/kubb/pull/3297), [`d66969f`](https://github.com/kubb-labs/kubb/commit/d66969f52bb22ea417d931dc608c885a733c086b))

### @kubb/middleware-barrel

#### Features

- `getBarrelFiles` now returns a `Generator<FileNode>` instead of `Array<FileNode>`. Iterate with `for...of` or spread with `[...getBarrelFiles({ ... })]`. ([#3294](https://github.com/kubb-labs/kubb/pull/3294), [`164881b`](https://github.com/kubb-labs/kubb/commit/164881b1cb18849b9f5491019971cf3f34c4f5ea))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.12 — May 15, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Memoize `$ref` resolution within `parse()` so each `$ref` is resolved at most once. Stripe (~1 400 schemas) went from OOM at 8 GB to ~840 ms / ~15 MB. ([#3293](https://github.com/kubb-labs/kubb/pull/3293), [`3f5504b`](https://github.com/kubb-labs/kubb/commit/3f5504b689106063480f72fd1d18bca742613189))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.11 — May 14, 2026

### @kubb/ast

#### Features

- Reduce peak memory by leaning on the existing `Storage` abstraction. `BuildOutput.sources` is replaced by `BuildOutput.storage` — a read-through `Storage` view backed by `config.storage`. `FileProcessor` now exposes a typed `events` property with `start`, `update`, and `end` events; the previous `onStart`, `onUpdate`, and `onEnd` callback options are removed. `Kubb.driver` and `Kubb.config` now throw if accessed before `setup()` instead of returning `undefined`. ([#3285](https://github.com/kubb-labs/kubb/pull/3285), [`ec10ea8`](https://github.com/kubb-labs/kubb/commit/ec10ea83338d1b316402ea3a3040d8c177b3f3a9))

### @kubb/core

#### Bug Fixes

- Further reduce peak memory: files are written after each plugin completes and already-written files are skipped via a `writtenPaths` set. `PluginDriver.dispose()` clears `#resolvers` and `#defaultResolvers`. `createSourcesView.getKeys` iterates the `Set` directly instead of materialising the full key array. ([#3285](https://github.com/kubb-labs/kubb/pull/3285), [`0752d86`](https://github.com/kubb-labs/kubb/commit/0752d86904b11a52ec69dfc34e4dd21b01a8db6e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.10 — May 12, 2026

### @kubb/ast

#### Bug Fixes

- Fix `ThisType` augmentation in AST resolver type. ([`7a6ba31`](https://github.com/kubb-labs/kubb/commit/7a6ba31b03dd4ccb313a37a273a153e85ce0ed44))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.9 — May 12, 2026

### @kubb/core

#### Bug Fixes

- Add `ThisType` to core resolver type. ([`54e54b4`](https://github.com/kubb-labs/kubb/commit/54e54b449f71badb0af72f65c3686ffb2168aad5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.8 — May 12, 2026

### @kubb/parser-ts

#### Bug Fixes

- Extract utility functions from `parserTs.ts` into a dedicated `utils.ts` module for improved testability. No public API changes. ([`0558297`](https://github.com/kubb-labs/kubb/commit/0558297712facdcd821529d8cdc0dc160b405c90))

### @kubb/renderer-jsx

#### Breaking Changes

- Remove `createRenderer` export. Use `jsxRenderer()` directly to obtain a renderer instance. `jsxRenderer` is now a plain factory function with no dependency on `@kubb/core`, resolving the circular package dependency. ([`0558297`](https://github.com/kubb-labs/kubb/commit/0558297712facdcd821529d8cdc0dc160b405c90))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.7 — May 12, 2026

### @kubb/cli

#### Bug Fixes

- Refactor CLI runners into per-command folders (`runners/generate/`, `runners/validate/`, etc.), each with a dedicated `run.ts` and `utils.ts`. Fixes `import.meta.resolve` build warning and a faulty path-traversal guard in `hasPackageJson`. ([#3268](https://github.com/kubb-labs/kubb/pull/3268), [`5030b03`](https://github.com/kubb-labs/kubb/commit/5030b030f68cc6a56987ef2ff2a2bcbb295bebd6))

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

- Remove `parseDocument`, `parseFromConfig`, and `validateDocument` from the public API. Use `adapter.validate(input, options?)` instead. ([#3249](https://github.com/kubb-labs/kubb/pull/3249), [`8a666d7`](https://github.com/kubb-labs/kubb/commit/8a666d76519017d0abe25ed35fbce87dbe311815))

### @kubb/agent

#### Bug Fixes

- Fix agent Docker build: copy full jiti package so `dist/babel.cjs` is available at runtime. ([`62fb218`](https://github.com/kubb-labs/kubb/commit/62fb218baff1829310a3f423fe8f829808159a4b))

### @kubb/cli

#### Bug Fixes

- Make `@kubb/adapter-oas` an optional peer dependency for the `kubb validate` command — lazy-loaded only when validation runs. ([#3247](https://github.com/kubb-labs/kubb/pull/3247), [`38f92e9`](https://github.com/kubb-labs/kubb/commit/38f92e97ea1af1cac2539edb9378d468c4c42588))
- Add `--port` (`-p`) and `--host` options to the `mcp` command for HTTP MCP server mode. ([#3254](https://github.com/kubb-labs/kubb/pull/3254), [`5fa651a`](https://github.com/kubb-labs/kubb/commit/5fa651a2fac316b621fe27beb78e6241c8c00fb0))

### @kubb/core

#### Features

- Add required `validate` method to the `Adapter<T>` type so all adapters must implement validation support. ([#3249](https://github.com/kubb-labs/kubb/pull/3249), [`8a666d7`](https://github.com/kubb-labs/kubb/commit/8a666d76519017d0abe25ed35fbce87dbe311815))

### @kubb/mcp

#### Features

- Replace `@modelcontextprotocol/sdk` with `tmcp` for full TypeScript inference from Zod schemas. Add `validate` and `init` MCP tools. Export `createMcpServer`. Add HTTP transport support via `--port` flag. ([#3254](https://github.com/kubb-labs/kubb/pull/3254), [`5fa651a`](https://github.com/kubb-labs/kubb/commit/5fa651a2fac316b621fe27beb78e6241c8c00fb0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.5 — May 6, 2026

### @kubb/agent

#### Bug Fixes

- Add `@kubb/parser-ts` to the default `KUBB_PACKAGES` build ARG in the agent Dockerfile. ([#3233](https://github.com/kubb-labs/kubb/pull/3233), [`23d60be`](https://github.com/kubb-labs/kubb/commit/23d60bef6ac3d14100efd7b39de85f1b4cc23cce))
- Fix Docker build failure on distroless image by replacing `RUN chown` with `--chown` flags on `COPY` instructions. ([#3231](https://github.com/kubb-labs/kubb/pull/3231), [`2fe62b5`](https://github.com/kubb-labs/kubb/commit/2fe62b5d8ae26f14acb44fe072608a2945736cbf))
- Replace `unrun` with `jiti` for loading TypeScript config files at runtime — pure JavaScript, no native binaries. ([`ea3233b`](https://github.com/kubb-labs/kubb/commit/ea3233b3aaba0c713eaddd94be787dfe2af9ead4))

### @kubb/cli

#### Bug Fixes

- Replace `unrun` with `jiti` for loading TypeScript config files at runtime. ([`ea3233b`](https://github.com/kubb-labs/kubb/commit/ea3233b3aaba0c713eaddd94be787dfe2af9ead4))

### @kubb/mcp

#### Bug Fixes

- Replace `unrun` with `jiti` for loading TypeScript config files at runtime. ([`ea3233b`](https://github.com/kubb-labs/kubb/commit/ea3233b3aaba0c713eaddd94be787dfe2af9ead4))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.4 — May 3, 2026

### @kubb/adapter-oas

#### Features

- Ship an `extension.yaml` manifest (`kind: adapter`) describing the package's options, examples, and resources. References the shared `extension.json` schema for IDE validation. ([#3224](https://github.com/kubb-labs/kubb/pull/3224), [`0542031`](https://github.com/kubb-labs/kubb/commit/054203191e62b5035a1f731a1e1d2d13e1b174f0))

### @kubb/core

#### Features

- Make `adapter` and `input` optional in `Config` to support plugin-only mode. When `adapter` is omitted, Kubb skips the spec parse phase and runs using only its file-management layer. ([#3226](https://github.com/kubb-labs/kubb/pull/3226), [`81fbfae`](https://github.com/kubb-labs/kubb/commit/81fbfae1347bd63e1f91b2aca1f9fb14d157f85f))

### @kubb/middleware-barrel

#### Features

- Ship an `extension.yaml` manifest (`kind: middleware`). ([#3224](https://github.com/kubb-labs/kubb/pull/3224), [`0542031`](https://github.com/kubb-labs/kubb/commit/054203191e62b5035a1f731a1e1d2d13e1b174f0))

### @kubb/parser-ts

#### Features

- Ship an `extension.yaml` manifest (`kind: parser`). ([#3224](https://github.com/kubb-labs/kubb/pull/3224), [`0542031`](https://github.com/kubb-labs/kubb/commit/054203191e62b5035a1f731a1e1d2d13e1b174f0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.3 — Apr 30, 2026

### @kubb/ast

#### Bug Fixes

- Fix `combineImports` producing duplicate object-named import specifiers. `Set`-based deduplication failed for object import names because objects are compared by reference; the fix memoizes `(propertyName, name)` pairs so identical specifiers reuse the same object reference. ([#3217](https://github.com/kubb-labs/kubb/pull/3217), [`4759c9c`](https://github.com/kubb-labs/kubb/commit/4759c9c2cc83e60a93c8dacec4fc9da18852e027))

### @kubb/cli

#### Bug Fixes

- Move `@kubb/agent` and `@kubb/mcp` to optional `peerDependencies` to reduce default install size. ([#3215](https://github.com/kubb-labs/kubb/pull/3215), [`9ecce54`](https://github.com/kubb-labs/kubb/commit/9ecce5432a26a3e3e91addb2af3f76fb2554e621))

### kubb

#### Bug Fixes

- Move `@kubb/agent` and `@kubb/mcp` to optional `peerDependencies` to reduce default install size. ([#3215](https://github.com/kubb-labs/kubb/pull/3215), [`9ecce54`](https://github.com/kubb-labs/kubb/commit/9ecce5432a26a3e3e91addb2af3f76fb2554e621))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.2 — Apr 30, 2026

### @kubb/adapter-oas

#### Features

- Change the default value of `integerType` from `'number'` to `'bigint'`. `int64` fields are now mapped to `bigint` by default; set `integerType: 'number'` to preserve the previous behaviour. ([#3209](https://github.com/kubb-labs/kubb/pull/3209), [`9e90cbb`](https://github.com/kubb-labs/kubb/commit/9e90cbb2d0ded12d839739b9a13ab15532d38541))

### @kubb/ast

#### Features

- Fix `include` filter not preventing generation of component schemas from excluded operations. Only schemas transitively referenced by included operations are now generated. New export: `collectUsedSchemaNames(operations, schemas)`. ([#3208](https://github.com/kubb-labs/kubb/pull/3208), [`3cd3a09`](https://github.com/kubb-labs/kubb/commit/3cd3a0984c5cd6c77bc771d791b401e134f2003a))

#### Bug Fixes

- Fix `combineImports` incorrectly tree-shaking aliased named imports — the used-check now tests the alias rather than the original export name. ([#3212](https://github.com/kubb-labs/kubb/pull/3212), [`0e5bfaa`](https://github.com/kubb-labs/kubb/commit/0e5bfaabbced0e67ba560fda5bf6b3c380b63258))

### @kubb/core

#### Bug Fixes

- Fix `include` filter scoping: only schemas reachable from included operations are generated. ([#3208](https://github.com/kubb-labs/kubb/pull/3208), [`3cd3a09`](https://github.com/kubb-labs/kubb/commit/3cd3a0984c5cd6c77bc771d791b401e134f2003a))

### @kubb/middleware-barrel

#### Breaking Changes

- Replace string-based `barrelType` with an object-based `barrel` configuration. Root config: `barrel?: { type: 'all' | 'named' } | false`. Plugin level: `barrel?: { type: 'all' | 'named', nested?: boolean } | false`. `barrelType: 'propagate'` becomes `barrel: { type: 'all' | 'named', nested: true }`. ([#3200](https://github.com/kubb-labs/kubb/pull/3200), [`3519370`](https://github.com/kubb-labs/kubb/commit/35193705080f85f60bbb20d4e525724a9f19a3c4))

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
