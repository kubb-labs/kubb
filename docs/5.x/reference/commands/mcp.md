---
layout: doc
title: kubb mcp - Start the Kubb MCP server
description: The mcp command starts a stdio Model Context Protocol server with a tool for every Kubb command except studio and mcp, such as kubb_generate, kubb_diff, kubb_add, and kubb_update, with each tool's parameters.
outline:
  - 2
  - 3
order: 9
navigation:
  title: kubb mcp
  icon: i-simple-icons-modelcontextprotocol
---

# kubb mcp

`kubb mcp` starts a [Model Context Protocol](https://modelcontextprotocol.io/) server, so your AI client can run every `kubb` command except `studio` and `mcp`: validate a spec, write a `kubb.config.ts`, manage extensions, and generate code. It takes no options. [Set up the MCP server](/docs/5.x/ai/mcp) shows how to add it to Claude Code, Cursor, VS Code, and other clients.

> [!WARNING]
> This feature is under active development. Use it with caution and expect breaking changes.

::terminal
---
command: kubb mcp
output:
  - ⏳ Starting MCP server...
  - This feature is still under development, use with caution
---
::

The server uses the stdio transport, so the client starts it as a local process. Its own messages go to stderr, since stdout carries the protocol.

## Tools

Each tool is named after its CLI command with a `kubb_` prefix and underscores, so the names stay unique next to the tools of other servers.

| Tool | What it does | Writes |
| --- | --- | --- |
| [`kubb_generate`](#kubb-generate) | Runs the Kubb pipeline from the project's config. | Yes, overwrites generated files |
| [`kubb_validate`](#kubb-validate) | Validates an OpenAPI or Swagger document. | No |
| [`kubb_diff`](#kubb-diff) | Shows what `kubb_generate` would change, without writing files. | No |
| [`kubb_init`](#kubb-init) | Writes a `kubb.config.ts` without prompts. | Yes, a new file only |
| [`kubb_add`](#kubb-add) | Installs an extension from the registry and adds it to the config. | Yes |
| [`kubb_update`](#kubb-update) | Updates installed extensions. | Yes, replaces installed versions |
| [`kubb_remove`](#kubb-remove) | Removes an extension from the config and uninstalls it. | Yes, removes |
| [`kubb_list`](#kubb-list) | Lists installed extensions and available updates. | No |

`kubb_diff`, `kubb_add`, `kubb_update`, `kubb_remove`, and `kubb_list` run the `kubb` CLI and return its output and exit code. They use the project's own `kubb`, or the one that started the server when the project has none. `kubb_add`, `kubb_update`, and `kubb_remove` pass `--yes` and accept `dryRun`. `kubb studio` has no tool, since its login needs a browser.

### Annotations {#annotations}

Every tool sets the MCP [tool annotations](https://modelcontextprotocol.io/specification/2025-11-25/server/tools), so a client can run a read-only tool without asking and confirm a destructive one.

| Tool | `readOnlyHint` | `destructiveHint` | `idempotentHint` | `openWorldHint` |
| --- | --- | --- | --- | --- |
| `kubb_generate` | `false` | `true` | `true` | `true` |
| `kubb_validate` | `true` | | `true` | `true` |
| `kubb_diff` | `true` | | `true` | `true` |
| `kubb_init` | `false` | `false` | `true` | `false` |
| `kubb_add` | `false` | `false` | `true` | `true` |
| `kubb_update` | `false` | `true` | `true` | `true` |
| `kubb_remove` | `false` | `true` | `true` | `false` |
| `kubb_list` | `true` | | `true` | `true` |

`kubb_generate` is destructive because it overwrites generated files and, with `output.clean`, empties the output folder first. `openWorldHint` is `true` for a tool that can fetch a spec URL or reach the registry.

### Output size {#output-size}

A tool that runs the CLI returns 30,000 characters of text at most, which stays under the 10,000 tokens at which Claude Code warns about a tool response. Longer output is cut at a line break and ends with a notice, which counts toward the limit:

```text
[Output cut: showing the first 29712 of 412090 characters. The diffs of the later files are missing. The out-of-date files are listed below.

2 generated files are out of date:
src/gen/types/Pet.ts (+4120 -3980)
src/gen/types/Order.ts (+12 -3)]
```

For `kubb_diff`, the notice lists the out-of-date files with their line counts. Set `format` to `summary` to get only that list.

### `kubb_generate` {#kubb-generate}

Runs the Kubb pipeline and returns the file count, warnings, and diagnostics. On failure, each diagnostic comes with its code, fix, and docs link. A config that exports an array runs its first entry.

::field-group

:::field{name="configPath" type="string"}
Path to a `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, or `.cjs` config file inside the [working directory](#working-directory). Without it, the server searches the way `kubb generate` does.
:::

:::field{name="inputPath" type="string"}
Spec path or URL. Overrides the config's `input`.
:::

:::field{name="outputPath" type="string"}
Output folder. Overrides the config's `output.path`.
:::

:::field{name="logLevel" type="'silent' | 'info' | 'verbose'"}
Passed to a config that exports a function. Default: `info`.
:::

::

### `kubb_diff` {#kubb-diff}

Runs [`kubb generate --diff`](/docs/5.x/reference/commands/generate) and returns the generated-file diff: a unified diff for each generated file that differs from what `kubb_generate` would write. It writes nothing, and it does not compare two versions of a spec. Exit code `0` means the files are up to date, and `1` means they are out of date. A failed run returns an error.

::field-group

:::field{name="configPath" type="string"}
Path to a config file inside the [working directory](#working-directory). Without it, the CLI finds the config the way [`kubb generate`](/docs/5.x/reference/commands/generate) does.
:::

:::field{name="format" type="'full' | 'summary'"}
`full` returns the unified diffs, cut at the [output limit](#output-size). `summary` returns one line per out-of-date file with its added and removed line counts, such as `src/gen/pet.ts (+12 -3)`. Default: `full`.
:::

:::field{name="lockfile" type="boolean"}
Set to `false` to compare with the generated text alone, as `--no-lockfile` does. Default: `true`.
:::

::

### `kubb_validate` {#kubb-validate}

Validates an OpenAPI or Swagger document with the bundled OpenAPI adapter. It does not read the config, and it writes nothing. A `$ref` may read local files only inside the [working directory](#working-directory), and fetch URLs only on public hosts.

::field-group

:::field{name="inputPath" type="string" required}
Path or URL of the spec.
:::

::

### `kubb_init` {#kubb-init}

Writes a `kubb.config.ts` with an empty `plugins` array to the working directory, and fails when one exists. It installs nothing. Its reply tells the agent to call `kubb_add` for each plugin.

::field-group

:::field{name="inputPath" type="string"}
Spec path written to the config. Default: `./openapi.yaml`.
:::

:::field{name="outputPath" type="string"}
Output folder written to the config. Default: `./src/gen`.
:::

::

### `kubb_add` {#kubb-add}

Runs [`kubb add <id> --yes`](/docs/5.x/reference/commands/add). It installs a plugin, adapter, or parser at the version the registry pins. A plugin or parser is added to the config with the plugins it needs, and an adapter comes back as a snippet to add by hand.

::field-group

:::field{name="extensionId" type="string" required}
Registry id: `owner/slug`, or a slug such as `plugin-zod` for an official extension.
:::

:::field{name="configPath" type="string"}
Path to a config file inside the [working directory](#working-directory).
:::

:::field{name="install" type="boolean"}
Set to `false` to only edit the config, as `--no-install` does. Default: `true`.
:::

:::field{name="dryRun" type="boolean"}
Preview the change without installing or writing. Default: `false`.
:::

::

### `kubb_update` {#kubb-update}

Runs [`kubb update --yes`](/docs/5.x/reference/commands/update). It updates extensions to the versions the registry pins and summarizes the install. It does not regenerate, so call [`kubb_generate`](#kubb-generate) afterwards to update the generated files.

::field-group

:::field{name="extensionIds" type="string[]"}
Registry ids to update. Default: every installed extension. A major update is installed only for an extension you name here.
:::

:::field{name="dryRun" type="boolean"}
Preview the updates without installing or writing. Default: `false`.
:::

::

### `kubb_remove` {#kubb-remove}

Runs [`kubb remove <id> --yes`](/docs/5.x/reference/commands/remove). It removes a plugin or parser from the config and uninstalls its package. It leaves the files the extension generated, so call [`kubb_generate`](#kubb-generate) afterwards.

::field-group

:::field{name="extensionId" type="string" required}
Registry id: `owner/slug`, or a slug such as `plugin-zod` for an official extension.
:::

:::field{name="configPath" type="string"}
Path to a config file inside the [working directory](#working-directory).
:::

:::field{name="uninstall" type="boolean"}
Set to `false` to only edit the config, as `--no-uninstall` does. Default: `true`.
:::

:::field{name="dryRun" type="boolean"}
Preview the change without uninstalling or writing. Default: `false`.
:::

::

### `kubb_list` {#kubb-list}

Runs [`kubb list`](/docs/5.x/reference/commands/list) and returns the installed extensions, their versions, and the available updates. It takes no parameters and changes nothing.

## Working directory

The server runs in the folder the client starts it in:

- `kubb_generate` looks for the config there, then in each parent folder.
- `kubb_generate` rejects a `configPath` or `outputPath` outside that folder, and an `inputPath` outside it unless `inputPath` is an `http:` or `https:` URL. The check follows symlinks, and resolves `outputPath` and `inputPath` from the config's `root`.
- `kubb_diff`, `kubb_add`, and `kubb_remove` reject a `configPath` outside that folder too.
- Every tool that runs the CLI runs it there.
- `kubb_init` writes `kubb.config.ts` there.

When the server cannot find your config, see [Start it in your project](/docs/5.x/ai/mcp#working-directory).
