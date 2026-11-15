---
layout: doc
title: kubb remove - Remove a plugin or parser
description: The remove command deletes a plugin or parser from kubb.config.ts
  and uninstalls its package.
outline:
  - 2
  - 3
order: 7
navigation:
  title: kubb remove
  icon: i-iconoir-trash
---

# kubb remove

`kubb remove` deletes a plugin or parser from `kubb.config.ts` and uninstalls its package. It shows the lines it removes and asks first.

Ids, versions, and project files follow the [extension command rules](/docs/5.x/reference/commands#extension-commands).

```shell [Terminal]
kubb remove plugin-zod                  # remove and uninstall
kubb remove plugin-zod --no-uninstall   # keep the package installed
```

```text [Output]
◇  Plugin plugin-zod v5.13.0
│  Config    kubb.config.ts
│    - import { pluginZod } from '@kubb/plugin-zod'
│    - pluginZod({ output: { path: 'zod' } }),
│  Uninstalls @kubb/plugin-zod
│
◆  Remove it?
```

## Arguments

| Argument | Required | What it does |
| --- | --- | --- |
| `<id>` | Yes | The [registry id](/docs/5.x/reference/commands#ids). |

## What it removes

The command removes the call and its unused import. It leaves the generated files on disk: with [`output.clean`](/docs/5.x/reference/configuration#outputclean), the next `kubb generate` removes them.

| It refuses to remove | Because |
| --- | --- |
| The adapter | A config needs one. Change it by hand. |
| The last parser | A config needs at least one. |
| An extension another plugin in the config depends on | Remove that plugin first. |

Extensions that ship with `kubb`, such as `@kubb/plugin-barrel` and `@kubb/parser-md`, leave the config but stay installed. See [What kubb remove keeps installed](#command-output).

## Options {#options}

| Flag | Alias | Default | What it does |
| --- | --- | --- | --- |
| `--config <path>` | `-c` | | Path to the Kubb config to edit. |
| `--yes` | `-y` | `false` | Skip the confirmation. |
| `--no-uninstall` | | | Edit the config only and keep the package installed. |
| `--dry-run` | | `false` | Show what the command would uninstall or write, then stop. |

> [!TIP]
> Pass `--yes` in scripts and CI, where no one can answer the prompt.

## Exit codes {#exit-codes}

| Code | When |
| --- | --- |
| `0` | The extension is removed, is not in the project, or you canceled a prompt. |
| `1` | The id is invalid or unknown, no config is found, the extension cannot be removed, or the uninstall fails. |

## Less common cases {#less-common-cases}

### Command output {#command-output}

`kubb remove` removes the call, also one Kubb Studio switched off, and drops the unused import.

- It leaves the plugin's generated files on disk. With [`output.clean`](/docs/5.x/reference/configuration#outputclean), the next `kubb generate` removes them.
- It refuses an adapter, such as `@kubb/adapter-oas`, because a config needs one. Change the adapter in the config by hand.
- `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel` ship with `kubb`. They leave the config but stay installed.
- A package that another config entry still imports also stays installed.
- Only plugins that run count as dependents. A plugin Studio switched off does not block the removal.
- When the extension is not in the project, nothing changes and the exit code is 0.
