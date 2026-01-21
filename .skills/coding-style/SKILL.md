---
name: coding-style
description: Coding style, testing, and PR guidelines for the Kubb ecosystem. Use when writing or reviewing code for the Kubb ecosystem.
---

# Code Style and Testing Skill

## When to Use

- When creating or reviewing a PR that changes code
- When adding a new package or feature to the monorepo
- When updating CI, linting, or formatting configuration
- When onboarding new contributors and sharing repository conventions

## What It Does

This skill documents the repository's coding conventions, testing guidelines, and PR checklist so contributors and automation can produce consistent, high-quality changes.

- Defines formatting, linting, and TypeScript conventions
- Describes testing workflow and CI expectations
- Outlines PR requirements, changelog updates, and release-related steps
- Provides common troubleshooting and recovery commands

## How to Use

Run the basic developer checks and fixes locally before committing or opening a PR:

```bash
# Format code and attempt autofixes
pnpm run format

# Lint the repository
pnpm run lint

# Run unit tests
pnpm test

# Create a changeset for versioning
pnpm changeset

# Typecheck whole repo
pnpm typecheck
```

Follow the PR checklist and run the commands above in the same order: **format → lint → typecheck → test → changeset**.

## Repository Facts

- **Monorepo**: Managed by pnpm workspaces and Turborepo
- **Module system**: ESM-only (`type: "module"` across repo)
- **Node version**: 20
- **Testing Library**: Vitest
- **Versioning**: Changesets for versioning and publishing
- **CI/CD**: GitHub Actions

## Coding Style Guidelines

### Basic Rules

- **Quotes**: Single quotes, no semicolons (see `biome.json`)
- **Patterns**: Prefer functional patterns
- **Ternary operators**: Keep ternary operators to one level deep for readability. For nested conditions, use if/else statements or extract to a helper function.

### Naming Conventions

| Element / Context       | Naming convention |
| ----------------------: | :---------------- |
| File / directory names  | `camelCase`       |
| Variables / functions   | `camelCase`       |
| Types / Interfaces      | `PascalCase`      |
| React components        | `PascalCase`      |

### TypeScript Conventions

- **Module resolution**: `"bundler"`; ESM only
- **Strict typing**: NEVER use `any` type or `as any` casts. Always use proper types, generics, or `unknown`/`never` when appropriate.
- **Files**: `.ts` for libraries, `.tsx` for React components, `.vue` for Vue components
- **DTS output**: Managed by `tsdown`
- **Importing**: Always use proper import statements at the module level instead of inline type imports
- **Exporting**: use `"exports"` map and `typesVersions` as needed. Keep public API stable
- **Root level types**: Define types at the root level of the file, not inside functions
- **Function syntax in Objects**: Use function syntax (not arrow functions) in object methods to enable use of `this` keyword

## Testing

- **Test location**: `*.test.ts` or `*.test.tsx` in `src` folders
- **Focus on specific tests**: `pnpm test "<test name>"`
- **Always add or update tests for code changes** and when needed update snapshots with the `-u` flag
- **Fix all test and type errors until suite is green**
- **After moving files or changing imports**: Run `pnpm lint && pnpm typecheck`

### Writing Conventions

- **Focused**: Test one thing at a time
- **Isolated**: Don't depend on other tests
- **Repeatable**: Same results every time
- **Fast**: Keep tests quick
- **Clear**: Easy to understand what's being tested

## PR Instructions

Follow these steps when creating a PR:

1. Make sure that the following commands pass locally:
  - `pnpm format && pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
2. Create a git commit with **Title format**: `[<plugin-name>] <Title>`
3. Push your branch and open a PR against `main`
4. Fill out the PR template completely
5. Add a changeset using `pnpm changeset`
6. Request reviews from relevant maintainers
7. Address feedback and make any requested changes
8. Once approved, wait for CI to pass and merge the PR

## Related Skills

| Skill                                   | Use For             |
|-----------------------------------------|---------------------|
| **[../changelog/SKILL.md](../changelog/SKILL.md)** | Update changelogs, **Mandatory for all PRs that include code changes** |
