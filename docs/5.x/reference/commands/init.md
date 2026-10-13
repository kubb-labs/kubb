---
layout: doc
title: kubb init
description: The init command bootstraps a fresh Kubb project with an interactive wizard.
outline:
  - 2
  - 3
order: 1
navigation:
  title: kubb init
  icon: i-iconoir-magic-wand
---

# kubb init

Run `kubb init` for an interactive setup wizard. Answer a few questions and Kubb creates a `package.json` if one is missing, installs your chosen plugins, and writes a ready-to-use `kubb.config.ts`.


## Usage

Run the command in the directory where your Kubb project lives:

```shell [Terminal]
npx kubb init
```

The wizard prompts for three things:

- The path to your OpenAPI/Swagger spec, a local file or a URL.
- The output directory for generated files.
- Which [plugins](/extensions/kind/plugins) to install, such as clients, hooks, validators, and mocks.

Kubb detects the package manager (`bun`, `pnpm`, `npm`, or `yarn`) from your project. It installs `kubb` at the exact version of the CLI you ran and the plugins from the same release channel, so `npx kubb@beta init` scaffolds a beta project.

## Options

| Option           | Default | Description                                                                                                                                                                                                                                                         |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--yes`, `-y`    | `false` | Skip all prompts and use the default values.                                                                                                                                                                                                                        |
| `--input`, `-i`  |         | Path to the OpenAPI specification (local file or URL). Bypasses the spec path prompt.                                                                                                                                                                               |
| `--output`, `-o` |         | Output directory for generated files. Bypasses the output directory prompt.                                                                                                                                                                                         |
| `--plugins`      |         | Comma-separated list of plugins to install. Bypasses the plugin selection prompt. Valid values: `plugin-ts`, `plugin-axios`, `plugin-fetch`, `plugin-react-query`, `plugin-vue-query`, `plugin-zod`, `plugin-faker`, `plugin-msw`, `plugin-cypress`, `plugin-mcp`, `plugin-redoc`. |
| `--dry-run`     | `false` | Preview the wizard without installing packages or writing `kubb.config.ts`.                                                                                                                                                                                        |

Each flag skips only its own prompt and combines with `--yes`. Pass all three value flags and the wizard runs without prompts, no `--yes` needed.

## Examples

Run with the defaults and no prompts:

```shell [Terminal]
npx kubb init --yes
```

Run with no prompts and a specific spec, output directory, and plugins:

```shell [Terminal]
npx kubb init --input ./openapi.yaml --output ./src/gen --plugins plugin-ts,plugin-zod
```

Add `--dry-run` to preview what the wizard would install and write.
