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

## Client Generation Patterns

The `@kubb/plugin-client` plugin supports two client generation patterns:

### Function-based (default)

Generates standalone functions for each operation:

```typescript
pluginClient({
  clientType: 'function', // default
})
```

### Class-based

Generates classes with methods grouped by tag:

```typescript
pluginClient({
  clientType: 'class',
  group: {
    type: 'tag',
  },
})
```

Class-based generation creates one class per tag (e.g., `Pet`, `Store`, `User`) with methods for each operation. Use the `classClientGenerator` which implements the `Operations` pattern to group operations.

## Additional Resources

For more detailed architecture information and examples, see the `AGENTS.md` file in the repository root.
