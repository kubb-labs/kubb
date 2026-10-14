---
layout: doc
title: kubb add
description: The add command installs a plugin, adapter, or parser from the Kubb
  extension registry at its reviewed version and adds a plugin to kubb.config.ts.
outline:
  - 2
  - 3
order: 6
navigation:
  title: kubb add
  icon: i-iconoir-plus-circle
---

# kubb add

Run `kubb add` to install an extension from the [Kubb registry](/docs/5.x/reference/registry) at the version the registry pins. Without an id, it lists every plugin, adapter, and parser in the registry with its kind and pinned version, and asks which one to add. It checks that the extension supports your Kubb and Node.js versions, asks for confirmation, and installs the package as a dev dependency. For a plugin, it also adds the plugin to `kubb.config.ts`. For an adapter or parser, it prints the code to add.

Kubb detects the package manager (`npm`, `pnpm`, `yarn`, or `bun`) from your project.

## Usage

Pick an extension from the registry:

```shell [Terminal]
kubb add
```

Add an official plugin by its slug:

```shell [Terminal]
kubb add plugin-zod
```

Add a community plugin by its full id, without the confirmation:

```shell [Terminal]
kubb add acme/plugin-graphql --yes
```

Edit the config without installing the package:

```shell [Terminal]
kubb add plugin-zod --no-install
```

### npm or GitHub

An extension on npm installs as `<package>@<version>`. An extension pinned to a GitHub release installs as `github:<owner>/<repo>#<commit>`.

:::code-group

```shell [npm]
npx kubb add plugin-zod
# installs @kubb/plugin-zod@<version>
```

```shell [GitHub]
npx kubb add acme/kubb-plugin-example
# installs github:acme/kubb-plugin-example#<commit>
```

:::

## Arguments

| Argument | Required | Description |
| -------- | -------- | ----------- |
| `<id>`   | `false`  | Registry id as `<owner>/<slug>`, such as `kubb-labs/plugin-react-query`. A bare `<slug>` means `kubb-labs/<slug>`. Both parts use lowercase letters and digits joined by single hyphens. Without it, the CLI asks which extension to add. |

## Options

| Option                         | Default | Description |
| ------------------------------ | ------- | ----------- |
| `--config=<path>`, `-c <path>` |         | Path to the Kubb config to edit. Only used for plugins. Without it, the CLI looks for the same config files as `kubb generate`, in the current directory and then in each parent directory. |
| `--yes`, `-y`                  | `false` | Skip the confirmation. Needs an id. |
| `--no-install`                 |         | Do not install the package. A plugin is still added to the config. |

> [!TIP]
> Pass `--yes` in scripts and CI, where no one can answer the prompt.

## Config changes

For a plugin, `kubb add` adds its import and a call at the end of the `plugins` array. A plugin already in the array is left alone.

When the config cannot be edited, the CLI prints `Could not edit <file>: <reason>` and the snippet to add by hand. This happens when `plugins` is not an array literal, or when the export name is already imported from another package.

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. It must start with `http://` or `https://`. Trailing slashes are removed. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb add` exits with code 1 when the id is invalid or missing with `--yes`, the registry cannot be read or sends an invalid entry, the extension is incompatible, no config is found for a plugin, or the install fails. It exits with code 0 when you cancel at the prompt, and when it prints the snippet because the config could not be edited.
