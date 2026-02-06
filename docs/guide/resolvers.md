---
layout: doc

title: Resolvers - Custom Naming and File Organization
description: Learn how to use resolvers to customize naming conventions and file organization in Kubb plugins.
outline: deep
---

# Resolvers <Badge type="tip" text="Available in v4.22+" />

Resolvers provide a powerful way to customize how Kubb generates names and organizes files.
They replace the legacy `transformers.name` approach with a more flexible and type-safe system.

## What are Resolvers?

A resolver is a function that determines:
- The **names** of generated code artifacts (types, functions, constants, etc.)
- The **file paths** where these artifacts are written
- How to **organize** multiple outputs from a single operation or schema

Each plugin can have one or more resolvers that are executed in order. The first resolver that returns a result wins.

## Basic Example

Here's a simple custom resolver for the TypeScript plugin:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pascalCase } from '@kubb/core/transformers'
import { createResolver } from '@kubb/plugin-oas/resolvers'

export default defineConfig({
  input: {
    path: './petstore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginTs({
      resolvers: [
        createResolver({
          name: 'my-resolver',
          operation: ({ operation, config }) => {
            const operationId = operation.getOperationId()
            const name = pascalCase(operationId)

            const file = {
              baseName: `${name}.ts`,
              path: `${config.root}/${config.output.path}/types/${name}.ts`,
              imports: [],
              exports: [],
              sources: [],
              meta: {},
            }

            return {
              file,
              outputs: {
                default: { name, file },
                query: { name: `${name}Query`, file },
                mutation: { name: `${name}Mutation`, file },
                pathParams: { name: `${name}PathParams`, file },
                queryParams: { name: `${name}QueryParams`, file },
                headerParams: { name: `${name}HeaderParams`, file },
                request: { name: `${name}Request`, file },
                response: { name: `${name}Response`, file },
                responses: { name: `${name}Responses`, file },
                responseData: { name: `${name}ResponseData`, file },
              }
            }
          },
          schema: ({ schema, config }) => {
            const name = pascalCase(schema.name)

            const file = {
              baseName: `${name}.ts`,
              path: `${config.root}/${config.output.path}/types/${name}.ts`,
              imports: [],
              exports: [],
              sources: [],
              meta: {},
            }

            return {
              file,
              outputs: {
                default: { name, file },
                type: { name, file },
                enum: { name: `${name}Key`, file },
              }
            }
          },
        })
      ]
    })
  ]
})
```

## Creating Resolvers

Use the `createResolver` utility from `@kubb/plugin-oas/resolvers` to create a resolver. Both `operation` and `schema` handlers are optional — omitted handlers default to returning `null`.

```typescript
import { createResolver } from '@kubb/plugin-oas/resolvers'

createResolver({
  name: 'my-resolver',
  operation: ({ operation, config }) => { /* ... */ },
  schema: ({ schema, config }) => { /* ... */ },
})
```

## Resolver Structure

A resolver has two main parts:

### 1. Operation Handler

Handles resolution for OpenAPI operations (endpoints):

```typescript
createResolver({
  name: 'my-resolver',
  operation: ({ operation, config }) => {
    // Return OperationResolution or null
    return {
      file: { baseName, path, imports, exports, sources, meta },
      outputs: { default: { name, file }, /* other named outputs */ }
    }
  }
})
```

### 2. Schema Handler

Handles resolution for OpenAPI schemas (component schemas like `Pet`, `User`, etc.):

```typescript
createResolver({
  name: 'my-resolver',
  schema: ({ schema, config }) => {
    // Return SchemaResolution or null
    return {
      file: { baseName, path, imports, exports, sources, meta },
      outputs: { default: { name, file }, /* other named outputs */ }
    }
  }
})
```

## Conditional Resolution

Return `null` to fall through to the next resolver:

```typescript
createResolver({
  name: 'admin-only',
  operation: ({ operation }) => {
    // Only handle admin endpoints
    if (!operation.path.startsWith('/admin')) {
      return null // Falls through to default resolver
    }

    // Custom logic for admin endpoints
    return {
      file: { /* ... */ },
      outputs: { /* ... */ }
    }
  }
})
```

## Using the Default Resolver

You can use `createTsResolver` to get the default behavior and modify it:

```typescript
import { pluginTs, createTsResolver } from '@kubb/plugin-ts'
import { createResolver } from '@kubb/plugin-oas/resolvers'

export default defineConfig({
  plugins: [
    pluginTs({
      resolvers: [
        createResolver({
          name: 'custom-suffix',
          operation: ({ operation, config }) => {
            // Get default resolution
            const defaultResolver = createTsResolver({ outputPath: 'types' })
            const defaults = defaultResolver.operation({ operation, config })

            if (!defaults) return null

            // Modify only the response name
            return {
              ...defaults,
              outputs: {
                ...defaults.outputs,
                response: {
                  ...defaults.outputs.response,
                  name: `${defaults.outputs.response.name}DTO`
                }
              }
            }
          },
        })
      ]
    })
  ]
})
```

### `createTsResolver` Options

| Option | Type | Default | Description |
|---|---|---|---|
| `outputPath` | `string` | `'types'` | Output subdirectory for generated types |
| `group` | `Group` | — | Group configuration for organizing files by tag or path |
| `transformName` | `(name: string, type?) => string` | — | Custom name transformer (**deprecated**, use a custom resolver instead) |

## Common Use Cases

### Add Prefix/Suffix to All Types

```typescript
createResolver({
  name: 'interface-prefix',
  operation: ({ operation, config }) => {
    const defaultResolver = createTsResolver({ outputPath: 'types' })
    const defaults = defaultResolver.operation({ operation, config })

    if (!defaults) return null

    // Add "I" prefix to all outputs
    return {
      ...defaults,
      outputs: Object.entries(defaults.outputs).reduce((acc, [key, value]) => {
        acc[key] = {
          ...value,
          name: `I${value.name}`
        }
        return acc
      }, {})
    }
  }
})
```

### Custom Naming Convention

```typescript
createResolver({
  name: 'snake-case-types',
  operation: ({ operation, config }) => {
    const operationId = operation.getOperationId()
    const name = snakeCase(operationId) // use snake_case instead of PascalCase

    const file = {
      baseName: `${name}.ts`,
      path: `${config.root}/${config.output.path}/types/${name}.ts`,
      imports: [],
      exports: [],
      sources: [],
      meta: {},
    }

    return {
      file,
      outputs: {
        default: { name, file },
        query: { name: `${name}_query`, file },
        mutation: { name: `${name}_mutation`, file },
        pathParams: { name: `${name}_path_params`, file },
        queryParams: { name: `${name}_query_params`, file },
        headerParams: { name: `${name}_header_params`, file },
        request: { name: `${name}_request`, file },
        response: { name: `${name}_response`, file },
        responses: { name: `${name}_responses`, file },
        responseData: { name: `${name}_response_data`, file },
      }
    }
  }
})
```

## Output Keys by Plugin

Each plugin defines its output keys as an **object** with separate `operation` and `schema` string unions. TypeScript enforces that **every key** is present in the returned `outputs` map (plus the required `default` key).

### @kubb/plugin-ts

```typescript
type PluginTsOutputKeys = {
  operation:
    | 'query'
    | 'mutation'
    | 'pathParams'
    | 'queryParams'
    | 'headerParams'
    | 'request'
    | 'response'
    | 'responses'
    | 'responseData'
    | HttpStatus // dynamic status code keys like '200', '404', 'default', etc.
  schema:
    | 'type'
    | 'enum'
}
```

The `operation` handler must return outputs matching the `operation` keys, and the `schema` handler must return outputs matching the `schema` keys. The `default` key is always required in both.

The operation resolver can also include **HTTP status code outputs** (e.g. `'200'`, `'404'`, `'default'`). The default `createTsResolver` automatically generates these from `operation.getResponseStatusCodes()`.

More plugins will support resolvers in future releases.

## Multiple Resolvers

You can provide multiple resolvers. They are executed in order, and the first one that returns a non-null result wins:

```typescript
pluginTs({
  resolvers: [
    // Custom resolver for admin endpoints
    createResolver({
      name: 'admin',
      operation: ({ operation }) => {
        if (!operation.path.startsWith('/admin')) return null
        // ... custom logic
      }
    }),
    // Custom resolver for public endpoints
    createResolver({
      name: 'public',
      operation: ({ operation }) => {
        if (operation.path.startsWith('/admin')) return null
        // ... custom logic
      }
    }),
    // Default resolver is automatically added last
  ]
})
```

## Migration from transformers.name

If you're currently using `transformers.name`, here's how to migrate:

### Before

```typescript
pluginTs({
  transformers: {
    name: (name, type) => {
      if (type === 'type') {
        return `I${name}`
      }
      return name
    }
  }
})
```

### After

```typescript
pluginTs({
  resolvers: [
    createResolver({
      name: 'interface-prefix',
      operation: ({ operation, config }) => {
        const defaultResolver = createTsResolver({ outputPath: 'types' })
        const defaults = defaultResolver.operation({ operation, config })

        if (!defaults) return null

        return {
          ...defaults,
          outputs: Object.entries(defaults.outputs).reduce((acc, [key, value]) => {
            acc[key] = { ...value, name: `I${value.name}` }
            return acc
          }, {})
        }
      },
      schema: ({ schema, config }) => {
        const defaultResolver = createTsResolver({ outputPath: 'types' })
        const defaults = defaultResolver.schema({ schema, config })

        if (!defaults) return null

        return {
          ...defaults,
          outputs: {
            ...defaults.outputs,
            type: {
              ...defaults.outputs.type,
              name: `I${defaults.outputs.type.name}`
            }
          }
        }
      }
    })
  ]
})
```

## `useResolve` Hook

For plugin authors building generators, the `useResolve` hook resolves names and files within React-fabric components:

```typescript
import { useResolve } from '@kubb/plugin-oas/hooks'

// Resolve for the current plugin's operation
const resolution = useResolve({ operation })

// Resolve for a different plugin by name
const tsResolution = useResolve({ operation }, '@kubb/plugin-ts')

// Resolve for a schema
const schemaResolution = useResolve({ schema: { name: 'Pet', value: schemaObject } })
```

The hook automatically injects the `config` into the resolver context and iterates through the plugin's resolvers until one returns a non-null result.

## See Also

- [Architecture: Resolver Architecture](/architecture/resolver-architecture)
- [Plugin: @kubb/plugin-ts](/plugins/plugin-ts)
