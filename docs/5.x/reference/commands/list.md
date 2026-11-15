---
layout: doc
title: kubb list - Show installed extensions
description: The list command shows the installed Kubb extensions with their
  registry id, installed version, pinned registry version, and available updates.
outline:
  - 2
  - 3
order: 6
navigation:
  title: kubb list
  icon: i-iconoir-list
---

# kubb list

`kubb list` shows the extensions installed in your project, the version the registry pins for each, and whether an update exists. It takes no arguments or options.

Ids, versions, and project files work as in [Extension commands](/docs/5.x/reference/commands#extension-commands).

```shell [Terminal]
kubb list
```

```text [Output]
ID                    PACKAGE                    INSTALLED  REGISTRY  UPDATE
kubb-labs/plugin-ts   @kubb/plugin-ts            5.4.2      5.4.4     yes
kubb-labs/plugin-zod  @kubb/plugin-zod           5.4.4      5.4.4     no
-                     @acme/kubb-plugin-graphql  1.0.0      -         no
```

| Column | What it shows |
| --- | --- |
| `ID` | The registry id, or `-` when the registry does not list the package. |
| `PACKAGE` | The npm package name. |
| `INSTALLED` | The installed version, or `-` when the package is not installed. |
| `REGISTRY` | The version the registry pins, or `-` when the registry does not list the package. |
| `UPDATE` | `yes` when the installed version is older than the pinned one, or unknown. Run [`kubb update`](/docs/5.x/reference/commands/update) to install it. |

The list holds each `package.json` dependency that ships a valid [`kubb-extension.json`](/docs/5.x/reference/kit/manifest) or that the registry lists. See [Command output](#command-output).

When the registry cannot be read, it prints `Showing installed extensions only: <reason>` and lists the packages that ship a manifest.

## Exit codes {#exit-codes}

| Code | When |
| --- | --- |
| `0` | The list prints, also when the registry is unreachable or nothing is installed. |
| `1` | `KUBB_REGISTRY` is not an `http://` or `https://` URL. |

## Less common cases {#less-common-cases}

### Command output {#command-output}

`kubb list` shows each `package.json` package that ships a valid [`kubb-extension.json`](/docs/5.x/reference/kit/manifest) or is in the registry.

- Extensions bundled with `kubb`, such as `@kubb/adapter-oas` and `@kubb/plugin-barrel`, appear only when `package.json` lists them.
- When the registry cannot be read, it prints `Showing installed extensions only: <reason>` and lists the packages that ship a manifest.
- When it finds nothing, it prints `No installed extensions found.`
