# Copilot Instructions

This document provides instructions for GitHub Copilot when working on the Kubb codebase.

## Repository Overview

- **Monorepo**: Managed by pnpm workspaces and Turborepo
- **Module system**: ESM-only (`type: "module"` across repo)
- **Node version**: 20
- **Versioning**: Changesets for versioning and publishing
- **CI/CD**: GitHub Actions

## Setup Commands

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
```

## Code Style

- **Quotes**: Single quotes, no semicolons (see `biome.json`)
- **Patterns**: Prefer functional patterns

### TypeScript Conventions

- Module resolution: `"bundler"`; ESM only
- Prefer strict typing; avoid `any`
- Files: `.ts` for libraries, `.tsx` for React components, `.vue` for Vue components
- DTS output managed by `tsdown`
- **Import best practices**: Always use proper import statements at the module level instead of inline type imports (e.g., use `import type { Operation } from '@kubb/oas'` at the top rather than `import('@kubb/oas').Operation` inline). This improves code readability and follows TypeScript best practices.
- **Type definitions**: Define types at the root level of the file, not inside functions. This improves reusability, makes types easier to find, and follows TypeScript best practices for better type inference and documentation.
- **Function syntax in objects**: Use function syntax (not arrow functions) in object methods to enable use of `this` keyword. This follows pure function-based patterns:
  ```typescript
  // ✅ Correct - function syntax (pure function-based)
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

### Naming Conventions

- File/directory names: `camelCase`
- Variables/functions: `camelCase`
- Types/Interfaces: `PascalCase`
- React components: `PascalCase`

### Exports

Packages use `"exports"` map and `typesVersions` as needed, keep public API stable.

### Testing

Test files named `*.test.ts` or `*.test.tsx` in `src` folders.

## PR Guidelines

- **Title format**: `[<plugin-name>] <Title>`
- **Before committing**: Run `pnpm format && pnpm lint:fix`, `pnpm typecheck`, and `pnpm test`
- **Before committing**: Run `pnpm generate` and `pnpm typecheck:examples` in a separate commit

### Required for every PR with code changes:
- Create a changeset using `pnpm changeset` to specify version bump (major/minor/patch) for affected packages
- Update `docs/changelog.md` with the new version entry describing the changes
- Update docs in the same PR as code changes

### Changelog Format

When updating `docs/changelog.md`, use this structure:

```markdown
## X.Y.Z

### ✨ Features

#### [`plugin-name`](/plugins/plugin-name/)

Description of the change.

::: code-group
```typescript [Before]
// Old code
```

```typescript [After]
// New code
```
:::
```

**Category prefixes:**
- ✨ Features - New functionality
- 🐛 Bug Fixes - Bug fixes and corrections
- 🚀 Breaking Changes - Changes requiring code updates
- 📦 Dependencies - Package updates

**Guidelines:**
- Use `##` for versions, `###` for categories, `####` for plugin names
- Group related plugins together
- Add code examples with VitePress code groups
- Use callouts (`::: warning`, `::: tip`) for important notes

## Architecture

Kubb uses a plugin-based architecture where plugins generate code from OpenAPI specifications.

### Key Concepts

- **PluginManager**: Orchestrates plugin execution and manages file generation lifecycle
- **Plugins**: Define generators, resolve paths/names, and hook into lifecycle events
- **Generators**: Functions or React components that generate code files
- **Components**: React components (using `@kubb/react-fabric`) that render code templates

### Plugin Structure

Plugins follow this structure:

```typescript
export const pluginExample = definePlugin<PluginOptions>((options) => {
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

### Components Location

Components are React components located in `packages/plugin-*/src/components/` that generate code templates using JSX syntax.

### Generators Location

Generators are located in `packages/plugin-*/src/generators/`. Prefer React-based generators using `createReactGenerator`.

## Additional Resources

For more detailed architecture information and examples, see the `AGENTS.md` file in the repository root.
