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

Run `kubb update` to move installed extensions to the version the [Kubb registry](/docs/5.x/reference/registry) pins. It shows each installed extension's version change and bump, asks which updates to install, and installs them with your project's package manager. Then it generates from `kubb.config.ts` with the new versions and lists the files that changed. With `--yes`, it installs every update except majors. It does not change `kubb.config.ts`.

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

After the install, the CLI runs the same generation as `kubb generate` and lists the changed files as `M`, `A`, or `D`, at most 10:

```text [Output]
◇  Generated: 2 files changed
│  M src/gen/zod/petSchema.ts
│  A src/gen/zod/tagSchema.ts
└  ✓ Updated 1 extension
   Skipped  @kubb/plugin-zod 6.0.0  run kubb update plugin-zod later
```

List the updates without installing them:

```shell [Terminal]
kubb update --check
```

```text [Output]
2 updates available (1 major)
@kubb/plugin-ts   5.0.0 → 5.2.0
@kubb/plugin-zod  5.2.0 → 6.0.0  major
Run kubb update to install them.
```

It exits with code 1 when an update exists, so CI can fail on outdated extensions.

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
| `--check`     | `false` | List the available updates without installing them. Exits with code 1 when any exist. |
| `--yes`, `-y` | `false` | Install every update except majors without asking. |

## Which extensions it updates

`kubb update` checks the registry extensions listed in `dependencies` or `devDependencies` of the `package.json` in the current directory. An extension gets an update when its installed version is older than the pinned one, or when it is not installed. A version newer than the pin is left alone, so `kubb update` never downgrades.

An update that does not support your Kubb or Node.js version is skipped with `Skipped <id>: <reason>`. An extension pinned to a GitHub release installs as `github:<owner>/<repo>#<commit>`.

An id that matches no installed extension prints `<id> is not installed, or not in the registry.` and the other ids still update. When nothing is outdated, the CLI prints `Every installed extension is up to date.`

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb update` exits with code 1 when an id is invalid, the registry index cannot be read or is invalid, the install fails, or `--check` finds an update. It exits with code 0 when there is nothing to update and when you cancel at the prompt. A failed generation after the install prints `Generation failed. Run kubb generate to see why.` and does not change the exit code.
