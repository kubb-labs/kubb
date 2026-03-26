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
- `@kubb/core/hooks` -- `useDriver`

v5 (add):
- `@kubb/core` -- `defineGenerator`, `defineResolver`, `definePreset`, `definePresets`, `getPreset`, `renderOperation`, `renderSchema`, `getMode`
- `@kubb/ast` -- `walk`, `transform`, `createOperation`, `createParameter`, `createResponse`, `createSchema`
- `@kubb/ast/types` -- `OperationNode`, `SchemaNode`, `ParameterNode`, `Visitor`

## Two plugin categories

Operation plugins (walk operations only, no builders/printers needed):
- `plugin-cypress`, `plugin-client`, `plugin-react-query`, `plugin-swr`, `plugin-solid-query`, `plugin-svelte-query`, `plugin-vue-query`, `plugin-msw`

Schema plugins (walk both schemas and operations, need builders + printers):
- `plugin-ts`, `plugin-zod`, `plugin-faker`

The plan covers both. Sections marked "(schema plugins only)" can be skipped for operation plugins.

## File inventory

Every file that needs to change, grouped by action:

New files to create:
- `src/constants.ts` -- typed `Set` as const constants in SCREAMING_SNAKE_CASE or consts with `as const` named in camelCase
- `src/resolvers/resolverPLUGIN_PASCAL.ts` -- `defineResolver` with naming helpers
- `src/resolvers/index.ts` -- barrel export
- `src/presets.ts` -- `definePresets` registry and `getPreset` helper
- `src/builders/` -- (schema plugins only) `defineBuilder` usage
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
- `src/generators/index.ts` -- usually unchanged
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
- `packages/core/src/definePreset.ts` -- preset factory
- `packages/core/src/definePresets.ts` -- preset registry factory
- `packages/core/src/utils/getPreset.ts` -- preset merging (resolvers merge, transformers concat, generators concat)
- `packages/core/src/types.ts` -- `Resolver`, `Builder`, `PluginFactoryOptions` (7 type params), `ResolverPathParams`, `ResolverContext`, `ResolverFileParams`

Reference implementation (plugin-ts):
- `packages/plugin-ts/src/types.ts` -- `ResolverTs` type with methods + JSDoc, `BuilderTs` type, `Options` with all v5 fields, `PluginFactoryOptions` generic
- `packages/plugin-ts/src/constants.ts` -- SCREAMING_SNAKE_CASE `Set` constants
- `packages/plugin-ts/src/resolvers/resolverTs.ts` -- `defineResolver` with `default`, `resolveName`, `resolveTypedName`, etc.
- `packages/plugin-ts/src/resolvers/resolverTsLegacy.ts` -- legacy resolver extending base for `kubbV4` preset
- `packages/plugin-ts/src/presets.ts` -- `definePresets`, `definePreset`, `getPreset`
- `packages/plugin-ts/src/generators/typeGenerator.tsx` -- `defineGenerator` with `Operation` and `Schema` methods
- `packages/plugin-ts/src/generators/typeGenerator.test.tsx` -- v5 test pattern
- `packages/plugin-ts/src/plugin.ts` -- `walk()`, `renderOperation()`, `renderSchema()`, resolver delegation with warnings
- `packages/plugin-ts/tsdown.config.ts` -- build entry map
- `packages/plugin-ts/package.json` -- `exports` and `typesVersions`

Schema plugins only:
- `packages/plugin-ts/src/builders/builderTs.ts` -- `defineBuilder`
- `packages/plugin-ts/src/printers/printerTs.ts` -- `definePrinter`
- `packages/core/src/defineBuilder.ts` -- builder factory
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
- `Resolver`, `Builder`, `Generator`, `CompatibilityPreset`, `Output`, `Group`, `Exclude`, `Include`, `Override`, `PluginFactoryOptions`, `ResolvePathOptions` from `@kubb/core`
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
```

Update `PluginFactoryOptions` generic -- add resolver type as 6th param:

```typescript
// Operation plugin:
export type PluginCypress = PluginFactoryOptions<'plugin-cypress', Options, ResolvedOptions, never, ResolvePathOptions, ResolverCypress>

// Schema plugin (add builder as 7th param):
// export type PluginZod = PluginFactoryOptions<'plugin-zod', Options, ResolvedOptions, never, ResolvePathOptions, ResolverZod, BuilderZod>
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
```

### Step 4: Create src/resolvers/index.ts

```typescript
export { resolverCypress } from './resolverCypress.ts'
```

### Step 5: Create src/presets.ts

Read `packages/plugin-ts/src/presets.ts` first.

```typescript
import type { Visitor } from '@kubb/ast/types'
import { type CompatibilityPreset, definePreset, definePresets, type Generator, getPreset as getCorePreset } from '@kubb/core'
import { cypressGenerator } from './generators/index.ts'
import { resolverCypress } from './resolvers/index.ts'
import type { PluginCypress, ResolverCypress } from './types.ts'

/**
 * Built-in preset registry for `@kubb/plugin-cypress`.
 *
 * - `default` -- uses `resolverCypress` and `cypressGenerator`.
 */
export const presets = definePresets<ResolverCypress>({
  default: definePreset('default', { resolvers: [resolverCypress], generators: [cypressGenerator] }),
})

type GetPresetOptions = {
  resolvers: Array<ResolverCypress>
  transformers: Array<Visitor>
  generators: Array<Generator<PluginCypress>>
}

/**
 * Resolves a compatibility preset for `plugin-cypress`, merging user-supplied
 * resolvers, transformers, and generators on top of the built-in preset defaults.
 *
 * @example
 * ```ts
 * const preset = getPreset('default', { resolvers: [], transformers: [], generators: [] })
 * ```
 */
export function getPreset(preset: CompatibilityPreset, { resolvers, transformers, generators }: GetPresetOptions) {
  return getCorePreset({
    preset,
    presets,
    resolvers: [resolverCypress, ...(resolvers ?? [])],
    transformers,
    generators,
  })
}
```

### Step 6: Update package.json

In `dependencies`:
- Remove `"@kubb/oas": "workspace:*"` and `"@kubb/plugin-oas": "workspace:*"`
- Add `"@kubb/ast": "workspace:*"` and `"@kubb/fabric-core": "catalog:"`

In `exports`, add:

```json
"./resolvers": {
  "import": "./dist/resolvers.js",
  "require": "./dist/resolvers.cjs"
}
```

In `typesVersions`, add:

```json
"resolvers": ["./dist/resolvers.d.ts"]
```

Remove stale entries from `typesVersions` (e.g. `"utils"`, `"hooks"`) if those sub-paths no longer exist.

For schema plugins, also add `"./builders"` and `"./printers"` entries in both `exports` and `typesVersions`.

### Step 7: Update tsdown.config.ts

Add `resolvers` to the entry map:

```typescript
const entry = {
  index: 'src/index.ts',
  components: 'src/components/index.ts',
  generators: 'src/generators/index.ts',
  resolvers: 'src/resolvers/index.ts',
}
```

For schema plugins, also add `builders: 'src/builders/index.ts'` and `printers: 'src/printers/index.ts'`.

### Step 8: Verify barrel exports

Check `src/index.ts` and `src/generators/index.ts`. Usually no changes needed.

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
- Replace `typeSchemas: OperationSchemas` with `node: OperationNode`
- Replace `url: string` and `method: HttpMethod` -- get these from `node.path` and `node.method`
- Add `resolver: ResolverCypress` for name resolution
- Keep plugin-specific props like `dataReturnType`, `paramsCasing`, etc.

Change the implementation:
- Extract path/query/header parameters by filtering `node.parameters` on `param.in`
- Build URL template string from `node.path` directly (replace `URLPath` usage)
- Use `DATA_RETURN_TYPE_DATA.has(dataReturnType)` instead of `dataReturnType === 'data'`
- Use `node.method` (uppercase from AST) and lowercase it for output
- Use `resolver.resolveName()` for resolving type/function names
- Add JSDoc to the `Props` type and any helper functions

### Step 2: Rewrite generators

Read `packages/plugin-ts/src/generators/typeGenerator.tsx` first.

Remove these imports:
- `useDriver` from `@kubb/core/hooks`
- `createReactGenerator` from `@kubb/plugin-oas/generators`
- `useOas`, `useOperationManager` from `@kubb/plugin-oas/hooks`
- `getBanner`, `getFooter` from `@kubb/plugin-oas/utils`

Add these imports:
- `defineGenerator`, `getMode` from `@kubb/core`

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
  Operation({ node, adapter, options, config }) {
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group, resolver } = options
    const root = path.resolve(config.root, config.output.path)

    const file = resolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root, output, group },
    )

    const name = resolver.resolveName(node.operationId)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {/* File.Import for type imports from plugin-ts */}
        <Request name={name} node={node} resolver={resolver} /* ...other props */ />
      </File>
    )
  },
})
```

Key differences:
- `defineGenerator` instead of `createReactGenerator`
- Must include `type: 'react'` in the definition
- Props are `{ node, adapter, options, config }` not `{ operation, generator, plugin }`
- No hooks -- all data comes from `options` and `node`
- `resolver.resolveFile()` replaces `getFile()`
- `resolver.resolveName()` replaces `getName()`
- `resolver.resolveBanner()` / `resolver.resolveFooter()` replaces `getBanner()` / `getFooter()`
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
- `renderOperation` from `@kubb/core` (and `renderSchema` for schema plugins)
- `getPreset` from `./presets.ts`

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

const { resolver, transformers, generators } = getPreset(compatibilityPreset, {
  resolvers: userResolvers,
  transformers: userTransformers,
  generators: userGenerators,
})
```

Change the plugin return object:

`pre` array: Remove `pluginOasName`. Keep other dependencies like `pluginTsName`.

`options` object: Add `resolver` and `transformers` to the resolved options.

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
- Component: `Request.tsx` builds `cy.request()` calls
- Remove deps: `@kubb/oas`, `@kubb/plugin-oas`
- Add deps: `@kubb/ast`, `@kubb/fabric-core`
- Keep deps: `@kubb/core`, `@kubb/plugin-ts`, `@kubb/react-fabric`

### plugin-client (operation plugin)

- Multiple generators: `clientGenerator`, `classClientGenerator`, `staticClassClientGenerator`, `groupedClientGenerator`, `operationsGenerator`
- Template source files (`templates/`) and bundled clients (`clients/`) stay unchanged
- Group name defaults to `Controller` suffix

### plugin-react-query (operation plugin)

- Multiple generators for queries, mutations, suspense, infinite queries
- Depends on `plugin-ts` for types and optionally `plugin-client` for client functions

### plugin-zod, plugin-faker (schema plugins)

- Walk both `schema` and `operation` nodes
- Need `defineBuilder` for composing AST subtrees
- Need `definePrinter` for converting schemas to target output
- Has `parser.ts` for schema-to-code conversion
- Model builders on `plugin-ts/src/builders/builderTs.ts`
- Model printers on `plugin-ts/src/printers/printerTs.ts`
- Add `builders` and `printers` entries to `tsdown.config.ts`, `package.json` exports, and `typesVersions`
