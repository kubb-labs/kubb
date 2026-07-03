# Contributing to Kubb

We welcome contributions that help improve Kubb. A few ways to get involved:

- Found a bug? File it in the [issue tracker](https://github.com/kubb-labs/kubb/issues).
- Have an idea to improve Kubb? [Open an issue](https://github.com/kubb-labs/kubb/issues/new) to share it.
- Need help? Ask the community on [Discord](https://discord.gg/4dQjA6vrWX).

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md). Be respectful and open-minded, search the [issue tracker](https://github.com/kubb-labs/kubb/issues) before opening a PR, and for opinion-driven changes open an issue first.

## Prerequisites

- Node.js 22 or newer
- pnpm 11 or newer. The repo pins a version in `packageManager`, so the easiest way to match it is `corepack enable` and let Corepack pick the right pnpm
- Git

## Getting started

Fork the repo, then clone your fork and install:

```bash
gh repo fork kubb-labs/kubb --clone   # or: git clone https://github.com/kubb-labs/kubb.git
cd kubb
pnpm install
pnpm build
```

`pnpm build` compiles every package with tsdown. Run it once after install so local packages resolve each other, and again after you change package source.

## The Kubb ecosystem

Kubb spans a few repositories. Knowing where code lives saves time:

- [kubb-labs/kubb](https://github.com/kubb-labs/kubb) (this repo) is the core. It holds the engine that runs the plugin system, the OpenAPI adapter, the AST and JSX renderer, the CLI, and the MCP server. Work here on generation internals, plugin APIs, the command line, or the MCP integration.
- [kubb-labs/plugins](https://github.com/kubb-labs/plugins) holds the official plugins (TypeScript, client, React Query, Vue Query, SWR, Zod, Faker, MSW, Cypress, ReDoc, MCP) and a runnable example per plugin. Work here on a specific generator or to add a new plugin.

## What is inside this repo

```
kubb/
├── packages/                # Published npm packages and core modules
│   ├── core/                # Plugin system and code generation orchestration
│   ├── ast/                 # Spec-agnostic AST layer (nodes, visitors, factories)
│   ├── adapter-oas/         # OpenAPI/Swagger adapter (OAS to AST)
│   ├── parser-ts/           # TypeScript parser for AST manipulation
│   ├── renderer-jsx/        # JSX renderer for component-based output
│   ├── plugin-barrel/       # Barrel export generation (enforce: 'post' plugin)
│   ├── unplugin-kubb/       # Bundler integration (Vite, Nuxt, Astro, webpack)
│   ├── cli/                 # Command-line interface (kubb init, kubb generate)
│   ├── mcp/                 # Model Context Protocol server for AI assistants
│   └── kubb/                # Main package, re-exports the public APIs
├── internals/               # Non-published helpers (changelog, shared logic, utils)
├── schemas/                 # JSON/YAML schemas for configuration
├── configs/                 # Shared build and test configuration
├── docs/                    # Architecture notes and guides
└── .agents/skills/          # Cross-provider agent skills
```

## Tech stack

| Tool | Purpose |
|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Primary language (strict, ESM only) |
| [pnpm](https://pnpm.io/) | Package manager with workspaces |
| [Turborepo](https://turbo.build/) | Monorepo task runner |
| [tsdown](https://github.com/sxzz/tsdown) | Bundler and `.d.ts` generation |
| [Vitest](https://vitest.dev/) | Testing |
| [oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Linter |
| [oxfmt](https://github.com/oxc-project/oxfmt) | Formatter |
| [Changesets](https://github.com/changesets/changesets) | Versioning and changelogs |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |

## Commands

```bash
pnpm build          # Build all packages with tsdown
pnpm clean          # Remove build artifacts
pnpm test           # Run tests once
pnpm test:watch     # Run tests in watch mode
pnpm test:bench     # Run performance benchmarks
pnpm typecheck      # Type-check all packages
pnpm lint           # Lint with oxlint
pnpm lint:fix       # Lint and auto-fix
pnpm format         # Format with oxfmt
pnpm changeset      # Create a changeset
pnpm upgrade        # Bump dependencies with taze
```

To run a single package's tests, point Vitest at its folder:

```bash
pnpm vitest run --config ./configs/vitest.config.ts packages/core
pnpm vitest run --config ./configs/vitest.config.ts -u packages/core   # update snapshots
```

## Development workflow

1. Create a branch from `main`.
2. Make your change, with tests for new behavior.
3. Build and verify locally with `pnpm build && pnpm typecheck && pnpm test`.
4. Fix style with `pnpm format && pnpm lint:fix`.

## Opening a pull request

1. Run the full check locally first:

   ```bash
   pnpm format && pnpm lint:fix
   pnpm typecheck
   pnpm test
   ```

2. Add a changeset for any change that affects a published package (see below).
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`.
4. Push your branch and open a PR against `main`, then fill out the template.

### Changesets

Changesets drive versioning and the changelog. When your change affects a published package, run:

```bash
pnpm changeset
```

Pick the packages you changed, choose the bump (patch for fixes, minor for features, major for breaking changes), and write a short summary aimed at users. Commit the generated file under `.changeset/`. Docs-only or internal changes that touch no published package do not need one.

## Releasing

This section covers what happens after a PR with a changeset merges. Contributors don't need it, but maintainers do.

Merging a changeset into `main` queues or updates the "Version Packages" PR, opened automatically by the release workflow (`.github/workflows/release.yml`). Merging that PR triggers the release job, which stages every changed package with `pnpm stage publish` (npm's staged publishing). A staged package is not installable yet. Nothing becomes public until a maintainer approves it.

To approve a release:

1. A maintainer with npm publish access and two-factor authentication runs `npm stage approve` (or approves from npmjs.com) for each staged package.
2. The same maintainer approves the `promote` job's environment review on the workflow run in the Actions tab.
3. The `promote` job then verifies the versions are actually live on npm, tags the released versions, creates a GitHub Release, and only then triggers the Discord announcement and the changelog sync to [kubb-labs/docs](https://github.com/kubb-labs/docs).

Every published package in this repo shares one version (see the `fixed` group in `.changeset/config.json`), so a release here creates a single combined GitHub Release for the whole version, tagged with `kubb`'s own tag, with notes covering every package's section of that version's block in `CHANGELOG.md`. This differs from [kubb-labs/plugins](https://github.com/kubb-labs/plugins), where packages version independently and each gets its own release. `scripts/createReleases.mjs` supports both modes through the `RELEASE_MODE` environment variable.

If a staged version turns out to be wrong, reject it with `npm stage reject` instead of approving it. Nothing downstream fires for a rejected version.

Reviewers for the `promote` job's environment are managed on GitHub, under the repository's Settings > Environments > `npm-release-approval` (this is separate from npm's own settings on npmjs.com).

Canary releases are the one exception to this flow. Every push to `main` publishes a `0.0.0-canary-<timestamp>` version under the `canary` dist-tag directly, without staging, so that canary installs stay immediate and automatic. See the comment above the `Publish canary` step in `release.yml` for why this is safe to leave unstaged.
