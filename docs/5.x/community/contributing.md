---
layout: doc
title: Contributing
description: Find where Kubb code lives, set up the core or plugins repository, pass the quality gates, and open a pull request.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Contributing
  icon: i-iconoir-git-branch
---

# Contributing

Check the open [issues](https://github.com/kubb-labs/kubb/issues) and [pull requests](https://github.com/kubb-labs/kubb/pulls) first, and open an issue before an opinion-driven change. Say hello on [Discord](https://discord.gg/4dQjA6vrWX). Each repository's `CONTRIBUTING.md` has the full rules: [kubb-labs/kubb](https://github.com/kubb-labs/kubb/blob/main/CONTRIBUTING.md) and [kubb-labs/plugins](https://github.com/kubb-labs/plugins/blob/main/CONTRIBUTING.md).

## What lives where

| Repository | Holds |
| --- | --- |
| [kubb-labs/kubb](https://github.com/kubb-labs/kubb) | The `kubb` and `@kubb/*` core packages, and these docs in `docs/` |
| [kubb-labs/plugins](https://github.com/kubb-labs/plugins) | The official `@kubb/plugin-*` packages, with a runnable example per plugin |
| [kubb-labs/platform](https://github.com/kubb-labs/platform) | The kubb.dev site, its blog, and Kubb Studio |

### Kubb core {#kubb-core}

| Path | Holds |
| --- | --- |
| `packages/core/` | Plugin runtime, build loop, `defineExtension`, `createKubb` |
| `packages/kit/` | Authoring toolkit behind `kubb/kit` |
| `packages/ast/` | Universal AST and visitors |
| `packages/adapter-oas/` | OpenAPI 2.0 and 3.x adapter |
| `packages/parser-ts/`, `parser-md/` | AST to TypeScript, TSX, and Markdown source |
| `packages/plugin-barrel/` | Barrel file plugin |
| `packages/renderer-jsx/` | JSX renderer |
| `packages/cli/` | The `kubb` CLI |
| `packages/mcp/` | MCP server |
| `packages/studio/` | The Studio connection behind `kubb studio` |
| `packages/unplugin-kubb/` | [Build tool integrations](/docs/5.x/integrations/build-tools) |
| `packages/kubb/` | The main package: public APIs and `defineConfig` |

## Workflow

Both repositories need Node.js 22.22 or later, pnpm 11 or later, and Git. Run `corepack enable` to get the pnpm version the repository pins.

::steps{level="3"}

### Fork and clone {#_1-fork-and-clone}

:::code-group

```shell [kubb]
gh repo fork kubb-labs/kubb --clone
cd kubb
```

```shell [plugins]
gh repo fork kubb-labs/plugins --clone
cd plugins
```

:::

### Install dependencies {#_2-install-dependencies}

```shell [Terminal]
pnpm install
pnpm build
```

`pnpm build` compiles every package, so local packages resolve each other. Run it again after you change package source.

### Create a branch {#_3-create-a-branch}

```shell [Terminal]
git checkout -b feat/your-feature-name
```

### Iterate {#_4-iterate}

```shell [Terminal]
pnpm -F @kubb/core start                                          # rebuild one package on change
pnpm vitest run --config ./configs/vitest.config.ts packages/core # test one package
```

Put each test next to its source file, and list a new test file in `configs/test-registry.json` with one sentence on what it covers. In `kubb-labs/plugins`, test a folder such as `packages/plugin-ts`, and run `pnpm generate` after a plugin change.

### Add a changeset {#commits-and-changesets}

Run `pnpm changeset` when the change ships in a published package. That includes a package's `docs/` folder, such as `packages/parser-ts/docs`, because npm ships it and kubb.dev reads it from the published version. Changes to `docs/5.x`, CI, and tests need none. Write [Conventional Commits](https://www.conventionalcommits.org/), such as `feat:` or `fix:`.

### Open a pull request {#opening-a-pull-request}

Push to your fork and open a pull request against `main`. Fill in the template, link the issue, and re-request review after each round of changes.

::

## Quality gates

Run these before you push. CI runs the same commands on every pull request that changes code.

| Command | Checks | CI job |
| --- | --- | --- |
| `pnpm build` | Every package builds | Build |
| `pnpm typecheck` | Types in every package | Typecheck |
| `pnpm test` | The Vitest suites | Tests |
| `pnpm lint` | oxlint rules | Linting |
| `pnpm test:registry` | Every test file has a registry entry, and no entry points at a deleted file | Linting |
| `pnpm format` | oxfmt formatting | autofix.ci formats the pull request |
| `pnpm typecheck:examples` | Plugins only: the examples type-check | Typecheck |
| `pnpm generate` | Plugins only: regenerates the examples | Update generated examples, which opens a pull request with the changes |

## Write a plugin {#kubb-plugins}

| Kind | Where | How |
| --- | --- | --- |
| Community plugin | Your own repository, on npm under a name you own | [Create a Kubb plugin](/docs/5.x/tutorials/creating-plugins), then [Publish a plugin](/docs/5.x/how-to/publish-a-plugin). Copy the layout of [`plugin-axios`](https://github.com/kubb-labs/plugins/tree/main/packages/plugin-axios). |
| Official plugin | `packages/plugin-<name>/` in kubb-labs/plugins, as `@kubb/plugin-<name>` | [Open an issue](https://github.com/kubb-labs/plugins/issues/new/choose) to agree on scope and name, then follow [Adding a plugin](https://github.com/kubb-labs/plugins/blob/main/CONTRIBUTING.md#adding-a-plugin). |

## Getting help

Open an [issue](https://github.com/kubb-labs/kubb/issues) or ask on [Discord](https://discord.gg/4dQjA6vrWX).
