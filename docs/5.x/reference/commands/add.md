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

Run `kubb add` to install an extension from the [Kubb registry](/docs/5.x/reference/registry) at the version the registry pins. Without an id, it lets you search the registry. The command checks that the extension supports your Kubb and Node.js versions, then shows the packages it installs and the lines it adds to the config. After you confirm, it installs the package as a dev dependency.

`kubb add` writes a plugin or parser to `kubb.config.ts`. For an adapter, it prints the code to add.

When the config has no `parsers`, adding a parser also writes the defaults: `parserTs()`, `parserTsx()`, and `parserMd()`.

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

Each row is the id to pass to `kubb add`. The focused row also shows the description. Typing filters the rows on the id, display name, and description. An installed extension shows `installed` and cannot be picked.

Before asking, the CLI shows what it will do:

```text [Output]
◇  Plugin plugin-faker v5.3.2 · Generates a Faker.js mock-data factory for every schema in your…
│  Needs     plugin-ts ✓ installed
│  Installs  @kubb/plugin-faker@5.3.2
│  Config    kubb.config.ts
│    + import { pluginFaker } from '@kubb/plugin-faker'
│    + plugins: [pluginTs(), pluginFaker()],
◆  Add it?
```

After the install, the summary lists the packages, the registrations it added, and the next step:

```text [Output]
✓ Plugin ready  4.20s

  Packages  1 installed with pnpm
  + pluginFaker()

Next     kubb generate
Options  kubb.dev/extensions/kubb-labs/plugin-faker
```

With `--no-install`, the summary says `Plugin configured` and reports that installation was skipped. For a plugin already in the config, it says `Plugin already configured`. When the install succeeds but the config needs manual changes, it says `Plugin needs configuration` and the CLI prints the snippet to add. Adapters and parsers use `Adapter` and `Parser` in these titles.

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
| `--config=<path>`, `-c <path>` |         | Path to the Kubb config to edit. Used for plugins and parsers. Without it, the CLI looks for the same config files as `kubb generate`, in the current directory and then in each parent directory. |
| `--yes`, `-y`                  | `false` | Skip the confirmation. Needs an id. |
| `--no-install`                 |         | Do not install the package. A plugin or parser is still added to the config. |

> [!TIP]
> Pass `--yes` in scripts and CI, where no one can answer the prompt.

## Required plugins

When the manifest lists `dependencies` that are not in `kubb.config.ts`, the CLI asks whether to add them as well. `Yes, add both` installs and adds them next to the extension. `Only <id>` adds the extension alone, and `kubb generate` fails until you add the rest. With `--yes`, it adds them.

## Unknown ids

An id the registry does not list prints `No extension named <id>`, the closest ids as `kubb add <id>` commands, and a link to [kubb.dev/extensions](https://kubb.dev/extensions).

## Config changes

For a plugin, `kubb add` adds its import and a call at the end of the `plugins` array. For a parser, it does the same in the `parsers` array. An extension already in its array is left alone.

When the config cannot be edited, the CLI prints `Could not edit <file>: <reason>` and the snippet to add by hand, then exits with code 1. The edit fails when `plugins` is not an array literal, or when the export name is already imported from another module.

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. It must start with `http://` or `https://`. Trailing slashes are removed. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb add` exits with code 1 in these cases:

- The id is invalid, unknown, or missing with `--yes`.
- The registry cannot be read or sends an invalid index.
- The extension does not support the running Kubb or Node.js version.
- No config is found for a plugin or parser.
- The install fails.
- A plugin or parser cannot be written to the config, so the CLI prints the snippet.

It exits with code 0 when you cancel at the prompt, and for an adapter, which is never written to the config.
