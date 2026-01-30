---
title: Changelog
outline: deep
---

# Changelog

## 4.20.0

### ✨ Features

#### [`@kubb/cli`](/helpers/cli/)

**New `init` command for interactive project setup**

The CLI now includes a new `kubb init` command that provides an interactive setup wizard to quickly scaffold a Kubb project.

```bash
npx kubb init
```

Features:
- **Interactive prompts** - Guides you through essential configuration options
- **Package manager detection** - Automatically detects `npm`, `pnpm`, `yarn`, or `bun`
- **Plugin selection** - Multi-select from all 13 available Kubb plugins
- **Automatic installation** - Installs selected packages with the detected package manager
- **Config generation** - Creates `kubb.config.ts` with sensible defaults for selected plugins
- **File protection** - Asks before overwriting existing configuration
- **Task-based progress** - Clear visual feedback during installation and setup

The command guides you through:
1. Creating a `package.json` (if needed)
2. Selecting your OpenAPI specification path
3. Choosing an output directory for generated files
4. Selecting which plugins to install
5. Installing packages automatically
6. Generating a configured `kubb.config.ts`

This is now the **recommended way** to start a new Kubb project!

See the [CLI documentation](/helpers/cli#kubb-init) for more details.

---

## 4.19.2

### 📦 Dependencies

Update Fabric packages.

---

## 4.19.1

### ✨ Features

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

**Enhanced `collisionDetection` to prevent nested enum name collisions**

The `collisionDetection` option now prevents duplicate enum names when multiple schemas define identical inline enums in nested properties.

When enabled, Kubb tracks the root schema name throughout the parsing chain and includes it in enum naming for nested properties, ensuring unique enum names across different schemas.

::: code-group

```yaml [OpenAPI Spec]
components:
  schemas:
    NotificationTypeA:
      properties:
        params:
          type: object
          properties:
            channel:
              type: string
              enum:
                - public
                - collaborators

    NotificationTypeB:
      properties:
        params:
          type: object
          properties:
            channel:
              type: string
              enum:
                - public
                - collaborators
```

```typescript [Without collisionDetection (default)]
// ❌ Both files export the same enum - collision!
// NotificationTypeA.ts
export const paramsChannelEnum = {
  public: "public",
  collaborators: "collaborators"
} as const

// NotificationTypeB.ts
export const paramsChannelEnum = {  // Duplicate!
  public: "public",
  collaborators: "collaborators"
} as const
```

```typescript [With collisionDetection: true]
// ✅ Unique enum names - no collision
// NotificationTypeA.ts
export const notificationTypeAParamsChannelEnum = {
  public: "public",
  collaborators: "collaborators"
} as const

// NotificationTypeB.ts
export const notificationTypeBParamsChannelEnum = {
  public: "public",
  collaborators: "collaborators"
} as const
```

:::

**How to enable:**

```typescript
// kubb.config.ts
export default defineConfig({
  plugins: [
    pluginOas({
      collisionDetection: true,  // Recommended - prevents all collision types
    }),
  ],
})
```

> [!TIP]
> This enhancement is backward compatible and only activates when `collisionDetection: true`. It's recommended to enable this option to prepare for Kubb v5, where it will be the default.

---

## 4.19.0

### ✨ Features

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

**Added `collisionDetection` option to prevent schema name conflicts**

New opt-in `collisionDetection` option intelligently handles name collisions when OpenAPI specs contain schemas with the same name (case-insensitive) across different components.

```typescript
// kubb.config.ts
export default defineConfig({
  plugins: [
    pluginOas({
      collisionDetection: true,  // Enable collision detection
    }),
  ],
})
```

**How it works:**

**Cross-component collisions** add semantic suffixes:

::: code-group

```yaml [OpenAPI Spec]
components:
  schemas:
    Order:
      type: object
      properties:
        id: { type: string }

  requestBodies:
    Order:
      content:
        application/json:
          schema:
            type: object
            properties:
              items: { type: array }
```

```typescript [Generated with collisionDetection: true]
// ✅ No conflicts - semantic suffixes added
export type OrderSchema = { id: string }
export type OrderRequest = { items: unknown[] }
```

```typescript [Generated with collisionDetection: false]
// ❌ May cause duplicate files or overwrite issues
export type Order = { id: string }
export type Order = { items: unknown[] }  // Collision!
```

:::

**Same-component collisions** add numeric suffixes:

::: code-group

```yaml [OpenAPI Spec]
components:
  schemas:
    Variant: { type: string, enum: [A, B] }
    variant: { type: string, enum: [X, Y] }
```

```typescript [Generated]
// ✅ Deterministic numeric suffixes
export type Variant = 'A' | 'B'
export type Variant2 = 'X' | 'Y'
```

:::

> [!NOTE]
> This option is disabled by default to preserve backward compatibility. It will become the default in Kubb v5.

---

## 4.18.5

### 🐛 Bug Fixes

#### [`@kubb/plugin-zod`](/plugins/plugin-zod/)

**Improved nullable schema handling in OpenAPI 3.1**

Improved handling of nullable schemas in OpenAPI 3.1 by properly recognizing `type: null` variants. Previously, some nullable schema patterns were not correctly identified, causing incorrect Zod schema generation.

> [!NOTE]
> This fix implements the solution from [#2362](https://github.com/kubb-labs/kubb/pull/2362).

---

#### [`@kubb/plugin-zod`](/plugins/plugin-zod/)

**Fixed incorrect omit usage on z.union schemas**

Fixed an issue where `.omit()` was being applied to `z.union()` schemas, which is not valid in Zod. The plugin now correctly avoids using omit on union types.

> [!NOTE]
> This fix implements the solution from [#2368](https://github.com/kubb-labs/kubb/pull/2368).

---

## 4.18.4

### ✨ Features

#### [`@kubb/cli`](/helpers/cli/)

**Added Kubb mascot logo to CLI welcome message**

The CLI now displays an improved welcome message featuring the Kubb mascot character with colorful gradients and a cleaner layout. This provides a more engaging and branded experience when using the Kubb CLI.

---

## 4.18.3

### ✨ Features

#### [`@kubb/cli`](/helpers/cli/)

**Added Kubb mascot logo to CLI welcome message**

The CLI now displays an improved welcome message featuring the Kubb mascot character with colorful gradients and a cleaner layout. This provides a more engaging and branded experience when using the Kubb CLI.

---

## 4.18.2

### 🐛 Bug Fixes

#### [`@kubb/plugin-ts`](/plugins/plugin-ts/)

**Fixed missing export for `asPascalConst` enum type aliases**

When using `enumType: 'asPascalConst'`, the generated type alias was not exported, preventing consuming code from importing the type. TypeScript allows values and types with identical names to coexist in separate namespaces, so both can be safely exported.

::: code-group

```typescript [Before]
// Generated enum const
export const PetType = {
  Dog: 'dog',
  Cat: 'cat',
} as const
type PetType = (typeof PetType)[keyof typeof PetType] // ❌ Not exported!
```

```typescript [After]
// Generated enum const
export const PetType = {
  Dog: 'dog',
  Cat: 'cat',
} as const
export type PetType = (typeof PetType)[keyof typeof PetType] // ✅ Now exported!
```

:::

---

#### [`@kubb/plugin-faker`](/plugins/plugin-faker/)

**Fixed incorrect spreading of factory functions in `allOf` schemas with single refs**

When using `allOf` with a single reference to a primitive type (e.g., enum), the generated factory code was incorrectly spreading the result. This has been fixed so that single refs in `allOf` are no longer spread, while multiple refs continue to be spread correctly.

::: code-group

```typescript [Before]
// Generated factory for enum type
export function createIssueCategory() {
  faker.seed([100])
  return faker.helpers.arrayElement(['close out', 'something needed', 'safety', 'progress'])
}

// Parent object incorrectly spreading the enum factory
export function createTestObject() {
  return {
    category: { ...createIssueCategory() }, // ❌ Spreading a string value!
  }
}
```

```typescript [After]
// Generated factory for enum type (unchanged)
export function createIssueCategory() {
  faker.seed([100])
  return faker.helpers.arrayElement(['close out', 'something needed', 'safety', 'progress'])
}

// Parent object correctly using the enum factory
export function createTestObject() {
  return {
    category: createIssueCategory(), // ✅ No spreading!
  }
}
```

:::

> [!NOTE]
> This fix resolves the issue reported in [#1767](https://github.com/kubb-labs/kubb/issues/1767) where nullable enum types were being incorrectly spread.

---

## 4.18.1

### 🐛 Bug Fixes

#### [`@kubb/plugin-faker`](/plugins/plugin-faker/)

**Fixed infinite recursion for self-referencing types**

Fixed a critical issue where self-referencing types (e.g., `Node` with `children: Node[]`) caused infinite recursion and "Maximum call stack size exceeded" errors. The plugin now detects self-references and safely returns `undefined` instead of making recursive calls.

::: code-group

```typescript [Before]
// Self-referencing type caused infinite recursion
export function node(data?: Partial<Node>): Node {
  return {
    ...{ id: faker.string.alpha(), children: faker.helpers.multiple(() => node()) }, // ❌ Stack overflow!
    ...(data || {}),
  }
}
```

```typescript [After]
// Safe handling of self-references
export function node(data?: Partial<Node>): Node {
  return {
    ...{ id: faker.string.alpha(), children: faker.helpers.multiple(() => undefined) }, // ✅ Safe!
    ...(data || {}),
  }
}

// Users can still override with actual data:
const myNode = node({ children: [{ id: 'child1' }] })
```

:::

> [!NOTE]
> This fix implements the solution proposed in [#ISSUE_NUMBER](https://github.com/kubb-labs/kubb/issues/ISSUE_NUMBER).

---

## 4.18.0

### ✨ Features

#### [`@kubb/plugin-client`](/plugins/plugin-client/)

**Static class client generation**

Added support for generating API clients as classes with static methods using `clientType: 'staticClass'`. This allows you to call API methods directly on the class without instantiating it:

::: code-group
```typescript [Before]
const client = new Pet()
await client.getPetById({ petId: 1 })
```

```typescript [After]
await Pet.getPetById({ petId: 1 })
```
:::

To enable, set `clientType: 'staticClass'` in your `pluginClient` options. See the plugin-client documentation for details and usage notes.

> [!NOTE]
> This feature implements [#2326](https://github.com/kubb-labs/kubb/issues/2326).

---

## 4.17.2

### 🐛 Bug Fixes

#### Multiple Plugins

**Fixed QueryKey default values for array and union request body types**

Fixed an issue where QueryKey functions and client functions incorrectly assigned `= {}` as the default parameter value for all optional request body parameters, causing TypeScript error TS2322 when the schema type was an array or a discriminated union with required fields.

**Affected plugins:**
- [`@kubb/plugin-react-query`](/plugins/plugin-react-query/)
- [`@kubb/plugin-solid-query`](/plugins/plugin-solid-query/)
- [`@kubb/plugin-vue-query`](/plugins/plugin-vue-query/)
- [`@kubb/plugin-svelte-query`](/plugins/plugin-svelte-query/)
- [`@kubb/plugin-swr`](/plugins/plugin-swr/)
- [`@kubb/plugin-client`](/plugins/plugin-client/)

**Changes:**
- Array types now correctly use `= []` as default
- Union types (anyOf/oneOf) with required fields now have no default value
- Union types with all-optional variants use `= {}`
- Object types with optional fields continue to use `= {}`

**Code improvements:**
- Added shared `getDefaultValue()` utility function to [`@kubb/oas`](/core/oas/) for determining appropriate default values based on schema type
- Eliminated 515 lines of duplicated code across all affected plugins
- Single source of truth ensures consistent behavior

::: code-group

```typescript [Before]
// Array type - incorrect default
export const getUsersByIdsQueryKey = (
  data: string[] = {},  // ❌ TS2322 error
) => [{ url: '/users/batch' }, ...(data ? [data] : [])] as const

// Union type with required fields - incorrect default
export const filterItemsQueryKey = (
  data: FilterByCategory | FilterByTag = {},  // ❌ TS2322 error
) => [{ url: '/items/filter' }, ...(data ? [data] : [])] as const
```

```typescript [After]
// Array type - correct default
export const getUsersByIdsQueryKey = (
  data: string[] = [],  // ✅ Correct!
) => [{ url: '/users/batch' }, ...(data ? [data] : [])] as const

// Union type with required fields - no default
export const filterItemsQueryKey = (
  data: FilterByCategory | FilterByTag,  // ✅ Correct!
) => [{ url: '/items/filter' }, ...(data ? [data] : [])] as const
```

:::

## 4.17.1

### 🐛 Bug Fixes

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

Update packages


## 4.17.0

### ✨ Features

#### [`@kubb/plugin-ts`](/plugins/plugin-ts/) and [`@kubb/core`](/core/)

**Configurable enum key casing**

Added a new `enumKeyCasing` option to `@kubb/plugin-ts` that allows you to control how enum key names are generated. This improves code readability and allows you to use conventional dot-notation syntax instead of bracket notation when accessing enum values.

**New transformers in `@kubb/core`:**
- `screamingSnakeCase`: Converts to SCREAMING_SNAKE_CASE
- `snakeCase`: Converts to snake_case

**New option in `@kubb/plugin-ts`:**

The `enumKeyCasing` option supports the following values:
- `'screamingSnakeCase'`: ENUM_VALUE (recommended for TypeScript enums)
- `'snakeCase'`: enum_value
- `'pascalCase'`: EnumValue
- `'camelCase'`: enumValue
- `'none'`: Uses the enum value as-is (default, preserves backward compatibility)

::: code-group

```typescript [Configuration]
// kubb.config.ts
export default {
  plugins: [
    pluginTs({
      enumType: 'enum',
      enumKeyCasing: 'screamingSnakeCase',
    }),
  ],
}
```

```typescript [Before]
export const enumStringEnum = {
  'created at': 'created at',
  'FILE.UPLOADED': 'FILE.UPLOADED',
} as const

// Usage requires bracket syntax
const value = enumStringEnum['created at']
```

```typescript [After]
export const enumStringEnum = {
  CREATED_AT: 'created at',
  FILE_UPLOADED: 'FILE.UPLOADED',
} as const

// Usage with clean dot-notation syntax
const value = enumStringEnum.CREATED_AT
```

:::

**Additional improvements:**
- Enum member keys now use identifiers without quotes when the key is a valid JavaScript identifier, making the output cleaner and more idiomatic
- Default value is `'none'` to preserve existing behavior and ensure backward compatibility

### 🐛 Bug Fixes

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

**Removed incorrect enumSuffix warning**

Fixed an issue where setting `enumSuffix: ''` in plugin configuration would trigger a misleading warning message `ℹ EnumSuffix set to an empty string does not work`. The feature actually works correctly - empty string suffixes are fully supported and tested. The incorrect warning has been removed.

## 4.16.0

### ✨ Features

#### MCP Support

Kubb now includes support for the Model Context Protocol (MCP), enabling AI assistants and tools to interact with your OpenAPI specifications programmatically.

> [!NOTE]
> The Kubb MCP server allows AI assistants like Claude Desktop to read, analyze, and generate code from OpenAPI specifications using the standardized MCP interface.

> [!TIP]
> To use the Kubb MCP server, install `@kubb/mcp` and run `npx @kubb/mcp` or `kubb mcp`

## 4.15.2

### 🐛 Bug Fixes

#### [`@kubb/plugin-react-query`](/plugins/plugin-react-query/)

No empty object should be passed if all parameters are optional

## 4.15.1

### 🐛 Bug Fixes

#### [`@kubb/plugin-ts`](/plugins/plugin-ts/)

**Fixed TS2411 error in QueryParams with mixed property types**

Fixed TypeScript compilation errors (TS2411) that occurred when generated QueryParams types combined typed properties (enums, objects) with dynamic parameters from `additionalProperties` (when using `style: form` with `explode: true`).

**Root Cause:**

The parser always used the specific `additionalProperties` type for index signatures, creating `[key: string]: string` that conflicts with non-string typed properties.

**Solution:**

When typed properties and `additionalProperties` coexist, use `[key: string]: unknown` for the index signature. This preserves type safety while avoiding conflicts.

::: code-group

```typescript [Before (TS2411 Error)]
export type QueryParams = {
  include?: 'author' | 'tags';    // ❌ TS2411: not assignable to string
  page?: { number?: number };      // ❌ TS2411: not assignable to string
  sort?: string;
  [key: string]: string;           // 💥 Conflicts with typed properties
};
```

```typescript [After (Fixed)]
export type QueryParams = {
  include?: 'author' | 'tags';     // ✅ Compatible with unknown
  page?: { number?: number };      // ✅ Compatible with unknown
  sort?: string;
  [key: string]: unknown;          // ✅ No conflicts
};
```

:::

**Impact:**
- No breaking changes - backward compatible
- Only affects types with both typed properties and `additionalProperties`
- Types with only `additionalProperties` remain unchanged

---

## 4.15.0

### ✨ Features

#### [`@kubb/plugin-react-query`](/plugins/plugin-react-query/)

**Custom TanStack Query hook options support**

Added support for custom TanStack Query hook options through the new `customOptions` configuration. This allows you to inject custom behavior into generated hooks such as query invalidation, custom error handling, or any other TanStack Query options you need to customize globally.

**Key features:**
- **Type-safe customization**: Generates a `HookOptions` type for full type safety when implementing custom hook options
- **Per-hook customization**: Customize options for individual hooks based on `hookName` or `operationId`
- **Flexible integration**: Use any custom logic in your hook (access query client, implement error handling, etc.)

::: code-group

```typescript [Configuration]
// kubb.config.ts
import { defineConfig } from '@kubb/core'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  plugins: [
    pluginReactQuery({
      customOptions: {
        importPath: './hooks/useCustomHookOptions.ts',
        name: 'useCustomHookOptions', // optional, defaults to 'useCustomHookOptions'
      },
    }),
  ],
})
```

```typescript [Custom Hook Implementation]
// hooks/useCustomHookOptions.ts
import { useQueryClient } from '@tanstack/react-query'
import type { HookOptions } from './gen/HookOptions' // Generated type

export function useCustomHookOptions<T extends keyof HookOptions>({
  hookName,
  operationId
}: {
  hookName: T
  operationId: string
}): HookOptions[T] {
  const queryClient = useQueryClient()

  // Example: Invalidate related queries on mutation
  const customOptions = {
    useFindPetById: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pets'] })
      },
    },
    // ... more custom options for other hooks
  }

  return customOptions[hookName] ?? {}
}
```

```typescript [Generated Usage]
// Generated hook will automatically use custom options
export function useFindPetById(petId: string, options?: QueryOptions) {
  const customOptions = useCustomHookOptions({
    hookName: 'useFindPetById',
    operationId: 'findPetById'
  })

  return useQuery({
    ...findPetByIdQueryOptions(petId),
    ...customOptions, // Custom options are applied here
    ...options,
  })
}
```

:::

**Use cases:**
- Automatically invalidate related queries on mutations
- Implement global error handling for specific operations
- Add retry logic based on operation type
- Inject analytics or logging into query lifecycle
- Configure staleTime/cacheTime per operation category

::: tip Type Safety
The generated `HookOptions` type ensures your custom hook implementation is type-safe and includes all generated hooks (queries, mutations, suspense queries, and infinite queries).
:::

> [!NOTE]
> This feature is available for `@kubb/plugin-react-query` in v4.15.0. Similar support for other query plugins (Vue Query, Solid Query, Svelte Query, SWR) may be added in future releases.

---

## 4.14.1

### 🚀 Performance Improvements

Achieved 18-27% performance improvement for OpenAPI code generation through advanced optimizations including increased parallelism and schema caching.

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

**Increased Processing Parallelism:**
- Operation processing concurrency increased from 10 to 30 concurrent operations
- Schema processing concurrency increased from 10 to 30 concurrent schemas
- Generator parallelism increased from 1 to 3 concurrent generators

**Added Schema Caching:**
- Implemented schema parse caching to eliminate redundant parsing

::: tip Performance Impact
These optimizations provide:
- **10-15%** faster operation processing
- **8-12%** faster schema generation
- **3-5%** reduction from schema caching
- **Overall: 18-27% faster code generation**
  :::

#### [`@kubb/core`](/core/)

**Improved Parallelism:**
- PluginManager concurrency increased from 5 to 15 for better parallel plugin execution
- Better resource utilization on multi-core systems
- **4-7%** performance improvement

::: info Compatibility
All changes are backward compatible with no breaking changes to APIs or plugin behavior.
:::

#### [`@kubb/plugin-ts`](/plugins/plugin-ts/)

**New `inlineLiteral` enum type for cleaner TypeScript definitions**

Added `inlineLiteral` as a new value for the `enumType` option, allowing enum values to be inlined directly into type properties instead of generating separate enum declarations.

::: code-group

```typescript [Before (asConst)]
export const petStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusEnumKey = (typeof petStatusEnum)[keyof typeof petStatusEnum]

export interface Pet {
  status?: PetStatusEnumKey
}
```

```typescript [After (inlineLiteral)]
export interface Pet {
  status?: "available" | "pending" | "sold"
}
```

:::

**Usage:**
```typescript
pluginTs({
  enumType: 'inlineLiteral',
})
```

> [!NOTE]
> In Kubb v5, `inlineLiteral` will become the default `enumType`.

---

All notable changes to Kubb are documented here. Each version is organized with clear categories (Features, Bug Fixes, Breaking Changes, Dependencies) and includes code examples where applicable. Use the outline navigation in the right sidebar to quickly jump to any version.

- ✨ **Features** - New functionality and enhancements
- 🐛 **Bug Fixes** - Bug fixes and corrections
- 🚀 **Breaking Changes** - Changes that may require code updates
- 📦 **Dependencies** - Package updates and dependency changes

> [!TIP]
> Use the outline navigation (right sidebar) to quickly jump to specific versions.


## 4.14.0

### ✨ Features

#### [`@kubb/plugin-ts`](/plugins/plugin-ts/)

Added `arrayType` option to switch between `Array<Type>` and `Type[]` syntax for array types.

::: code-group

```typescript [array (default)]
type Pet = {
  tags: string[]
}
```

```typescript [generic]
type Pet = {
  tags: Array<string>
}
```

:::

## 4.13.1

### 🐛 Bug Fixes

#### [`@kubb/plugin-ts`](/plugins/plugin-ts/)

**Fixed TypeScript Printer Crash with Object Prototype Property Names**

Resolved a critical issue where schemas containing properties named after JavaScript built-in methods (e.g., `toString`, `valueOf`, `hasOwnProperty`) would crash the TypeScript printer with `"Debug Failure. Unhandled SyntaxKind: Unknown"`.

**Root Cause:**

The mapper lookup was using bracket notation (`options.mapper?.[mappedName]`), which searches the entire prototype chain. For property names like `"toString"`, it would find `Object.prototype.toString` and treat it as a custom mapping function instead of creating a proper TypeScript property signature.

**Solution:**

Changed the mapper check to use `Object.prototype.hasOwnProperty.call()` to only match user-defined mapper properties:

::: code-group

```typescript [Before]
// Matches inherited properties from Object.prototype
if (options.mapper?.[mappedName]) {
  return options.mapper?.[mappedName]  // Returns Object.prototype.toString
}
```

```typescript [After]
// Only matches own properties, not inherited ones
if (options.mapper && Object.prototype.hasOwnProperty.call(options.mapper, mappedName)) {
  return options.mapper[mappedName]
}
```

:::

**Affected Schemas:**

This bug affected any OpenAPI schema with properties named after JavaScript built-in methods, including:
- `toString`
- `valueOf`
- `hasOwnProperty`
- `constructor`
- Other Object.prototype methods

**Example Schema:**

```yaml
components:
  schemas:
    ChangeItemBean:
      type: object
      properties:
        field: { type: string }
        toString: { type: string }  # Previously crashed, now works
        valueOf: { type: string }    # Previously crashed, now works
```

## 4.13.0

### ✨ Features

#### [`@kubb/cli`](/getting-started/installation/), [`@kubb/core`](/api/core/)

**Auto-Detection for Formatters and Linters**

Added `'auto'` option for both `output.format` and `output.lint` configurations. When set to `'auto'`, Kubb automatically detects and uses available tools, eliminating the need to explicitly specify which formatter or linter to use.

**Format Auto-Detection:**

When `format: 'auto'` is set, Kubb checks for formatters in this order:
1. **biome** (first choice)
2. **oxfmt** (second choice)
3. **prettier** (third choice)

::: code-group

```typescript [Before]
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    format: 'prettier', // Had to specify which formatter
  },
})
```

```typescript [After]
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    format: 'auto', // Automatically detects biome or oxfmt or prettier
  },
})
```

:::

**Lint Auto-Detection:**

When `lint: 'auto'` is set, Kubb checks for linters in this order:
1. **biome** (first choice)
2. **oxlint** (second choice)
3. **eslint** (third choice)

::: code-group

```typescript [Before]
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    lint: 'eslint', // Had to specify which linter
  },
})
```

```typescript [After]
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    lint: 'auto', // Automatically detects biome, oxlint, or eslint
  },
})
```

:::

**Combined Usage:**

::: code-group

```typescript [kubb.config.ts]
export default defineConfig({
  input: { path: './petStore.yaml' },
  output: {
    path: './src/gen',
    format: 'auto', // Detects biome or prettier
    lint: 'auto',   // Detects biome, oxlint, or eslint
  },
})
```

:::

If no formatter or linter is detected, Kubb will emit a warning and skip the respective operation, ensuring your build continues smoothly.

::: tip
This feature provides a convenient default for users who want formatting/linting without having to configure which specific tool to use. The detection uses the `--version` flag to check tool availability.
:::

## 4.12.13

### 🐛 Bug Fixes

#### [`@kubb/cli`](/getting-started/installation/)

Fixed module resolution issue when loading TypeScript configuration files. Previously, jiti used the CLI's installation location for module resolution, which could cause errors like `Cannot find module './_baseIsArguments'` when the user's config imported Kubb plugins. Now jiti correctly resolves modules relative to the config file's location, matching standard Node.js module resolution behavior.

::: info
This fix resolves issues where users encountered module resolution errors when running `npx kubb generate` with a `kubb.config.ts` file that imports Kubb plugins.
:::

## 4.12.11

### ✨ Features

#### [`@kubb/oas`](/api/oas/), [`@kubb/plugin-oas`](/plugins/plugin-oas/)

Comprehensive discriminator improvements with full OpenAPI 3.0 and 3.1 compliance.

**Inline Schema Support:**

Discriminators now work with inline schemas in `oneOf`/`anyOf`, not just `$ref` references:

::: code-group

```yaml [OpenAPI]
components:
  schemas:
    Response:
      discriminator:
        propertyName: status
      oneOf:
        - type: object
          title: Success
          properties:
            status:
              const: success
            data:
              type: object
        - type: object
          title: Error
          properties:
            status:
              const: error
            message:
              type: string
```

```typescript [Generated]
export type Response =
  | {
      status?: "success"
      data?: object
    }
  | {
      status?: "error"
      message?: string
    }
```

:::

**Extension Property Discriminators:**

Support for extension properties as discriminator names (e.g., `x-linode-ref-name`):

::: code-group

```yaml [OpenAPI]
components:
  schemas:
    Data:
      discriminator:
        propertyName: x-response-type
      oneOf:
        - type: object
          x-response-type: Success
          properties:
            result:
              type: object
        - type: object
          x-response-type: Error
          properties:
            error:
              type: string
```

```typescript [Generated]
export type Data =
  | {
      result?: object
    }
  | {
      error?: string
    }
```

:::

Extension properties are treated as metadata and don't generate runtime validation constraints.

**Additional Improvements:**

- ✅ Const and single-value enum support for discriminator values
- ✅ Mixed `$ref` and inline schemas in the same `oneOf`/`anyOf`
- ✅ Title fallback for inline schemas without explicit discriminator values
- ✅ Inferred mapping when explicit mapping not provided
- ✅ Support for both `oneOf` and `anyOf` constructs
- ✅ Synthetic ref handling with bounds validation
- ✅ Error handling for invalid schema references

**Supported Patterns:**

All discriminator patterns from OpenAPI 3.0 and 3.1 specifications are now supported:

- With explicit mapping
- Without mapping (inferred from schema names)
- `oneOf` and `anyOf` constructs
- Strict and inherit modes
- Inline schemas
- Extension properties (x-*)
- Const values
- Single-value enums
- Mixed `$ref` and inline schemas

**Documentation:**

See [Discriminators](/guide/oas#discriminators) in the knowledge base for comprehensive examples and patterns.

## 4.12.10

#### [`@kubb/oas`](/api/oas/), [`@kubb/plugin-ts`](/plugins/plugin-ts/)

### 🐛 Bug Fixes

Better patternProperties handling for type generation.

## 4.12.9

### 🐛 Bug Fixes

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

Flatten allof to support better Zod schemas

## 4.12.8

### 🐛 Bug Fixes

#### [`@kubb/cli`](/plugins/cli/)

Support for `--silent` flag to set LogLevel to **silent**.

## 4.12.7

### 🐛 Bug Fixes

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

Only validate once

## 4.12.6

### ✨ Features

#### Development Tooling

Added [Knip](https://knip.dev/) for unused code detection to help maintain code quality and identify unused exports, dependencies, and files across the monorepo.

**Usage:**

```bash
# Run Knip to detect unused code
pnpm run knip

# Run Knip in production mode
pnpm run knip:production
```

The configuration is defined in `knip.json` at the repository root and automatically ignores examples, e2e tests, and documentation workspaces.

## 4.12.5

### ✨ Features

#### Performance Optimizations

Improved performance across the core and OAS packages with several key optimizations:

**[`@kubb/oas`](/plugins/plugin-oas/)**

Replaced inefficient JSON deep cloning with native `structuredClone()` API. The previous `JSON.parse(JSON.stringify())` approach was significantly slower and more memory-intensive, especially for large OpenAPI documents.

::: code-group

```typescript [Before]
const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data));
```

```typescript [After]
const api: OasTypes.OASDocument = structuredClone(config.input.data);
```

:::

**[`@kubb/core`](/plugins/core/)**

1. **Plugin Lookup Optimization**: Eliminated O(n\*m) complexity in barrel file generation by creating a plugin key Map before nested loops, replacing expensive array spreading and linear searches with O(1) Map lookups.

2. **Object Spreading**: Replaced repeated object spreading with `Object.assign()` in plugin context initialization, preventing unnecessary object allocations on each loop iteration.

3. **Array Operations**: Optimized filter-map chains to use single-pass `reduce()`, eliminating redundant array iterations when processing settled promises.

These optimizations provide measurable performance improvements when generating code from large OpenAPI specifications with many plugins and files.

## 4.12.4

### 🐛 Bug Fixes

#### [`@kubb/plugin-oas`](/plugins/plugin-oas/)

Fixed handling of empty schema objects `{}` in `anyOf`, `oneOf`, and `allOf` constructs.

Empty schema objects (`{}`) in JSON Schema represent "accepts any value" per the specification, but were being incorrectly filtered out from unions and intersections. This caused schemas like `anyOf: [{}, {type: "null"}]` to generate only `null` instead of the correct `unknown | null`.

::: code-group

```typescript [Before]
export type ParameterBinding = {
  /**
   * @description The fixed value when source is FIXED.
   */
  fixed_value?: null; // Missing unknown type
};
```

```typescript [After]
export type ParameterBinding = {
  /**
   * @description The fixed value when source is FIXED.
   */
  fixed_value?: unknown | null; // Correct union type
};
```

:::

The fix ensures that empty schemas are properly preserved as the configured `unknownType` (or `emptySchemaType`) in the generated types, matching the JSON Schema specification.

## 4.12.3

### 🐛 Bug Fixes

#### [`@kubb/oas`](/api/oas/), [`@kubb/plugin-ts`](/plugins/plugin-ts/), [`@kubb/plugin-zod`](/plugins/plugin-zod/), [`@kubb/plugin-faker`](/plugins/plugin-faker/)

Fixed handling of query parameters with `explode: true` and `style: form` for objects with `additionalProperties`.

When a query parameter has `style: "form"`, `explode: true`, and a schema with `type: "object"` and `additionalProperties` but no defined properties, the parameter is now correctly flattened to have additionalProperties at the root level instead of being nested as a property.

::: code-group

```typescript [Before]
export type SystemsQueryParams = {
  /**
   * @description Custom fields
   * @type object | undefined
   */
  customFields?: {
    [key: string]: string;
  };
};
```

```typescript [After]
export type SystemsQueryParams = {
  [key: string]: string;
};
```

:::

This matches the OpenAPI specification where `explode: true` causes object properties to be expanded as separate query parameters at the root level.

## 4.12.2

### 🐛 Bug Fixes

#### [`@kubb/plugin-ts`](/plugins/plugin-ts/)

Added TypeScript as a peerDependency to ensure proper compatibility with the `mapper` option. The `mapper` feature uses TypeScript's compiler API (specifically `ts.PropertySignature` and `factory` methods), which requires TypeScript to be installed in the consuming project.

::: warning
If you're using the `mapper` option in `@kubb/plugin-ts`, ensure you have TypeScript >=5.9.0 installed in your project.
:::

::: code-group

```json [package.json]
{
  "dependencies": {
    "@kubb/plugin-ts": "^4.12.2",
    "typescript": "^5.9.3"
  }
}
```

:::

## 4.12.1

### 🐛 Bug Fixes

#### [`@kubb/plugin-cypress`](/plugins/plugin-cypress/), [`@kubb/plugin-msw`](/plugins/plugin-msw/)

Uses backticks so that the baseUrl can be set to a dynamic value (like an environment variable).

::: code-group

```typescript [Before]
// Generated with single quotes - static string
const baseUrl = "https://api.example.com";
```

```typescript [After]
// Generated with backticks - allows template literals
const baseUrl = `https://api.example.com`;
// Now you can use: const baseUrl = `${process.env.API_URL}`
```

:::

## 4.12.0

### ✨ Features

#### [`@kubb/cli`](/plugins/cli/), [`@kubb/core`](/api/core/)

Replace cli-progress and consola with @clack/prompts for modern interactive progress bars. Introduces flexible logger pattern with Claude-inspired CLI and GitHub Actions support.

**Key features:**

- Event-driven logging architecture with `KubbEvents`
- Multiple logger implementations that adapt to different environments:
  - **Clack Logger** - Modern interactive CLI with animated progress bars
  - **GitHub Actions Logger** - CI-optimized with collapsible sections (`::group::` annotations)
  - **Plain Logger** - Simple text output for basic terminals
  - **File System Logger** - Writes logs to files
- Custom logger support via `defineLogger` API
- Automatic logger selection based on environment detection

::: code-group

```typescript [Custom Logger]
import { defineLogger, LogLevel } from "@kubb/core";

export const customLogger = defineLogger({
  name: "custom",
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info;

    context.on("lifecycle:start", (version) => {
      console.log(`Starting Kubb ${version}`);
    });

    context.on("plugin:start", (plugin) => {
      console.log(`Generating ${plugin.name}`);
    });

    context.on("plugin:end", (plugin, { duration }) => {
      console.log(`${plugin.name} completed in ${duration}ms`);
    });

    context.on("error", (error) => {
      console.error(error.message);
    });
  },
});
```

:::

**New KubbEvents:**

- `lifecycle:start` - Emitted at the beginning of the Kubb lifecycle
- `lifecycle:end` - Emitted at the end of the Kubb lifecycle
- `config:start` - Emitted when configuration loading starts
- `config:end` - Emitted when configuration loading completes
- `generation:start` - Emitted when code generation phase starts
- `generation:end` - Emitted when code generation phase completes
- `generation:summary` - Emitted with generation results summary
- `format:start` / `format:end` - Code formatting events
- `lint:start` / `lint:end` - Linting events
- `hook:start` / `hook:end` / `hook:execute` - Hook execution events
- `plugin:start` / `plugin:end` - Plugin execution events
- `files:processing:start` / `file:processing:update` / `files:processing:end` - File processing events
- `info` / `success` / `warn` / `error` / `debug` - Log message events
- `version:new` - New version available notification

## 4.11.2

### 🐛 Bug Fixes

#### [`@kubb/oas`](/plugins/oas/)

Fixed issue with uninitialized `oasClass` causing errors during OpenAPI schema processing.

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
        const minSchema = findSchemaKeyword(tree.siblings, "min");
        const maxSchema = findSchemaKeyword(tree.siblings, "max");
        return zodKeywordMapper.string(
          shouldCoerce(options.coercion, "strings"),
          minSchema?.args,
          maxSchema?.args,
          options.mini,
        );
      },
      union(tree, options) {
        const { current } = tree;
        return zodKeywordMapper.union(
          sort(current.args)
            .map((it) => this.parse({ ...tree, current: it }, options))
            .filter(Boolean),
        );
      },
    },
  });
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
    Dog: "dog",
    Cat: "cat",
  } as const;

  type PetTypeKey = (typeof petType)[keyof typeof petType];
  ```

  ```typescript [asPascalConst]
  const PetType = {
    Dog: "dog",
    Cat: "cat",
  } as const;

  type PetType = (typeof PetType)[keyof typeof PetType];
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
          - $ref: "#/components/schemas/PhoneNumber"
          - maxLength: 15 # ❌ This constraint was lost
  ```

  ```typescript [Before - Missing maxLength]
  // Generated Zod schema was missing .max(15)
  export const phoneWithMaxLengthSchema = z
    .string()
    .regex(/^(\+\d{1,3}[-\s]?)?.*$/);
  // Missing: .max(15)
  ```

  ```typescript [After - Includes maxLength]
  // Generated Zod schema correctly includes .max(15)
  export const phoneWithMaxLengthSchema = z
    .string()
    .regex(/^(\+\d{1,3}[-\s]?)?.*$/)
    .max(15); // ✅ Now correctly included
  ```

  :::

## 4.9.3

### 🐛 Bug Fixes

- **Query Plugins** - Fix `mutation: false` option being ignored

  Fix `mutation: false` option being ignored in all TanStack Query plugins (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-solid-query`, `@kubb/plugin-svelte-query`, `@kubb/plugin-swr`).

  When `mutation: false` was set in plugin configuration, mutation hooks were still being generated. This occurred because the plugin was spreading the `false` value into an object with default configuration values instead of checking for it explicitly.

  ::: code-group

  ```typescript [Before - Not Working]
  import { defineConfig } from "@kubb/core";
  import { pluginReactQuery } from "@kubb/plugin-react-query";

  export default defineConfig({
    plugins: [
      pluginReactQuery({
        mutation: false, // ❌ Was still generating mutation hooks
      }),
    ],
  });
  ```

  ```typescript [After - Working]
  import { defineConfig } from "@kubb/core";
  import { pluginReactQuery } from "@kubb/plugin-react-query";

  export default defineConfig({
    plugins: [
      pluginReactQuery({
        mutation: false, // ✅ Now properly prevents mutation hook generation
        query: true, // Only generates queryOptions
      }),
    ],
  });
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
  import { defineConfig } from "@kubb/core";
  import { pluginClient } from "@kubb/plugin-client";
  import { pluginOas } from "@kubb/plugin-oas";
  import { pluginReactQuery } from "@kubb/plugin-react-query";
  import { pluginTs } from "@kubb/plugin-ts";

  export default defineConfig({
    input: {
      path: "./petStore.yaml",
    },
    output: {
      path: "./src/gen",
    },
    plugins: [
      pluginOas(),
      pluginTs(),
      // Class-based clients for direct usage
      pluginClient({
        output: {
          path: "./clients/class",
        },
        clientType: "class",
        group: { type: "tag" },
      }),
      // Query hooks work with inline function-based clients
      pluginReactQuery({
        output: {
          path: "./hooks",
        },
      }),
    ],
  });
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
  import { defineConfig } from "@kubb/core";
  import { pluginClient } from "@kubb/plugin-client";
  import { pluginOas } from "@kubb/plugin-oas";
  import { pluginTs } from "@kubb/plugin-ts";

  export default defineConfig({
    input: {
      path: "./petStore.yaml",
    },
    output: {
      path: "./src/gen",
    },
    plugins: [
      pluginOas(),
      pluginTs(),
      pluginClient({
        output: {
          path: "./clients",
        },
        clientType: "class",
        group: {
          type: "tag",
        },
      }),
    ],
  });
  ```

  ```typescript [Generated Output]
  export class Pet {
    #client: typeof fetch;

    constructor(
      config: Partial<RequestConfig> & { client?: typeof fetch } = {},
    ) {
      this.#client = config.client || fetch;
    }

    async getPetById({ petId }: { petId: number }, config = {}) {
      const { client: request = this.#client, ...requestConfig } = config;
      const res = await request<
        GetPetByIdQueryResponse,
        ResponseErrorConfig<GetPetById400>,
        unknown
      >({
        method: "GET",
        url: `/pet/${petId}`,
        ...requestConfig,
      });
      return res.data;
    }

    async addPet(data: AddPetMutationRequest, config = {}) {
      const { client: request = this.#client, ...requestConfig } = config;
      const requestData = data;
      const res = await request<
        AddPetMutationResponse,
        ResponseErrorConfig<AddPet405>,
        AddPetMutationRequest
      >({
        method: "POST",
        url: "/pet",
        data: requestData,
        ...requestConfig,
      });
      return res.data;
    }
  }
  ```

  ```typescript [Usage]
  import { Pet } from "./gen/clients/Pet";

  const petClient = new Pet();

  // Get a pet by ID
  const pet = await petClient.getPetById({ petId: 1 });

  // Add a new pet
  const newPet = await petClient.addPet({
    name: "Fluffy",
    status: "available",
  });
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
z.string().optional();
```

```typescript [After (with mini: true)]
z.optional(z.string());
```

:::

Configuration automatically sets `version` to `'4'` and `importPath` to `'zod/mini'` when mini mode is enabled. Updated parser to support `.check()` syntax for constraints in mini mode.

::: code-group

```typescript [Mini Mode]
z.string().check(z.minLength(5));
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
z.uuid();
z.email();
z.url();
```

```typescript [Previous (Incorrect)]
// Attempted to use unsupported coercion syntax
z.coerce.uuid(); // ❌ Not supported in Zod 4
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
useFindPetsByTagsSuspenseInfinite();
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
  body: formData, // Passed directly
});
```

```typescript [Before (Incorrect)]
fetch(url, {
  body: JSON.stringify(formData), // ❌ Wrong
});
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
z.lazy(() => Schema);
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
  import { client } from "@kubb/plugin-client";
  ```

  ```typescript [After]
  import { client } from "./.kubb/client";
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

- **[`react`](/helpers/react/)** - Update PeerDependencies

  Update PeerDependencies `@kubb/react`.

## 4.3.0

### ✨ Features

- **[`plugin-zod`](/plugins/plugin-zod)** - Exclusive min/max constraints

  Add exclusive minimum and maximum support with Zod constraints.

::: code-group

```typescript [Example]
z.number().gt(5); // Greater than 5
z.number().lt(10); // Less than 10
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
  Active: "active",
  Inactive: "inactive",
} as const;
```

```typescript [Before]
const Status = {
  Active: "active",
  Inactive: "inactive",
} as const;
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
const { data, error } = useGetOrderById(2);
```

```typescript [After]
const { data, error } = useGetOrderById(2, { immutable: true });
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
  status?: null | string;
};
```

```typescript [After (Fixed)]
type Order = {
  status?: string;
};
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

  ConstEnum should be treated as export _ instead of export type _.

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

![Claude interaction](./public/screenshots/claude-interaction.gif)

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
import { z } from "@hono/zod-openapi";

export const showPetByIdError = z
  .lazy(() => error)
  .openapi({
    examples: [
      {
        sample: {
          summary: "A sample error",
          value: { code: 1, message: "A sample error message" },
        },
      },
      {
        other_example: {
          summary: "Another sample error",
          value: { code: 2, message: "A totally specific message" },
        },
      },
    ],
  });
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
- [`plugin-zod`](/plugins/plugin-zod): Use Regular expression literal instead of RegExp-constructor
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
  const { params } = info;
  if (params.someKey) {
    return new Response(JSON.stringify({ error: "some error response" }), {
      status: 400,
    });
  }
  return new Response(JSON.stringify({ newData: "new data" }), { status: 200 });
});
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

- [`plugin-oas`](/plugins/plugin-oas/): Correct use of variables when a path/params contains \_ or -
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
type coercion =
  | boolean
  | { dates?: boolean; strings?: boolean; numbers?: boolean };
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
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginClient } from "@kubb/plugin-client";

export default defineConfig({
  root: ".",
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginClient({
      output: {
        path: "./clients/axios",
      },
      // group: { type: 'tag', output: './clients/axios/{{tag}}Service' }, // [!code --]
      group: { type: "tag", name: ({ group }) => `${group}Service` }, // [!code ++]
    }),
  ],
});
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
z.enum(["true", "false"]); // [!code --]
z.union([z.literal(true), z.literal(false)]); // [!code ++]
```

:::

- [`plugin-ts`](/plugins/plugin-ts/): Use of `readonly` for references($ref)
- [`plugin-client`](/plugins/plugin-client/): Use of type `Error` when no errors are set for an operation

## 3.0.0-alpha.21

- [`plugin-zod`](/plugins/plugin-zod/): Use of `x-nullable` and `nullable` for additionalProperties.

## 3.0.0-alpha.20

- Separate plugin/package for Solid-Query: `@kubb/plugin-solid-query`

```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginSolidQuery } from "@kubb/plugin-solid-query"; // [!code ++]
import { pluginTanstackQuery } from "@kubb/plugin-tanstack-query"; // [!code --]

export default defineConfig({
  root: ".",
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: "models",
      },
    }),
    pluginSolidQuery({
      output: {
        path: "./hooks",
      },
    }),
  ],
});
```

- Separate plugin/package for Svelte-Query: `@kubb/plugin-svelte-query`

```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginSvelteQuery } from "@kubb/plugin-svelte-query"; // [!code ++]
import { pluginTanstackQuery } from "@kubb/plugin-tanstack-query"; // [!code --]

export default defineConfig({
  root: ".",
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: "models",
      },
    }),
    pluginSvelteQuery({
      output: {
        path: "./hooks",
      },
    }),
  ],
});
```

- Separate plugin/package for Vue-Query: `@kubb/plugin-vue-query`

```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginVueQuery } from "@kubb/plugin-vue-query"; // [!code ++]
import { pluginTanstackQuery } from "@kubb/plugin-tanstack-query"; // [!code --]

export default defineConfig({
  root: ".",
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: "models",
      },
    }),
    pluginVueQuery({
      output: {
        path: "./hooks",
      },
    }),
  ],
});
```

## 3.0.0-alpha.16

- Separate plugin/package for React-Query: `@kubb/plugin-react-query`

```typescript [kubb.config.ts]
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginReactQuery } from "@kubb/plugin-react-query"; // [!code ++]
import { pluginTanstackQuery } from "@kubb/plugin-tanstack-query"; // [!code --]

export default defineConfig({
  root: ".",
  input: {
    path: "./petStore.yaml",
  },
  output: {
    path: "./src/gen",
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: "models",
      },
    }),
    pluginReactQuery({
      output: {
        path: "./hooks",
      },
    }),
  ],
});
```
