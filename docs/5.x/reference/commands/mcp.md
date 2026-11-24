---
layout: doc
title: kubb mcp - Start the Kubb MCP server
description: The mcp command starts a stdio Model Context Protocol server with generate, validate, and init tools for AI clients, with each tool's parameters.
outline:
  - 2
  - 3
order: 9
navigation:
  title: kubb mcp
  icon: i-simple-icons-modelcontextprotocol
---

# kubb mcp

`kubb mcp` starts a [Model Context Protocol](https://modelcontextprotocol.io/) server, so your AI client can validate a spec, write a `kubb.config.ts`, and generate code. It takes no options. [Set up the MCP server](/docs/5.x/ai/mcp) shows how to add it to Claude Code, Cursor, VS Code, and other clients.

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

| Tool | What it does |
| --- | --- |
| [`generate`](#generate) | Runs the Kubb pipeline from the project's config. |
| [`validate`](#validate) | Validates an OpenAPI or Swagger document. |
| [`init`](#init) | Writes a `kubb.config.ts` without prompts. |

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

## Working directory

The server runs in the folder the client starts it in:

- `generate` looks for the config there, then in each parent folder.
- `generate` rejects a `config` or `output` path outside that folder, and an `input` path outside it unless `input` is an `http:` or `https:` URL. The check follows symlinks, and resolves `output` and `input` from the config's `root`.
- `init` writes `kubb.config.ts` there.

When the server cannot find your config, see [Start it in your project](/docs/5.x/ai/mcp#working-directory).
