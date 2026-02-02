# Resolver Architecture

> **Status**: RFC (Request for Comments)
> **Author**: Kubb Team
> **Last Updated**: 2026-02-02

## Executive Summary

This document proposes a new **Resolver** abstraction for Kubb that replaces the current `resolveName`, `resolvePath`, and `getSchemas` APIs with a unified, typesafe, and extensible system. The new architecture supports multiple languages (TypeScript, Python), flexible file organization, and easy user customization.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Design Goals](#design-goals)
3. [Core Concepts](#core-concepts)
4. [Type Definitions](#type-definitions)
5. [Plugin Integration](#plugin-integration)
6. [User Customization](#user-customization)
7. [Cross-Plugin Resolution](#cross-plugin-resolution)
8. [Implementation Examples](#implementation-examples)
9. [Migration Strategy](#migration-strategy)
10. [Appendix: Perspective Reviews](#appendix-perspective-reviews)

---

## Problem Statement

### Current Issues

1. **Scattered Resolution Logic**: Each of the 12 plugins implements nearly identical `resolveName` and `resolvePath` hooks.

2. **Awkward `type` Parameter**: The current API requires passing `type: 'file' | 'function' | 'type' | 'const'` to every resolution call:

   ```ts
   getName(operation, { type: 'function', prefix: 'use', suffix: 'suspense' })
   ```

3. **Separate `getSchemas` Helper**: Schema information is retrieved separately from name resolution:

   ```ts
   const type = {
     file: getFile(operation, { pluginKey: [pluginTsName] }),
     schemas: getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' }),
   }
   ```

4. **Limited Customization**: Users can only customize via `transformers.name`, which is a single callback for all names.

5. **Not Future-Proof**: The current design assumes TypeScript conventions (camelCase/PascalCase) and doesn't accommodate other languages.

6. **Grouping is Separate**: File grouping (by tag/path) is handled separately from naming.

---

## Design Goals

1. **Unified API**: One call to get all resolved names and file information
2. **Typesafe**: Generic output keys with full TypeScript inference
3. **Language Agnostic**: Support any language (TypeScript, Python, Go, etc.)
4. **Flexible File Locations**: Outputs can be in different files (types separate from hooks)
5. **Easy Customization**: Simple overrides with full control available
6. **Grouping Built-in**: Grouping is part of resolver logic, not a separate concept
7. **Cross-Plugin Queries**: Any plugin can query any other plugin's resolution

---

## Core Concepts

### Resolver Flow

```
┌─────────────────┐     ┌──────────────┐     ┌────────────────┐
│  Operation or   │────▶│   Resolver   │────▶│   Resolution   │
│     Schema      │     │              │     │                │
└─────────────────┘     └──────────────┘     └────────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │   Outputs    │
                                              │  (typesafe)  │
                                              └──────────────┘
```

### Key Terms

| Term | Description |
|------|-------------|
| **Resolver** | A function that takes context (operation/schema) and returns a Resolution |
| **Resolution** | Contains the default file and a map of named outputs |
| **Output** | A single artifact with a name and optional file override |
| **Output Keys** | Plugin-specific string literal union defining available outputs |

---

## Type Definitions

### Core Interfaces

```typescript
// packages/plugin-oas/src/resolvers/types.ts

import type { Operation, Oas, SchemaObject } from '@kubb/oas'
import type { Plugin, PluginFactoryOptions } from '@kubb/core'

/**
 * File location descriptor
 */
export interface FileDescriptor {
  baseName: string
  path: string
}

/**
 * A single output artifact
 */
export interface Output {
  /** The identifier used in code (e.g., "useGetPetById", "get_pet_by_id") */
  name: string
  /** Optional file override - if not set, uses Resolution.file */
  file?: FileDescriptor
}

/**
 * Resolution result - contains default file and typed outputs
 * @typeParam TOutputKeys - String literal union of output keys
 */
export interface Resolution<TOutputKeys extends string = string> {
  /** Default file for outputs that don't specify their own */
  file: FileDescriptor
  /** Named outputs with typesafe keys */
  outputs: Record<TOutputKeys, Output>
}

/**
 * Context passed to resolver functions
 */
export interface ResolverContext {
  /** The OpenAPI operation (for operation-based resolution) */
  operation?: Operation
  /** The schema (for schema-based resolution) */
  schema?: { name: string; value: SchemaObject }
  /** OpenAPI specification instance */
  oas: Oas
  /** Convenience: extracted operationId */
  operationId?: string
  /** Convenience: extracted tags */
  tags?: string[]
  /** Convenience: operation path */
  path?: string
  /** HTTP method */
  method?: string
}

/**
 * Resolver definition
 * @typeParam TOutputKeys - String literal union of output keys
 */
export interface Resolver<TOutputKeys extends string = string> {
  /** Unique name for this resolver */
  name: string
  /** Optional matcher - if returns false, resolver is skipped */
  match?: (ctx: ResolverContext) => boolean
  /** Resolution function */
  resolve: (ctx: ResolverContext) => Resolution<TOutputKeys>
}

/**
 * Resolver configuration for a plugin
 * @typeParam TOutputKeys - String literal union of output keys
 */
export interface ResolverConfig<TOutputKeys extends string = string> {
  /** Array of resolvers, executed in order until one matches */
  resolvers?: Array<Resolver<TOutputKeys>>
}
```

### Plugin-Specific Output Keys

```typescript
// packages/plugin-ts/src/resolverTypes.ts
export type TsOutputKeys =
  | 'pathParams'
  | 'queryParams'
  | 'headerParams'
  | 'request'
  | 'response'

// packages/plugin-zod/src/resolverTypes.ts
export type ZodOutputKeys =
  | 'pathParams'
  | 'queryParams'
  | 'headerParams'
  | 'request'
  | 'response'

// packages/plugin-react-query/src/resolverTypes.ts
export type ReactQueryOutputKeys =
  | 'hook'
  | 'hookSuspense'
  | 'hookInfinite'
  | 'hookSuspenseInfinite'
  | 'queryKey'
  | 'queryKeyType'
  | 'queryOptions'
  | 'mutationKey'
  | 'mutationKeyType'
  | 'mutationOptions'

// packages/plugin-client/src/resolverTypes.ts
export type ClientOutputKeys =
  | 'client'
  | 'url'

// Future: packages/plugin-python/src/resolverTypes.ts
export type PythonOutputKeys =
  | 'function'
  | 'asyncFunction'
  | 'paramsClass'
  | 'responseClass'
```

---

## Plugin Integration

### Extending PluginFactoryOptions

```typescript
// packages/core/src/types.ts

export type PluginFactoryOptions<
  TName extends string = string,
  TOptions extends object = object,
  TResolvedOptions extends object = TOptions,
  TContext = any,
  TResolvePathOptions extends object = object,
  // NEW: Output keys for this plugin
  TOutputKeys extends string = string,
> = {
  name: TName
  key: PluginKey<TName | string>
  options: TOptions
  resolvedOptions: TResolvedOptions
  context: TContext
  resolvePathOptions: TResolvePathOptions
  // NEW: Output keys type
  outputKeys: TOutputKeys
}
```

### Plugin with Resolvers

```typescript
// packages/plugin-ts/src/types.ts

import type { PluginFactoryOptions } from '@kubb/core'
import type { Resolver } from '@kubb/plugin-oas/resolvers'
import type { TsOutputKeys } from './resolverTypes'

export type Options = {
  // ... existing options ...

  /**
   * Custom resolvers for name/path resolution
   * Resolvers are executed in order; first matching resolver wins
   */
  resolvers?: Array<Resolver<TsOutputKeys>>
}

export type PluginTs = PluginFactoryOptions<
  'plugin-ts',
  Options,
  ResolvedOptions,
  never,
  ResolvePathOptions,
  TsOutputKeys  // NEW: typed output keys
>
```

### Default Resolver Factory

```typescript
// packages/plugin-oas/src/resolvers/createResolver.ts

import type { Resolver, ResolverContext, Resolution } from './types'

/**
 * Creates a typed resolver
 */
export function createResolver<TOutputKeys extends string>(
  resolver: Resolver<TOutputKeys>
): Resolver<TOutputKeys> {
  return resolver
}

/**
 * Merges custom resolvers with defaults
 * Custom resolvers have higher priority
 */
export function mergeResolvers<TOutputKeys extends string>(
  customResolvers: Array<Resolver<TOutputKeys>> | undefined,
  defaultResolvers: Array<Resolver<TOutputKeys>>
): Array<Resolver<TOutputKeys>> {
  return [...(customResolvers ?? []), ...defaultResolvers]
}

/**
 * Executes resolvers and returns first matching resolution
 */
export function executeResolvers<TOutputKeys extends string>(
  resolvers: Array<Resolver<TOutputKeys>>,
  ctx: ResolverContext
): Resolution<TOutputKeys> | null {
  for (const resolver of resolvers) {
    if (resolver.match && !resolver.match(ctx)) {
      continue
    }
    return resolver.resolve(ctx)
  }
  return null
}
```

---

## User Customization

### Custom Resolvers (Recommended Approach)

Users can provide custom resolvers that match specific patterns:

```typescript
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pascalCase, camelCase } from '@kubb/core/transformers'

export default defineConfig({
  plugins: [
    pluginReactQuery({
      resolvers: [
        // Override for admin endpoints
        {
          name: 'admin-endpoints',
          match: ({ path }) => path?.startsWith('/admin'),
          resolve: ({ operationId }) => ({
            file: {
              baseName: `use${pascalCase(operationId)}.ts`,
              path: `hooks/admin/use${pascalCase(operationId)}.ts`
            },
            outputs: {
              hook: { name: `useAdmin${pascalCase(operationId)}` },
              hookSuspense: { name: `useAdmin${pascalCase(operationId)}Suspense` },
              hookInfinite: { name: `useAdmin${pascalCase(operationId)}Infinite` },
              hookSuspenseInfinite: { name: `useAdmin${pascalCase(operationId)}SuspenseInfinite` },
              queryKey: { name: `getAdmin${pascalCase(operationId)}QueryKey` },
              queryKeyType: {
                name: `Admin${pascalCase(operationId)}QueryKey`,
                file: { baseName: 'types.ts', path: 'hooks/admin/types.ts' }
              },
              queryOptions: { name: `admin${pascalCase(operationId)}QueryOptions` },
              mutationKey: { name: `getAdmin${pascalCase(operationId)}MutationKey` },
              mutationKeyType: {
                name: `Admin${pascalCase(operationId)}MutationKey`,
                file: { baseName: 'types.ts', path: 'hooks/admin/types.ts' }
              },
              mutationOptions: { name: `admin${pascalCase(operationId)}MutationOptions` },
            }
          })
        },

        // Override hook naming convention
        {
          name: 'fetch-prefix',
          match: () => true, // matches all
          resolve: ({ operationId, tags }) => {
            const tag = tags?.[0]
            const basePath = tag ? `hooks/${camelCase(tag)}` : 'hooks'

            return {
              file: {
                baseName: `fetch${pascalCase(operationId)}.ts`,
                path: `${basePath}/fetch${pascalCase(operationId)}.ts`
              },
              outputs: {
                // Use 'fetch' prefix instead of 'use'
                hook: { name: `fetch${pascalCase(operationId)}` },
                hookSuspense: { name: `fetch${pascalCase(operationId)}Suspense` },
                // ... other outputs
              }
            }
          }
        }
      ]
    })
  ]
})
```

### Extending Default Resolver

```typescript
// kubb.config.ts
import { defaultReactQueryResolver } from '@kubb/plugin-react-query/resolvers'

export default defineConfig({
  plugins: [
    pluginReactQuery({
      resolvers: [
        {
          name: 'custom-with-defaults',
          resolve: (ctx) => {
            // Get default resolution
            const defaults = defaultReactQueryResolver.resolve(ctx)

            // Modify specific outputs
            return {
              ...defaults,
              outputs: {
                ...defaults.outputs,
                hook: {
                  name: defaults.outputs.hook.name.replace('use', 'fetch')
                },
                queryKeyType: {
                  ...defaults.outputs.queryKeyType,
                  // Put types in separate file
                  file: { baseName: 'queryTypes.ts', path: 'hooks/types/queryTypes.ts' }
                }
              }
            }
          }
        }
      ]
    })
  ]
})
```

---

## Cross-Plugin Resolution

### useResolve Hook

```typescript
// packages/plugin-oas/src/hooks/useResolve.ts

import type { Plugin } from '@kubb/core'
import { usePluginManager, usePlugin } from '@kubb/core/hooks'
import type { Resolution, ResolverContext } from '../resolvers/types'

/**
 * Hook to resolve names/files for current or other plugins
 * @typeParam TOutputKeys - Output keys type (inferred or explicit)
 */
export function useResolve<TOutputKeys extends string = string>(
  ctx: ResolverContext,
  pluginKey?: Plugin['key']
): Resolution<TOutputKeys> {
  const pluginManager = usePluginManager()
  const currentPlugin = usePlugin()

  const targetPluginKey = pluginKey ?? currentPlugin.key
  const targetPlugin = pluginManager.getPluginByKey(targetPluginKey)

  if (!targetPlugin) {
    throw new Error(`Plugin not found: ${targetPluginKey}`)
  }

  // Get resolvers from plugin options
  const resolvers = targetPlugin.options?.resolvers ?? []
  const defaultResolvers = getDefaultResolvers(targetPlugin.name)
  const allResolvers = mergeResolvers(resolvers, defaultResolvers)

  const resolution = executeResolvers(allResolvers, ctx)

  if (!resolution) {
    throw new Error(`No resolver matched for ${ctx.operationId ?? ctx.schema?.name}`)
  }

  return resolution as Resolution<TOutputKeys>
}

/**
 * Get the file for a specific output (uses output file if set, else resolution default)
 */
export function getOutputFile(
  resolution: Resolution<string>,
  outputKey: string
): FileDescriptor {
  return resolution.outputs[outputKey]?.file ?? resolution.file
}
```

### Usage in Generators

```tsx
// packages/plugin-react-query/src/generators/queryGenerator.tsx

import { useResolve, getOutputFile } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import type { TsOutputKeys } from '@kubb/plugin-ts/resolverTypes'
import type { ZodOutputKeys } from '@kubb/plugin-zod/resolverTypes'
import type { ReactQueryOutputKeys } from '../resolverTypes'

export const queryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'query',
  Operation({ operation, plugin }) {
    const oas = useOas()

    const ctx: ResolverContext = {
      operation,
      oas,
      operationId: operation.getOperationId(),
      tags: operation.getTags().map(t => t.name),
      path: operation.path,
      method: operation.method,
    }

    // Resolve for current plugin (typesafe)
    const resolved = useResolve<ReactQueryOutputKeys>(ctx)

    // Resolve from other plugins (typesafe)
    const ts = useResolve<TsOutputKeys>(ctx, [pluginTsName])
    const zod = useResolve<ZodOutputKeys>(ctx, [pluginZodName])

    // Type-safe access
    const hookName = resolved.outputs.hook.name           // TypeScript knows this exists
    const responseType = ts.outputs.response.name         // TypeScript knows this exists
    const responseSchema = zod.outputs.response.name      // TypeScript knows this exists

    // Get files for imports
    const tsFile = getOutputFile(ts, 'response')
    const zodFile = getOutputFile(zod, 'response')

    return (
      <File path={resolved.file.path} baseName={resolved.file.baseName}>
        <File.Import name={[responseType]} path={tsFile.path} isTypeOnly />
        <File.Import name={[responseSchema]} path={zodFile.path} />

        <Function name={hookName} export>
          {/* Hook implementation */}
        </Function>
      </File>
    )
  }
})
```

---

## Implementation Examples

### TypeScript Plugin Resolver

```typescript
// packages/plugin-ts/src/resolver.ts

import { createResolver } from '@kubb/plugin-oas/resolvers'
import { pascalCase, camelCase } from '@kubb/core/transformers'
import type { TsOutputKeys } from './resolverTypes'
import type { ResolverContext } from '@kubb/plugin-oas/resolvers'

export const defaultTsResolver = createResolver<TsOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags, schema }) => {
    // Handle schema resolution
    if (schema) {
      const name = pascalCase(schema.name)
      return {
        file: { baseName: `${name}.ts`, path: `types/${name}.ts` },
        outputs: {
          pathParams: { name: `${name}PathParams` },
          queryParams: { name: `${name}QueryParams` },
          headerParams: { name: `${name}HeaderParams` },
          request: { name: `${name}Request` },
          response: { name },
        }
      }
    }

    // Handle operation resolution
    const id = operationId!
    const tag = tags?.[0]
    const basePath = tag ? `types/${camelCase(tag)}` : 'types'
    const name = pascalCase(id)

    return {
      file: { baseName: `${name}.ts`, path: `${basePath}/${name}.ts` },
      outputs: {
        pathParams: { name: `${name}PathParams` },
        queryParams: { name: `${name}QueryParams` },
        headerParams: { name: `${name}HeaderParams` },
        request: { name: `${name}Request` },
        response: { name: `${name}Response` },
      }
    }
  }
})
```

### React Query Plugin Resolver

```typescript
// packages/plugin-react-query/src/resolver.ts

import { createResolver } from '@kubb/plugin-oas/resolvers'
import { pascalCase, camelCase } from '@kubb/core/transformers'
import type { ReactQueryOutputKeys } from './resolverTypes'

export const defaultReactQueryResolver = createResolver<ReactQueryOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }) => {
    const id = operationId!
    const tag = tags?.[0]
    const basePath = tag ? `hooks/${camelCase(tag)}` : 'hooks'
    const name = pascalCase(id)

    return {
      file: {
        baseName: `use${name}.ts`,
        path: `${basePath}/use${name}.ts`
      },
      outputs: {
        hook: { name: `use${name}` },
        hookSuspense: { name: `use${name}Suspense` },
        hookInfinite: { name: `use${name}Infinite` },
        hookSuspenseInfinite: { name: `use${name}SuspenseInfinite` },
        queryKey: { name: `get${name}QueryKey` },
        queryKeyType: {
          name: `${name}QueryKey`,
          // Types in separate file
          file: { baseName: 'types.ts', path: `${basePath}/types.ts` }
        },
        queryOptions: { name: `${camelCase(id)}QueryOptions` },
        mutationKey: { name: `get${name}MutationKey` },
        mutationKeyType: {
          name: `${name}MutationKey`,
          file: { baseName: 'types.ts', path: `${basePath}/types.ts` }
        },
        mutationOptions: { name: `${camelCase(id)}MutationOptions` },
      }
    }
  }
})
```

### Future: Python Plugin Resolver

```typescript
// packages/plugin-python/src/resolver.ts

import { createResolver } from '@kubb/plugin-oas/resolvers'
import { snakeCase, pascalCase } from '@kubb/core/transformers'
import type { PythonOutputKeys } from './resolverTypes'

export const defaultPythonResolver = createResolver<PythonOutputKeys>({
  name: 'default',
  resolve: ({ operationId, tags }) => {
    const id = operationId!
    const tag = tags?.[0]
    const basePath = tag ? `client/${snakeCase(tag)}` : 'client'

    return {
      file: {
        baseName: `${snakeCase(id)}.py`,
        path: `${basePath}/${snakeCase(id)}.py`
      },
      outputs: {
        function: { name: snakeCase(id) },
        asyncFunction: { name: `${snakeCase(id)}_async` },
        // Dataclass types in shared file
        paramsClass: {
          name: `${pascalCase(id)}Params`,
          file: { baseName: 'types.py', path: `${basePath}/types.py` }
        },
        responseClass: {
          name: `${pascalCase(id)}Response`,
          file: { baseName: 'types.py', path: `${basePath}/types.py` }
        },
      }
    }
  }
})
```

---

## Migration Strategy

### Phase 1: Add Infrastructure (Non-Breaking)

1. Create `packages/plugin-oas/src/resolvers/` directory
2. Add type definitions
3. Add `createResolver` factory
4. Add `useResolve` hook with fallback to existing system

### Phase 2: Reference Implementation

1. Add resolver to `plugin-ts`
2. Update `typeGenerator.tsx` to use `useResolve`
3. Verify tests pass

### Phase 3: Gradual Migration

1. Add resolvers to remaining plugins one by one
2. Update generators to use `useResolve`
3. Keep `resolveName`/`resolvePath`/`getSchemas` working via fallback

### Phase 4: Deprecation

1. Mark old APIs as deprecated with migration guide
2. Add console warnings for deprecated usage
3. Remove in next major version (v5)

### Backwards Compatibility

```typescript
// packages/plugin-oas/src/hooks/useResolve.ts

export function useResolve<TOutputKeys extends string>(
  ctx: ResolverContext,
  pluginKey?: Plugin['key']
): Resolution<TOutputKeys> {
  const plugin = getPlugin(pluginKey)

  // Check if plugin has resolvers (new system)
  if (plugin.options?.resolvers || hasDefaultResolver(plugin.name)) {
    return executeResolvers(/* ... */)
  }

  // Fallback to old system
  return legacyResolve(ctx, plugin)
}

function legacyResolve(ctx, plugin): Resolution<string> {
  // Use existing resolveName/resolvePath/getSchemas
  const name = pluginManager.resolveName({ name: ctx.operationId, pluginKey: plugin.key })
  const file = pluginManager.getFile({ name, pluginKey: plugin.key, extname: '.ts' })

  return {
    file: { baseName: file.baseName, path: file.path },
    outputs: {
      // Map old getSchemas to outputs
      ...mapSchemasToOutputs(ctx, plugin)
    }
  }
}
```

---

## Appendix: Perspective Reviews

### API Design Perspective

| Aspect | Assessment |
|--------|------------|
| Consistency | Resolvers follow same pattern as generators (operation/schema handlers) |
| Discoverability | Output keys are typed, IDE provides autocomplete |
| Error Messages | Missing outputs throw at compile time, not runtime |
| Learning Curve | Simple mental model: Resolver -> Resolution -> Outputs |

### Type Safety Perspective

| Aspect | Assessment |
|--------|------------|
| Output Keys | Generic `TOutputKeys` ensures type safety |
| Cross-Plugin | `useResolve<TsOutputKeys>(ctx, [pluginTsName])` is fully typed |
| User Resolvers | Custom resolvers must return all required output keys |
| Inference | TypeScript infers output keys from resolver definition |

### Performance Perspective

| Aspect | Assessment |
|--------|------------|
| Resolution Cost | Single resolver call per operation (vs multiple `resolveName` calls) |
| Caching | Can add optional caching layer if needed (cache by operationId) |
| Memory | Resolution objects are small, no significant impact |
| Build Time | Slightly faster due to reduced function calls |

### Migration Perspective

| Aspect | Assessment |
|--------|------------|
| Breaking Changes | None in Phase 1-3, deprecation in Phase 4 |
| Coexistence | Old and new systems work simultaneously |
| Incremental | Plugins can migrate one at a time |
| Testing | Existing tests continue to work |

### Extensibility Perspective

| Aspect | Assessment |
|--------|------------|
| New Languages | Define new output keys, casing functions, file extensions |
| New Frameworks | Same pattern applies (e.g., SolidJS, Svelte) |
| Custom Outputs | Users can add any output keys they need |
| Composability | Resolvers can extend/wrap default resolvers |

### User Experience Perspective

| Aspect | Assessment |
|--------|------------|
| Simple Cases | No config needed, defaults work out of the box |
| Customization | Single resolver can override everything |
| Partial Override | Can extend defaults and change specific outputs |
| Documentation | Typed outputs are self-documenting |

---

## Summary

The Resolver architecture provides:

1. **Unified API**: `useResolve()` replaces `getName`, `getFile`, `getSchemas`
2. **Type Safety**: Generic output keys with full TypeScript inference
3. **Flexibility**: Outputs can have different files, support any language
4. **Customization**: Custom resolvers with pattern matching
5. **Future-Proof**: Works for TypeScript, Python, or any future language
6. **Migration Path**: Non-breaking adoption with gradual migration

---

## Next Steps

1. Review this RFC with team
2. Implement Phase 1 (infrastructure)
3. Create reference implementation in plugin-ts
4. Gather feedback and iterate
