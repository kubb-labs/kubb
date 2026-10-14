---
layout: doc
title: kubb mcp
description: The mcp command starts a Model Context Protocol server so AI
  clients can validate your spec, scaffold a config, and run generation.
outline:
  - 2
  - 3
order: 4
navigation:
  title: kubb mcp
  icon: i-simple-icons-modelcontextprotocol
---

# kubb mcp

Run `kubb mcp` to start a [Model Context Protocol](https://modelcontextprotocol.io/) server. AI clients such as Claude Code, Claude Desktop, Cursor, and VS Code can then validate your spec, scaffold a `kubb.config.ts`, and run generation.

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

The server uses the stdio transport, so the client starts it as a local process. [Set up the MCP server](/docs/5.x/ai/mcp) shows the client configuration.

## Tools

| Tool       | Parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Description                                                                                                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `generate` | `config?` (path to a config file inside the working directory. When omitted, the server searches the same way `kubb generate` does: `.kubbrc` then `kubb.config` with the `ts`, `mts`, `cts`, `js`, `mjs`, `cjs` extensions, in the working directory, its `.config/` and `configs/` folders, then each parent folder), `input?` (spec path, overrides the config), `output?` (output directory, overrides the config), `logLevel?` (`silent`, `info`, `verbose`, default `info`, passed to a config that exports a function) | Runs the Kubb pipeline. On success, it returns the file count and the warnings and diagnostics raised. On failure, it returns each diagnostic with its code, fix, and docs link instead. A config that exports an array runs its first entry.                      |
| `validate` | `input` (path or URL, required)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Validates an OpenAPI or Swagger document with the bundled OpenAPI adapter.                                                                                                                                                                                         |
| `init`     | `input?` (default `./openapi.yaml`), `output?` (default `./src/gen`)                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Writes a `kubb.config.ts` with an empty `plugins` array in the working directory without prompts. It does not install packages or add plugins: its reply tells the agent to run `kubb add <id> --yes` for each one. It fails when `kubb.config.ts` already exists. |

## Working directory

The server runs in the folder the client starts it in. `generate` looks for its config there, then in its parent folders, and rejects a `config` path outside it, and `init` writes `kubb.config.ts` there. [Set up the MCP server](/docs/5.x/ai/mcp#working-directory) shows how to start the server in your project.
