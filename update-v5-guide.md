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
- `@kubb/core` -- `defineGenerator`, `defineResolver`, `definePresets`, `getPreset`, `renderOperation`, `renderSchema`, `renderOperations`, `runGeneratorSchema`, `runGeneratorOperation`, `runGeneratorOperations`, `getMode`
- `@kubb/ast` -- `walk`, `transform`, `createOperation`, `createParameter`, `createResponse`, `createSchema`, `caseParams`
- `@kubb/ast/types` -- `OperationNode`, `SchemaNode`, `ParameterNode`, `Visitor`

### Cross-plugin file references (operation plugins that import from plugin-ts)

Operation plugins that generate code importing types from `plugin-ts` (e.g. `plugin-cypress`) need to:
1. Know the file path that `plugin-ts` generates for each operation
2. Use the same TypeScript type naming that respects the user's `compatibilityPreset`

In v5, both are solved without `useDriver()`:

**For the TS file path** — call `pluginTs.resolver.resolveFile(...)` where `pluginTs` is obtained at render time in the generator via `driver.getPlugin<PluginTs>(pluginTsName)`.

**For type names** — no `buildTypeNames` helper or `utils.ts` is needed. Instead:
1. Use `caseParams(node.parameters, paramsCasing)` from `@kubb/ast` to apply param casing
2. Filter by `p.in === 'path'|'query'|'header'` for each group
3. For each group, call `tsResolver.resolvePathParamsName?.(node, p)` (with optional-chaining, since not all presets define it) or fall back to `tsResolver.resolveParamName(node, p)`
4. Pass `resolver: tsResolver` directly to the component; the component uses `createOperationParams` from `@kubb/ast` to build the full typed function signature (path, query, header, body params with correct types and optionality)

This means:
- `@kubb/core/hooks` / `useDriver()` is **not** needed
- `resolverTs` is **not** imported directly in the generator — it is obtained at runtime from `driver.getPlugin<PluginTs>(pluginTsName)?.resolver`
- A second `getPreset` call for `tsResolver` in `plugin.ts` is **not** needed
- `tsResolver` is **not** stored in `ResolvedOptions` — it is resolved lazily from the driver
- A `buildTypeNames` helper in `utils.ts` is **not** needed for operation plugins

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
- `src/presets.ts` -- `definePresets` registry (no `getPreset` wrapper; call `@kubb/core`'s `getPreset` directly in `plugin.ts`)
- `src/utils.ts` -- (schema plugins only) standalone schema-building helper functions; operation plugins that depend on plugin-ts do **not** need a `buildTypeNames` helper — pass `resolver: ResolverTs` directly as a component prop and use `createOperationParams` from `@kubb/ast` in the component body instead
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

Reference implementation (plugin-ts, schema plugin):
- `packages/plugin-ts/src/types.ts` -- `ResolverTs` type with methods + JSDoc, `Options` with all v5 fields, `PluginFactoryOptions` generic; `Options.group` is `UserGroup`, `ResolvedOptions.group` is `Group | undefined`
- `packages/plugin-ts/src/constants.ts` -- SCREAMING_SNAKE_CASE `Set` constants (also how to export all-values sets for test parameterization — see `ENUM_TYPES`, `OPTIONAL_TYPES`, `ARRAY_TYPES`, `ENUM_KEY_CASINGS`)
- `packages/plugin-ts/src/resolvers/resolverTs.ts` -- `defineResolver` with `default`, `resolveName`, `resolveTypedName`, etc.
- `packages/plugin-ts/src/resolvers/resolverTsLegacy.ts` -- legacy resolver extending base for `kubbV4` preset; exported from `src/index.ts` as `resolverTsLegacy`
- `packages/plugin-ts/src/presets.ts` -- `definePresets` with plain preset objects (no `definePreset` wrapper; use `@kubb/core`'s `getPreset` directly in `plugin.ts`)
- `packages/plugin-ts/src/utils.ts` -- standalone schema-building helpers: `buildParams`, `buildData`, `buildResponses`, `buildResponseUnion`
- `packages/plugin-ts/src/generators/typeGenerator.tsx` -- `defineGenerator` with `Operation` and `Schema` methods
- `packages/plugin-ts/src/generators/typeGenerator.test.tsx` -- v5 test pattern; use constants from `src/constants.ts` for `test.each` parameter arrays
- `packages/plugin-ts/src/plugin.ts` -- `walk()`, `renderOperation()`, `renderSchema()`, resolver delegation with warnings
- `packages/plugin-ts/tsdown.config.ts` -- build entry map
- `packages/plugin-ts/package.json` -- `exports` and `typesVersions`

Reference implementation (plugin-cypress, operation plugin that depends on plugin-ts):
- `packages/plugin-cypress/src/components/Request.tsx` -- component that receives `resolver: ResolverTs` directly and uses `createOperationParams` from `@kubb/ast` + `functionPrinter` from `@kubb/plugin-ts`
- `packages/plugin-cypress/src/generators/cypressGenerator.tsx` -- generator that retrieves `tsResolver` from the driver and builds the import list with `caseParams` + `resolveXxxName`
- `packages/plugin-cypress/src/generators/cypressGenerator.test.ts` -- operation plugin test pattern with `createMockedPlugin`, `createMockedPluginDriver` and a mocked `plugin-ts` entry in the driver

Schema plugins only:
- `packages/plugin-ts/src/printers/printerTs.ts` -- `definePrinter`
- `packages/plugin-zod/src/printers/printerZod.ts` -- complete schema-plugin printer example (all node types, keysToOmit, self-ref lazy getters, applyModifiers)
- `packages/plugin-zod/src/printers/printerZodMini.ts` -- functional-API printer variant (z.optional(z.string()), .check() for constraints, no coercion)
- `packages/plugin-zod/src/components/Zod.tsx` -- schema plugin component: calls printer + emits `<Const>` + optional `<Type>` for inferred export
- `packages/plugin-zod/src/generators/zodGenerator.tsx` -- Schema handler + Operation handler with buildGroupedParamsSchema + renderSchemaEntry
- `packages/plugin-zod/src/generators/zodGeneratorLegacy.tsx` -- kubbV4 generator showing legacy response grouping
- `packages/plugin-zod/src/resolvers/resolverZod.ts` -- full schema-plugin resolver with all operation-level naming methods
- `packages/plugin-zod/src/resolvers/resolverZodLegacy.ts` -- legacy resolver spread pattern
- `packages/ast/src/printers/printer.ts` -- printer factory

Test mocks:
- `configs/mocks.ts` -- `createMockedAdapter`, `createMockedPlugin`, `createMockedPluginDriver`, `matchFiles`

---

## Phase 1 -- Foundation

Goal: Create the type system, constants, resolver, presets, and build config. No dependencies on other phases.

Files to create: `src/types.ts`, `src/constants.ts`, `src/resolvers/resolverPLUGIN_PASCAL.ts`, `src/presets.ts`

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
- Use `UserGroup` for the user-facing `group` option (allows omitting `name`); use `Group | undefined` in `ResolvedOptions` (always has `name`, normalized in `plugin.ts`):

```typescript
// In Options (user-facing):
group?: UserGroup

// In ResolvedOptions (after normalization in plugin.ts):
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
 * Fully resolved group: always has a `name` function (normalized in `plugin.ts`
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

### Step 2b: Create src/printers/ (schema plugins only)

Operation plugins (plugin-cypress, plugin-client, etc.) do **not** need printers. Skip this step entirely for those.

Read `packages/plugin-zod/src/printers/printerZod.ts` as the reference. Create one printer file per output variant (e.g. `printerFoo.ts` for standard, `printerFooMini.ts` for a tree-shakeable functional API variant).

Printers are created with `definePrinter` from `@kubb/core`. The factory receives runtime options and returns an object with a `nodes` map (one handler per `SchemaNode` type) and a `print(node)` entry-point method.

```typescript
import { definePrinter } from '@kubb/core'
import type { PrinterFactoryOptions, SchemaNode } from '@kubb/core'

export type FooPrinterOptions = {
  // plugin-specific options visible to the printer
  guidType?: 'uuid' | 'guid'
  resolver?: ResolverFoo
  schemaName?: string    // used for self-ref detection inside objects
  keysToOmit?: Array<string>
}

type FooPrinterFactory = PrinterFactoryOptions<'foo', FooPrinterOptions, string, string>

export const printerFoo = definePrinter<FooPrinterFactory>((options) => {
  return {
    name: 'foo',
    options: { guidType: 'uuid', ...options },

    // One handler per SchemaNode type. Return the code string for that node.
    // `this.transform(child)` recursively processes nested nodes.
    nodes: {
      any: () => 'foo.any()',
      unknown: () => 'foo.unknown()',
      string(node) {
        return `foo.string()${lengthConstraints(node)}`
      },
      number(node) {
        return `foo.number()${numberConstraints(node)}`
      },
      object(node) {
        const props = node.properties
          .map((prop) => {
            const baseOutput = this.transform(prop.schema) ?? 'foo.unknown()'
            // Detect self-references → emit a lazy getter instead of an eager property
            const isSelfRef = this.options.schemaName != null && containsRef(prop.schema, this.options.schemaName, this.options.resolver)
            const value = applyModifiers({ value: baseOutput, ...prop.schema })
            return isSelfRef ? `get "${prop.name}"() { return ${value} }` : `"${prop.name}": ${value}`
          })
          .join(',\n    ')
        return `foo.object({\n    ${props}\n    })`
      },
      ref(node) {
        if (!node.name) return undefined
        const resolved = node.ref ? (this.options.resolver?.default(node.name, 'function') ?? node.name) : node.name
        return resolved
      },
      union(node) {
        const members = (node.members ?? []).map((m) => this.transform(m)).filter(Boolean)
        if (members.length === 0) return ''
        if (members.length === 1) return members[0]!
        return `foo.union([${members.join(', ')}])`
      },
      // ... all other types: boolean, null, integer, bigint, date, datetime, time,
      //     uuid, email, url, blob, enum, array, tuple, intersection
    },

    // Entry-point: called once per top-level schema.
    // Apply keysToOmit here (after building the base schema) rather than in nodes.object.
    print(node) {
      const base = this.transform(node)
      if (!base) return null

      if (this.options.keysToOmit?.length) {
        // When omitting keys the result is a non-nullable derived type — skip nullable/optional modifiers
        return `${base}.omit({ ${this.options.keysToOmit.map((k) => `"${k}": true`).join(', ')} })`
      }

      return applyModifiers({
        value: base,
        nullable: node.nullable,
        optional: node.optional,
        nullish: node.nullish,
        defaultValue: node.default,
        description: node.description,
      })
    },
  }
})
```

Key rules for printers:
- `this.transform(child)` dispatches to the correct `nodes.*` handler recursively — use it for all nested nodes
- Modifiers (`.nullable()`, `.optional()`, `.nullish()`, `.default()`, `.describe()`) are applied in `print()`, not inside `nodes.*`; property-level modifiers are applied inside `nodes.object` when building each property value
- `keysToOmit` is always applied at the top level in `print()`, not inside `nodes.object`, so it interacts with the fully-built object schema
- **`print()` modifier ordering**: apply `keysToOmit` (`.omit()`) FIRST, then apply nullable/optional/nullish modifiers on the result; skip `.omit()` entirely for discriminated union schemas (e.g. `node.type === 'union' && node.discriminatorPropertyName`) since Zod's `z.discriminatedUnion` does not support `.omit()`
- Self-referencing properties inside objects must use lazy getter syntax (`get "key"() { return ... }`) to avoid circular evaluation; detect them with a `containsRef()` helper that walks the property's `SchemaNode`
- `additionalProperties` on objects → `.catchall(type)` (or `.catchall(z.unknown())` when `additionalProperties === true`); `additionalProperties === false` → `.strict()`
- Intersection handling: try to extract numeric/string/array constraints via `narrowSchema()` from `@kubb/ast` and chain them directly instead of emitting a full `.and()`; fall back to `.and()` for structural members
- **`syncSchemaRef(schema)`** from `@kubb/ast` — use this inside `nodes.object` (per-property) and `print()` to read nullable/optional/readOnly/default metadata; for `ref` nodes the metadata lives on `schema.schema` not on the top-level node, and `syncSchemaRef` resolves that transparently
- **`extractRefName(node.ref)`** from `@kubb/ast` — use this instead of `node.ref.split('/').at(-1)` to parse the last segment of a `$ref` string; handles edge cases in ref paths
- **`ipv4` / `ipv6` node types** must be handled explicitly; map them to the appropriate string/IP type in the target library (e.g. `z.ipv4()`, `z.ipv6()` in Zod v4; `factory.keywordTypeNodes.string` in TypeScript)
- **Unique arrays**: check `node.unique` on array nodes and append a `.refine(items => new Set(items).size === items.length, { message: "Array entries must be unique" })` constraint
- **Discriminated unions**: when `node.discriminatorPropertyName` is set on a `union` node, emit `z.discriminatedUnion(discriminatorPropertyName, [...])` instead of `z.union([...])`, unless any member is an `intersection` type (which is not compatible with `z.discriminatedUnion`'s `$ZodDiscriminant` constraint) — fall back to `z.union` in that case
- **`buildPropertyJSDocComments`** is a shared utility that belongs in `utils.ts` (not inlined in the printer) so it can be reused by both the printer and the generator's `Type` component

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

For **schema plugins**, the resolver must also implement all operation-level naming helpers. Model it on `packages/plugin-zod/src/resolvers/resolverZod.ts`:

```typescript
import { camelCase, pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginFoo } from '../types.ts'

function resolveName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string {
  return camelCase(name, { suffix: type ? 'schema' : undefined, isFile: type === 'file' })
}

export const resolverFoo = defineResolver<PluginFoo>(() => ({
  name: 'default',
  pluginName: 'plugin-foo',

  default(name, type) { return resolveName(name, type) },
  resolveName(name) { return this.default(name, 'function') },
  resolveInferName(name) { return pascalCase(name) },   // 'fooSchema' → 'FooSchema'
  resolvePathName(name, type) { return this.default(name, type) },

  // Operation-level naming — called from the generator's Operation handler:
  resolveParamName(node, param) {
    return this.resolveName(`${node.operationId} ${param.in} ${param.name}`)
  },
  resolveResponseStatusName(node, statusCode) {
    return this.resolveName(`${node.operationId} Status ${statusCode}`)
    // e.g. 'listPets Status 200' → 'listPetsStatus200Schema'
  },
  resolveDataName(node) {
    return this.resolveName(`${node.operationId} Data`)
    // e.g. 'createPet Data' → 'createPetDataSchema'
  },
  resolveResponsesName(node) {
    return this.resolveName(`${node.operationId} Responses`)
    // e.g. 'listPets Responses' → 'listPetsResponsesSchema'
  },
  resolveResponseName(node) {
    return this.resolveName(`${node.operationId} Response`)
    // e.g. 'listPets Response' → 'listPetsResponseSchema'
  },
  resolvePathParamsName(node, _param) {
    return this.resolveName(`${node.operationId} PathParams`)
    // e.g. 'listPets PathParams' → 'listPetsPathParamsSchema'
  },
  resolveQueryParamsName(node, _param) {
    return this.resolveName(`${node.operationId} QueryParams`)
  },
  resolveHeaderParamsName(node, _param) {
    return this.resolveName(`${node.operationId} HeaderParams`)
  },
}))
```

For a `kubbV4` legacy resolver, spread the default resolver and override only the methods that changed naming conventions (e.g. use `MutationRequest`/`QueryRequest` for `resolveDataName`, `<statusCode>` instead of `Status<statusCode>` for `resolveResponseStatusName`, `Error` for `statusCode === 'default'`):

```typescript
export const resolverFooLegacy = defineResolver<PluginFoo>(() => ({
  ...resolverFoo,
  pluginName: 'plugin-foo',
  resolveResponseStatusName(node, statusCode) {
    if (statusCode === 'default') return this.resolveName(`${node.operationId} Error`)
    return this.resolveName(`${node.operationId} ${statusCode}`)
  },
  resolveDataName(node) {
    const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
    return this.resolveName(`${node.operationId} ${suffix}`)
  },
  resolveResponsesName(node) {
    const suffix = node.method === 'GET' ? 'Query' : 'Mutation'
    return this.resolveName(`${node.operationId} ${suffix}`)
  },
  resolveResponseName(node) {
    const suffix = node.method === 'GET' ? 'QueryResponse' : 'MutationResponse'
    return this.resolveName(`${node.operationId} ${suffix}`)
  },
}))
```

### Step 4: Create src/presets.ts

Read `packages/plugin-ts/src/presets.ts` first.

The presets file only exports a `presets` registry — **no `getPreset` wrapper**. Use `getPreset` from `@kubb/core` directly in `plugin.ts`. Each entry is a plain object `{ name, resolvers, generators? }` passed directly to `definePresets` — there is no `definePreset` helper.

For operation plugins both presets can share the same resolver and generator (naming conventions are the same):

```typescript
import { definePresets } from '@kubb/core'
import { cypressGenerator } from './generators/index.ts'
import { resolverCypress } from './resolvers/resolverCypress.ts'
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

For **schema plugins** that have a `kubbV4` compatibility preset, wire the legacy resolver and legacy generator into the `kubbV4` entry (model on `packages/plugin-zod/src/presets.ts`):

```typescript
import { definePresets } from '@kubb/core'
import { fooGenerator } from './generators/fooGenerator.tsx'
import { fooGeneratorLegacy } from './generators/fooGeneratorLegacy.tsx'
import { resolverFoo } from './resolvers/resolverFoo.ts'
import { resolverFooLegacy } from './resolvers/resolverFooLegacy.ts'
import type { ResolverFoo } from './types.ts'

export const presets = definePresets<ResolverFoo>({
  default: {
    name: 'default',
    resolvers: [resolverFoo],
    generators: [fooGenerator],
  },
  kubbV4: {
    name: 'kubbV4',
    resolvers: [resolverFooLegacy],
    generators: [fooGeneratorLegacy],
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

Read `packages/plugin-cypress/src/components/Request.tsx` as the reference for the v5 component pattern.

For each component file, make these changes:

Remove these imports:
- `HttpMethod`, `isAllOptional`, `isOptional` from `@kubb/oas`
- `OperationSchemas` from `@kubb/plugin-oas`
- `getPathParams` from `@kubb/plugin-oas/utils`

Add or keep these imports:
- `caseParams`, `createOperationParams`, `createFunctionParameter`, `createTypeNode` from `@kubb/ast`
- `OperationNode` from `@kubb/ast/types`
- `ResolverTs`, `functionPrinter` from `@kubb/plugin-ts` (for printing function-parameter signatures)
- `URLPath`, `camelCase` from `@internals/utils` (still needed for URL template generation and path-param key normalization)

Change the Props type:
- Replace `typeSchemas: OperationSchemas` with `resolver: ResolverTs` — the component resolves type names itself via `resolver.resolveXxxName(node)`
- Replace `url: string` and `method: HttpMethod` with `node: OperationNode` — get `node.path` and `node.method` directly
- Keep plugin-specific props like `dataReturnType`, `paramsCasing`, `paramsType`, `pathParamsType`, etc.

Change the implementation:

**Function signature** — use `createOperationParams` from `@kubb/ast` to build the typed parameter node, then print it with `functionPrinter`:

```typescript
const declarationPrinter = functionPrinter({ mode: 'declaration' })

function getParams({ paramsType, pathParamsType, paramsCasing, resolver, node }) {
  const paramsNode = createOperationParams(node, {
    paramsType,
    pathParamsType,
    paramsCasing,
    resolver,
    extraParams: [
      createFunctionParameter({ name: 'options', type: createTypeNode({ variant: 'reference', name: 'Partial<Cypress.RequestOptions>' }), default: '{}' }),
    ],
  })
  return declarationPrinter.print(paramsNode) ?? ''
}
```

`createOperationParams` automatically handles path-param typing, query-param grouping, request body optionality, and the resolver's `resolveXxxName` methods — no manual TypeNames construction needed.

**Response type** — call `resolver.resolveResponseName(node)` directly:
```typescript
const responseType = resolver.resolveResponseName(node)
```

**URL template** — use `URLPath` from `@internals/utils` with the `paramsCasing` option:
```typescript
const urlPath = new URLPath(node.path, { casing: paramsCasing })
const urlTemplate = urlPath.toTemplateString({ prefix: baseURL, replacer: ... })
```

**Query / header params with renamed keys** — when `paramsCasing` renames params (e.g. `page_size` → `pageSize`), remap keys back to original API names:
```typescript
const casedQueryParams = caseParams(queryParams, paramsCasing)
const needsQsTransform = casedQueryParams.some((p, i) => p.name !== queryParams[i].name)
if (needsQsTransform) {
  const pairs = queryParams.map((orig, i) => `${orig.name}: params.${casedQueryParams[i].name}`).join(', ')
  requestOptions.push(`qs: params ? { ${pairs} } : undefined`)
} else {
  requestOptions.push('qs: params')
}
```

Apply the same remapping pattern for header params.

- Use `node.method` for the HTTP method string (it is already uppercase in `OperationNode`)
- Add JSDoc to the `Props` type and any helper functions

**Schema plugin components** (e.g. `Zod.tsx`, `Type.tsx`) are simpler — they wrap a printer and emit `<Const>` / `<Type>` blocks. Model on `packages/plugin-zod/src/components/Zod.tsx`:

```tsx
import { Const, File, Type } from '@kubb/react-fabric'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { SchemaNode } from '@kubb/ast/types'
import { printerFoo } from '../printers/printerFoo.ts'
import type { ResolverFoo } from '../types.ts'

type Props = {
  name: string            // export const name
  node: SchemaNode        // pre-transformed AST node
  description?: string    // JSDoc @description comment
  inferTypeName?: string  // optional: emit `type X = z.infer<typeof name>`
  resolver?: ResolverFoo
  keysToOmit?: Array<string>
  // ... any printer-specific options (coercion, guidType, wrapOutput, etc.)
}

export function FooComponent({ name, node, description, inferTypeName, resolver, keysToOmit, ...rest }: Props): FabricReactNode {
  const printer = printerFoo({ resolver, schemaName: name, keysToOmit, ...rest })
  const output = printer.print(node)

  if (!output) return

  return (
    <>
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name} JSDoc={{ comments: [description ? `@description ${description}` : undefined].filter(Boolean) }}>
          {output}
        </Const>
      </File.Source>
      {inferTypeName && (
        <File.Source name={inferTypeName} isExportable isIndexable isTypeOnly>
          <Type export name={inferTypeName}>
            {`z.infer<typeof ${name}>`}
          </Type>
        </File.Source>
      )}
    </>
  )
}
```

Key rules for schema plugin components:
- `<File.Source>` with `isExportable isIndexable` marks the node for barrel-file collection; add `isTypeOnly` for type-only exports
- Create a separate component (`FooMiniComponent`) if the plugin has a functional-API printer variant — identical props minus coercion, different printer
- The component receives an already-transformed `SchemaNode` (transformation happens in the generator, before the component)

### Step 2: Rewrite generators

Read `packages/plugin-ts/src/generators/typeGenerator.tsx` first.

Remove these imports:
- `createReactGenerator` from `@kubb/plugin-oas/generators`
- `useOas`, `useOperationManager` from `@kubb/plugin-oas/hooks`
- `getBanner`, `getFooter` from `@kubb/plugin-oas/utils`

Add these imports:
- `defineGenerator`, `getMode` from `@kubb/core`

**For plugins that import types from plugin-ts** (e.g. `plugin-cypress`):
- Do **not** import `useDriver`, `resolverTs`, or anything from `@kubb/plugin-ts/resolvers` statically in the generator
- Retrieve the TypeScript resolver at render time: `const tsResolver = driver.getPlugin<PluginTs>(pluginTsName)?.resolver`
- Build the list of type names to import using `caseParams` from `@kubb/ast` and the resolver's `resolveXxxName` methods directly — no separate `buildTypeNames` utility needed
- Pass `resolver: tsResolver` directly to the component — the component uses `createOperationParams` from `@kubb/ast` to build typed function signatures

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
  Operation({ node, adapter, options, config, driver, resolver }) {
    const { output, baseURL, dataReturnType, paramsCasing, paramsType, pathParamsType, group } = options
    const root = path.resolve(config.root, config.output.path)

    const pluginTs = driver.getPlugin<PluginTs>(pluginTsName)

    if (!pluginTs) {
      return null
    }

    const file = resolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root, output, group },
    )

    // Resolve the plugin-ts output path so we can emit the type import
    const tsFile = pluginTs.resolver.resolveFile(
      { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
      { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
    )

    const name = resolver.resolveName(node.operationId)

    // Compute the list of type names to import from the plugin-ts output file.
    // Use caseParams + tsResolver.resolveXxxName instead of a buildTypeNames helper.
    const tsResolver = pluginTs.resolver
    const casedParams = caseParams(node.parameters, paramsCasing)
    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      ...(pathParams.length && tsResolver.resolvePathParamsName
        ? pathParams.map((p) => tsResolver.resolvePathParamsName!(node, p))
        : pathParams.map((p) => tsResolver.resolveParamName(node, p))),
      ...(queryParams.length && tsResolver.resolveQueryParamsName
        ? queryParams.map((p) => tsResolver.resolveQueryParamsName!(node, p))
        : queryParams.map((p) => tsResolver.resolveParamName(node, p))),
      ...(headerParams.length && tsResolver.resolveHeaderParamsName
        ? headerParams.map((p) => tsResolver.resolveHeaderParamsName!(node, p))
        : headerParams.map((p) => tsResolver.resolveParamName(node, p))),
      node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined,
      tsResolver.resolveResponseName(node),
    ].filter(Boolean)

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
        footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
      >
        {tsFile && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={file.path} path={tsFile.path} isTypeOnly />
        )}
        {/* Pass resolver directly — the component uses createOperationParams internally */}
        <Request
          name={name}
          node={node}
          resolver={tsResolver}
          dataReturnType={dataReturnType}
          paramsCasing={paramsCasing}
          paramsType={paramsType}
          pathParamsType={pathParamsType}
          baseURL={baseURL}
        />
      </File>
    )
  },
})
```

Key differences:
- `defineGenerator` instead of `createReactGenerator`
- Must include `type: 'react'` in the definition
- Props are `{ node, adapter, options, config, driver, resolver }` not `{ operation, generator, plugin }`
- No OAS hooks — all data comes from `options`, `node`, and `driver`
- `resolver.resolveFile()` replaces `getFile()`
- `resolver.resolveName()` replaces `getName()`
- `resolver.resolveBanner()` / `resolver.resolveFooter()` replaces `getBanner()` / `getFooter()`
- For type names: call `driver.getPlugin(pluginTsName)?.resolver` at render time — no `options.tsResolver`, no second `getPreset` call in `plugin.ts`, no `buildTypeNames` helper needed
- Use `pluginTs.resolver.resolveFile()` (not `resolver.resolveFile()`) to get the plugin-ts output file path
- Build the import list with `caseParams(node.parameters, paramsCasing)` + filter by `.in` + `tsResolver.resolveXxxName()`; use optional-chaining guards for resolver methods like `resolvePathParamsName?` that may not exist on all presets
- Pass `resolver: tsResolver` directly to the component — the component calls `createOperationParams` from `@kubb/ast` to produce typed function signatures, printed by `functionPrinter` from `@kubb/plugin-ts`

**Schema plugins** implement both `Schema` and `Operation` handlers. Model both on `packages/plugin-zod/src/generators/zodGenerator.tsx`.

**Schema handler** (schema plugins only):

```typescript
Schema({ node, adapter, options, config, resolver }) {
  const { output, group, mini, inferred, importPath, transformers = [] } = options

  const root = path.resolve(config.root, config.output.path)
  const mode = getMode(path.resolve(root, output.path))

  // 1. Apply user transformers before printing
  const transformedNode = transform(node, composeTransformers(...transformers))

  if (!transformedNode.name) return

  // 2. Use `meta` as const for name + file — keeps them co-located and type-safe
  const meta = {
    name: resolver.default(transformedNode.name, 'function'),
    file: resolver.resolveFile({ name: transformedNode.name, extname: '.ts' }, { root, output, group }),
  } as const

  // 3. Resolve $ref imports — adapter provides the list of referenced schema names
  const imports = adapter.getImports(transformedNode, (refName) => ({
    name: resolver.default(refName, 'function'),
    path: resolver.resolveFile({ name: refName, extname: '.ts' }, { root, output, group }).path,
  }))

  const inferTypeName = inferred ? resolver.resolveInferName(meta.name) : undefined
  const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

  return (
    <File
      baseName={meta.file.baseName}
      path={meta.file.path}
      meta={meta.file.meta}
      banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
      footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
    >
      {/* Namespace or named import — determined by a constants Set */}
      <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />
      {/* Split mode only: emit import for each $ref dependency */}
      {mode === 'split' && imports.map((imp) => (
        <File.Import key={[transformedNode.name, imp.path].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
      ))}
      {mini ? (
        <FooMiniComponent name={meta.name} node={transformedNode} inferTypeName={inferTypeName} resolver={resolver} />
      ) : (
        <FooComponent name={meta.name} node={transformedNode} inferTypeName={inferTypeName} resolver={resolver} />
      )}
    </File>
  )
},
```

Key rules for the Schema handler:
- Always call `transform(node, composeTransformers(...transformers))` before passing the node to the component — this applies any user-supplied AST transformers
- Guard on `transformedNode.name` (not `node.name`) — the transformer may rename the node
- Use `const meta = { name, file } as const` to co-locate the resolved name and file (pattern from `typeGenerator` and `zodGenerator`)
- `adapter.getImports(transformedNode, cb)` walks the transformed node and collects all `$ref` dependencies; the callback maps each referenced schema name to its generated file path
- Only emit `$ref` imports when `mode === 'split'` (one file per schema); in `export` mode all schemas are in one file and imports are not needed
- `resolver.resolveInferName(meta.name)` gives the PascalCase type-alias name for `z.infer<typeof schemaName>` exports when `inferred: true`
- **plugin-ts**: The `Schema` handler follows the same pattern. For enum schemas, apply the `enumTypeSuffix` naming via `resolver.resolveEnumKeyName()` and collect the full set of enum schema names (via `adapter.rootNode?.schemas`) so that `$ref` imports for enum types use the suffixed name

**Operation handler** for schema plugins — uses internal `buildGroupedParamsSchema` + `renderSchemaEntry` helpers:

```typescript
Operation({ node, adapter, options, config, resolver }) {
  const { output, group, mini, inferred, importPath, paramsCasing, coercion, guidType, wrapOutput, transformers = [] } = options

  // Apply transformers to the OperationNode at the top level — do NOT apply them
  // inside renderSchemaEntry; each schema entry should receive the already-cased params.
  const transformedNode = transform(node, composeTransformers(...transformers))

  const root = path.resolve(config.root, config.output.path)
  const mode = getMode(path.resolve(root, output.path))

  const meta = {
    file: resolver.resolveFile(
      { name: transformedNode.operationId, extname: '.ts', tag: transformedNode.tags[0] ?? 'default', path: transformedNode.path },
      { root, output, group },
    ),
  } as const

  const isZodImport = ZOD_NAMESPACE_IMPORTS.has(importPath as 'zod' | 'zod/mini')

  // Apply paramsCasing before grouping
  const params = caseParams(transformedNode.parameters, paramsCasing)
  const pathParams  = params.filter((p) => p.in === 'path')
  const queryParams = params.filter((p) => p.in === 'query')
  const headerParams = params.filter((p) => p.in === 'header')

  // Build a SchemaNode object from a group of ParameterNodes
  function buildGroupedParamsSchema({ params, optional }: { params: Array<ParameterNode>; optional?: boolean }): SchemaNode {
    return createSchema({
      type: 'object',
      optional,
      primitive: 'object',
      properties: params.map((p) => createProperty({ name: p.name, required: p.required, schema: p.schema })),
    })
  }

  // Renders a single named schema entry (imports + component).
  // `schema` is already transformed — do not re-transform inside this helper.
  function renderSchemaEntry({ schema, name, keysToOmit }: {
    schema: SchemaNode | null | undefined
    name: string
    keysToOmit?: Array<string>
  }) {
    if (!schema) return null

    const inferTypeName = inferred ? resolver.resolveInferName(name) : undefined
    const imports = adapter.getImports(schema, (refName) => ({
      name: resolver.default(refName, 'function'),
      path: resolver.resolveFile({ name: refName, extname: '.ts' }, { root, output, group }).path,
    }))

    return (
      <>
        {mode === 'split' && imports.map((imp) => (
          <File.Import key={[name, imp.path, imp.name].join('-')} root={meta.file.path} path={imp.path} name={imp.name} />
        ))}
        {mini ? (
          <FooMiniComponent name={name} node={schema} inferTypeName={inferTypeName} resolver={resolver} keysToOmit={keysToOmit} />
        ) : (
          <FooComponent name={name} node={schema} coercion={coercion} guidType={guidType} wrapOutput={wrapOutput}
            inferTypeName={inferTypeName} resolver={resolver} keysToOmit={keysToOmit} />
        )}
      </>
    )
  }

  // optional: all query/header params are optional when none are required
  const allQueryOptional = queryParams.every((p) => !p.required)
  const allHeaderOptional = headerParams.every((p) => !p.required)

  return (
    <File baseName={meta.file.baseName} path={meta.file.path} meta={meta.file.meta}
      banner={resolver.resolveBanner(adapter.rootNode, { output, config })}
      footer={resolver.resolveFooter(adapter.rootNode, { output, config })}
    >
      <File.Import name={isZodImport ? 'z' : ['z']} path={importPath} isNameSpace={isZodImport} />

      {pathParams.length > 0 && renderSchemaEntry({
        schema: buildGroupedParamsSchema({ params: pathParams }),
        name: resolver.resolvePathParamsName(transformedNode, pathParams[0]!),
      })}
      {queryParams.length > 0 && renderSchemaEntry({
        schema: buildGroupedParamsSchema({ params: queryParams, optional: allQueryOptional }),
        name: resolver.resolveQueryParamsName(transformedNode, queryParams[0]!),
      })}
      {headerParams.length > 0 && renderSchemaEntry({
        schema: buildGroupedParamsSchema({ params: headerParams, optional: allHeaderOptional }),
        name: resolver.resolveHeaderParamsName(transformedNode, headerParams[0]!),
      })}

      {transformedNode.responses.map((res) => renderSchemaEntry({
        schema: res.schema,
        name: resolver.resolveResponseStatusName(transformedNode, res.statusCode),
        keysToOmit: res.keysToOmit,   // keysToOmit from OperationNode flows through to printer
      }))}

      {transformedNode.requestBody?.schema && renderSchemaEntry({
        schema: {
          ...transformedNode.requestBody.schema,
          description: transformedNode.requestBody.description ?? transformedNode.requestBody.schema.description,
        },
        name: resolver.resolveDataName(transformedNode),
        keysToOmit: transformedNode.requestBody.keysToOmit,
      })}
    </File>
  )
},
```

Key rules for the Operation handler (schema plugins):
- Apply `transform(node, composeTransformers(...transformers))` to the `OperationNode` at the TOP of `Operation` (not inside `renderSchemaEntry`) — the result is `transformedNode`; pass `transformedNode` to all resolver calls and schema access
- `buildGroupedParamsSchema` is a local helper — **not** in a `utils.ts` file; keep it inside the generator file; set `primitive: 'object'` alongside `type: 'object'` so downstream consumers can distinguish object schemas
- `renderSchemaEntry` takes a `schema` param (not `node`) — the description is NOT passed as a separate prop; instead merge it into the schema inline: `{ ...res.schema, description: res.description ?? res.schema.description }`
- Use `const meta = { file: resolver.resolveFile(...) } as const` for the operation file (same `meta` pattern as the Schema handler)
- `optional` on the grouped object schema is `true` only when all params in that group are optional (so the entire params object can be omitted); path params are never optional
- `keysToOmit` comes from `res.keysToOmit` / `transformedNode.requestBody.keysToOmit` on the `OperationNode` — pass it through to the component, which passes it to the printer; the printer applies `.omit({...})` to the output
- Each response status code gets its own named schema via `resolver.resolveResponseStatusName(transformedNode, statusCode)` — do not merge responses into a union in the Operation handler

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
- `runGeneratorSchema`, `runGeneratorOperation`, `runGeneratorOperations`, `getPreset` from `@kubb/core`
- `presets` from `./presets.ts`
- the plugin's default resolver (e.g. `resolverCypress`) from `./resolvers/resolverPLUGIN_PASCAL.ts`

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

Use **getter syntax** for `resolver` and `options` so values always reflect the latest preset state. The `options` getter is also where `group` is normalized from the user-supplied `UserGroup` (which may omit `name`) into the resolved `Group` (which always has `name`):

```typescript
return {
  name: pluginCypressName,
  get resolver() {
    return preset.resolver
  },
  get options() {
    return {
      output,
      // Normalize UserGroup → Group: inject a default name function if the user
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

`install()`: Replace `OperationGenerator` with `walk` + the `runGenerator*` helpers:

```typescript
async install() {
  const { config, fabric, plugin, adapter, rootNode, driver } = this
  const root = path.resolve(config.root, config.output.path)
  const resolver = preset.resolver

  if (!adapter) {
    throw new Error('Plugin cannot work without adapter being set')
  }

  const collectedOperations: Array<OperationNode> = []
  const generatorContext = { generators: preset.generators, plugin, resolver, exclude, include, override, fabric, adapter, config, driver }

  await walk(rootNode, {
    depth: 'shallow',
    async schema(schemaNode) {
      // Schema plugins only — operation-only plugins can omit this callback.
      await runGeneratorSchema(schemaNode, generatorContext)
    },
    async operation(operationNode) {
      const baseOptions = resolver.resolveOptions(operationNode, { options: plugin.options, exclude, include, override })

      if (baseOptions !== null) {
        collectedOperations.push(operationNode)
      }

      await runGeneratorOperation(operationNode, generatorContext)
    },
  })

  await runGeneratorOperations(collectedOperations, generatorContext)

  const barrelFiles = await getBarrelFiles(this.fabric.files, {
    type: output.barrelType ?? 'named',
    root,
    output,
    meta: { pluginName: this.plugin.name },
  })

  await this.upsertFile(...barrelFiles)
},
```

The three helpers from `@kubb/core` handle option resolution, null-filtering, and react/core generator dispatch internally — no manual `if (generator.type === 'react')` / `if (generator.type === 'core')` blocks are needed. Operation-only plugins (e.g. `plugin-cypress`) can omit the `schema` callback entirely.

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
- No `constants.ts` needed (no option values share branching behavior); schema plugins do need one
- Generator: `cypressGenerator` with `Operation` only (no `Schema`)
- Plugin walks `operation` nodes only
- Component: `Request.tsx` receives `resolver: ResolverTs` directly; uses `createOperationParams` from `@kubb/ast` for typed function signatures and `functionPrinter({ mode: 'declaration' })` from `@kubb/plugin-ts` to print them
- Type names for imports: call `caseParams(node.parameters, paramsCasing)` → filter by `.in` → call `tsResolver.resolveXxxName(node, param)` for each group; no `buildTypeNames` helper needed
- Cross-plugin file path: call `pluginTs.resolver.resolveFile(...)` (use `pluginTs.resolver`, not `pluginTs.resolvers`)
- Remove deps: `@kubb/oas`, `@kubb/plugin-oas`
- Add deps: `@kubb/ast`
- Keep deps: `@kubb/core`, `@kubb/plugin-ts`, `@kubb/react-fabric`
- Vitest config: add `tsconfigPaths()` from `vite-tsconfig-paths` so monorepo path aliases resolve correctly in tests

### plugin-client (operation plugin)

- Multiple generators: `clientGenerator`, `classClientGenerator`, `staticClassClientGenerator`, `groupedClientGenerator`, `operationsGenerator`
- Template source files (`templates/`) and bundled clients (`clients/`) stay unchanged
- Group name defaults to `Controller` suffix

### plugin-react-query (operation plugin)

- Multiple generators for queries, mutations, suspense, infinite queries
- Depends on `plugin-ts` for types and optionally `plugin-client` for client functions

### plugin-ts (schema plugin — completed)

Migrated to v5 architecture. Key specifics:
- Generators (`typeGenerator.tsx`, `typeGeneratorLegacy.tsx`) now implement **both** `Schema` and `Operation` handlers; the `Schema` handler mirrors the zodGenerator pattern but handles enum naming via `resolver.resolveEnumKeyName()` and uses TypeScript-specific `Type` component
- Generators apply `transform(node, composeTransformers(...transformers))` at the top of **both** handlers; for `Operation`, `caseParams` is applied to the `transformedNode.parameters`
- `renderSchemaType` helper renamed parameter from `node` to `schema`; description is no longer passed as a separate prop but merged inline: `{ ...res.schema, description: res.description ?? res.schema.description }`
- `meta = { file: resolver.resolveFile(...) } as const` pattern used in both generators
- `printerTs.ts` updated: uses `syncSchemaRef(schema)` from `@kubb/ast` for nullable/optional/readOnly metadata (handles `ref` nodes where metadata lives on `schema.schema`); `extractRefName(node.ref)` replaces `.split('/').at(-1)`; added `ipv4`/`ipv6` node handlers → `factory.keywordTypeNodes.string`; `buildPropertyJSDocComments` moved to `utils.ts`
- `print()` method fix: applies nullable/optional AFTER `Omit` wrapping so modifiers are not swallowed; named type declarations always emit `| undefined` for optional/nullish regardless of `optionalType` (the `?` questionToken only applies to object properties, not top-level type aliases)
- `typeGeneratorLegacy.tsx`: uses `createSchema({ type: 'any', primitive: undefined })` for empty response/error fallback schemas (avoids conflicting with the default `primitive` inference)

### plugin-zod, plugin-faker (schema plugins)

- Walk both `schema` and `operation` nodes
- Do **not** create `src/utils.ts` — schema-building helpers (e.g. `buildGroupedParamsSchema`) live inside the generator file itself
- Do **not** carry over `parser.ts` — it is replaced by printers (`src/printers/`)
- Need `definePrinter` in `src/printers/` for converting `SchemaNode` to code strings
- Model printers on `packages/plugin-zod/src/printers/printerZod.ts` (and `printerZodMini.ts` for a secondary functional-API variant)
- Schema plugins need **both** a `Schema` and an `Operation` handler in the generator (see plugin-zod examples below)

#### plugin-zod (completed)

Migrated to v5 architecture:
- Created `src/types.ts` — `ResolverZod` extends `Resolver & OperationParamsResolver`, updated `Options` with `compatibilityPreset`, `resolvers: Array<ResolverZod>`, `transformers: Array<Visitor>`; removed `version` (dropped Zod v3 support), removed `contentType` (moved to adapter)
- Created `src/constants.ts` — `ZOD_NAMESPACE_IMPORTS = new Set(['zod', 'zod/mini'])` for namespace vs named import detection
- Created `src/resolvers/resolverZod.ts` — default resolver using `defineResolver` with camelCase+`Schema` suffix naming; all operation-level naming methods implemented
- Created `src/resolvers/resolverZodLegacy.ts` — `kubbV4`-compat resolver that spreads `resolverZod` and overrides status-code, request-body, and response-union naming to match Kubb v4 conventions
- Created `src/presets.ts` — Preset registry: `default` → `resolverZod` + `zodGenerator`; `kubbV4` → `resolverZodLegacy` + `zodGeneratorLegacy`
- Created `src/printers/printerZod.ts` — standard Zod v4 chainable-API printer (`z.string().optional()`) supporting all schema types including `ipv4`/`ipv6` (`z.ipv4()`, `z.ipv6()`), coercion, `wrapOutput`, `keysToOmit`, self-referencing lazy getters, `additionalProperties` as `.catchall()`/`.strict()`, discriminated unions (`z.discriminatedUnion`) with intersection fallback, unique array `.refine()`, `syncSchemaRef()` for metadata and `extractRefName()` for ref parsing
- Created `src/printers/printerZodMini.ts` — Zod v4 Mini functional-API printer (`z.optional(z.string())`) for better tree-shaking; uses `.check(z.minLength(...))` for constraints instead of chainable methods; no coercion support; same `syncSchemaRef`/`extractRefName` patterns
- Rewrote `src/generators/zodGenerator.tsx` — `defineGenerator` with `Schema` handler (applies transformers to `SchemaNode`, uses `meta = { name, file } as const`, resolves imports via `adapter.getImports()`, renders `<Zod|ZodMini>`) and `Operation` handler (applies transformers to `OperationNode` once at top level, groups params by location, builds `SchemaNode` objects via `createSchema/createProperty` with `primitive: 'object'`, description merged inline into schema, renders per-parameter-group + per-response + request body)
- Rewrote `src/generators/zodGeneratorLegacy.tsx` — `kubbV4` generator that groups all responses into a legacy `{ Response, Errors, QueryParams, PathParams, HeaderParams }` schema and emits response-union + all-responses schemas; uses `createSchema({ type: 'any', primitive: undefined })` for empty response fallbacks
- Rewrote `src/plugin.ts` — Uses `walk` + `runGeneratorSchema`, `runGeneratorOperation`, `runGeneratorOperations` from `@kubb/core`; `getPreset` for preset resolution
- Updated `package.json` — Replaced `@kubb/plugin-oas`/`@kubb/oas`/`@kubb/plugin-ts` deps with `@kubb/ast` and `@kubb/core`
- Updated `vitest.config.ts` — Added `tsconfigPaths()` for workspace alias resolution in tests
- Updated `tsdown.config.ts` — Simplified to single `index` entry
