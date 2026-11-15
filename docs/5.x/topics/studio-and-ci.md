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

Details on `kubb studio` snapshots, Studio agents, and Kubb GitHub Action comments.

## CI snapshots {#studio-ci-snapshots}

In CI, `kubb studio snapshot` identifies the CI agent and compares the new snapshot with earlier ones. Sources: [Snapshot output](/docs/5.x/reference/commands/studio#snapshot-output) and [CI agent identity](/docs/5.x/reference/commands/studio#ci-agent-identity).

### JSON output

`--json` prints one object with `id`, `name`, `version`, `integrity`, `url`, `snapshotIdUrl`, `expiresAt`, and `agentUrl`.

- It adds `number` and `webUrl` when Studio sends them, and the summary shows the number and a `View` link.
- It adds `changes` and `branchChanges` when a comparison exists.
- Installing a snapshot needs a separate `registry` API key.

| Field | Compared with |
| --- | --- |
| `changes` | The previous snapshot on the same pull request or branch. |
| `branchChanges` | The latest snapshot of the `--base-id` agent, or of the base branch of a GitHub pull request or GitLab merge request. `branch` names that agent. `baseFound` is `false` when that agent does not exist yet, and `true` when it has no snapshot of this package. |

### CI agent identity

| Option | Default | Description |
| --- | --- | --- |
| `--id <id>` | Detected | Stable CI agent identity. Detected on GitHub Actions, GitLab CI, Bitbucket Pipelines, and CircleCI. |
| `--base-id <id>` | Detected | The `--id` of another CI agent to also compare with, such as the base branch's. Detected on GitHub pull requests and GitLab merge requests. |

- Other providers need a stable `--id`. Use one on the base branch and pass it as `--base-id` on pull request runs.
- `--id` turns off base detection, so also pass `--base-id` to get `branchChanges`.

### GitLab CI

| Pipeline | CI agent | Compared with |
| --- | --- | --- |
| Merge request | One agent per merge request | `branchChanges`: the target branch's latest snapshot. `changes`: the merge request's previous pipeline. |
| Branch | One agent per branch, the default branch included | `changes`: the branch's previous pipeline. |

A merge request snapshot records the head commit of the source branch. Pass `--id` to group runs your own way.

## Studio agent {#studio-agent}

When Studio lists a plugin as not installed, check where the agent looks. Studio builds its plugin list and option forms from [extension manifests](/docs/5.x/reference/kit/manifest). Source: [Plugins in Studio](/docs/5.x/reference/commands/studio#plugins-in-studio).

On connect, the agent reports each extension with a valid `kubb-extension.json` from:

- The `dependencies` and `devDependencies` in `package.json`.
- The packages `kubb.config.ts` imports.
- The extensions bundled with `kubb`: `@kubb/adapter-oas`, `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel`.

### Settings forms

- The config's adapter and parsers get a settings form from the `options` in their manifest.
- The agent sends a JSON copy of their options on connect. On generate, Studio's edits merge over the options in `kubb.config.ts`.
- A `null` value unsets an option for that run, so its default applies.
- An extension without a manifest, such as `parserTsx`, is listed without fields.

### Plugins the agent runs

| Agent | Plugins it can run |
| --- | --- |
| `kubb studio` on your machine | `@kubb/plugin-*` packages, and installed packages whose manifest has `kind: "plugin"` |
| Docker agent and hosted sandbox | Only the packages in their image, with no runtime installs |

The agent calls the factory the manifest names in `export`. It refuses any other package name before importing anything, and config edits follow the same rule.

Studio also lists [registry](/docs/5.x/reference/registry) plugins. One the agent cannot run shows as not installed, with a `kubb add <id>` hint.

## Studio credentials {#studio-credentials}

When you pair a machine, the CLI stores the credentials, worker state, and worker log in [`KUBB_HOME`](/docs/5.x/reference/commands#environment-variables), `~/.kubb` by default. `status` prints the log path. Source: [Credentials](/docs/5.x/reference/commands/studio#credentials).

- Approve the pairing code before it expires. The CLI copies it with `pbcopy`, `clip.exe`, `xclip`, or `wl-copy` when one is available.
- A connected CLI renews its token daily, so it does not pair again.
- Pairing also creates a key that never leaves your machine. It goes in the system keychain (macOS Keychain, Windows Credential Manager, or Secret Service on Linux), or next to the token when no keychain allows access, such as in CI or a container.
- A project paired with an earlier release has no key and keeps working. `kubb studio login` adds one.
- `stop` waits for a running generation to clean up. An interrupted job does not run again.

## Studio permissions {#studio-permissions}

These rules apply when you grant or revoke Studio permissions. Source: [Permissions](/docs/5.x/reference/commands/studio#permissions).

- `--allow-save-input` saves the spec Studio sends and points `input` at it. Grant `--allow-config-edit` too. A pasted document goes to `openapi.yaml`, or `openapi.json` for JSON (`openapi-<entry>` for a later config entry). A URL or git file goes into `input` as is.
- Without `--allow-read`, a session still generates and reports file paths, but Studio cannot show their contents.
- With `--allow-read`, Studio loads the files already in `output.path` on connect, so you can browse them before you select **Generate**.
- The agent keeps recent generations up to the [`KUBB_AGENT_MAX_GENERATIONS`](/docs/5.x/reference/commands#environment-variables) caps, with a separate budget for the initial output. Unchanged output keeps its ID across reconnects.

> [!WARNING]
> Flags only add permissions, and `login` resets the saved ones. To turn one off, run `kubb studio permissions`, then restart a running connection, since it keeps the old permissions. Restart with the same `--url` and `--config`, but without that permission's `--allow-*` flag, which would grant it again.

## GitHub Action runs {#github-action-runs}

These cases apply when the [Kubb GitHub Action](/docs/5.x/reference/github-actions) runs on a pull request. Sources: [Run flow](/docs/5.x/reference/github-actions#run-flow) and [Pull request comment](/docs/5.x/reference/github-actions#pull-request-comment).

- Deleting a closed pull request's agent is best effort. On failure the action logs a warning, and Studio's idle cleanup removes the agent later.
- When a `kubb/init-*` pull request is already open, the action stops without opening another.

### Pull request comment

The comment opens with the package name, version, and an `npm i <tarball-url>` command. Two sections then compare the generated files, each with a collapsed list of up to 50 files:

| Section | Compares with | Without a base |
| --- | --- | --- |
| Changes against the base branch | The base branch's latest snapshot, from the `push` trigger. The heading links its commit. | Says to run the workflow on pushes to the base branch |
| Changes since the previous snapshot | The pull request's previous snapshot. The heading links its commit, or shows its date. | Reports a first snapshot with its file count |

It ends with links to download the package and open the editor, the expiry date, and the source commit.
