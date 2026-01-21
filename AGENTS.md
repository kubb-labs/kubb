# AGENTS.md

This document provides essential information for AI coding assistants (Cursor, GitHub Copilot) working on the Kubb codebase.


## Folder structure

```
docs/
├── migration-guide.md    # Updated after major releases
├── changelog.md          # Updated with every PR (via changeset)
├── getting-started/      # Getting started guides
├── blog/                 # Blog posts (after major releases)
├── helpers/              # Extra packages (CLI, OAS core)
├── knowledge-base/       # Feature deep-dives and how-tos
│   ├── debugging.md
│   ├── fetch.md
│   ├── multipart-form-data.md
│   └── ...
├── plugins/              # Plugin documentation
│   ├── core/             # Shared plugin options
│   └── plugin-*/         # Individual plugin docs
├── tutorials/            # Step-by-step tutorials
├── examples/             # Playground and examples
└── builders/             # Builder integrations (unplugin, etc.)
```

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

## PR instructions

### General

- **Title format**: `[<plugin-name>] <Title>`
- **Before committing**: Run `pnpm format && pnpm lint:fix`, `pnpm typecheck`, `pnpm typecheck:examples` and `pnpm test`

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

## Documentation

**Scope**: Documentation in the `docs/` folder (Markdown/MDX with VitePress)
**Goal**: Create clear, concise, practical documentation optimized for developer experience

Deep-dives into specific topics:
- Start with concrete use case or problem
- Explain how it works
- Provide working examples
- Link to related plugins/concepts

### Code examples

**Structure**: Place examples at the bottom of each page, after all options are documented.

**Always include:**
- All required imports
- Minimal but complete configuration
- Standard example file: `petStore.yaml`
- All prerequisite plugins (e.g., `pluginOas()`)

**Example structure:**

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
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
    pluginTs({
      // Show the relevant options being documented
      output: { path: 'models' },
      enumType: 'asConst',
    }),
  ],
})
```

**Guidelines:**
- Use `twoslash` annotation for TypeScript: enables type checking
- Show only relevant options, omit unrelated configuration
- Include expected output when helpful (for CLI commands, generated code samples)

### New Plugin
1. Create `docs/plugins/plugin-name/index.md`
2. Use existing plugin docs as template
3. Include: installation, all options, working examples
4. Update `docs/config.json` to include it in the sidebar
5. Link from relevant getting-started or knowledge-base pages

### New Option
1. Add to existing plugin doc in the Options section
2. Follow the standard option format
3. Update examples if the new option is commonly used
4. Note any dependencies or prerequisites

### New Concept/Feature
1. Add to `docs/knowledge-base/` if it's a deep-dive
2. Add to `docs/getting-started/` if it's foundational
3. Use clear section headers (What, Why, How)
4. Include complete working examples
5. Link from related docs

### New Tutorial
1. Create in `docs/tutorials/`
2. Step-by-step format with clear objectives
3. Each step should be runnable and verifiable
4. Include complete code samples
5. Link from getting-started or README

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
</skills>
