---
layout: doc
title: kubb remove
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

Ids, versions, and the project files it reads work the same for every extension command: see [Extension commands](/docs/5.x/reference/commands#extension-commands).

```shell [Terminal]
kubb remove plugin-zod                  # remove and uninstall
kubb remove plugin-zod --no-uninstall   # keep the package installed
```

| Argument or option | Description |
| --- | --- |
| `<id>` | The [registry id](/docs/5.x/reference/commands#ids). Required. |
| `--no-uninstall` | Edit the config only and keep the package installed. |

```text [Output]
◇  Plugin plugin-zod v5.13.0
│  Config    kubb.config.ts
│    - import { pluginZod } from '@kubb/plugin-zod'
│    - pluginZod({ output: { path: 'zod' } }),
│  Uninstalls @kubb/plugin-zod
│
◆  Remove it?
```

The command removes the call, also when Kubb Studio switched it off, and drops the unused import. It leaves the plugin's generated files on disk. With [`output.clean`](/docs/5.x/reference/configuration#outputclean), the next `kubb generate` removes them.

| It refuses to remove | Because |
| --- | --- |
| The adapter | A config needs one. Change it by hand. |
| The last parser | A config needs at least one. |
| An extension another plugin in the config depends on | Remove that plugin first. |

`@kubb/adapter-oas`, `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel` ship with `kubb`. They leave the config but stay installed. A package that another config entry still imports also stays installed. When the extension is not in the project, the command changes nothing and exits with code 0.

## Options {#options}

| Option | Default | Description |
| --- | --- | --- |
| `--config <path>`, `-c` | | Path to the Kubb config to edit. |
| `--yes`, `-y` | `false` | Skip the confirmation. |
| `--dry-run` | `false` | Show what the command would uninstall or write, then stop. Nothing changes. |

> [!TIP]
> Pass `--yes` in scripts and CI, where no one can answer the prompt.

## Exit codes {#exit-codes}

It exits with code 0 on success and when you cancel a prompt. It exits with code 1 when the id is invalid or unknown; no config is found; the extension cannot be removed; or the uninstall fails.
