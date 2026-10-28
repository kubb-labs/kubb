---
layout: doc
title: kubb studio
description: Command reference for connecting a project to Kubb Studio, managing
  pairing and permissions, and publishing CI snapshots.
outline:
  - 2
  - 3
order: 5
navigation:
  title: kubb studio
  icon: i-iconoir-cube
---

# kubb studio

Run `kubb studio` to connect a project to [Kubb Studio](https://kubb.studio). The CLI runs generation on your machine and sends progress and generated file paths to Studio. Grant `--allow-read` to view generated file contents and diffs in the browser, and `--allow-read-ast` to share the parsed spec.

## Usage

Connect the current project. On the first run, open the pairing page and approve the code the CLI shows before it expires. The CLI copies the code to the clipboard when `pbcopy`, `xclip`, or `clip.exe` is available. It then asks which permissions to grant for this project in one list, with the two read permissions checked.

While connected, the CLI logs each job Studio runs on one line: the time, the command, who asked for it, and the result. The job's own steps and diagnostics stay in Studio. Press `b` to move the session to the background worker, the same as `kubb studio start`.

```shell [Terminal]
kubb studio
```

## Actions

The positional argument selects the action. It defaults to `connect`.

| Action        | Description                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect`     | Hold a foreground session open and generate on request.                                                                                        |
| `start`       | Resolve pairing and permissions, then connect this project in the background.                                                                  |
| `stop`        | Stop the background worker and keep its pairing.                                                                                               |
| `login`       | Pair this machine again without opening a generation session. Saved permissions reset.                                                         |
| `logout`      | Stop the background worker and forget this project's stored token.                                                                             |
| `status`      | Show pairing, worker state and uptime, saved permissions, and the log path, each with the command that changes it.                             |
| `permissions` | Change this project's saved permissions in the same list `connect` shows, without pairing again.                                               |
| `snapshot`    | Generate and pack a snapshot on this machine, upload it in one request, then exit. See [Publish snapshots from CI](/docs/5.x/integrations/ci). |

## Background connection

Run `start`, `status`, and `stop` from the same project directory. `start` resolves pairing and permission prompts before detaching, then returns while the worker connects.

`status` reports `starting`, `connected`, `reconnecting`, `authentication required`, or `stopped`. Only one worker can own a project. Stop it before using foreground `connect`.

The worker survives terminal closure and retries temporary connection failures. Restart it after a crash or reboot. If its token is rejected, run `kubb studio login`, then `kubb studio start`. To change its URL or config, stop it and start it with the new flags. Flags can only add permissions. To change the saved ones, run `kubb studio permissions`, then restart the worker. `login` resets them.

The CLI keeps credentials, worker state, and the worker log in `KUBB_HOME`, which defaults to `~/.kubb`. `status` prints the log path. `stop` waits for a running generation to clean up, and `logout` stops the worker before it removes credentials. An interrupted job does not run again.

## Options

| Option                                      | Default               | Description                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--config=<path>`, `-c <path>`              |                       | Path to a config file, such as `./kubb.staging.ts`.                                                                                                                                                                                                                                 |
| `--url=<url>`                               | `https://kubb.studio` | URL for Kubb Studio. Plain `http://` works only for `localhost`, `127.0.0.1`, or `[::1]`.                                                                                                                                                                                           |
| `--allow-read`                              | `false`               | Let Studio read generated file contents. Asked once per project when omitted.                                                                                                                                                                                                       |
| `--allow-read-ast`                          | `false`               | Let Studio read the parsed spec (the Kubb AST). Asked once per project when omitted.                                                                                                                                                                                                |
| `--allow-write`                             | `false`               | Write generated files to disk. Asked once per project when omitted.                                                                                                                                                                                                                 |
| `--allow-config-edit`                       | `false`               | Let Studio change plugin options in `kubb.config.ts`. Asked once per project.                                                                                                                                                                                                       |
| `--allow-install`                           | `false`               | Let Studio install extensions from the registry with `kubb add`, which also edits the config, so grant `--allow-config-edit` too. Asked once per project.                                                                                                                           |
| `--allow-update`                            | `false`               | Let Studio update installed extensions with `kubb update`. It leaves the config alone. Asked once per project.                                                                                                                                                                      |
| `--allow-remove`                            | `false`               | Let Studio remove extensions with `kubb remove`. Needs `--allow-config-edit` too. Asked once per project.                                                                                                                                                                           |
| `--allow-save-input`                        | `false`               | Let Studio save the spec it sends: a pasted document goes to `openapi.yaml`, or `openapi.json` when it is JSON (`openapi-<entry>` for a later config entry), and `input` in the config points to it, a URL, or a git file. Grant `--allow-config-edit` too. Asked once per project. |
| `--allow-exec`                              | `false`               | Run the formatter, the linter, and `output.postGenerate`. Asked once per project.                                                                                                                                                                                                   |
| `--no-open`                                 |                       | Do not open the approval page in a browser.                                                                                                                                                                                                                                         |
| `--log-level=<silent\|info\|verbose>`, `-l` | `info`                | Set the verbosity.                                                                                                                                                                                                                                                                  |
| `--token=<key>`                             |                       | `snapshot` only: organization CI API key. Defaults to `KUBB_TOKEN`.                                                                                                                                                                                                                 |
| `--id=<id>`                                 |                       | `snapshot` only: stable identity for the CI agent. Auto-detected on GitHub Actions, GitLab CI, Bitbucket Pipelines and CircleCI.                                                                                                                                                    |
| `--base-id=<id>`                            |                       | `snapshot` only: the `--id` of another CI agent, such as the base branch's, to also compare with. Auto-detected on GitHub pull requests and GitLab merge requests.                                                                                                                  |
| `--name=<name>`                             |                       | `snapshot` only: package name for the tarball. Defaults to the name in the nearest `package.json` that has a name and a version.                                                                                                                                                    |
| `--package-version=<version>`               |                       | `snapshot` only: package version for the tarball. Defaults to the version in the nearest `package.json` that has a name and a version.                                                                                                                                              |
| `--json`                                    | `false`               | `snapshot` only: print the result as one JSON object instead of a summary.                                                                                                                                                                                                          |

`snapshot` takes no `--allow-*` flag. It generates like `kubb generate`: it writes to `output.path`, then runs the formatter, the linter, and `output.postGenerate`. It refuses a tarball over 50 MB. It needs `tsdown` installed in the project to build the package's `dist` files: run `npm i -D tsdown`.

Without `--allow-read`, a session still generates and reports file paths, but Studio cannot display their contents. The CLI asks about permissions not supplied as flags and remembers answers per project directory. Without a TTY it skips the permission prompts, so pass the flags the run needs. In CI it also refuses to pair and needs stored credentials, so use `snapshot` there instead.

With `--allow-read`, Studio loads the files already in `output.path` when it connects. You can browse them before generating. Select **Generate** when you want to regenerate the output.

Each action exits with code 1 when it fails.

## Environment variables

| Variable                        | Description                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `KUBB_HOME`                     | Directory the CLI keeps its Studio state in. Defaults to `~/.kubb`.              |
| `KUBB_TOKEN`                    | `snapshot` only: organization CI API key. Same as `--token`.                     |
| `KUBB_AGENT_MAX_GENERATIONS`    | How many recent generations the agent keeps for Studio to read. Defaults to `8`. |
| `KUBB_AGENT_MAX_GENERATIONS_MB` | Size cap in MB for the kept generations. Defaults to `100`.                      |

Initial disk output has a separate retention budget with the same count and size caps as generated runs. Unchanged output reuses its retained ID across reconnects.

## Snapshot output

`--json` prints one JSON object with `id`, `name`, `version`, `integrity`, `url`, `snapshotIdUrl`, `expiresAt`, and `agentUrl`. It also includes `number` and `webUrl` when Studio sends them, and the summary then shows the snapshot number and a `View` link. It also includes `changes` and `branchChanges` when comparisons are available. Installing a snapshot requires a separate `registry` API key.

| JSON field      | Compared with                                                                                                                                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `changes`       | The previous snapshot on the same pull request or branch.                                                                                                                                                                                                                                                   |
| `branchChanges` | The latest snapshot of the agent named by `--base-id`, or of the base branch detected on a GitHub pull request or GitLab merge request. Its `branch` field names that agent. Its `baseFound` field distinguishes a branch with no CI agent from one with an agent that has no snapshot of this package yet. |

## CI agent identity

`snapshot` detects GitHub Actions, GitLab CI, Bitbucket Pipelines, and CircleCI. Other providers require a stable `--id`. Use a stable `--id` on the base branch and pass that identity as `--base-id` on pull request runs. Passing `--id` turns off base detection, so also pass `--base-id` to get `branchChanges`.

### GitLab CI

Every pipeline on a merge request publishes to one CI agent. A branch pipeline publishes to one agent per branch, so the default branch has one agent too. Pass `--id` to group runs your own way.

A merge request pipeline compares with its target branch. The snapshot reports which generated files changed against that branch's latest snapshot in `branchChanges`, and against the merge request's previous pipeline in `changes`. The commit it records is the head of the source branch.

## Plugins in Studio {#plugins-in-studio}

Studio builds its plugin list and option forms from [extension manifests](/docs/5.x/reference/kit/manifest). When Studio connects, the agent reports each extension that is installed in the project, ships a valid `kubb-extension.json`, and comes from one of these places:

- The `dependencies` and `devDependencies` in the project's `package.json`.
- The packages `kubb.config.ts` imports.
- The extensions that ship with `kubb`: `@kubb/adapter-oas`, `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel`.

A third-party plugin works in Studio once it is installed in the project and ships a manifest with `kind: "plugin"`. It needs no registry entry. Install it with [`kubb add`](/docs/5.x/reference/commands/add) or your package manager, then reconnect so Studio sees it.

The adapter and the parsers the config registers get a settings form the same way, from the `options` in their manifest. The agent reports them on connect with a JSON copy of their options, and the edits Studio sends on generate are merged over the options in `kubb.config.ts`. A `null` value unsets an option for that run, so the extension's default applies. An extension without a manifest, such as `parserTsx`, is listed without fields.

The agent imports a plugin package only when it is a `@kubb/plugin-*` package, or an installed package whose manifest has `kind: "plugin"`. It calls the factory the manifest names in `export`. The agent refuses any other package name before it imports anything, and config edits follow the same rule.

| Agent                           | Plugins it can run                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `kubb studio` on your machine   | `@kubb/plugin-*` packages and plugins installed in the project that ship a manifest. |
| Docker agent and hosted sandbox | Only the packages installed in their image. They install nothing at runtime.         |

Studio also lists plugins from the [kubb.dev registry](/docs/5.x/reference/registry). A plugin that the agent cannot run shows as not installed, with a `kubb add <id>` hint to install it.
