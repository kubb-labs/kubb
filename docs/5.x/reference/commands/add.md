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

Run `kubb add` to install an extension from the [Kubb registry](/docs/5.x/reference/registry) at the version the registry pins. Without an id, it lets you search the registry. It checks that the extension supports your Kubb and Node.js versions, shows the packages it installs and the lines it adds to the config, asks for confirmation, and installs the package as a dev dependency. For a plugin, it also adds the plugin to `kubb.config.ts`. For an adapter or parser, it prints the code to add.

Kubb detects the package manager (`npm`, `pnpm`, `yarn`, or `bun`) from your project.

## Usage

Search the registry and pick an extension:

```shell [Terminal]
kubb add
```

```text [Output]
◆  Add an extension · 38 in the registry
│  Search: mo_
│  ● plugin-msw (MSW handlers backed by mock data)
│  ○ plugin-faker
│  ○ plugin-ts (installed)
│  ↑/↓ to select • Enter: confirm • Type: to search
```

Each row is the id to pass to `kubb add`. The focused row also shows the description. Typing filters the rows on the id, display name, and description, without a request per key. An installed extension shows `installed` and cannot be picked.

Before asking, the CLI shows what it will do:

```text [Output]
◇  Plugin plugin-zod v5.2.0 · Zod schemas from your spec
│  Needs     plugin-ts ✓ installed
│  Installs  @kubb/plugin-zod@5.2.0
│  Config    kubb.config.ts
│    + import { pluginZod } from '@kubb/plugin-zod'
│    + plugins: [pluginTs(), pluginZod()],
◆  Add it?
```

After the install, the summary names the plugin, package, config changes, and next step:

```text [Output]
✓ Plugin ready  4.20s

  1 plugin added to config
  Plugin   plugin-zod
  Package  @kubb/plugin-zod@5.2.0
  Config   kubb.config.ts

Changes
  Packages  1 installed with pnpm
  Config    1 plugin registration added

Next     kubb generate  creates ./src/gen
Options  kubb.dev/extensions/kubb-labs/plugin-zod
```

With `--no-install`, the summary says `Plugin configured` and reports that installation was skipped. An existing registration counts as zero plugins added. When installation succeeds but the config needs manual changes, the summary reports both results and prints the snippet to add. Adapters and parsers use their own labels.

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

## Required plugins

When the manifest lists `dependencies` that are not in `kubb.config.ts`, the CLI asks whether to add them as well. `Yes, add both` installs and adds them next to the extension. `Only <id>` adds the extension alone, and `kubb generate` fails until you add the rest. With `--yes`, it adds them.

## Unknown ids

An id the registry does not list prints `No extension named <id> in the registry`, the closest ids as `kubb add <id>` commands, and a link to [kubb.dev/extensions](https://kubb.dev/extensions).

## Config changes

For a plugin, `kubb add` adds its import and a call at the end of the `plugins` array. A plugin already in the array is left alone.

When the config cannot be edited, the CLI prints `Could not edit <file>: <reason>` and the snippet to add by hand. This happens when `plugins` is not an array literal, or when the export name is already imported from another package.

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. It must start with `http://` or `https://`. Trailing slashes are removed. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb add` exits with code 1 when the id is invalid, unknown, or missing with `--yes`, the registry cannot be read or sends an invalid index, the extension is incompatible, no config is found for a plugin, or the install fails. It exits with code 0 when you cancel at the prompt, and when it prints the snippet because the config could not be edited.
