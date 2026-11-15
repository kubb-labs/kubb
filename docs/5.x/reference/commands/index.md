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
| [`kubb add [id]`](/docs/5.x/reference/commands/add) | Install an extension from the registry and add it to the config. |
| [`kubb update [ids...]`](/docs/5.x/reference/commands/update) | Move installed extensions to the version the registry pins. |
| [`kubb list`](/docs/5.x/reference/commands/list) | List installed extensions, their versions, and available updates. |
| [`kubb remove <id>`](/docs/5.x/reference/commands/remove) | Remove a plugin or parser from the config and uninstall it. |
| [`kubb studio [action]`](/docs/5.x/reference/commands/studio) | Connect the project to Kubb Studio, or manage its pairing and snapshots. |
| [`kubb mcp`](/docs/5.x/reference/commands/mcp) | Start a Model Context Protocol server for AI clients. |

## Extension commands {#extension-commands}

[`kubb add`](/docs/5.x/reference/commands/add), [`kubb update`](/docs/5.x/reference/commands/update), [`kubb list`](/docs/5.x/reference/commands/list), and [`kubb remove`](/docs/5.x/reference/commands/remove) manage the plugins, adapters, and parsers a project installs from the [Kubb registry](/docs/5.x/reference/registry). They share these rules.

### Registry ids {#ids}

An id is `<owner>/<slug>`, such as `acme/plugin-graphql`. A bare `<slug>`, such as `plugin-zod`, means `kubb-labs/<slug>`. Both parts use lowercase letters and digits joined by single hyphens. Another shape is an error.

When `add` or `remove` gets an id the registry does not list, it prints `No extension named <id>` and up to three close ids as commands to run. `add` also links to [kubb.dev/extensions](https://kubb.dev/extensions).

### Versions and compatibility {#versions}

| Pinned to | Installs as |
| --- | --- |
| An npm version | `<package>@<version>` |
| A GitHub release | `github:<owner>/<repo>#<commit>` |

`add` and `update` refuse an extension that does not support the running Kubb or Node.js version. The registry comes from [`KUBB_REGISTRY`](/docs/5.x/reference/commands#environment-variables), `https://kubb.dev/registry` by default.

### Project files {#project-files}

| What | How the commands find it |
| --- | --- |
| Installed extensions | The `dependencies` and `devDependencies` of the `package.json` in the current folder. |
| Config file | `--config`, or the first `.kubbrc` or `kubb.config` file (`.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`) in the current folder, its `.config/` and `configs/` folders, then each parent folder, the same search as `kubb generate`. With several config entries, `add` and `remove` edit the first one. |
| Package manager | The `packageManager` field in `package.json`, then a lockfile, in the current folder. Falls back to `npm`. `npm`, `pnpm`, `yarn`, and `bun` are supported. `add` and `update` install packages as dev dependencies. |

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
