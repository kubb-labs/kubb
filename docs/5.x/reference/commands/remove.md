---
layout: doc
title: kubb remove
description: The remove command deletes a plugin or parser from kubb.config.ts
  and uninstalls its package.
outline:
  - 2
  - 3
order: 9
navigation:
  title: kubb remove
  icon: i-iconoir-trash
---

# kubb remove

Run `kubb remove` to delete a plugin or parser from `kubb.config.ts` and uninstall its package. It looks the extension up in the [Kubb registry](/docs/5.x/reference/registry), shows the lines it removes from the config, asks for confirmation, and uninstalls the package with your project's package manager.

## Usage

Remove a plugin:

```shell [Terminal]
kubb remove plugin-zod
```

```text [Output]
◇  Plugin plugin-zod v5.13.0
│  Config    kubb.config.ts
│    - import { pluginZod } from '@kubb/plugin-zod'
│    - pluginZod({ output: { path: 'zod' } }),
│  Uninstalls @kubb/plugin-zod
│
◆  Remove it?
│  Yes
│
◇  pluginZod() removed from kubb.config.ts

✓ Plugin removed  3.42s

  Packages  @kubb/plugin-zod uninstalled with pnpm

Next     kubb generate
```

Files the plugin generated stay on disk until the next `kubb generate`.

Remove a plugin from the config and keep its package:

```shell [Terminal]
kubb remove plugin-zod --no-uninstall
```

## Arguments

| Argument | Required | Description |
| -------- | -------- | ----------- |
| `<id>`   | `true`   | Registry id, as `<owner>/<slug>` or a bare `<slug>` for `kubb-labs/<slug>`. |

## Options

| Option                | Default          | Description |
| --------------------- | ---------------- | ----------- |
| `--config`, `-c`      | `kubb.config.ts` | Path to the Kubb config file. |
| `--yes`, `-y`         | `false`          | Remove without asking. |
| `--no-uninstall`      |                  | Edit the config only and keep the package installed. |

## What it removes

`kubb remove` deletes every call of the package from the `plugins` or `parsers` array, including a plugin Kubb Studio switched off, and the imports nothing else in the file uses. In a config file that exports several entries, it edits the first entry.

It refuses to remove:

- the adapter, since a config needs one;
- the last parser in `parsers`, since a config without a parser cannot print files;
- an extension another extension in the config lists in its `dependencies`. Remove that one first.

`@kubb/adapter-oas`, `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel` ship with `kubb`, so they leave the config but stay installed.

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb remove` exits with code 1 when the id is invalid or not in the registry, the extension is an adapter or another one depends on it, the config cannot be edited, or the uninstall fails. It exits with code 0 when the extension is removed, when it was not in the project, and when you cancel at the prompt.
