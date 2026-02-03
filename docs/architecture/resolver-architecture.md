# Resolver Architecture

> **Status**: ✅ IMPLEMENTED (Phase 1-2 Complete)
> **Author**: Kubb Team
> **Last Updated**: 2026-02-03

## Executive Summary

This document describes the **Resolver** abstraction for Kubb that replaces the current `resolveName`, `resolvePath`, and `getSchemas` APIs with a unified, typesafe, and extensible system. The new architecture supports multiple languages (TypeScript, Python), flexible file organization, and easy user customization.

**Implementation Status**: The resolver system has been implemented in `@kubb/plugin-oas` and is actively used in `@kubb/plugin-ts`. Users can now provide custom resolvers to override default naming and file resolution behavior.

**Goal**: Provide a unified, type-safe resolver system that enables users to override default naming and file organization with complete control over operation-level resolution, schema-level resolution, and cross-plugin resolution.

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
9. [Implementation Status](#implementation-status)
10. [Benefits](#benefits)
11. [Migration from Legacy APIs](#migration-from-legacy-apis)
12. [Future Enhancements](#future-enhancements)
13. [Appendix: Perspective Reviews](#appendix-perspective-reviews)

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

import type { Config, PluginFactoryOptions } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Operation, SchemaObject } from '@kubb/oas'

/**
 * A single output artifact
 */
export interface Output {
  /** The identifier used in code (e.g., "useGetPetById", "get_pet_by_id") */
  name: string
  /** Optional file override - if not set, uses Resolution.file */
  file?: KubbFile.File
}

/**
 * Resolution result - contains default file and typed outputs
 * @typeParam TOptions - PluginFactoryOptions containing outputKeys
 */
export interface Resolution<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Default file for outputs that don't specify their own */
  file: KubbFile.File
  /** Named outputs with typesafe keys */
  outputs: { default: Output } & Record<TOptions['outputKeys'], Output>
}

/**
 * Context for operation resolution
 */
export interface OperationResolverContext {
  /** The OpenAPI operation */
  operation: Operation
  /** The Kubb configuration */
  config: Config
}

/**
 * Context for schema resolution
 */
export interface SchemaResolverContext {
  /** The schema name and value */
  schema: { name: string; value: SchemaObject }
  /** The Kubb configuration */
  config: Config
}

/**
 * Core resolver interface
 */
export interface Resolver<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Unique name for this resolver */
  name: string
  /** Resolution function for operations */
  operation: (props: OperationResolverContext) => Resolution<TOptions> | null
  /** Resolution function for schemas */
  schema: (props: SchemaResolverContext) => Resolution<TOptions> | null
}

/**
 * Resolver configuration for a plugin
 */
export interface ResolverConfig<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Array of resolvers, executed in order until one matches */
  resolvers?: Array<Resolver<TOptions>>
}
```

### Plugin-Specific Output Keys

```typescript
// packages/plugin-ts/src/resolver.ts
export type ResolverOutputKeys =
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

// Future: Other plugins will define their own output keys
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
  // Output keys for this plugin
  TOutputKeys extends string = string,
> = {
  name: TName
  key: PluginKey<TName | string>
  options: TOptions
  resolvedOptions: TResolvedOptions
  context: TContext
  resolvePathOptions: TResolvePathOptions
  // Output keys type
  outputKeys: TOutputKeys
}
```

### Plugin with Resolvers

```typescript
// packages/plugin-ts/src/types.ts

import type { PluginFactoryOptions } from '@kubb/core'
import type { Resolver } from '@kubb/plugin-oas/resolvers'
import type { ResolverOutputKeys } from './resolver'

export type Options = {
  // ... existing options ...

  /**
   * Custom resolvers for name/path resolution.
   * Resolvers are executed in order; first matching resolver wins.
   * Custom resolvers have higher priority than the default resolver.
   */
  resolvers?: Array<Resolver<PluginTs>>
}

export type PluginTs = PluginFactoryOptions<
  'plugin-ts',
  Options,
  ResolvedOptions,
  never,
  ResolvePathOptions,
  ResolverOutputKeys  // Typed output keys
>
```

### Default Resolver Factory

```typescript
// packages/plugin-oas/src/resolvers/createResolver.ts

import type { PluginFactoryOptions } from '@kubb/core'
import type { OperationResolverContext, Resolution, Resolver, SchemaResolverContext } from './types'

type UserResolver<TOptions extends PluginFactoryOptions> = {
  name: string
  operation?: (props: OperationResolverContext) => Resolution<TOptions> | null
  schema?: (props: SchemaResolverContext) => Resolution<TOptions> | null
}

/**
 * Creates a typed resolver with operation and schema handlers
 */
export function createResolver<TOptions extends PluginFactoryOptions>(
  resolver: UserResolver<TOptions>
): Resolver<TOptions> {
  return {
    operation() {
      return null
    },
    schema() {
      return null
    },
    ...resolver,
  }
}

/**
 * Merges custom resolvers with defaults
 * Custom resolvers have higher priority (come first in array)
 */
export function mergeResolvers<TOptions extends PluginFactoryOptions>(
  customResolvers: Array<Resolver<TOptions>> | undefined,
  defaultResolvers: Array<Resolver<TOptions>>
): Array<Resolver<TOptions>> {
  return [...(customResolvers ?? []), ...defaultResolvers]
}

/**
 * Executes resolvers and returns first matching resolution
 */
export function executeResolvers<TOptions extends PluginFactoryOptions>(
  resolvers: Array<Resolver<TOptions>>,
  props: SchemaResolverContext | OperationResolverContext
): Resolution<TOptions> | null {
  if ('schema' in props) {
    for (const resolver of resolvers) {
      const result = resolver.schema(props)
      if (result) {
        return result
      }
    }
  }

  if ('operation' in props) {
    for (const resolver of resolvers) {
      const result = resolver.operation(props)
      if (result) {
        return result
      }
    }
  }

  return null
}
```

---

## User Customization

### Custom Resolvers (Recommended Approach)

Users can provide custom resolvers to override default naming and file organization:

```typescript
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pascalCase, camelCase } from '@kubb/core/transformers'

export default defineConfig({
  plugins: [
    pluginTs({
      resolvers: [
        {
          name: 'custom-naming',
          operation: ({ operation, config }) => {
            const operationId = operation.getOperationId()
            const tags = operation.getTags()
            const tag = tags[0]?.name
            
            // Custom file organization
            const baseName = `${pascalCase(operationId, { isFile: true })}.ts`
            const path = tag 
              ? `types/${camelCase(tag)}/${baseName}`
              : `types/${baseName}`

            const file = {
              baseName,
              path,
              imports: [],
              exports: [],
              sources: [],
              meta: {},
            }

            // Custom naming convention
            const name = pascalCase(operationId)

            return {
              file,
              outputs: {
                default: { name, file },
                type: { name, file },
                enum: { name: `${name}Key`, file },
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
            // Custom schema naming
            const name = pascalCase(schema.name)
            const baseName = `${name}.ts`
            
            const file = {
              baseName,
              path: `types/${baseName}`,
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
                // Other outputs not used for schemas
                query: { name: '', file },
                mutation: { name: '', file },
                pathParams: { name: '', file },
                queryParams: { name: '', file },
                headerParams: { name: '', file },
                request: { name: '', file },
                response: { name: '', file },
                responses: { name: '', file },
                responseData: { name: '', file },
              }
            }
          }
        }
      ]
    })
  ]
})
```

### Partial Customization

You can also customize specific aspects while delegating to the default resolver:

```typescript
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { pluginTs, createTsResolver } from '@kubb/plugin-ts'

export default defineConfig({
  plugins: [
    pluginTs({
      resolvers: [
        {
          name: 'custom-admin-paths',
          operation: ({ operation, config }) => {
            // Only customize admin endpoints
            const path = operation.path
            if (!path?.startsWith('/admin')) {
              // Return null to fall through to default resolver
              return null
            }

            // Get default resolution
            const defaultResolver = createTsResolver({
              outputPath: 'types',
            })
            const defaults = defaultResolver.operation({ operation, config })

            if (!defaults) return null

            // Modify only the file path
            return {
              ...defaults,
              file: {
                ...defaults.file,
                path: defaults.file.path.replace('types/', 'types/admin/'),
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

### Conditional Customization

```typescript
// Only customize specific paths
pluginTs({
  resolvers: [
    {
      name: 'admin-customization',
      operation: ({ operation, config }) => {
        // Only apply to admin endpoints
        if (!operation.path.startsWith('/admin')) {
          return null // Fall through to default resolver
        }

        // Custom logic for admin endpoints
        const operationId = operation.getOperationId()
        const name = `Admin${pascalCase(operationId)}`
        
        const file = {
          baseName: `${name}.ts`,
          path: `${config.root}/${config.output.path}/types/admin/${name}.ts`,
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
            enum: { name: `${name}Enum`, file },
            query: { name: `${name}Query`, file },
            mutation: { name: `${name}Mutation`, file },
            pathParams: { name: `${name}Path`, file },
            queryParams: { name: `${name}Query`, file },
            headerParams: { name: `${name}Headers`, file },
            request: { name: `${name}Req`, file },
            response: { name: `${name}Res`, file },
            responses: { name: `${name}Responses`, file },
            responseData: { name: `${name}Data`, file },
          }
        }
      },
      schema: () => null
    }
  ]
})
```

### Using createTsResolver for Partial Customization

```typescript
import { pluginTs, createTsResolver } from '@kubb/plugin-ts'

pluginTs({
  resolvers: [
    {
      name: 'partial-custom',
      operation: ({ operation, config }) => {
        // Get default resolution
        const defaultResolver = createTsResolver({
          outputPath: 'types',
        })
        const defaults = defaultResolver.operation({ operation, config })

        if (!defaults) return null

        // Only change the request/response naming
        return {
          ...defaults,
          outputs: {
            ...defaults.outputs,
            request: {
              name: defaults.outputs.request.name.replace('Request', 'Req'),
              file: defaults.file
            },
            response: {
              name: defaults.outputs.response.name.replace('Response', 'Res'),
              file: defaults.file
            }
          }
        }
      },
      schema: () => null
    }
  ]
})
```

---

## Cross-Plugin Resolution

### useResolve Hook

```typescript
// packages/plugin-oas/src/hooks/useResolve.ts

import type { Plugin, PluginFactoryOptions } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import type { OperationResolverContext, Resolution, SchemaResolverContext } from '../resolvers/types'

/**
 * Hook to resolve names/files for schemas/operation in current or other plugins
 */
export function useResolve<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  ctx: Omit<SchemaResolverContext, 'config'> | Omit<OperationResolverContext, 'config'>,
  pluginName?: Plugin['name'],
): Resolution<TOptions> | null {
  const pluginManager = usePluginManager()
  const currentPlugin = usePlugin()
  const config = pluginManager.config

  // When pluginName is not provided, use the current plugin directly
  // to ensure multi-instance plugins resolve to the correct instance
  const plugin = pluginName ? pluginManager.getPlugin(pluginName) : currentPlugin

  if (!plugin) {
    // Plugin not found, return null to allow fallback to legacy resolution
    return null
  }

  // Get resolvers from plugin (top-level property defined in @kubb/core)
  const resolvers = (plugin.resolvers ?? []) as Array<Resolver<TOptions>>

  // If no resolvers available, return null (caller should use fallback)
  if (resolvers.length === 0) {
    return null
  }

  if ('schema' in ctx) {
    for (const resolver of resolvers) {
      const result = resolver.schema({ ...ctx, config })
      if (result) {
        return result
      }
    }
  }

  if ('operation' in ctx) {
    for (const resolver of resolvers) {
      const result = resolver.operation({ ...ctx, config })
      if (result) {
        return result
      }
    }
  }

  return null
}

/**
 * Get the file for a specific output (uses output file if set, else resolution default)
 */
export function getOutputFile<TOptions extends PluginFactoryOptions>(
  resolution: Resolution<TOptions>,
  outputKey: string
): KubbFile.File {
  const output = resolution.outputs[outputKey as keyof typeof resolution.outputs]
  return output?.file ?? resolution.file
}
```

### Usage in Generators

```tsx
// packages/plugin-ts/src/generators/typeGenerator.tsx

import { useResolve } from '@kubb/plugin-oas/hooks'
import type { PluginTs } from '../types'

export const typeGenerator = createReactGenerator<PluginTs>({
  name: 'type',
  Operation({ operation }) {
    // Resolve for current plugin (typesafe)
    const resolution = useResolve<PluginTs>({ operation })

    if (!resolution) {
      // Fallback to legacy resolution if needed
      return null
    }

    // Type-safe access to outputs
    const typeName = resolution.outputs.type.name
    const pathParamsName = resolution.outputs.pathParams.name
    const queryParamsName = resolution.outputs.queryParams.name
    const requestName = resolution.outputs.request.name
    const responseName = resolution.outputs.response.name

    return (
      <File path={resolution.file.path} baseName={resolution.file.baseName}>
        <Type name={typeName} export>
          {/* Type implementation */}
        </Type>
      </File>
    )
  },
  
  Schema({ schema }) {
    // Resolve for schemas
    const resolution = useResolve<PluginTs>({ schema })

    if (!resolution) {
      return null
    }

    const typeName = resolution.outputs.type.name

    return (
      <File path={resolution.file.path} baseName={resolution.file.baseName}>
        <Type name={typeName} export>
          {/* Type implementation */}
        </Type>
      </File>
    )
  }
})
```

### Cross-Plugin Usage Example

```tsx
// Future: packages/plugin-react-query/src/generators/queryGenerator.tsx

import { useResolve } from '@kubb/plugin-oas/hooks'
import { pluginTsName, type PluginTs } from '@kubb/plugin-ts'
import type { PluginReactQuery } from '../types'

export const queryGenerator = createReactGenerator<PluginReactQuery>({
  name: 'query',
  Operation({ operation }) {
    // Resolve from TypeScript plugin for type imports
    const tsResolution = useResolve<PluginTs>({ operation }, pluginTsName)
    
    // Resolve for current plugin
    const resolution = useResolve<PluginReactQuery>({ operation })

    if (!resolution || !tsResolution) {
      return null
    }

    const hookName = resolution.outputs.hook.name
    const responseType = tsResolution.outputs.response.name

    return (
      <File path={resolution.file.path} baseName={resolution.file.baseName}>
        <File.Import 
          name={[responseType]} 
          path={tsResolution.file.path} 
          isTypeOnly 
        />

        <Function name={hookName} export>
          {/* Hook implementation using responseType */}
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

import { resolve } from 'node:path'
import { type Group, getMode } from '@kubb/core'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createResolver, type Output } from '@kubb/plugin-oas/resolvers'
import type { PluginTs } from './types'

type Options = {
  outputPath?: string
  group?: Group
  transformName?: (name: string, type?: 'file' | 'function' | 'type' | 'const') => string
}

/**
 * Output keys for the TypeScript plugin
 */
export type ResolverOutputKeys =
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

/**
 * Creates a TypeScript resolver with the given options
 */
export function createTsResolver(options: Options = {}) {
  const { outputPath = 'types', group, transformName } = options

  return createResolver<PluginTs>({
    name: 'default-ts',
    operation: ({ config, operation }) => {
      const root = resolve(config.root, config.output.path, outputPath)
      const operationId = operation.getOperationId()
      const tags = operation.getTags()
      const tag = tags[0]?.name
      const path = operation.path

      const baseName = `${transformName?.(pascalCase(operationId, { isFile: true }), 'file') || pascalCase(operationId, { isFile: true })}.ts` as const

      function resolvePath() {
        const mode = getMode(root)

        if (mode === 'single') {
          return root
        }

        if (group && (path || tag)) {
          const groupValue = group.type === 'path' ? path : tag

          if (groupValue) {
            const groupName = group.name
              ? group.name({ group: groupValue })
              : group.type === 'path'
                ? (groupValue.split('/')[1] ?? groupValue)
                : `${camelCase(groupValue)}Controller`

            return resolve(root, groupName, baseName)
          }
        }

        return resolve(root, baseName)
      }

      function resolveName(suffix: string) {
        const operationName = pascalCase(operationId)
        const name = suffix ? `${operationName}${suffix}` : operationName
        return transformName?.(name, 'type') || name
      }

      const file: KubbFile.File = {
        baseName,
        path: resolvePath(),
        imports: [],
        exports: [],
        sources: [],
        meta: {},
      }

      // Dynamic outputs for status codes
      const statusCodes = operation.getResponseStatusCodes()
      const statusCodeOutputs = statusCodes.reduce<Record<string, Output>>((acc, statusCode) => {
        const suffix = statusCode === 'default' ? 'Default' : `Status${statusCode}`
        acc[statusCode] = { name: resolveName(suffix), file }
        return acc
      }, {})

      return {
        file,
        outputs: {
          default: { name: resolveName(''), file },
          ...statusCodeOutputs,
          type: { name: resolveName(''), file },
          enum: { name: resolveName('Key'), file },
          query: { name: resolveName('Query'), file },
          mutation: { name: resolveName('Mutation'), file },
          pathParams: { name: resolveName('PathParams'), file },
          queryParams: { name: resolveName('QueryParams'), file },
          headerParams: { name: resolveName('HeaderParams'), file },
          request: { name: resolveName('Request'), file },
          response: { name: resolveName('Response'), file },
          responses: { name: resolveName('Responses'), file },
          responseData: { name: resolveName('ResponseData'), file },
        },
      }
    },
    schema: ({ config, schema }) => {
      const root = resolve(config.root, config.output.path, outputPath)
      const baseName = `${transformName?.(pascalCase(schema.name, { isFile: true }), 'file') || pascalCase(schema.name, { isFile: true })}.ts` as const

      function resolvePath() {
        const mode = getMode(root)
        return mode === 'single' ? root : resolve(root, baseName)
      }

      function resolveName(suffix: string) {
        const schemaName = pascalCase(schema.name)
        const name = suffix ? `${schemaName}${suffix}` : schemaName
        return transformName?.(name, 'type') || name
      }

      const file: KubbFile.File = {
        baseName,
        path: resolvePath(),
        imports: [],
        exports: [],
        sources: [],
        meta: {},
      }

      return {
        file,
        outputs: {
          default: { name: resolveName(''), file },
          type: { name: resolveName(''), file },
          enum: { name: resolveName('Key'), file },
          query: { name: '', file },
          mutation: { name: '', file },
          pathParams: { name: '', file },
          queryParams: { name: '', file },
          headerParams: { name: '', file },
          request: { name: '', file },
          response: { name: '', file },
          responses: { name: '', file },
          responseData: { name: '', file },
        },
      }
    },
  })
}
```

### Plugin Setup

```typescript
// packages/plugin-ts/src/plugin.ts

import { definePlugin } from '@kubb/core'
import { mergeResolvers } from '@kubb/plugin-oas/resolvers'
import { createTsResolver } from './resolver'
import type { PluginTs } from './types'

export const pluginTs = definePlugin<PluginTs>((options) => {
  const {
    output = { path: 'types', barrelType: 'named' },
    group,
    transformers = {},
    resolvers,
  } = options

  // Create default resolver with plugin options
  const defaultResolver = createTsResolver({
    outputPath: output.path,
    group,
    transformName: transformers?.name,
  })

  return {
    name: 'plugin-ts',
    options: {
      output,
      transformers,
      group,
      // ... other options
    },
    // Merge custom resolvers with default (custom resolvers have priority)
    resolvers: mergeResolvers(resolvers, [defaultResolver]),
    // ... other plugin lifecycle methods
  }
})
```

---

## Implementation Status

### ✅ Phase 1: Infrastructure (COMPLETE)
- [x] Created `packages/plugin-oas/src/resolvers/` directory
- [x] Added type definitions (`types.ts`)
- [x] Added `createResolver` factory (`createResolver.ts`)
- [x] Added `mergeResolvers` and `executeResolvers` utilities
- [x] Added `useResolve` hook (`hooks/useResolve.ts`)
- [x] Full TypeScript type safety with generics

### ✅ Phase 2: TypeScript Plugin (COMPLETE)
- [x] Created `createTsResolver` function
- [x] Defined `ResolverOutputKeys` type
- [x] Implemented `operation` handler with grouping support
- [x] Implemented `schema` handler
- [x] Integrated resolver in plugin setup
- [x] Updated `typeGenerator.tsx` to use `useResolve`
- [x] Updated plugin types to include `resolvers` option
- [x] All tests passing (138 tests in plugin-ts)

### 🔄 Phase 3: Other Plugins (PLANNED)
- [ ] Add resolver to `plugin-zod`
- [ ] Add resolver to `plugin-client`
- [ ] Add resolver to `plugin-react-query`
- [ ] Add resolver to `plugin-vue-query`
- [ ] Add resolver to `plugin-solid-query`
- [ ] Add resolver to `plugin-svelte-query`
- [ ] Add resolver to `plugin-swr`
- [ ] Add resolver to `plugin-faker`
- [ ] Add resolver to `plugin-msw`

### 📝 Phase 4: Documentation (IN PROGRESS)
- [x] Architecture documentation (`resolver-architecture.md`)
- [ ] User guide in `docs/guide/` directory
- [ ] Update plugin-ts documentation with resolver examples
- [ ] Add resolver examples to other plugin docs
- [ ] Update migration guide

### 🔮 Phase 5: Deprecation (FUTURE - v5.0.0)
- [ ] Mark `resolveName` as deprecated
- [ ] Mark `resolvePath` as deprecated
- [ ] Add console warnings for deprecated usage
- [ ] Update all documentation
- [ ] Plan removal for v5.0.0

---

## Benefits

### For Users

1. **Complete Control**: Override any aspect of naming or file organization
2. **Type Safety**: TypeScript autocomplete for all output keys
3. **Conditional Logic**: Apply different rules based on operation path, tags, or other criteria
4. **Incremental Adoption**: Custom resolvers coexist with default resolver
5. **No Breaking Changes**: Existing configs continue to work

### For Plugin Developers

1. **Single Source of Truth**: One resolver provides all names
2. **Reduced Boilerplate**: No need to implement `resolveName`/`resolvePath` separately
3. **Type Safety**: Compiler ensures all output keys are provided
4. **Testability**: Easy to unit test resolver logic
5. **Composability**: Resolvers can build on other resolvers

### For the Kubb Ecosystem

1. **Consistency**: All plugins use the same resolver pattern
2. **Extensibility**: Easy to add new output types
3. **Future-Proof**: Supports any language or framework
4. **Performance**: Single resolver execution vs. multiple function calls
5. **Documentation**: Self-documenting through TypeScript types

---

## Migration from Legacy APIs

### Before (Using transformers.name)

```typescript
pluginTs({
  transformers: {
    name: (name, type) => {
      if (type === 'type') {
        return `I${name}` // Add "I" prefix to types
      }
      return name
    }
  }
})
```

**Limitations**:
- Only affects names, not file paths
- Single callback for all operations and schemas
- No access to operation context (path, tags, etc.)
- Can't specify different files for different outputs

### After (Using Resolvers)

```typescript
pluginTs({
  resolvers: [
    {
      name: 'interface-prefix',
      operation: ({ operation, config }) => {
        const defaultResolver = createTsResolver({ outputPath: 'types' })
        const defaults = defaultResolver.operation({ operation, config })
        
        if (!defaults) return null

        // Add "I" prefix to all type names
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

**Benefits**:
- Full control over names AND file paths
- Access to operation/schema context
- Can specify different files for different outputs
- Can apply different logic per operation/schema

### Backwards Compatibility

The system is designed with full backwards compatibility:

```typescript
// packages/plugin-oas/src/hooks/useResolve.ts

export function useResolve<TOptions extends PluginFactoryOptions>(
  ctx: Omit<SchemaResolverContext, 'config'> | Omit<OperationResolverContext, 'config'>,
  pluginName?: Plugin['name'],
): Resolution<TOptions> | null {
  const plugin = getPlugin(pluginName)

  // Check if plugin has resolvers (new system)
  if (plugin.resolvers && plugin.resolvers.length > 0) {
    return executeResolvers(plugin.resolvers, ctx)
  }

  // Return null - caller should use fallback to legacy system
  return null
}
```

Legacy code continues to work:
```typescript
// Old way (still works)
const name = pluginManager.resolveName({ name: operation.id, pluginKey: [pluginTsName] })
const file = pluginManager.getFile({ name, pluginKey: [pluginTsName] })

// New way (preferred)
const resolution = useResolve<PluginTs>({ operation })
const name = resolution?.outputs.type.name ?? fallback
const file = resolution?.file ?? fallback
```

---

## Future Enhancements

### Planned Features

1. **Resolver Composition**: Combine multiple resolvers easily
   ```typescript
   const myResolver = composeResolvers(
     prefixResolver('I'),
     groupByTagResolver(),
     customPathResolver()
   )
   ```

2. **Resolver Helpers**: Pre-built resolvers for common patterns
   ```typescript
   import { prefixResolver, suffixResolver, groupByTagResolver } from '@kubb/plugin-oas/resolvers'
   
   pluginTs({
     resolvers: [
       prefixResolver('I'),
       suffixResolver('DTO'),
       groupByTagResolver()
     ]
   })
   ```

3. **Caching**: Optional caching layer for performance
   ```typescript
   const cachedResolver = withCache(myResolver)
   ```

4. **Debug Mode**: Detailed logging for resolver execution
   ```typescript
   pluginTs({
     resolvers: [withDebug(myResolver)]
   })
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

1. **✅ Unified API**: `useResolve()` replaces `getName`, `getFile`, `getSchemas` - IMPLEMENTED
2. **✅ Type Safety**: Generic output keys with full TypeScript inference - IMPLEMENTED
3. **✅ Flexibility**: Outputs can have different files, support any language - IMPLEMENTED
4. **✅ Customization**: Custom resolvers with pattern matching - IMPLEMENTED
5. **🔄 Future-Proof**: Works for TypeScript (done), Python, or any future language - PARTIAL
6. **✅ Migration Path**: Non-breaking adoption with gradual migration - IMPLEMENTED

### Current Status

**Implemented:**
- Core resolver infrastructure in `@kubb/plugin-oas`
- TypeScript plugin (`@kubb/plugin-ts`) uses resolvers
- Users can provide custom resolvers via plugin options
- Generators use `useResolve` hook for type-safe resolution
- Full backwards compatibility with legacy APIs

**In Progress:**
- Migration of remaining plugins to resolver system
- Cross-plugin resolution patterns
- Documentation for users

**Future:**
- Deprecation of legacy `resolveName`/`resolvePath` APIs
- Support for additional languages (Python, Go, etc.)
- Advanced resolver features (caching, composition)

---

## Next Steps

### For Plugin Developers

1. **Use the resolver system** in your generators:
   ```typescript
   const resolution = useResolve<PluginTs>({ operation })
   const typeName = resolution?.outputs.type.name
   ```

2. **Provide default resolvers** in your plugin:
   ```typescript
   export const pluginMyPlugin = definePlugin((options) => {
     const defaultResolver = createMyResolver(options)
     return {
       resolvers: mergeResolvers(options.resolvers, [defaultResolver]),
     }
   })
   ```

### For Users

1. **Override default naming** via custom resolvers:
   ```typescript
   pluginTs({
     resolvers: [{ name: 'custom', operation: () => { /* ... */ } }]
   })
   ```

2. **Migrate from transformers.name** to resolvers for more control

### For Contributors

1. Add resolvers to remaining plugins (`plugin-zod`, `plugin-client`, etc.)
2. Update plugin documentation with resolver examples
3. Create migration guide for v4 → v5
4. Add resolver composition utilities
5. Consider caching layer for performance
