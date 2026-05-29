# AGENTS.md

Kubb is a code-generation toolkit for generating TypeScript, React-Query, Zod, Faker.js, MSW and more from OpenAPI specifications. It uses a plugin-based architecture with an Abstract Syntax Tree (AST) layer.

## High-Level Architecture

Kubb is built from:
- Core engine (`@kubb/core`) runs the plugin system and orchestrates code generation
- Adapters (`@kubb/adapter-oas`) transform OpenAPI specs into an AST
- Renderers and utilities turn the AST into code
- CLI and HTTP interfaces are the entry points for code generation
- MCP server adds Model Context Protocol integration for AI assistants

## Folder Structure

### Root Directories

```
kubb/
├── packages/                # Npm packages and core modules
├── schemas/                 # YAML schemas for configuration
├── internals/               # Build tools and internal utilities
├── docs/                    # Documentation and architecture guides
├── configs/                 # Shared build and test configurations
└── .agents/skills/          # Cross-provider agent skills
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
├── shared/                  # Kubb-specific shared logic (plugin catalogue, config generation)
└── utils/                   # Domain-agnostic shared utilities (fs, string, async helpers)
```

### Documentation

```
docs/
└── architecture/            # Architecture documentation and guides
```

## Plugin Ecosystem

Plugins are maintained in a separate monorepo at [kubb-project/kubb-plugins](https://github.com/kubb-project/kubb-plugins). Each plugin package ships an `extension.yaml` file describing its kind, options, and metadata.

## Repository Setup

| Aspect | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Module system | ESM-only (`type: "module"`) |
| Node version | 22 |
| Package manager | pnpm 11+ |
| Linter | oxlint |
| Formatter | oxfmt |
| Tests | Vitest |
| Versioning | Changesets |
| CI/CD | GitHub Actions |

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

## Token optimized CLI (rtk)

`rtk` is a CLI proxy that filters and compresses command output to cut token usage. Prefix shell
commands with it so their output stays small:

```bash
rtk git status
rtk git log -10
rtk pnpm test
```

Run these meta commands directly:

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw without filtering but still track usage
```

## How agents read this repo

`AGENTS.md` is the canonical instruction file. `CLAUDE.md`, `GEMINI.md`, and
`.github/copilot-instructions.md` symlink to it. Skills live in `.agents/skills/` (open
`SKILL.md` format, cross-provider). Always-on conventions live in `.claude/rules/`
(`code-style`, `jsdoc`, `markdown`, `testing`, `security`), and `.claude/` also holds commands,
subagents, output styles, and hooks.

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.agents/skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
- [documentation](.agents/skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
- [humanizer](.agents/skills/humanizer/SKILL.md) - Remove AI writing patterns to make documentation sound natural, specific, and human. Covers content patterns, language patterns, style patterns, and communication patterns.
- [jsdoc](.agents/skills/jsdoc/SKILL.md) - Full JSDoc format guide for TypeScript, covering @example formats (short, multi-line, multi-variant), tag usage (@default, @deprecated, what to avoid), documentation patterns for properties/enums/functions, and tag order.
- [pr](.agents/skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
- [spec-driven](.agents/skills/spec-driven/SKILL.md) - Drive a spec-driven workflow for a larger feature: specify requirements and acceptance criteria, research decisions, plan numbered slices, implement, then verify. Use for multi-step features that need a reviewable paper trail. Skip it for small, obvious changes.
</skills>
