---
layout: doc
title: Commands
description: Every kubb CLI command with links to its reference, plus the global flags, deprecated flags, environment variables, and exit codes all commands share.
outline: [2, 3]
navigation:
  title: Commands
  icon: i-iconoir-terminal
---

# Commands

The `kubb` CLI reads your [configuration](/docs/5.x/reference/configuration), runs generation, and manages the extensions you install from the [Kubb registry](/docs/5.x/reference/registry).

```shell [Terminal]
kubb <command> [options]
```

`kubb` without a command runs `kubb generate`. `kubb --help` lists every command and the `generate` options.

## Commands

| Command | What it does |
| --- | --- |
| [`kubb init`](/docs/5.x/reference/commands/init) | Set up a config, install plugins, and run the first generation. |
| [`kubb generate [input]`](/docs/5.x/reference/commands/generate) | Run the generation pipeline from `kubb.config.ts`. The default command. |
| [`kubb validate <input>`](/docs/5.x/reference/commands/validate) | Check a spec with the configured adapter, without generating. |
| [`kubb add [id]`](/docs/5.x/reference/commands/extensions#add) | Install an extension from the registry and add it to the config. |
| [`kubb update [ids...]`](/docs/5.x/reference/commands/extensions#update) | Move installed extensions to the version the registry pins. |
| [`kubb list`](/docs/5.x/reference/commands/extensions#list) | List installed extensions, their versions, and available updates. |
| [`kubb remove <id>`](/docs/5.x/reference/commands/extensions#remove) | Remove a plugin or parser from the config and uninstall it. |
| [`kubb studio [action]`](/docs/5.x/reference/commands/studio) | Connect the project to Kubb Studio, or manage its pairing and snapshots. |
| [`kubb mcp`](/docs/5.x/reference/commands/mcp) | Start a Model Context Protocol server for AI clients. |

## Global flags

| Flag | Description |
| --- | --- |
| `--help`, `-h` | Print the help of the command, such as `kubb add --help`. |
| `--version`, `-v` | Print the CLI version. |

The v4 camelCase flags still work and print a deprecation warning: `--logLevel`, `--dryRun`, `--allowWrite`, `--allowConfigEdit`, `--allowExec`, and `--packageVersion`. Use the kebab-case form, such as `--log-level`. `kubb update --check` is now `kubb update --dry-run`.

## Environment variables

| Variable | Read by | Description |
| --- | --- | --- |
| `KUBB_DISABLE_TELEMETRY` | every command | `1` or `true` turns off anonymous usage telemetry and its notice. |
| `DO_NOT_TRACK` | every command | Same as `KUBB_DISABLE_TELEMETRY`, following the cross-tool convention. |
| `KUBB_DEBUG` | every command | `1` or `true` turns on source maps, so stack traces point at the original source. Off by default because it slows startup. |
| `CI` | every command | Any value except `false` or `0` marks a CI run: plain output, no update check, and no Studio pairing. Provider variables such as `GITHUB_ACTIONS` and `GITLAB_CI` count too. |
| `KUBB_HOME` | `generate`, `studio` | Folder for the update check and for Studio credentials, worker state, and log. Defaults to `~/.kubb`. |
| `KUBB_REGISTRY` | `init`, `add`, `update`, `list`, `remove` | Base URL of the extension registry. Defaults to `https://kubb.dev/registry`. It must start with `http://` or `https://`, and trailing slashes are removed. See [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry). |
| `KUBB_TOKEN` | `studio snapshot` | Organization CI API key, the default for `--token`. |
| `KUBB_AGENT_MAX_GENERATIONS` | `studio` | How many recent generations the agent keeps for Studio to read. Defaults to `8`. |
| `KUBB_AGENT_MAX_GENERATIONS_MB` | `studio` | Size cap in MB for the kept generations. Defaults to `100`. |

## Exit codes

Every command exits with `0` on success and `1` on failure. Each command page lists the cases that differ, such as a canceled prompt.
