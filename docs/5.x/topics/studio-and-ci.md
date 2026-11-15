---
layout: doc
title: Studio and CI - Snapshots, agents, and credentials
description: How kubb studio snapshot compares CI runs, which plugins a Studio agent loads, where credentials and permissions live, and GitHub Action edge cases.
outline:
  - 2
  - 3
order: 12
navigation:
  title: Studio and CI
  icon: i-iconoir-git-merge
---

# Studio and CI

Use these details when a `kubb studio` snapshot, a Studio agent, or a Kubb GitHub Action comment needs explaining.

## CI snapshots {#studio-ci-snapshots}

When `kubb studio snapshot` runs in CI, it identifies the CI agent and compares the new snapshot with earlier ones. Sources: [Snapshot output](/docs/5.x/reference/commands/studio#snapshot-output) and [CI agent identity](/docs/5.x/reference/commands/studio#ci-agent-identity).

### JSON output

`--json` prints one object with `id`, `name`, `version`, `integrity`, `url`, `snapshotIdUrl`, `expiresAt`, and `agentUrl`.

- It adds `number` and `webUrl` when Studio sends them. The summary then shows the snapshot number and a `View` link.
- It adds `changes` and `branchChanges` when a comparison is available.
- Installing a snapshot needs a separate `registry` API key.

| Field | Compared with |
| --- | --- |
| `changes` | The previous snapshot on the same pull request or branch. |
| `branchChanges` | The latest snapshot of the agent named by `--base-id`, or of the base branch of a GitHub pull request or GitLab merge request. `branch` names that agent. `baseFound` tells a branch with no CI agent apart from one whose agent has no snapshot of this package yet. |

### CI agent identity

| Option | Default | Description |
| --- | --- | --- |
| `--id <id>` | Detected | Stable identity for the CI agent. Detected on GitHub Actions, GitLab CI, Bitbucket Pipelines, and CircleCI. |
| `--base-id <id>` | Detected | The `--id` of another CI agent, such as the base branch's, to also compare with. Detected on GitHub pull requests and GitLab merge requests. |

- Other providers need a stable `--id`.
- Use a stable `--id` on the base branch and pass it as `--base-id` on pull request runs.
- Passing `--id` turns off base detection, so also pass `--base-id` to get `branchChanges`.

### GitLab CI

| Pipeline | CI agent | Compared with |
| --- | --- | --- |
| Merge request | One agent per merge request | `branchChanges`: the target branch's latest snapshot. `changes`: the merge request's previous pipeline. |
| Branch | One agent per branch, so the default branch has one too | `changes`: the branch's previous pipeline. |

A merge request snapshot records the head commit of the source branch. Pass `--id` to group runs your own way.

## Studio agent {#studio-agent}

When Studio lists a plugin as not installed, check where the agent looks. Studio builds its plugin list and option forms from [extension manifests](/docs/5.x/reference/kit/manifest). Source: [Plugins in Studio](/docs/5.x/reference/commands/studio#plugins-in-studio).

On connect, the agent reports each extension that ships a valid `kubb-extension.json` and comes from one of these places:

- The `dependencies` and `devDependencies` in the project's `package.json`.
- The packages `kubb.config.ts` imports.
- The extensions that ship with `kubb`: `@kubb/adapter-oas`, `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel`.

### Settings forms

- The adapter and the parsers in the config get a settings form from the `options` in their manifest.
- The agent sends a JSON copy of their options on connect. Studio's edits on generate are merged over the options in `kubb.config.ts`.
- A `null` value unsets an option for that run, so the extension's default applies.
- An extension without a manifest, such as `parserTsx`, is listed without fields.

### Plugins the agent runs

The agent imports a plugin package only when it is a `@kubb/plugin-*` package, or an installed package whose manifest has `kind: "plugin"`. It calls the factory the manifest names in `export`. It refuses any other package name before it imports anything, and config edits follow the same rule.

| Agent | Plugins it can run |
| --- | --- |
| `kubb studio` on your machine | `@kubb/plugin-*` packages and installed plugins that ship a manifest. |
| Docker agent and hosted sandbox | Only the packages in their image. They install nothing at runtime. |

Studio also lists plugins from the [kubb.dev registry](/docs/5.x/reference/registry). A plugin the agent cannot run shows as not installed, with a `kubb add <id>` hint.

## Studio credentials {#studio-credentials}

When you pair a machine, the CLI stores what it needs in [`KUBB_HOME`](/docs/5.x/reference/commands#environment-variables), `~/.kubb` by default. That folder holds the credentials, the worker state, and the worker log, and `status` prints the log path. Source: [Credentials](/docs/5.x/reference/commands/studio#credentials).

- Approve the pairing code before it expires. The CLI copies it to the clipboard with `pbcopy`, `clip.exe`, `xclip`, or `wl-copy` when one is available.
- A connected CLI renews its token once a day, so it is not asked to pair again.
- Pairing also creates a key that never leaves your machine. It goes in the system keychain (macOS Keychain, Windows Credential Manager, or Secret Service on Linux), or next to the token when there is no keychain or it refuses access, such as in CI or a container.
- A project paired with an earlier release has no key and keeps working. `kubb studio login` adds one.
- `stop` waits for a running generation to clean up. An interrupted job does not run again.

## Studio permissions {#studio-permissions}

When you grant or revoke what Studio may do, these details apply. Source: [Permissions](/docs/5.x/reference/commands/studio#permissions).

- `--allow-save-input` saves the spec Studio sends and points `input` at it. A pasted document goes to `openapi.yaml`, or `openapi.json` for JSON (`openapi-<entry>` for a later config entry). A URL or git file is written to `input` as is. Grant `--allow-config-edit` too.
- Without `--allow-read`, a session still generates and reports file paths, but Studio cannot show their contents.
- With `--allow-read`, Studio loads the files already in `output.path` when it connects, so you can browse them before you select **Generate**.
- The agent keeps recent generations up to the [`KUBB_AGENT_MAX_GENERATIONS`](/docs/5.x/reference/commands#environment-variables) caps. The initial output has its own budget with the same caps, and unchanged output keeps its ID across reconnects.

> [!WARNING]
> Flags can only add permissions, and `login` resets the saved ones. To turn one off, run `kubb studio permissions`. A running connection keeps the old permissions until you restart it. Keep `--url` and `--config`, and leave out the `--allow-*` flag of the permission you turned off, since a flag grants it anyway.

## GitHub Action runs {#github-action-runs}

When the [Kubb GitHub Action](/docs/5.x/reference/github-actions) runs on a pull request, these cases apply. Sources: [Run flow](/docs/5.x/reference/github-actions#run-flow) and [Pull request comment](/docs/5.x/reference/github-actions#pull-request-comment).

- Deleting the agent of a closed pull request is best effort. On failure the action logs a warning, and Studio's idle cleanup removes the agent later.
- When a `kubb/init-*` pull request is already open, the action stops without opening another.

### Pull request comment

The comment opens with the package name and version and an `npm i <tarball-url>` command. Below that, two sections compare the generated files, each with a collapsed list of up to 50 files:

| Section | Compares with | Without a base |
| --- | --- | --- |
| Changes against the base branch | The latest snapshot of the pull request's base branch, from the `push` trigger. The heading links its commit. | Says to run the workflow on pushes to the base branch |
| Changes since the previous snapshot | The previous snapshot on the same pull request. The heading links its commit, or shows its date. | Reports a first snapshot with its file count |

The comment ends with links to download the package and open the editor, the expiry date, and the commit it was built from.
