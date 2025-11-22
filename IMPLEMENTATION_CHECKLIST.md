# Implementation Checklist: Class-Based Client Generation

This document provides a detailed checklist of all changes needed to implement class-based client generation.

## Phase 1: Type Definitions

### ✅ File: `packages/plugin-client/src/types.ts`

**Changes:**
1. Add new options to `Options` type
2. Add to `ResolvedOptions` type

```typescript
export type Options = {
  // ... existing options ...
  
  /**
   * Generate a class-based client instead of standalone functions.
   * When enabled, all operations will be methods of a class.
   * @default false
   */
  classMode?: boolean
  
  /**
   * Name of the generated class (only used when classMode is true).
   * Can be a string or a function that returns a string based on context.
   * @default 'ApiClient' or (ctx) => `${ctx.group}Client` when grouped
   */
  className?: string | ((context: { group?: string }) => string)
}

type ResolvedOptions = {
  // ... existing options ...
  classMode: NonNullable<Options['classMode']>
  className: Options['className']
}
```

## Phase 2: Plugin Configuration

### ✅ File: `packages/plugin-client/src/plugin.ts`

**Changes:**
1. Destructure new options
2. Update generator selection logic
3. Pass options to resolved options

```typescript
export const pluginClient = definePlugin<PluginClient>((options) => {
  const {
    // ... existing options ...
    classMode = false,
    className,
    generators = [
      classMode ? classClientGenerator : clientGenerator,
      group && !classMode ? groupedClientGenerator : undefined,
      operations ? operationsGenerator : undefined
    ].filter(Boolean),
  } = options

  return {
    name: pluginClientName,
    options: {
      // ... existing options ...
      classMode,
      className,
    },
    // ... rest of plugin ...
  }
})
```

**Import addition:**
```typescript
import { classClientGenerator } from './generators/classClientGenerator.tsx'
```

## Phase 3: Class Client Generator

### ✅ File: `packages/plugin-client/src/generators/classClientGenerator.tsx` (NEW)

**Create new file with:**

```typescript
import path from 'node:path'
import { usePluginManager } from '@kubb/core/hooks'
import { camelCase } from '@kubb/core/transformers'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { useOas, useOperationManager } from '@kubb/plugin-oas/hooks'
import { getBanner, getFooter } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File } from '@kubb/react-fabric'
import { ClassClient } from '../components/ClassClient'
import type { PluginClient } from '../types'

export const classClientGenerator = createReactGenerator<PluginClient>({
  name: 'classClient',
  Operations({ operations, generator, plugin, config }) {
    const { options, key: pluginKey } = plugin
    const pluginManager = usePluginManager()
    const oas = useOas()
    const { getFile, getGroup } = useOperationManager(generator)

    // Group operations by tag if group option is set
    if (options.group?.type === 'tag') {
      const controllers = operations.reduce(
        (acc, operation) => {
          const group = getGroup(operation)
          const defaultName = group?.tag ? `${camelCase(group.tag)}Client` : 'ApiClient'
          const name = options.className
            ? typeof options.className === 'function'
              ? options.className({ group: group?.tag })
              : options.className
            : defaultName

          if (!group?.tag) {
            return acc
          }

          const file = pluginManager.getFile({
            name,
            extname: '.ts',
            pluginKey,
            options: { group },
          })

          const previousController = acc.find((item) => item.file.path === file.path)

          if (previousController) {
            previousController.operations.push(operation)
          } else {
            acc.push({ name, file, operations: [operation] })
          }

          return acc
        },
        [] as Array<{ name: string; file: KubbFile.File; operations: Array<Operation> }>,
      )

      return controllers.map(({ name, file, operations: groupedOperations }) => (
        <File
          key={file.path}
          baseName={file.baseName}
          path={file.path}
          meta={file.meta}
          banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
          footer={getFooter({ oas, output: options.output })}
        >
          <ClassClient name={name} operations={groupedOperations} plugin={plugin} config={config} generator={generator} />
        </File>
      ))
    }

    // Single class for all operations
    const defaultName = 'ApiClient'
    const name = options.className
      ? typeof options.className === 'function'
        ? options.className({})
        : options.className
      : defaultName

    const file = pluginManager.getFile({
      name,
      extname: '.ts',
      pluginKey,
    })

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={getBanner({ oas, output: options.output, config: pluginManager.config })}
        footer={getFooter({ oas, output: options.output })}
      >
        <ClassClient name={name} operations={operations} plugin={plugin} config={config} generator={generator} />
      </File>
    )
  },
})
```

## Phase 4: Class Client Component

### ✅ File: `packages/plugin-client/src/components/ClassClient.tsx` (NEW)

**Create new file with:**

```typescript
import path from 'node:path'
import { File } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'
import type { Operation } from '@kubb/oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import type { PluginClient } from '../types'
import { ClassMethod } from './ClassMethod'

type Props = {
  name: string
  operations: Array<Operation>
  plugin: PluginClient
  config: any
  generator: any
}

export function ClassClient({ name, operations, plugin, config, generator }: Props): KubbNode {
  const { options } = plugin
  const { getFile, getSchemas } = useOperationManager(generator)

  // Collect all imports needed
  const imports = new Set<string>()
  const typeImports = new Set<string>()

  operations.forEach((operation) => {
    const typeSchemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
    const zodSchemas = options.parser === 'zod' ? getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }) : undefined

    if (typeSchemas.request?.name) typeImports.add(typeSchemas.request.name)
    if (typeSchemas.response?.name) typeImports.add(typeSchemas.response.name)
    if (typeSchemas.pathParams?.name) typeImports.add(typeSchemas.pathParams.name)
    if (typeSchemas.queryParams?.name) typeImports.add(typeSchemas.queryParams.name)
    if (typeSchemas.headerParams?.name) typeImports.add(typeSchemas.headerParams.name)
    typeSchemas.statusCodes?.forEach((item) => typeImports.add(item.name))

    if (zodSchemas?.request?.name) imports.add(zodSchemas.request.name)
    if (zodSchemas?.response?.name) imports.add(zodSchemas.response.name)
  })

  const typeFile = getFile(operations[0], { pluginKey: [pluginTsName] })
  const zodFile = options.parser === 'zod' ? getFile(operations[0], { pluginKey: [pluginZodName] }) : undefined

  return (
    <>
      {/* Imports */}
      {options.importPath ? (
        <>
          <File.Import name={'fetch'} path={options.importPath} />
          <File.Import name={['RequestConfig', 'ResponseErrorConfig']} path={options.importPath} isTypeOnly />
        </>
      ) : (
        <>
          <File.Import name={['fetch']} root={config.root} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} />
          <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={config.root} path={path.resolve(config.root, config.output.path, '.kubb/fetch.ts')} isTypeOnly />
        </>
      )}

      <File.Import name={['buildFormData']} root={config.root} path={path.resolve(config.root, config.output.path, '.kubb/config.ts')} />

      {zodFile && imports.size > 0 && (
        <File.Import name={Array.from(imports)} root={config.root} path={zodFile.path} />
      )}

      {typeImports.size > 0 && (
        <File.Import name={Array.from(typeImports)} root={config.root} path={typeFile.path} isTypeOnly />
      )}

      {/* Class definition */}
      <File.Source name={name} isExportable isIndexable>
        {`/**
 * ${name}
 * @class
 */
export class ${name} {
  private client: typeof fetch
  private baseConfig: Partial<RequestConfig>

  constructor(config: Partial<RequestConfig> = {}) {
    this.client = config.client || fetch
    this.baseConfig = config
  }
`}

        {operations.map((operation) => (
          <ClassMethod
            key={operation.getOperationId()}
            operation={operation}
            plugin={plugin}
            generator={generator}
          />
        ))}

        {`
  /**
   * Merge base config with method-specific config
   * @private
   */
  private mergeConfig(config: Partial<RequestConfig>): Partial<RequestConfig> {
    return {
      ...this.baseConfig,
      ...config,
      headers: {
        ...this.baseConfig.headers,
        ...config.headers,
      },
    }
  }
}
`}
      </File.Source>
    </>
  )
}
```

## Phase 5: Class Method Component

### ✅ File: `packages/plugin-client/src/components/ClassMethod.tsx` (NEW)

**Create new file with:**

```typescript
import { URLPath } from '@kubb/core/utils'
import { isOptional } from '@kubb/oas'
import type { Operation } from '@kubb/oas'
import { useOperationManager } from '@kubb/plugin-oas/hooks'
import { getComments } from '@kubb/plugin-oas/utils'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import type { KubbNode } from '@kubb/react-fabric/types'
import { Client } from './Client'
import type { PluginClient } from '../types'

type Props = {
  operation: Operation
  plugin: PluginClient
  generator: any
}

export function ClassMethod({ operation, plugin, generator }: Props): KubbNode {
  const { options } = plugin
  const { getSchemas, getName } = useOperationManager(generator)

  const name = getName(operation, { type: 'function' })
  const typeSchemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
  const zodSchemas = options.parser === 'zod' ? getSchemas(operation, { pluginKey: [pluginZodName], type: 'function' }) : undefined

  const path = new URLPath(operation.path, { casing: options.paramsCasing })
  const contentType = operation.getContentType()
  const isFormData = contentType === 'multipart/form-data'
  
  const headers = [
    contentType !== 'application/json' && contentType !== 'multipart/form-data' ? `'Content-Type': '${contentType}'` : undefined,
    typeSchemas.headerParams?.name ? '...headers' : undefined,
  ].filter(Boolean)

  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`
  const generics = [typeSchemas.response.name, TError, typeSchemas.request?.name || 'unknown'].filter(Boolean)

  const params = Client.getParams({
    paramsType: options.paramsType,
    paramsCasing: options.paramsCasing,
    pathParamsType: options.pathParamsType,
    typeSchemas,
    isConfigurable: true,
  })

  const comments = getComments(operation)
  const jsdoc = comments.length > 0 ? `
  /**
${comments.map((comment) => `   * ${comment}`).join('\n')}
   */` : ''

  return (
    <>
      {jsdoc}
      {`
  async ${name}(${params.toConstructor()}): Promise<${typeSchemas.response.name}> {
    const mergedConfig = this.mergeConfig(config)
    
`}
      {options.parser === 'zod' && zodSchemas?.request?.name && `    const requestData = ${zodSchemas.request.name}.parse(data)\n`}
      {options.parser === 'client' && typeSchemas?.request?.name && '    const requestData = data\n'}
      {isFormData && '    const formData = buildFormData(requestData)\n'}
      {`
    const res = await this.client<${generics.join(', ')}>({
      method: '${operation.method.toUpperCase()}',
      url: ${path.template},`}
      {options.baseURL && `\n      baseURL: '${options.baseURL}',`}
      {typeSchemas.queryParams?.name && '\n      params,'}
      {typeSchemas.request?.name && `\n      data: ${isFormData ? 'formData as FormData' : 'requestData'},`}
      {headers.length > 0 && `\n      headers: { ${headers.join(', ')} },`}
      {`
      ...mergedConfig,
    })
    
`}
      {options.dataReturnType === 'full' && options.parser === 'zod' && zodSchemas && `    return { ...res, data: ${zodSchemas.response.name}.parse(res.data) }\n`}
      {options.dataReturnType === 'data' && options.parser === 'zod' && zodSchemas && `    return ${zodSchemas.response.name}.parse(res.data)\n`}
      {options.dataReturnType === 'full' && options.parser === 'client' && '    return res\n'}
      {options.dataReturnType === 'data' && options.parser === 'client' && '    return res.data\n'}
      {'  }\n'}
    </>
  )
}
```

## Phase 6: Export Updates

### ✅ File: `packages/plugin-client/src/components/index.ts`

**Add exports:**
```typescript
export * from './Client.tsx'
export * from './Operations.tsx'
export * from './Url.tsx'
export * from './ClassClient.tsx'  // NEW
export * from './ClassMethod.tsx'  // NEW
```

### ✅ File: `packages/plugin-client/src/generators/index.ts`

**Add export:**
```typescript
export * from './clientGenerator.tsx'
export * from './groupedClientGenerator.tsx'
export * from './operationsGenerator.tsx'
export * from './classClientGenerator.tsx'  // NEW
```

## Phase 7: Tests

### ✅ File: `packages/plugin-client/src/generators/classClientGenerator.test.tsx` (NEW)

**Create test file:**
```typescript
import { mockedPluginManager } from '@kubb/core/mocks'
import { createRootServer } from '@kubb/react-fabric/server'
import { Oas } from '@kubb/plugin-oas/oas'
import { OperationGenerator } from '@kubb/plugin-oas'
import { classClientGenerator } from './classClientGenerator'
import type { Plugin } from '@kubb/core'
import type { PluginClient } from '../types'

describe('classClientGenerator', () => {
  test('should generate a class with methods', async () => {
    const oas = await Oas.parseFromConfig({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'petStore.yaml' },
    })

    const options: PluginClient['resolvedOptions'] = {
      classMode: true,
      className: 'PetStoreClient',
      client: 'axios',
      dataReturnType: 'data',
      // ... other required options
    }

    const plugin: Plugin<PluginClient> = {
      name: 'plugin-client',
      options,
      // ... other plugin properties
    }

    const og = new OperationGenerator(options, {
      oas,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      exclude: [],
      include: undefined,
      override: undefined,
      mode: 'split',
    })

    const files = await og.build(classClientGenerator)

    expect(files).toMatchSnapshot()
  })

  test('should generate multiple classes when grouped by tag', async () => {
    // Test with group option
  })

  test('should work with zod parser', async () => {
    // Test with parser: 'zod'
  })

  test('should work with object params', async () => {
    // Test with paramsType: 'object'
  })
})
```

### ✅ File: `packages/plugin-client/src/generators/__snapshots__/classClient.ts` (NEW)

**Create snapshot file** (will be auto-generated by tests)

## Phase 8: Documentation

### ✅ File: `docs/plugins/plugin-client/index.md`

**Add new section:**
```markdown
### classMode
Generate a class-based client instead of standalone functions.
When enabled, all operations will be methods of a class with centralized configuration.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

```typescript
pluginClient({
  classMode: true,
})
```

### className
Name of the generated class (only used when classMode is true).
Can be a string or a function that returns a string based on context.

|           |                                              |
|----------:|:---------------------------------------------|
|     Type: | `string \| ((context: { group?: string }) => string)` |
| Required: | `false`                                      |
|  Default: | `'ApiClient'` or `(ctx) => \`${ctx.group}Client\`` when grouped |

```typescript
pluginClient({
  classMode: true,
  className: 'MyApiClient',
})

// Or with function
pluginClient({
  classMode: true,
  group: { type: 'tag' },
  className: ({ group }) => `${group}Service`,
})
```
```

### ✅ File: `docs/plugins/plugin-client/class-mode.md` (NEW)

**Create new documentation page:**
```markdown
# Class-Based Client Mode

The class-based client mode generates TypeScript classes instead of standalone functions,
allowing you to create client instances with centralized configuration.

## Why Use Class Mode?

Class mode is useful when you need to:
- Manage multiple client instances with different configurations
- Work with multi-tenant systems
- Process queue-based integrations
- Avoid passing configuration to every function call

## Basic Usage

[... detailed documentation ...]
```

## Phase 9: Examples

### ✅ Directory: `examples/client-class/` (NEW)

**Create new example project:**
```
examples/client-class/
├── kubb.config.ts
├── package.json
├── petStore.yaml
└── src/
    └── index.ts
```

**File: `examples/client-class/kubb.config.ts`**
```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginClient({
      output: {
        path: './clients',
      },
      classMode: true,
      className: 'PetStoreClient',
      client: 'axios',
    }),
  ],
})
```

## Phase 10: Changelog

### ✅ File: `packages/plugin-client/CHANGELOG.md`

**Add entry:**
```markdown
## [X.Y.0] - YYYY-MM-DD

### Added
- Class-based client generation with `classMode` option
- `className` option to customize generated class name
- Support for centralized client configuration
- Class methods for all operations
```

## Phase 11: Migration Guide

### ✅ File: `docs/migration/class-mode.md` (NEW)

**Create migration guide:**
```markdown
# Migrating to Class-Based Clients

This guide helps you migrate from function-based to class-based clients.

## Before (Function-based)
[... examples ...]

## After (Class-based)
[... examples ...]
```

## Verification Checklist

Before submitting PR:

- [ ] All TypeScript types compile without errors
- [ ] All existing tests pass
- [ ] New tests added and passing
- [ ] Documentation updated
- [ ] Example project works
- [ ] Backward compatibility maintained
- [ ] No breaking changes
- [ ] Changelog updated
- [ ] Code follows project conventions
- [ ] All files formatted with Biome

## Testing Checklist

Test the following scenarios:

- [ ] Basic class generation works
- [ ] Class with grouped operations (by tag) works
- [ ] Class with zod parser works
- [ ] Class with object params works
- [ ] Class with inline params works
- [ ] Class with full data return type works
- [ ] Class with data return type works
- [ ] Class with custom base URL works
- [ ] Class with bundle mode works
- [ ] Class with axios client works
- [ ] Class with fetch client works
- [ ] Existing function-based generation still works (backward compatibility)
- [ ] Can create multiple class instances
- [ ] Config merging works correctly
- [ ] Per-call config override works

## Estimated Effort

- **Phase 1-2 (Types & Config):** 2-3 hours
- **Phase 3-5 (Generators & Components):** 1-2 days
- **Phase 6-7 (Exports & Tests):** 1 day
- **Phase 8-9 (Documentation & Examples):** 1 day
- **Phase 10-11 (Changelog & Migration):** 2-3 hours
- **Testing & Refinement:** 1 day

**Total: ~4-5 days of focused development**

## Notes

- Reuse as much existing code as possible (especially from `Client` component)
- Follow existing patterns in the codebase
- Maintain consistency with other generators
- Ensure TypeScript types are accurate
- Add JSDoc comments for better IDE support
