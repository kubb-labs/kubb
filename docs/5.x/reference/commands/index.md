---
layout: doc
title: Commands
description: Reference for every command and flag exposed by the kubb CLI including init, generate, validate, mcp, studio, add, update, list, and remove.
outline: [2, 3]
navigation:
  title: Commands
  icon: i-iconoir-terminal
---

# Commands

The `kubb` CLI is the main way to run Kubb. It reads your [configuration](/docs/5.x/reference/configuration) and runs the generation pipeline. It also scaffolds projects, validates specs, starts a Model Context Protocol server for AI clients, connects a project to Kubb Studio, and installs extensions from the [Kubb registry](/docs/5.x/reference/registry).

## Usage

```text [Terminal]
USAGE:
  kubb [COMMANDS] <OPTIONS> [<input>]

COMMANDS:
  [generate] <OPTIONS> [<input>]      Generate types, clients, hooks, and schemas from an OpenAPI specification.
  add <OPTIONS> [<input>]             Find and install plugins, adapters, and parsers from the Kubb registry.
  init <OPTIONS> [<input>]            Set up a config, install plugins, and run the first generation.
  list <OPTIONS> [<input>]            List installed extensions, their versions, and available updates.
  mcp <OPTIONS> [<input>]             Start an MCP server for code generation from an AI assistant.
  remove <OPTIONS> [<input>]          Remove a plugin or parser from kubb.config.ts and uninstall its package.
  studio <OPTIONS> [<input>]          Connect this project to Kubb Studio, or manage its pairing and snapshots.
  update <OPTIONS> [<input>]          Update installed extensions, regenerate, and summarize file changes.
  validate <OPTIONS> [<input>]        Check a specification with the configured adapter before generating.

For more info, run any command with the `--help` flag:
  kubb --help
  kubb add --help
  kubb init --help
  kubb list --help
  kubb mcp --help
  kubb remove --help
  kubb studio --help
  kubb update --help
  kubb validate --help
```

Without a command, `kubb` runs `kubb generate`. After the commands, `kubb --help` lists the `generate` arguments, options, and examples, which [`kubb generate`](/docs/5.x/reference/commands/generate) documents.

## Available commands

| Command                       | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| [`kubb init`](/docs/5.x/reference/commands/init) | Scaffold a new Kubb project with an interactive wizard. |
| [`kubb generate`](/docs/5.x/reference/commands/generate) | Run the code-generation pipeline from your `kubb.config.ts`. |
| [`kubb validate`](/docs/5.x/reference/commands/validate) | Validate a Swagger/OpenAPI document without running the pipeline. |
| [`kubb mcp`](/docs/5.x/reference/commands/mcp) | Start a Model Context Protocol server for AI clients. |
| [`kubb studio`](/docs/5.x/reference/commands/studio) | Connect the project to Kubb Studio, or manage its pairing and snapshots. |
| [`kubb add`](/docs/5.x/reference/commands/add) | Install a plugin, adapter, or parser from the Kubb registry and add a plugin or parser to the config. |
| [`kubb update`](/docs/5.x/reference/commands/update) | Move installed extensions to the version the Kubb registry pins. |
| [`kubb list`](/docs/5.x/reference/commands/list) | List the installed extensions, their versions, and available updates. |
| [`kubb remove`](/docs/5.x/reference/commands/remove) | Remove a plugin or parser from the config and uninstall its package. |

## Environment variables

The CLI reads these shared environment variables.

| Variable                 | Type      | Used by  | Description                                                                     |
| ------------------------ | --------- | -------- | --------------------------------------------------------------------------------- |
| `KUBB_DISABLE_TELEMETRY` | `boolean` | all      | Turn off anonymous usage telemetry. Set it to `1` or `true`.                    |
| `DO_NOT_TRACK`           | `boolean` | all      | Standard opt-out convention. Set it to `1` or `true`.                           |
| `KUBB_DEBUG`             | `boolean` | all      | Turn on source maps, so stack traces point at the original source. Set it to `1` or `true`. Off by default because it slows startup. |
| `KUBB_HOME`              | `string`  | `generate`, `studio` | Directory the CLI keeps its Studio state and update check in. Defaults to `~/.kubb`. |
| `KUBB_TOKEN`             | `string`  | `studio snapshot` | Organization CI API key. Same as `--token`.                            |
| `KUBB_REGISTRY`          | `string`  | `init`, `add`, `update`, `list`, `remove` | Base URL of the extension registry. Defaults to `https://kubb.dev/registry`. |
