# AGENTS.md

This document provides essential information for AI coding assistants (Cursor, GitHub Copilot) working on the Kubb codebase.

## Repository facts

- **Monorepo**: Managed by pnpm workspaces and Turborepo
- **Module system**: ESM-only (`type: "module"` across repo)
- **Node version**: 20
- **Versioning**: Changesets for versioning and publishing
- **CI/CD**: GitHub Actions

## Setup commands

```bash
pnpm install                # Install dependencies
pnpm clean                  # Clean build artifacts
pnpm build                  # Build all packages
pnpm generate               # Generate code from OpenAPI specs
pnpm perf                   # Run performance tests
pnpm test                   # Run tests
pnpm typecheck              # Type check all packages
pnpm typecheck:examples     # Type check examples
pnpm format                 # Format code
pnpm lint                   # Lint code
pnpm lint:fix               # Lint and fix issues
pnpm changeset              # Create changelog entry
pnpm run upgrade && pnpm i   # Upgrade dependencies
```

## Testing instructions

- We use `vitest`
- Find the CI plan in `.github/workflows/quality` folder
- From package root, run `pnpm test` - all tests must pass before merging
- Focus on specific tests: `pnpm test "<test name>"`
- Fix all test and type errors until suite is green
- After moving files or changing imports: `pnpm lint && pnpm typecheck`
- Always add or update tests for code changes
- **For docs changes**: Preview locally with `pnpm start` in `docs/` folder before committing

## Code style

- **Quotes**: Single quotes, no semicolons (see `biome.json`)
- **Patterns**: Prefer functional patterns
- **Ternary operators**: Keep ternary operators to one level deep for readability. For nested conditions, use if/else statements or extract to a helper function.
  ```typescript
  // ❌ Avoid - nested ternary
  const style = pathParameters.style || (inKey === 'query' ? 'form' : inKey === 'path' ? 'simple' : 'simple')

  // ✅ Correct - use helper function
  const getDefaultStyle = (location: string): string => {
    if (location === 'query') return 'form'
    if (location === 'path') return 'simple'
    return 'simple'
  }
  const style = pathParameters.style || getDefaultStyle(inKey)
  ```

**TypeScript conventions:**
- Module resolution: `"bundler"`; ESM only
- **Strict typing**: NEVER use `any` type or `as any` casts. Always use proper types, generics, or unknown/never when appropriate.
- Files: `.ts` for libraries, `.tsx` for React components, `.vue` for Vue components
- DTS output managed by `tsdown`
- **Import best practices**: Always use proper import statements at the module level instead of inline type imports (e.g., use `import type { Operation } from '@kubb/oas'` at the top rather than `import('@kubb/oas').Operation` inline). This improves code readability and follows TypeScript best practices.
- **Type definitions**: Define types at the root level of the file, not inside functions. This improves reusability, makes types easier to find, and follows TypeScript best practices for better type inference and documentation.
- **Function syntax in objects**: Use function syntax (not arrow functions) in object methods to enable use of `this` keyword. Example:
  ```typescript
  // ✅ Correct - function syntax
  const handlers = {
    enum(tree, options) {
      // Can use this.someMethod() if needed
    }
  }

  // ❌ Avoid - arrow function syntax
  const handlers = {
    enum: (tree, options) => {
      // Cannot use this keyword
    }
  }
  ```

**Naming conventions:**
- File/directory names: `camelCase`
- Variables/functions: `camelCase`
- Types/Interfaces: `PascalCase`
- React components: `PascalCase`

**Exports**: Packages use `"exports"` map and `typesVersions` as needed, keep public API stable

**Testing**: Test files named `*.test.ts` or `*.test.tsx` in `src` folders

## PR instructions

### General

- **Title format**: `[<plugin-name>] <Title>`
- **Before committing**: Run `pnpm format && pnpm lint:fix`, `pnpm typecheck`, and `pnpm test`
- **Before committing**: Run `pnpm generate` and `pnpm typecheck:examples` in a separate commit

### Components

Components are React components (using `@kubb/react-fabric`) that generate code templates. They use JSX syntax to declaratively create files.

**Location**: `packages/plugin-*/src/components/`

**Example structure**:

```tsx
import { File, Function, FunctionParams } from '@kubb/react-fabric'
import type { KubbNode } from '@kubb/react-fabric/types'

export function Query({ name, operation, typeSchemas, ...props }: Props): KubbNode {
  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={params.toConstructor()}>
        {/* Generated code */}
      </Function>
    </File.Source>
  )
}
```

**Key points**:
- Components return `KubbNode` (JSX elements)
- Use `@kubb/react-fabric` components like `<File>`, `<Function>`, `<Const>`, `<Type>`, etc.
- Components are composable and reusable
- Access plugin context via hooks: `usePluginManager()`, `useOas()`, `useOperationManager()`

### Generators

Generators define how code is generated. There are two types:

#### 1. Function-based generators

Return `Promise<KubbFile.File[]>`:

```typescript
import { createGenerator } from '@kubb/plugin-oas/generators'

export const myGenerator = createGenerator({
  name: 'my-generator',
  async operation(props) {
    // props: { generator, config, operation, plugin }
    return [/* KubbFile.File[] */]
  },
  async operations(props) {
    // props: { generator, config, operations, plugin }
    return [/* KubbFile.File[] */]
  },
  async schema(props) {
    // props: { generator, config, schema, plugin }
    return [/* KubbFile.File[] */]
  },
})
```

#### 2. React-based generators (recommended)

Use `createReactGenerator` and return JSX components:

```tsx
import { createReactGenerator } from '@kubb/plugin-oas/generators'
import { File } from '@kubb/react-fabric'
import { Query } from '../components/Query'

export const queryGenerator = createReactGenerator<PluginOptions>({
  name: 'query-generator',
  Operation({ config, plugin, operation, generator }) {
    // Return JSX component
    return (
      <File baseName="query.ts" path="./gen/query.ts">
        <Query name="usePet" operation={operation} />
      </File>
    )
  },
  Operations({ config, plugin, operations, generator }) {
    // Optional: Generate code for all operations
    return null
  },
  Schema({ config, plugin, schema, generator }) {
    // Optional: Generate code for schemas
    return null
  },
})
```

**Key differences**:
- React generators return `KubbNode` (JSX), function generators return `Promise<KubbFile.File[]>`
- React generators are rendered by `react-fabric` and automatically converted to files
- React generators provide better type safety and composability

**Location**: `packages/plugin-*/src/generators/`

### Options

Plugin options are defined using `PluginFactoryOptions`:

```typescript
export type Options = {
  output?: Output<Oas>
  group?: Group
  // ... other options
}

export type PluginOptions = PluginFactoryOptions<
  'plugin-name',
  Options,           // User-provided options
  ResolvedOptions,   // Resolved/validated options
  Context,           // Context exposed to other plugins
  ResolvePathOptions // Options for resolvePath
>
```

**Option resolution**:
- Options are passed from `kubb.config.ts` to plugin
- Plugins can resolve/transform options in their `install` hook
- Resolved options are available via `plugin.options` in generators/components
- Options can be overridden per-operation using `override` arrays

### React-fabric usage

`@kubb/react-fabric` is used throughout the plugin system to generate files using JSX.

**Core concepts**:
- **Fabric instance**: Created via `createReactFabric()` and passed to `PluginManager`
- **File generation**: Components render JSX, fabric converts to files
- **File management**: Fabric manages file queue, imports, exports, and deduplication

**How it works**:
1. PluginManager creates a fabric instance
2. Generators use React components to define file structure
3. Components are rendered via `fabric.render()` or `buildOperation()`/`buildOperations()`
4. Fabric extracts files from rendered JSX and adds to FileManager
5. Files are processed, transformed, and written to disk

**Example flow**:

```typescript
// In OperationGenerator.build()
if (generator.type === 'react') {
  await buildOperation(operation, {
    config,
    fabric: this.context.fabric,
    Component: generator.Operation,
    generator: this,
    plugin,
  })
}
```

**Available components** (`@kubb/react-fabric`):
- `<File>`: File container with imports/exports
- `<File.Source>`: Source code container
- `<File.Import>`: Import statements
- `<Function>`: Function declarations
- `<Const>`: Constant declarations
- `<Type>`: Type declarations
- `<Interface>`: Interface declarations

**Hooks** (`@kubb/react-fabric`):
- `usePluginManager()`: Access PluginManager instance
- `useOas()`: Access OpenAPI spec
- `useOperationManager()`: Utilities for operation-based generation
- `usePlugin()`: Access current plugin instance

### Common patterns

**Accessing other plugins**:

```typescript
const pluginManager = usePluginManager()
const tsPlugin = pluginManager.getPluginByKey([pluginTsName])
```

**Resolving paths**:

```typescript
const file = getFile(operation, { pluginKey: [pluginTsName] })
// Uses plugin's resolvePath hook
```

**Resolving names**:

```typescript
const name = getName(operation, { type: 'function', prefix: 'use' })
// Uses plugin's resolveName hook
```

**Getting schemas**:

```typescript
const schemas = getSchemas(operation, { pluginKey: [pluginTsName], type: 'type' })
// Returns: { request, response, pathParams, queryParams, headerParams, errors }
```

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
</skills>
