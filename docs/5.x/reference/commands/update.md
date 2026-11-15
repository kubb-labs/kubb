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

Ids, versions, and project files follow the [extension command rules](/docs/5.x/reference/commands#extension-commands).

```shell [Terminal]
kubb update                              # check every installed extension
kubb update --dry-run                    # list updates, install nothing
kubb update plugin-zod plugin-ts --yes   # two extensions, no prompt
```

## Arguments

| Argument | What it does |
| --- | --- |
| `[ids...]` | The [registry ids](/docs/5.x/reference/commands#ids) to update. Without ids, it checks every installed extension the registry lists. |

## Pick the updates

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

- Minor and patch updates start selected.
- A major starts unselected, since it can break the generated code, unless you named its id.
- After the install, it asks whether to regenerate, since that rewrites the generated files.

## Which extensions it updates {#update-scope}

An extension gets an update when its installed version is older than the pinned one, or when `package.json` lists it but it is not installed. An update that does not support your Kubb or Node.js version is skipped with `Skipped <id>: <reason>`. See [What kubb update prints](/docs/5.x/topics/extension-commands#extension-command-output).

## Options {#options}

| Flag | Alias | Default | What it does |
| --- | --- | --- | --- |
| `--yes` | `-y` | `false` | Skip the prompts. Installs every update except majors you did not name, and does not regenerate. |
| `--dry-run` | | `false` | List the updates, then stop. Nothing changes. |

> [!TIP]
> Pass `--yes` in scripts and CI, where no one can answer the prompt.

## Exit codes {#exit-codes}

| Code | When |
| --- | --- |
| `0` | The updates are installed, nothing is outdated, or you canceled a prompt. Also when the generation after the install fails. |
| `1` | An id is invalid or not installed (the other ids still update), a named extension's update is not compatible, the registry cannot be read, or the install fails. |
