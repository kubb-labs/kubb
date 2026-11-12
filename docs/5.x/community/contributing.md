---
layout: doc
title: Contributing
description: Set up the Kubb repository, run the checks, and open a pull request for Kubb core or a plugin.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Contributing
  icon: i-iconoir-git-branch
---

# Contributing

There are two places to contribute:

1. [Kubb core](#kubb-core): the runtime, [AST](/docs/5.x/explanation/architecture#ast), [adapter](/docs/5.x/explanation/architecture#adapters), [parsers](/docs/5.x/explanation/architecture#parsers), the [authoring kit](/docs/5.x/reference/kit), and built-in plugins in [`kubb-labs/kubb`](https://github.com/kubb-labs/kubb).
2. [Kubb plugins](#kubb-plugins): community and official plugins in the registry at [`kubb-labs/plugins`](https://github.com/kubb-labs/plugins).

First, check the open [issues](https://github.com/kubb-labs/kubb/issues) and [pull requests](https://github.com/kubb-labs/kubb/pulls) so you don't duplicate work. Say hello on [Discord](https://discord.gg/4dQjA6vrWX).

## Prerequisites

- [Node.js](https://nodejs.org/en/download) 22.22 or later.
- [pnpm](https://pnpm.io/installation) 11 or later.
- [Git](https://git-scm.com/) and, optionally, the [GitHub CLI](https://cli.github.com/).

## Kubb core

The monorepo at [`kubb-labs/kubb`](https://github.com/kubb-labs/kubb) holds everything in the `kubb` and `@kubb/*` packages.

::steps{level="3"}

### Fork and clone {#_1-fork-and-clone}

```shell [Terminal]
gh repo fork kubb-labs/kubb --clone
cd kubb
```

### Install dependencies {#_2-install-dependencies}

```shell [Terminal]
pnpm install
pnpm build
```

`pnpm build` compiles every package. Run it once after install so local packages resolve each other, and again after you change package source.

### Create a branch {#_3-create-a-branch}

```shell [Terminal]
git checkout -b feat/your-feature-name
```

### Iterate {#_4-iterate}

Build a single package in watch mode:

```shell [Terminal]
pnpm -F @kubb/core start
```

Run the test suite:

```shell [Terminal]
pnpm test
```

::

### What lives where

| Path                          | What lives there                                                        |
| ----------------------------- | ----------------------------------------------------------------------- |
| `packages/core/`              | Plugin runtime, build loop, `defineExtension`/`createKubb` API.         |
| `packages/kit/`               | Authoring toolkit re-exported through `kubb/kit`, holding `defineExtension`, `defineGenerator`, `createRenderer`, and the `ast` node builders. |
| `packages/ast/`               | Universal AST and visitor utilities.                                    |
| `packages/adapter-oas/`       | OpenAPI adapter that parses an OAS 2.0/3.x spec into the AST.           |
| `packages/parser-ts/`         | Parser that turns the AST into TypeScript and TSX source.               |
| `packages/parser-md/`         | Parser that turns the AST into Markdown source.                         |
| `packages/plugin-barrel/`     | Barrel file plugin (`enforce: 'post'`).                                 |
| `packages/renderer-jsx/`      | JSX renderer used by plugins that emit components.                      |
| `packages/cli/`               | The `kubb` CLI entry point.                                             |
| `packages/mcp/`               | MCP server runtime.                                                     |
| `packages/studio/`            | Connection between a project and Kubb Studio, behind `kubb studio`.     |
| `packages/unplugin-kubb/`     | Bundler integrations (Vite, webpack, Rollup, Rolldown, Rspack, esbuild, Farm, Nuxt, Astro). |
| `packages/kubb/`              | The main package. It re-exports the public APIs and `defineConfig`, which fills in the defaults. |

### Quality gates

Run these locally before pushing. CI runs the same commands.

```shell [Terminal]
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:registry
```

## Kubb plugins

Build a community plugin in your own repository, or propose an official one in the core monorepo.

### Build a community plugin

1. Follow the [Create a Kubb plugin](/docs/5.x/tutorials/creating-plugins) tutorial.
2. Use [`@kubb/plugin-axios`](https://github.com/kubb-labs/plugins/tree/main/packages/plugin-axios) as the layout to copy.
3. Publish to npm under the `kubb-plugin-*` naming convention.
4. Add a `kubb-extension.json` and a `docs/` folder with an `overview.md`, then submit the package to the Kubb registry. See [Publish a plugin](/docs/5.x/how-to/publish-a-plugin).

### Propose an official plugin

Official plugins ship under `@kubb/plugin-*`. First, [open an issue](https://github.com/kubb-labs/plugins/issues/new/choose) on the [`kubb-labs/plugins`](https://github.com/kubb-labs/plugins) repo to discuss scope and naming. Once approved, scaffold the package under `packages/plugin-<name>/`. Follow the structure of an existing plugin.

## Testing

Kubb uses [Vitest](https://vitest.dev/). Place each test file next to the source file it tests.

```typescript [resolverExample.test.ts]
import { describe, expect, it } from 'vitest'
import { resolverExample } from './resolverExample.ts'

describe('resolverExample', () => {
  it('returns a default resolver name', () => {
    const resolver = resolverExample({})
    expect(resolver.name).toBe('default')
  })
})
```

To run a single package's tests, point Vitest at its folder:

```shell [Terminal]
pnpm vitest run --config ./configs/vitest.config.ts packages/core
```

List every new test file in `configs/test-registry.json` with one sentence that says what it covers. `pnpm test:registry` fails CI when a test file has no entry or an entry points at a deleted file.

## Commits and changesets

Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`.

Add a [changeset](https://github.com/changesets/changesets) for any change that ships in a published package:

```shell [Terminal]
pnpm changeset
```

Skip the changeset only when the change does not affect published code, such as CI, internal tests, or docs.

## Opening a pull request

1. Push your branch to your fork.
2. Open a pull request against `main`.
3. Fill in the PR template and link the related issue.
4. Make sure CI is green and re-request review after each round of changes.

## Getting help

Open an [issue](https://github.com/kubb-labs/kubb/issues) or join the [Discord](https://discord.gg/4dQjA6vrWX).
