# Changelog

## v5.0.0-beta.36 — Jun 1, 2026

### @kubb/cli

#### Bug Fixes

- Update @clack/prompts ([`6e39543`](https://github.com/kubb-labs/kubb/commit/6e395434be640bb786cdd4842b31fd81ffd003ca))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.35 — May 30, 2026

### @kubb/core

#### Bug Fixes

- Tighten internal type safety by removing `any` and unnecessary casts. The `Parser` type now defaults `TMeta` to `object` instead of `any`, `getContext` returns an honest `Omit<GeneratorContext, 'options'>` rather than laundering a missing field through `as unknown as`, and a couple of `as never` casts are replaced with proper optional types. No runtime behavior or public API change. ([#3420](https://github.com/kubb-labs/kubb/pull/3420), [`e74cb57`](https://github.com/kubb-labs/kubb/commit/e74cb577a7b70bfa9f5a9fbc6400f83c5b88f800))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.34 — May 29, 2026

### @kubb/ast

#### Features

- Export the `isInputNode` and `isOutputNode` type guards from the `@kubb/ast` entry point. Both guards were defined and documented in `guards.ts` but missing from the barrel, so they could not be imported alongside `isOperationNode` and `isSchemaNode`. ([#3416](https://github.com/kubb-labs/kubb/pull/3416), [`e3dd3c6`](https://github.com/kubb-labs/kubb/commit/e3dd3c6a63c5670434e5cd6424c08bba76e3f0a2))

### kubb

#### Bug Fixes

- Add a Kubb Claude Code plugin and marketplace. It brings Kubb, a meta framework for code generation, into Claude Code so you can turn an OpenAPI spec into TypeScript types, Zod schemas, Axios clients, React Query hooks and more. The plugin ships `/kubb:init`, `/kubb:generate` and `/kubb:validate` commands that run the `kubb` CLI, a `config` skill and a `kubb-expert` agent, and the `@kubb/mcp` server (`kubb mcp`) for conversational generation. Add `kubb-labs/kubb` as a plugin marketplace to install it. ([#3411](https://github.com/kubb-labs/kubb/pull/3411), [`31ad94f`](https://github.com/kubb-labs/kubb/commit/31ad94f31947613c6c1f0ad2270a8d7359b16644))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.33 — May 29, 2026

### @kubb/ast

#### Breaking Changes

- Trim the `@kubb/ast` public API to shrink the maintained surface.
  
  Removed exports that were unused across both the core monorepo and the plugins, and that duplicated or backed a public counterpart:
  
  - **Deleted (dead code):** `nodeKinds` and `mediaTypes` constants (no references anywhere), the `RefMap` type, and the `InferSchema` type alias (use `InferSchemaNode`).
  - **No longer exported (now internal):**
    - `collectLazy` — use the eager `collect`
    - `createContent` / `createRequestBody` — content is normalized for you by `createResponse` / `createOperation`
    - `mergeAdjacentObjects` — use `mergeAdjacentObjectsLazy` (`[...mergeAdjacentObjectsLazy(members)]`)
    - `isSchemaEqual` — compare `schemaSignature(a) === schemaSignature(b)`
    - `isScalarPrimitive`, `resolveRefName`, `collectReferencedSchemaNames`, `isInputNode`, `isOutputNode`
  
  The README's `Refs` example also referenced helpers that never existed (`buildRefMap`, `resolveRef`); it now documents the real `extractRefName`. ([#3402](https://github.com/kubb-labs/kubb/pull/3402), [`ecbde80`](https://github.com/kubb-labs/kubb/commit/ecbde801a1774a89703efbdfd939d431c1956935))

#### Bug Fixes

- Ship the documented `@kubb/ast/types` subpath and make `walk()` traverse concurrently.
  
  `@kubb/ast/types` is now a real export, so the README's `import type { Node } from '@kubb/ast/types'` resolves instead of failing — consumers can pull in node interfaces and visitor types without loading any runtime.
  
  `walk()` now visits sibling nodes concurrently up to its `concurrency` limit. Previously each child was awaited one at a time, so the documented `concurrency` option had no effect and async visitor callbacks always ran serially. ([#3402](https://github.com/kubb-labs/kubb/pull/3402), [`09563b4`](https://github.com/kubb-labs/kubb/commit/09563b49b6f1ff584fc35a910ecc47ab1c9669d7))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.32 — May 28, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Remove internal dead code flagged by knip in production mode. No public API changes — every removed symbol was unexported (not part of any package's `exports`) and unused across the workspace and the plugins repo.
  
  - `@kubb/adapter-oas`: drop the orphaned `applyDiscriminatorInheritance` and `getMediaType` helpers (the streaming path already uses `buildDiscriminatorChildMap`/`patchDiscriminatorNode` directly).
  - `@kubb/core`: drop the unused `decodeAst` devtools helper.
  - `@kubb/ast`: drop the unused `buildRefMap`, `resolveRef`, `refMapToObject` helpers and the unused node guards (`isPropertyNode`, `isParameterNode`, `isResponseNode`, `isFunctionParameterNode`, `isParameterGroupNode`, `isFunctionParametersNode`). The public `RefMap` type and `extractRefName` are kept. ([#3401](https://github.com/kubb-labs/kubb/pull/3401), [`e515a1c`](https://github.com/kubb-labs/kubb/commit/e515a1c5c617cf9a215c3a1e2db4d4dd6a329e22))

### @kubb/ast

#### Bug Fixes

- **Performance: persist schema signatures in a process-wide `WeakMap`**
  
  `signatureOf` now memoizes node → digest in a module-level `WeakMap` keyed by node identity, instead of a fresh `Map` per `schemaSignature`/`buildDedupePlan`/`applyDedupe` call. During streaming, each top-level schema tree was hashed twice — once by `schemaSignature` and again by `applyDedupe` — so a node is no longer re-hashed once it has been seen. Entries are released when the node is garbage-collected, and reuse is sound because signatures depend only on a node's (immutable) content. ([#3396](https://github.com/kubb-labs/kubb/pull/3396), [`830896b`](https://github.com/kubb-labs/kubb/commit/830896b458e9dee190512745c705f9f157673b30))
- refactor(ast): replace describeShape switch with SHAPE_KEYS registry
  
  Internal refactor only — no public API changes. Replaces the 12-case switch
  statement in `describeShape` with a declarative `SHAPE_KEYS` registry (same
  pattern as `VISITOR_KEYS` in visitor.ts). Output is byte-for-byte identical. ([#3392](https://github.com/kubb-labs/kubb/pull/3392), [`3fe64a8`](https://github.com/kubb-labs/kubb/commit/3fe64a83bbc82ed340adfae760e9014c08f3fd49))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.31 — May 26, 2026

### @kubb/adapter-oas

#### Features

- Add a `dedupe` option to `adapterOas` that collapses structurally identical schemas and enums into a single shared definition.
  
  OpenAPI specs frequently repeat the same shape — most often an inline enum (e.g. `['active', 'inactive']`) duplicated across many properties, or an identical object reused across schemas and operations. Each unique shape is now emitted once: duplicated inline shapes are hoisted into a named schema, and every other occurrence — including a structurally identical top-level component — becomes a `ref` to it. Equality is shape-only, so differences in documentation such as `description` or `example` do not block deduplication. Deduplication is **enabled by default**; set `adapterOas({ dedupe: false })` to keep every occurrence inline and reproduce the previous output.
  
  `@kubb/ast` gains the spec-agnostic primitives that power this: `schemaSignature` (a content hash of a schema's shape), `isSchemaEqual`, `buildDedupePlan`, and `applyDedupe`. ([#3387](https://github.com/kubb-labs/kubb/pull/3387), [`0ee883f`](https://github.com/kubb-labs/kubb/commit/0ee883fccd38dff4c14ed1dd548ca16a52f0348b))

#### Bug Fixes

- Treat an enum whose only value is `null` (drf-spectacular's `NullEnum`, `{ enum: [null] }`) as a `null` schema instead of an empty enum.
  
  Previously the `null` value was stripped, leaving an enum with no values that rendered as `never` (`@kubb/plugin-ts`) or an invalid `z.enum([])` (`@kubb/plugin-zod`), silently dropping nullability. The common drf-spectacular `oneOf: [StatusEnum, BlankEnum, NullEnum]` pattern now generates valid output (e.g. `Status | "" | null`). ([#3384](https://github.com/kubb-labs/kubb/pull/3384), [`cf72a72`](https://github.com/kubb-labs/kubb/commit/cf72a723c883be0b94b75055440c4d62c4a7fa0c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.30 — May 25, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Isolate the OpenAPI-specific schema decisions (nullability, `$ref` detection and resolution, discriminator, binary) behind a single `SchemaDialect` passed into `createSchemaParser`. The converter pipeline and dispatch rules are now dialect-driven with the OAS dialect as the default, so the spec-specific surface lives in one documented place — the seam a future adapter (e.g. AsyncAPI) targets. No change to generated output. ([#3377](https://github.com/kubb-labs/kubb/pull/3377), [`287a42a`](https://github.com/kubb-labs/kubb/commit/287a42a5c51a1b03ac19aff04f18f4c534739f1a))

### @kubb/ast

#### Features

- Add a generic `dispatch` helper and `DispatchRule` type to `@kubb/ast`: an ordered match/convert table that maps source-spec shapes onto Kubb AST nodes. `@kubb/adapter-oas` now builds its OAS schema parser on top of it, replacing the long `parseSchema` if/else chain with a declarative `schemaRules` table. The mechanism is spec-agnostic, so future adapters (e.g. AsyncAPI) can reuse the same traversal by defining their own context type and rules. No change to generated output. ([#3377](https://github.com/kubb-labs/kubb/pull/3377), [`f657504`](https://github.com/kubb-labs/kubb/commit/f657504c01f9606dc39c76f1eeb87c11a6b00247))
- Promote the schema dialect to `@kubb/ast` as a first-class, spec-agnostic contract: add a generic, guard-preserving `SchemaDialect<TSchema, TRef, TDiscriminated, TDocument>` type and a `defineSchemaDialect` helper, alongside `dispatch`. `@kubb/adapter-oas` now builds `oasDialect` with `ast.defineSchemaDialect`, so the JSON-Schema-family seam (nullability, `$ref`, discriminator, binary, ref resolution) is shared across adapters — an AsyncAPI adapter supplies its own dialect and reuses the converter pipeline and dispatch rules. No change to generated output. ([#3377](https://github.com/kubb-labs/kubb/pull/3377), [`829a8ef`](https://github.com/kubb-labs/kubb/commit/829a8ef374a835dc015c1ccca564aa52dec8b011))
- Make the AST node vocabulary spec-neutral so adapters for non-OpenAPI specs (AsyncAPI, GraphQL, Prisma, Arazzo) map onto built-in nodes — the model stays closed and fully typed, no adapter-defined kinds.
  
  - `OperationNode` is now a discriminated union keyed on `protocol`. `HttpOperationNode` (`protocol: 'http'`) guarantees non-nullable `method` and `path`; `GenericOperationNode` omits them for non-HTTP transports. New exports: `HttpOperationNode`, `GenericOperationNode`, `OperationNodeBase`, and the `isHttpOperationNode` guard.
  - `createOperation` is overloaded: passing `method` + `path` returns an `HttpOperationNode` and auto-sets `protocol: 'http'`; otherwise it returns a `GenericOperationNode`. `@kubb/adapter-oas` sets `protocol: 'http'`, so OpenAPI output is unchanged.
  
  **Breaking (types):** read `method`/`path` only after narrowing with `isHttpOperationNode(node)` or `node.protocol === 'http'`. `createOperation({ protocol: 'http' })` without `method`/`path` is no longer valid — provide both, or omit all three for a generic operation. ([#3380](https://github.com/kubb-labs/kubb/pull/3380), [`d06344b`](https://github.com/kubb-labs/kubb/commit/d06344b64b6c2115880796573d919f2b65c43db7))
- Adopt a Babel-style traversal architecture in `@kubb/ast`, keeping the node model uniform and minimal.
  
  - Request-body and response content entries are now first-class nodes (`ContentNode`), and the request body is a `RequestBodyNode`, so every child slot in the tree is a node rather than an anonymous wrapper object.
  - A single `VISITOR_KEYS`-style child-field registry now drives both `walk`/`collect` traversal and the immutable `transform`, replacing the per-kind hand-written tree-shape logic that previously lived in two places.
  - Adds builders `createContent` and `createRequestBody`; `createOperation`/`createResponse` apply them automatically, so adapters and existing call sites need no changes.
  
  Note: a schema reached through a request/response body now reports its `parent` as the enclosing `ContentNode` (previously the `OperationNode`/`ResponseNode`). ([#3375](https://github.com/kubb-labs/kubb/pull/3375), [`c5f5227`](https://github.com/kubb-labs/kubb/commit/c5f522704ea4d412bbfe7c0da7bb49e8bb3a4e5c))
- `transform` now preserves identity (structural sharing): when a pass leaves a node and all its descendants unchanged it returns the same reference instead of reallocating the subtree. No-op rewrites become free and callers can detect "nothing changed" by reference, which keeps caches valid and cuts allocations on large specs. Adds an `update(node, changes)` factory — an identity-preserving shallow update, the analogue of the TypeScript compiler's `factory.updateX`. ([#3377](https://github.com/kubb-labs/kubb/pull/3377), [`29b83a8`](https://github.com/kubb-labs/kubb/commit/29b83a81af6f8304820e74b707814ae54cae6293))

#### Bug Fixes

- Reduce internal complexity in the AST, core, and CLI packages to make them easier to work with and debug. No public API or generated output changes.
  
  - `@kubb/ast`: `walk`, `transform`, and `collectLazy` now share a single node-kind dispatch helper instead of three duplicated `switch` statements, and `combineExports`/`combineImports` share a name-merge helper.
  - `@kubb/core`: the schema and operation generator passes in `KubbDriver` are unified into one dispatch function.
  - `@kubb/cli`: the clack, GitHub Actions, and plain loggers share progress-counter and hook-timing helpers. ([#3375](https://github.com/kubb-labs/kubb/pull/3375), [`de7a15c`](https://github.com/kubb-labs/kubb/commit/de7a15c1ab4bbc57836dd8073402f46f93dc5341))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.29 — May 23, 2026

### @kubb/ast

#### Features

- Add multiple response content type support to the AST and OpenAPI parser.
  
  `ResponseNode` now mirrors `requestBody`: the response body schemas live exclusively inside a
  `content` array (one entry per content type), instead of a single root-level `schema`/`mediaType`.
  This removes the duplicated schema that previously sat both on the node root and inside `content`.
  The OpenAPI parser populates every content type declared for a status code; body-less responses
  keep a single `content` entry whose schema is the empty/`void` placeholder. When the adapter
  `contentType` option is set, only that content type is kept.
  
  For convenience `createResponse` still accepts a single `schema` (with optional `mediaType`),
  normalizing it into one `content` entry, so existing callers keep working. ([#3373](https://github.com/kubb-labs/kubb/pull/3373), [`d70b887`](https://github.com/kubb-labs/kubb/commit/d70b8871e6410ddf00c53ad660774a01146c951e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.28 — May 23, 2026

### @kubb/ast

#### Bug Fixes

- Keep a default import when a used named import from the same module path is retained.
  
  Previously, when operations were grouped into a single file, a used default import (such as a generated `client` runtime) could be dropped during the merge because its binding was not found in the reconstructed source string, producing references to an undefined value. `combineImports` now retains a default import whenever a used named/type import from the same path survives. ([#3367](https://github.com/kubb-labs/kubb/pull/3367), [`a15e7f7`](https://github.com/kubb-labs/kubb/commit/a15e7f76487e16407d0738c8dd8202b0bdc458c6))

### @kubb/core

#### Features

- Give `output.banner`/`output.footer` per-file context so a directive like `'use server'` can be skipped on re-export files.
  
  A `banner`/`footer` function now receives a `BannerMeta` — the document `InputMeta` extended with the file it is rendered into: `filePath`, `baseName`, `isBarrel` (an `index.ts` barrel), and `isAggregation` (a group `[dir]/[dir].ts` file). Existing `(meta) => ...` functions keep working since `BannerMeta` extends `InputMeta`.
  
  ```ts
  pluginClient({
    output: {
      banner: (meta) => (meta.isBarrel || meta.isAggregation ? '' : "'use server'"),
    },
  })
  ```
  
  Barrel `index.ts` files are now also banner-controllable: when a plugin configures `output.banner`/`footer`, the barrel middleware applies it (flagged `isBarrel: true`). Barrels stay banner-free by default and never inherit the implicit "Generated by Kubb" notice. ([#3371](https://github.com/kubb-labs/kubb/pull/3371), [`699f924`](https://github.com/kubb-labs/kubb/commit/699f924c6d2015f36f922f720333ba68c16c35e9))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.27 — May 23, 2026

### @kubb/adapter-oas

#### Bug Fixes

- - `parseSchema` now propagates the parent name through every call site that previously dropped it: array items (`convertArray`), `allOf` members (single, multi, and synthetic required-key + outer-properties), `oneOf` / `anyOf` member schemas, union members, operation responses (`{operationId}Status{statusCode}`), request bodies (`{operationId}Request`), and parameters (`{operationId}{ParamName}`).
  - Operation response schemas now use `Status<code>` (matching plugin-ts's `resolveResponseStatusName` convention) so qualified enum names don't collide with top-level component schemas named `<operation><statusCode>` (e.g. `GetMaintenance200`).
  - Two test expectations updated to reflect the new contracts:
    - Parameter top-level enums now carry a parser-level name (qualified with operation + param name) so plugin-generated downstream identifiers stay collision-free.
    - The synthetic injected-required-key member inside an `allOf` is now named so its nested enums qualify correctly; it consequently shows up as a separate intersection member instead of being adjacent-merged. ([#3363](https://github.com/kubb-labs/kubb/pull/3363), [`2cb22fe`](https://github.com/kubb-labs/kubb/commit/2cb22fea5e818f6cf96836e43bdebf9cef64981e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.26 — May 22, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Enforce `Array<T>` syntax (over `T[]`) via the oxlint `typescript/array-type` rule. Internal-only change; no runtime or API impact. ([#3360](https://github.com/kubb-labs/kubb/pull/3360), [`ab0abb1`](https://github.com/kubb-labs/kubb/commit/ab0abb1cb23ea4c4b937d0bb0329c6eb1994a55b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.25 — May 22, 2026

### @kubb/parser-md

#### Features

- Add `@kubb/parser-md` for emitting `.md` and `.markdown` files. The parser exposes `parserMd.print` for serialising frontmatter objects to YAML envelopes and reads `file.meta.frontmatter` to prepend frontmatter automatically.
  
  Add markdown components to `@kubb/renderer-jsx` — `Frontmatter`, `Heading`, `Paragraph`, `CodeBlock`, `List`, `Callout` — for authoring `.md` files declaratively in JSX. `Callout` emits GitHub-style alert syntax (`> [!TIP]`) portable across GitHub, GitLab, VitePress, Obsidian, and MDX. ([#3358](https://github.com/kubb-labs/kubb/pull/3358), [`8154649`](https://github.com/kubb-labs/kubb/commit/81546491644a69fab7948e3000a196460e0137af))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.24 — May 21, 2026

### @kubb/core

#### Features

- Expose `print` on `parserTs` and `parserTsx`, slim `@kubb/parser-ts` public API to just those two parsers.
  
  `Parser` (from `@kubb/core`) now requires a `print(...nodes): string` method that renders compiler AST nodes for the parser's language. The TypeScript and TSX parsers implement it via `parserTs.print(...)` / `parserTsx.print(...)`.
  
  `@kubb/parser-ts` no longer re-exports the standalone helpers `print`, `safePrint`, `createImport`, `createExport`, or `validateNodes`. Plugins that depended on `print` / `safePrint` should call `parserTs.print(...)` instead. Custom parsers built with `defineParser` need to add a `print` implementation matching their AST node shape. ([#3356](https://github.com/kubb-labs/kubb/pull/3356), [`69e8c5a`](https://github.com/kubb-labs/kubb/commit/69e8c5a3c127c6beb7e90cd6c2e7d076cb65f858))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.23 — May 21, 2026

### @kubb/agent

#### Features

- Forward additional Kubb lifecycle events to Studio for full event parity with `@kubb/core`.
  
  The agent now relays `kubb:lifecycle:start`, `kubb:lifecycle:end`, `kubb:build:start`, `kubb:build:end`, `kubb:format:start`, `kubb:format:end`, `kubb:lint:start`, `kubb:lint:end`, and `kubb:generation:summary` over the Studio WebSocket. Studio can now render a complete build timeline (per-config build span, format/lint phases) and final generation summary (duration, file count, failed plugins). ([#3344](https://github.com/kubb-labs/kubb/pull/3344), [`4476049`](https://github.com/kubb-labs/kubb/commit/4476049b22db37fc33dc1dc281fedbe2fcaa36c1))

### @kubb/cli

#### Bug Fixes

- Pass the full CLI options to user-defined config functions.
  
  `defineConfig(({ watch, logLevel, config }) => ...)` now actually receives `watch`, `logLevel`, and `config` at runtime. Previously the CLI runner cast `{ input }` to `CLIOptions`, so the other fields were silently `undefined` even though the type promised otherwise.
  
  `CLIOptions.input` is now a documented field (so the cast disappears) and `CLIOptions.logLevel` adds the missing `'verbose'` value to match the CLI's `--logLevel` flag.
  
  ```ts
  // Now works as expected
  export default defineConfig(({ watch }) => ({
    input: { path: './petStore.yaml' },
    output: { path: './src/gen', clean: !watch },
  }))
  ``` ([#3346](https://github.com/kubb-labs/kubb/pull/3346), [`aa8aad3`](https://github.com/kubb-labs/kubb/commit/aa8aad31bf902dc83acf2f2e316d1a4e0b3c8d8c))

### kubb

#### Bug Fixes

- Correct the JSDoc on `defineConfig`: `output.format` and `output.lint` default to `false`, not `'auto'`. The code already applies `false` when the user does not set either option; only the comment was wrong. ([#3346](https://github.com/kubb-labs/kubb/pull/3346), [`aa8aad3`](https://github.com/kubb-labs/kubb/commit/aa8aad31bf902dc83acf2f2e316d1a4e0b3c8d8c))
- `defineConfig` now defaults `root` to `process.cwd()` when omitted. This fixes `The "paths[0]" argument must be of type string. Received undefined` thrown after successful generation when `kubb.config.ts` did not define `root` (the CLI then called `path.resolve(config.root, …)` on the un-normalized config). `@kubb/core`'s internal `resolveConfig` already defaulted `root` for the driver, so generation itself succeeded — the error fired in the CLI's post-generation `outputPath` resolution. ([#3352](https://github.com/kubb-labs/kubb/pull/3352), [`49a60c8`](https://github.com/kubb-labs/kubb/commit/49a60c8cd8051f54ad32fc75a3a62bd6a616725b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.22 — May 20, 2026

### @kubb/core

#### Bug Fixes

- Make sure we can exclude/include operations ([`fa572bb`](https://github.com/kubb-labs/kubb/commit/fa572bb61a3a327e6dd86ca65eb060b5d94f0c14))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

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
