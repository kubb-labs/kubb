---
layout: doc
title: kubb update
description: The update command moves installed Kubb extensions to the version
  the Kubb extension registry pins, or lists the available updates with --check.
outline:
  - 2
  - 3
order: 7
navigation:
  title: kubb update
  icon: i-iconoir-refresh-double
---

# kubb update

Run `kubb update` to move installed extensions to the version the [Kubb registry](/docs/5.x/reference/registry) pins. It lists the updates, asks for confirmation, and installs them with your project's package manager. It does not change `kubb.config.ts`.

## Usage

Update every installed extension the registry lists:

```shell [Terminal]
kubb update
```

List the updates without installing them:

```shell [Terminal]
kubb update --check
```

Update two extensions without the confirmation:

```shell [Terminal]
kubb update plugin-zod plugin-ts --yes
```

## Arguments

| Argument   | Required | Description |
| ---------- | -------- | ----------- |
| `[ids...]` | `false`  | Registry ids to update, as `<owner>/<slug>` or a bare `<slug>` for `kubb-labs/<slug>`. Without ids, every installed extension the registry lists is checked. |

## Options

| Option        | Default | Description |
| ------------- | ------- | ----------- |
| `--check`     | `false` | List the available updates without installing them. |
| `--yes`, `-y` | `false` | Skip the confirmation. |

## Which extensions it updates

`kubb update` checks the registry extensions listed in `dependencies` or `devDependencies` of the `package.json` in the current directory. An extension gets an update when its installed version is older than the pinned one, or when it is not installed. A version newer than the pin is left alone, so `kubb update` never downgrades.

An update that does not support your Kubb or Node.js version is skipped with `Skipped <id>: <reason>`. An extension pinned to a GitHub release installs as `github:<owner>/<repo>#<commit>`.

An id that matches no installed extension prints `<id> is not installed, or not in the registry.` and the other ids still update. When nothing is outdated, the CLI prints `Every installed extension is up to date.`

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb update` exits with code 1 when an id is invalid, the registry index cannot be read or is invalid, or the install fails. It exits with code 0 when there is nothing to update, with `--check`, and when you cancel at the prompt.

## See also

- [`kubb add`](/docs/5.x/reference/commands/add): install an extension from the registry
- [`kubb list`](/docs/5.x/reference/commands/list): show installed extensions and available updates
- [Extension registry](/docs/5.x/reference/registry): how a record pins one npm version
