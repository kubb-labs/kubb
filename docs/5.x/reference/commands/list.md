---
layout: doc
title: kubb list
description: The list command shows the installed Kubb extensions with their
  registry id, installed version, pinned registry version, and available updates.
outline:
  - 2
  - 3
order: 8
navigation:
  title: kubb list
  icon: i-iconoir-list
---

# kubb list

Run `kubb list` to see the Kubb extensions installed in the current project, the version the [Kubb registry](/docs/5.x/reference/registry) pins for each, and whether an update exists. It takes no arguments or options.

## Usage

```shell [Terminal]
kubb list
```

```text [Output]
ID                    PACKAGE                    INSTALLED  REGISTRY  UPDATE
kubb-labs/plugin-ts   @kubb/plugin-ts            5.4.2      5.4.4     yes
kubb-labs/plugin-zod  @kubb/plugin-zod           5.4.4      5.4.4     no
-                     @acme/kubb-plugin-graphql  1.0.0      -         no
```

## Columns

| Column      | Description |
| ----------- | ----------- |
| `ID`        | The registry id, or `-` when the registry does not list the package. |
| `PACKAGE`   | The npm package name. |
| `INSTALLED` | The installed version, or `-` when the package is not installed. |
| `REGISTRY`  | The version the registry pins, or `-` when the registry does not list the package. |
| `UPDATE`    | `yes` when the installed version is older than the pinned one, or unknown. Run [`kubb update`](/docs/5.x/reference/commands/update) to install it. |

## Which packages it lists

`kubb list` shows each package in `dependencies` or `devDependencies` of the `package.json` in the current directory that ships a valid [`kubb-extension.json`](/docs/5.x/reference/kit/manifest) or is in the registry.

Extensions that ship inside `kubb`, such as `@kubb/adapter-oas` and `@kubb/plugin-barrel`, appear only when `package.json` lists them directly.

When the registry cannot be read, the CLI prints `Showing installed extensions only: <reason>` and lists the packages that ship a manifest. When it finds nothing, it prints `No installed extensions found.`

## Environment variables

| Variable        | Default                     | Description |
| --------------- | --------------------------- | ----------- |
| `KUBB_REGISTRY` | `https://kubb.dev/registry` | Base URL of the registry to read. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |

## Exit codes

`kubb list` exits with code 1 when `KUBB_REGISTRY` is not an `http://` or `https://` URL. A registry that cannot be reached does not fail the command.
