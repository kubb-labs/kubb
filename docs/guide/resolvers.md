---
layout: doc

title: Resolvers - Custom Naming and File Organization
description: Learn how to use resolvers to customize naming conventions and file organization in Kubb plugins.
outline: deep
---

# Resolvers <Badge type="tip" text="Available in v4.16+" />

Resolvers provide a powerful way to customize how Kubb generates names and organizes files. They replace the legacy `transformers.name` approach with a more flexible and type-safe system.

## What are Resolvers?

A resolver is a function that determines:
- The **names** of generated code artifacts (types, functions, constants, etc.)
- The **file paths** where these artifacts are written
- How to **organize** multiple outputs from a single operation or schema

Each plugin can have one or more resolvers that are executed in order. The first resolver that returns a result wins.

## Basic Example

Here's a simple custom resolver for the TypeScript plugin:

```typescript
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pascalCase } from '@kubb/core/transformers'

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
        {
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
                type: { name, file },
                pathParams: { name: `${name}PathParams`, file },
                queryParams: { name: `${name}QueryParams`, file },
                request: { name: `${name}Request`, file },
                response: { name: `${name}Response`, file },
                // ... other required outputs
              }
            }
          },
          schema: () => null // Use default for schemas
        }
      ]
    })
  ]
})
```

## Resolver Structure

A resolver has two main parts:

### 1. Operation Handler

Handles resolution for OpenAPI operations (endpoints):

```typescript
{
  name: 'my-resolver',
  operation: ({ operation, config }) => {
    // Return Resolution or null
    return {
      file: { baseName, path, imports, exports, sources, meta },
      outputs: { /* named outputs */ }
    }
  }
}
```

### 2. Schema Handler

Handles resolution for OpenAPI schemas (component schemas like `Pet`, `User`, etc.):

```typescript
{
  name: 'my-resolver',
  schema: ({ schema, config }) => {
    // Return Resolution or null
    return {
      file: { baseName, path, imports, exports, sources, meta },
      outputs: { /* named outputs */ }
    }
  }
}
```

## Conditional Resolution

Return `null` to fall through to the next resolver:

```typescript
{
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
}
```

## Using the Default Resolver

You can use `createTsResolver` to get the default behavior and modify it:

```typescript
import { pluginTs, createTsResolver } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    pluginTs({
      resolvers: [
        {
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
          schema: () => null
        }
      ]
    })
  ]
})
```

## Common Use Cases

### Add Prefix/Suffix to All Types

```typescript
{
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
}
```

### Organize by Tag

```typescript
{
  name: 'group-by-tag',
  operation: ({ operation, config }) => {
    const tags = operation.getTags()
    const tag = tags[0]?.name || 'default'
    const operationId = operation.getOperationId()
    const name = pascalCase(operationId)
    
    const file = {
      baseName: `${name}.ts`,
      path: `${config.root}/${config.output.path}/types/${tag}/${name}.ts`,
      imports: [],
      exports: [],
      sources: [],
      meta: {},
    }

    return {
      file,
      outputs: {
        // ... outputs
      }
    }
  }
}
```

### Custom Naming Convention

```typescript
{
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
        type: { name, file },
        pathParams: { name: `${name}_path_params`, file },
        queryParams: { name: `${name}_query_params`, file },
        request: { name: `${name}_request`, file },
        response: { name: `${name}_response`, file },
        // ... other outputs
      }
    }
  }
}
```

## Output Keys by Plugin

Each plugin defines its own set of output keys:

### @kubb/plugin-ts

```typescript
type ResolverOutputKeys =
  | 'default'
  | 'type'
  | 'query'
  | 'mutation'
  | 'enum'
  | 'pathParams'
  | 'queryParams'
  | 'headerParams'
  | 'request'
  | 'response'
  | 'responses'
  | 'responseData'
```

More plugins will support resolvers in future releases.

## Type Safety

Resolvers are fully type-safe. TypeScript will autocomplete available output keys and ensure you provide all required outputs:

```typescript
pluginTs({
  resolvers: [
    {
      name: 'my-resolver',
      operation: ({ operation, config }) => {
        return {
          file: { /* ... */ },
          outputs: {
            type: { name: 'MyType', file },
            // TypeScript will error if you forget required outputs
          }
        }
      }
    }
  ]
})
```

## Multiple Resolvers

You can provide multiple resolvers. They are executed in order, and the first one that returns a non-null result wins:

```typescript
pluginTs({
  resolvers: [
    // Custom resolver for admin endpoints
    {
      name: 'admin',
      operation: ({ operation }) => {
        if (!operation.path.startsWith('/admin')) return null
        // ... custom logic
      }
    },
    // Custom resolver for public endpoints
    {
      name: 'public',
      operation: ({ operation }) => {
        if (operation.path.startsWith('/admin')) return null
        // ... custom logic
      }
    }
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
    {
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
    }
  ]
})
```

## Best Practices

1. **Return null for pass-through**: If your resolver doesn't handle a case, return `null` to let the next resolver handle it.

2. **Use the default resolver**: Start with the default resolver and modify only what you need.

3. **Keep resolvers focused**: Create separate resolvers for different concerns (admin endpoints, public endpoints, etc.).

4. **Test your resolvers**: Generate code and verify the output matches your expectations.

5. **Use TypeScript**: Leverage type safety to ensure all output keys are provided.

## See Also

- [Architecture: Resolver Architecture](/architecture/resolver-architecture)
- [Architecture: Resolver Expansion Plan](/architecture/resolver-expansion-plan)
- [Plugin: @kubb/plugin-ts](/plugins/plugin-ts)
