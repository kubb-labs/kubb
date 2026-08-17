# Changelog

## v5.0.0 — Aug 17, 2026

### @kubb/adapter-oas

#### Breaking Changes

- `@kubb/adapter-oas` no longer deduplicates schemas, and the `dedupe` option is removed. Every named schema in the spec becomes its own type, and inline shapes stay inline.
  
  Earlier versions collapsed structurally identical schemas into one shared definition and hoisted repeated inline shapes under an invented name. That hoisting could collide with a generated operation type (a shared `{ error?: string }` 400 response became `PostV1WorkoutsStatus400`, the same name the response-status type uses), producing a self-referential `export type X = X` and duplicate exports. Output is now faithful to the spec: to share a shape, name it as a component and `$ref` it.
  
  `@kubb/ast`: the `dedupe` seam is removed, along with the `Dedupe` type. The `signatureOf` and `isSchemaEqual` helpers are removed too, since deduplication was their only consumer. ([#3632](https://github.com/kubb-labs/kubb/pull/3632), [`8addaf3`](https://github.com/kubb-labs/kubb/commit/8addaf354b8440ce820c338c820d308e1116e46e))
- Change the default value of `integerType` from `'number'` to `'bigint'`.
  
  `int64` fields in OpenAPI specs are now mapped to `bigint` by default. To preserve the previous behavior, set `integerType: 'number'` explicitly in your adapter options. ([#3209](https://github.com/kubb-labs/kubb/pull/3209), [`9e90cbb`](https://github.com/kubb-labs/kubb/commit/9e90cbb2d0ded12d839739b9a13ab15532d38541))
- Group the server options and rename the discriminator modes.
  
  ## Breaking changes
  
  ### Server options
  
  `serverIndex` and `serverVariables` are replaced by a single `server` object.
  
  ```ts
  // Before
  adapterOas({ serverIndex: 0, serverVariables: { env: 'prod' } })
  
  // After
  adapterOas({ server: { index: 0, variables: { env: 'prod' } } })
  ```
  
  `resolveBaseUrl` now takes `{ document, server }` instead of `{ document, serverIndex, serverVariables }`.
  
  ### Discriminator modes
  
  The `discriminator` values are renamed for clarity. `'strict'` becomes `'preserve'` and `'inherit'` becomes `'propagate'`. The default is now `'preserve'`.
  
  ```ts
  // Before
  adapterOas({ discriminator: 'inherit' })
  
  // After
  adapterOas({ discriminator: 'propagate' })
  ``` ([#3634](https://github.com/kubb-labs/kubb/pull/3634), [`9f6b051`](https://github.com/kubb-labs/kubb/commit/9f6b05150a6f5002f7b0ccaa204448b524a05e98))
- Normalize every input to OpenAPI 3.1 and drop the 3.0 type union.
  
  `parseDocument` upgrades documents to 3.1 (`upgrade(document, '3.1')`), so Swagger 2.0 and OpenAPI 3.0 inputs keep working, they just upgrade further. The exported `Document`, `SchemaObject`, `OperationObject`, `ResponseObject` and related types are now 3.1 only (`OpenAPIV3_1`). That is breaking for code importing them expecting 3.0 shapes such as `nullable` on a schema.
  
  The AST schema node now carries an `examples` array, populated from the OAS 3.1 `examples`, instead of a singular `example`.
  
  `parseDocument` also loses its `canBundle` option. A string is always a file path or URL to bundle, an object is an already-parsed document. ([#3619](https://github.com/kubb-labs/kubb/pull/3619), [`30ec0b4`](https://github.com/kubb-labs/kubb/commit/30ec0b4c238c3a4b8fc86aff9b423f88bc285c0a))
- Always use collision-safe schema and enum naming.
  
  The `collisionDetection` option has been removed from `adapterOas`. Collision-safe naming is now always enabled in v5. ([#3078](https://github.com/kubb-labs/kubb/pull/3078), [`d62498e`](https://github.com/kubb-labs/kubb/commit/d62498eb4bf609b8ada741a25a288810bf07cbb0))
- Breaking change for `@kubb/adapter-oas`: remove `parseDocument`, `parseFromConfig`, and `validateDocument` from the public API. These are implementation details that should not be exposed. Use `adapter.validate(input, options?)` for validation instead.
  
  New for `@kubb/core`: add a required `validate` method to the `Adapter<T>` type so every adapter implements validation.
  
  Internal for `@kubb/cli`: the `kubb validate` command now uses `adapterOas().validate()` instead of the removed standalone functions. ([#3249](https://github.com/kubb-labs/kubb/pull/3249), [`8a666d7`](https://github.com/kubb-labs/kubb/commit/8a666d76519017d0abe25ed35fbce87dbe311815))
- Remove the adapter streaming architecture. `Adapter.stream` and `InputNode`'s `Stream` generic are gone, `schemas`/`operations` are always plain arrays now, and `@kubb/adapter-oas` only implements `parse()`.
  
  Streaming was meant to cut peak memory on large specs, but `KubbDriver` already buffered every schema and operation into arrays before running plugins (needed for fan-out and the pruning pre-scan), so the one-node-at-a-time benefit never applied in practice. The measured memory fix for large specs (e.g. the Stripe spec) comes from a separate `$ref` resolution cache in the parser, unaffected by this change.
  
  `InputNode<true>` and `Streamable<T, Stream>` are removed from `@kubb/ast`. A custom `Adapter` no longer needs (or can) implement `stream`. ([#3720](https://github.com/kubb-labs/kubb/pull/3720), [`8279e86`](https://github.com/kubb-labs/kubb/commit/8279e86ca1b3cbf5c3afcdcb998fab6c3c47c8d0))
- Remove the standalone `@kubb/oas` package from the monorepo.
  
  Use `@kubb/adapter-oas` for OpenAPI parsing, validation, and shared OAS helper types instead. The `kubb validate` command now uses `@kubb/adapter-oas` directly, so it no longer requires `@kubb/oas` to be installed separately. ([`dc613d0`](https://github.com/kubb-labs/kubb/commit/dc613d0c1d43de437c2a39c53143d57712d0bbc8))

### @kubb/ast

#### Breaking Changes

- Reshape the `@kubb/ast` factory surface around an `ast.factory` namespace that mirrors `ts.factory.createX`.
  
  The flat `createX` node constructors leave the `@kubb/ast` root barrel. Reach them through the `factory` namespace as `ast.factory.createSchema(...)`. Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`.
  
  `@kubb/ast` re-exports itself as the `ast` namespace, so `import { ast } from '@kubb/ast'` reaches node definitions as `ast.schemaDef`, guards and helpers as `ast.narrowSchema`, and constructors as `ast.factory.createSchema(...)`. `@kubb/kit` re-exports the same `ast` namespace, and `@kubb/core` uses `ast.factory` internally to build its own file and import nodes. ([#3570](https://github.com/kubb-labs/kubb/pull/3570), [`3553f14`](https://github.com/kubb-labs/kubb/commit/3553f146288fd7e672c57dd0ba62caebb0b1dff0))
- Remove the TypeScript function-parameter model from `@kubb/ast`. The function-parameter nodes and factories (`createFunctionParameter`, `createFunctionParameters`, `createTypeLiteral`, `createIndexedAccessType`, `createObjectBindingPattern`), the `createOperationParams` builder, the `caseParams` helper, and the `OperationParamsResolver` type are no longer part of `@kubb/ast`. These are language-specific code generation, so they now live in `@kubb/plugin-ts` (the node model and `createOperationParams`) and the shared plugin internals (`caseParams`, `OperationParamsResolver`). `@kubb/ast` keeps the spec-agnostic node tree. ([#3647](https://github.com/kubb-labs/kubb/pull/3647), [`1fd1136`](https://github.com/kubb-labs/kubb/commit/1fd113658911141979bcc80c4baeb2e9c23ea946))

#### Features

- Make `@kubb/ast` a spec-neutral AST that adapters for non-OpenAPI specs (AsyncAPI, GraphQL, Prisma, Arazzo) can target, alongside `@kubb/adapter-oas`. The model stays closed and fully typed, with no adapter-defined kinds.
  
  - `OperationNode` is now a discriminated union keyed on `protocol`. `HttpOperationNode` (`protocol: 'http'`) guarantees non-nullable `method` and `path`, while `GenericOperationNode` omits them for non-HTTP transports. New exports: `HttpOperationNode`, `GenericOperationNode`, and the `isHttpOperationNode` guard. `createOperation` is overloaded: passing `method` + `path` returns an `HttpOperationNode` and auto-sets `protocol: 'http'`, otherwise it returns a `GenericOperationNode`. `@kubb/adapter-oas` sets `protocol: 'http'`, so OpenAPI output is unchanged.
  - The spec-specific schema decisions (nullability, `$ref` detection and resolution, discriminator, binary) are isolated behind an ordered `SchemaRule` match/convert table (`schemaRules`), so the dispatch logic that used to be scattered through the OAS parser now lives as one declarative list in `@kubb/adapter-oas`.
  
  Breaking (types): read `method`/`path` on an operation only after narrowing with `isHttpOperationNode(node)` or `node.protocol === 'http'`. `createOperation({ protocol: 'http' })` without `method`/`path` is no longer valid. Provide both, or omit all three for a generic operation. ([#3380](https://github.com/kubb-labs/kubb/pull/3380), [`d06344b`](https://github.com/kubb-labs/kubb/commit/d06344b64b6c2115880796573d919f2b65c43db7))
- Support multiple content types on both request bodies and responses.
  
  `OperationNode.requestBody` and `ResponseNode` now share the same shape: every content type declared in the spec gets its own entry in a `content` array, instead of a single root-level `schema`/`mediaType`/`contentType`. A request body or response that declares `application/json` and `multipart/form-data` produces one typed entry per content type instead of collapsing to whichever one the parser saw first.
  
  ```ts
  // before
  operation.requestBody?.schema
  operation.requestBody?.contentType
  operation.requestBody?.keysToOmit
  
  // after
  operation.requestBody?.content?.[0]?.schema
  operation.requestBody?.content?.[0]?.contentType
  operation.requestBody?.content?.[0]?.keysToOmit
  ```
  
  The OpenAPI parser populates every content type declared for a request body or status code. A body-less response keeps a single `content` entry whose schema is the empty/`void` placeholder, and setting the adapter's `contentType` option keeps only that one content type. For convenience, `createResponse` still accepts a single `schema` (with an optional `mediaType`) and normalizes it into one `content` entry, so existing callers keep working. See `migration/requestBody-content.md` for the full migration guide. ([#3373](https://github.com/kubb-labs/kubb/pull/3373), [`d70b887`](https://github.com/kubb-labs/kubb/commit/d70b8871e6410ddf00c53ad660774a01146c951e))

### @kubb/cli

#### Features

- Remove the `kubb agent` command and drop `@kubb/agent` as a peer dependency of `@kubb/cli` and `kubb`. The HTTP agent server has moved out of this repository and is now deployed as the `kubblabs/kubb-agent` Docker image. To run the agent, use the published Docker image instead of the CLI. ([#3524](https://github.com/kubb-labs/kubb/pull/3524), [`94ac5b8`](https://github.com/kubb-labs/kubb/commit/94ac5b801d4e2c415441dd08cc87089b0d296390))
- `kubb init` now scaffolds a working v5 project.
  
  The generated `kubb.config.ts` uses the v5 shape (`defineConfig` from `kubb/config` with a string `input` and no `root`), and it lists `@kubb/plugin-axios` and `@kubb/plugin-fetch` instead of the removed `@kubb/plugin-client`. `kubb` installs at the exact version of the CLI running the wizard, so the packages you get always match the wizard you ran. Plugins keep following that release channel's dist-tag, since they ship from their own repo. ([#3885](https://github.com/kubb-labs/kubb/pull/3885), [`57560d2`](https://github.com/kubb-labs/kubb/commit/57560d2fb7babfc1276dbf27b05c067a41e5cfc6))
- Load the Kubb config with `unconfig` and accept only JavaScript and TypeScript module configs.
  
  Discovery now matches `kubb.config.{ts,mts,cts,js,mjs,cjs}` and the matching `.kubbrc.*` variants (also under `.config/` and `configs/`). YAML, JSON, and the `package.json` `kubb` key are no longer read, since a Kubb config is defined with `defineConfig` and plugin function calls that those formats cannot express. This replaces `cosmiconfig` and its YAML and JSON loader chain, reducing install size. TypeScript and JSX configs keep loading through the existing jiti loader. ([#3611](https://github.com/kubb-labs/kubb/pull/3611), [`8bd4085`](https://github.com/kubb-labs/kubb/commit/8bd4085f7ab455099890454439ac5f7699109268))
- Replace the hand-rolled argument parser with [gunshi](https://gunshi.dev) for `kubb generate`, `kubb init`, `kubb validate`, and `kubb mcp`.
  
  This closes a real bug: `--logLevel` and `--reporter` declared an `enum` of allowed values but never validated against it, so a typo like `--logLevel bogus` silently passed through. Both are now rejected with a clear error.
  
  One flag changed as a result: gunshi reserves `-v` globally for `--version`, so `generate`'s `-v` short alias for `--verbose` is removed. Use `--verbose` instead. ([#3718](https://github.com/kubb-labs/kubb/pull/3718), [`204438c`](https://github.com/kubb-labs/kubb/commit/204438c4d986d76f6595cf838c276a1e9e8cc02e))

#### Bug Fixes

- Fix `kubb generate` (and `kubb <path>`) misreading the OpenAPI input override.
  
  The `generate` command was omitted from the CLI's registered subcommands, so gunshi fell back to running it as the entry command without stripping the `generate` token from the argument list. Combined with the command reading the raw, unstripped positional list instead of its resolved `input` value, every invocation of `kubb generate --config kubb.config.ts` (with or without a config file) treated the literal word `generate` as an OpenAPI path override, which then failed with `KUBB_INPUT_NOT_FOUND`.
  
  `kubb generate`, `kubb generate ./openapi.yaml`, and bare `kubb --config kubb.config.ts` all resolve the input path correctly now. ([#3726](https://github.com/kubb-labs/kubb/pull/3726), [`0611bbf`](https://github.com/kubb-labs/kubb/commit/0611bbfed4f46ea048d0b27a8cab0026875496cb))
- Fix multiple configs in `defineConfig` array stopping after the first failure.
  
  Two bugs caused only one schema to be processed when using `defineConfig` with an array of configs:
  
  1. `@kubb/cli`: `process.exit(1)` was called immediately when any config failed, killing the process before remaining configs could run. Each config is now processed independently, and the process exits with code 1 after all configs complete if any failed.
  
  2. `@kubb/core`: plugin hooks registered while wiring up the driver were never removed from the shared `hooks` instance between config runs, causing N plugin instances to fire for the N-th config and producing duplicate output. Plugin hook listeners are now tracked and removed via `KubbDriver.dispose()` at the end of each build. ([#3297](https://github.com/kubb-labs/kubb/pull/3297), [`d66969f`](https://github.com/kubb-labs/kubb/commit/d66969f52bb22ea417d931dc608c885a733c086b))
- Fix the update check, watch mode, and hook handling in `kubb generate`.
  
  The npm update check compared versions as strings, so `5.9.0 < 5.10.0` evaluated as `false` and update notices were skipped (or shown wrongly) around double-digit parts. It now compares numeric semver parts and aborts after 3 seconds so a slow registry never stalls a run.
  
  Watch mode no longer rebuilds once per chokidar startup event: the first build runs explicitly, event bursts from a single save are debounced into one rebuild, and builds never overlap (a change during a build queues exactly one rerun). A failing first build keeps watching instead of exiting.
  
  The formatter, linter, and `done` hooks now get their outcome directly from `runHook`, which returns `{ success, error, stdout, stderr }` while still emitting `kubb:hook:end` for the loggers. This removes the listener round-trip that could hang generation forever when a hook process never reported back. A stray spread that copied `output.*` keys onto the root of the resolved config is also removed. ([#3710](https://github.com/kubb-labs/kubb/pull/3710), [`995802a`](https://github.com/kubb-labs/kubb/commit/995802a89139c5b6383d6ef919d6f591ed1d17b7))
- Fix `bunx kubb` (and other non-Node runtimes) incorrectly using the runtime executable path as the OpenAPI input.
  
  The CLI argument parser only stripped the leading `[executable, script]` entries from `process.argv` when `argv[0]` contained the string `'node'`. When running via `bunx`, `deno`, `tsx`, or any other runtime, `argv[0]` was something like `/usr/local/bin/bun`, which was never stripped, so it ended up as `positionals[0]` and was passed to Redocly as the OpenAPI spec path, producing a `YamlParseError: null byte is not allowed in input`.
  
  The check is now runtime-agnostic: argv stripping happens whenever `argv[0]` contains a path separator (`/` or `\`), which is true for every absolute executable path and false for bare command names. ([#3258](https://github.com/kubb-labs/kubb/pull/3258), [`f317640`](https://github.com/kubb-labs/kubb/commit/f317640eeebce2b07ce0a61963afa8a17d61886e))

### @kubb/core

#### Breaking Changes

- Merge `input.path` and `input.data` into a single `input`.
  
  Pass `input` a file path, a URL, an inline spec (JSON or YAML string), or a parsed object, and Kubb picks the right one. The `{ path }` and `{ data }` object forms are gone.
  
  ```diff
  export default defineConfig({
  -  input: { path: './petStore.yaml' },
  +  input: './petStore.yaml',
    output: { path: './src/gen' },
  })
  ```
  
  `adapter` and `parsers` are also optional now. `defineConfig` applies `adapterOas()` and `[parserTs(), parserTsx(), parserMd()]` automatically when you omit them, so a minimal config only needs `input`, `output`, and `plugins`.
  
  ```diff
  export default defineConfig({
    input: './petStore.yaml',
    output: { path: './src/gen' },
  -  adapter: adapterOas(),
  -  parsers: [parserTs()],
    plugins: [],
  })
  ``` ([#3739](https://github.com/kubb-labs/kubb/pull/3739), [`c754376`](https://github.com/kubb-labs/kubb/commit/c75437692b7ad53f4a0123ea837fef86b04865d9))
- Replace `middleware` with post-enforced plugins.
  
  `defineMiddleware` and the `Middleware` type are removed from `@kubb/core`. Use `definePlugin` with `enforce: 'post'` instead. A post-enforced plugin registers after all normal plugins and fires in that order, giving the same guarantee.
  
  `Config.middleware` and `UserConfig.middleware` are removed. Barrel generation now runs through the new `@kubb/plugin-barrel` package, which is a standard plugin with `enforce: 'post'`. It is added to `plugins` automatically by `defineConfig` when no barrel plugin is already present.
  
  `@kubb/middleware-barrel` is removed. Migrate to `@kubb/plugin-barrel`. ([#3537](https://github.com/kubb-labs/kubb/pull/3537), [`af0c0cf`](https://github.com/kubb-labs/kubb/commit/af0c0cfbbd3f6c9ea89a01c074c89fb38d140790))
- Remove the incremental build cache.
  
  The `cache` config option, the `createCache` factory, the `fsCache` backend, and the `Cache`, `CachedSnapshot`, and `FsCacheOptions` types are gone from `@kubb/core`. `defineConfig` no longer enables `fsCache()` by default, and the `kubb generate --no-cache` flag is removed from the CLI. Every run now regenerates straight from the spec. ([#3558](https://github.com/kubb-labs/kubb/pull/3558), [`b504cf0`](https://github.com/kubb-labs/kubb/commit/b504cf0a91bd317e2ec1d450e447548560c657e8))
- Rename the hook system to match [unjs/hookable](https://github.com/unjs/hookable), the library Nuxt and Nitro use for their own hooks, and prefix every event name with `kubb:`.
  
  `KubbEvents` is now `KubbHooks`, and `driver.hooks` is the primary emitter API. Its methods are renamed to match hookable's convention:
  
  ```diff
  - hooks.on(name, handler)
  + hooks.hook(name, handler)
  
  - hooks.emit(name, ...args)
  + hooks.callHook(name, ...args)
  
  - hooks.off(name, handler)
  + hooks.removeHook(name, handler)
  
  - hooks.removeAll()
  + hooks.removeAllHooks()
  ```
  
  `listenerCount(name)` and `setMaxListeners(max)` keep their names. Every event name is now namespaced to avoid collisions with listeners from other tools sharing the same process:
  
  ```diff
  - hooks.on('plugin:end', handler)
  - hooks.on('error', handler)
  + hooks.hook('kubb:plugin:end', handler)
  + hooks.hook('kubb:error', handler)
  ```
  
  This affects any code that calls these methods directly on the `hooks` option/property of `createKubb`/`KubbDriver`, or on a `LoggerContext` inside a custom `Logger`'s `install` callback. Behavior (sequential await, error wrapping, listener counting, the leak-warning ceiling) is unchanged. ([#3885](https://github.com/kubb-labs/kubb/pull/3885), [`57560d2`](https://github.com/kubb-labs/kubb/commit/57560d2fb7babfc1276dbf27b05c067a41e5cfc6))
- Turn off `output.format` and `output.lint` by default.
  
  Earlier versions auto-detected a formatter and linter (prettier, biome, oxfmt, oxlint, eslint) and ran them after generation. Kubb now writes its own already-clean output and runs neither unless you ask for it, which cuts a step out of every build.
  
  ```ts
  output: {
    path: './src/gen',
    format: 'auto', // or 'prettier' | 'biome' | 'oxfmt'
    lint: 'auto', // or 'oxlint' | 'biome' | 'eslint'
  }
  ```
  
  Set `format`/`lint` explicitly to keep running one, either `'auto'` to detect what your project already uses or a specific tool name. ([#3885](https://github.com/kubb-labs/kubb/pull/3885), [`57560d2`](https://github.com/kubb-labs/kubb/commit/57560d2fb7babfc1276dbf27b05c067a41e5cfc6))
- Replace the top-level `hooks` option with `output.postGenerate`.
  
  The post-generate command runner moved from `hooks.done` to `output.postGenerate`, next to `output.format` and `output.lint`. It now takes a labeled array, so each step can carry a `name` that shows in the CLI output. Pass a command string, or `{ name, command }`.
  
  ```ts
  output: {
    path: './src/gen',
    postGenerate: [{ name: 'types', command: 'npm run typecheck' }, 'biome check --write ./src/gen'],
  }
  ```
  
  The top-level `hooks` option is removed. Move any `hooks.done` commands to `output.postGenerate`. The related diagnostic code is renamed from `KUBB_HOOK_FAILED` to `KUBB_POST_GENERATE_FAILED`. ([#3745](https://github.com/kubb-labs/kubb/pull/3745), [`d102f33`](https://github.com/kubb-labs/kubb/commit/d102f333e9516135d61bd0796d9479ebc695444c))
- Rename `defineResolver` to `createResolver`.
  
  - `createResolver` takes a plain object (the `() =>` wrapper is no longer needed) and returns a `Resolver` class instance.
  - `mergeResolver` is removed. Use `Resolver.merge` instead.
  - `Resolver` is exported from `@kubb/core` and `@kubb/kit`.
  
  Other `define*` factories (`definePlugin`, `defineGenerator`, `defineParser`, `defineConfig`) are unchanged. ([#3078](https://github.com/kubb-labs/kubb/pull/3078), [`d62498e`](https://github.com/kubb-labs/kubb/commit/d62498eb4bf609b8ada741a25a288810bf07cbb0))
- Replace the `default(name, type)` discriminator with a `resolver.default` namespace and top-level `name`/`file` entries. `createResolver` returns a `Resolver` class instance (same factory pattern as `createKubb`).
  
  The stringly-typed `default(name, type?: 'file' | 'function' | 'type' | 'const')` is gone. The built-in machinery now lives under `resolver.default`: `name` (camelCase identifier casing), `file` (the `FileNode` builder), `options`, `path`, `banner`, and `footer` (previously `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, `resolveFooter`).
  
  Generators call the two top-level entries, each of which defaults to its `default` counterpart:
  
  - `resolver.name(name)` is the plugin's identifier casing. Override it to set a convention (PascalCase, a suffix, …).
  - `resolver.file({ name, extname, tag, path, root, output, group })` resolves generated file names and paths, split into `file.baseName` (the base name including its extension) and `file.path` (the full path, resolved against the project root). Override `file.baseName` for custom file-name casing:
  
    ```ts
    createResolver({
      pluginName: 'plugin-faker',
      file: {
        baseName({ name, extname }) {
          return `${camelCase(name, { prefix: 'create' })}${extname}`
        },
      },
    })
    ```
  
  `resolver.default` is the built-in machinery and is not overridable. Plugins delegate to it via `this.default.*` rather than replace it.
  
  Add plugin-specific helpers as top-level methods (`typeName`, …) and/or grouped namespaces (`query`, `schema`, …). Every helper reaches shared machinery through `this.name`, `this.default`, and `this.file`.
  
  ```ts
  export const resolverTs = createResolver<PluginTs>({
    pluginName: 'plugin-ts',
    name(name) {
      return ensureValidVarName(pascalCase(name))
    },
    typeName(name) {
      return `${this.name(name)}Type`
    },
    query: {
      keyName(node) {
        return `${this.name(node.operationId)}QueryKey`
      },
    },
  })
  ```
  
  `setResolver` accepts a partial override. The framework merges it over the plugin default through `Resolver.merge` (rebuild-on-merge so namespace `this` bindings stay correct).
  
  `Filter` is exported for include/exclude/override rules; `Exclude` and `Include` are aliases of `Filter`. ([#3715](https://github.com/kubb-labs/kubb/pull/3715), [`7b39b62`](https://github.com/kubb-labs/kubb/commit/7b39b620f90e36f9c183fead55348baca716aa11))

#### Features

- Give every build failure a stable, structured diagnostic instead of a plain error.
  
  A `Diagnostic` carries a stable `code` (for example `KUBB_INPUT_NOT_FOUND`, `KUBB_REF_NOT_FOUND`, `KUBB_INVALID_PLUGIN_OPTIONS`), a `severity`, an optional source `location` (a JSON pointer), the `plugin` that raised it, and a suggested `fix`. `@kubb/core` exposes a `Diagnostics` class to work with them: `Diagnostics.report(...)` collects one into the active run instead of throwing, `Diagnostics.Error` is the throwable form for cases that must stop the build, and `Diagnostics.explain(code)`/`Diagnostics.docsUrl(code)` look up the catalog entry and its kubb.dev reference page. A plugin's `ctx.error`/`ctx.warn`/`ctx.info` now report through this same system, so a plugin-raised problem shows up in the run summary and JSON report like any other diagnostic, and `ctx.error` fails the build.
  
  The CLI renders a diagnostic as `[CODE] plugin: message`, tinted by severity, with indented `at:`, `fix:`, and `see:` rows, and the end-of-run summary box gains an `Issues: N errors, M warnings` count. `kubb generate --reporter json` prints the same data as a stable, machine-readable report for CI. The OAS adapter's advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT` for a schema whose `format` falls back to its base type, `KUBB_DEPRECATED` for a schema marked deprecated) run on every build. The MCP `generate` and `validate` tools return the same structured diagnostics, each with its code, source pointer, fix, and docs link, so an assistant can act on the exact problem instead of parsing a message string. ([#3885](https://github.com/kubb-labs/kubb/pull/3885), [`57560d2`](https://github.com/kubb-labs/kubb/commit/57560d2fb7babfc1276dbf27b05c067a41e5cfc6))

#### Bug Fixes

- Stop `output.clean` from deleting the project root. When `output.path` resolved to the root directory or a parent of it (for example `path: '.'`), a build with `clean: true` wiped `kubb.config` and every source file. The build now fails with a `KUBB_CLEAN_ROOT` diagnostic before cleaning, so clean only removes generated code. ([#3784](https://github.com/kubb-labs/kubb/pull/3784), [`5850a25`](https://github.com/kubb-labs/kubb/commit/5850a252e4394073050d5056dfadd6d459b02b5c))
- Fix path traversal vulnerabilities in file path resolution.
  
  - `toFilePath` no longer produces a leading `/` when a dotted name starts with `.{letter}` (e.g. `..Schema`). Empty segments produced by such names are now filtered before joining with `/`, preventing the result from being interpreted as an absolute path.
  - The resolver's default group directory for `group.type === 'path'` now strips `.` and `..` components from the OpenAPI operation path before selecting the first segment as a subdirectory name.
  - Added an output-directory boundary check to the resolver's path resolution: if the resolved path escapes the configured output directory an error is thrown, providing defense-in-depth against path traversal in malicious OpenAPI specs or misconfigured `group.name` functions. ([#3124](https://github.com/kubb-labs/kubb/pull/3124), [`80d43c6`](https://github.com/kubb-labs/kubb/commit/80d43c66c86ee69359c78184024497f4e2eb1d3e))

### @kubb/kit

#### Features

- Settle the boundary between `@kubb/ast` and `@kubb/kit`.
  
  `@kubb/ast` keeps the node tree, the `ast.factory` builders, and the macro engine (`defineMacro`, `composeMacros`, `applyMacros`). The macro presets (`macroDiscriminatorEnum`, `macroEnumName`, `macroRenameSchema`, `macroSimplifyUnion`) and the schema-name and schema-graph helpers that only `@kubb/adapter-oas` and plugins consume (`childName`, `enumPropName`, `extractRefName`, `isStringType`, `mergeAdjacentObjectsLazy`, `syncSchemaRef`, `containsCircularRef`) live on `@kubb/kit`, reached through `kubb/kit`:
  
  ```diff
  - import { macroSimplifyUnion, childName, syncSchemaRef } from '@kubb/ast'
  + import { macroSimplifyUnion, childName, syncSchemaRef } from '@kubb/kit'
  ```
  
  `resolveRefName`, `findCircularSchemas`, and `collectUsedSchemaNames` stay on `@kubb/ast`, since its own node builders depend on them. ([#3885](https://github.com/kubb-labs/kubb/pull/3885), [`57560d2`](https://github.com/kubb-labs/kubb/commit/57560d2fb7babfc1276dbf27b05c067a41e5cfc6))
- Add `@kubb/kit`, the authoring toolkit for plugins, generators, adapters, resolvers, and renderers, re-exporting `definePlugin`, `defineGenerator`, `createResolver`, `Resolver`, `defineParser`, `createAdapter`, `createRenderer`, `createStorage`, `Diagnostics`, `memoryStorage`, `fsStorage`, the `ast` namespace and `factory` node builders, and their companion option and hook types. `@kubb/kit/testing` holds the Vitest-backed test helpers (`createMockedPlugin`, `createMockedAdapter`, `renderGeneratorOperation`, `matchFiles`) on a separate entry point so the main import never pulls in Vitest.
  
  `kubb` gains matching subpaths so most consumers never need to install `@kubb/kit`, `@kubb/ast`, or `@kubb/renderer-jsx` directly:
  
  - `kubb/kit` and `kubb/kit/testing` re-export `@kubb/kit`, including the `ast` namespace and `factory` node builders
  - `kubb/jsx` re-exports `@kubb/renderer-jsx` and its types, with `kubb/jsx/jsx-runtime` and `kubb/jsx/jsx-dev-runtime` for `jsxImportSource: "kubb/jsx"`
  - `kubb/config` re-exports `defineConfig`, which also stays on the `kubb` root
  
  There is no `kubb/ast` subpath. Reach the AST through the `ast` namespace on `kubb/kit`, or install `@kubb/ast` directly when you want it on its own.
  
  `@kubb/core`, `@kubb/ast`, and `@kubb/renderer-jsx` stay published and importable directly. This is additive: existing imports keep working. ([#3693](https://github.com/kubb-labs/kubb/pull/3693), [`d546ee1`](https://github.com/kubb-labs/kubb/commit/d546ee11f6a76e332db153214d3540abe85b984c))

### @kubb/mcp

#### Breaking Changes

- Migrate the MCP server to [tmcp](https://github.com/paoloricciuti/tmcp) and serve it over stdio only.
  
  `tmcp` replaces `@modelcontextprotocol/sdk`, giving tool schemas TypeScript inference straight from their Zod definitions. Alongside the existing `generate` tool, the server now ships `validate` and `init` tools, and exports `createMcpServer` for embedding in other tooling.
  
  Every local MCP client (Claude, Copilot, editors) launches the server as a subprocess and talks to it over stdio, so the HTTP transport and its `--port`/`--host` flags are gone, along with the `@remix-run/node-fetch-server` and `@tmcp/transport-http` dependencies. `startServer()` no longer takes `port` or `host` options. ([#3611](https://github.com/kubb-labs/kubb/pull/3611), [`8bd4085`](https://github.com/kubb-labs/kubb/commit/8bd4085f7ab455099890454439ac5f7699109268))

### @kubb/parser-md

#### Features

- Add `@kubb/parser-md` for emitting `.md` and `.markdown` files. The parser exposes `parserMd.print` for serializing frontmatter objects to YAML envelopes and reads `file.meta.frontmatter` to prepend frontmatter automatically.
  
  Add markdown components to `@kubb/renderer-jsx` (`Frontmatter`, `Heading`, `Paragraph`, `List`, `Callout`) for authoring `.md` files declaratively in JSX. `Callout` emits GitHub-style alert syntax (`> [!TIP]`) portable across GitHub, GitLab, VitePress, Obsidian, and MDX. ([#3358](https://github.com/kubb-labs/kubb/pull/3358), [`8154649`](https://github.com/kubb-labs/kubb/commit/81546491644a69fab7948e3000a196460e0137af))

### @kubb/parser-ts

#### Breaking Changes

- Move import and export extension rewriting from `output.extension` onto the parser, and turn the built-in parsers into factories.
  
  `output.extension` only ever rewrote the extensions inside `import`/`export` statements, so it now lives on `parserTs`, the parser that does the work. `parserTs`, `parserTsx`, and `parserMd` are now factory functions you call, matching the plugin convention (`pluginTs()`), and `parserTs`/`parserTsx` accept an `extension` map. The `output.extension` option and the `extname` argument to `Parser.parse` are removed.
  
  ```ts
  // before
  export default defineConfig({
    output: { path: './src/gen', extension: { '.ts': '.js' } },
    parsers: [parserTs, parserTsx, parserMd],
  })
  
  // after
  export default defineConfig({
    output: { path: './src/gen' },
    parsers: [parserTs({ extension: { '.ts': '.js' } }), parserTsx(), parserMd()],
  })
  ```
  
  `defineParser` now wraps a factory the same way `definePlugin` does, so custom parsers take options too:
  
  ```ts
  // before
  export const parserText = defineParser({ name: 'parser-text', extNames: ['.txt'], parse, print })
  
  // after
  export const parserText = defineParser((options) => ({ name: 'parser-text', extNames: ['.txt'], parse, print }))
  ```
  
  `parse(file)` also drops its second `options` argument, since the parser resolves options from its factory instead. ([#3740](https://github.com/kubb-labs/kubb/pull/3740), [`e9c8588`](https://github.com/kubb-labs/kubb/commit/e9c858875b5ddc7715ead3c613b10ea600bf400c))
- Drop the source extension from generated `import`/`export` statements by default.
  
  `parserTs` and `parserTsx` kept the source extension (`{ '.ts': '.ts' }`) by default since the beta.91 release. That matches Node16/NodeNext module resolution, but breaks bundler-based consumers that never expect an extension on a relative import. The default is now `{ '.ts': '' }`, so `import './client'` replaces `import './client.ts'` unless you set `extension` yourself.
  
  ```ts
  // before (default)
  export default defineConfig({
    parsers: [parserTs(), parserTsx()],
  })
  // import './client.ts'
  
  // after (default)
  export default defineConfig({
    parsers: [parserTs(), parserTsx()],
  })
  // import './client'
  
  // keep the extension (Node16/NodeNext resolution)
  export default defineConfig({
    parsers: [parserTs({ extension: { '.ts': '.ts' } }), parserTsx({ extension: { '.ts': '.ts' } })],
  })
  ``` ([#3743](https://github.com/kubb-labs/kubb/pull/3743), [`54ad965`](https://github.com/kubb-labs/kubb/commit/54ad9657932f6a2f3dba263adb51d98f52777c93))

### @kubb/plugin-barrel

#### Breaking Changes

- Adjust for `output.barrel` defaulting to `false` instead of `{ type: 'named' }`. `pluginBarrel` still ships with `kubb` and `unplugin-kubb` by default, but now generates nothing until a barrel is configured on the root config, a plugin, or both.
  
  Breaking change: a config that never set `output.barrel` and relied on the implicit `{ type: 'named' }` default now needs it set explicitly to keep generating barrel files. ([#3797](https://github.com/kubb-labs/kubb/pull/3797), [`81bf741`](https://github.com/kubb-labs/kubb/commit/81bf741109256d1c002d24238397d461e0d36ebf))

### @kubb/renderer-jsx

#### Breaking Changes

- Remove React entirely, runtime and types, while keeping JSX as the authoring style. The async fiber runtime, `react-reconciler`, `scheduler`, and the `react` dependency are all gone. Rendering runs through the synchronous walker over a tiny built-in JSX runtime (`@kubb/renderer-jsx/jsx-runtime`). The JSX namespace is now self-contained and declares only the `kubb-*` code hosts plus `br`, so `@types/react` is dropped as well and consumers no longer need it for type support. The gzipped bundle drops from a 510 KiB budget to ~8 KiB.
  
  There is now one renderer, exported as `jsxRenderer`. The separate `jsxRendererSync` name is gone, and so is the unused `Root` error-boundary component. This release also clears the scaffolding left from the virtual-DOM era: the internal DOM module with its `DOMElement` and `DOMNode` types, the unused `CodeBlock` component, the `createContext`, `inject`, `provide`, and `unprovide` re-exports, and the renderer's no-op `dispose` and `unmount` methods. ([#3488](https://github.com/kubb-labs/kubb/pull/3488), [`2bd32fd`](https://github.com/kubb-labs/kubb/commit/2bd32fddd6e628d04e4e59ae06ff7d52982a8a6f))

#### Features

- Add `@kubb/renderer-jsx`, a small JSX renderer for Kubb plugins with a custom JSX runtime and built-in components (`File`, `Const`, `Function`, `Type`). `@kubb/core` gains `createRenderer`, the factory a renderer implements against; `@kubb/renderer-jsx`'s `jsxRenderer` is the first consumer. Replaces `@kubb/react-fabric` as the rendering layer. ([#3078](https://github.com/kubb-labs/kubb/pull/3078), [`d62498e`](https://github.com/kubb-labs/kubb/commit/d62498eb4bf609b8ada741a25a288810bf07cbb0))

### kubb

#### Breaking Changes

- Require Node.js 22 or later. ([#3078](https://github.com/kubb-labs/kubb/pull/3078), [`d62498e`](https://github.com/kubb-labs/kubb/commit/d62498eb4bf609b8ada741a25a288810bf07cbb0))
- Flip the default `output.barrel` from `{ type: 'named' }` to `false`. A config that omits `output.barrel` (root or per-plugin) no longer generates a barrel `index.ts` file.
  
  Set `output.barrel: { type: 'named' | 'all' }` explicitly to keep generating a barrel.
  
  Breaking change: any project relying on the implicit `{ type: 'named' }` default to get a barrel now needs `output.barrel` set explicitly, or imports that go through the barrel (`import { Pet } from './gen'`) stop resolving. ([#3797](https://github.com/kubb-labs/kubb/pull/3797), [`81bf741`](https://github.com/kubb-labs/kubb/commit/81bf741109256d1c002d24238397d461e0d36ebf))

#### Features

- Generate code up to 5.4x faster than v4.
  
  On the [OpenAI spec](https://github.com/openai/openai-openapi) (288 operations, 2.9 MB), generating types, an Axios client, Zod schemas, and Faker mocks drops from 18.4 seconds in v4 to 3.4 seconds in v5, median of five runs. Two changes drive the gap. Every v4 plugin parsed the OpenAPI spec on its own, so four plugins read the same spec four times. In v5 the adapter parses it once and hands every plugin the same AST. The renderer also moved off React's async fiber runtime onto a synchronous walker over a tiny built-in JSX runtime, which drops the render step's own overhead along with the `react`/`react-reconciler` dependency.
  
  See the [migration guide](/docs/5.x/migration#performance) for the full per-plugin-combination benchmark tables. ([#3885](https://github.com/kubb-labs/kubb/pull/3885), [`db94487`](https://github.com/kubb-labs/kubb/commit/db9448758d829aba36f4d16fbd223231cec40af3))
- Upgrade to TypeScript 6. ([#3078](https://github.com/kubb-labs/kubb/pull/3078), [`d62498e`](https://github.com/kubb-labs/kubb/commit/d62498eb4bf609b8ada741a25a288810bf07cbb0))
- Add a Kubb Claude Code plugin and marketplace. It brings Kubb, a meta framework for code generation, into Claude Code so you can turn an OpenAPI spec into TypeScript types, Zod schemas, Axios clients, React Query hooks and more. The plugin ships `/kubb:init`, `/kubb:generate` and `/kubb:validate` commands that run the `kubb` CLI, a `config` skill and a `kubb-expert` agent, and the `@kubb/mcp` server (`kubb mcp`) for conversational generation. Add `kubb-labs/kubb` as a plugin marketplace to install it. ([#3411](https://github.com/kubb-labs/kubb/pull/3411), [`31ad94f`](https://github.com/kubb-labs/kubb/commit/31ad94f31947613c6c1f0ad2270a8d7359b16644))
- Move the plugins out of this repository into [kubb-labs/plugins](https://github.com/kubb-labs/plugins).
  
  `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker`, `@kubb/plugin-msw`, and the rest of the code generators now ship and version independently from the core engine, so a plugin release no longer waits on a `kubb` release and vice versa. `@kubb/plugin-barrel` is the one plugin that stays here, since barrel generation runs as a built-in post-enforced plugin. Install plugins from their own packages as before. Nothing changes in a `kubb.config.ts` beyond that.
  
  `@kubb/core` no longer depends on `@kubb/oas`. `HttpMethod` is now imported from `@kubb/ast`. ([#3078](https://github.com/kubb-labs/kubb/pull/3078), [`e2910e9`](https://github.com/kubb-labs/kubb/commit/e2910e96ac7647f3c5bbc5253a2e6ef82161592b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

