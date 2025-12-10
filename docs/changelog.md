---
title: Changelog
outline: deep
---

# Changelog

All notable changes to Kubb are documented here. Each version is organized with clear categories (Features, Bug Fixes, Breaking Changes, Dependencies) and includes code examples where applicable. Use the outline navigation in the right sidebar to quickly jump to any version.

- ✨ **Features** - New functionality and enhancements
- 🐛 **Bug Fixes** - Bug fixes and corrections
- 🚀 **Breaking Changes** - Changes that may require code updates
- 📦 **Dependencies** - Package updates and dependency changes

> [!TIP]
> Use the outline navigation (right sidebar) to quickly jump to specific versions.

## Unreleased

### ✨ Features

- **[`@kubb/core`](/plugins/core/)**, **[`@kubb/cli`](/helpers/cli/)**, **[`@kubb/plugin-oas`](/plugins/plugin-oas/)** - Enhanced debug logging and debugging experience

  Significantly improved debug logging throughout the codebase to help developers understand what's happening during code generation. The `--debug` flag now provides comprehensive insights into the generation process.

  **What's logged in debug mode:**
  - Setup phase details (configuration, plugins, paths)
  - Plugin installation with timing information
  - Hook execution with duration measurements
  - Schema parsing details for each schema
  - File generation progress with full paths
  - Barrel file export information
  - Formatter/linter execution details
  - Error messages with full stack traces

  **Performance timing added to:**
  - Plugin installation
  - Hook execution
  - Each lifecycle event

  ::: code-group
  ```shell [Usage]
  # Enable debug mode
  kubb generate --debug

  # Or using log level
  kubb generate --log-level debug
  ```
  :::

  **Example debug output:**
  ```
  [log] [petStore] Starting setup phase
  Config name: petStore
  Root: .
  Output path: ./src/gen
  Number of plugins: 5

  [log] [petStore] [plugin-oas] Installing plugin
  Plugin key: ["plugin-oas",1]
  [log] [petStore] [plugin-oas] Plugin installed successfully in 351ms

  [log] [petStore] [plugin-ts] Building schemas
  Total schemas: 12
  Content type: default
  Includes: all
  Generators: 1
  ```

  Debug logs are written to `.kubb/kubb-{timestamp}.log` for later analysis.

  See the [Debugging Guide](/knowledge-base/debugging) for more information.


## 4.11.0

### ✨ Features

- **[`@kubb/plugin-oas`](/plugins/plugin-oas/)**, **[`@kubb/plugin-zod`](/plugins/plugin-zod/)**, **[`@kubb/plugin-ts`](/plugins/plugin-ts/)**, **[`@kubb/plugin-faker`](/plugins/plugin-faker/)** - Shared `createParser` helper for reduced code duplication

  Introduces `createParser` helper in `@kubb/plugin-oas` to eliminate parser duplication across Zod, TypeScript, and Faker plugins. Each parser previously reimplemented ~300 lines of schema traversal logic. Parsers are now ~150-200 lines instead of ~400-500 lines.

  **Key features:**
  - Framework accepting keyword mapper + custom handlers for parser-specific logic
  - Handlers can use `this.parse` for recursive parsing (via Function.call())
  - Exports `findSchemaKeyword` utility for constraint lookup in sibling schemas
  - Function syntax for handlers to enable `this` keyword usage

  ::: code-group
  ```typescript [Usage Example]
  export const parse = createParser<string, ParserOptions>({
    mapper: zodKeywordMapper,
    handlers: {
      string(tree, options) {
        const minSchema = findSchemaKeyword(tree.siblings, 'min')
        const maxSchema = findSchemaKeyword(tree.siblings, 'max')
        return zodKeywordMapper.string(
          shouldCoerce(options.coercion, 'strings'),
          minSchema?.args,
          maxSchema?.args,
          options.mini
        )
      },
      union(tree, options) {
        const { current } = tree
        return zodKeywordMapper.union(
          sort(current.args)
            .map((it) => this.parse({ ...tree, current: it }, options))
            .filter(Boolean)
        )
      }
    }
  })
  ```
  :::

### 🚀 Breaking Changes

- **[`@kubb/plugin-oas`](/plugins/plugin-oas/)** - Type renames for clarity

  Internal types are used during schema parsing. Most users won't be affected unless directly importing these types from `@kubb/plugin-oas`.
## 4.10.1

### 📦 Dependencies

Upgrade tsdown.

## 4.10.0

### 🐛 Bug Fixes

- **[`@kubb/plugin-ts`](/plugins/plugin-ts/)** - Restore `asPascalConst` enumType option

  The `asPascalConst` enumType option is no longer deprecated. This option generates enum-like constants with PascalCase names, providing an alternative to the default `asConst` which uses camelCase.

  ::: code-group
  ```typescript [asConst (default)]
  const petType = {
    Dog: 'dog',
    Cat: 'cat',
  } as const

  type PetTypeKey = (typeof petType)[keyof typeof petType]
  ```

  ```typescript [asPascalConst]
  const PetType = {
    Dog: 'dog',
    Cat: 'cat',
  } as const

  type PetType = (typeof PetType)[keyof typeof PetType]
  ```
  :::

## 4.9.4

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas/)** - Fix allOf failing to merge constraints like maxLength with $ref schemas

  When using `allOf` to combine a `$ref` schema with an inline schema containing only constraints (like `maxLength`, `minLength`, `pattern`, etc.), those constraints were being lost in the generated schema tree. This affected generated TypeScript types and validation schemas (Zod, etc.).

  The issue occurred in two places:
  1. The allOf parser was using `map(...)[0]` which only kept the type keyword and discarded constraint schemas in `baseItems`
  2. Schemas without explicit `type` fields would return `emptyType` without preserving constraints

  ::: code-group
  ```yaml [OpenAPI Schema]
  components:
    schemas:
      PhoneNumber:
        type: string
        pattern: '^(\+\d{1,3}[-\s]?)?.*$'
      PhoneWithMaxLength:
        allOf:
          - $ref: '#/components/schemas/PhoneNumber'
          - maxLength: 15  # ❌ This constraint was lost
  ```
  ```typescript [Before - Missing maxLength]
  // Generated Zod schema was missing .max(15)
  export const phoneWithMaxLengthSchema = z
    .string()
    .regex(/^(\+\d{1,3}[-\s]?)?.*$/)
  // Missing: .max(15)
  ```
  ```typescript [After - Includes maxLength]
  // Generated Zod schema correctly includes .max(15)
  export const phoneWithMaxLengthSchema = z
    .string()
    .regex(/^(\+\d{1,3}[-\s]?)?.*$/)
    .max(15)  // ✅ Now correctly included
  ```
  :::

## 4.9.3

### 🐛 Bug Fixes

- **Query Plugins** - Fix `mutation: false` option being ignored

  Fix `mutation: false` option being ignored in all TanStack Query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-solid-query`, `@kubb/plugin-svelte-query`, `@kubb/plugin-swr`).

  When `mutation: false` was set in plugin configuration, mutation hooks were still being generated. This occurred because the plugin was spreading the `false` value into an object with default configuration values instead of checking for it explicitly.

  ::: code-group
  ```typescript [Before - Not Working]
  import { defineConfig } from '@kubb/core'
  import { pluginReactQuery } from '@kubb/plugin-react-query'

  export default defineConfig({
    plugins: [
      pluginReactQuery({
        mutation: false, // ❌ Was still generating mutation hooks
      }),
    ],
  })
  ```

  ```typescript [After - Working]
  import { defineConfig } from '@kubb/core'
  import { pluginReactQuery } from '@kubb/plugin-react-query'

  export default defineConfig({
    plugins: [
      pluginReactQuery({
        mutation: false, // ✅ Now properly prevents mutation hook generation
        query: true,     // Only generates queryOptions
      }),
    ],
  })
  ```
  :::

  **Changes:**
  - Added explicit `mutation === false` check in plugin initialization before setting defaults, matching the existing `query: false` pattern
  - Added `options.mutation !== false` guard to `isMutation` condition in mutation generators
  - Updated vitest configs to support `#mocks` import alias for testing

## 4.9.2

### 🐛 Bug Fixes

- **[`plugin-swr`](/plugins/plugin-swr/)** - Add new `paramsToTrigger` option for mutations.

When set to `true`, mutation parameters (path params, query params, headers, request body) are passed via `trigger({ petId, data, params, headers })` instead of requiring them as hook function arguments.

This aligns with React Query's mutation pattern.

::: tip
This will become the default behavior in v5. Set `mutation.paramsToTrigger: true` to opt-in early.
:::

## 4.9.1

### 🐛 Bug Fixes

- **Query Plugins** - Fix `clientType: 'class'` compatibility

  Fix `clientType: 'class'` compatibility with query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-solid-query`, `@kubb/plugin-svelte-query`, `@kubb/plugin-swr`).

  Previously, when `@kubb/plugin-client` was configured with `clientType: 'class'`, query plugins would fail to generate proper hooks because they expected function-based clients but found class-based ones instead.

  Query plugins now automatically detect when `clientType: 'class'` is set and generate their own inline function-based clients, allowing class-based clients and query hooks to coexist in the same configuration.

  ::: code-group
  ```typescript [Configuration]
  import { defineConfig } from '@kubb/core'
  import { pluginClient } from '@kubb/plugin-client'
  import { pluginOas } from '@kubb/plugin-oas'
  import { pluginReactQuery } from '@kubb/plugin-react-query'
  import { pluginTs } from '@kubb/plugin-ts'

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
      // Class-based clients for direct usage
      pluginClient({
        output: {
          path: './clients/class',
        },
        clientType: 'class',
        group: { type: 'tag' },
      }),
      // Query hooks work with inline function-based clients
      pluginReactQuery({
        output: {
          path: './hooks',
        },
      }),
    ],
  })
  ```
  :::

  **Changes:**
  - Added `clientType` to client option types for all query plugins
  - Query plugins automatically generate inline clients when `clientType: 'class'` is detected
  - Updated documentation with compatibility warnings and usage examples

## 4.9.0

### ✨ Features

- **[`plugin-client`](/plugins/plugin-client/)** - Class-based client generation

  Add support for class-based client generation via the new `clientType` option. Users can now generate API clients as classes with methods instead of standalone functions by setting `clientType: 'class'` in the plugin configuration. When combined with `group: { type: 'tag' }`, this generates one class per tag (e.g., `Pet`, `Store`, `User`) with methods for each operation.

  ::: code-group
  ```typescript [Configuration]
  import { defineConfig } from '@kubb/core'
  import { pluginClient } from '@kubb/plugin-client'
  import { pluginOas } from '@kubb/plugin-oas'
  import { pluginTs } from '@kubb/plugin-ts'

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
        clientType: 'class',
        group: {
          type: 'tag',
        },
      }),
    ],
  })
  ```

  ```typescript [Generated Output]
  export class Pet {
    #client: typeof fetch

    constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
      this.#client = config.client || fetch
    }

    async getPetById({ petId }: { petId: number }, config = {}) {
      const { client: request = this.#client, ...requestConfig } = config
      const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400>, unknown>({
        method: 'GET',
        url: `/pet/${petId}`,
        ...requestConfig,
      })
      return res.data
    }

    async addPet(data: AddPetMutationRequest, config = {}) {
      const { client: request = this.#client, ...requestConfig } = config
      const requestData = data
      const res = await request<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
        method: 'POST',
        url: '/pet',
        data: requestData,
        ...requestConfig,
      })
      return res.data
    }
  }
  ```

  ```typescript [Usage]
  import { Pet } from './gen/clients/Pet'

  const petClient = new Pet()

  // Get a pet by ID
  const pet = await petClient.getPetById({ petId: 1 })

  // Add a new pet
  const newPet = await petClient.addPet({
    name: 'Fluffy',
    status: 'available'
  })
  ```
  :::

  **Key features:**
  - Generated classes use ECMAScript private field syntax (`#client`) for true runtime privacy
  - Full support for all existing options (parser, paramsType, dataReturnType, etc.)
  - Each tag generates a separate class file when using `group: { type: 'tag' }`
  - Centralized client configuration per instance

## 4.8.1

### 🐛 Bug Fixes

- **[`plugin-client`](/plugins/plugin-client/)** - Fix formData generation with non-standard parser

  Fix formData generation when parser is undefined or non-standard. Previously, when using multipart/form-data endpoints without setting parser to 'client' or 'zod', the generated code would attempt to call `buildFormData(requestData)` with an undefined `requestData` variable, causing a reference error.

## 4.8.0

### ✨ Features

- **[`plugin-zod`](/plugins/plugin-zod/)** - Zod Mini support

  Add support for Zod Mini with the new `mini` option. When `mini: true`, generates functional syntax instead of chainable methods for better tree-shaking.

::: code-group
```typescript [Before]
z.string().optional()
```

```typescript [After (with mini: true)]
z.optional(z.string())
```
:::

Configuration automatically sets `version` to `'4'` and `importPath` to `'zod/mini'` when mini mode is enabled. Updated parser to support `.check()` syntax for constraints in mini mode.

::: code-group
```typescript [Mini Mode]
z.string().check(z.minLength(5))
```
:::

## 4.7.1

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas/)**

  Fix `serverIndex: 0` not resolving to `servers[0].url` in generated code. The condition `if (serverIndex)` was treating 0 as falsy, causing `getBaseURL()` to return undefined instead of the first server URL.

## 4.7.0

### ✨ Features

- **[`plugin-react-query`](/plugins/plugin-react-query/) & [`plugin-vue-query`](/plugins/plugin-vue-query/)** - Bidirectional pagination support

  Add support for `nextParam` and `previousParam` in infinite queries with nested field access. This enables independent cursor extraction for bidirectional pagination.

::: code-group
```typescript [Dot Notation]
{
  nextParam: 'pagination.next.id',
  previousParam: 'pagination.prev.id'
}
```

```typescript [Array Paths]
{
  nextParam: ['pagination', 'next', 'id'],
  previousParam: ['pagination', 'prev', 'id']
}
```
:::

::: warning DEPRECATED
The existing `cursorParam` option is deprecated but remains functional for backward compatibility.
:::

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas/)** - Fix circular type references with discriminator

  Fixed self-referential circular type references when OpenAPI schemas use `allOf` to extend a discriminator parent that has `oneOf`/`anyOf` referencing the children. The fix detects this pattern and skips adding redundant discriminator constraints to avoid the circular structure.

## 4.6.3

### 🐛 Bug Fixes

- **[`plugin-client`](/plugins/plugin-client/)** - Fix formData with missing request schema

  Fix formData not being used in generated client when request schema is missing for multipart/form-data endpoints.

## 4.6.2

### 🐛 Bug Fixes

- **[`plugin-zod`](/plugins/plugin-zod/)** - Skip coercion for email, url, uuid in Zod 4

  Skip coercion for email, url, uuid with Zod 4. In Zod 4, coerce does not support `z.uuid()`, `z.email()` or `z.url()` and coercion does not make sense with these specific string subtypes.

::: code-group
```typescript [Correct Output]
// When coercion: true and version: '4' are both enabled
z.uuid()
z.email()
z.url()
```

```typescript [Previous (Incorrect)]
// Attempted to use unsupported coercion syntax
z.coerce.uuid() // ❌ Not supported in Zod 4
```
:::

## 4.6.1

### 🐛 Bug Fixes

- **Query Plugins** - Fix missing buildFormData import

  Fix missing `buildFormData` import when using `multipart/form-data` operations without `plugin-client`:

  - [`plugin-react-query`](/plugins/plugin-react-query/)
  - [`plugin-swr`](/plugins/plugin-swr/)
  - [`plugin-vue-query`](/plugins/plugin-vue-query/)
  - [`plugin-solid-query`](/plugins/plugin-solid-query/)
  - [`plugin-svelte-query`](/plugins/plugin-svelte-query/)

## 4.6.0

### ✨ Features

- **[`plugin-react-query`](/plugins/plugin-react-query/)** - useSuspenseInfiniteQuery support

  Add support for `useSuspenseInfiniteQuery` hook generation with the following capabilities:

- Generate `useSuspenseInfiniteQuery` hooks when both `suspense` and `infinite` options are enabled
- Support for both cursor-based and offset-based pagination with full TypeScript type safety
- Automatic validation of required query parameters and response fields

::: code-group
```typescript [Example Usage]
// Generated hook name example
useFindPetsByTagsSuspenseInfinite()
```

```typescript [Configuration]
{
  suspense: true,
  infinite: true
}
```
:::

## 4.5.15

### 🐛 Bug Fixes

- **[`plugin-client`](/plugins/plugin-client)** - Fix FormData handling in fetch client

  Fix FormData handling in fetch client to properly support multipart/form-data requests. FormData instances are now passed directly to the fetch API instead of being JSON.stringify-ed, allowing the browser to correctly set the Content-Type header with the multipart boundary.

::: code-group
```typescript [After (Correct)]
fetch(url, {
  body: formData // Passed directly
})
```

```typescript [Before (Incorrect)]
fetch(url, {
  body: JSON.stringify(formData) // ❌ Wrong
})
```
:::

## 4.5.14

### ✨ Features

- **[`plugin-client`](/plugins/plugin-client)** - Add buildFormData utility

  Added `buildFormData` utility function to properly handle arrays in multipart/form-data requests.

- **Enhanced FormData Support**

  Support for arrays in multipart/form-data with improved FormData handling across all query plugins:

  - [`plugin-mcp`](/plugins/plugin-mcp)
  - [`plugin-react-query`](/plugins/plugin-react-query)
  - [`plugin-solid-query`](/plugins/plugin-solid-query)
  - [`plugin-svelte-query`](/plugins/plugin-svelte-query)
  - [`plugin-swr`](/plugins/plugin-swr)
  - [`plugin-vue-query`](/plugins/plugin-vue-query)

- **[`core`](/plugins/core)** - Add upsertFile method

  Added `upsertFile` method to PluginContext for idempotent file operations.

## 4.5.13

### 🐛 Bug Fixes

- **[`plugin-client`](/plugins/plugin-client)** - Fix FormData type error

  Fix TypeScript type error: Type 'FormData' is missing the following properties from type at generated hooks.

## 4.5.12

### 🐛 Bug Fixes

- **[`plugin-zod`](/plugins/plugin-zod)** - Fix circular dependency with z.lazy()

  Fix circular dependency issues by wrapping all schema references in `z.lazy()` to prevent "used before declaration" errors with `oneOf`/`anyOf` constructs.

::: code-group
```typescript [Solution]
// All references wrapped in z.lazy()
z.lazy(() => Schema)
```
:::

- **[`plugin-swr`](/plugins/plugin-swr/)** - Fix mutation type issue

  Fix SWR mutation type issue by using `SWRMutationConfiguration` directly instead of `Parameters<typeof useSWRMutation>[2]`. This resolves type inference issues caused by SWR's function overloading based on `throwOnError`, allowing flexible definition and passing of mutation configuration options.

- **[`plugin-vue-query`](/plugins/plugin-vue-query/)** - Fix undefined schema handling

  - Fixed potential runtime errors when handling undefined schemas
- Improved queryKey extraction safety with reactive value resolution

- **[`core`](/plugins/core)** - Fix undefined schema handling

  Fixed potential runtime errors when handling undefined schemas.

### ✨ Features

- **[`unplugin-kubb`](/builders/unplugin)** - Multi-framework support

  Added multi-framework support (Vite and Rollup).

### 📦 Dependencies

Update development dependencies (Vite, Nuxt, Biome).

## 4.5.11

### 📦 Dependencies

Upgrade to have latest react-fabric version.

## 4.5.10

### 📦 Dependencies

Upgrade to have latest react-fabric version.

## 4.5.9

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas/)** - Fix discriminator inherit issue

  Fix discriminator `inherit` issue, resolved by applying inherit on setOptions.

## 4.5.8

### 📦 Dependencies

Rebuild core packages.

## 4.5.7

### 📦 Dependencies

Rebuild core packages.

## 4.5.6

### 🐛 Bug Fixes

- **[`core`](/plugins/core)** - Correct Plugins type

  Correct type for Plugins.

## 4.5.3

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas/)** - Expose generators helpers

  Expose generators helpers again in main barrel of plugin-oas.

## 4.5.2

### 📦 Dependencies

Update Fabric packages.

## 4.5.1

### 🐛 Bug Fixes

- **[`plugin-zod`](/plugins/plugin-zod)** - Fix optional query parameters

  Fix query parameter object with all parameters defaulting incorrectly marked as optional in Zod.

## 4.5.0

### 🚀 Breaking Changes

- **Removed `@kubb` Dependency from Generated Files**

  All query plugins now generate self-contained code with a `.kubb` folder containing necessary utilities:

  - [`plugin-react-query`](/plugins/plugin-react-query/)
  - [`plugin-svelte-query`](/plugins/plugin-svelte-query/)
  - [`plugin-vue-query`](/plugins/plugin-vue-query/)
  - [`plugin-solid-query`](/plugins/plugin-solid-query/)
  - [`plugin-client`](/plugins/plugin-client)

  ::: tip BENEFIT
  Generated code no longer depends on `@kubb` runtime packages, making the output more portable and easier to customize.
  :::

  ::: code-group
  ```typescript [Before]
  import { client } from '@kubb/plugin-client'
  ```

  ```typescript [After]
  import { client } from './.kubb/client'
  ```
  :::

- **[`plugin-zod`](/plugins/plugin-zod)** - Remove @kubb dependency

  **Removed Dependencies:**
  - Remove dependency of `@kubb` inside the generated files
  - Introduce a `.kubb` folder containing the `ToZod` helper

  **Bug Fixes:**
  - Zod schema was not adding `.max`, revert previous changes to bring back this feature
  - Add `z.lazy` for every reference but when used in Zod v4 with `get(){}` syntax remove the `z.lazy`

### ✨ Features

- **[`plugin-oas`](/plugins/plugin-oas/)** - Sort schemas for correct reference order

  Sort OpenApi Schemas so references are having a correct order when generated.

## 4.4.1

### 📦 Dependencies

Update Fabric packages.

## 4.4.0

### ✨ Features

Add Fabric support for improved code generation.

## 4.3.1

### 📦 Dependencies

- **[`react`](/helpers/react/)** - Update peerdeps

  Update peerdeps `@kubb/react`.

## 4.3.0

### ✨ Features

- **[`plugin-zod`](/plugins/plugin-zod)** - Exclusive min/max constraints

  Add exclusive minimum and maximum support with Zod constraints.

::: code-group
```typescript [Example]
z.number().gt(5)  // Greater than 5
z.number().lt(10) // Less than 10
```
:::

## 4.2.2

### 🐛 Bug Fixes

- **[`core`](/plugins/core)** - Fix Fabric patch version crash

  Resolve crash with incorrect Fabric patch version.

## 4.2.1

### 📦 Dependencies

Update packages.

## 4.2.0

### ✨ Features

- **[`plugin-msw`](/plugins/plugin-msw)** - Generate responses for status codes

  Generating responses for status codes.

## 4.1.4

### ✨ Features

- **[`plugin-faker`](/plugins/plugin-faker)** - Optional data parameter

  Add optional data parameter to override default faker generated strings and numbers.

### 🐛 Bug Fixes

- **[`plugin-client`](/plugins/plugin-client)** - Fix content-type header for multipart

  Correct content-type header handling for multipart/form-data.

- **[`plugin-zod`](/plugins/plugin-zod)** - Add operation types

  Add type to operations generated by zod plugin.

## 4.1.3

### ✨ Features

- **[`plugin-msw`](/plugins/plugin-msw)** - Promise response support

  Add promise response to msw handlers.

## 4.1.2

### 🐛 Bug Fixes

- **[`plugin-react-query`](/plugins/plugin-react-query/)** - Guard infinite hooks

  Guard infinite hooks and streamline mutation typings.

- **[`core`](/plugins/core)** - Fix regex with flags

  Fix generation failing when using regexes that contain flags.

- **[`plugin-zod`](/plugins/plugin-zod)** - URL min/max constraints

  URL should also set min and max when defined.

## 4.1.1

### 📦 Dependencies

Upgrade internal packages.

## 4.1.0

### ✨ Features

- **[`plugin-react-query`](/plugins/plugin-react-query/)** - Add mutationOptions

  Add mutationOptions to react-query.

- **[`plugin-zod`](/plugins/plugin-zod)** - z.ZodType for Zod v4

  Use of `z.ZodType` when using Zod v4.

## 4.0.2

### 🐛 Bug Fixes

- **[`plugin-zod`](/plugins/plugin-zod)** - Escape omit keys

  Escape omit keys correctly with `'`.

- **[`plugin-client`](/plugins/plugin-client)** - Support stringify for multipart

  Support stringify when using `multipart/form-data`.

## 4.0.1

### 📦 Dependencies

Upgrade internal packages.

## 4.0.0

### 🚀 Breaking Changes

- **[`plugin-ts`](/plugins/plugin-ts)** - Enum Key suffix for asConst

  Enums generated with "asConst" have a "Key" suffix.

::: code-group
```typescript [After]
const StatusKey = {
  Active: 'active',
  Inactive: 'inactive'
} as const
```

```typescript [Before]
const Status = {
  Active: 'active',
  Inactive: 'inactive'
} as const
```
:::

- **[`plugin-vue-query`](/plugins/plugin-vue-query/)**

  Unwrap in vue infinite query.

- **[`plugin-react-query`](/plugins/plugin-react-query/)**

  Align infinite query generics with tanstack.

## 3.18.4

### 🐛 Bug Fixes

- **[`plugin-ts`](/plugins/plugin-ts)**

  Keep `usedEnumNames` in cache but not between builds.

## 3.18.3

### 🐛 Bug Fixes

- **Query Plugins** - Correct infiniteQuery generic

  Correct generic for infiniteQuery ([#1790](https://github.com/kubb-labs/kubb/issues/1790)):
  - [`plugin-react-query`](/plugins/plugin-react-query/)
  - [`plugin-vue-query`](/plugins/plugin-vue-query/)

## 3.18.2

### 📦 Dependencies

- **[`core`](/plugins/core)**

  Update packages.

## 3.18.1

### 🐛 Bug Fixes

- **[`parser/ts`](/parsers/parser-ts/)**

  Revert prettier removal as default formatter.

## 3.18.0

### ✨ Features

- **[`core`](/plugins/core)**

  **Custom Formatters Support:**
- [Biome](https://biomejs.dev/)
- [Prettier](https://prettier.io/)

**Custom Linters Support:**
- [Biome](https://biomejs.dev/)
- [Eslint](https://eslint.org/)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter)

- **Query Plugins** - Use toURLPath for mutationKey

  Use of `toURLPath` for mutationKey across all query plugins:
  - [`plugin-react-query`](/plugins/plugin-react-query/)
  - [`plugin-svelte-query`](/plugins/plugin-svelte-query/)
  - [`plugin-vue-query`](/plugins/plugin-vue-query/)
  - [`plugin-solid-query`](/plugins/plugin-solid-query/)

## 3.17.1

### 🐛 Bug Fixes

- **[`plugin-faker`](/plugins/plugin-faker)**

  Escaping regex correctly and without `new RegExp()`.

- **[`plugin-zod`](/plugins/plugin-zod)**

  Escaping regex correctly by using `new RegExp().source` behind the scenes.

- **Query Plugins** - Fix queryClient default value

  Resolve typescript error related to `queryClient` not having a default value:
  - [`plugin-react-query`](/plugins/plugin-react-query/)
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/)
- [`plugin-vue-query`](/plugins/plugin-vue-query/)
- [`plugin-solid-query`](/plugins/plugin-solid-query/)

## 3.17.0

### ✨ Features

- **[`plugin-client`](/plugins/plugin-client)**

  Export method when using `urlType` as discussed in [#1828](https://github.com/kubb-labs/kubb/discussions/1828).

## 3.16.4

### ✨ Features

- **[`plugin-zod`](/plugins/plugin-zod)**

  toZod support for Zod v4.

## 3.16.3

### 🐛 Bug Fixes

- **[`plugin-msw`](/plugins/plugin-msw)**

  Return contentType from response instead of request.

- **[`plugin-faker`](/plugins/plugin-faker)**

  Update Faker parser to work with enums in nested objects.

## 3.16.2

### 📦 Dependencies

Upgrade of internal dependencies.

## 3.16.1

### ✨ Features

- **[`plugin-client`](/plugins/plugin-client)**

  Add `validateStatus` as part of the axios client.

### 🐛 Bug Fixes

- **[`plugin-ts`](/plugins/plugin-ts)**

  - Fix ERROR Warning: Encountered two children with the same key
- Fix pattern property not considered for JSDoc

## 3.16.0

### ✨ Features

- **[`core`](/plugins/core)**

  Improve memory usage by using concurrency.

## 3.15.0

### ✨ Features

- **[`plugin-swr`](/plugins/plugin-swr/)**

  Add `immutable` option to disable `revalidateIfStale`, `revalidateOnFocus` and `revalidateOnReconnect`.

::: info
See [SWR Documentation](https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations) for more details.
:::

::: code-group
```typescript [Before]
const { data, error } = useGetOrderById(2)
```

```typescript [After]
const { data, error } = useGetOrderById(2, { immutable: true })
```
:::

## 3.14.4

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas)**

  Fix AnyOf where `const` (empty string) is being used should not be converted to a nullable value.

::: code-group
```json [OpenAPI Schema]
{
  "anyOf": [
    {
      "const": "",
      "type": "string"
    },
    {
      "format": "email",
      "type": "string"
    }
  ]
}
```

```typescript [Before]
type Order = {
  status?: null | string
}
```

```typescript [After (Fixed)]
type Order = {
  status?: string
}
```
:::

## 3.14.3

### ✨ Features

- **[`plugin-client`](/plugins/plugin-client) & [`plugin-msw`](/plugins/plugin-msw)** - Google API format paths

  Support Google API format paths:

  ::: code-group
  ```typescript [Example]
  // Google API path format
  my-api/foo/v1/bar/{id}:search
  ```
  :::

## 3.14.2

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas)**

  Fix required properties not handled correctly when allOf is used.

## 3.14.1

### 🐛 Bug Fixes

- **[`parser/ts`](/parsers/parser-ts/)**

  - Fixed order of import and export files when using `print` of TypeScript
- Fixed TypeScript version

## 3.14.0

### ✨ Features

- **[`cli`](/helpers/cli/)**

  **New CLI Commands:**

::: code-group
```bash [Validate]
# Validate a Swagger/OpenAPI file
npx kubb validate --input swagger.json
```

```bash [MCP]
# Start the MCP client to interact with LLMs (like Claude)
npx kubb mcp
```
:::

## 3.13.2

### 🐛 Bug Fixes

- **[`plugin-client`](/plugins/plugin-client)**

  Fix shadowed variables error when using `client`, use of `fetch` instead when an import to `@kubb/plugin-client/clients/axios` is needed.

## 3.13.1

### ✨ Features

- **[`plugin-client`](/plugins/plugin-client)**

  Parse and validate request data with Zod, including FormData, before forwarding it to the client.

## 3.13.0

### ✨ Features

- **Multiple Plugins** - Add emptySchemaType option

  Add `emptySchemaType` option across plugins. It is used whenever schema is "empty" and defaults to the value of unknownType when not specified which maintains backwards compatibility.

  - [`plugin-ts`](/plugins/plugin-ts)
  - [`plugin-zod`](/plugins/plugin-zod)
  - [`plugin-faker`](/plugins/plugin-faker)

## 3.12.2

### 🐛 Bug Fixes

- **[`core`](/plugins/core)**

  Better support for Windows [back slashes](https://github.com/kubb-labs/kubb/issues/1776).

## 3.12.1

### 🐛 Bug Fixes

- **[`plugin-zod`](/plugins/plugin-zod)**

  Correct v4 imports when no importPath is defined.

## 3.12.0

### ✨ Features

- **[`plugin-zod`](/plugins/plugin-zod)**

  Full support for Zod v4.

## 3.11.1

### 🐛 Bug Fixes

- **[`plugin-oas`](/plugins/plugin-oas)**

  Resolve anyof when used together with allof.

## 3.11.0

### ✨ Features

- **[`plugin-oas`](/plugins/plugin-oas)**

  Discriminator flag that could override a schema when mapping is used (see inherit), resolves [#1736](https://github.com/kubb-labs/kubb/issues/1736).

### 🐛 Bug Fixes

- **[`plugin-zod`](/plugins/plugin-zod)**

  Enums of type "number" are parsed to integers.

- **[`plugin-faker`](/plugins/plugin-faker)**

  Incompatible type used for true literal enum in query param.

## 3.10.16

### 🐛 Bug Fixes

- **[`plugin-ts`](/plugins/plugin-ts)**

  ConstEnum should be treated as export * instead of export type *.

## 3.10.15

### 🐛 Bug Fixes

- **[`plugin-ts`](/plugins/plugin-ts)**

  Fix nullable response inconsistency between @kubb/plugin-ts and @kubb/plugin-zod plugins.

## 3.10.14

### 🐛 Bug Fixes

- **[`plugin-faker`](/plugins/plugin-faker)**

  Fix min and max not applied to the faker functions when only one of them is defined.

- **[`core`](/plugins/core)**

  Add uniqueBy for file.sources (isExportable and name).

- **[`plugin-ts`](/plugins/plugin-ts)**

  Fix duplicated enums on TypeScript types.

## 3.10.13

### 🐛 Bug Fixes

- **[`plugin-zod`](/plugins/plugin-zod)**

  Query parameter objects are no longer optional if at least one parameter is defaulted.

## 3.10.12

### ✨ Features

- **[`plugin-oas`](/plugins/plugin-oas)**

  Allow multiple `discriminator.mapping` with the same $ref.

## 3.10.11

### 📦 Dependencies

- **[`plugin-zod`](/plugins/plugin-zod)**

  Update parser to include latest v4 of Zod.

## 3.10.10

### 🐛 Bug Fixes

- **Query Plugins** - Resolve TypeScript errors

  Resolve TypeScript errors across all query plugins:

  - [`plugin-react-query`](/plugins/plugin-react-query/)
  - [`plugin-svelte-query`](/plugins/plugin-svelte-query/)
  - [`plugin-vue-query`](/plugins/plugin-vue-query/)
  - [`plugin-solid-query`](/plugins/plugin-solid-query/)

## 3.10.9

### 📦 Dependencies

- **[`core`](/plugins/core)**

  Update packages.

## 3.10.8

### ✨ Features

- **[`plugin-oas`](/plugins/plugin-oas)**

  Add caching of OAS.

## 3.10.7

### 🐛 Bug Fixes

- **[`core`](/plugins/core)**

  Better support for Windows.

## 3.10.6

### ✨ Features

- **[`plugin-oas`](/plugins/plugin-oas)**

  Improve tuple type generation.

## 3.10.5

### ✨ Features

- **[`plugin-oas`](/plugins/plugin-oas)**

  Rewrite schemas with multiple types.

### 🐛 Bug Fixes

- **[`plugin-faker`](/plugins/plugin-faker)**

  Fix types of enums nested in array.

## 3.10.4

### ✨ Features

- **[`plugin-mcp`](/plugins/plugin-mcp/)**

  Better use of MCP tools based on OAS.

## 3.10.3

### ✨ Features

- **[`plugin-zod`](/plugins/plugin-zod)**

  Better convert of `discriminator`.

## 3.10.2

### 🐛 Bug Fixes

- **[`plugin-react-query`](/plugins/plugin-react-query/)**

  Remove generic TQueryData when using suspense.

## 3.10.1

### 📦 Dependencies

Update of internal libraries.

## 3.10.0

### ✨ Features

- **[`plugin-mcp`](/plugins/plugin-mcp/)**

  Create an [MCP](https://modelcontextprotocol.io) server based on your OpenAPI file and interact with an AI like Claude.

![Claude interaction](/screenshots/claude-interaction.gif)

## 3.9.5

### 🐛 Bug Fixes

- **[`plugin-ts`](/plugins/plugin-ts)**

  Fix OpenAPI description tag not put into the JSDoc.

## 3.9.4

### 🐛 Bug Fixes

- **[`plugin-swr`](/plugins/plugin-swr/)**

  Fix query type inferred as any when generating SWR hooks with useSWR.

## 3.9.3

### ✨ Features

- **[`plugin-ts`](/plugins/plugin-ts)**

  `nullable: true` now generates | null union.

## 3.9.2

### 🐛 Bug Fixes

- **[`plugin-client`](/plugins/plugin-client)**

  Exclude baseURL when not set.

## 3.9.1

### 🐛 Bug Fixes

Reduce any's being used:

- [`plugin-zod`](/plugins/plugin-zod)
- [`plugin-faker`](/plugins/plugin-faker)

## 3.9.0
- [`core`](/plugins/core): add default banner feature to enhance generated file recognizability by [@akinoccc](https://github.com/akinoccc)

## 3.8.1
- [`plugin-zod`](/plugins/plugin-zod): support for Zod v4(beta)

## 3.8.0
- [`react`](/helpers/react/): Support for React 19 and expose `useState`, `useEffect`, `useRef` from `@kubb/react`

## 3.7.7
- [`plugin-oas`](/plugins/plugin-oas): support for contentType override/exclude/include

## 3.7.6
- [`plugin-client`](/plugins/plugin-client): Removing export of the url

## 3.7.5
- [`plugin-react-query`](/plugins/plugin-react-query/): support for custom QueryClient
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): support for custom QueryClient
- [`plugin-vue-query`](/plugins/plugin-vue-query/): support for custom QueryClient
- [`plugin-solid-query`](/plugins/plugin-solid-query/): support for custom QueryClient

## 3.7.4
- [`plugin-redoc`](/plugins/plugin-redoc): setup redoc without React dependency

## 3.7.3
- [`plugin-zod`](/plugins/plugin-zod): fixed version for [`@hono/zod-openapi`](https://github.com/honojs/middleware/issues/1109)

## 3.7.2
- [`plugin-client`](/plugins/plugin-client): method should be optional for default fetch and axios client

## 3.7.1
- [`plugin-faker`](/plugins/plugin-faker/): Improve formatting of fake dates and times

## 3.7.0
- [`plugin-cypress`](/plugins/plugin-cypress): support for `cy.request` with new plugin `@kubb/plugin-cypress`

## 3.6.5
- [`plugin-react-query`](/plugins/plugin-react-query/): `TVariables` set to `void` as default
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): `TVariables` set to `void` as default
- [`plugin-vue-query`](/plugins/plugin-vue-query/): `TVariables` set to `void` as default
- [`plugin-solid-query`](/plugins/plugin-solid-query/): `TVariables` set to `void` as default
- [`plugin-zod`](/plugins/plugin-zod): zod omit instead of `z.never`

## 3.6.4
- Update external packages

## 3.6.3
- [`plugin-oas`](/plugins/plugin-oas): extra checks for empty values for properties of a discriminator type
- [`plugin-react-query`](/plugins/plugin-react-query/): allow override of mutation context with TypeScript generic
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): allow override of mutation context with TypeScript generic
- [`plugin-vue-query`](/plugins/plugin-vue-query/): allow override of mutation context with TypeScript generic
- [`plugin-solid-query`](/plugins/plugin-solid-query/): allow override of mutation context with TypeScript generic
-
## 3.6.2
- [`plugin-zod`](/plugins/plugin-zod): handling circular dependency properly when using `ToZod` helper

## 3.6.1
- [`plugin-react-query`](/plugins/plugin-react-query/): validating the request using zod before making the HTTP call
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): validating the request using zod before making the HTTP call
- [`plugin-vue-query`](/plugins/plugin-vue-query/): validating the request using zod before making the HTTP call
- [`plugin-solid-query`](/plugins/plugin-solid-query/): validating the request using zod before making the HTTP call
- [`plugin-swr`](/plugins/plugin-swr/): validating the request using zod before making the HTTP call
- [`plugin-client`](/plugins/plugin-client): validating the request using zod before making the HTTP call

## 3.6.0

### ✨ Features

- **[`plugin-zod`](/plugins/plugin-zod)**

  Adds `wrapOutput` option to allow for further customizing the generated zod schemas, making it possible to use OpenAPI on top of your Zod schema.

::: code-group
```typescript [Example with @hono/zod-openapi]
import { z } from '@hono/zod-openapi'

export const showPetByIdError = z
  .lazy(() => error)
  .openapi({
    examples: [
      {
        sample: {
          summary: 'A sample error',
          value: { code: 1, message: 'A sample error message' }
        }
      },
      {
        other_example: {
          summary: 'Another sample error',
          value: { code: 2, message: 'A totally specific message' }
        }
      },
    ],
  })
```
:::

- **[`plugin-oas`](/plugins/plugin-oas)**

  Discriminator mapping with literal types.

::: code-group
```typescript [Before]
export type FooBase = {
  /**
   * @type string
   */
  $type: string;
};
```

```typescript [After]
export type FooBase = {
  /**
   * @type string
   */
  $type: "type-string" | "type-number";
};
```
:::

::: code-group
```typescript [Before]
export type FooNumber = FooBase {
  /**
   * @type number
   */
  value: number;
};
```

```typescript [After]
export type FooNumber = FooBase & {
  /**
   * @type string
   */
  $type: "type-number";

  /**
   * @type number
   */
  value: number;
};
```
:::

## 3.5.13
- [`plugin-oas`](/plugins/plugin-oas): enum with whitespaces

## 3.5.12
- [`core`](/plugins/core): internal packages update

## 3.5.11
- [`core`](/plugins/core): internal packages update

## 3.5.10
- [`plugin-faker`](/plugins/plugin-faker/): returnType for faker functions

## 3.5.9
- [`plugin-faker`](/plugins/plugin-faker/): returnType for faker functions
- [`plugin-faker`](/plugins/plugin-faker/): only use min/max when both are set in the oas
- [`plugin-client`](/plugins/plugin-client): correct use of baseURL for fetch client
- [`plugin-msw`](/plugins/plugin-msw): support for `baseURL` without wildcards

## 3.5.8
- [`plugin-react-query`](/plugins/plugin-react-query/): support custom `contentType` per plugin
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): support custom `contentType` per plugin
- [`plugin-vue-query`](/plugins/plugin-vue-query/): support custom `contentType` per plugin
- [`plugin-solid-query`](/plugins/plugin-solid-query/): support custom `contentType` per plugin
- [`plugin-swr`](/plugins/plugin-swr/): support custom `contentType` per plugin
- [`plugin-client`](/plugins/plugin-client): support custom `contentType` per plugin

## 3.5.7
- [`react`](/helpers/react/): Bun does not follow the same node_modules structure, to resolve this we need to include the React bundle inside of `@kubb/react`. This will increase the size with 4MB.

## 3.5.6
- [`plugin-react-query`](/plugins/plugin-react-query/): support custom client in options
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): support custom client in options
- [`plugin-vue-query`](/plugins/plugin-vue-query/): support custom client in options
- [`plugin-solid-query`](/plugins/plugin-solid-query/): support custom client in options
- [`plugin-swr`](/plugins/plugin-swr/): support custom client in options

## 3.5.5
- [`plugin-client`](/plugins/plugin-client): support custom client in options
- [`plugin-faker`](/plugins/plugin-zod): `faker.number.string` with default min `Number.MIN_VALUE` and max set to `Number.MAX_VALUE`

## 3.5.4
- [`plugin-zod`](/plugins/plugin-zod): Support uniqueItems in Zod

## 3.5.3
- [`plugin-client`](/plugins/plugin-client): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-react-query`](/plugins/plugin-react-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-vue-query`](/plugins/plugin-vue-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-solid-query`](/plugins/plugin-solid-query/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available
- [`plugin-swr`](/plugins/plugin-swr/): allow exporting custom client fetch function and use generated fetch when `pluginClient` is available


## 3.5.2
- [`plugin-faker`](/plugins/plugin-faker): `faker.number.float` with default min `Number.MIN_VALUE` and max set to `Number.MAX_VALUE`.
- [`plugin-oas`](/plugins/plugin-oas): remove duplicated keys when using `allOf` and applying required on fields

## 3.5.1
- [`core`](/plugins/core): build of `@kubb/core` with correct types
- [`plugin-oas`](/plugins/plugin-oas): allow `grouping`

## 3.5.0
- [`core`](/plugins/core): support banner with context for Oas
```typescript
pluginTs({
  output: {
    path: 'models',
    banner(oas) {
      return `// version: ${oas.api.info.version}`
    },
  },
}),
```

## 3.4.6
- [`core`](/plugins/core): ignore acronyms when doing casing switch to pascal or camelcase

## 3.4.5
- [`plugin-client`](/plugins/plugin-client): if client receives no body (no content) then it throws JSON parsing error
- [`plugin-zod`](/plugins/plugin-zod): use of `as ToZod` instead of `satisfies ToZod`

## 3.4.4
- [`plugin-client`](/plugins/plugin-client): url in text format instead of using URL

## 3.4.3
- [`plugin-oas`](/plugins/plugin-oas): correct use of grouping for path and tags

## 3.4.2
- [`plugin-oas`](/plugins/plugin-oas): remove duplicated keys when set in required

## 3.4.1
- [`plugin-faker`](/plugins/plugin-faker): min and max was not applied to the faker functions

## 3.4.0
- [`plugin-client`](/plugins/plugin-client): decouple URI (with params) from fetching
- [`plugin-client`](/plugins/plugin-client): add header in response object
- [`plugin-client`](/plugins/plugin-client): use of URL and SearchParams to support queryParams for fetch

## 3.3.5
- [`plugin-react-query`](/plugins/plugin-react-query/): queryOptions with custom Error type
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): queryOptions with custom Error type
- [`plugin-vue-query`](/plugins/plugin-vue-query/): queryOptions with custom Error type
- [`plugin-solid-query`](/plugins/plugin-solid-query/): queryOptions with custom Error type
- [`react`](/helpers/react/): importPath without extensions


## 3.3.4
- [`plugin-ts`](/plugins/plugin-ts): minLength, maxLength, pattern as part of the jsdocs
- [`plugin-client`](/plugins/plugin-client): baseURL could be undefined, do not throw error if that is the case

## 3.3.3
- [`react`](/helpers/react/): Use of `@kubb/react` as importSource for jsx(React 17, React 18, React 19 could be used next to Kubb)
- [`cli`](/helpers/cli/): Use of `@kubb/react` as importSource for jsx(React 17, React 18, React 19 could be used next to Kubb)

## 3.3.2
- [`react`](/helpers/react/): Support `div` and other basic elements to be returned by `@kubb/react`

## 3.3.1
- [`plugin-zod`](/plugins/plugin-zod): Use of `tozod` util to create schema based on a type

## 3.3.0
- [`plugin-client`](/plugins/plugin-client): `client` to use `fetch` or `axios` as HTTP client
- [`plugin-zod`](/plugins/plugin-zod): Use Regular expression literal instead of RegExp-contructor
- [`plugin-ts`](/plugins/plugin-ts): Switch between the use of type or interface when creating types

## 3.2.0
- [`plugin-msw`](/plugins/plugin-msw): `paramsCasing` to define casing for params
- [`plugin-react-query`](/plugins/plugin-react-query/): `paramsCasing` to define casing for params
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): `paramsCasing` to define casing for params
- [`plugin-vue-query`](/plugins/plugin-vue-query/): `paramsCasing` to define casing for params
- [`plugin-solid-query`](/plugins/plugin-solid-query/): `paramsCasing` to define casing for params
- [`plugin-client`](/plugins/plugin-client): `paramsCasing` to define casing for params

## 3.1.0

### ✨ Features

- **Group API Clients by Path Structure**

  Group API clients by path structure across all query plugins:

  - [`plugin-react-query`](/plugins/plugin-react-query/)
  - [`plugin-svelte-query`](/plugins/plugin-svelte-query/)
  - [`plugin-vue-query`](/plugins/plugin-vue-query/)
  - [`plugin-solid-query`](/plugins/plugin-solid-query/)
  - [`plugin-msw`](/plugins/plugin-msw)

::: code-group
```typescript [Configuration]
group: {
  type: 'path',
  name: ({ group }) => {
    const firstSegment = group.split('/')[1];
    return firstSegment;
  }
}
```

```typescript [Handler Example]
findPetsByStatusHandler((info) => {
  const { params } = info
  if (params.someKey) {
    return new Response(
      JSON.stringify({ error: 'some error response' }),
      { status: 400 }
    );
  }
  return new Response(
    JSON.stringify({ newData: 'new data' }),
    { status: 200 }
  );
})
```
:::

## 3.0.14
- [`core`](/plugins/core): Upgrade packages

## 3.0.13
- [`core`](/plugins/core): Upgrade packages
- [`plugin-oas`](/plugins/plugin-oas): Applying required on fields inherited using allOf

## 3.0.12
- [`plugin-zod`](/plugins/plugin-zod): 2xx as part of `operations.ts`

## 3.0.11
- [`core`](/plugins/core): Disabling output file extension
- [`plugin-oas`](/plugins/plugin-oas): Correct use of Jsdocs syntax for links
- [`core`](/plugins/core): Respect casing of parameters

## 3.0.10
- [`plugin-faker`](/plugins/plugin-faker): `data` should have a higher priority than faker defaults generation

## 3.0.9
- [`plugin-oas`](/plugins/plugin-oas): Allow nullable with default null option
- [`core`](/plugins/core): Correct use of `barrelType` for single files

## 3.0.8
- [`plugin-zod`](/plugins/plugin-zod): Blob as `z.instanceof(File)` instead of `string`

## 3.0.7
- [`core`](/plugins/core): Include single file exports in the main index.ts file.

## 3.0.6
- [`plugin-oas`](/plugins/plugin-oas/): Correct use of variables when a path/params contains _ or -
- [`core`](/plugins/core): `barrelType: 'propagate'` to make sure the core can still generate barrel files, even if the plugin will not have barrel files

## 3.0.5
- [`react`](/helpers/react//): Better error logging + wider range for `@kubb/react` peerDependency

## 3.0.4
- Upgrade external dependencies

## 3.0.3
- [`plugin-ts`](/plugins/plugin-ts/): `@deprecated` jsdoc tag for schemas

## 3.0.2
- [`plugin-react-query`](/plugins/plugin-react-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)
- [`plugin-vue-query`](/plugins/plugin-vue-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)
- [`plugin-solid-query`](/plugins/plugin-solid-query/): remove the requirement of [`plugin-client`](/plugins/plugin-client)

## 3.0.1
- [`plugin-faker`](/plugins/plugin-faker): Correct faker functions for uuid, pattern and email
- [`plugin-react-query`](/plugins/plugin-react-query/): allow disabling `useQuery`
- [`plugin-react-query`](/plugins/plugin-react-query/): use of `InfiniteData` TypeScript helper for infiniteQueries
- [`plugin-vue-query`](/plugins/plugin-vue-query/): use of `InfiniteData` TypeScript helper for infiniteQueries

## 3.0.0-beta.12
- [`plugin-react-query`](/plugins/plugin-react-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-vue-query`](/plugins/plugin-vue-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-solid-query`](/plugins/plugin-solid-query/): allow to disable the generation of useQuery or createQuery hooks.
- [`plugin-swr`](/plugins/plugin-swr/): allow to disable the generation of useQuery or createQuery hooks.

## 3.0.0-beta.11
- [`plugin-ts`](/plugins/plugin-ts): enumType `'enum'` without export type in barrel files
- [`plugin-client`](/plugins/plugin-client): Allows you to set a custom base url for all generated calls

## 3.0.0-beta.10
- [`plugin-react-query`](/plugins/plugin-react-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-vue-query`](/plugins/plugin-vue-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-solid-query`](/plugins/plugin-solid-query/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.
- [`plugin-client`](/plugins/plugin-client/): `paramsType` with options `'inline'` and `'object'` to have control over the amount of parameters when calling one of the generated functions.

## 3.0.0-beta.9
- [`plugin-msw`](/plugins/plugin-msw): `parser` option to disable faker generation
  - `'faker'` will use `@kubb/plugin-faker` to generate the data for the response
  - `'data'` will use your custom data to generate the data for the response
- [`plugin-msw`](/plugins/plugin-msw): Siblings for better AST manipulation

## 3.0.0-beta.8
- [`plugin-zod`](/plugins/plugin-zod): Siblings for better AST manipulation

## 3.0.0-beta.7
- Upgrade external packages

## 3.0.0-beta.6
- [`plugin-faker`](/plugins/plugin-faker): Min/Max for type array to generate better `faker.helpers.arrayElements` functionality

## 3.0.0-beta.5
- [`plugin-zod`](/plugins/plugin-zod): Discard `optional()` if there is a `default()` to ensure the output type is not `T | undefined`

## 3.0.0-beta.4
- Upgrade external packages

## 3.0.0-beta.3
- [`plugin-zod`](/plugins/plugin-zod/): Added coercion for specific types only
```typescript
type coercion=  boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
```

## 3.0.0-beta.2
- Upgrade external packages

## 3.0.0-beta.1
- Upgrade external packages

## 3.0.0-alpha.31
- [`plugin-client`](/plugins/plugin-client/): Generate `${tag}Service` controller file related to group x when using `group`(no need to specify `group.exportAs`)
- [`plugin-core`](/plugins/core/): Removal of `group.exportAs`
- [`plugin-core`](/plugins/core/): Removal of `group.output` in favour of `group.name`(no need to specify the output/root)
```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginClient({
      output: {
        path: './clients/axios',
      },
      // group: { type: 'tag', output: './clients/axios/{{tag}}Service' }, // [!code --]
      group: { type: 'tag', name: ({ group }) => `${group}Service` }, // [!code ++]
    }),
  ],
})
```

## 3.0.0-alpha.30
- [`plugin-core`](/plugins/core/): Removal of `output.extName` in favour of `output.extension`
- [`plugin-core`](/plugins/core/): Removal of `exportType` in favour of `barrelType`


## 3.0.0-alpha.29
- [`plugin-react-query`](/plugins/plugin-react-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Support for cancellation of queries with the help of `signal`
- [`plugin-react-query`](/plugins/plugin-react-query/): Use of `enabled` based on optional params
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Use of `enabled` based on optional params
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Use of `enabled` based on optional params
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Use of `enabled` based on optional params

## 3.0.0-alpha.28
- [`plugin-zod`](/plugins/plugin-zod/): Respect order of `z.tuple`

## 3.0.0-alpha.27
- [`plugin-swr`](/plugins/plugin-swr/): Support for TypeScript `strict` mode
- [`plugin-react-query`](/plugins/plugin-react-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`
- [`plugin-solid-query`](/plugins/plugin-solid-query/): Support for TypeScript `strict` mode and use of data object for `mutationFn: async(data: {})`


## 3.0.0-alpha.26
- [`plugin-swr`](/plugins/plugin-swr/): Expose queryKey and mutationKey for the SWR plugin
- 'generators' option for all plugins

## 3.0.0-alpha.25
- [`plugin-react-query`](/plugins/plugin-react-query/): Use of MutationKeys for `useMutation`
- [`plugin-svelte-query`](/plugins/plugin-svelte-query/): Use of MutationKeys for `createMutation`
- [`plugin-vue-query`](/plugins/plugin-vue-query/): Use of MutationKeys for `useMutation`


## 3.0.0-alpha.24
- [`plugin-oas`](/plugins/plugin-oas/): Support for [discriminator](https://swagger.io/specification/?sbsearch=discriminator)


## 3.0.0-alpha.23
- [`plugin-client`](/plugins/plugin-client/): Use of uppercase for httpMethods, `GET` instead of `get`, `POST` instead of `post`, ...

## 3.0.0-alpha.22
- [`plugin-faker`](/plugins/plugin-faker/): Use of `faker.image.url()` instead of `faker.image.imageUrl()`
- [`plugin-zod`](/plugins/plugin-zod/): Enums should use `z.literal` when format is set to number, string or boolean

::: code-group

```yaml [input]
enum:
  type: boolean
  enum:
    - true
    - false
```
```typescript [output]
z.enum(["true", "false"]) // [!code --]
z.union([z.literal(true), z.literal(false)]) // [!code ++]
```
:::
- [`plugin-ts`](/plugins/plugin-ts/): Use of `readonly` for references($ref)
- [`plugin-client`](/plugins/plugin-client/): Use of type `Error` when no errors are set for an operation


## 3.0.0-alpha.21
- [`plugin-zod`](/plugins/plugin-zod/): Use of `x-nullable` and `nullable` for additionalProperties.

## 3.0.0-alpha.20

- Separate plugin/package for Solid-Query: `@kubb/plugin-solid-query`

```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core"
import { pluginOas } from "@kubb/plugin-oas"
import { pluginTs } from "@kubb/plugin-ts"
import { pluginSolidQuery } from '@kubb/plugin-solid-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSolidQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

- Separate plugin/package for Svelte-Query: `@kubb/plugin-svelte-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSvelteQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```


- Separate plugin/package for Vue-Query:  `@kubb/plugin-vue-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginVueQuery } from '@kubb/plugin-vue-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginVueQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```

## 3.0.0-alpha.16

- Separate plugin/package for React-Query: `@kubb/plugin-react-query`

```typescript [kubb.config.ts]
import {defineConfig} from "@kubb/core"
import {pluginOas} from "@kubb/plugin-oas"
import {pluginTs} from "@kubb/plugin-ts"
import { pluginReactQuery } from '@kubb/plugin-react-query' // [!code ++]
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'  // [!code --]

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginReactQuery({
      output: {
        path: './hooks',
      },
    })
  ],
})

```
