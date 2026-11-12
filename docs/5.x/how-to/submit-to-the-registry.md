---
layout: doc
title: Submit to the registry
description: Submit a Kubb plugin, adapter, or parser to the Kubb registry from
  npm or a GitHub release, get it reviewed, and ship new versions.
outline: [2, 3]
order: 8
navigation:
  title: Submit to the registry
  icon: i-iconoir-send-diagonal
---

# Submit to the registry

Submit a plugin, adapter, or parser to the Kubb registry to list it on [kubb.dev/extensions](/extensions) and in Kubb Studio. Users can then install it with `kubb add`. Each record pins one npm version or one GitHub release commit, and a maintainer reviews every version before users get it.

A package that already works in a `kubb.config.ts` needs a manifest, an overview, a published version, and a submission issue. To build the package first, follow [Publish a plugin](/docs/5.x/how-to/publish-a-plugin).

::steps{level="2"}

## Add the manifest

Create `kubb-extension.json` at the package root. Every field below except `$schema` is required:

```json [kubb-extension.json]
{
  "$schema": "https://kubb.dev/schemas/kubb-extension.json",
  "kind": "plugin",
  "name": "plugin-example",
  "export": "pluginExample",
  "displayName": "Example",
  "description": "Writes a comment with the HTTP method and path of every operation."
}
```

- `kind` is `plugin`, `adapter`, or `parser`.
- `name` is the extension's `meta.name`.
- `export` is the factory users call in `kubb.config.ts`, exported from the package entry point.

[Extension manifest](/docs/5.x/reference/kit/manifest) lists the optional fields, such as `compatibility`, `maintainers`, and the `options` Studio shows as a form.

## Add the overview

Create `docs/overview.md`. kubb.dev renders it as the extension's page:

```md [docs/overview.md]
# Example

Writes a comment with the HTTP method and path of every operation.

## Setup

Runs on its own and needs no other plugin.
```

Start with a `#` title and a one-paragraph description. Leave out install commands. Validation fails for an overview that contains one. [Extension docs](/docs/5.x/reference/kit/extension-docs) covers the optional `docs/options.md` and `docs/guides/`.

## Check `package.json`

Add these entries and keep the ones you already have:

```json [package.json fields]
{
  "files": ["dist", "kubb-extension.json", "docs"],
  "repository": { "type": "git", "url": "https://github.com/acme/kubb-plugin-example" },
  "peerDependencies": { "kubb": "^5.0.0" }
}
```

- `files` ships the manifest and the `docs/` folder.
- `repository` points to a GitHub repository you own, or one owned by an organization you belong to.
- `kubb` or `@kubb/core` is a peer dependency, not a bundled one.
- There is no `preinstall`, `install`, or `postinstall` script, or the overview explains what it does.

## Publish a version

:::tabs

::::tabs-item{label="npm"}

Set a version that npm does not have yet. Check that the tarball lists `kubb-extension.json` and the `docs/` files next to your build, then publish:

```shell [Terminal]
npm pack --dry-run
npm publish --access public
```

::::

::::tabs-item{label="GitHub release"}

A package that npm does not list can install from a GitHub release. `kubb add` then installs `github:<owner>/<repo>#<commit>`, and nothing builds on the user's machine. Validation checks these rules:

- The package sits at the repository root. A scoped name uses your GitHub owner, such as `@acme/` for `github.com/acme`.
- `dist/` is committed, and `files` in `package.json` lists it and `kubb-extension.json`.
- `main`, `module`, and `exports` point to committed files.
- There is no `build`, `prepack`, `prepare`, `prepublish`, `publish`, or install script, and no `workspaces`. Rename `build`, for example to `compile`.
- The release tag is the `package.json` version, such as `v1.0.0`.

Commit the manifest, the overview, and the build, then create a GitHub release from that commit.

::::

:::

## Open a submission issue

Open a [submission issue](https://github.com/kubb-labs/registry/issues/new?template=submit-extension.yml) on kubb-labs/registry. In **Source**, enter one of these:

| You have | Enter |
| --- | --- |
| An npm package (pins `latest`) | `kubb-plugin-example` |
| A specific npm version | `kubb-plugin-example@1.0.0` |
| An npm page | `https://www.npmjs.com/package/kubb-plugin-example` |
| A package on npm, by its folder in a GitHub monorepo | `https://github.com/acme/kubb-plugins/tree/main/packages/example` |
| A GitHub release, package not on npm | `https://github.com/acme/kubb-plugin-example/tree/v1.0.0` |

In **Categories**, tick every category that fits. The first tick is the main one.

Within minutes, a workflow opens a review pull request with the [record](/docs/5.x/reference/registry#records) and comments the link on your issue. If it reports a problem instead, fix it and edit the issue to run the submission again. Your id is `<owner>/<slug>`, such as `acme/kubb-plugin-example`. See [Registry ids](/docs/5.x/reference/registry#registry-ids) for the rules.

## Wait for the review {#review}

A maintainer reviews the pull request against [`REVIEW.md`](https://github.com/kubb-labs/registry/blob/main/REVIEW.md). Validation reads `kubb-extension.json` and the `docs/` folder from the npm tarball or the GitHub release. For a GitHub release, it also reads `package.json`.

After the pull request exists, editing the issue no longer starts the submission again. When a check fails or the maintainer asks for changes, publish a fixed version and reply in the pull request.

After a maintainer merges the pull request, the registry lists the extension within minutes. Users install it with:

```shell [Terminal]
kubb add acme/kubb-plugin-example
```

::

## Release a new version

Publishing a new version does not change what `kubb add` installs. Every Monday, a workflow opens a pull request that moves each pin to the latest npm version or GitHub release. After a maintainer reviews and merges it, users get the new version with [`kubb update`](/docs/5.x/reference/commands/update).
