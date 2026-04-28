# Contributing to Kubb

Thank you for your interest in contributing to Kubb! 🎉

Whether you're fixing a bug, adding a feature, improving documentation, or just asking a question — every contribution is welcome. To make this a great experience for everyone, please read these guidelines before you get started.

**Ground rules:**

- Be respectful, civil, and open-minded.
- Before opening a new pull request, search the [issue tracker](https://github.com/kubb-labs/kubb/issues) for known issues or related work.
- For opinion-driven changes (refactors, style changes, new APIs), open an issue first so it can be discussed before you invest time coding.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Fork and Clone](#fork-and-clone)
  - [Install Dependencies](#install-dependencies)
- [Development Workflow](#development-workflow)
  - [Build](#build)
  - [Testing](#testing)
  - [Linting and Formatting](#linting-and-formatting)
  - [Type Checking](#type-checking)
  - [Spell Checking](#spell-checking)
- [Submitting Changes](#submitting-changes)
  - [Commit Conventions](#commit-conventions)
  - [Changesets](#changesets)
  - [Opening a Pull Request](#opening-a-pull-request)
- [Credits](#credits)

---

## Tech Stack

Kubb is a TypeScript-first, ESM-only monorepo. Here's what powers it:

| Tool | Purpose |
|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Primary language — strict mode, ESM only |
| [pnpm](https://pnpm.io/) | Package manager with workspaces |
| [Turborepo](https://turbo.build/) | Monorepo task runner and build caching |
| [tsdown](https://github.com/sxzz/tsdown) | Package bundler and `.d.ts` generation |
| [Vitest](https://vitest.dev/) | Unit and integration testing |
| [oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Fast JavaScript/TypeScript linter |
| [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) | Code formatter |
| [CSpell](https://cspell.org/) | Spell checker for code and documentation |
| [Changesets](https://github.com/changesets/changesets) | Versioning and changelog management |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipelines |

**Packages in this repo:**

| Package | Description |
|---|---|
| `@kubb/core` | Core utilities and shared runtime |
| `@kubb/kubb` | CLI, config, and build manager |
| `@kubb/agent` | AI-assisted code generation agent |
| `@kubb/ast` | AST helpers and types |
| `@kubb/adapter-oas` | OpenAPI / Swagger adapter |
| `@kubb/parser-ts` | TypeScript parser |
| `@kubb/renderer-jsx` | JSX renderer for code components |
| `@kubb/middleware-barrel` | Barrel file middleware |
| `@kubb/unplugin-kubb` | Vite / Rollup / Webpack / esbuild integration |
| `@kubb/mcp` | Model Context Protocol (MCP) server |
| `@kubb/cli` | Command-line interface |

---

## Getting Started

### Prerequisites

- **Node.js** `>=22`
- **pnpm** `>=10`

To avoid implementing a change that has already been declined, start by [opening an issue](https://github.com/kubb-labs/kubb/issues/new) to describe the problem you want to solve and wait for maintainer feedback.

### Fork and Clone

Fork the repository on GitHub, then clone it locally:

```bash
# With the GitHub CLI (recommended)
gh repo fork kubb-labs/kubb --clone

# Or clone your fork manually
git clone https://github.com/<your-github-name>/kubb.git
cd kubb
```

### Install Dependencies

```bash
pnpm install
```

---

## Development Workflow

### Build

Build all packages (Turborepo will build them in the correct dependency order):

```bash
pnpm build
```

To clean all build artifacts and start fresh:

```bash
pnpm clean
```

### Testing

Run the full test suite:

```bash
pnpm test
```

Run tests in watch mode during development:

```bash
pnpm test:watch
```

Run a specific test file or test name:

```bash
pnpm test "<test name or path>"
```

**Always add or update tests when changing behaviour.** If snapshot files are out of date, update them with:

```bash
pnpm test -u
```

### Linting and Formatting

Check code style with the linter:

```bash
pnpm lint
```

Auto-fix linting issues:

```bash
pnpm lint:fix
```

Format all source files:

```bash
pnpm format
```

### Type Checking

Run TypeScript type checking across all packages:

```bash
pnpm typecheck
```

After moving files or changing imports, always run both lint and typecheck together:

```bash
pnpm lint && pnpm typecheck
```

### Spell Checking

This project uses [CSpell](https://cspell.org/) to catch spelling mistakes in code and documentation. Configuration lives in `cspell.json` (American English).

```bash
pnpm lint:spell
```

If you encounter a false positive:

- **Typo** → fix the spelling in your code.
- **Technical term, library name, or proper noun** → add it to the `words` array in `cspell.json`.

---

## Submitting Changes

### Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Every commit message must be prefixed with a type:

| Prefix | When to use |
|---|---|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation only changes |
| `chore:` | Build process, tooling, or dependency updates |
| `refactor:` | Code change that is neither a fix nor a feature |
| `test:` | Adding or updating tests |
| `perf:` | A performance improvement |

Example:

```bash
git add <file>
git commit -m "feat: add support for OpenAPI 3.1 discriminator"
```

### Changesets

Kubb uses [Changesets](https://github.com/changesets/changesets) to manage versions and generate changelogs. **Every pull request that changes package behaviour must include a changeset.**

Run the interactive CLI and follow the prompts to select the affected packages, choose a semver bump (`major` / `minor` / `patch`), and write a short description:

```bash
pnpm changeset
```

This creates a new file inside `.changeset/`. Commit that file as part of your branch.

### Opening a Pull Request

1. Confirm the following commands all pass locally:

   ```bash
   pnpm format && pnpm lint
   pnpm typecheck
   pnpm test
   ```

2. Push your branch and open a pull request against `main`.
3. Fill out the pull request template completely.
4. Make sure a changeset is included (see above).
5. Request a review from a maintainer if needed.
6. Address any review feedback and wait for CI to go green.

> **All pull requests must target the `main` branch.**

---

## Credits

This document was inspired by the contributing guidelines for [create-t3-app](https://github.com/t3-oss/create-t3-app/blob/next/CONTRIBUTING.md).
