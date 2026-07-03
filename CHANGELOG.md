# Changelog

## v5.0.0-beta.83 — Jul 3, 2026

### @kubb/ast

#### Bug Fixes

- Update the README to match the current export map. The imports table drops the removed `@kubb/ast/utils`, `@kubb/ast/macros`, and `kubb/ast` paths, and a note explains that `@kubb/ast` is the standalone install for AST-only usage while most Kubb code reaches the same surface through the `ast` namespace from `kubb/kit`. ([#3702](https://github.com/kubb-labs/kubb/pull/3702), [`d277b3c`](https://github.com/kubb-labs/kubb/commit/d277b3cb303ca16b94eca3a3fadaee8ab99a0247))

### @kubb/kit

#### Breaking Changes

- Remove the bare `factory` export from `kubb/kit`. Build nodes through `ast.factory` instead.
  
  ```diff
  - import { factory } from 'kubb/kit'
  - factory.createFile(...)
  + import { ast } from 'kubb/kit'
  + ast.factory.createFile(...)
  ``` ([#3702](https://github.com/kubb-labs/kubb/pull/3702), [`e9199ef`](https://github.com/kubb-labs/kubb/commit/e9199ef3dfd80851503390e148a7cdeb143bd60f))

### kubb

#### Breaking Changes

- Remove the `kubb/ast` subpath. Reach the AST through the `ast` namespace from `kubb/kit`, and install `@kubb/ast` when you want the AST on its own.
  
  ```diff
  - import { extractRefName, walk } from 'kubb/ast'
  + import { ast } from 'kubb/kit'
  + // ast.extractRefName(...), ast.walk(...)
  ``` ([#3702](https://github.com/kubb-labs/kubb/pull/3702), [`eb2915e`](https://github.com/kubb-labs/kubb/commit/eb2915e0bede83348ba5a1506a9d19bad1972cc9))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.82 — Jul 3, 2026

### @kubb/core

#### Bug Fixes

- Re-export `createKubb` from the `kubb` package so you can run a build programmatically without adding `@kubb/core` as a separate dependency.
  
  `kubb` now re-exports `createKubb` (and the `BuildOutput`, `Config`, `CreateKubbOptions`, `Kubb`, and `UserConfig` types) from `@kubb/core`. It is the same function, so pass your `adapter`, `parsers`, and plugins as you would with `@kubb/core`. `@kubb/core` now also exports the `CreateKubbOptions` type. ([#3698](https://github.com/kubb-labs/kubb/pull/3698), [`098f9bd`](https://github.com/kubb-labs/kubb/commit/098f9bd2f142bcf5e223847794740ce67c92386b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.81 — Jul 3, 2026

### @kubb/ast

#### Breaking Changes

- Fold the `@kubb/ast/utils` and `@kubb/ast/macros` subpaths into the root `@kubb/ast` export and remove both subpaths.
  
  ```diff
  - import { extractRefName, syncSchemaRef } from '@kubb/ast/utils'
  + import { extractRefName, syncSchemaRef } from '@kubb/ast'
  
  - import { macroSimplifyUnion } from '@kubb/ast/macros'
  + import { macroSimplifyUnion } from '@kubb/ast'
  ```
  
  `@kubb/ast/types` is unaffected. ([#3693](https://github.com/kubb-labs/kubb/pull/3693), [`d546ee1`](https://github.com/kubb-labs/kubb/commit/d546ee11f6a76e332db153214d3540abe85b984c))

### @kubb/core

#### Breaking Changes

- Remove the `ast` re-export from `@kubb/core`. Import it from `@kubb/ast` instead (or `kubb/kit`, which re-exports it alongside the rest of the authoring toolkit).
  
  ```diff
  - import { ast } from '@kubb/core'
  + import { ast } from '@kubb/ast'
  ``` ([#3693](https://github.com/kubb-labs/kubb/pull/3693), [`d546ee1`](https://github.com/kubb-labs/kubb/commit/d546ee11f6a76e332db153214d3540abe85b984c))

#### Bug Fixes

- Fix `resolveOptions` throwing `Invalid value used as weak map key` when a plugin's `options` is falsy but not `null`/`undefined` (for example `false`), such as a plugin re-instantiated by an external merge (Kubb Studio, custom tooling) with an unexpected options value. The memoization cache now only keys by `options` when it's actually an object, falling back to a direct (uncached) resolve otherwise. ([#3694](https://github.com/kubb-labs/kubb/pull/3694), [`20cb559`](https://github.com/kubb-labs/kubb/commit/20cb55925196c93521c106dcc1867fd7fae5a23d))

### @kubb/kit

#### Features

- Add `@kubb/kit`, the authoring toolkit for plugins, generators, adapters, resolvers, and renderers, re-exporting `definePlugin`, `defineGenerator`, `defineResolver`, `defineParser`, `createAdapter`, `createRenderer`, `createStorage`, `Diagnostics`, `memoryStorage`, `fsStorage`, the `ast` namespace and `factory` node builders, and their companion option and hook types. `@kubb/kit/testing` holds the Vitest-backed test helpers (`createMockedPlugin`, `createMockedAdapter`, `renderGeneratorOperation`, `matchFiles`) on a separate entry point so the main import never pulls in Vitest.
  
  `kubb` gains matching subpaths so most consumers never need to install `@kubb/kit`, `@kubb/ast`, or `@kubb/renderer-jsx` directly:
  
  - `kubb/kit` and `kubb/kit/testing` re-export `@kubb/kit`
  - `kubb/ast` re-exports everything `@kubb/ast` exports except `ast` and `factory`, which live in `kubb/kit` instead, alongside the rest of the plugin authoring toolkit
  - `kubb/jsx` re-exports `@kubb/renderer-jsx` and its types, with `kubb/jsx/jsx-runtime` and `kubb/jsx/jsx-dev-runtime` for `jsxImportSource: "kubb/jsx"`
  - `kubb/config` re-exports `defineConfig`, which also stays on the `kubb` root
  
  `@kubb/core`, `@kubb/ast`, and `@kubb/renderer-jsx` stay published and importable directly. This is additive: existing imports keep working. ([#3693](https://github.com/kubb-labs/kubb/pull/3693), [`d546ee1`](https://github.com/kubb-labs/kubb/commit/d546ee11f6a76e332db153214d3540abe85b984c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.80 — Jul 2, 2026

### @kubb/ast

#### Features

- Let a printer node override reuse the handler it replaces. A printer builder can now pass user handlers through the new `overrides` field instead of spreading them into `nodes`, and an override can call `this.base(node)` to get the built-in output and wrap it:
  
  ```ts
  pluginZod({
    printer: {
      nodes: {
        object(node) {
          return `${this.base(node)}.openapi(${JSON.stringify({ description: node.description })})`
        },
      },
    },
  })
  ``` ([#3689](https://github.com/kubb-labs/kubb/pull/3689), [`ba518fa`](https://github.com/kubb-labs/kubb/commit/ba518fa20bce515a3533c69ce17714a913ec8221))

### @kubb/parser-md

#### Bug Fixes

- Correct the `parserMd` JSDoc: the parser runs by default next to `parserTs` and `parserTsx` instead of being opt-in, and a custom `parsers` array replaces the default set. ([#3689](https://github.com/kubb-labs/kubb/pull/3689), [`a60888d`](https://github.com/kubb-labs/kubb/commit/a60888d6607baff0231eeb410bca797c22f5c00f))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.79 — Jun 30, 2026

### @kubb/cli

#### Bug Fixes

- Cleanup defineLogger

## v5.0.0-beta.78 — Jun 29, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Fall back to `unknown` for a `$ref` that points at a component the document never defines.
  
  A malformed spec can `$ref` a component (for example `#/components/schemas/AppFeeAllocation`) that is missing from `components.schemas`. The parser used to emit a `ref` node for it anyway, so generators produced an import to a module that was never written and the output failed to compile. Such refs now resolve to an `unknown` node, leaving the surrounding schema usable. Registry-less fragments (a minimal `parseSchema` call with no `components`) keep parsing refs leniently, since the target is expected to live outside the fragment. ([#3685](https://github.com/kubb-labs/kubb/pull/3685), [`a2272a8`](https://github.com/kubb-labs/kubb/commit/a2272a8ae264cfb8cd5b23981d9950f1e76d3122))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.77 — Jun 29, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Fix `getImports` importing the un-renamed name for collision-renamed schemas.
  
  When two component schemas collide (case-insensitively, or across sources like `schemas` vs `requestBodies`), the schema is renamed (`Order` -> `OrderSchema`) and recorded in `nameMapping`. `getImports` looked that map up with the bare ref segment (`Order`), but its keys are full component pointers (`#/components/schemas/Order`), so every lookup missed and a `$ref` to a renamed schema imported the original name and path — a file the writer never emitted (`TS2307`). The lookup now uses the full `$ref`, so importers stay in sync with the renamed files. ([#3681](https://github.com/kubb-labs/kubb/pull/3681), [`972fba0`](https://github.com/kubb-labs/kubb/commit/972fba03f85c2a3ee0c6f0764e6ff82e2f4f94bb))

### @kubb/parser-ts

#### Bug Fixes

- Faster code generation with less allocation churn on large specs.
  
  Profiling with [`@e18e/deopt`](https://github.com/e18e/deopt) and GC tracing turned up generation hot paths that kept falling off V8's fast path. The node factory now writes `kind` at a fixed offset so visitor and printer dispatch stays monomorphic, `transform` rebuilds an array only once a child actually changes, and `createFile` skips building the source text for files with no imports. A dictionary-mode `delete`, an iterator allocation, and a few `map().filter().join()` chains are gone too.
  
  Output is unchanged. Local benchmarks run about 16 to 17% faster with fewer GC cycles. ([#3683](https://github.com/kubb-labs/kubb/pull/3683), [`9bd4b7f`](https://github.com/kubb-labs/kubb/commit/9bd4b7f641e772108656cfa8950fa3c780cf7f2e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.76 — Jun 26, 2026

### @kubb/ast

#### Features

- Capture the OpenAPI parameter `style` and `explode` on the AST.
  
  `ParameterNode` gains optional `style` (`'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'`) and `explode` fields, and the OpenAPI adapter now reads them from each parameter object. Both stay `undefined` when the spec omits them, so consumers keep applying the per-location default. This lets client generators emit per-parameter serialization metadata for full `label` / `matrix` path-parameter support. ([#3676](https://github.com/kubb-labs/kubb/pull/3676), [`7ce0de6`](https://github.com/kubb-labs/kubb/commit/7ce0de6cd06dc8513c15f73b498509c46654ace5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.75 — Jun 26, 2026

### @kubb/adapter-oas

#### Features

- Read enum member descriptions from the `x-enumDescriptions` and `x-enum-descriptions` vendor extensions.
  
  `adapter-oas` already mapped the `x-enumNames` / `x-enum-varnames` names into `namedEnumValues`. It now reads the matching description extensions too, attaching each label to its `namedEnumValues` entry through a new optional `description` on the AST `EnumValueNode`. An enum that carries only `x-enum-descriptions` (no varnames) now produces `namedEnumValues` as well, so those labels survive instead of being dropped. `@kubb/plugin-ts` renders them as per-member JSDoc. ([#3669](https://github.com/kubb-labs/kubb/pull/3669), [`5d7b128`](https://github.com/kubb-labs/kubb/commit/5d7b128f09adebf20a8855de9abc66a1d24d3231))

#### Bug Fixes

- Narrow `oneOf`/`anyOf` discriminated unions that omit a `mapping`.
  
  A `discriminator` without a `mapping` still has a value per branch: OpenAPI takes it from the variant's own schema name. The parser now folds that literal into each `$ref` branch, turning a bare `Cat | Dog` into `(Cat & { petType: "Cat" }) | (Dog & { petType: "Dog" })`. Generated types, Zod schemas, and Faker mocks then narrow on the discriminator field, matching what an explicit `mapping` already produces.
  
  A variant that pins the discriminator to its own `enum` or `const` is left as a plain ref, because intersecting two different literals collapses the property to `never`. Unresolvable refs and plain unions stay untouched. ([#3673](https://github.com/kubb-labs/kubb/pull/3673), [`6e25c4e`](https://github.com/kubb-labs/kubb/commit/6e25c4e6fe71f8f7ee5e29c543195c1395f87375))
- Stop treating an OpenAPI 3.1 `const` as a named enum.
  
  A `const` is parsed into a single-value enum. The pre-scan no longer records these in `enumNames`, and `enums: 'root'` no longer lifts them to top-level enums, so a reference to a `const` resolves to its plain name and `@kubb/plugin-ts` can render it as an inline literal. ([#3672](https://github.com/kubb-labs/kubb/pull/3672), [`4e1ed4f`](https://github.com/kubb-labs/kubb/commit/4e1ed4fd97ffbbc7589ed9093413164f982ea5a3))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.74 — Jun 23, 2026

### @kubb/core

#### Features

- Let `ctx.addGenerator` register several generators in one call. Pass them as separate arguments (`ctx.addGenerator(schemaGenerator, operationGenerator)`) or hand it an existing list (`ctx.addGenerator(selectedGenerators)`), and the arrays are flattened for you. A single generator still works as before, so there is no need to loop over each one. ([#3663](https://github.com/kubb-labs/kubb/pull/3663), [`c21d008`](https://github.com/kubb-labs/kubb/commit/c21d0086234ae474aed3d32fa72e43af0bd8e190))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.73 — Jun 22, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Close tuples when `prefixItems` is paired with `items: false`.
  
  A `prefixItems` schema with `items: false` is the canonical closed-tuple pattern in JSON Schema 2020-12 / OpenAPI 3.1: the prefix defines the positions and `items: false` forbids any extra elements. The boolean was being read as a falsy rest schema, so the tuple gained a stray `...any[]` tail (`[number, number, ...any[]]`) that both allowed extra elements and widened them to `any`. The rest element is now omitted, producing a closed `[number, number]`. An absent `items` still widens the tail to `any`, and `items: true` keeps the unconstrained rest. ([#3651](https://github.com/kubb-labs/kubb/pull/3651), [`7bbc0f6`](https://github.com/kubb-labs/kubb/commit/7bbc0f651035d9c601b9b9212b21db064c26d50d))

### @kubb/cli

#### Bug Fixes

- `kubb init` now scaffolds and lists `@kubb/plugin-axios` and `@kubb/plugin-fetch` instead of the removed `@kubb/plugin-client`. ([#3650](https://github.com/kubb-labs/kubb/pull/3650), [`7577c64`](https://github.com/kubb-labs/kubb/commit/7577c649f667de350e63f7217ca28c8d9922fdb8))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.72 — Jun 20, 2026

### @kubb/ast

#### Breaking Changes

- Remove the TypeScript function-parameter model from `@kubb/ast`. The function-parameter nodes and factories (`createFunctionParameter`, `createFunctionParameters`, `createTypeLiteral`, `createIndexedAccessType`, `createObjectBindingPattern`), the `createOperationParams` builder, the `caseParams` helper, and the `OperationParamsResolver` type are no longer part of `@kubb/ast`. These are language-specific code generation, so they now live in `@kubb/plugin-ts` (the node model and `createOperationParams`) and the shared plugin internals (`caseParams`, `OperationParamsResolver`). `@kubb/ast` keeps the spec-agnostic node tree. ([#3647](https://github.com/kubb-labs/kubb/pull/3647), [`1fd1136`](https://github.com/kubb-labs/kubb/commit/1fd113658911141979bcc80c4baeb2e9c23ea946))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.71 — Jun 20, 2026

### @kubb/ast

#### Bug Fixes

- Let `createFunctionParameter` accept a pre-built `ObjectBindingPatternNode` as its `name`.
  
  The `name`-form input now takes `string | ObjectBindingPatternNode`, so a destructured group that is typed from a single reference (or carries no type) can go through the factory instead of a hand-built `{ kind: 'FunctionParameter' }` literal, for example `createFunctionParameter({ name: createObjectBindingPattern({ elements: [{ name: 'path' }] }), type: "Omit<Config, 'url'>", default: '{}' })`. The `FunctionParameterNode` shape is unchanged. ([#3643](https://github.com/kubb-labs/kubb/pull/3643), [`711d1f2`](https://github.com/kubb-labs/kubb/commit/711d1f210a2273f254f8178344ea43cd766bdb19))
- Stop re-exporting unused internal helpers from `@kubb/ast/utils`.
  
  `resolveRefName`, `resolveGroupType`, `buildGroupParam`, `buildTypeLiteral`, and `resolveParamType`, plus the `MappedProperty`, `MappedSchema`, `SchemaTransform`, `BuildGroupArgs`, and `ParamGroupType` types, were exported from the `@kubb/ast/utils` barrel but nothing consumed them through it. They stay available to the package internally. Keep importing the public helpers (`caseParams`, `createOperationParams`, `mapSchemaItems`, `syncSchemaRef`, and the rest) as before. ([#3640](https://github.com/kubb-labs/kubb/pull/3640), [`02fc0f6`](https://github.com/kubb-labs/kubb/commit/02fc0f6612009575d09e0017178b7021eea08f08))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.70 — Jun 19, 2026

### @kubb/core

#### Bug Fixes

- Simplify the generate phase: schema and operation nodes now run through each plugin's generators in a single ordered pass instead of parallel batches.
  
  The generators run synchronously, so the old `Promise.all` batching never overlapped any work. It only marked where queued writes flushed. The pass now walks nodes in order and flushes every `GENERATE_FLUSH_EVERY` nodes (the renamed `SCHEMA_PARALLEL`), keeping the generation/write overlap that speeds up large specs on disk while dropping the `forBatches` helper. ([#3638](https://github.com/kubb-labs/kubb/pull/3638), [`3055bca`](https://github.com/kubb-labs/kubb/commit/3055bca1a41b7c41a841c1b66769b38bd4b9fed0))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.69 — Jun 18, 2026

### @kubb/adapter-oas

#### Breaking Changes

- `@kubb/adapter-oas` no longer deduplicates schemas, and the `dedupe` option is removed. Every named schema in the spec becomes its own type, and inline shapes stay inline.
  
  Earlier versions collapsed structurally identical schemas into one shared definition and hoisted repeated inline shapes under an invented name. That hoisting could collide with a generated operation type (a shared `{ error?: string }` 400 response became `PostV1WorkoutsStatus400`, the same name the response-status type uses), producing a self-referential `export type X = X` and duplicate exports. Output is now faithful to the spec: to share a shape, name it as a component and `$ref` it.
  
  `@kubb/ast`: the dialect `dedupe` seam is removed — `defineDialect` no longer accepts a `dedupe` member and the `Dedupe` type is gone. The `signatureOf` and `isSchemaEqual` helpers are removed too, since deduplication was their only consumer. ([#3632](https://github.com/kubb-labs/kubb/pull/3632), [`8addaf3`](https://github.com/kubb-labs/kubb/commit/8addaf354b8440ce820c338c820d308e1116e46e))

#### Features

- Add an `enums` option to `adapterOas` that controls where inline enums live. The default `'inline'` keeps each enum on the property that declares it. `'root'` lifts every inline enum to a reusable top-level schema named after its context (e.g. `PetStatusEnum`) and references it wherever it appears, so types, zod, and faker all share one definition. ([#3632](https://github.com/kubb-labs/kubb/pull/3632), [`8addaf3`](https://github.com/kubb-labs/kubb/commit/8addaf354b8440ce820c338c820d308e1116e46e))
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

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.68 — Jun 17, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Reframe each package description and its keywords around Kubb. Only the `kubb` meta-package calls itself the meta framework for code generation, and only `@kubb/adapter-oas` still names OpenAPI and Swagger, since that is the package that parses them. The READMEs use the same wording. ([#3625](https://github.com/kubb-labs/kubb/pull/3625), [`420c8d4`](https://github.com/kubb-labs/kubb/commit/420c8d446e6e1c3855d76b4d2c762dadbfe78ee2))

### @kubb/ast

#### Features

- Add a `copy` field to the file model so plugins can emit a real on-disk file into the generated folder verbatim. Set `copy` to an absolute path on a `UserFileNode` (via `injectFile`/`upsertFile` or `createFile`), or pass `copy` to the JSX `<File copy={…} />` component, and Kubb writes that file's content unchanged, applying only `banner`/`footer` and bypassing the language parser. This lets a plugin ship a hand-authored template as a real `.ts` file and drop it into the output without inlining its source as a string.
  
  Remove the unused `output.override` boolean from the config and plugin output options. It was documented as overwriting or skipping existing files, but nothing in the write path read it (`fsStorage` already skips writes only when content is byte-identical), so it had no effect. ([#3627](https://github.com/kubb-labs/kubb/pull/3627), [`bf1a3a8`](https://github.com/kubb-labs/kubb/commit/bf1a3a825400c10a34fe149f6fa1a54b4fef67c7))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.67 — Jun 17, 2026

### @kubb/ast

#### Breaking Changes

- Rename `definePrinter` to `createPrinter` and drop the `createPrinterFactory` export.
  
  `createPrinter` is the single helper for building a schema printer. The generic `createPrinterFactory` that sat behind it is now inlined, since the only consumer that keyed a printer by a field other than `node.type` (`@kubb/plugin-ts`'s function printer) no longer needs it. Replace `definePrinter(...)` with `createPrinter(...)`; the builder shape, options, and `Printer` result are unchanged. ([#3622](https://github.com/kubb-labs/kubb/pull/3622), [`e2caa72`](https://github.com/kubb-labs/kubb/commit/e2caa728b774897d4f526ac54c755196a72ac560))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.66 — Jun 17, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Keep generating a request body schema for `application/octet-stream` bodies.
  
  The 3.0 -> 3.1 upgrade drops the schema from an `application/octet-stream` request body, leaving an empty media type object. `getRequestSchema` now recognizes a binary media type and synthesizes the `{ type: 'string', contentMediaType: 'application/octet-stream' }` schema, so operations like `uploadFile` still emit a binary request body type (for example the Zod `uploadFileDataSchema`). ([#3621](https://github.com/kubb-labs/kubb/pull/3621), [`f6d1256`](https://github.com/kubb-labs/kubb/commit/f6d1256348a853c13c713e93b894e9e64866fb5f))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.65 — Jun 17, 2026

### @kubb/adapter-oas

#### Features

- Normalize every input to OpenAPI 3.1 and drop the 3.0 type union.
  
  `parseDocument` upgrades documents to 3.1 (`upgrade(document, '3.1')`), so Swagger 2.0 and OpenAPI 3.0 inputs keep working, they just upgrade further. The exported `Document`, `SchemaObject`, `OperationObject`, `ResponseObject` and related types are now 3.1 only (`OpenAPIV3_1`). That is breaking for code importing them expecting 3.0 shapes such as `nullable` on a schema.
  
  The AST schema node now carries an `examples` array, populated from the OAS 3.1 `examples`, instead of a singular `example`.
  
  `parseDocument` also loses its `canBundle` option. A string is always a file path or URL to bundle, an object is an already-parsed document. ([#3619](https://github.com/kubb-labs/kubb/pull/3619), [`30ec0b4`](https://github.com/kubb-labs/kubb/commit/30ec0b4c238c3a4b8fc86aff9b423f88bc285c0a))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.64 — Jun 17, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Convert Swagger 2.0 specs with `@scalar/openapi-upgrader` instead of `swagger2openapi`.
  
  The old converter pulled in the legacy oas-kit and node-fetch dependency tree (around 1.5 MB) for a single `convertObj` call. `@scalar/openapi-upgrader` is a focused ESM package that does the same 2.0 to 3.0 transform, cutting install size to roughly 480 KB. The upgrader runs on every parsed document and only rewrites Swagger 2.0 input (it checks for `swagger: '2.0'` internally), so OpenAPI 3.0 and 3.1 documents pass through untouched. The internal `isOpenApiV2Document` guard is gone as a result. ([#3611](https://github.com/kubb-labs/kubb/pull/3611), [`8bd4085`](https://github.com/kubb-labs/kubb/commit/8bd4085f7ab455099890454439ac5f7699109268))

### @kubb/ast

#### Bug Fixes

- Stop publishing `src/` in the package tarballs.
  
  The shipped sourcemaps already embed their sources and no declaration maps point at `src/`, so source-level debugging and go-to-definition are unaffected while each tarball drops by roughly a third. ([#3611](https://github.com/kubb-labs/kubb/pull/3611), [`8bd4085`](https://github.com/kubb-labs/kubb/commit/8bd4085f7ab455099890454439ac5f7699109268))
- Expose every `@kubb/ast` export under a single `ast` namespace and make the package tree-shakable.
  
  `import { ast } from '@kubb/ast'` (or from `@kubb/core`) now reaches the whole surface the way the TypeScript compiler exposes `ts.factory`, for example `ast.factory.createSchema(...)`. The namespace is a compile-time re-export and the package is marked side-effect-free, so a bundler keeps only the factories you actually use. Flat named imports such as `import { factory, defineNode } from '@kubb/ast'` keep working. ([#3611](https://github.com/kubb-labs/kubb/pull/3611), [`8bd4085`](https://github.com/kubb-labs/kubb/commit/8bd4085f7ab455099890454439ac5f7699109268))

### @kubb/cli

#### Bug Fixes

- Load the Kubb config with `unconfig` and accept only JavaScript and TypeScript module configs.
  
  Discovery now matches `kubb.config.{ts,mts,cts,js,mjs,cjs}` and the matching `.kubbrc.*` variants (also under `.config/` and `configs/`). YAML, JSON, and the `package.json` `kubb` key are no longer read, since a Kubb config is defined with `defineConfig` and plugin function calls that those formats cannot express. This replaces `cosmiconfig` and its YAML and JSON loader chain, reducing install size. TypeScript and JSX configs keep loading through the existing jiti loader. ([#3611](https://github.com/kubb-labs/kubb/pull/3611), [`8bd4085`](https://github.com/kubb-labs/kubb/commit/8bd4085f7ab455099890454439ac5f7699109268))

### @kubb/core

#### Bug Fixes

- Lead terminal diagnostics with the code and rename the help/docs labels.
  
  A diagnostic now prints as `[CODE] plugin: message` with the code tinted by severity, followed by indented `at:`, `fix:`, and `see:` rows. The `help:` and `docs:` labels are renamed to `fix:` and `see:`, matching the diagnostics docs pages, and the standalone `×`/`⚠`/`ℹ` glyph is dropped. The `--reporter json` output and the `SerializedDiagnostic` fields (`help`, `docsUrl`) are unchanged. ([#3606](https://github.com/kubb-labs/kubb/pull/3606), [`799c660`](https://github.com/kubb-labs/kubb/commit/799c66050922f0f2c8becf2255e096c524ba16d9))

### @kubb/mcp

#### Bug Fixes

- Serve the MCP server over stdio only and drop the HTTP transport.
  
  Every local MCP client (Claude, Copilot, editors) launches the server as a subprocess and talks to it over stdio, so the HTTP transport and its `--port` and `--host` flags are removed along with the `@remix-run/node-fetch-server` and `@tmcp/transport-http` dependencies. `startServer()` no longer takes `port` or `host` options. ([#3611](https://github.com/kubb-labs/kubb/pull/3611), [`8bd4085`](https://github.com/kubb-labs/kubb/commit/8bd4085f7ab455099890454439ac5f7699109268))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.63 — Jun 16, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Consolidate the OAS dedupe pass behind a single `Plan` object. `plan()` now returns one object that owns its rewriting: `apply` for operations and nested schemas, `applyTopLevel` for top-level schemas, and `isAlias` to skip a duplicate top-level name. The internal `DedupePlan`, `DedupeLookups`, and `DedupeTarget` types and the standalone `apply` function are gone, and the `@kubb/ast` `Dedupe` seam drops its `apply` member because the plan carries that behavior. Generated output is unchanged. ([`39e4f79`](https://github.com/kubb-labs/kubb/commit/39e4f79088fde00a21ce33f09a85cae1396d84ac))
- Review JSDoc and code comments across these packages so the shipped docs match the current code. The pass corrects stale claims (a `PluginDriver` reference that is now `KubbDriver`, a reversed formatter-detection order, a `--debug` flag that no longer exists, lowercase HTTP methods that are actually uppercase) and removes unverifiable assertions. Comments only, no code or generated output changes. ([`39e4f79`](https://github.com/kubb-labs/kubb/commit/39e4f79088fde00a21ce33f09a85cae1396d84ac))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.62 — Jun 16, 2026

### @kubb/ast

#### Bug Fixes

- Colocate the node builders with their definitions. `createFile` now lives in `nodes/file.ts` alongside the other `createX` helpers, the per-node factory tests sit next to each node module, and the `node.ts`/`printer.ts` modules are renamed to `defineNode.ts`/`definePrinter.ts` to match their exports. Public API and generated output are unchanged. ([`73f6e86`](https://github.com/kubb-labs/kubb/commit/73f6e86aff80b48eb2cff5657b711c198ebeeeae))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.61 — Jun 15, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Consolidate the OAS parser's per-site macro calls behind `applyShallow` and a `nameEnums` helper. Output is unchanged; the parser test suite stays byte-identical. ([#3600](https://github.com/kubb-labs/kubb/pull/3600), [`ec32ab9`](https://github.com/kubb-labs/kubb/commit/ec32ab9dd7ede355c0b8f712c870cf27ae63e6c6))

### @kubb/ast

#### Breaking Changes

- Add macros, a named and composable way to rewrite the AST, and make them the single transform layer.
  
  `defineMacro`, `composeMacros`, and `applyMacros` live on the `@kubb/ast` root and turn an anonymous transform into a named unit with an optional `enforce` order and a `when` gate. Macros follow the `macro<Name>` convention, mirroring plugins (`pluginTs`). The built-in presets live on the new `@kubb/ast/macros` subpath, one file per macro. Plugins register macros through the new `addMacro` and `setMacros` setup-context methods in `@kubb/core`, replacing the old `setTransformer`.
  
  The plugin `transformer?: Visitor` field is gone, and `createMockedPlugin` from `@kubb/core/mocks` takes `macros` instead of a `transformer` visitor.
  
  The schema rewriters are retired into macros. `setDiscriminatorEnum`, `simplifyUnion`, and `setEnumName` are removed from `@kubb/ast` and replaced by `macroDiscriminatorEnum`, `macroSimplifyUnion`, and `macroEnumName` on `@kubb/ast/macros`. `mergeAdjacentObjects` and `syncSchemaRef` move to the `@kubb/ast/utils` subpath. `@kubb/adapter-oas` normalizes through these macros. ([#3600](https://github.com/kubb-labs/kubb/pull/3600), [`f5b4db2`](https://github.com/kubb-labs/kubb/commit/f5b4db2efc073b6b33e613c1cbe075a264a83f03))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.60 — Jun 15, 2026

### @kubb/ast

#### Features

- Add shared schema-traversal helpers to `@kubb/ast/utils` for printers to build on. `mapSchemaProperties`, `mapSchemaMembers`, and `mapSchemaItems` walk an object's properties, a union or intersection's members, and an array or tuple's items, pairing each child with its transformed output. They are generic over the output type, so a printer can return `string` or `ts.TypeNode`. `lazyGetter` emits the `get key() { return body }` form for circular-ref positions, and `resolveRefName` is now exported from the subpath as the shared ref-name resolver. Pure addition, no behavior change. ([#3596](https://github.com/kubb-labs/kubb/pull/3596), [`67bb92c`](https://github.com/kubb-labs/kubb/commit/67bb92c8b1e4988742d9e94d4fde5aa3d2e3ba48))

#### Bug Fixes

- Fix the CJS build dropping re-export-only `@kubb/ast/utils` helpers.
  
  With `"sideEffects": false`, rolldown tree-shook the modules that the `utils` subpath only re-exports (`schemaGraph`, `operationParams`, `codegen`, `strings`, and friends) out of the multi-entry CJS bundle, while still emitting their export getters. Requiring `@kubb/ast/utils` from a CommonJS context then threw `findCircularSchemas is not defined` (and the same for `createOperationParams`, `containsCircularRef`, `caseParams`, `buildJSDoc`, and the rest). The ESM build was unaffected, so this only surfaced for CJS consumers such as a `kubb.config.cjs`. Dropping the `sideEffects` declaration keeps those modules in the CJS output. ([#3598](https://github.com/kubb-labs/kubb/pull/3598), [`3c3f03d`](https://github.com/kubb-labs/kubb/commit/3c3f03d29c7697456c8a3ae5f087bf116fa0586d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.59 — Jun 15, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Tighten the JSDoc prose across the core packages so the published types read naturally. This cuts rule-of-three filler, `-ing`-participle clauses, clause-joining semicolons, marketing words, and sentences that only restate the TypeScript type. The change is comment-only, so no API or behavior changes. ([#3593](https://github.com/kubb-labs/kubb/pull/3593), [`1f71069`](https://github.com/kubb-labs/kubb/commit/1f7106995ed5d3eb6cd4cfc9fca711fe359e92d4))

### @kubb/ast

#### Features

- Reduce the files you touch to add a node.
  
  `types.ts` now derives its node-type exports from the node barrel (`export type * from './nodes/index.ts'`) instead of a hand-maintained list, so adding a node no longer edits `types.ts`. This also surfaces five node types the old list had drifted from: `BreakNode`, `ContentNode`, `GenericOperationNode`, `RequestBodyNode`, and `ScalarSchemaNode`.
  
  The `@kubb/ast` barrel now sources its node defs from the registry (`export * from './registry.ts'`), so adding a node no longer edits the barrel either. This surfaces `nodeDefs` on the barrel. The visitor tables it derives stay internal to `visitor.ts`.
  
  A new test fails when a node def has no matching `factory.create*`, so missing wiring is caught in CI. The package README documents the remaining touch-points. ([#3595](https://github.com/kubb-labs/kubb/pull/3595), [`4dcfe98`](https://github.com/kubb-labs/kubb/commit/4dcfe98b0bc6b5c0ba393fa42a4e26b7ead471dd))
- Clarify the `@kubb/ast` abstraction boundaries. No runtime behavior changes.
  
  `dedupe.ts` and `utils/fileMerge.ts` each gained a header that explains the split. `dedupe.ts` collapses duplicate schema shapes by structural signature, while `fileMerge.ts` merges one file's imports, exports, and sources.
  
  `syncSchemaRef` now lives in `transformers.ts` next to the other `SchemaNode` transforms. It is still exported from `@kubb/ast/utils`, so its import path is unchanged.
  
  `createOperationParams` is no longer surfaced through the `factory` namespace. It is a high-level builder, not a `ts.factory` primitive, so import it from `@kubb/ast/utils` instead of `ast.factory`.
  
  The OpenAPI discriminator helpers `createDiscriminantNode` and `findDiscriminator` moved out of `@kubb/ast` into `@kubb/adapter-oas`, since the OAS adapter was their only consumer. This keeps `@kubb/ast` spec-agnostic. ([#3594](https://github.com/kubb-labs/kubb/pull/3594), [`25b7936`](https://github.com/kubb-labs/kubb/commit/25b79363f8bd1829cafbbb9b33fa3b1393099776))

#### Bug Fixes

- Reorganize the `@kubb/ast` utils layer into concern-based modules. The grab-bag `utils/ast.ts` and `utils/index.ts` files now split into `strings.ts`, `codegen.ts`, `refs.ts`, `schemaGraph.ts`, `operationParams.ts`, and `fileMerge.ts`, each with its tests alongside it. `utils/index.ts` stays a thin barrel, so `@kubb/ast`, `@kubb/ast/factory`, `@kubb/ast/types`, and `@kubb/ast/utils` export the same names with the same behavior. No public API changes. ([#3591](https://github.com/kubb-labs/kubb/pull/3591), [`c069f04`](https://github.com/kubb-labs/kubb/commit/c069f0494ec0473f54cafd5cdeca2be3f4bf1313))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.58 — Jun 14, 2026

### @kubb/ast

#### Breaking Changes

- Reshape the `@kubb/ast` factory surface around an `ast.factory` namespace that mirrors `ts.factory.createX`.
  
  The flat `createX` node constructors leave the `@kubb/ast` root barrel. Reach them through the `factory` namespace as `ast.factory.createSchema(...)`, or import them from the new `@kubb/ast/factory` subpath. Migrate `createSchema(...)` and `ast.createSchema(...)` calls to `ast.factory.createSchema(...)`.
  
  The node and AST helpers `buildGroupParam`, `buildTypeLiteral`, `caseParams`, `collectUsedSchemaNames`, `containsCircularRef`, `findCircularSchemas`, `isStringType`, `resolveParamType`, and `syncSchemaRef` move off the root barrel onto the `@kubb/ast/utils` subpath. Import them from `@kubb/ast/utils` rather than `@kubb/ast` or the `ast` namespace.
  
  `createStreamInput` folds into `createInput`. Pass `stream: true` for the streaming variant: `createInput({ stream: true, schemas, operations, meta })` returns the streaming `InputNode<true>` with `AsyncIterable` sources, while `createInput({ schemas, operations })` still returns the eager `InputNode`.
  
  The function-parameter printer key type `FunctionNodeType` becomes `FunctionParamKind`, derived from `FunctionParamNode['kind']` so its values match the PascalCase node `kind` discriminants.
  
  `@kubb/core` re-exports `@kubb/ast` as the `ast` namespace, so `import { ast } from '@kubb/core'` reaches node definitions as `ast.schemaDef`, guards and helpers as `ast.narrowSchema`, and constructors as `ast.factory.createSchema(...)`. ([#3570](https://github.com/kubb-labs/kubb/pull/3570), [`3553f14`](https://github.com/kubb-labs/kubb/commit/3553f146288fd7e672c57dd0ba62caebb0b1dff0))

#### Features

- Split the operation-parameter helpers across `@kubb/ast` by what they return. The node builders `resolveParamType`, `buildGroupParam`, and `buildTypeLiteral` stay on the main `@kubb/ast` entry. The helpers that return plain values move to the `@kubb/ast/utils` subpath: `resolveGroupType` (a `ParamGroupType` descriptor) and `extractStringsFromNodes` (a string), along with the `ParamGroupType` and `BuildGroupArgs` types.
  
  `extractStringsFromNodes` is no longer re-exported from the main `@kubb/ast` barrel or the `ast` namespace re-exported by `@kubb/core`. Import it from `@kubb/ast/utils` instead. The plugins migration (Phase 2) builds query, header, and path parameter groups from these helpers instead of redefining them. ([#3570](https://github.com/kubb-labs/kubb/pull/3570), [`f213bed`](https://github.com/kubb-labs/kubb/commit/f213bed895a418f3685f8c9262947ee4ae333689))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.57 — Jun 14, 2026

### @kubb/ast

#### Breaking Changes

- Reshape function parameter and type nodes onto the `ts.factory` model.
  
  A type reference is now a plain `string`. The `ParamsType` node (with its `reference`, `struct`, and `member` variants) and the separate `ParameterGroup` node are gone. Three new nodes replace them: `TypeLiteral` for an inline object type (`{ petId: string; name?: string }`), `IndexedAccessType` for a single field read from a named type (`PathParams['petId']`), and `ObjectBindingPattern` for a destructured binding (`{ id, name }`).
  
  `createFunctionParameter` now takes either a `name` or a flat `properties` list. Passing `properties` builds one destructured parameter, an `ObjectBindingPattern` name paired with a `TypeLiteral` type, so a whole group is a single parameter instead of its own node type.
  
  Migration:
  
  - `createParamsType({ variant: 'reference', name: 'string' })` becomes the string `'string'`.
  - `createParamsType({ variant: 'member', base, key })` becomes `createIndexedAccessType({ objectType: base, indexType: key })`.
  - `createParamsType({ variant: 'struct', properties })` becomes `createTypeLiteral({ members })`.
  - `createParameterGroup({ properties })` becomes `createFunctionParameter({ properties })`.
  
  The 24 standalone `isXxxNode` guards that were deprecated in the previous release are also removed. Use each node's `Def.is` instead, for example `schemaDef.is(node)` over `isSchemaNode(node)`. `narrowSchema` and `isHttpOperationNode` stay. ([#3569](https://github.com/kubb-labs/kubb/pull/3569), [`1388155`](https://github.com/kubb-labs/kubb/commit/1388155df8460c7e8be1ac322e7a9159f49089e5))

#### Features

- Introduce `defineNode` as the single source-of-truth for AST nodes.
  
  Each node is now defined once in its `nodes/*.ts` file with `defineNode`, which derives its `create` builder, its `is*` guard, and the visitor traversal tables (`VISITOR_KEYS`, `VISITOR_KEY_BY_KIND`, `nodeFinalizers`) from that one definition. The public API is re-exported from `index.ts` straight from each node file, the hand-maintained visitor tables moved to a generated `registry.ts`, and the node-shape `as` casts are gone. `factory.ts` now holds only `createFile` and `update`.
  
  This is non-breaking: every existing export keeps its shape and behavior, and the generated output is unchanged. It also adds an `is*` guard for every node kind (24 in total), so `isContentNode`, `isPropertyNode`, `isFileNode`, `isTextNode`, and the rest are now available alongside the existing guards.
  
  The per-node definitions (`schemaDef`, `propertyDef`, …) and `defineNode` are now exported. The standalone `is*` guards are deprecated in favor of each node's `<node>Def.is` (for example `schemaDef.is` over `isSchemaNode`), which keeps the guard next to the node it belongs to.
  
  The param and type helpers that Phase 1 ([#3563](https://github.com/kubb-labs/kubb/issues/3563)) reshapes are marked `@deprecated` with their migration paths: `createParamsType` (pass the type name as a plain string), `createParameterGroup` (use `createFunctionParameter({ properties: [...] })`), and the `ParamsTypeNode`/`ParameterGroupNode` types. ([#3567](https://github.com/kubb-labs/kubb/pull/3567), [`218b365`](https://github.com/kubb-labs/kubb/commit/218b3659947c77aee2564d100b701ad65603ec8b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.56 — Jun 13, 2026

### @kubb/core

#### Bug Fixes

- Expose Url ([`f333037`](https://github.com/kubb-labs/kubb/commit/f3330377a6068d36033eb00120fc0e64fd4b9b02))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.55 — Jun 13, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Drop the `oas` and `oas-normalize` dependencies in favor of built-in logic.
  
  Operation iteration (paths, methods, `operationId`, tags, request/response bodies, content type) now runs through a small internal `Operation` wrapper instead of the `oas` package, and the OpenAPI type aliases come straight from `openapi-types` and `@types/json-schema`. Document loading parses inline YAML/JSON with the `yaml` package, and `kubb validate` validates with `@readme/openapi-parser` directly. Generated output and validation behavior are unchanged, while the dependency tree is considerably smaller. ([#3557](https://github.com/kubb-labs/kubb/pull/3557), [`330ea5b`](https://github.com/kubb-labs/kubb/commit/330ea5ba46d4806bd77742da9cceb9e0e4e3dcd9))

### @kubb/core

#### Breaking Changes

- Remove the incremental build cache.
  
  The `cache` config option, the `createCache` factory, the `fsCache` backend, and the `Cache`, `CachedSnapshot`, and `FsCacheOptions` types are gone from `@kubb/core`. `defineConfig` no longer enables `fsCache()` by default, and the `kubb generate --no-cache` flag is removed from the CLI. Every run now regenerates straight from the spec. ([#3558](https://github.com/kubb-labs/kubb/pull/3558), [`b504cf0`](https://github.com/kubb-labs/kubb/commit/b504cf0a91bd317e2ec1d450e447548560c657e8))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.54 — Jun 12, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Repoint refs at duplicate top-level schemas to the first schema with the same content.
  
  When a spec defines a schema and also references an external copy of it (for example `$ref: 'https://petstore3.swagger.io/api/v3/openapi.json#/components/schemas/Category'` next to a local `Category`), the ref bundler hoists the copy under a numeric suffix (`Category1`) and rewrites the ref sites to it, so generators typed properties against `Category1` instead of `Category`.
  
  `buildDedupePlan` now records every later top-level schema whose content matches an earlier one in a new `aliasNames` map, `applyDedupe` repoints any ref targeting such a duplicate at the first schema with that content, and the adapter stream no longer emits the duplicate at all. The decision is purely content-based (structural signature), not name-based: `Pet.category` is typed `Category` again, no dead `Category1` model is generated, and a schema with a different shape keeps its own type. This also applies to hand-written schemas that share one content (a `Dog` identical to `Cat` collapses into `Cat`). `applyDedupe` now takes the plan lookups (`{ canonicalBySignature, aliasNames }`) instead of the bare signature map, and `@kubb/ast` exports the `DedupeCanonical` and `DedupeLookups` types. ([#3551](https://github.com/kubb-labs/kubb/pull/3551), [`d8d1aef`](https://github.com/kubb-labs/kubb/commit/d8d1aefc6a5b58ff293ddd227b821a210bd07e2d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.53 — Jun 12, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Bundle external `$ref`s with `api-ref-bundler` instead of `@apidevtools/json-schema-ref-parser`.
  
  `$RefParser.bundle()` remaps external file refs to the JSON pointer of their first occurrence (for example `#/components/schemas/AppState/properties/currentUser`), so multi-file specs lost their named schemas and generators inlined types instead of emitting named types with imports. `api-ref-bundler` hoists external file schemas into named `components.schemas` entries (`./schemas/User.yaml` becomes `#/components/schemas/User`), matching the earlier Redocly behavior while staying lightweight, and adds a foundation for AsyncAPI support later on.
  
  The new bundler resolves local YAML and JSON files and HTTP(S) URLs, including `./` and `../` relative refs and pointer fragments into external files. ([#3549](https://github.com/kubb-labs/kubb/pull/3549), [`3c013ef`](https://github.com/kubb-labs/kubb/commit/3c013efc74071f9d409ca9a082b2c8662a9a32c6))
- Stop shipping `extension.yaml` in the npm packages and drop the `schemas/extension.json` schema. Extension metadata now lives in the platform repo (`kubb-labs/platform`, `apps/kubb.dev/extensions/`) and the options are documented on each extension's kubb.dev page. ([#3547](https://github.com/kubb-labs/kubb/pull/3547), [`2944481`](https://github.com/kubb-labs/kubb/commit/29444811eb29d87fe2a909635402dcd7170b14f7))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.52 — Jun 11, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Remove more unused code flagged by knip. None of the removed symbols are part of any package's `exports`, and all were unused across the kubb and plugins repos. Runtime behavior is unchanged.
  
  - `@kubb/parser-ts`: delete the dead `createImport` and `createExport` AST builders, superseded by the string-based `printImport`/`printExport`.
  - `@kubb/adapter-oas`: drop the unused `HttpMethods` lookup and the redundant `openapi-types` re-export.
  - `@kubb/ast`: drop the unused `buildFixture` mock helper.
  - `@kubb/cli`: drop the unused `SUMMARY_SEPARATOR` constant.
  - `@kubb/core`: drop the orphaned `mocks/noop` fixtures.
  - Several internal-only symbols (`createContent`, `createRequestBody`, `SCALAR_PRIMITIVE_TYPES`, `INDENT_SIZE`, `defaultResolveOptions`, `buildDefaultBanner`, `ReportTiming`, `printFrontmatter`, `SchemaWithMetadata`) drop their redundant `export`. ([#3544](https://github.com/kubb-labs/kubb/pull/3544), [`5ce2414`](https://github.com/kubb-labs/kubb/commit/5ce2414e94750603d60b857f1b84ac17c4e29bdf))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.51 — Jun 11, 2026

### @kubb/adapter-oas

#### Features

- Drop dead exports and lazy-load heavy deps.
  
  Remove `mergeDocuments`, `ValidateDocumentOptions`, and `HttpMethods` from the public API (`src/index.ts`). These symbols had no consumers across the kubb, plugins, or platform repos. They remain in their source files for internal use.
  
  Replace `@redocly/openapi-core` (8–10 MB) with `@apidevtools/json-schema-ref-parser` (~100 KB) for external `$ref` bundling. The library was already a transitive dependency and exposes the same `bundle()` behavior. `@redocly/openapi-core` is removed from `dependencies`.
  
  Lazy-load `swagger2openapi` with a dynamic `import()` so it only loads when the input is a Swagger 2.0 document. ([#3538](https://github.com/kubb-labs/kubb/pull/3538), [`4afab7a`](https://github.com/kubb-labs/kubb/commit/4afab7a192cd174b979152d9ac450bf5e097c752))

### @kubb/core

#### Breaking Changes

- Replace `middleware` with post-enforced plugins.
  
  `defineMiddleware` and the `Middleware` type are removed from `@kubb/core`. Use `definePlugin` with `enforce: 'post'` instead — a post-enforced plugin registers after all normal plugins and fires in that order, giving the same guarantee.
  
  `Config.middleware` and `UserConfig.middleware` are removed. Barrel generation now runs through the new `@kubb/plugin-barrel` package, which is a standard plugin with `enforce: 'post'`. It is added to `plugins` automatically by `defineConfig` when no barrel plugin is already present.
  
  `@kubb/middleware-barrel` is removed. Migrate to `@kubb/plugin-barrel`. ([#3537](https://github.com/kubb-labs/kubb/pull/3537), [`af0c0cf`](https://github.com/kubb-labs/kubb/commit/af0c0cfbbd3f6c9ea89a01c074c89fb38d140790))

#### Features

- Move `Telemetry`, `defineLogger`, Logger types (`Logger`, `LoggerContext`, `LoggerOptions`, `UserLogger`), and `selectReporters` from `@kubb/core` to `@kubb/cli`. These exports were only ever used by the CLI. `logLevel` remains exported from `@kubb/core`. Programmatic users of `createKubb` are unaffected. ([#3536](https://github.com/kubb-labs/kubb/pull/3536), [`d3c29bd`](https://github.com/kubb-labs/kubb/commit/d3c29bd4333507a5c8a49684294b77a8cc953810))

#### Bug Fixes

- Split the type definitions out of `createKubb.ts` into the `types.ts` barrel, fold `Manifest` into `caches/fsCache.ts`, and replace the internal `HookRegistry` with inline listener tracking on `KubbDriver`. Also drop the unused `tinyexec` dependency. These are internal cleanups with no change to the public API. ([#3541](https://github.com/kubb-labs/kubb/pull/3541), [`159aa57`](https://github.com/kubb-labs/kubb/commit/159aa57ad5e70e1028dc01eb2a96658f28e8a41f))
- Remove the unused `kubb:config:start` and `kubb:config:end` lifecycle events from `KubbHooks` and delete the `KubbConfigEndContext` type. The CLI already emits `kubb:info` and `kubb:success` "Config loaded" messages for the same output, so nothing visible changes. ([#3534](https://github.com/kubb-labs/kubb/pull/3534), [`e388248`](https://github.com/kubb-labs/kubb/commit/e388248ab76ef0f1341d8d60de8b06a493433422))
- Resolve config in the `Kubb` constructor instead of `setup()`. `config` is now a plain readonly property available right after `createKubb`, so the getter no longer throws before `setup()`. `setup()` keeps the async work: sizing the hooks ceiling, the `output.clean` storage clear, and `driver.setup()`. The dead `kubb.config ?? userConfig` fallback in `unplugin-kubb` is removed. ([#3540](https://github.com/kubb-labs/kubb/pull/3540), [`2c05045`](https://github.com/kubb-labs/kubb/commit/2c05045aa5ac7a317b0d8043faa93e3dfb047975))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.50 — Jun 10, 2026

### @kubb/cli

#### Features

- Remove the `kubb agent` command and drop `@kubb/agent` as a peer dependency of `@kubb/cli` and `kubb`. The HTTP agent server has moved out of this repository and is now deployed as the `kubblabs/kubb-agent` Docker image. To run the agent, use the published Docker image instead of the CLI. ([#3524](https://github.com/kubb-labs/kubb/pull/3524), [`94ac5b8`](https://github.com/kubb-labs/kubb/commit/94ac5b801d4e2c415441dd08cc87089b0d296390))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.49 — Jun 10, 2026

### @kubb/cli

#### Features

- Add a `--no-cache` flag to `kubb generate` that turns off the incremental build cache for a single run, forcing a full regeneration without editing the config.
  
  The flag overrides whatever cache the config resolved to (`fsCache()` by default), so it works for every config shape. `CLIOptions` now carries `noCache`, letting a `defineConfig` function read it too. ([#3520](https://github.com/kubb-labs/kubb/pull/3520), [`e6987cb`](https://github.com/kubb-labs/kubb/commit/e6987cba1ba6a10890cd41b9728d7f4eec5fff7c))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.48 — Jun 10, 2026

### @kubb/core

#### Breaking Changes

- Remove the `'group'` output mode. `output.mode` now accepts `'directory' | 'file'`.
  
  `'directory'` (the default) writes one file per operation or schema, and `'file'` writes everything into a single file. The per-group consolidation mode is gone.
  
  The `group` option stays and keeps organizing `'directory'` output into per-tag or per-path subdirectories. It remains invalid with `'file'`, and pairing the two now fails the build with a `KUBB_INVALID_PLUGIN_OPTIONS` diagnostic.
  
  Migrate any plugin set to `output.mode: 'group'` to `'directory'` (keep the `group` option for subdirectories) or `'file'` (drop the `group` option for a single file). ([#3517](https://github.com/kubb-labs/kubb/pull/3517), [`49ffe04`](https://github.com/kubb-labs/kubb/commit/49ffe04aa407c2c6d4bf3dba123db38deeadfdf5))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.47 — Jun 10, 2026

### @kubb/ast

#### Bug Fixes

- Drop self-imports of locally-defined symbols in consolidated output (`mode: 'group'`/`mode: 'file'`).
  
  A grouped file that defines a type (e.g. `Pet`) no longer also imports that same type. In group mode the import for a referenced schema resolves to the per-schema path while the file lives at the group path, so the existing path-based filter could not match. `createFile` now also drops any import whose binding is defined locally by one of the file's own sources. The local definition stays in place. ([#3515](https://github.com/kubb-labs/kubb/pull/3515), [`ebb0921`](https://github.com/kubb-labs/kubb/commit/ebb0921d34171337c2882c0bb1d7bc3c6b8d7a67))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.46 — Jun 10, 2026

### @kubb/ast

#### Breaking Changes

- Strip self-imports in `createFile`. An import whose resolved path equals the containing file is now dropped, so consolidated output (`output.mode: 'group'` and `output.mode: 'file'`) no longer emits an import that points at the file itself. Bare module specifiers and genuine cross-file imports are unaffected. ([#3513](https://github.com/kubb-labs/kubb/pull/3513), [`d90c0ea`](https://github.com/kubb-labs/kubb/commit/d90c0ea26faa7504ddc27daf0fa671c28f77b902))

### @kubb/core

#### Breaking Changes

- Add an explicit `output.mode` option and remove the implicit single-file detection.
  
  A plugin's `output` now takes `mode: 'directory' | 'group' | 'file'`:
  
  - `'directory'` (default) writes one file per operation or schema, the previous default behavior.
  - `'group'` writes one file per resolved group and requires the plugin's `group` option.
  - `'file'` writes everything into a single file. When `path` has no extension the default `.ts` is appended (`'types'` becomes `'types.ts'`).
  
  Kubb no longer guesses the mode from the `output.path` extension. Set `output.mode: 'file'` to get a single file where you previously relied on a `path` ending in `.ts`.
  
  Removed `getMode`, the `KubbDriver.getMode` static, the generator context `ctx.getMode`, and the `pathMode` field on `ResolverPathParams`. Added the `OutputMode` and `OutputOptions` types, where `OutputOptions` couples `output.mode: 'group'` with a required `group` option at the type level. A plugin configured with `output.mode: 'group'` but no `group` now fails the build with a `KUBB_INVALID_PLUGIN_OPTIONS` diagnostic. ([#3513](https://github.com/kubb-labs/kubb/pull/3513), [`d90c0ea`](https://github.com/kubb-labs/kubb/commit/d90c0ea26faa7504ddc27daf0fa671c28f77b902))

### @kubb/middleware-barrel

#### Breaking Changes

- Make barrel generation aware of `output.mode`. A plugin with `output.mode: 'file'` gets no per-plugin barrel, since its output is a single file, and the root barrel re-exports that file directly. A plugin with `output.mode: 'group'` writes one file per group, which the per-plugin barrel re-exports like any other flat layout. ([#3513](https://github.com/kubb-labs/kubb/pull/3513), [`d90c0ea`](https://github.com/kubb-labs/kubb/commit/d90c0ea26faa7504ddc27daf0fa671c28f77b902))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.45 — Jun 10, 2026

### @kubb/adapter-oas

#### Bug Fixes

- Sync option docs with the actual v5 defaults and APIs. The `integerType` docs in `@kubb/adapter-oas` (extension.yaml) and `@kubb/ast` (JSDoc) now state the real default `'bigint'` instead of `'number'`. The `@kubb/core` JSDoc for build diagnostics names the per-plugin timing kind `performance` instead of the removed `timing`. The `@kubb/renderer-jsx` README drops the removed `createRenderer` and `renderer.unmount()` APIs in favor of `jsxRenderer()` with `render`, `files`, and `stream`, and lists the markdown components (`Callout`, `Frontmatter`, `Heading`, `List`, `Paragraph`). ([#3504](https://github.com/kubb-labs/kubb/pull/3504), [`84326c1`](https://github.com/kubb-labs/kubb/commit/84326c19807c05ee9a71e2e535618a2c8aeffa31))

### @kubb/ast

#### Bug Fixes

- Trim type exports that no package in the kubb or plugins ecosystem consumes. The public barrel no
  longer re-exports node and helper types that were never imported, two unused node aliases are
  removed, and several internal-only types drop their `export`. Runtime behavior is unchanged. ([#3502](https://github.com/kubb-labs/kubb/pull/3502), [`a83c3ea`](https://github.com/kubb-labs/kubb/commit/a83c3ea5c154cbc76d5c8c3675d8597b902e9811))

### @kubb/core

#### Features

- Default the `tag` group folder name to the plain camelCased tag instead of `${tag}Controller`.
  
  With `group: { type: 'tag' }`, files now land in `pet/` rather than `petController/`. The `Controller` suffix was a leftover convention nothing else in the output referenced. To keep the old layout, set `group: { type: 'tag', name: ({ group }) => \`${group}Controller\` }`. ([#3509](https://github.com/kubb-labs/kubb/pull/3509), [`d63c266`](https://github.com/kubb-labs/kubb/commit/d63c266777c107ae9732f6f63e82bae50d27bbff))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.44 — Jun 9, 2026

### @kubb/ast

#### Breaking Changes

- Add a `@kubb/ast/utils` subpath for spec-agnostic helpers that produce or format generated source,
  so the main `@kubb/ast` barrel stays focused on the AST node tree and every adapter can share one
  implementation. The subpath exports `stringify`, `trimQuotes`, `jsStringEscape`, `toRegExpString`,
  `stringifyObject`, `getNestedAccessor`, `buildJSDoc`, `isValidVarName`, and a new `ensureValidVarName`.
  
  It also moves the pure (non-node) helpers `objectKey`, `buildObject`, `buildList`, `childName`,
  `enumPropName`, `extractRefName`, and `findDiscriminator` from the main barrel to `@kubb/ast/utils`.
  This is breaking: import them from `@kubb/ast/utils` instead of `@kubb/ast` (they are also no longer
  part of the `ast` namespace re-exported by `@kubb/core`). ([#3498](https://github.com/kubb-labs/kubb/pull/3498), [`8ba18f7`](https://github.com/kubb-labs/kubb/commit/8ba18f7a88410a1f7dd99de2207bcd113aaf312e))

### @kubb/core

#### Bug Fixes

- Cut memory use and duplicated work in the build hot path, and name the requiring plugin in missing-dependency errors.
  
  Rendered sources are no longer retained in memory for the whole build when caching is disabled, and the file write pipeline streams each file to storage as soon as it is parsed instead of materializing the entire batch first. Cache-hit restores now write files in parallel batches instead of one at a time. Per-node transformer results are memoized per plugin, so a plugin with a batch `operations()` generator no longer transforms and re-resolves every operation twice.
  
  `requirePlugin` errors raised from a generator context now say which plugin declared the missing dependency, e.g. `Plugin "plugin-zod" is required by "plugin-ts" but not found`. ([#3499](https://github.com/kubb-labs/kubb/pull/3499), [`8b611cb`](https://github.com/kubb-labs/kubb/commit/8b611cbca6f7f261a91b639bb085073c61b28a67))

### @kubb/parser-ts

#### Features

- Tighten generated-output formatting so it reads cleanly without a formatter. `objectKey` now quotes a key only when it is not valid identifier syntax (reserved words and globals like `name` and `class` stay bare) and uses single quotes when it must quote. `@kubb/parser-ts` treats a `<br/>` break as a blank-line separator between statements, so consecutive or edge breaks fold into a single blank line instead of stacking. A shared `singleQuote` helper backs the single-quote output. ([#3498](https://github.com/kubb-labs/kubb/pull/3498), [`8ba18f7`](https://github.com/kubb-labs/kubb/commit/8ba18f7a88410a1f7dd99de2207bcd113aaf312e))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.43 — Jun 9, 2026

### @kubb/core

#### Bug Fixes

- Trim the `Renderer` contract to what the build driver actually uses. The `unmount` and `dispose` methods were never called, since the driver disposes through `using instance = renderer()`, which runs `[Symbol.dispose]`. Both are removed from the `Renderer` type, so a custom renderer now implements `render`, `files`, an optional `stream`, and `[Symbol.dispose]` only. ([#3488](https://github.com/kubb-labs/kubb/pull/3488), [`626b261`](https://github.com/kubb-labs/kubb/commit/626b261f3ef76ed45000dd5b3b5d53496d18c491))

### @kubb/parser-ts

#### Features

- Normalize the indentation of generated declarations so the output reads cleanly before any formatter runs. Raw text and JSX nodes are now dedented to a column-zero baseline when printed, which removes the source indentation that template literals bake into multi-line `const`, `type`, `function`, and arrow-function bodies and stops it from compounding under the structural indent. Top-level declarations in a source are separated by a blank line, and an explicit `<br/>` no longer doubles that gap. A `dedent` helper sits next to `indentLines` for this. ([#3494](https://github.com/kubb-labs/kubb/pull/3494), [`04e75af`](https://github.com/kubb-labs/kubb/commit/04e75afcc22ed6f76790055a6f268e6c8ced05e0))
- Emit imports and exports in the repo style so generated files read cleanly before any formatter runs. `@kubb/parser-ts` now prints `import`/`export` statements with single quotes and no semicolons through new `printImport`/`printExport` builders instead of the TypeScript compiler printer. `@kubb/ast` gains shared string builders (`buildObject`, `buildList`, `objectKey`) so plugins can assemble multi-line object and array literals with correct, cumulative indentation, a closing bracket at column zero, and trailing commas. ([#3496](https://github.com/kubb-labs/kubb/pull/3496), [`8ea4500`](https://github.com/kubb-labs/kubb/commit/8ea4500848f91687596c06bd111476296f765ede))

### @kubb/renderer-jsx

#### Breaking Changes

- Remove React entirely, runtime and types, while keeping JSX as the authoring style. The async fiber runtime, `react-reconciler`, `scheduler`, and the `react` dependency are all gone. Rendering runs through the synchronous walker over a tiny built-in JSX runtime (`@kubb/renderer-jsx/jsx-runtime`). The JSX namespace is now self-contained and declares only the `kubb-*` code hosts plus `br`, so `@types/react` is dropped as well and consumers no longer need it for type support. The gzipped bundle drops from a 510 KiB budget to ~8 KiB.
  
  There is now one renderer, exported as `jsxRenderer`. The separate `jsxRendererSync` name is gone, and so is the unused `Root` error-boundary component. This release also clears the scaffolding left from the virtual-DOM era: the internal DOM module with its `DOMElement` and `DOMNode` types, the unused `CodeBlock` component, the `createContext`, `inject`, `provide`, and `unprovide` re-exports, and the renderer's no-op `dispose` and `unmount` methods. ([#3488](https://github.com/kubb-labs/kubb/pull/3488), [`2bd32fd`](https://github.com/kubb-labs/kubb/commit/2bd32fddd6e628d04e4e59ae06ff7d52982a8a6f))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.42 — Jun 5, 2026

### @kubb/core

#### Features

- Add an opt-in incremental build cache.
  
  Kubb now fingerprints the inputs that shape generated code (the spec content, the resolved config, every plugin's options, and the running version) and, when nothing changed, restores the previous output instead of regenerating it. A second run becomes near-instant, the same idea behind Nx's computation cache.
  
  `defineConfig` turns this on by default with `fsCache()` (local disk under `node_modules/.cache/kubb`). Set `cache: false` to turn it off, or pass another backend through the new `cache` option, which mirrors the existing `storage` option. `@kubb/core` ships the `fsCache()` backend, plus the `Cache` type and `createCache` factory for custom ones. A bare `createKubb` leaves caching off unless a cache is passed.
  
  ```ts
  import { defineConfig } from 'kubb'
  
  export default defineConfig({
    input: { path: './petStore.yaml' },
    output: { path: './src/gen' },
    // cache: fsCache() is applied by default; set `cache: false` to turn it off.
  })
  ``` ([#3469](https://github.com/kubb-labs/kubb/pull/3469), [`eeab54b`](https://github.com/kubb-labs/kubb/commit/eeab54b2823a5e591c9ec2b05cb31abf32f37cb2))
- Run Kubb natively on Bun while keeping full Node support.
  
  Runtime detection is now centralized, so the filesystem helpers reach for `Bun.file` and `Bun.write` under Bun and fall back to `node:fs` everywhere else. The default `fsStorage` scans the output directory with `Bun.Glob` under Bun instead of a recursive `readdir` walk. The `kubb agent` command launches its server with the same runtime that started the CLI (via `process.execPath`) instead of always shelling out to `node`, so a Bun-only environment no longer needs a `node` binary on the PATH. Anonymous telemetry also records which runtime ran the generation (`bun`, `deno`, or `node`) alongside its version. ([#3470](https://github.com/kubb-labs/kubb/pull/3470), [`1ca92f6`](https://github.com/kubb-labs/kubb/commit/1ca92f64a3cd32d62d5f5d88940402488705fd48))

#### Bug Fixes

- Adopt native Node 22 / ES2024 features: order plugins through `Set`-based dependency lookups in `KubbDriver`, and replace `Promise` resolver boilerplate with `Promise.withResolvers()`. The shared TypeScript config moves to an ES2024 target with the ES2025 collection and iterator libraries to match the Node 22 baseline. ([#3473](https://github.com/kubb-labs/kubb/pull/3473), [`50615f4`](https://github.com/kubb-labs/kubb/commit/50615f4f0f745191e1505938345dac765dce7b0b))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.41 — Jun 3, 2026

### @kubb/cli

#### Bug Fixes

- Remove the GitHub Actions logger. The CLI now picks the clack or plain logger based on whether a TTY is available, regardless of the CI environment. ([#3463](https://github.com/kubb-labs/kubb/pull/3463), [`7798632`](https://github.com/kubb-labs/kubb/commit/77986325d9f543482b955120c12af32e2d506bb2))

### @kubb/core

#### Features

- Route hook subprocess output through events instead of a sink-factory callback.
  
  Hook output (formatter, linter, and `done` hooks) now reaches loggers over the event emitter: a new `kubb:hook:line` event carries each streamed stdout line while a hook runs, and `kubb:hook:end` gained optional `stdout`/`stderr` fields holding a failed hook's captured output. The CLI's `makeSink`/`HookSinkFactory` channel and its threading are removed, so loggers are pure event subscribers and the runner decides whether to stream from the `kubb:hook:line` listener count. Behavior is unchanged: clack still streams live dimmed lines, the plain logger still prints failure output, and a failed hook's output still surfaces at the silent log level. ([#3467](https://github.com/kubb-labs/kubb/pull/3467), [`333aea7`](https://github.com/kubb-labs/kubb/commit/333aea7b8000b43a37dddc6b6226563f7a41fd2f))

#### Bug Fixes

- Restore progressive `Plugins N/M` progress in the CLI. The driver now runs each plugin's
  generator pass sequentially, so `kubb:plugin:end` fires as each plugin finishes instead of
  once the whole batch pass is over. The CLI counter advances 2/9, 3/9, ..., 9/9 again rather
  than jumping from 1/9 straight to 9/9 at the end of the run. ([#3465](https://github.com/kubb-labs/kubb/pull/3465), [`be22e6d`](https://github.com/kubb-labs/kubb/commit/be22e6d70129e8e938853f38e29f01661ede3f63))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.40 — Jun 3, 2026

### @kubb/core

#### Bug Fixes

- add urlpath back ([`68638b7`](https://github.com/kubb-labs/kubb/commit/68638b7227d2db1a65746e0d6e7189571f79dc1d))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.39 — Jun 3, 2026

### @kubb/core

#### Features

- Fold the diagnostic error helpers into the `Diagnostics` namespace: `DiagnosticError` is now `Diagnostics.Error` and the structural check is exposed as `Diagnostics.isError`.
  
  The standalone `DiagnosticError` export from `@kubb/core` is removed. Replace `new DiagnosticError(...)` with `new Diagnostics.Error(...)`, and import `Diagnostics` instead. The thrown error keeps its `name` of `'DiagnosticError'`, so structural checks across duplicated `@kubb/core` copies still match. ([#3458](https://github.com/kubb-labs/kubb/pull/3458), [`ec9a92c`](https://github.com/kubb-labs/kubb/commit/ec9a92c74fcddb38a9a70451f36e19d533d6c0b3))
- Remove the public `FileProcessor` export from `@kubb/core` and move the `matchFiles` snapshot
  helper into `@kubb/core/mocks`. `matchFiles(files, { parsers, format, pre })` takes its parsers and
  formatter as options, so it renders generator output to file snapshots without `@kubb/core` pulling
  in a parser or prettier. ([#3458](https://github.com/kubb-labs/kubb/pull/3458), [`1b19a0c`](https://github.com/kubb-labs/kubb/commit/1b19a0c1ceef844a08fb5383143f21cd2bb2742d))
- Remove the exported `isInputPath` type guard from `@kubb/core`. It had a single internal caller,
  where the check is now an inline `'path' in config.input` that narrows the `InputPath | InputData`
  union on its own. ([#3458](https://github.com/kubb-labs/kubb/pull/3458), [`ec69a5c`](https://github.com/kubb-labs/kubb/commit/ec69a5c5bf6ed0402090a357b86e38ca51be0c34))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.38 — Jun 3, 2026

### @kubb/core

#### Bug Fixes

- Fix diagnostic reporting regressions found in review.
  
  - `resolveRef` now throws a `DiagnosticError` when a `$ref` cannot be resolved outside a build scope, instead of silently returning `null`. Inside a build it still collects the diagnostic and keeps parsing.
  - Plugin-reported problems (`ctx.error`/`ctx.warn`/`ctx.info`) and formatter/linter/`done`-hook failures no longer render twice. The generator context only collects diagnostics now, and the host renders each once after the build.
  - `schemaDiagnostics` builds correct RFC 6901 pointers: property names are escaped (`~`→`~0`, `/`→`~1`), and tuple items and `oneOf`/`anyOf`/`allOf` members are indexed, so distinct advisory diagnostics are no longer dropped by the dedupe.
  - `kubb generate --reporter json` emits one top-level JSON array for the whole run (aggregated on `kubb:lifecycle:end`), so multi-config runs stay valid JSON.
  - `config.reporters` from `kubb.config.ts` is honored again: `--reporter` no longer defaults to `cli`, so it only overrides the config when passed.
  - The agent forwards `diagnostics`, `status`, `hrStart`, and `filesCreated` on `kubb:generation:end`, so the generation summary reaches connected clients again.
  - The OAS adapter caches its parsed document, schemas, and prescan per source and per document instead of once per instance. Reusing one `adapterOas()` instance across a `defineConfig` array (configs that spread a shared `baseConfig`) now parses each config's spec instead of replaying the first, so every config generates its own files and reports its own file count. ([`50d5f1e`](https://github.com/kubb-labs/kubb/commit/50d5f1ed8783517c6f549c0d50e6aa849dc82cc8))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

## v5.0.0-beta.37 — Jun 3, 2026

### @kubb/adapter-oas

#### Features

- Give every error a stable code, and hand structured diagnostics to the MCP tools.
  
  Failures that used to throw a plain `Error` now throw a `DiagnosticError` with a code, a `config` location, and a help line: a missing `input.path` reports `KUBB_INPUT_NOT_FOUND` (the OAS adapter checks the file before reading it), an adapter configured without input reports `KUBB_INPUT_REQUIRED`, and merging an empty set of OAS documents reports `KUBB_INPUT_REQUIRED`. They surface in the run summary and `--reporter json` instead of as an opaque `KUBB_UNKNOWN`. `Diagnostics.from` now recognizes a `DiagnosticError` structurally, so a code still survives when the error crosses a duplicated `@kubb/core` copy bundled into an adapter or plugin.
  
  `@kubb/core` exposes `Diagnostics.docsUrl(code)` and `Diagnostics.serialize(diagnostic)`, the JSON-safe shape (now including a `docsUrl`) shared by the JSON reporter and the MCP tools.
  
  The MCP `generate` and `validate` tools now return structured diagnostics, each with its code, source pointer, help, and docs link, as a readable block plus a JSON payload, so an assistant can act on the exact problem rather than parsing a message string.
  
  `@kubb/adapter-oas` gains an opt-in `diagnostics` option that reports two advisory diagnostics against their JSON pointers as it parses: `KUBB_UNSUPPORTED_FORMAT` (a warning when a schema's `format` falls back to the base type) and `KUBB_DEPRECATED` (info for a schema marked `deprecated`). The checks reuse the nodes the parser already produces, so they add no extra traversal of the document. Both default to off, so existing output is unchanged unless you set `adapterOas({ diagnostics: { unsupportedFormat: true, deprecated: true } })`. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))
- Extend diagnostics so more failures are coded and visible.
  
  Coded errors that used to surface as `KUBB_UNKNOWN`: a missing Studio adapter
  (`KUBB_ADAPTER_REQUIRED`), a non-object `devtools` config (`KUBB_DEVTOOLS_INVALID`), and a
  resolved path escaping the output directory (`KUBB_PATH_TRAVERSAL`). The OAS adapter checks
  the input file before reading it in both generation and `validate`, so a missing spec reports
  `KUBB_INPUT_NOT_FOUND` (the MCP `validate` tool returns the coded diagnostic too).
  
  The formatter, linter, and post-generate hooks now report failures as diagnostics
  (`KUBB_FORMAT_FAILED`, `KUBB_LINT_FAILED`, `KUBB_HOOK_FAILED`). They appear in the run summary
  and `kubb generate --reporter json`, and a failure marks the run as failed instead of being
  swallowed.
  
  `@kubb/core` adds `diagnosticCatalog` (a title, cause, and fix for every code) and
  `Diagnostics.explain(code)`, the source the kubb.dev diagnostics pages mirror. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))
- Replace the debug logger with selectable reporters.
  
  The `kubb:debug` hook, the `createDebugger` helper, the `debug` log level, and the `--debug` flag are gone. To write a log file you now pick the `file` reporter.
  
  Reporters work like Vitest. List them on the CLI with `--reporter` (comma separated, for example `--reporter cli,file`) or in the config with `reporters: ['cli', 'file']`, where the CLI flag overrides the config. Three are built in: `cli` writes the end-of-run summary to the terminal and is the default, `json` writes a machine-readable report to stdout for CI, and `file` writes a log to `.kubb/<name>-<timestamp>.log`. The `--reporter human` name and the `--report <file>` flag are removed, so use `--reporter json` for CI output.
  
  The OAS adapter's advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT` and `KUBB_DEPRECATED`) always run now. The `adapterOas({ diagnostics })` option that gated them is removed.
  
  The `kubb:generation:summary` hook is removed. The end-of-run summary the `cli` reporter prints is now built from the run's diagnostics, carried on `kubb:generation:end` (which gains optional `diagnostics`, `status`, `hrStart`, and `filesCreated` fields). ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))

### @kubb/cli

#### Bug Fixes

- Fix the clack logger rendering plugins side by side during generation.
  
  Plugins run concurrently, but the logger started a separate `clack.progress()` bar per plugin. clack renders one progress UI per line, so the bars collided onto a single line, printed blank gutter rows, and piled up `keypress` listeners until Node warned about an EventEmitter leak. The plugin phase now shares one progress bar that lists the plugins currently generating and advances as each finishes. The `kubb:info` line also no longer prints a trailing space when no extra info is attached. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))

### @kubb/core

#### Features

- Add a structured diagnostics model.
  
  Build failures are collected as structured `Diagnostic`s instead of raw errors. Each has a stable `code`, a `severity`, an optional source `location` (a JSON pointer), and the `plugin` that produced it. `BuildOutput` now exposes a single `diagnostics` array (the former `error`, `failedPlugins`, and `pluginTimings` fields are gone), and the build emits each problem on the new `kubb:diagnostic` hook. Per-plugin timings are carried as `timing` diagnostics in the same array. `@kubb/core` exports `hasBuildError` and `getFailedPluginNames` to read them. Three throw sites carry codes: `KUBB_REF_NOT_FOUND`, `KUBB_INVALID_SERVER_VARIABLE`, and `KUBB_PLUGIN_NOT_FOUND`. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))
- Round out diagnostic reporting toward tsc/oxlint/nx parity.
  
  Report without throwing. The diagnostics helpers are now a `Diagnostics` class. `Diagnostics.report(diagnostic)` collects into the active run instead of aborting, available on the generator context and, via a single `AsyncLocalStorage` in the core bundle, to deep code (adapter parse, lazily consumed streams). `Diagnostics.scope` activates a run, and `Diagnostics.dedupe` collapses repeats by code + pointer + plugin. (`Diagnostics.from`/`timing`/`hasError`/`failedPlugins`/`count` replace the former standalone functions.)
  
  Report every problem in one run. The OAS adapter now reports each unresolved `$ref` and keeps parsing, so a spec with several bad refs surfaces them all in a single `kubb generate` (it still throws when called outside a build).
  
  Aggregate count. The end-of-run summary box gains an `Issues: N errors, M warnings` row, so parse-time errors that aren't tied to a failed plugin still show.
  
  Machine-readable output. `kubb generate --reporter json` prints a stable report (`{ status, summary: { errors, warnings, files, durationMs }, diagnostics }`) to stdout. Exit code is unchanged (non-zero on any error).
  
  New codes `KUBB_UNSUPPORTED_FORMAT` (warning) and `KUBB_DEPRECATED` (info) are emitted by the OAS adapter. The renderer, counts, and json report handle every severity. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))
- Render build diagnostics in the oxlint style and add a suggested fix.
  
  `Diagnostic` gains a `help` field with a suggested fix. The three converted throw sites set it, and the CLI renders a diagnostic as:
  
  ```
  × @kubb/plugin-zod(KUBB_REF_NOT_FOUND): Could not find a definition for Pet.
    at #/components/schemas/Pet
    help: Add the schema under components.schemas, or fix the $ref.
    docs: https://kubb.dev/docs/5.x/reference/diagnostics/kubb-ref-not-found
  ```
  
  The `docs:` link is derived from the code and points at the diagnostics reference on kubb.dev. A failed run also prints an `Environment:` row (Node version, Kubb version, platform, cwd) in the summary box. `getDiagnosticInfo` is exported from `@kubb/core`. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))
- Resolve the renderer from the generator only. The `renderer` resolution chain dropped the plugin and config fallbacks, so `generator.renderer` is now the single source.
  
  Removed the `renderer` option from `defineConfig`, the `renderer` field from the normalized plugin, and the `setRenderer` method from the plugin setup context. Set `renderer` on each generator instead (`renderer: jsxRenderer`), or leave it unset / `renderer: null` to opt out of rendering. ([#3447](https://github.com/kubb-labs/kubb/pull/3447), [`61ca887`](https://github.com/kubb-labs/kubb/commit/61ca8876281afe919e5e76ef8b8b50cc0af64cc9))
- Route the generator context's `warn`/`error`/`info` through the diagnostics layer so plugin-reported problems are collected like every other diagnostic.
  
  Until now these methods only emitted `kubb:warn`/`kubb:error`/`kubb:info` events, so a plugin calling `ctx.error(...)` logged a line but the build still succeeded, and the message never reached the run summary or `--reporter json`. They now report into the active run via `Diagnostics.report` (attributed to the plugin) while still emitting their hook event:
  
  - `ctx.error` reports an `error` diagnostic (`KUBB_PLUGIN_FAILED`), which now fails the build. When passed an `Error`, it is kept as the diagnostic `cause`.
  - `ctx.warn` reports a `warning` (`KUBB_PLUGIN_WARNING`), and `ctx.info` reports an `info` (`KUBB_PLUGIN_INFO`). Neither fails the build.
  
  For a structured diagnostic with a stable `code` and a source `location`, call `Diagnostics.report(...)` or throw a `DiagnosticError` directly. The `Diagnostic`, `DiagnosticSeverity`, `DiagnosticLocation`, and `DiagnosticKind` types are now exported so you can build one. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))
- Collapse the driver's two listener trackers (`#hookListeners` and `#middlewareListeners`) into one typed `HookRegistry` that wraps `AsyncEventEmitter`. Listeners attached directly via `kubb.hooks.on(...)` survive `dispose()`. Only listeners the driver itself registered are removed. Internal refactor: every `(...args: Array<never>)` cast inside `KubbDriver` is gone, and the public `definePlugin`, `KubbHooks`, and `kubb.hooks` surfaces are unchanged. ([#3445](https://github.com/kubb-labs/kubb/pull/3445), [`bd7e026`](https://github.com/kubb-labs/kubb/commit/bd7e0265a3086c095cf59bc0c4b155ea38446b3e))

#### Bug Fixes

- Lift the per-plugin transform step into a `Transform` registry that the driver consults during dispatch, so transforms have one home and one contract instead of being inlined in `KubbDriver.#runGenerators`. The driver keeps the parse and generate logic as private methods (`#parseInput`, `#runGenerators`) and exposes the renderer-or-file dispatch as a `KubbDriver.applyResult` static so both the registered generators and `@kubb/core/mocks` route through one entry point.
  
  Bug fix: `gen.operations(nodes, ctx)` and the `kubb:generate:operations` hook now receive the transformed nodes, matching what `gen.operation(node, ctx)` already received per-node. Before this fix the aggregated callback saw the original adapter nodes, so a renaming-transformer would feed grouped or barrel generators a different shape than the per-operation hook saw.
  
  The flush-after-batch logic that used to live as a closure inside `KubbDriver.run` moved into a new `FileWriteQueue` class. The class also makes the flush non-blocking: the next round of generator dispatch can run while the previous round's source rendering and storage writes are still in flight. For large specs (Stripe-sized OpenAPI documents, thousands of generated files) the pipelined flush keeps peak heap roughly the same and lets CPU work overlap with IO instead of running behind it.
  
  The public surface (`setTransformer`, `KubbHooks`, the `KubbDriver` class, the `@kubb/core/mocks` entry) is unchanged. ([#3447](https://github.com/kubb-labs/kubb/pull/3447), [`61ca887`](https://github.com/kubb-labs/kubb/commit/61ca8876281afe919e5e76ef8b8b50cc0af64cc9))
- Stop the hooks emitter from tripping Node's EventEmitter leak warning.
  
  Each generator a plugin registers adds a listener to the shared `kubb:generate:*` events, so a config with several multi-generator plugins pushed past the emitter's hardcoded ceiling of 10 and printed `MaxListenersExceededWarning: 11 kubb:generate:operation listeners added`. `Kubb.setup()` now sizes the ceiling to the plugin count (`max(10, plugins.length * 4)`), which keeps leak detection for genuine runaway listeners while leaving room for the generators a normal plugin set registers. ([#3449](https://github.com/kubb-labs/kubb/pull/3449), [`b4f1e18`](https://github.com/kubb-labs/kubb/commit/b4f1e18fc722f82d01fb064f16cdee2060f84234))

### Contributors

Thanks to everyone who contributed to this release:

[@stijnvanhulle](https://github.com/stijnvanhulle)

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
