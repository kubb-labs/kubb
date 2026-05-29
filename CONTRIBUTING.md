# Contributing to Kubb

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

* Be respectful and open-minded.
* Search the [issue tracker](https://github.com/kubb-labs/kubb/issues) before opening a PR.
* For opinion-driven changes, [open an issue](https://github.com/kubb-labs/kubb/issues/new) first.

## Tech Stack

| Tool | Purpose |
|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Primary language — strict, ESM only |
| [pnpm](https://pnpm.io/) | Package manager with workspaces |
| [Turborepo](https://turbo.build/) | Monorepo task runner |
| [tsdown](https://github.com/sxzz/tsdown) | Bundler and `.d.ts` generation |
| [Vitest](https://vitest.dev/) | Testing |
| [oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Linter |
| [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) | Formatter |
| [CSpell](https://cspell.org/) | Spell checker |
| [Changesets](https://github.com/changesets/changesets) | Versioning and changelogs |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |

## Getting Started

**Requirements:** Node.js `>=22`, pnpm `>=11`

```bash
gh repo fork kubb-labs/kubb --clone
cd kubb
pnpm install
```

## Commands

```bash
pnpm build          # Build all packages
pnpm clean          # Remove build artifacts
pnpm test           # Run tests
pnpm test:watch     # Watch mode
pnpm lint           # Lint
pnpm lint:fix       # Lint and auto-fix
pnpm format         # Format code
pnpm typecheck      # Type-check all packages
pnpm lint:spell     # Spell check
pnpm changeset      # Create a changeset
```

## Project structure

### Root directories

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

### Internals

```
internals/
├── changelog/               # Changelog generation utilities
├── shared/                  # Kubb-specific shared logic (plugin catalogue, config generation)
└── utils/                   # Domain-agnostic shared utilities (fs, string, async helpers)
```

## Submitting Changes

1. Run `pnpm format && pnpm lint && pnpm typecheck && pnpm test` locally.
2. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`.
3. Run `pnpm changeset` and commit the generated file (required for any package change).
4. Open a PR against `main` and fill out the template.

> Spell-check false positives: fix typos in code, or add technical terms/proper nouns to the `words` array in `cspell.json`.
