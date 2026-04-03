---
layout: doc

title: Kubb Migration Guide - Upgrade to Latest Version
description: Migrate to the latest Kubb version. Breaking changes, upgrade steps, and migration guides for major version updates.
outline: deep
---

# Migrating to Kubb v5

## Breaking Changes

### Node.js 22 required

Kubb v5 requires **Node.js 22** or later.

### Factory functions renamed: `define*` → `create*`

`defineConfig` is unchanged. All other factory functions now use the `create*` prefix.

::: code-group
```typescript [Before]
import { definePlugin, defineAdapter, defineLogger, defineGenerator, defineStorage } from '@kubb/core'

export const myPlugin = definePlugin((options) => ({ /* ... */ }))
export const myAdapter = defineAdapter((options) => ({ /* ... */ }))
export const myLogger = defineLogger({ name: 'my-logger', install() { /* ... */ } })
export const myGenerator = defineGenerator({ /* ... */ })
export const myStorage = defineStorage((options) => ({ /* ... */ }))
```

```typescript [After]
import { createPlugin, createAdapter, createLogger, createGenerator, createStorage } from '@kubb/core'

export const myPlugin = createPlugin((options) => ({ /* ... */ }))
export const myAdapter = createAdapter((options) => ({ /* ... */ }))
export const myLogger = createLogger({ name: 'my-logger', install() { /* ... */ } })
export const myGenerator = createGenerator({ /* ... */ })
export const myStorage = createStorage((options) => ({ /* ... */ }))
```
:::

### Each plugin can only be used once

Adding the same plugin twice will throw an error.

```typescript
// ❌ No longer allowed
export default defineConfig({
  plugins: [pluginTs({}), pluginTs({})],
})

// ✅ Use a single instance
export default defineConfig({
  plugins: [pluginTs({})],
})
```

### `PluginManager` renamed to `PluginDriver`

Affects custom plugin and generator authors.

::: code-group
```typescript [Before]
import { PluginManager } from '@kubb/core'
import { usePluginManager } from '@kubb/core/hooks'

// In a generator or plugin context:
meta.pluginManager
```

```typescript [After]
import { PluginDriver } from '@kubb/core'
import { usePluginDriver } from '@kubb/core/hooks'

// In a generator or plugin context:
meta.driver
```
:::

### Object and JSON plugin formats removed

Only the array-of-plugin-instances format is supported.

::: code-group
```typescript [Before (object style)]
export default defineConfig({
  plugins: { '@kubb/plugin-ts': {} },
})
```

```typescript [Before (array tuple)]
export default defineConfig({
  plugins: [['@kubb/plugin-ts', {}]],
})
```

```typescript [After]
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [pluginTs({})],
})
```
:::

### `mapper` replaced by `transformers` in `@kubb/plugin-ts`

The `mapper` option (`Record<string, ts.PropertySignature>`) has been removed. Use the new `transformers` array to modify AST nodes before they are printed to TypeScript. Transformers are more powerful — they can modify, replace, or remove any schema or property node, not just override individual property signatures.

::: code-group
```typescript [Before (v4) — mapper]
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import ts from 'typescript'

const factory = ts.factory

export default defineConfig({
  plugins: [
    pluginTs({
      mapper: {
        // Override the 'category' property to always be a string
        category: factory.createPropertySignature(
          undefined,
          factory.createIdentifier('category'),
          factory.createToken(ts.SyntaxKind.QuestionToken),
          factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ),
      },
    }),
  ],
})
```

```typescript [After (v5) — transformers]
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    pluginTs({
      transformers: [
        {
          // Override the 'category' property to use a string schema and make it optional
          property(node) {
            if (node.name === 'category') {
              return {
                ...node,
                required: false,
                schema: { ...node.schema, kind: 'Schema', type: 'string' },
              }
            }
          },
        },
      ],
    }),
  ],
})
```
:::

Transformers operate on `@kubb/ast` nodes (`SchemaNode`, `PropertyNode`, `OperationNode`, etc.) instead of raw TypeScript AST nodes. This removes the `typescript` peer dependency and makes transformations portable across output formats.

Common migration patterns:

```typescript
pluginTs({
  transformers: [
    {
      // Remove a property entirely (return undefined to skip it)
      property(node) {
        if (node.name === 'internalId') {
          return { ...node, schema: { ...node.schema, kind: 'Schema', type: 'never' } }
        }
      },
    },
    {
      // Force all date types to plain strings
      schema(node) {
        if (node.type === 'date') {
          return { ...node, type: 'string', representation: 'string' }
        }
      },
    },
    {
      // Add a JSDoc description to a specific schema
      schema(node) {
        if (node.name === 'Pet') {
          return { ...node, description: 'Represents a pet in the store.' }
        }
      },
    },
  ],
})
```

#### Using `context.parent` for scoped transformations

Every transformer callback receives a second argument — a `context` object with a type-safe `parent` field. This lets you scope transformations to properties of a specific schema, parameters of a specific operation, or any other parent-child relationship in the AST.

The `parent` type is automatically narrowed based on the visitor callback:

| Callback      | `context.parent` type                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| `root()`      | `undefined` (root has no parent)                                                   |
| `operation()` | `RootNode`                                                                         |
| `schema()`    | `RootNode \| OperationNode \| SchemaNode \| PropertyNode \| ParameterNode \| ResponseNode` |
| `property()`  | `SchemaNode`                                                                       |
| `parameter()` | `OperationNode`                                                                    |
| `response()`  | `OperationNode`                                                                    |

```typescript
pluginTs({
  transformers: [
    {
      // Make all properties of the 'Pet' schema optional
      property(node, { parent }) {
        if (parent?.name === 'Pet') {
          return { ...node, required: false }
        }
      },
    },
    {
      // Remove writeOnly properties, but only inside response schemas
      property(node, { parent }) {
        if (parent?.kind === 'Schema' && node.schema.writeOnly) {
          return { ...node, schema: { ...node.schema, kind: 'Schema', type: 'never' } }
        }
      },
    },
    {
      // Override a nested schema inside a specific operation's request body
      schema(node, { parent }) {
        if (parent?.kind === 'Operation' && parent.operationId === 'createPet' && node.type === 'date') {
          return { ...node, type: 'string' }
        }
      },
    },
  ],
})
```

Use `composeTransformers` from `@kubb/ast` to combine multiple visitors into one when building reusable transformer presets.

### `@kubb/plugin-ts` options moved to `adapterOas`

These options no longer exist on `pluginTs(...)` — pass them to `adapterOas(...)` instead.

::: code-group
```typescript [Before]
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    pluginTs({
      enumSuffix: 'enum',
      dateType: 'date',
      integerType: 'bigint',
      unknownType: 'unknown',
      emptySchemaType: 'unknown',
    }),
  ],
})
```

```typescript [After]
import { defineConfig } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    adapterOas({
      enumSuffix: 'enum',
      dateType: 'date',
      integerType: 'bigint',
      unknownType: 'unknown',
      emptySchemaType: 'unknown',
    }),
    pluginTs(),
  ],
})
```
:::

### Enum naming changed (`collisionDetection` removed)

In v5, `@kubb/adapter-oas` always uses collision-safe enum naming. The `collisionDetection` option is no longer supported.

Nested enums now always include their parent path context:

| v5 behavior | Example |
|---|---|
| Collision-safe full-path naming | `OrderParamsStatusEnum` |

The old v4-style short naming (e.g. `ParamsStatusEnum`) is not available in v5.

### Backwards-compatible type naming (`compatibilityPreset: 'kubbV4'`)

If your code relies on v4 operation type names, set `compatibilityPreset: 'kubbV4'` in `pluginTs` while you migrate.

```typescript
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    pluginTs({ compatibilityPreset: 'kubbV4' }),
  ],
})
```

| Type | v5 default | `compatibilityPreset: 'kubbV4'` |
|---|---|---|
| Request body | `<OperationId>Data` | `<OperationId>MutationRequest` / `QueryRequest` |
| Response union | `<OperationId>Response` | `<OperationId>MutationResponse` / `QueryResponse` |
| All responses | `<OperationId>Responses` | `<OperationId>Mutation` / `Query` |
| Response status | `<OperationId>Status201` | `<OperationId>201` |
| Default/error | `<OperationId>StatusDefault` | `<OperationId>Error` |

### `transformers.name` removed from `@kubb/plugin-ts`

The `transformers: { name }` callback has been removed. Use the `resolver` option instead.

::: code-group
```typescript [Before (v4)]
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    pluginTs({
      transformers: {
        name: (name, type) => type === 'type' ? `${name}Type` : name,
      },
    }),
  ],
})
```

```typescript [After (v5)]
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    pluginTs({
      resolver: {
        resolveName(name, type) {
          const resolved = this.default(name, type)
          return type === 'type' ? `${resolved}Type` : resolved
        },
      },
    }),
  ],
})
```
:::

### Resolver option for `@kubb/plugin-ts`

The `resolver` option accepts a partial resolver object that controls naming conventions. Any method you omit falls back to the preset resolver. Use `this.default(...)` to call the preset's implementation.

```typescript
import { pluginTs, resolverTs, resolverTsLegacy } from '@kubb/plugin-ts'

// Use legacy naming conventions
pluginTs({ compatibilityPreset: 'kubbV4' })

// Override a single method
pluginTs({
  resolver: {
    resolveName(name) {
      return `Custom${this.default(name, 'function')}`
    },
  },
})
```

### Compatibility preset for Kubb v4 naming

Use `compatibilityPreset` in `pluginTs` when you need Kubb v4 naming behavior:

```typescript
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({ compatibilityPreset: 'kubbV4' })
```

For custom naming, use the `resolver` option.

> [!NOTE]
> If `resolver` is explicitly provided, its methods override the active preset resolver.

### AST transformer for `@kubb/plugin-ts`

The `transformer` option accepts a single AST `Visitor` object. The visitor modifies `SchemaNode` trees before they are printed to TypeScript. Use this to customize the generated types without writing a custom generator.

```typescript
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  transformer: {
    // Force all date types to plain strings
    schema(node) {
      if (node.type === 'date') {
        return { ...node, type: 'string' }
      }
    },
  },
})
```

Returning `undefined` or `void` from a visitor method leaves the node unchanged.

### Printer node overrides for `@kubb/plugin-ts`

The new `printer.nodes` option lets you override the rendering of specific schema types without replacing the whole printer.

```typescript
import ts from 'typescript'
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  printer: {
    nodes: {
      date(node) {
        // Render date as the native Date object
        return ts.factory.createTypeReferenceNode('Date', [])
      },
    },
  },
})
```

### `defineResolver` now requires a `name` property

Plugin resolvers created with `defineResolver` must include a `name` property in the returned object. This identifies the resolver in the `resolvers` array.

::: code-group
```typescript [Before (v4)]
import { defineResolver } from '@kubb/core'

export const myResolver = defineResolver(() => ({
  resolveName(name) { return name },
}))
```

```typescript [After (v5)]
import { defineResolver } from '@kubb/core'

export const myResolver = defineResolver(() => ({
  name: 'my-resolver',
  resolveName(name) { return name },
}))
```
:::

### Path parameters with `$ref` schemas now resolve to their named type

In v4, a path parameter whose `schema` was a `$ref` was incorrectly typed as `any`. In v5 the referenced type name is used instead.

::: code-group
```typescript [Before (v4 — typed as any)]
// OpenAPI spec
// parameters:
//   - name: petId
//     in: path
//     required: true
//     schema:
//       $ref: '#/components/schemas/PetId'

// Generated type (v4)
export type GetPetByIdPathParams = {
  petId: any
}
```

```typescript [After (v5 — typed correctly)]
// Generated type (v5)
export type GetPetByIdPathParams = {
  petId: PetId
}
```
:::

This is a correctness fix. If you were relying on the `any` type for path parameters that reference a `$ref` schema, update your code to use the referenced type.

### `@kubb/plugin-zod` drops Zod v3 support

Kubb v5 only supports **Zod v4** and **Zod v4 Mini**. If you are using Zod v3, upgrade to Zod v4 before migrating to Kubb v5.

::: code-group
```typescript [Before (v4 — Zod v3)]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  version: '3',
  importPath: 'zod',
})
```

```typescript [After (v5 — Zod v4)]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  importPath: 'zod',
})
```
:::

Key changes:
- The `version` option has been removed. Kubb v5 always generates Zod v4 code.
- The `typed` option no longer generates `ToZod<T>` helper types. For typed schemas, use `z.ZodType<T>` directly (Zod v4's built-in type assertion).
- The default `importPath` is `'zod'` (for Zod v4) or `'zod/mini'` (when `mini: true`).
- Generated schemas use Zod v4 APIs: `z.int()`, `z.iso.datetime()`, `z.iso.date()`, `z.iso.time()`, `z.uuid()`, `z.email()`, `z.url()`, `z.strictObject()`.

### `@kubb/plugin-zod` — `transformers` option changed

The `transformers: { name, schema }` callbacks have been replaced with a single AST `Visitor` `transformer` option, matching the `@kubb/plugin-ts` pattern.

::: code-group
```typescript [Before (v4)]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  transformers: {
    name: (name, type) => type === 'function' ? `${name}Validator` : name,
  },
})
```

```typescript [After (v5)]
import { pluginZod } from '@kubb/plugin-zod'

// Use resolver for name transformations
pluginZod({
  resolver: {
    resolveName(name, type) {
      const resolved = this.default(name, type)
      return type === 'function' ? `${resolved}Validator` : resolved
    },
  },
})

// Use transformer for AST node transformations
pluginZod({
  transformer: {
    schema(node) {
      return { ...node, description: undefined }
    },
  },
})
```
:::

### `@kubb/plugin-zod` — removed options

The following options have been removed from `@kubb/plugin-zod`:

| Removed option | Replacement |
|---|---|
| `version` | Always Zod v4 (removed) |
| `contentType` | Moved to `adapterOas(...)` |
| `mapper` | Use `resolver` for name overrides |
| `transformers.name` | Use `resolver` for name customization |
| `transformers.schema` | Use `transformer: Visitor` for AST transformations |
| `integerType` | Moved to `adapterOas({ integerType })` |
| `emptySchemaType` | Moved to `adapterOas({ emptySchemaType })` |
| `unknownType` | Moved to `adapterOas({ unknownType })` |

### `@kubb/plugin-zod` — `wrapOutput` signature changed

The `schema` argument in the `wrapOutput` callback is now a `SchemaNode` from `@kubb/ast/types` instead of the raw `SchemaObject` from `@kubb/oas`.

::: code-group
```typescript [Before (v4)]
import { pluginZod } from '@kubb/plugin-zod'
import type { SchemaObject } from '@kubb/oas'

pluginZod({
  wrapOutput: ({ output, schema }: { output: string; schema: SchemaObject }) => {
    return `${output}.openapi({ example: schema.example })`
  },
})
```

```typescript [After (v5)]
import { pluginZod } from '@kubb/plugin-zod'
import type { SchemaNode } from '@kubb/ast/types'

pluginZod({
  wrapOutput: ({ output, schema }: { output: string; schema: SchemaNode }) => {
    return `${output}.describe(${JSON.stringify(schema.description ?? '')})`
  },
})
```
:::

### `@kubb/plugin-zod` — `coercion` accepts granular object

`coercion` can now be an object `{ dates?, strings?, numbers? }` to enable coercion selectively per type, in addition to the existing `boolean` shorthand.

```typescript
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  // Enable coercion only for date and number fields:
  coercion: { dates: true, numbers: true },
})
```

### `@kubb/plugin-zod` — response schema naming changed

The default preset now uses `<operationId>Status<code>Schema` for per-status response schemas (e.g. `listPetsStatus200Schema`) instead of the v4 convention `<operationId><code>Schema` (e.g. `listPets200Schema`).

To keep the Kubb v4 naming conventions, set `compatibilityPreset: 'kubbV4'`:

::: code-group
```typescript [Before (v4 names)]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  // v4 generated: listPets200Schema, createPetsMutationRequestSchema
})
```

```typescript [After (v5 default names)]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  // v5 generates: listPetsStatus200Schema, createPetsDataSchema
})
```

```typescript [After (v5 — keep v4 names)]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  compatibilityPreset: 'kubbV4',
  // keeps: listPets200Schema, createPetsMutationRequestSchema
})
```
:::

### `@kubb/plugin-zod` — new options in v5

| New option | Type | Default | Description |
|---|---|---|---|
| `paramsCasing` | `'camelcase'` | `undefined` | Apply camelCase to path/query/header param names |
| `compatibilityPreset` | `'default' \| 'kubbV4'` | `'default'` | Naming convention preset |
| `resolver` | `Partial<ResolverZod> & ThisType<ResolverZod>` | — | Override individual resolver methods (with `this.default` fallback) |
| `transformer` | `Visitor` | — | Single AST visitor applied before printing |
| `printer.nodes` | `PrinterZodNodes \| PrinterZodMiniNodes` | — | Override per-type code generation handlers |
| `inferred` | `boolean` | `false` | Export `z.infer<typeof ...>` type aliases |

### `@kubb/plugin-mcp` — v5 migration

The MCP plugin has been updated to use the v5 architecture. The following changes are required when migrating from v4.

#### `pluginOas()` no longer required

In v5, `@kubb/plugin-mcp` no longer depends on `@kubb/plugin-oas`. Use `adapterOas()` in the `adapter` field instead. `pluginOas()` is still available for validation but is no longer a prerequisite.

::: code-group
```typescript [Before (v4)]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginMcp } from '@kubb/plugin-mcp'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginZod(),
    pluginMcp({
      output: { path: './mcp' },
      client: { baseURL: 'https://petstore.swagger.io/v2' },
    }),
  ],
})
```

```typescript [After (v5)]
import { defineConfig } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginMcp } from '@kubb/plugin-mcp'

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  adapter: adapterOas(),
  plugins: [
    pluginTs(),
    pluginZod(),
    pluginMcp({
      output: { path: './mcp' },
      client: { baseURL: 'https://petstore.swagger.io/v2' },
    }),
  ],
})
```
:::

#### `contentType` moved to adapter

The `contentType` option has been removed from `@kubb/plugin-mcp`. Content type filtering is now handled by `adapterOas(...)`.

::: code-group
```typescript [Before (v4)]
pluginMcp({
  contentType: 'application/json',
})
```

```typescript [After (v5)]
adapterOas({
  contentType: 'application/json',
})
```
:::

#### `transformers.name` replaced by `resolver`

The `transformers: { name }` callback has been removed. Use the `resolver` option instead.

::: code-group
```typescript [Before (v4)]
pluginMcp({
  transformers: {
    name: (name, type) => type === 'function' ? `${name}Fn` : name,
  },
})
```

```typescript [After (v5)]
pluginMcp({
  resolver: {
    resolveName(name) {
      return `${this.default(name)}Fn`
    },
  },
})
```
:::

#### `transformers` replaced by `transformer`

The `transformers` object has been replaced by a single `transformer` option that accepts an AST `Visitor`, matching the pattern used by `@kubb/plugin-ts` and `@kubb/plugin-zod`.

```typescript
pluginMcp({
  transformer: {
    operation(node) {
      return { ...node, operationId: `api_${node.operationId}` }
    },
  },
})
```

#### New `compatibilityPreset` option

Use `compatibilityPreset: 'kubbV4'` to preserve v4 naming conventions while migrating.

```typescript
pluginMcp({
  compatibilityPreset: 'kubbV4',
})
```

### `@kubb/plugin-mcp` — new options in v5

| New option | Type | Default | Description |
|---|---|---|---|
| `compatibilityPreset` | `'default' \| 'kubbV4'` | `'default'` | Naming convention preset |
| `resolver` | `Partial<ResolverMcp> & ThisType<ResolverMcp>` | — | Override individual resolver methods |
| `transformer` | `Visitor` | — | Single AST visitor applied before printing |
| `paramsCasing` | `'camelcase'` | `undefined` | Apply camelCase to parameter names |

### `@kubb/plugin-client` — v5 migration

`@kubb/plugin-client` has been rewritten to match the v5 plugin architecture. Most options are unchanged, but naming customization and transformation have moved to a new `resolver`/`transformer` pattern.

#### `transformers.name` replaced by `resolver`

The `transformers: { name }` callback has been removed. Use the `resolver` option instead.

::: code-group
```typescript [Before (v4)]
pluginClient({
  transformers: {
    name: (name, type) => type === 'function' ? `${name}Client` : name,
  },
})
```

```typescript [After (v5)]
import { pluginClient } from '@kubb/plugin-client'

pluginClient({
  resolver: {
    resolveName(name) {
      return `${this.default(name)}Client`
    },
  },
})
```
:::

#### New `compatibilityPreset` option

Use `compatibilityPreset: 'kubbV4'` to preserve v4 naming conventions while migrating.

```typescript
import { pluginClient } from '@kubb/plugin-client'

pluginClient({ compatibilityPreset: 'kubbV4' })
```

#### New `transformer` option

Apply an AST `Visitor` to transform operation nodes before they are printed. This replaces the old `transformers` callback approach for structural modifications.

```typescript
import { pluginClient } from '@kubb/plugin-client'

pluginClient({
  transformer: {
    operation(node) {
      return { ...node, operationId: `api_${node.operationId}` }
    },
  },
})
```

#### `baseURL` now defaults to the adapter baseURL

In v4, `baseURL` had to be set explicitly. In v5, it automatically falls back to the base URL from the OAS spec. Explicitly setting `baseURL` in plugin options still takes precedence.

#### `contentType` override matching fixed

The `{ type: 'contentType', pattern: '...' }` override form now correctly filters operations by their request body content type. Previously these overrides were silently ignored.

### `@kubb/plugin-client` — new options in v5

| New option | Type | Default | Description |
|---|---|---|---|
| `compatibilityPreset` | `'default' \| 'kubbV4'` | `'default'` | Naming convention preset |
| `resolver` | `Partial<ResolverClient> & ThisType<ResolverClient>` | — | Override individual resolver methods |
| `transformer` | `Visitor` | — | Single AST visitor applied before printing |
