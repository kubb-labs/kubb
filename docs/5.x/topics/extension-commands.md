---
layout: doc
title: Extension commands - Output, registry, config edits
description: Read what kubb add, update, list, and remove print, how the CLI reads the registry index, when it cannot edit the config, and how kubb init finds a spec.
outline:
  - 2
  - 3
order: 9
navigation:
  title: Extension commands
  icon: i-iconoir-plus-circle
---

# Extension commands

What `kubb add`, `kubb update`, `kubb list`, `kubb remove`, and `kubb init` print, and the rules behind them.

## Extension command output {#extension-command-output}

When an extension command finishes, its summary gives the outcome. See [Extension commands](/docs/5.x/reference/commands#extension-commands).

### kubb add

After the install, the summary lists the packages, the added calls, the next step (`kubb generate`), and the extension's options page. Its title gives the outcome. Source: [Preview and summary](/docs/5.x/reference/commands/add#add-preview).

| Summary title | When |
| --- | --- |
| `Plugin ready` | Installed and added to the config. |
| `Plugin configured` | Added to the config with `--no-install`. |
| `Plugin already configured` | The plugin was already in the config. |
| `Plugin needs configuration` | Installed, but the config needs a manual change. The CLI prints the snippet. |
| `Plugin configured; dependencies missing` | Added without the required plugins you declined. |

Adapters and parsers say `Adapter` and `Parser` instead, except in `Plugin configured; dependencies missing`, which every kind uses.

Without an id, `kubb add` lists the registry. An installed extension shows `installed` and cannot be picked.

### kubb update

After the install, `kubb update` finds the config like [`kubb generate`](/docs/5.x/reference/commands/generate) and asks whether to regenerate, since that rewrites the generated files. The summary lists installed and skipped packages and changed files. Source: [Pick the updates](/docs/5.x/reference/commands/update#update-scope).

| Case | Result |
| --- | --- |
| An update does not support your Kubb or Node.js version | Skipped with `Skipped <id>: <reason>`. |
| A named id matches no installed extension | `<id> is not installed, or not in the registry.` Other ids still update, and the exit code is 1. |
| Nothing is outdated | The summary says `Already up to date`. |
| The generation after the install fails | The summary says `Extensions updated; generation failed`, and the exit code stays 0. |

### kubb list

`kubb list` shows each `package.json` package that ships a valid [`kubb-extension.json`](/docs/5.x/reference/kit/manifest) or is in the registry. Source: [kubb list](/docs/5.x/reference/commands/list).

- Extensions bundled with `kubb`, such as `@kubb/adapter-oas` and `@kubb/plugin-barrel`, appear only when `package.json` lists them.
- When the registry cannot be read, it prints `Showing installed extensions only: <reason>` and lists the packages that ship a manifest.
- When it finds nothing, it prints `No installed extensions found.`

### kubb remove

`kubb remove` removes the call, also one Kubb Studio switched off, and drops the unused import. Source: [What it removes](/docs/5.x/reference/commands/remove#what-it-removes).

- It leaves the plugin's generated files on disk. With [`output.clean`](/docs/5.x/reference/configuration#outputclean), the next `kubb generate` removes them.
- It refuses an adapter, such as `@kubb/adapter-oas`, because a config needs one. Change the adapter in the config by hand.
- `@kubb/parser-ts`, `@kubb/parser-md`, and `@kubb/plugin-barrel` ship with `kubb`. They leave the config but stay installed.
- A package that another config entry still imports also stays installed.
- Only plugins that run count as dependents. A plugin Studio switched off does not block the removal.
- When the extension is not in the project, nothing changes and the exit code is 0.

## Registry client rules {#registry-client-rules}

When `kubb add` misses an extension, or you host your own registry, these rules decide what the CLI reads. Sources: [Index](/docs/5.x/reference/registry#index) and [Host your own registry](/docs/5.x/reference/registry#host-your-own-registry).

### Index entries

A client rejects an index whose `version` is not `1`, skips entries with an unknown `artifact.kind`, and ignores unknown keys. The CLI also skips an entry when:

- `manifest.compatibility` has a key other than `kubb` or `node`.
- A `manifest.maintainers` item has a key other than `name` or `github`.
- `id` is not a full `<owner>/<slug>`.
- `artifact` does not pin an exact semver version.
- `manifest` is not valid with the entry's `kind`.

An official version from before manifests has none, so the index leaves it out until a version with a manifest is pinned.

### Detail documents

- Read a missing `options` as `null` and a missing `guides` as `[]`, since older registries leave them out.
- `overview` is `docs/overview.md`, else a root `OVERVIEW.md` in npm versions older than `docs/`, else the reviewer's overview, or `null`.
- `repository` (`{ url: string }`) is the source on GitHub. An npm artifact may point at the package folder, and a GitHub artifact uses the repository root.

### Ids the registry does not list

`kubb add` looks ids up in the index, never in a detail document. For an id the index does not list, `add` and `remove` print `No extension named <id>` and up to three close ids as commands to run. `add` also links to [kubb.dev/extensions](https://kubb.dev/extensions).

### Your own registry

With `KUBB_REGISTRY=https://registry.example.com kubb add acme/plugin-graphql`, the CLI looks up `acme/plugin-graphql` in `https://registry.example.com/index.json`. `KUBB_REGISTRY` must start with `http://` or `https://`, and trailing slashes are removed.

## Config edits {#config-edits}

When `kubb add` cannot write the extension into the config, it prints a snippet. Add its import and call to the config, then run `kubb generate`. Source: [Config changes](/docs/5.x/reference/commands/add#add-config).

- An extension already in its array is left alone.
- The config cannot be edited when `plugins` is not an array literal, or the export name is already imported from another module. The CLI then prints `Could not edit <file>: <reason>` and the snippet, and exits with code 1.
- An adapter is never written, so its manual snippet does not set exit code 1.

## Spec detection in kubb init {#init-spec-detection}

On start, `kubb init` detects the package manager and looks for a spec. Source: [Detect the project](/docs/5.x/reference/commands/init#detect-the-project).

- It reads the package manager (`npm`, `pnpm`, `yarn`, or `bun`) from the `packageManager` field or a lockfile, else `npm`.
- Without a `package.json`, it offers to create one.
- It looks up to three folders deep for `openapi*` or `swagger*` files ending in `.yaml`, `.yml`, or `.json`.
- It skips `node_modules`, `dist`, `build`, `coverage`, and hidden folders.
- It shows the version and operation count of the first one.

For a spec with another name or a deeper path, pass it with [`--input`](/docs/5.x/reference/commands/init#options).

## Registry checks {#registry-checks}

When the registry reviews a version you submit, it reads `kubb-extension.json` and `docs/` from the npm tarball or GitHub release, plus `package.json` for a GitHub release. Ship these files before you submit. Source: [Review](/docs/5.x/how-to/publish-a-plugin#review).

See [Check the tarball](/docs/5.x/how-to/publish-a-plugin#check-the-tarball) and [Manifest validation](/docs/5.x/topics/extension-manifests#manifest-validation).
