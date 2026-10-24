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

Run `kubb remove` to delete a plugin or parser from `kubb.config.ts` and uninstall its package. It shows the lines it removes and asks before it changes anything.

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

Keep the package installed:

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

`kubb remove` deletes the plugin or parser from the config, also when Kubb Studio switched it off, and drops its unused import. With several config entries, it edits the first one.

It does not remove:

- the adapter. A config needs one.
- the last parser. A config needs at least one.
- an extension another one depends on. Remove that one first.

`@kubb/adapter-oas`, `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel` ship with `kubb`. They leave the config but stay installed.

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb remove` exits with code 1 when it cannot remove the extension or the uninstall fails. It exits with code 0 when the extension is removed, was not in the project, or you cancel.
