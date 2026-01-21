# AGENTS.md

This repository contains Kubb — a plugin-based code-generation toolkit for generating client code from OpenAPI specs.

Core facts (essentials for every task):

## Folder structure

Expanded overview focused on plugins and where to find their docs and source code.

```
docs/
├── migration-guide.md    # Updated after major releases
├── changelog.md          # Updated with every PR (via changeset)
├── getting-started/      # Getting started guides (quick-start, configure, troubleshooting)
├── blog/                 # Blog posts (after major releases)
├── helpers/              # Extra packages (CLI guides, OAS core helpers)
├── knowledge-base/       # Feature deep-dives and how-tos
│   ├── debugging.md
│   ├── fetch.md
│   ├── multipart-form-data.md
│   └── ...
├── plugins/              # Plugin documentation (mirrors layout in `packages/`)
│   ├── core/             # Shared plugin options, patterns, and architecture docs
│   ├── plugin-client/    # Docs for the client plugin (usage, options, examples)
│   ├── plugin-oas/       # Docs for the OAS plugin: generators, components, examples
│   ├── plugin-ts/        # Docs for TypeScript output plugin
│   └── plugin-*/         # Individual plugin docs (one folder per plugin)
├── tutorials/            # Step-by-step tutorials
├── examples/             # Playground and examples used in docs
└── builders/             # Builder integrations (unplugin, etc.)
```

Repository-level layout with focus on plugin packages and their source layout:

```
packages/
├── core/                 # Core utilities and shared runtime
├── kubb/                 # Core kubb package (CLI, config, manager)
├── plugin-oas/           # OAS plugin source
│   ├── src/
│   │   ├── components/   # React-fabric components used by generators
│   │   ├── generators/   # React-based and function-based generators
│   │   ├── hooks/        # Plugin-specific hooks and helpers
│   │   └── index.ts
│   └── tests/            # Unit tests for the plugin
├── plugin-ts/            # TypeScript output plugin
├── plugin-client/        # Client generator plugin
├── plugin-*/             # Other plugins (same convention: src/components, src/generators, tests)
└── unplugin-kubb/        # Unplugin integration
```

Notes:
- The `docs/plugins/*` folders contain user-facing documentation for each plugin and usually mirror the `packages/plugin-*/` source layout (options, examples, and usage).
- Plugin source convention: `packages/plugin-*/src/components/` holds React-fabric components, `src/generators/` holds generator implementations, and `src/*.test.ts` or `src/tests/` contains tests.
- When adding a new plugin, add both a `packages/plugin-name/` package and a corresponding `docs/plugins/plugin-name/` docs folder (see `docs/plugins/*` for examples).

## Repository facts

- **Monorepo**: Managed by pnpm workspaces and Turborepo
- **Module system**: ESM-only (`type: "module" across repo)
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


This file is intentionally minimal. Agents and contributors should consult the repository's skills for detailed guidance:

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
- [coding-style](.skills/coding-style/SKILL.md) - Coding style, testing, and PR guidelines for the Kubb ecosystem. Use when writing or reviewing code for the Kubb ecosystem.
- [components-generators](.skills/components-generators/SKILL.md) - Guidance for writing `@kubb/react-fabric` components and generators (React-based and function-based).
- [documentation](.skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense) and content structure patterns. Overrides brevity rules for proper grammar.
- [plugin-architecture](.skills/plugin-architecture/SKILL.md) - Explains plugin lifecycle, generator types, and common utilities used by plugins in the Kubb ecosystem.
- [pr](.skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
- [testing](.skills/testing/SKILL.md) - Testing, CI, and troubleshooting guidance for running the repository's test suite and interpreting CI failures.
</skills>
