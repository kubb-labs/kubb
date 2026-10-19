---
layout: doc
title: kubb update
description: The update command moves installed Kubb extensions to the version
  the Kubb extension registry pins, or lists the available updates with --dry-run.
outline:
  - 2
  - 3
order: 7
navigation:
  title: kubb update
  icon: i-iconoir-refresh-double
---

# kubb update

Run `kubb update` to move installed extensions to the version the [Kubb registry](/docs/5.x/reference/registry) pins. It shows each installed extension's version change and bump, asks which updates to install, and installs them with your project's package manager. Then it generates from `kubb.config.ts` with the new versions and summarizes the files that changed. With `--yes`, it installs every update except majors. It does not change `kubb.config.ts`.

## Usage

Update every installed extension the registry lists:

```shell [Terminal]
kubb update
```

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

Minor and patch updates start selected. A major starts unselected, since it can break the generated code. The hint is the version change.

After the install, the summary starts with the outcome and duration, then labels plugin versions, package installation, and regeneration separately:

```text [Output]
✓ Update complete  2.16s

  1 plugin updated
  Plugins  1 updated · 1 skipped
  Packages  1 installed with pnpm
  Config    kubb.config.ts · unchanged

Extension versions
  Plugin  @kubb/plugin-ts  5.0.0 → 5.2.0
  Skipped  Plugin @kubb/plugin-zod 6.0.0  run kubb update plugin-zod later

File changes after regeneration
  1 added · 1 modified · 0 deleted
  12 unchanged
  Output  src/gen
```

List the updates without installing them:

```shell [Terminal]
kubb update --dry-run
```

```text [Output]
◇ Updates available  138ms

  2 updates available (1 major)
  Packages  nothing installed
  Config    unchanged · regeneration not run

Available extension versions
  Plugin  @kubb/plugin-ts  5.0.0 → 5.2.0
  Plugin  @kubb/plugin-zod  5.2.0 → 6.0.0  major

Dry run: nothing was installed. Run kubb update to install them.
```

The preview exits with code 0 when the check succeeds, including when updates are available. It installs no packages and does not regenerate files.

Install the updates for two extensions without the prompt:

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
| `--dry-run`   | `false` | List the available updates without installing them. |
| `--yes`, `-y` | `false` | Install every update except majors without asking. |

## Which extensions it updates

`kubb update` checks the registry extensions listed in `dependencies` or `devDependencies` of the `package.json` in the current directory. An extension gets an update when its installed version is older than the pinned one, or when it is not installed. A version newer than the pin is left alone, so `kubb update` never downgrades.

An update that does not support your Kubb or Node.js version is skipped with `Skipped <id>: <reason>`. An extension pinned to a GitHub release installs as `github:<owner>/<repo>#<commit>`.

An id that matches no installed extension prints `<id> is not installed, or not in the registry.` and the other ids still update. When nothing is outdated, the summary says `Already up to date`. An incompatible update is reported as skipped.

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb update` exits with code 1 when an id is invalid, the registry index cannot be read or is invalid, or the install fails. It exits with code 0 when there is nothing to update and when you cancel at the prompt. A failed generation after installation produces a warning summary that distinguishes installed extensions from failed regeneration and does not change the exit code.
