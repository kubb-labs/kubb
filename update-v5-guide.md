# Upgrade Kubb Plugin to v5 Architecture

Playbook for upgrading any Kubb plugin from v4 to v5. Written with `plugin-cypress` as the worked example but reusable for any plugin. Always use `plugin-ts` as the reference implementation to copy from.

## How to use this plan

This plan has four phases. Each phase is self-contained and can be handed to an LLM as a standalone prompt. Phases must run in order because each depends on the output of the previous one.

When applying to a specific plugin, substitute these values throughout:

- PLUGIN_ID: the package name suffix, e.g. `cypress`, `client`, `react-query`
- PLUGIN_PASCAL: PascalCase name, e.g. `Cypress`, `Client`, `ReactQuery`
- PLUGIN_PKG: the full package scope, e.g. `@kubb/plugin-cypress`

For `plugin-cypress`: PLUGIN_ID = `cypress`, PLUGIN_PASCAL = `Cypress`, PLUGIN_PKG = `@kubb/plugin-cypress`.

## What changes and why

v4 plugins depend on `@kubb/plugin-oas` which tightly couples them to the OpenAPI adapter. v5 decouples plugins from any specific adapter by using a universal AST layer (`@kubb/ast`) and core infrastructure (`@kubb/core`).

v4 (remove):
- `@kubb/plugin-oas` -- `OperationGenerator`, `createReactGenerator`, `pluginOasName`
- `@kubb/plugin-oas/hooks` -- `useOas`, `useOperationManager`
- `@kubb/plugin-oas/utils` -- `getBanner`, `getFooter`, `getPathParams`
- `@kubb/plugin-oas/generators` -- `Generator` type
- `@kubb/oas` -- `HttpMethod`, `isOptional`, `isAllOptional`, `contentType`, `Oas`, `parse`
- `@kubb/core/hooks` -- `useDriver` (removed; no longer needed for cross-plugin resolution)

v5 (add):
- `@kubb/core` -- `defineGenerator`, `defineResolver`, `definePresets`, `getPreset`, `renderOperation`, `renderSchema`, `getMode`
- `@kubb/ast` -- `walk`, `transform`, `createOperation`, `createParameter`, `createResponse`, `createSchema`, `caseParams`
- `@kubb/ast/types` -- `OperationNode`, `SchemaNode`, `ParameterNode`, `Visitor`

### Cross-plugin file references (operation plugins that import from plugin-ts)

Operation plugins that generate code importing types from `plugin-ts` (e.g. `plugin-cypress`) need to:
1. Know the file path that `plugin-ts` generates for each operation
2. Use the same TypeScript type naming that respects the user's `compatibilityPreset`

In v5, both are solved without `useDriver()`:

**For the TS file path** — call `tsResolver.resolveFile(...)` where `tsResolver` is the preset-aware TypeScript resolver obtained at render time in the generator via `driver.getPlugin<PluginTs>(pluginTsName)?.resolver`.

**For type names** — use a `buildTypeNames({ node, paramsCasing, resolver: tsResolver })` helper in `utils.ts` (see `plugin-cypress/src/utils.ts` as reference). It calls `tsResolver.resolveName`, `tsResolver.resolveParamName`, `tsResolver.resolveDataName`, etc. and returns a structured `TypeNames` object that components can use directly.

This means:
- `@kubb/core/hooks` / `useDriver()` is **not** needed
- `resolverTs` is **not** imported directly in the generator — it is obtained at runtime from `driver.getPlugin<PluginTs>(pluginTsName)?.resolver`
- A second `getPreset` call for `tsResolver` in `plugin.ts` is **not** needed
- `tsResolver` is **not** stored in `ResolvedOptions` — it is resolved lazily from the driver

## Two plugin categories

Operation plugins (walk operations only, no printers needed):
- `plugin-cypress`, `plugin-client`, `plugin-react-query`, `plugin-swr`, `plugin-solid-query`, `plugin-svelte-query`, `plugin-vue-query`, `plugin-msw`

Schema plugins (walk both schemas and operations, need printers):
- `plugin-ts`, `plugin-zod`, `plugin-faker`

The plan covers both. Sections marked "(schema plugins only)" can be skipped for operation plugins.

## File inventory

Every file that needs to change, grouped by action:

New files to create:
- `src/constants.ts` -- typed `Set` as const constants in SCREAMING_SNAKE_CASE or consts with `as const` named in camelCase
- `src/resolvers/resolverPLUGIN_PASCAL.ts` -- `defineResolver` with naming helpers
- `src/resolvers/index.ts` -- barrel export
- `src/presets.ts` -- `definePresets` registry (no `getPreset` wrapper; call `@kubb/core`'s `getPreset` directly in `plugin.ts`)
- `src/utils.ts` -- (schema plugins only) standalone schema-building helper functions; for operation plugins that depend on plugin-ts, add a `buildTypeNames({ node, paramsCasing, resolver })` helper that accepts the preset-aware `ResolverTs`
- `src/printers/` -- (schema plugins only) `definePrinter` usage

Files to rewrite:
- `src/types.ts` -- new resolver type, v5 options, updated generics
- `src/components/*.tsx` -- props change from OAS types to AST nodes
- `src/generators/*Generator.tsx` -- `defineGenerator` replaces `createReactGenerator`
- `src/plugin.ts` -- `walk()` + `renderOperation()` replaces `OperationGenerator`
- `src/generators/*Generator.test.tsx` -- AST factory functions replace YAML parsing

Files to update:
- `package.json` -- swap dependencies, add export entries
- `tsdown.config.ts` -- add `resolvers` build entry
- `src/generators/__snapshots__/**` -- regenerate with `pnpm test -u`

Files that stay the same:
- `src/index.ts` -- usually unchanged
- `src/generators/index.ts` -- remove file
- `src/components/index.ts` -- remove file
- Template/client files (e.g. `templates/`, `clients/`) -- unchanged

## Style rules (apply to all files)

JSDoc (follow `.skills/jsdoc/SKILL.md` and `plugin-ts` conventions):
- Exported constants: one-line JSDoc above each
- Plugin name export: "Canonical plugin name for PLUGIN_PKG, ..."
- Plugin factory: multi-line JSDoc with description + `@example` showing kubb config
- Resolver export: multi-line JSDoc + `@example` showing input/output
- Preset function: JSDoc + `@example`
- Type properties: description + `@default` tag, enum values as `- 'value' description.` bullets
- Resolver type methods: `@example` on each method
- Tags to use: `@default`, `@example`, `@note`, `@deprecated`
- Tags to avoid: `@param`, `@returns`, `@type` (TypeScript provides these)

Constants:
- SCREAMING_SNAKE_CASE names
- Typed `new Set<T>([...] as const)`
- One JSDoc line per constant explaining the grouping

## Reference files to read

Read these before starting. They show the exact patterns to follow.

Core infrastructure:
- `packages/core/src/defineGenerator.ts` -- generator factory, `ReactGeneratorV2` type, no-op defaults
- `packages/core/src/defineResolver.ts` -- resolver factory, built-in defaults for path/file/banner/footer/options resolution
- `packages/core/src/definePresets.ts` -- preset registry factory (`definePresets`); entries are plain `{ name, resolvers, generators? }` objects — no separate `definePreset` helper
- `packages/core/src/utils/getPreset.ts` -- preset merging (resolvers merge, transformers concat, generators concat)
- `packages/core/src/types.ts` -- `Resolver`, `PluginFactoryOptions` (6 type params), `ResolverPathParams`, `ResolverContext`, `ResolverFileParams`, `UserGroup` (user-facing, `name` optional) vs `Group` (resolved, `name` always present)
- `packages/ast/src/utils.ts` -- `syncOptionality(schema, required)`: sets `schema.optional` / `schema.nullish` based on `required`; note param order is `(schema, required)` not `(required, schema)`
- `packages/ast/src/nodes/operation.ts` -- `OperationNode.requestBody.required?: boolean` — `true` when spec has `required: true`, `undefined` when absent

Reference implementation (plugin-ts):
- `packages/plugin-ts/src/types.ts` -- `ResolverTs` type with methods + JSDoc, `Options` with all v5 fields, `PluginFactoryOptions` generic; `Options.group` is `UserGroup`, `ResolvedOptions.group` is `Group | undefined`
- `packages/plugin-ts/src/constants.ts` -- SCREAMING_SNAKE_CASE `Set` constants
- `packages/plugin-ts/src/resolvers/resolverTs.ts` -- `defineResolver` with `default`, `resolveName`, `resolveTypedName`, etc.
- `packages/plugin-ts/src/resolvers/resolverTsLegacy.ts` -- legacy resolver extending base for `kubbV4` preset; exported from `src/index.ts` as `resolverTsLegacy`
- `packages/plugin-ts/src/presets.ts` -- `definePresets` with plain preset objects (no `definePreset` wrapper; use `@kubb/core`'s `getPreset` directly in `plugin.ts`)
- `packages/plugin-ts/src/utils.ts` -- standalone schema-building helpers: `buildParams`, `buildData`, `buildResponses`, `buildResponseUnion`
- `packages/plugin-ts/src/generators/typeGenerator.tsx` -- `defineGenerator` with `Operation` and `Schema` methods
- `packages/plugin-ts/src/generators/typeGenerator.test.tsx` -- v5 test pattern
- `packages/plugin-ts/src/plugin.ts` -- `walk()`, `renderOperation()`, `renderSchema()`, resolver delegation with warnings
- `packages/plugin-ts/tsdown.config.ts` -- build entry map
- `packages/plugin-ts/package.json` -- `exports` and `typesVersions`

Schema plugins only:
- `packages/plugin-ts/src/printers/printerTs.ts` -- `definePrinter`
- `packages/ast/src/printers/printer.ts` -- printer factory

Test mocks:
- `configs/mocks.ts` -- `createMockedAdapter`, `createMockedPlugin`, `createMockedPluginDriver`, `matchFiles`

---

## Phase 1 -- Foundation

Goal: Create the type system, constants, resolver, presets, and build config. No dependencies on other phases.

Files to create: `src/types.ts`, `src/constants.ts`, `src/resolvers/resolverPLUGIN_PASCAL.ts`, `src/resolvers/index.ts`, `src/presets.ts`

Files to update: `package.json`, `tsdown.config.ts`

### Step 1: Rewrite src/types.ts

Read `packages/plugin-ts/src/types.ts` first. Then rewrite the plugin's `types.ts` following that pattern.

Remove these imports:
- `contentType`, `Oas` from `@kubb/oas`
- `Exclude`, `Include`, `Override`, `ResolvePathOptions` from `@kubb/plugin-oas`
- `Generator` from `@kubb/plugin-oas/generators`

Add these imports:
- `Resolver`, `Generator`, `CompatibilityPreset`, `Output`, `Group`, `Exclude`, `Include`, `Override`, `PluginFactoryOptions`, `ResolvePathOptions` from `@kubb/core`
- `Visitor` from `@kubb/ast/types`

Define resolver type (example for plugin-cypress):

```typescript
export type ResolverCypress = Resolver & {
  /**
   * Resolves the function name for a given raw operation name.
   * @example
   * resolver.resolveName('show pet by id') // -> 'showPetById'
   */
  resolveName(name: string): string
}
```

For schema plugins, add more methods following `ResolverTs` (e.g. `resolveTypedName`, `resolveParamName`, `resolveResponseStatusName`, etc.).

Update `Options` type:
- Keep all plugin-specific options (`dataReturnType`, `paramsType`, `pathParamsType`, `baseURL`, `paramsCasing`, `group`, `exclude`, `include`, `override`, `output`)
- Remove `contentType` (adapter responsibility)
- Remove old `transformers` object with `name` callback
- Change `Output<Oas>` to plain `Output`
- Use `UserGroup` for the user-facing `group` option (allows omitting `name`); use `Group | undefined` in `ResolvedOptions` (always has `name`, normalised in `plugin.ts`):

```typescript
// In Options (user-facing):
group?: UserGroup

// In ResolvedOptions (after normalisation in plugin.ts):
group: Group | undefined
```
- Add these new options with JSDoc:

```typescript
/**
 * Apply a compatibility naming preset.
 * @default 'default'
 */
compatibilityPreset?: CompatibilityPreset
/**
 * Array of named resolvers that control naming conventions.
 * Later entries override earlier ones (last wins).
 * @default [resolverCypress]
 */
resolvers?: Array<ResolverCypress>
/**
 * Array of AST visitors applied to each node before printing.
 * Uses `transform()` from `@kubb/ast`.
 */
transformers?: Array<Visitor>
/**
 * Define some generators next to the default generators.
 */
generators?: Array<Generator<PluginCypress>>
```

Update `ResolvedOptions` type -- add:

```typescript
resolver: ResolverCypress
transformers: Array<Visitor>
/**
 * Fully resolved group: always has a `name` function (normalised in `plugin.ts`
 * from the user-supplied `UserGroup` which may omit `name`).
 */
group: Group | undefined
```

> **Note:** Do **not** add `tsResolver` to `ResolvedOptions`. The TypeScript resolver is retrieved at render time in the generator via `driver.getPlugin(pluginTsName)?.resolver as ResolverTs` — it does not need to live in the plugin's options.

Update `PluginFactoryOptions` generic -- add resolver type as 6th param:

```typescript
// Operation plugin:
export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, never, ResolvePathOptions, ResolverCypress>

// Schema plugin (same, no 7th param needed):
// export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, ResolvePathOptions, ResolverZod>
```

### Step 2: Create src/constants.ts

Read `packages/plugin-ts/src/constants.ts` first. Create constants for option values that share behavior.

Example for plugin-cypress:

```typescript
import type { PluginCypress } from './types.ts'

type DataReturnType = PluginCypress['resolvedOptions']['dataReturnType']

/**
 * `dataReturnType` values where `cy.request` returns the full `Cypress.Response` object.
 */
export const DATA_RETURN_TYPE_FULL = new Set<DataReturnType>(['full'] as const)

/**
 * `dataReturnType` values where `cy.request` returns only `response.body`.
 */
export const DATA_RETURN_TYPE_DATA = new Set<DataReturnType>(['data'] as const)
```

### Step 3: Create src/resolvers/resolverPLUGIN_PASCAL.ts

Read `packages/plugin-ts/src/resolvers/resolverTs.ts` first. Create the resolver using `defineResolver`.

The `default`, `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, and `resolveFooter` methods are auto-injected with sane defaults. Only define methods that need custom behavior.

Example for plugin-cypress:

```typescript
import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginCypress } from '../types.ts'

/**
 * Resolver for `@kubb/plugin-cypress` that provides the default naming
 * and path-resolution helpers used by the plugin.
 *
 * @example
 * ```ts
 * import { resolverCypress } from '@kubb/plugin-cypress/resolvers'
 *
 * resolverCypress.default('list pets', 'function') // -> 'listPets'
 * resolverCypress.resolveName('show pet by id')    // -> 'showPetById'
 * ```
 */
export const resolverCypress = defineResolver<PluginCypress>(() => ({
  name: 'default',
  pluginName: 'plugin-cypress',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
}))

### Step 4: Create src/presets.ts

Read `packages/plugin-ts/src/presets.ts` first.

The presets file only exports a `presets` registry — **no `getPreset` wrapper**. Use `getPreset` from `@kubb/core` directly in `plugin.ts`. Each entry is a plain object `{ name, resolvers, generators? }` passed directly to `definePresets` — there is no `definePreset` helper.

```typescript
import { definePresets } from '@kubb/core'
import { cypressGenerator } from './generators/index.ts'
import { resolverCypress } from './resolvers/index.ts'
import type { ResolverCypress } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-cypress`.
 *
 * - `default` — uses `resolverCypress` and `cypressGenerator`.
 * - `kubbV4`  — uses `resolverCypress` and `cypressGenerator`.
 */
export const presets = definePresets<ResolverCypress>({
  default: {
    name: 'default',
    resolvers: [resolverCypress],
    generators: [cypressGenerator],
  },
  kubbV4: {
    name: 'kubbV4',
    resolvers: [resolverCypress],
    generators: [cypressGenerator],
  },
})
```

### Step 5: Update package.json

In `dependencies`:
- Remove `"@kubb/oas": "workspace:*"` and `"@kubb/plugin-oas": "workspace:*"`
- Add `"@kubb/ast": "workspace:*"` and `"@kubb/fabric-core": "catalog:"`

Everything — resolvers, presets, components, generators — is exported from the main `index.ts`. No additional sub-path exports (`./resolvers`, `./presets`, `./components`, etc.) are needed. The `exports` field stays minimal:

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  },
  "./package.json": "./package.json"
},
"typesVersions": {}
```

Remove any stale sub-path entries (`"./resolvers"`, `"./presets"`, `"./utils"`, `"./hooks"`, etc.) from both `exports` and `typesVersions`.

### Step 6: Update tsdown.config.ts

Keep the entry map with only `index`:

```typescript
const entry = {
  index: 'src/index.ts',
}
```

Remove any extra entries (`presets`, `resolvers`, `components`, `generators`, `printers`).

### Step 7: Ensure barrel exports in src/index.ts

Since everything ships through `index.ts`, make sure `src/index.ts` re-exports all public API: resolvers, presets, generators, components, types, constants, plugin factory and name.

---

## Phase 2 -- Generation

Goal: Rewrite components and generators to use v5 APIs. Depends on Phase 1 being complete.

Files to rewrite: `src/components/*.tsx`, `src/generators/*Generator.tsx`

### Step 1: Rewrite components

Read `packages/plugin-ts/src/generators/typeGenerator.tsx` to see how the v5 generator passes data to components.

For each component file, make these changes:

Remove these imports:
- `URLPath` from `@internals/utils`
- `HttpMethod`, `isAllOptional`, `isOptional` from `@kubb/oas`
- `OperationSchemas` from `@kubb/plugin-oas`
- `getPathParams` from `@kubb/plugin-oas/utils`

Add these imports:
- `OperationNode`, `ParameterNode` from `@kubb/ast/types`

Change the Props type:
- Replace `typeSchemas: OperationSchemas` with a `typeNames` object containing pre-computed type name strings (computed in the generator using `resolverTs`)
- Replace `url: string` and `method: HttpMethod` with `node: OperationNode` — get `node.path` and `node.method.toLowerCase()` directly
- Keep plugin-specific props like `dataReturnType`, `paramsCasing`, etc.

Change the implementation:
- Extract path/query/header parameters from `typeNames.pathParams`, `typeNames.queryParams`, `typeNames.headerParams`
- Build URL template string from `node.path` directly: replace `:paramName` with `${paramName}` using already-cased param names
- Use `DATA_RETURN_TYPE_DATA.has(dataReturnType)` instead of `dataReturnType === 'data'` (or keep `=== 'data'` for simplicity)
- Use `node.method.toLowerCase()` for the HTTP method string
- Replace `isOptional(schema)` with `!param.required` on individual `ParameterNode`s
- Replace `isAllOptional(schema)` with `params.every(p => !p.required)`
- For request body optionality: use `node.requestBody?.required` — it is `true` when the spec declares `requestBody.required: true`, and `undefined` otherwise (never `false`). Pass it as `required: node.requestBody?.required ?? false` when building `TypeNames.requestBody`.
- Replace `getPathParams(typeSchemas.pathParams, { typed: true })` with `Object.fromEntries(typeNames.pathParams.map(p => [p.name, { type: p.typedName, required: p.required }]))`
- For query/header params with no grouped type: use an inline object type string like `{ limit?: ListPetsQueryLimit }` built from `typeNames.queryParams`
- Add JSDoc to the `Props` type and any helper functions

The `TypeNames` type should be exported from the component so the generator can import and use it:

```typescript
export type TypeNames = {
  pathParams: Array<{ name: string; typedName: string; required: boolean }>
  queryParams: Array<{ name: string; typedName: string; required: boolean }>
  headerParams: Array<{ name: string; typedName: string; required: boolean }>
  requestBody?: { typedName: string; required: boolean }
  response: { typedName: string }
}
```

When rendering the `data` parameter for a request body, use `optional: !requestBody.required` — the `required` field maps directly from `OperationNode.requestBody.required` which is `true` when the spec declares `requestBody.required: true` and `undefined` otherwise (never `false`).

### Step 2: Rewrite generators

Read `packages/plugin-ts/src/generators/typeGenerator.tsx` first.

Remove these imports:
- `createReactGenerator` from `@kubb/plugin-oas/generators`
- `useOas`, `useOperationManager` from `@kubb/plugin-oas/hooks`
- `getBanner`, `getFooter` from `@kubb/plugin-oas/utils`

Add these imports:
- `defineGenerator`, `getMode` from `@kubb/core`

**For plugins that import types from plugin-ts** (e.g. `plugin-cypress`):
- Do **not** import `useDriver`, `resolverTs`, or anything from `@kubb/plugin-ts/resolvers` in the generator
- Instead, retrieve the TypeScript resolver at render time: `driver.getPlugin(pluginTsName)?.resolver as ResolverTs`
- Use `buildTypeNames({ node, paramsCasing, resolver: tsResolver })` from `./utils.ts`

Change the generator definition.

Before (v4):

```typescript
export const cypressGenerator = createReactGenerator<PluginCypress>({
  name: 'cypress',
  Operation({ operation, generator, plugin }) {
    const driver = useDriver()
    const oas = useOas()
    const { getSchemas, getName, getFile } = useOperationManager(generator)
    // ...
  },
})
```

After (v5):

```typescript
export const cypressGenerator = defineGenerator<PluginCypress>({
  name: 'cypress',
  type: 'react',
  Operation({ node, adapter, options, config, driver }) {
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group, resolver } = options
    const root = path.resolve(config.root, config.output.path)

    const pluginTs = driver.getPlugin<PluginTs>(pluginTsName)

    const file = resolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root, output, group },
    )

    const name = resolver.resolveName(node.operationId)

    // buildTypeNames uses tsResolver so naming respects the user's compatibilityPreset
    const typeNames = buildTypeNames({ node, paramsCasing, resolver: tsResolver })

    const importedTypeNames = [
      ...typeNames.pathParams.map((p) => p.typedName),
      ...typeNames.queryParams.map((p) => p.typedName),
      ...typeNames.headerParams.map((p) => p.typedName),
      typeNames.requestBody?.typedName,
      typeNames.response.typedName,
    ].filter((n): n is string => Boolean(n))

    // Use tsResolver.resolveFile to get the plugin-ts output path (respects preset)
    const tsFile = pluginTs.resolvers.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root: pluginTs.options.root, output: pluginTs.options.output, group: pluginTs.options.group },
    )

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        <File.Import name={Array.from(new Set(importedTypeNames))} root={file.path} path={tsFile?.path} isTypeOnly />
        <Request name={name} node={node} typeNames={typeNames} /* ...other props */ />
      </File>
    )
  },
})
```

Key differences:
- `defineGenerator` instead of `createReactGenerator`
- Must include `type: 'react'` in the definition
- Props are `{ node, adapter, options, config, driver }` not `{ operation, generator, plugin }`
- No OAS hooks — all data comes from `options`, `node`, and `driver`
- `resolver.resolveFile()` replaces `getFile()`
- `resolver.resolveName()` replaces `getName()`
- `resolver.resolveBanner()` / `resolver.resolveFooter()` replaces `getBanner()` / `getFooter()`
- For type names: call `driver.getPlugin(pluginTsName)?.resolver as ResolverTs` at render time — no `options.tsResolver`, no second `getPreset` call in `plugin.ts`
- Use `tsResolver?.resolveFile()` (not `resolver.resolveFile()`) to get the plugin-ts output file path
- Schema plugins also implement `Schema({ node, adapter, options, config })`

---

## Phase 3 -- Plugin

Goal: Rewrite the plugin entry point to use AST walking and v5 rendering. Depends on Phases 1 and 2.

Files to rewrite: `src/plugin.ts`

### Step 1: Rewrite plugin.ts

Read `packages/plugin-ts/src/plugin.ts` first.

Remove these imports:
- `OperationGenerator`, `pluginOasName` from `@kubb/plugin-oas`

Add these imports:
- `walk` from `@kubb/ast`
- `renderOperation`, `getPreset` from `@kubb/core` (and `renderSchema` for schema plugins)
- `presets` from `./presets.ts`
- the plugin's default resolver (e.g. `resolverCypress`) from `./resolvers/index.ts`

For plugins that depend on `plugin-ts`, the TypeScript resolver is **not** imported at build time — it is retrieved at render time in the generator via `driver.getPlugin(pluginTsName)?.resolver`. No second `getPreset` call is needed in `plugin.ts`.

Change the options destructuring to include v5 fields:

```typescript
const {
  output = { path: 'cypress', barrelType: 'named' },
  group,
  exclude = [],
  include,
  override = [],
  // ... other plugin-specific options ...
  compatibilityPreset = 'default',
  resolvers: userResolvers = [],
  transformers: userTransformers = [],
  generators: userGenerators = [],
} = options

// Get the plugin's own resolver, transformers, and generators from its preset registry.
const preset = getPreset({
  preset: compatibilityPreset,
  presets,
  resolvers: [resolverCypress, ...userResolvers],
  transformers: userTransformers,
  generators: userGenerators,
})
```

> **Note:** Always pass the plugin's default resolver (e.g. `resolverCypress`) as the first element of `resolvers`. It acts as the base that preset and user resolvers are merged on top of.

Change the plugin return object:

`pre` array: Remove `pluginOasName`. Keep other dependencies like `pluginTsName`.

Use **getter syntax** for `resolver` and `options` so values always reflect the latest preset state. The `options` getter is also where `group` is normalised from the user-supplied `UserGroup` (which may omit `name`) into the resolved `Group` (which always has `name`):

```typescript
return {
  name: pluginCypressName,
  get resolver() {
    return preset.resolver
  },
  get options() {
    return {
      output,
      // Normalise UserGroup → Group: inject a default name function if the user
      // did not provide one, so downstream code can always call group.name().
      group: group
        ? ({
            ...options.group,
            name: options.group?.name
              ? options.group.name
              : (ctx) => {
                  if (group.type === 'path') {
                    return `${ctx.group.split('/')[1]}`
                  }
                  return `${camelCase(ctx.group)}Requests`
                },
          } as Group)
        : undefined,
      resolver,
      transformers,
      // ... other plugin-specific options
    }
  },
  // ...
}
```

`options` object: Add `resolver` and `transformers` to the resolved options. Do **not** add `tsResolver` — the TypeScript resolver is retrieved lazily in the generator via `driver.getPlugin(pluginTsName)?.resolver`.

`resolvePath`: Delegate to resolver with a deprecation warning:

```typescript
resolvePath(baseName, pathMode, options) {
  if (!resolvePathWarning) {
    this.driver.events.emit('warn', 'Do not use resolvePath for pluginCypress, use resolverCypress.resolvePath instead')
    resolvePathWarning = true
  }
  return resolver.resolvePath(
    { baseName, pathMode, tag: options?.group?.tag, path: options?.group?.path },
    { root: path.resolve(this.config.root, this.config.output.path), output, group },
  )
},
```

`resolveName`: Same pattern with deprecation warning, delegating to `resolver.default(name, type)`.

`install()`: Replace `OperationGenerator` with `walk` + `renderOperation`:

```typescript
async install() {
  const { config, fabric, plugin, adapter, rootNode, driver } = this
  const root = path.resolve(config.root, config.output.path)

  if (!adapter) {
    throw new Error('Plugin cannot work without adapter being set')
  }

  await walk(rootNode, {
    depth: 'shallow',
    async operation(operationNode) {
      const writeTasks = generators.map(async (generator) => {
        if (generator.type === 'react' && generator.version === '2') {
          const resolvedOptions = resolver.resolveOptions(operationNode, {
            options: plugin.options,
            exclude,
            include,
            override,
          })

          if (resolvedOptions === null) {
            return
          }

          await renderOperation(operationNode, {
            options: resolvedOptions,
            adapter,
            config,
            fabric,
            Component: generator.Operation,
            plugin,
            driver,
          })
        }
      })

      await Promise.all(writeTasks)
    },
    // Schema plugins also add:
    // async schema(schemaNode) { ... renderSchema(schemaNode, { ... }) }
  })

  const barrelFiles = await getBarrelFiles(this.fabric.files, {
    type: output.barrelType ?? 'named',
    root,
    output,
    meta: { pluginName: this.plugin.name },
  })

  await this.upsertFile(...barrelFiles)
},
```

Add JSDoc to exports:

```typescript
/**
 * Canonical plugin name for `@kubb/plugin-cypress`, used to identify the plugin
 * in driver lookups and warnings.
 */
export const pluginCypressName = 'plugin-cypress' satisfies PluginCypress['name']

/**
 * The `@kubb/plugin-cypress` plugin factory.
 *
 * Generates Cypress `cy.request()` test functions from an OpenAPI/AST `RootNode`.
 * Walks operations, delegates rendering to the active generators,
 * and writes barrel files based on `output.barrelType`.
 *
 * @example
 * ```ts
 * import { pluginCypress } from '@kubb/plugin-cypress'
 *
 * export default defineConfig({
 *   plugins: [pluginCypress({ output: { path: 'cypress' } })],
 * })
 * ```
 */
export const pluginCypress = createPlugin<PluginCypress>((options) => {
  // ...
})
```

---

## Phase 4 -- Tests

Goal: Rewrite tests to use AST factory functions and regenerate snapshots. Depends on all prior phases.

Files to rewrite: `src/generators/*Generator.test.tsx`

Files to regenerate: `src/generators/__snapshots__/**`

### Step 1: Rewrite test files

Read `packages/plugin-ts/src/generators/typeGenerator.test.tsx` first.

Remove these imports:
- `OperationGenerator`, `renderOperation` from `@kubb/plugin-oas`
- `parse` from `@kubb/oas`
- `HttpMethod` from `@kubb/oas`
- `fileURLToPath` and `__dirname` / `__filename` patterns

Add these imports:
- `createOperation`, `createParameter`, `createResponse`, `createSchema` from `@kubb/ast`
- `renderOperation` from `@kubb/core`
- `createMockedAdapter` from `#mocks`
- `resolverCypress` from `../resolvers`

Replace YAML-parsed test data with AST factory calls:

```typescript
const testData = [
  {
    name: 'showPetById',
    node: createOperation({
      operationId: 'showPetById',
      method: 'GET',
      path: '/pets/:petId',
      tags: ['pets'],
      parameters: [
        createParameter({
          name: 'petId',
          in: 'path',
          schema: createSchema({ type: 'string' }),
          required: true,
        }),
      ],
      responses: [
        createResponse({
          statusCode: '200',
          schema: createSchema({ type: 'object', properties: [] }),
          description: 'Expected response',
        }),
      ],
    }),
  },
  // ... more test cases
]
```

Update default options to include `resolver` and `transformers`:

```typescript
const defaultOptions: PluginCypress['resolvedOptions'] = {
  output: { path: '.' },
  baseURL: undefined,
  group: undefined,
  dataReturnType: 'data',
  paramsCasing: 'camelcase',
  paramsType: 'inline',
  pathParamsType: 'inline',
  resolver: resolverCypress,
  transformers: [],
}
```

Update the render call:

```typescript
await renderOperation(props.node, {
  config: { root: '.', output: { path: 'test' } } as Config,
  fabric,
  adapter: createMockedAdapter(),
  driver: mockedPluginDriver,
  Component: cypressGenerator.Operation,
  plugin,
  options,
})
```

Remove `OperationGenerator` instantiation, `oas.operation()` calls, and YAML file references.

### Step 2: Regenerate snapshots

Run `pnpm test -u` in the plugin package directory.

---

## Plugin-specific notes

### plugin-cypress (operation plugin)

- Resolver: `ResolverCypress` with `resolveName` only
- Constants: `DATA_RETURN_TYPE_FULL`, `DATA_RETURN_TYPE_DATA`
- Generator: `cypressGenerator` with `Operation` only (no `Schema`)
- Plugin walks `operation` nodes only
- Component: `Request.tsx` builds `cy.request()` calls using pre-computed `TypeNames`
- Type names for imports/params: call `driver.getPlugin(pluginTsName)?.resolver as ResolverTs` in the generator → `buildTypeNames({ node, paramsCasing, resolver: tsResolver })`
- Cross-plugin file path: use `tsResolver?.resolveFile(...)` (no `useDriver()`, no `options.tsResolver` needed)
- Remove deps: `@kubb/oas`, `@kubb/plugin-oas`
- Add deps: `@kubb/ast`
- Keep deps: `@kubb/core`, `@kubb/plugin-ts`, `@kubb/react-fabric`
- Vitest config: add `vite-tsconfig-paths` plugin so monorepo path aliases resolve correctly

### plugin-client (operation plugin)

- Multiple generators: `clientGenerator`, `classClientGenerator`, `staticClassClientGenerator`, `groupedClientGenerator`, `operationsGenerator`
- Template source files (`templates/`) and bundled clients (`clients/`) stay unchanged
- Group name defaults to `Controller` suffix

### plugin-react-query (operation plugin)

- Multiple generators for queries, mutations, suspense, infinite queries
- Depends on `plugin-ts` for types and optionally `plugin-client` for client functions

### plugin-zod, plugin-faker (schema plugins)

- Walk both `schema` and `operation` nodes
- Need `src/utils.ts` with standalone schema-building helper functions (e.g. `buildParams`, `buildData`) — see `plugin-ts/src/utils.ts` as reference
- Need `definePrinter` for converting schemas to target output
- Has `parser.ts` for schema-to-code conversion
- Model utils on `plugin-ts/src/utils.ts`
- Model printers on `plugin-ts/src/printers/printerTs.ts`
- Add a `printers` entry to `tsdown.config.ts`, `package.json` exports, and `typesVersions`
