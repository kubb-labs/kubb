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

**TypeScript conventions:**
- Module resolution: `"bundler"`; ESM only
- Prefer strict typing; avoid `any`
- Files: `.ts` for libraries, `.tsx` for React components, `.vue` for Vue components
- DTS output managed by `tsdown`
- **Import best practices**: Always use proper import statements at the module level instead of inline type imports (e.g., use `import type { Operation } from '@kubb/oas'` at the top rather than `import('@kubb/oas').Operation` inline). This improves code readability and follows TypeScript best practices.
- **Type definitions**: Define types at the root level of the file, not inside functions. This improves reusability, makes types easier to find, and follows TypeScript best practices for better type inference and documentation.

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

### Changelog and documentation

**Required for every PR with code changes:**
- Always create a changeset using `pnpm changeset` to specify the version bump (major/minor/patch) for affected packages
- Always update `docs/changelog.md` with the new version entry describing the changes
- **Update docs in the same PR as code changes** (unless it's a docs-only PR)

**Changelog format guidelines:**

When updating `docs/changelog.md`, follow this structure:

```markdown
## X.Y.Z

### ✨ Features (or 🐛 Bug Fixes, 🚀 Breaking Changes, 📦 Dependencies)

#### [`plugin-name`](/plugins/plugin-name/)

Description of the change.

::: code-group
```typescript [Before]
// Old code example
```

```typescript [After]
// New code example
```
:::
```

**Category prefixes:**
- ✨ **Features** - New functionality and enhancements
- 🐛 **Bug Fixes** - Bug fixes and corrections
- 🚀 **Breaking Changes** - Changes that may require code updates
- 📦 **Dependencies** - Package updates and dependency changes

**Best practices:**
- Use `##` for version headings (not `#`)
- Use `###` for change type sections
- Use `####` for individual plugin names
- Group related plugin changes under single sections when applicable
- Add code examples using VitePress code groups for before/after comparisons
- Use VitePress callouts (`::: warning`, `::: tip`, `::: info`) for important notes
- Include links to plugins using `[`plugin-name`](/plugins/plugin-name/)`

**Update docs when:**
- Adding a new plugin or feature
- Changing plugin options or behavior
- Fixing bugs that affect user-facing behavior
- Adding new examples or tutorials
- Updating API signatures or types
- When fixing bugs: update relevant docs if the fix changes behavior, add notes if it affects user workflow, update examples if they were incorrect

### Review checklist for agent-created PRs

- [ ] Does CI pass? (unit tests, linters, typechecks)
- [ ] Is the change small and well-scoped?
- [ ] Are there any secrets, tokens, or sensitive data accidentally added?
- [ ] Are dependency updates pinned to safe versions and tested?
- [ ] Documentation: is content accurate and matches repository conventions?
- [ ] If AI-assisted: check for hallucinated facts, incorrect code assumptions, or missing context
- [ ] Factual accuracy: verify all information is correct
- [ ] Consistency: follow existing code and documentation patterns
- [ ] Completeness: all features and options are documented

### Security and secrets

- **Never commit secrets or credentials**
- If an agent PR contains secrets, immediately close the PR and rotate exposed secrets
- Use repository secrets and Actions masked variables for CI

### When to approve and merge

- Approve only when review checklist is satisfied
- Prefer squash merging small, single-purpose agent PRs
- For larger updates, consider staged roll-out or incremental approach

## Architecture instructions

### Plugin system overview

Kubb uses a plugin-based architecture where plugins generate code from OpenAPI specifications. The system is inspired by Rollup, Unplugin, and Snowpack.

**Key concepts:**
- **PluginManager**: Orchestrates plugin execution and manages file generation lifecycle
- **Plugins**: Define generators, resolve paths/names, and hook into lifecycle events
- **Generators**: Functions or React components that generate code files
- **Components**: React components (using `@kubb/react-fabric`) that render code templates
- **Options**: Plugin configuration that gets resolved and validated

### Plugin structure

Plugins follow this structure:

```typescript
export const definePlugin = createPlugin<PluginOptions>((options) => {
  return {
    name: pluginName,
    options,
    pre: [], // Plugins that must run before this one
    post: [], // Plugins that run after this one
    resolvePath(baseName, mode, options) { /* ... */ },
    resolveName(name, type) { /* ... */ },
    async install() { /* ... */ },
  }
})
```

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

### Parser architecture

Kubb uses an extensible parser architecture for mapping OpenAPI schemas to validation library syntax (Zod, Valibot, etc.).

**Key concepts**:
- **SchemaMapper**: Maps OpenAPI schema keywords to validation library syntax
- **Parser function**: Recursively processes schema trees to generate validation code
- **Mini mode**: Functional API style support for libraries like Zod Mini
- **Shared utilities**: Common functionality in `@kubb/plugin-oas/parsers`

**Location**: `packages/plugin-{library}/src/parser.ts`

**Base types** (from `@kubb/plugin-oas`):
- `BaseParserOptions`: Common parser options (mapper, canOverride)
- `CoercionOptions`: Type coercion configuration
- `MiniModeSupport`: Functional API style configuration
- `MiniModifiers`: Modifier keywords for mini mode (optional, nullable, default)

**Shared utilities** (from `@kubb/plugin-oas`):
- `shouldCoerce(coercion, type)`: Check if coercion is enabled for a type
- `extractMiniModifiers(schemas)`: Extract modifiers from schema array
- `filterMiniModifiers(schemas)`: Remove modifiers from schema array
- `miniModifierKeywords`: Array of modifier keywords

**Example parser structure (using createParser)**:

```typescript
import type { SchemaMapper } from '@kubb/plugin-oas'
import { createParser, shouldCoerce, type BaseParserOptions } from '@kubb/plugin-oas'

// 1. Define keyword mapper
const libraryKeywordMapper = {
  string: () => 'v.string()',
  number: () => 'v.number()',
  array: (items) => `v.array(${items.join('')})`,
  union: (items) => `v.union([${items.join(', ')}])`,
  object: (context, options, parse) => {
    // Handle object recursively
    return 'v.object({ ... })'
  },
  // ... other keywords
} satisfies SchemaMapper<string>

// 2. Define parser options
type ParserOptions = BaseParserOptions & {
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
}

// 3. Create parse function using createParser
export const parse = createParser<string, ParserOptions>({
  keywordMapper: libraryKeywordMapper,
  customHandlers: {
    // Optional: Override specific keywords
    string: (context, options) => {
      const coerce = shouldCoerce(options.coercion, 'strings')
      return coerce ? 'v.coerce.string()' : 'v.string()'
    }
  }
})
```

**Manual parser structure** (for full control):

```typescript
import type { SchemaMapper, SchemaTree } from '@kubb/plugin-oas'
import { isKeyword, schemaKeywords, shouldCoerce } from '@kubb/plugin-oas'

// 1. Define keyword mapper
const libraryKeywordMapper = {
  string: (min?: number, max?: number) => 'v.string()...',
  number: (min?: number, max?: number) => 'v.number()...',
  // ... other keywords
} satisfies SchemaMapper<string>

// 2. Define parser options
type ParserOptions = {
  mapper?: Record<string, string>
  coercion?: boolean | { dates?: boolean; strings?: boolean; numbers?: boolean }
}

// 3. Implement parse function manually
export function parse(
  { schema, parent, current, siblings, name }: SchemaTree,
  options: ParserOptions
): string | undefined {
  const value = libraryKeywordMapper[current.keyword]
  
  if (!value) {
    return undefined
  }

  // Handle special keywords (union, array, object)
  if (isKeyword(current, schemaKeywords.union)) {
    return libraryKeywordMapper.union(
      current.args.map(it => parse({ schema, parent: current, current: it, siblings }, options))
    )
  }

  // ... handle other keywords
  
  return value()
}
```

**Note**: Using `createParser` is recommended as it handles common recursive patterns automatically.

**Mini mode support**:

```typescript
import {
  extractMiniModifiers,
  filterMiniModifiers,
  type MiniModifiers
} from '@kubb/plugin-oas'

// Separate base schema from modifiers
const baseSchemas = filterMiniModifiers(schemas)
const modifiers = extractMiniModifiers(schemas)

// Parse base schema
const output = parseBaseSchema(baseSchemas)

// Wrap with functional modifiers
function wrapWithMiniModifiers(output: string, modifiers: MiniModifiers): string {
  let result = output
  
  if (modifiers.defaultValue !== undefined) {
    result = `v.default(${result}, ${modifiers.defaultValue})`
  }
  
  if (modifiers.hasOptional) {
    result = `v.optional(${result})`
  }
  
  return result
}

const finalOutput = wrapWithMiniModifiers(output, modifiers)
```

**Best practices**:
- Use shared utilities from `@kubb/plugin-oas` instead of reimplementing
- Implement all required SchemaMapper keywords (return `undefined` for unsupported)
- Use recursion for complex types (unions, arrays, objects)
- Add comprehensive tests in `parser.test.ts`
- Re-export utilities for backwards compatibility if moving code

**Reference implementations**:
- Zod: `packages/plugin-zod/src/parser.ts` (includes mini mode)
- TypeScript: `packages/plugin-ts/src/parser.ts` (generates types)
- Faker: `packages/plugin-faker/src/parser.ts` (generates mock data)

**Detailed documentation**: See `packages/plugin-oas/src/parsers/README.md` for complete guide on creating new parsers
