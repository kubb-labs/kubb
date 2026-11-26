---
layout: doc
title: kubb mcp - Start the Kubb MCP server
description: The mcp command starts a stdio Model Context Protocol server with a tool for each Kubb command, such as generate, diff, add, and update, with each tool's parameters.
outline:
  - 2
  - 3
order: 9
navigation:
  title: kubb mcp
  icon: i-simple-icons-modelcontextprotocol
---

# kubb mcp

`kubb mcp` starts a [Model Context Protocol](https://modelcontextprotocol.io/) server, so your AI client can run every `kubb` command except `studio`: validate a spec, write a `kubb.config.ts`, manage extensions, and generate code. It takes no options. [Set up the MCP server](/docs/5.x/ai/mcp) shows how to add it to Claude Code, Cursor, VS Code, and other clients.

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

| Tool                    | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| [`generate`](#generate) | Runs the Kubb pipeline from the project's config.                  |
| [`validate`](#validate) | Validates an OpenAPI or Swagger document.                          |
| [`diff`](#diff)         | Shows what `generate` would change, without writing files.         |
| [`init`](#init)         | Writes a `kubb.config.ts` without prompts.                         |
| [`add`](#add)           | Installs an extension from the registry and adds it to the config. |
| [`update`](#update)     | Updates installed extensions and regenerates.                      |
| [`remove`](#remove)     | Removes an extension from the config and uninstalls it.            |
| [`list`](#list)         | Lists installed extensions and available updates.                  |

`diff`, `add`, `update`, `remove`, and `list` run the project's own `kubb` CLI with `--yes` and return its output and exit code. They need `kubb` installed in the project. `kubb studio` has no tool, since its login needs a browser.

### `generate` {#generate}

Runs the Kubb pipeline and returns the file count, warnings, and diagnostics. On failure, each diagnostic comes with its code, fix, and docs link. A config that exports an array runs its first entry.

::field-group

:::field{name="config" type="string"}
Path to a `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, or `.cjs` config file inside the [working directory](#working-directory). Without it, the server searches the way `kubb generate` does.
:::

:::field{name="input" type="string"}
Spec path. Overrides the config's `input`.
:::

:::field{name="output" type="string"}
Output folder. Overrides the config's `output.path`.
:::

:::field{name="logLevel" type="'silent' | 'info' | 'verbose'"}
Passed to a config that exports a function. Default: `info`.
:::

::

### `diff` {#diff}

Runs [`kubb generate --diff`](/docs/5.x/reference/commands/generate) and returns a unified diff for each generated file that is out of date. It writes nothing. Exit code `0` means the files are up to date, and `1` means they are out of date. A failed run returns an error.

::field-group

:::field{name="config" type="string"}
Path to a config file inside the [working directory](#working-directory). Without it, the CLI searches the way `kubb generate` does.
:::

:::field{name="lockfile" type="boolean"}
Set to `false` to compare with the generated text alone, as `--no-lockfile` does. Default: `true`.
:::

::

### `validate` {#validate}

Validates an OpenAPI or Swagger document with the bundled OpenAPI adapter. It does not read the config. A `$ref` may read local files only inside the [working directory](#working-directory), and fetch URLs only on public hosts.

::field-group

:::field{name="input" type="string" required}
Path or URL of the spec.
:::

::

### `init` {#init}

Writes a `kubb.config.ts` with an empty `plugins` array to the working directory, and fails when one exists. It installs nothing. Its reply tells the agent to run `kubb add <id> --yes` for each plugin.

::field-group

:::field{name="input" type="string"}
Spec path written to the config. Default: `./openapi.yaml`.
:::

:::field{name="output" type="string"}
Output folder written to the config. Default: `./src/gen`.
:::

::

### `add` {#add}

Runs [`kubb add <id> --yes`](/docs/5.x/reference/commands/add). It installs the extension at the version the registry pins, and adds a plugin or parser to the config with the plugins it needs.

::field-group

:::field{name="id" type="string" required}
Registry id: `owner/slug`, or a slug such as `plugin-zod` for an official extension.
:::

:::field{name="config" type="string"}
Path to a config file inside the [working directory](#working-directory).
:::

:::field{name="install" type="boolean"}
Set to `false` to only edit the config, as `--no-install` does. Default: `true`.
:::

:::field{name="dryRun" type="boolean"}
Preview the change without installing or writing. Default: `false`.
:::

::

### `update` {#update}

Runs [`kubb update --yes`](/docs/5.x/reference/commands/update). It updates extensions to the versions the registry pins, regenerates, and summarizes the file changes.

::field-group

:::field{name="ids" type="string[]"}
Registry ids to update. Default: every installed extension.
:::

:::field{name="dryRun" type="boolean"}
Preview the updates without installing or writing. Default: `false`.
:::

::

### `remove` {#remove}

Runs [`kubb remove <id> --yes`](/docs/5.x/reference/commands/remove). It removes a plugin or parser from the config and uninstalls its package.

::field-group

:::field{name="id" type="string" required}
Registry id: `owner/slug`, or a slug such as `plugin-zod` for an official extension.
:::

:::field{name="config" type="string"}
Path to a config file inside the [working directory](#working-directory).
:::

:::field{name="uninstall" type="boolean"}
Set to `false` to only edit the config, as `--no-uninstall` does. Default: `true`.
:::

:::field{name="dryRun" type="boolean"}
Preview the change without uninstalling or writing. Default: `false`.
:::

::

### `list` {#list}

Runs [`kubb list`](/docs/5.x/reference/commands/list). It takes no parameters.

## Working directory

The server runs in the folder the client starts it in:

- `generate` looks for the config there, then in each parent folder.
- `generate` rejects a `config` or `output` path outside that folder, and an `input` path outside it unless `input` is an `http:` or `https:` URL. The check follows symlinks, and resolves `output` and `input` from the config's `root`.
- `diff`, `add`, `update`, and `remove` reject a `config` path outside that folder too, and run the CLI there.
- `init` writes `kubb.config.ts` there.

When the server cannot find your config, see [Start it in your project](/docs/5.x/ai/mcp#working-directory).
