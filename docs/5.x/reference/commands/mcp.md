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

`kubb mcp` starts a [Model Context Protocol](https://modelcontextprotocol.io/) server, so an AI client can validate a spec, scaffold a `kubb.config.ts`, and run generation. It takes no options. [Set up the MCP server](/docs/5.x/ai/mcp) shows how to add it to Claude Code, Cursor, VS Code, and other clients.

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

| Tool | Does |
| --- | --- |
| [`generate`](#generate) | Runs the Kubb pipeline from the project's config. |
| [`validate`](#validate) | Validates an OpenAPI or Swagger document. |
| [`init`](#init) | Writes a `kubb.config.ts` without prompts. |

### `generate` {#generate}

Runs the Kubb pipeline. On success, it returns the file count and the warnings and diagnostics raised. On failure, it returns each diagnostic with its code, fix, and docs link. A config that exports an array runs its first entry.

::field-group

:::field{name="config" type="string"}
Path to a config file inside the [working directory](#working-directory), with a `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, or `.cjs` extension. Without it, the server looks for `.kubbrc` then `kubb.config` in the working directory, its `.config/` and `configs/` folders, then each parent folder, the same search as `kubb generate`.
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

Validates an OpenAPI or Swagger document with the bundled OpenAPI adapter. It does not read the config.

::field-group

:::field{name="input" type="string" required}
Path or URL of the spec.
:::

::

### `init` {#init}

Writes a `kubb.config.ts` with an empty `plugins` array to the working directory. It does not install packages or add plugins: its reply tells the agent to run `kubb add <id> --yes` for each plugin. It fails when `kubb.config.ts` already exists.

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
- `generate` rejects a `config` path outside that folder.
- `init` writes `kubb.config.ts` there.

[Set the working directory](/docs/5.x/ai/mcp#working-directory) shows how to start the server in your project.
