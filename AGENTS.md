# AGENTS.md

Kubb is a code-generation toolkit for generating TypeScript, React-Query, Zod, Faker.js, MSW and more from OpenAPI specifications. It uses a plugin-based architecture with an Abstract Syntax Tree (AST) layer.

## High-Level Architecture

Kubb consists of:
- **Core engine** (`@kubb/core`) - Plugin system and code generation orchestration
- **Adapters** (`@kubb/adapter-oas`) - Transform OpenAPI specs into an AST
- **Renderers & Utilities** - Transform the AST into code
- **CLI & HTTP interfaces** - Entry points for code generation
- **MCP Server** - Model Context Protocol integration for AI assistants

## Folder Structure

### Root Directories

```
kubb/
├── packages/                # Npm packages and core modules
├── schemas/                 # YAML schemas for configuration
├── internals/               # Build tools and internal utilities
├── docs/                    # Documentation and architecture guides
├── configs/                 # Shared build and test configurations
└── .skills/                 # Agent capabilities for Claude Code
```

### Packages

```
packages/
├── ast/                     # Spec-agnostic AST layer defining nodes, visitors, and factories
├── core/                    # Core plugin system and code generation orchestration
├── adapter-oas/             # OpenAPI/Swagger adapter (OAS → AST)
├── kubb/                    # Main package, exports all public APIs
├── cli/                     # Command-line interface
├── agent/                   # Agent server for HTTP-based code generation
├── mcp/                     # Model Context Protocol (MCP) server for AI assistants
├── parser-ts/               # TypeScript parser for AST manipulation
├── renderer-jsx/            # JSX renderer for component-based code generation
├── middleware-barrel/       # Middleware for barrel export generation
└── unplugin-kubb/           # Unplugin integration for build tools
```

### Schemas

```
schemas/
└── extension.json           # Unified schema for all extension kinds (plugin/adapter/middleware/parser)
```

### Internals

```
internals/
├── changelog/               # Changelog generation utilities
└── utils/                   # Shared build and utility functions
```

### Documentation

```
docs/
└── architecture/            # Architecture documentation and guides
```

## Plugin Ecosystem

Plugins are maintained in a separate monorepo at [kubb-project/kubb-plugins](https://github.com/kubb-project/kubb-plugins). Each plugin package ships an `extension.yaml` file describing its kind, options, and metadata.

## Repository Setup

- **Monorepo** - Uses pnpm workspaces and Turborepo
- **Module system** - ESM-only (`type: "module"`)
- **Node version** - 22
- **Versioning** - Changesets
- **CI/CD** - GitHub Actions

## Commands

```bash
pnpm install                 # Install dependencies
pnpm clean                   # Clean build artifacts
pnpm build                   # Build all packages
pnpm generate                # Generate code from OpenAPI specs
pnpm perf                    # Run performance tests
pnpm test                    # Run tests
pnpm typecheck               # Type check all packages
pnpm typecheck:examples      # Type check examples
pnpm format                  # Format code
pnpm lint                    # Lint code
pnpm lint:fix                # Lint and fix issues
pnpm changeset               # Create changelog entry
pnpm run upgrade && pnpm i   # Upgrade dependencies
```

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
- [coding-style](.skills/coding-style/SKILL.md) - Coding style, testing, and PR guidelines. Use when writing or reviewing code.
- [documentation](.skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
- [jsdoc](.skills/jsdoc/SKILL.md) - Guidelines for writing minimal, high-quality JSDoc comments in TypeScript.
- [pr](.skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
- [testing](.skills/testing/SKILL.md) - Testing, CI, and troubleshooting guidance for running the repository's test suite and interpreting CI failures.
</skills>
