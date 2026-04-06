# @kubb/ast

## 5.0.0-alpha.32

### Minor Changes

- [#2982](https://github.com/kubb-labs/kubb/pull/2982) [`6c6d2b6`](https://github.com/kubb-labs/kubb/commit/6c6d2b6b9f0dcfc7826cf9000ed835f274a6a7af) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add structured AST nodes mirroring every JSX component from `@kubb/react-fabric`.

  ### `@kubb/ast`

  New node types in `nodes/code.ts`:
  - `ConstNode` (`kind: 'Const'`) — mirrors the `Const` component
  - `TypeNode` (`kind: 'Type'`) — mirrors the `Type` component; a plain type alias declaration with `name`, `export`, `JSDoc`, and `nodes` fields
  - `FunctionNode` (`kind: 'Function'`) — mirrors the `Function` component
  - `ArrowFunctionNode` (`kind: 'ArrowFunction'`) — mirrors the `Function.Arrow` component
  - `JSDocNode` — JSDoc prop shape used on the above nodes
  - `CodeNode` — discriminated union of all four code node types

  New `ParamsTypeNode` (`kind: 'ParamsType'`) in `nodes/function.ts` — language-agnostic type expressions for function parameter annotations, with three variants: `reference`, `struct`, and `member`.

  Updated `SourceNode` in `nodes/file.ts` — added optional `nodes?: Array<CodeNode>` field alongside `value` for carrying structured AST children.

  Updated `NodeKind` — added `'Const'`, `'Type'`, `'ParamsType'`, `'Function'`, `'ArrowFunction'`.

  New factory functions: `createConst`, `createType`, `createParamsType`, `createFunction`, `createArrowFunction`.

  Renamed `FunctionNode` (function-parameter printer variants) to `FunctionParamNode`. The `functionPrinter` handler key `type` was renamed to `paramsType`.

  ### `@kubb/plugin-ts`, `@kubb/plugin-client`, `@kubb/plugin-cypress`

  Updated to use the new `createParamsType` factory and `FunctionParamNode` type.

## 5.0.0-alpha.31

## 5.0.0-alpha.30

## 5.0.0-alpha.29

## 5.0.0-alpha.28

## 5.0.0-alpha.27

### Minor Changes

- [#2958](https://github.com/kubb-labs/kubb/pull/2958) [`795cac8`](https://github.com/kubb-labs/kubb/commit/795cac8edd6dd456185b7da90db9fd422c2b8330) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ### `@kubb/ast`
  - Rename printer type exports to follow the `Printer{Suffix}` convention:
    - `TsPrinterFactory` → `PrinterTsFactory`
    - `TsPrinterNodes` → `PrinterTsNodes`
    - `TsPrinterOptions` → `PrinterTsOptions`
    - `ZodPrinterFactory` → `PrinterZodFactory`
    - `ZodPrinterNodes` → `PrinterZodNodes`
    - `ZodPrinterOptions` → `PrinterZodOptions`
    - `ZodMiniPrinterFactory` → `PrinterZodMiniFactory`
    - `ZodMiniPrinterNodes` → `PrinterZodMiniNodes`
    - `ZodMiniPrinterOptions` → `PrinterZodMiniOptions`

  ### `@kubb/core`
  - Replace `mergeResolvers` with a single `resolver` partial override pattern. User-supplied methods are merged on top of the preset resolver via `withFallback`. Any method returning `null` or `undefined` falls back to the preset's implementation.
  - Remove `composeTransformers`. Replace the `transformers: Array<Visitor>` option with a single `transformer?: Visitor`. The visitor is applied directly via `transform(node, transformer ?? {})`.
  - `getPreset` now accepts `resolver?: Partial<TResolver> & ThisType<TResolver>` — use `this.default(...)` inside an override to call the preset resolver's implementation.

  ### `@kubb/plugin-ts`
  - **Breaking:** Replace `resolvers?: Array<ResolverTs>` with `resolver?: Partial<ResolverTs> & ThisType<ResolverTs>`. Supply only the methods you want to override; all others fall back to the active preset resolver.
  - **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.
  - Add `printer?: { nodes?: PrinterTsNodes }` — override the TypeScript output for individual schema types (e.g. render `integer` as `bigint`).

  ```typescript
  pluginTs({
    resolver: {
      resolveName(name) {
        return `Custom${this.default(name, "function")}`;
      },
    },
    transformer: {
      schema(node) {
        return { ...node, description: undefined };
      },
    },
    printer: {
      nodes: {
        integer() {
          return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword);
        },
      },
    },
  });
  ```

  ### `@kubb/plugin-zod`
  - **Breaking:** Replace `resolvers?: Array<ResolverZod>` with `resolver?: Partial<ResolverZod> & ThisType<ResolverZod>`.
  - **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.
  - Add `printer?: { nodes?: PrinterZodNodes | PrinterZodMiniNodes }` — override Zod output for individual schema types (e.g. render `integer` as `z.number()`).

  ```typescript
  pluginZod({
    resolver: {
      resolveName(name) {
        return `${this.default(name, "function")}Schema`;
      },
    },
    transformer: {
      schema(node) {
        return { ...node, description: undefined };
      },
    },
    printer: {
      nodes: {
        integer() {
          return "z.number()";
        },
      },
    },
  });
  ```

  ### `@kubb/plugin-cypress`
  - **Breaking:** Replace `resolvers?: Array<ResolverCypress>` with `resolver?: Partial<ResolverCypress> & ThisType<ResolverCypress>`.
  - **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.

## 5.0.0-alpha.26

## 5.0.0-alpha.25

### Patch Changes

- [#2941](https://github.com/kubb-labs/kubb/pull/2941) [`7b34c72`](https://github.com/kubb-labs/kubb/commit/7b34c7255a51ea0ababe6ca285703287193e702c) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - ### `@kubb/plugin-zod` — v5 architecture rewrite

  Complete rewrite of `@kubb/plugin-zod` to the v5 AST-based architecture. The plugin no longer depends on `@kubb/plugin-oas` or `@kubb/oas`; it operates entirely on the `@kubb/ast` node graph.

  **Breaking changes:**
  - `mapper` option removed — no replacement (naming is now controlled via `resolvers`)
  - `version` option removed — Zod v3 is no longer supported; Kubb v5 always generates Zod v4 code
  - `contentType` option removed — moved to `adapterOas(...)`
  - `transformers.name` callback removed — use the `resolvers` array for name customization
  - `transformers.schema` callback removed — use `transformers: Array<Visitor>` for AST transformations
  - `integerType` option removed — moved to `adapterOas({ integerType })` (default: `'bigint'`). Previously, the v4 default was `'number'`; if you relied on that, set `integerType: 'number'` in `adapterOas(...)`.
  - `emptySchemaType` option removed — moved to `adapterOas({ emptySchemaType })`
  - `unknownType` option removed — moved to `adapterOas({ unknownType })`
  - `wrapOutput` callback signature changed: `schema` argument is now `SchemaNode` (from `@kubb/ast/types`) instead of `SchemaObject` (from `@kubb/oas`)
  - `coercion` now accepts a granular object `{ dates?, strings?, numbers? }` in addition to `boolean`
  - Naming conventions (default preset): response status schemas are now named `<operationId>Status<code>Schema` instead of `<operationId><code>Schema`. Use `compatibilityPreset: 'kubbV4'` to keep the old names.

  **New options:**
  - `paramsCasing?: 'camelcase'` — apply camelCase to path/query/header parameter names in operation schemas
  - `compatibilityPreset?: 'default' | 'kubbV4'` — select naming conventions; `'kubbV4'` reproduces Kubb v4 names for a gradual migration
  - `resolvers?: Array<ResolverZod>` — provide custom resolver instances to override naming conventions
  - `transformers?: Array<Visitor>` — AST visitor array applied to each `SchemaNode` before printing (replaces the old `transformers.schema` callback)

  **New exports:**
  - `resolverZod` — default v5 resolver (camelCase + `Schema` suffix)
  - `resolverZodLegacy` — Kubb v4-compatible resolver (use with `compatibilityPreset: 'kubbV4'`)
  - `printerZod` — Zod v4 chainable-API printer factory (`definePrinter`)
  - `printerZodMini` — Zod v4 Mini functional-API printer factory

  ### `@kubb/ast`
  - `createSchema`, `createProperty`, `createOperation` factory functions now automatically infer and set the `primitive` field based on the node `type`, reducing boilerplate in tests and custom generators.

## 5.0.0-alpha.24

## 5.0.0-alpha.23

### Minor Changes

- [#2931](https://github.com/kubb-labs/kubb/pull/2931) [`8cfa19a`](https://github.com/kubb-labs/kubb/commit/8cfa19adbe681d4466f0ff97a8c14ece8ba1e5d8) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ### `@kubb/ast`
  - Added `createOperationParams(node, options)` utility that converts an `OperationNode` into a `FunctionParametersNode`.
  - Added `reference` variant to `TypeNode` for plain type name strings (e.g. `'string'`, `'QueryParams'`), so all type annotations in the AST are always `TypeNode` — never raw strings.
  - Changed `FunctionParameterNode.type` from `string | TypeNode` to `TypeNode`.
  - Changed `ParameterGroupNode.type` from `string | undefined` to `TypeNode | undefined`.
  - Updated `createTypeNode`, `createFunctionParameter`, and `createParameterGroup` factories to accept `TypeNode` only.
  - Removed `typeToString` helper from `utils.ts`; `resolveType` now returns `TypeNode` directly.

  ### `@kubb/plugin-ts`
  - Updated `functionPrinter` to handle all three `TypeNode` variants (`member`, `struct`, `reference`) explicitly; removed all `typeof … === 'string'` checks.

## 5.0.0-alpha.22

## 5.0.0-alpha.21

## 5.0.0-alpha.20

## 5.0.0-alpha.19

## 5.0.0-alpha.18

### Minor Changes

- [#2893](https://github.com/kubb-labs/kubb/pull/2893) [`fa7f554`](https://github.com/kubb-labs/kubb/commit/fa7f55423e9d81773a2f168954bf682a866de65c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Update to TypeScript v6

## 5.0.0-alpha.17

### Minor Changes

- [#2889](https://github.com/kubb-labs/kubb/pull/2889) [`2546c05`](https://github.com/kubb-labs/kubb/commit/2546c051d81e490709df9d8a834402ef546a8f1c) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ### `@kubb/ast`
  - Reorganized schema helper modules into clearer categories:
    - `transformers.ts` for schema transformation helpers
    - `resolvers.ts` for lookup/derivation helpers
    - `utils.ts` for generic helper utilities
  - Renamed exported helper APIs to shorter names for consistency:
    - resolvers: `findDiscriminator`, `childName`, `enumPropName`, `collectImports`
    - transformers: `setDiscriminatorEnum`, `mergeAdjacentObjects`, `simplifyUnion`, `setEnumName`, `resolveNames`
    - utils: `isStringType`, `caseParams`, `syncOptionality`
  - Removed deprecated alias exports for old names.

  ### `@kubb/adapter-oas`
  - Fixed named import shape regression in adapter import resolution.
  - `adapter.getImports(...)` now correctly returns `KubbFile.Import` entries with `name` as `string[]` (for example `['PetType']`), with added regression coverage.

## 5.0.0-alpha.16

## 5.0.0-alpha.15

## 5.0.0-alpha.14

### Minor Changes

- [#2872](https://github.com/kubb-labs/kubb/pull/2872) [`591977c`](https://github.com/kubb-labs/kubb/commit/591977c5c2f167736d6e43126ed0387a1e5e0ce5) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - ### `@kubb/core`
  - Add `name: string` to the `Resolver` base type. Every resolver now carries a name that identifies it.
  - `defineResolver` build functions must return a `name` property.
  - Add `mergeResolvers(...resolvers)` helper that merges multiple resolvers into one (last wins).

  ### `@kubb/ast`
  - Add `composeTransformers(...visitors)` helper that combines multiple `Visitor` objects into a single visitor. Each node kind is piped through all visitors sequentially (left to right).

  ### `@kubb/plugin-ts`
  - Add `resolvers` option — an array of named resolvers that control naming conventions. Later entries override earlier ones. Built-in resolvers: `resolverTs` (default) and `resolverTsLegacy`.
  - Add `transformers` option — an array of AST `Visitor` objects applied to each `SchemaNode` before printing. Uses `composeTransformers` + `transform` from `@kubb/ast`.
  - Export `resolverTs`, `resolverTsLegacy`, and `ResolverTs` from the package root.
  - Remove the old `transformers: { name? }` object option. Use a custom resolver in `resolvers` instead.
  - Deprecate `legacy` option in favor of `resolvers: [resolverTsLegacy]`.

## 5.0.0-alpha.13

### Patch Changes

- [#2858](https://github.com/kubb-labs/kubb/pull/2858) [`975717e`](https://github.com/kubb-labs/kubb/commit/975717e2c8cf8d33f5d9d641be4bb164fd36f423) Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix missing `@description` on request body type aliases.

  The OAS `requestBody.description` field (top-level on the request body object, distinct from the schema's own description) was silently dropped. It is now:
  - Added as `description?: string` to `OperationNode.requestBody` in `@kubb/ast`
  - Populated by `@kubb/adapter-oas` parser from `operation.schema.requestBody.description`
  - Used by `@kubb/plugin-ts` typeGenerator: `requestBody.description` takes precedence, falling back to `requestBody.schema.description`

## 5.0.0-alpha.12

## 5.0.0-alpha.11

### Patch Changes

- [#2824](https://github.com/kubb-labs/kubb/pull/2824) [`4cfcb62`](https://github.com/kubb-labs/kubb/commit/4cfcb6290ffa11c93f19345c93906af65ec18339) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Traverse `additionalProperties` nodes in visitor.

## 5.0.0-alpha.10

### Minor Changes

- [#2819](https://github.com/kubb-labs/kubb/pull/2819) [`c8f203c`](https://github.com/kubb-labs/kubb/commit/c8f203c47cf3badef59e7fa382b98b011ead755d) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add AST nodes and printer for function parameters.

  New node types: `FunctionParameterNode`, `FunctionParametersNode`, `ObjectBindingParameterNode`.

  New factory functions: `createFunctionParameter`, `createFunctionParameters`, `createObjectBindingParameter`.

  New type guards: `isFunctionParameterNode`, `isFunctionParametersNode`, `isObjectBindingParameterNode`.

  New `functionPrinter` with four rendering modes (`declaration`, `call`, `keys`, `values`) and `defineFunctionPrinter` for custom printer factories.

## 5.0.0-alpha.9

## 5.0.0-alpha.8

## 5.0.0-alpha.7

## 5.0.0-alpha.6

## 5.0.0-alpha.5

### Minor Changes

- [#2782](https://github.com/kubb-labs/kubb/pull/2782) [`f373168`](https://github.com/kubb-labs/kubb/commit/f37316845ef3f8753a93e04a946b333ee4e42073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - - **`@kubb/ast`**: Added `never` to `PrimitiveSchemaType` and `SchemaNodeByType`. Added `UrlSchemaNode` type with optional `path` field for Express-style template literal generation. Excluded `url` from `ScalarSchemaType`. Added `applyParamsCasing` helper to transform parameter names before schema building.
  - **`@kubb/adapter-oas`**: Added `unknownType` and `emptySchemaType` options to `convertSchema` so callers can control the type emitted for empty or untyped schemas. Added `url` special-type handling in the parser.
  - **`@kubb/core`**: `resolveOptions` now prevents recursive overrides by typing `OverrideItem.options` as `Omit<Partial<TOptions>, 'override'>`.
  - **`@kubb/plugin-ts`**: New v2 schema-builder utilities — `buildDataSchemaNode`, `buildParamsSchema`, `buildResponsesSchemaNode`, and `buildResponseUnionSchemaNode` — for generating typed `Data`, `Responses`, and `Response` types from an `OperationNode`. The printer now handles the `never` schema type.

## 5.0.0-alpha.4

### Minor Changes

- [#2776](https://github.com/kubb-labs/kubb/pull/2776) [`64e3d85`](https://github.com/kubb-labs/kubb/commit/64e3d8583c50c073bfe8945dcda5e700d262d9d9) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - - Add `resolveOptions(node, context)` utility to `@kubb/ast` — resolves the effective plugin options for an `OperationNode` or `SchemaNode` by applying `exclude`, `include`, and `override` rules. Returns `null` when the node is excluded or not matched by `include`.
  - Add explicit `options` parameter to `buildOperations`, `buildOperation`, and `buildSchema` in `@kubb/plugin-oas` so callers pass pre-resolved options instead of relying on `plugin.options` directly.
  - `plugin-ts` now calls `resolveOptions` from `@kubb/ast` inline before each `buildSchema`/`buildOperation` call and correctly awaits generators with `Promise.all`.

## 5.0.0-alpha.3

### Minor Changes

- [#2752](https://github.com/kubb-labs/kubb/pull/2752) [`827b444`](https://github.com/kubb-labs/kubb/commit/827b444e7c7c62d36ba9eaed7303ed0d18a7fa45) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - - Improved discriminator handling — named and inline enum variants are now generated correctly for discriminator properties.
  - Better support for string-based types (`uuid`, `email`, `url`, `datetime`, `date`, `time`) so they are consistently emitted as plain strings when expected.
  - Operation paths are now available in Express-style format (e.g. `/pets/:petId`) making it easier to use them directly in route definitions.

## 5.0.0-alpha.2

## 5.0.0-alpha.1

### Major Changes

- [`a4682ea`](https://github.com/kubb-labs/kubb/commit/a4682ea8896ef7d9ccae1b6e9abd6ed7bcaac073) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - The minimum required Node.js version is 22.

## 5.0.0-alpha.0

## 4.36.1

## 4.36.0

## 4.35.1

## 4.35.0

## 4.34.0

### Minor Changes

- [`6223e05`](https://github.com/kubb-labs/kubb/commit/6223e05881dafdd7bf4b2301e75dd853afcc5718) Thanks [@stijnvanhulle](https://github.com/stijnvanhulle)! - Add `RootMeta` type to `RootNode` with optional `meta` field for format-agnostic API document metadata (`title`, `version`, `baseURL`). Convert all node `interface` declarations to `type` aliases for consistency.

## 4.33.5
