---
layout: doc
title: kubb update - Update extensions to the pinned version
description: The update command moves installed Kubb extensions to the version
  the Kubb extension registry pins, or lists the available updates with --dry-run.
outline:
  - 2
  - 3
order: 5
navigation:
  title: kubb update
  icon: i-iconoir-refresh-double
---

# kubb update

`kubb update` moves installed extensions to the version the registry pins. It shows each version change, asks which updates to install, installs them, then offers to regenerate. It never changes `kubb.config.ts` and never downgrades.

Ids, versions, and the project files it reads work the same for every extension command: see [Extension commands](/docs/5.x/reference/commands#extension-commands).

```shell [Terminal]
kubb update                              # check every installed extension
kubb update --dry-run                    # list updates, install nothing
kubb update plugin-zod plugin-ts --yes   # two extensions, no prompt
```

| Argument | Description |
| --- | --- |
| `[ids...]` | The [registry ids](/docs/5.x/reference/commands#ids) to update. Without ids, every installed extension the registry lists is checked. |

With `--yes`, it installs every update except majors you did not name, and does not regenerate.

```text [Output]
◇  Checked 3 extensions against the registry
│  Extension         Current  Latest
│  @kubb/plugin-ts   5.0.0    5.2.0       minor
│  @kubb/plugin-zod  5.2.0    6.0.0       major · breaking
│  @kubb/plugin-msw  5.4.2    up to date
│
◆  Select the updates to install
│  ◼ @kubb/plugin-ts (5.0.0 → 5.2.0)
│  ◻ @kubb/plugin-zod (5.2.0 → 6.0.0)
│  ↑/↓ to navigate • Space: select • Enter: confirm
```

Minor and patch updates start selected. A major starts unselected, since it can break the generated code, unless you named its id.

After the install, `kubb update` finds the config the way [`kubb generate`](/docs/5.x/reference/commands/generate) does and asks whether to regenerate, since that rewrites the generated files. The summary lists the installed and skipped packages and the files that changed.

## Which extensions it updates {#update-scope}

An extension gets an update when its installed version is older than the pinned one, or when `package.json` lists it but it is not installed.

| Case | Result |
| --- | --- |
| An update does not support your Kubb or Node.js version | Skipped with `Skipped <id>: <reason>`. |
| A named id matches no installed extension | `<id> is not installed, or not in the registry.` The other ids still update, and the exit code is 1. |
| Nothing is outdated | The summary says `Already up to date`. |
| The generation after the install fails | The summary says `Extensions updated; generation failed`. The exit code stays 0. |

## Options {#options}

| Option | Default | Description |
| --- | --- | --- |
| `--yes`, `-y` | `false` | Skip the confirmation. |
| `--dry-run` | `false` | Show what the command would install, then stop. Nothing changes. |

> [!TIP]
> Pass `--yes` in scripts and CI, where no one can answer the prompt.

## Exit codes {#exit-codes}

It exits with code 0 on success and when you cancel a prompt. It exits with code 1 when an id is invalid or not installed; a named extension's update is not compatible; the registry is unreadable; or the install fails.
