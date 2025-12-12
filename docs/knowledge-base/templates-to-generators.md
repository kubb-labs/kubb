---
layout: doc

title: Migrating from Templates to Generators
outline: deep
---

# Migrating from Templates to Generators

This guide will help you migrate from the deprecated `templates` pattern (used in Kubb v2.x) to the new `generators` pattern introduced in Kubb v3.x.

> [!IMPORTANT]
> **Package Name Changes**: In addition to the templates → generators migration, note that package names have changed:
> - `@kubb/swagger-tanstack-query` → `@kubb/plugin-react-query`
> - `@kubb/swagger-client` → `@kubb/plugin-client`
> - `@kubb/swagger-ts` → `@kubb/plugin-ts`
> - `@kubb/swagger-zod` → `@kubb/plugin-zod`
> - `@kubb/swagger-faker` → `@kubb/plugin-faker`
> - `@kubb/swagger-msw` → `@kubb/plugin-msw`

## Understanding the Change

In Kubb v2.x, plugins like `@kubb/plugin-react-query` (formerly `@kubb/swagger-tanstack-query`) allowed you to override templates:

```typescript
// ❌ Old approach (v2.x - deprecated)
import { templates } from './my-templates'

pluginTanstackQuery({
  templates, // Override component templates
})
```

In Kubb v3.x, you should use **generators** instead:

```typescript
// ✅ New approach (v3.x)
import { myCustomGenerator } from './my-generator'

pluginReactQuery({
  generators: [myCustomGenerator], // Add custom generators
})
```

## Why Generators?

Generators provide:

1. **More control**: Full access to the file generation lifecycle
2. **Better composition**: Combine multiple generators easily
3. **Type safety**: Better TypeScript support
4. **Flexibility**: Use React components or plain functions
5. **Plugin independence**: Generators work with `@kubb/plugin-oas`, not tied to specific plugins

## Quick Start: Simple Example

Before diving into complex migrations, here's a simple example to get you started. This shows how to add console logging to all generated queries:

::: code-group
```typescript [generator.ts]
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Function } from '@kubb/react-fabric'

export const loggingGenerator = createReactGenerator({
  name: 'query-logger',
  Operation({ operation, generator }) {
    const { getName, getFile } = useOperationManager(generator)
    
    // Only generate for GET operations
    if (operation.method !== 'get') return null
    
    const hook = {
      name: getName(operation, { type: 'function', prefix: 'useLogged' }),
      file: getFile(operation, { prefix: 'useLogged' }),
    }
    
    return (
      <File baseName={hook.file.baseName} path={hook.file.path}>
        <File.Source>
          <Function name={hook.name} export>
            {`
              console.log('Query started: ${operation.getOperationId()}')
              return useQuery(/* ... */)
            `}
          </Function>
        </File.Source>
      </File>
    )
  },
})
```

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { loggingGenerator } from './generators/loggingGenerator'

export default defineConfig({
  plugins: [
    pluginOas({ output: false }),
    pluginReactQuery({
      output: { path: './hooks' },
    }),
    // Add your custom generator
    pluginOas({
      generators: [loggingGenerator],
    }),
  ],
})
```
:::

## Migration Strategies

There are three main approaches to migrate your templates:

### Strategy 1: Use Plugin Options (Simplest)

Many customizations can be achieved using built-in plugin options without custom generators.

**Example: Custom headers**

```typescript
// Instead of overriding templates for headers
pluginReactQuery({
  client: {
    importPath: '../../config/client', // Use custom client
  },
})
```

Create your custom client file:

```typescript
// config/client.ts
import axios from 'axios'

export const client = axios.create({
  headers: {
    'Content-Type': 'application/json',
    // Your custom headers
  },
})
```

### Strategy 2: Create a Custom Generator (Recommended)

When you need to customize the generated code structure, create a custom generator.

#### Using `createReactGenerator`

This is the recommended approach as it leverages Kubb's React components:

```tsx
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Function } from '@kubb/react-fabric'
import type { PluginReactQuery } from '@kubb/plugin-react-query'

export const customQueryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'custom-query-options',
  Operation({ operation, generator }) {
    const { getName, getFile } = useOperationManager(generator)

    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'QueryOptions' }),
      file: getFile(operation),
    }

    return (
      <File
        baseName={queryOptions.file.baseName}
        path={queryOptions.file.path}
        meta={queryOptions.file.meta}
      >
        <File.Source>
          <Function name={queryOptions.name} export>
            {`
              // Your custom implementation
              return {
                queryKey: ['${operation.getOperationId()}'],
                queryFn: async () => {
                  // Add performance timing
                  const start = performance.now()
                  try {
                    const result = await fetch('...')
                    console.log(\`[perf] ${operation.getOperationId()}: \${(performance.now() - start).toFixed(1)}ms\`)
                    return result
                  } catch (e) {
                    console.log(\`[perf] ${operation.getOperationId()}: threw after \${(performance.now() - start).toFixed(1)}ms\`)
                    throw e
                  }
                },
              }
            `}
          </Function>
        </File.Source>
      </File>
    )
  },
})
```

Use your generator:

```typescript
import { pluginOas } from '@kubb/plugin-oas'
import { customQueryGenerator } from './generators/customQueryGenerator'

export default defineConfig({
  plugins: [
    pluginOas({
      generators: [customQueryGenerator],
    }),
  ],
})
```

#### Using `createGenerator`

For more control, use the lower-level `createGenerator`:

```typescript
import { createGenerator } from '@kubb/plugin-oas/generators'
import type { PluginReactQuery } from '@kubb/plugin-react-query'

export const customQueryGenerator = createGenerator<PluginReactQuery>({
  name: 'custom-query-options',
  async operation({ operation, generator }) {
    const pluginKey = generator.context.plugin.key
    const name = generator.context.pluginManager.resolveName({
      name: operation.getOperationId(),
      pluginKey,
      type: 'function',
    })

    const file = generator.context.pluginManager.getFile({
      name,
      extname: '.ts',
      pluginKey,
      options: { type: 'file', pluginKey },
    })

    return [
      {
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        sources: [
          {
            value: `
              export function ${name}() {
                // Your custom implementation
                return {
                  queryKey: ['${operation.getOperationId()}'],
                  queryFn: async () => {
                    // Custom logic here
                  },
                }
              }
            `,
          },
        ],
      },
    ]
  },
})
```

### Strategy 3: Extend Plugin Components

If you only need minor tweaks, you can reuse existing plugin components:

```tsx
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File } from '@kubb/react-fabric'
import { QueryOptions } from '@kubb/plugin-react-query/components'
import type { PluginReactQuery } from '@kubb/plugin-react-query'

export const enhancedQueryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'enhanced-query',
  Operation({ operation, generator, plugin }) {
    const { getName, getFile, getSchemas } = useOperationManager(generator)

    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'QueryOptions' }),
      file: getFile(operation),
    }

    const typeSchemas = getSchemas(operation, { pluginKey: ['plugin-ts'], type: 'type' })

    return (
      <File
        baseName={queryOptions.file.baseName}
        path={queryOptions.file.path}
        meta={queryOptions.file.meta}
      >
        {/* Add custom imports */}
        <File.Import name="{ performanceTimer }" path="@/utils/performance" />
        
        {/* Use existing component with modifications */}
        <QueryOptions
          name={queryOptions.name}
          clientName={getName(operation, { type: 'function' })}
          queryKeyName={getName(operation, { type: 'const', suffix: 'QueryKey' })}
          typeSchemas={typeSchemas}
          paramsCasing={plugin.options.paramsCasing}
          paramsType={plugin.options.paramsType}
          pathParamsType={plugin.options.pathParamsType}
          dataReturnType={plugin.options.client.dataReturnType || 'data'}
        />

        {/* Add additional exports */}
        <File.Source>
          {`
            // Additional custom code
            export const enhanced${operation.getOperationId()} = {
              ...${queryOptions.name}(),
              meta: { tracked: true }
            }
          `}
        </File.Source>
      </File>
    )
  },
})
```

## Real-World Example: Complete Migration

> [!TIP]
> **Looking for a complete, working v4 example?** See the [Complete v4 Generator Example](/knowledge-base/templates-to-generators-v4-example/) which shows the full conversion of the template from the issue with all features preserved.

Let's migrate the template from the issue description:

### Original Template (v2.x)

```tsx
// ❌ Old approach
export const templates = {
  queryOptions: {
    ...QueryOptions.templates,
    react: ({ name, params, client, hook, dataReturnType, infinite, parser }) => {
      const isV5 = new PackageManager().isValidSync(reactQueryDepRegex, ">=5")
      const isFormData = client.contentType === "multipart/form-data"
      
      // ... complex template logic
      
      return (
        <Function name={name} export params={params}>
          {`// Generated query options code`}
        </Function>
      )
    },
  },
}

pluginTanstackQuery({
  templates,
})
```

### New Generator Approach (v3.x)

```tsx
// ✅ New approach
import { PackageManager } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { File, Function } from '@kubb/react-fabric'
import type { PluginReactQuery } from '@kubb/plugin-react-query'

const reactQueryDepRegex = /@tanstack\/(react|solid|vue|svelte)-query/

export const customQueryOptionsGenerator = createReactGenerator<PluginReactQuery>({
  name: 'custom-query-options',
  Operation({ operation, generator, plugin }) {
    const { getName, getFile, getSchemas } = useOperationManager(generator)
    
    // Get the schemas for types
    const typeSchemas = getSchemas(operation, {
      pluginKey: ['plugin-ts'],
      type: 'type',
    })

    // Determine if this is a query operation
    const isQuery = operation.method === 'get'
    if (!isQuery) {
      return null
    }

    // Set up names
    const queryOptions = {
      name: getName(operation, { type: 'function', suffix: 'QueryOptions' }),
      file: getFile(operation, { suffix: 'QueryOptions' }),
    }

    const client = {
      name: getName(operation, { type: 'function' }),
    }

    const queryKey = {
      name: getName(operation, { type: 'const', suffix: 'QueryKey' }),
    }

    // Check TanStack Query version
    const isV5 = new PackageManager().isValidSync(reactQueryDepRegex, '>=5')
    
    // Determine content type
    const isFormData = operation.getContentType() === 'multipart/form-data'
    const contentType = operation.getContentType() || 'application/json'

    // Build headers array
    const headers = [
      contentType !== 'application/json' ? `'Content-Type': '${contentType}'` : undefined,
      '...headers',
    ]
      .filter(Boolean)
      .join(', ')

    // Build client options
    const clientOptions = [
      `method: "${operation.method}"`,
      `url: ${operation.path}`,
      `signal: signal`,
      typeSchemas.queryParams ? 'params' : undefined,
      typeSchemas.request && !isFormData ? 'data' : undefined,
      typeSchemas.request && isFormData ? 'data: formData' : undefined,
      headers ? `headers: { ${headers}, ...options.headers }` : undefined,
      '...options',
    ].filter(Boolean)

    const resolvedClientOptions = `${transformers.createIndent(6)}${clientOptions.join(`,\n${transformers.createIndent(6)}`)}`

    // FormData handling
    const formDataCode = isFormData
      ? `
        const formData = new FormData()
        if(data) {
          Object.keys(data).forEach((key) => {
            const value = data[key];
            if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
              formData.append(key, value);
            }
          })
        }
      `
      : ''

    // Performance timer helper
    const timedFunction = `
      async function timed<T>(
        name: string,
        fn: () => Promise<T> | T,
      ): Promise<T> {
        const start = performance.now();

        try {
          const result = await fn();
          const d = performance.now() - start;
          console.log(\`[perf] \${name}: \${d.toFixed(1)}ms\`);
          return result;
        } catch (e) {
          const d = performance.now() - start;
          console.log(\`[perf] \${name}: threw after \${d.toFixed(1)}ms\`);
          throw e;
        }
      }
    `

    // Data return handling
    const returnStatement = plugin.options.client.dataReturnType === 'full'
      ? 'return res'
      : 'return res.data'

    return (
      <File
        baseName={queryOptions.file.baseName}
        path={queryOptions.file.path}
        meta={queryOptions.file.meta}
      >
        <File.Source>
          <Function
            name={queryOptions.name}
            export
            params={`params: { ${typeSchemas.pathParams?.name ? `pathParams: ${typeSchemas.pathParams.name}` : ''} ${typeSchemas.queryParams?.name ? `, params?: ${typeSchemas.queryParams.name}` : ''} }`}
          >
            {`
              const queryKey = ${queryKey.name}(params)

              ${timedFunction}

              return ${isV5 ? 'queryOptions' : ''}({
                queryKey,
                queryFn: async ({ signal }) => {
                  ${formDataCode}
                  const res = await timed('${operation.getOperationId()}', async () => client<${typeSchemas.response.name}>({
                    ${resolvedClientOptions}
                  }))

                  ${returnStatement}
                },
              })
            `}
          </Function>
        </File.Source>
      </File>
    )
  },
})
```

### Using the Generator

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { customQueryOptionsGenerator } from './src/codegen/generators/customQueryOptions'

export default defineConfig({
  plugins: [
    pluginOas({ output: false }),
    pluginTs(),
    pluginReactQuery({
      client: {
        importPath: '../../config/client',
      },
      infinite: {
        queryParam: 'page',
      },
      output: {
        path: './hooks',
      },
    }),
    // Add custom generator
    pluginOas({
      output: {
        path: './hooks',
      },
      generators: [customQueryOptionsGenerator],
    }),
  ],
})
```

## Key Differences

| Aspect | Templates (v2.x) | Generators (v3.x) |
|--------|------------------|-------------------|
| **Scope** | Override plugin component rendering | Add/extend generation logic |
| **Access** | Limited to component props | Full access to operation, schemas, plugin context |
| **Composition** | Hard to combine multiple customizations | Easy to combine multiple generators |
| **Type Safety** | Loose typing | Strong typing with generics |
| **Plugin** | Tied to specific plugin | Works with `@kubb/plugin-oas` |
| **Return** | JSX/KubbNode | KubbFile.File[] or JSX |

## Tips for Migration

1. **Start Simple**: Begin with plugin options before creating custom generators
2. **Reuse Components**: Import and use existing components from `@kubb/plugin-react-query/components`
3. **Check Examples**: Review the [generators example](https://github.com/kubb-labs/kubb/tree/main/examples/generators)
4. **Use Hooks**: Leverage `useOperationManager` and `useOas` hooks for common operations
5. **Type Safely**: Always use the plugin's type (e.g., `PluginReactQuery`) for better IntelliSense
6. **Test Incrementally**: Generate with your custom generator and verify output before adding complexity

## Common Patterns

### Adding Custom Imports

```tsx
<File.Import name="{ myHelper }" path="@/utils/helpers" />
```

### Conditional Generation

```tsx
Operation({ operation, generator }) {
  // Skip operations that don't match criteria
  if (operation.method !== 'get') {
    return null
  }
  
  // Your generation logic
}
```

### Accessing Plugin Options

```tsx
Operation({ operation, generator, plugin }) {
  const { paramsCasing, dataReturnType } = plugin.options
  // Use options in your generator
}
```

### Working with Schemas

```tsx
const { getSchemas } = useOperationManager(generator)

const typeSchemas = getSchemas(operation, {
  pluginKey: ['plugin-ts'],
  type: 'type',
})

const zodSchemas = getSchemas(operation, {
  pluginKey: ['plugin-zod'],
  type: 'function',
})
```

## Troubleshooting

### Issue: Generator not being called

**Solution**: Ensure you're using `pluginOas` with your generator:

```typescript
pluginOas({
  generators: [myGenerator],
})
```

### Issue: Types not found

**Solution**: Import types from the correct package:

```typescript
import type { PluginReactQuery } from '@kubb/plugin-react-query'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
```

### Issue: Files not generated

**Solution**: Check that:
1. Your generator returns a non-null value
2. The file path is correct
3. You're not accidentally filtering out the operations you want

## Additional Resources

- [Generators Documentation](/knowledge-base/generators/)
- [Generators Example](https://github.com/kubb-labs/kubb/tree/main/examples/generators)
- [Plugin OAS Documentation](/plugins/plugin-oas/)
- [React Components](/helpers/react/)
- [Migration Guide](/getting-started/troubleshooting/)

## Need Help?

If you're stuck migrating your templates, please:

1. Share your template code
2. Describe what customization you're trying to achieve
3. Open an issue on [GitHub](https://github.com/kubb-labs/kubb/issues)

The maintainers and community are happy to help!
