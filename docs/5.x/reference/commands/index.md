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
  [generate] <OPTIONS> [<input>]      Generate TypeScript types, API clients, React Query hooks, Zod schemas, and more from an OpenAPI specification. Reads kubb.config.ts by default. Pass an OpenAPI file path as the first argument to override the input without editing the config.
  add <OPTIONS> [<input>]             Install a plugin, adapter, or parser from the Kubb registry at its reviewed version. A plugin or parser is added to kubb.config.ts, an adapter prints the code to add. Reads KUBB_REGISTRY to use another registry.
  init <OPTIONS> [<input>]            Scaffold a kubb.config.ts and install plugins for code generation from an OpenAPI spec. Run without flags for interactive setup, or pass --input, --output, and --plugins to skip the prompts.
  list <OPTIONS> [<input>]            List the installed Kubb extensions: their registry id, package, installed version, the version the Kubb registry pins, and whether an update exists.
  mcp <OPTIONS> [<input>]             Start a Model Context Protocol (MCP) server that exposes Kubb code generation as tools for AI assistants. Once running, configure your AI client (Claude, Cursor, Windsurf, etc.) to connect to it — the assistant can then call kubb generate directly without leaving the chat.
  remove <OPTIONS> [<input>]          Remove a plugin or parser from kubb.config.ts and uninstall its package.
  studio <OPTIONS> [<input>]          Connect this project to Kubb Studio, or manage its pairing and snapshots.
  update <OPTIONS> [<input>]          Update installed extensions to the version the Kubb registry pins. Pass ids to update only those, or --dry-run to list the updates without installing.
  validate <OPTIONS> [<input>]        Parse and validate an OpenAPI/Swagger file for structural correctness. Reports schema errors, missing required fields, and malformed references. Use this before running generate to catch spec issues early.

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

Run `kubb` with no command and it runs `kubb generate`. After the commands, `kubb --help` lists the `generate` arguments, options, and examples, which [`kubb generate`](/docs/5.x/reference/commands/generate) documents.

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
| `KUBB_HOME`              | `string`  | `studio` | Directory the CLI keeps its Studio state in. Defaults to `~/.kubb`.             |
| `KUBB_WORKERS`           | `number`  | `generate` | Experimental. Run the generators in this many worker threads, 2 or more, capped at the cores available. Off by default, on `--dry-run`, and when a plugin registers a `kubb:generate:schema` or `kubb:generate:operation` hook. The output matches a single-threaded run, except that a plugin failing in one chunk of nodes does not stop the other chunks. The threads reload the config and receive the parsed spec, so measure before enabling it: on a 4-core machine the GitHub spec gained nothing. |
| `KUBB_TOKEN`             | `string`  | `studio snapshot` | Organization CI API key. Same as `--token`.                            |
| `KUBB_REGISTRY`          | `string`  | `add`, `update`, `list`, `remove` | Base URL of the extension registry. Defaults to `https://kubb.dev/registry`. |
