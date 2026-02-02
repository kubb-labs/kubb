# AGENTS.md

Kubb is a plugin-based code-generation toolkit for generating client code from OpenAPI specifications.

## Folder Structure

### Documentation

```
docs/
├── config.json              # Navigation and sidebar (Kubb.dev schema)
├── migration-guide.md       # Updated after major releases
├── changelog.md             # Updated with every PR (via changeset)
├── getting-started/         # Installation, quick-start, configuration
├── helpers/                 # Extra packages (CLI guides, OAS core helpers)
├── guide/                   # Feature deep-dives and how-tos
├── plugins/                 # Plugin documentation (mirrors `packages/`)
├── tutorials/               # Step-by-step tutorials
├── examples/                # Playground and examples
├── builders/                # Builder integrations (unplugin, etc.)
└── public/                  # Static assets
```

All markdown files follow VitePress conventions. The `config.json` file uses the Kubb.dev schema for navigation. See `.skills/documentation/` for writing guidelines.

### Packages

```
packages/
├── core/                    # Core utilities and shared runtime
├── kubb/                    # Core kubb package (CLI, config, manager)
├── plugin-oas/              # OAS plugin - OpenAPI spec parsing
├── plugin-ts/               # TypeScript type generation
├── plugin-client/           # Client generator (fetch, axios, etc.)
├── plugin-faker/            # Faker.js mock data generation
├── plugin-zod/              # Zod schema generation
├── plugin-msw/              # MSW mock handlers
├── plugin-react-query/      # React Query/TanStack Query hooks
├── plugin-solid-query/      # Solid Query hooks
├── plugin-svelte-query/     # Svelte Query hooks
├── plugin-vue-query/        # Vue Query hooks
├── plugin-swr/              # SWR hooks
├── plugin-cypress/          # Cypress test generation
├── plugin-redoc/            # ReDoc documentation
├── plugin-mcp/              # MCP (Model Context Protocol) integration
└── unplugin-kubb/           # Unplugin integration
```

Plugins follow this convention:
- `src/components/` - React-fabric components
- `src/generators/` - Generator implementations
- `src/*.test.ts` - Tests

## Repository Setup

- **Monorepo** - Uses pnpm workspaces and Turborepo
- **Module system** - ESM-only (`type: "module"`)
- **Node version** - 20
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
- [coding-style](.skills/coding-style/SKILL.md) - Coding style, testing, and PR guidelines for the Kubb ecosystem. Use when writing or reviewing code for the Kubb ecosystem.
- [components-generators](.skills/components-generators/SKILL.md) - Guidance for writing `@kubb/react-fabric` components and generators (React-based and function-based).
- [documentation](.skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
- [jsdoc](.skills/jsdoc/SKILL.md) - Guidelines for writing minimal, high-quality JSDoc comments in TypeScript.
- [plugin-architecture](.skills/plugin-architecture/SKILL.md) - Explains plugin lifecycle, generator types, and common utilities used by plugins in the Kubb ecosystem.
- [pr](.skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
- [testing](.skills/testing/SKILL.md) - Testing, CI, and troubleshooting guidance for running the repository's test suite and interpreting CI failures.
</skills>
