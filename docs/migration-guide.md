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
        // Override the "category" property to always be a string
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
          // Override the "category" property to use a string schema and make it optional
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
      // Make all properties of the "Pet" schema optional
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

The `transformers: { name }` callback has been removed. Use a custom resolver in the new `resolvers` array instead.

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
import { defineResolver } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts/resolvers'

export default defineConfig({
  plugins: [
    pluginTs({
      resolvers: [
        resolverTs,
        defineResolver(() => ({
          ...resolverTs,
          name: 'custom',
          default(name, type) {
            const resolved = resolverTs.default(name, type)
            return type === 'type' ? `${resolved}Type` : resolved
          },
        })),
      ],
    }),
  ],
})
```
:::

### Composable resolvers for `@kubb/plugin-ts`

The `resolvers` option accepts an array of named resolvers that control naming conventions. Later entries override earlier ones.

```typescript
import { pluginTs, resolverTs, resolverTsLegacy } from '@kubb/plugin-ts'

// Use legacy naming conventions
pluginTs({ resolvers: [resolverTsLegacy] })

// Use default naming (equivalent to omitting the option)
pluginTs({ resolvers: [resolverTs] })
```

The `mergeResolvers` helper from `@kubb/core` merges multiple resolvers into a single resolver where later entries override earlier ones.

### Compatibility preset for Kubb v4 naming

Use `compatibilityPreset` in `pluginTs` when you need Kubb v4 naming behavior:

```typescript
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({ compatibilityPreset: 'kubbV4' })
```

For custom naming, compose your own `resolvers`.

> [!NOTE]
> If `resolvers` is explicitly provided, it overrides preset resolver behavior.

### AST transformers for `@kubb/plugin-ts`

The `transformers` option accepts an array of AST `Visitor` objects. These visitors modify `SchemaNode` trees before they are printed to TypeScript. Use this to customize the generated types without writing a custom generator.

```typescript
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  transformers: [
    {
      // Force all date types to plain strings
      schema(node) {
        if (node.type === 'date') {
          return { ...node, type: 'string' }
        }
      },
    },
    {
      // Make specific properties optional
      property(node) {
        if (node.name === 'metadata') {
          return { ...node, required: false }
        }
      },
    },
  ],
})
```

The `composeTransformers` helper from `@kubb/ast` combines multiple `Visitor` objects into a single visitor that pipes each node through all visitors sequentially.

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
