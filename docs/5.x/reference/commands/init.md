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

Run `kubb init` for an interactive setup wizard. Kubb looks at your project first, asks a few questions, shows the config for review, then installs your chosen plugins, writes `kubb.config.ts`, and runs the first generation.


## Usage

Run the command in the directory where your Kubb project lives:

```shell [Terminal]
npx kubb init
```

Before the first question, Kubb detects:

- The package manager (`bun`, `pnpm`, `npm`, or `yarn`), TypeScript, the framework (React, Vue, Svelte, or Solid), and data libraries such as TanStack Query, SWR, Zod, MSW, and axios.
- OpenAPI and Swagger files in the repo, such as `openapi.yaml` or `api/swagger.json`, up to three folders deep. It skips `node_modules`, `dist`, `build`, and hidden folders, and shows the version and operation count of the first one.

The wizard then asks for three things:

- Which spec to read: a file it found, a URL, or another file.
- Which [plugins](/extensions/kind/plugins) to add. The list comes from the [Kubb registry](/docs/5.x/reference/registry). `plugin-ts` and the plugins that match your dependencies are selected, each with the reason, such as `plugin-react-query` for `@tanstack/react-query`. A query plugin without a client gets `plugin-fetch`.
- The output folder, `./src/gen` by default.

Kubb then shows the full `kubb.config.ts` and the packages it installs. Pick **Change a choice** to answer the questions again.

After you confirm, Kubb installs the packages, writes `kubb.config.ts`, and adds `"generate": "kubb generate"` to the `package.json` scripts when there is no `generate` script yet. It never changes an existing one. Then it runs the first generation. When that run fails, Kubb shows the error, keeps the setup, and exits with code 1.

Kubb installs `kubb` at the exact version of the CLI you ran. Each plugin is added the way [`kubb add`](/docs/5.x/reference/commands/add) adds it: at the version the registry pins, and only when it supports the running Kubb and Node.js versions.

Before it installs anything, Kubb checks the [manifest](/docs/5.x/reference/kit/manifest) of each chosen plugin. If a plugin's `dependencies` are not all chosen, or a plugin with `role: "consumer"` (such as `plugin-react-query`) has no client plugin next to it, `kubb init` names what is missing and stops.

## Options

| Option           | Default | Description                                                                                                                                                                                                                                                         |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--yes`, `-y`    | `false` | Skip all prompts and the review. Uses the first spec found (or `./openapi.yaml`), the recommended plugins, and `./src/gen`, and prints one line per step.                                                                                                       |
| `--input`, `-i`  |         | Path to the OpenAPI specification (local file or URL). Bypasses the spec path prompt.                                                                                                                                                                               |
| `--output`, `-o` |         | Output directory for generated files. Bypasses the output directory prompt.                                                                                                                                                                                         |
| `--plugins`      |         | Comma-separated registry ids of the plugins to add, the same ids [`kubb add`](/docs/5.x/reference/commands/add) takes, such as `plugin-ts,plugin-zod`, or short names such as `ts,zod`. Bypasses the plugin selection prompt. An id that is not in the registry stops `kubb init`. |
| `--dry-run`     | `false` | Preview the wizard without installing packages, writing files, or running the first generation.                                                                                                                                                                  |

Each flag skips only its own prompt and combines with `--yes`. Pass all three value flags and the wizard runs without prompts or the review, no `--yes` needed.

## Examples

Run with the defaults and no prompts:

```shell [Terminal]
npx kubb init --yes
```

Run with no prompts and a specific spec, output directory, and plugins:

```shell [Terminal]
npx kubb init --yes --input ./openapi.yaml --plugins ts,zod --output src/api
```

```text [Output]
✓ Installed kubb @kubb/plugin-ts @kubb/plugin-zod with npm
✓ Wrote kubb.config.ts
✓ Generated 84 files in src/api
Kubb is set up. Run npm run generate after changing the spec.
```

Add `--dry-run` to preview what the wizard would install and write.
