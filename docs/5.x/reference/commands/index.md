---
layout: doc
title: Kubb CLI commands - Flags, env vars, and exit codes
description: Every kubb CLI command with links to its reference, plus the global flags, environment variables, and exit codes all commands share.
outline: [2, 3]
navigation:
  title: Commands
  icon: i-iconoir-terminal
---

# Commands

The `kubb` CLI generates code from your [configuration](/docs/5.x/reference/configuration) and manages the extensions you install from the [extension registry](/extensions).

```shell [Terminal]
kubb <command> [options]
```

`kubb` alone runs `kubb generate`. `kubb --help` lists every command and the `generate` options.

## Commands

| Command | What it does |
| --- | --- |
| [`kubb init`](/docs/5.x/reference/commands/init) | Set up a config, install plugins, and run the first generation. |
| [`kubb generate [input]`](/docs/5.x/reference/commands/generate) | Generate code from `kubb.config.ts`. The default command. |
| [`kubb validate <input>`](/docs/5.x/reference/commands/validate) | Check a spec without generating. |
| [`kubb add [id]`](/docs/5.x/reference/commands/add) | Install a plugin, adapter, or parser from the registry. |
| [`kubb update [ids...]`](/docs/5.x/reference/commands/update) | Update installed extensions to the version the registry pins. |
| [`kubb list`](/docs/5.x/reference/commands/list) | List installed extensions and available updates. |
| [`kubb remove <id>`](/docs/5.x/reference/commands/remove) | Remove a plugin or parser from the config and uninstall it. |
| [`kubb studio [action]`](/docs/5.x/reference/commands/studio) | Connect the project to Kubb Studio. |
| [`kubb mcp`](/docs/5.x/reference/commands/mcp) | Start a Model Context Protocol server for AI clients. |

## Extension commands {#extension-commands}

`kubb add`, `kubb update`, `kubb list`, and `kubb remove` share these rules for the extensions you install from the [extension registry](/extensions).

### Registry ids {#ids}

- An id is `<owner>/<slug>`, such as `acme/plugin-graphql`.
- A bare `<slug>`, such as `plugin-zod`, means `kubb-labs/<slug>`.
- Both parts use lowercase letters and digits joined by single hyphens. Any other shape is an error.
- For an unknown id, the CLI prints `No extension named <id>` and up to three close ids.

### Versions and compatibility {#versions}

| Pinned to | Installs as |
| --- | --- |
| An npm version | `<package>@<version>` |
| A GitHub release | `github:<owner>/<repo>#<commit>` |

`add` and `update` refuse an extension that does not support your Kubb or Node.js version.

### Project files {#project-files}

| What | Where the commands find it |
| --- | --- |
| Installed extensions | `dependencies` and `devDependencies` in the `package.json` of the current folder. |
| Config file | `--config`, or the search in [How Kubb loads a config](/docs/5.x/reference/configuration#how-kubb-loads-a-config). With several config entries, `add` and `remove` edit the first one. |
| Package manager | The `packageManager` field in `package.json`, then a lockfile, else `npm`. Supports `npm`, `pnpm`, `yarn`, and `bun`. `add` and `update` install dev dependencies. |

## Global flags

| Flag | Alias | Default | What it does |
| --- | --- | --- | --- |
| `--help` | `-h` | `false` | Print the help of a command, such as `kubb add --help`. |
| `--version` | `-v` | `false` | Print the CLI version. |

## Environment variables

| Variable | Read by | What it does |
| --- | --- | --- |
| `KUBB_DISABLE_TELEMETRY` | every command | `1` or `true` turns off anonymous telemetry and its notice. |
| `DO_NOT_TRACK` | every command | Same as `KUBB_DISABLE_TELEMETRY`. |
| `KUBB_DEBUG` | every command | `1` or `true` turns on source maps in stack traces. Slows startup. |
| `CI` | every command | Any value except `false` or `0` marks a CI run: plain output, no update check, and no Studio pairing. `GITHUB_ACTIONS`, `GITLAB_CI`, and other provider variables count too. |
| `KUBB_HOME` | `generate`, `studio` | Folder for the update check and Studio credentials, worker state, and log. Default: `~/.kubb`. |
| `KUBB_REGISTRY` | `init`, `add`, `update`, `list`, `remove` | Registry base URL. Use `https://`, or `http://` only for `localhost`, `127.0.0.1` or `[::1]`. Default: `https://kubb.dev/registry`. |
| `KUBB_TOKEN` | `studio snapshot` | Organization CI API key, the default for `--token`. |
| `KUBB_AGENT_MAX_GENERATIONS` | `studio` | How many recent generations the agent keeps for Studio. Default: `8`. |
| `KUBB_AGENT_MAX_GENERATIONS_MB` | `studio` | Size cap in MB for those generations. Default: `100`. |

## Exit codes

Every command exits with `0` on success and `1` on failure. Each command page lists the cases that differ, such as a canceled prompt.
