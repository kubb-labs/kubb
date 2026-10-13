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

Submit an extension to the Kubb registry so it shows up on [kubb.dev/extensions](/extensions) and in Kubb Studio, and users can install it with `kubb add`. Each record pins one npm version or one GitHub release commit, and a maintainer reviews every version before users get it.

## Before you submit

The package ships a [`kubb-extension.json`](/docs/5.x/reference/kit/manifest) and a [`docs/` folder](/docs/5.x/reference/kit/extension-docs) at its root. [Publish a plugin](/docs/5.x/how-to/publish-a-plugin) walks through building and publishing one to npm.

### Publish from a GitHub release instead

A package that npm does not list can install from a GitHub release. `kubb add` then installs `github:<owner>/<repo>#<commit>`, and nothing builds on the user's machine. Validation checks these rules:

- The package sits at the repository root. A scoped name uses your GitHub owner, such as `@acme/` for `github.com/acme`.
- `dist/` is committed, and `files` in `package.json` lists it and `kubb-extension.json`.
- `main`, `module`, and `exports` point to committed files.
- There is no `build`, `prepack`, `prepare`, `prepublish`, `publish`, or install script, and no `workspaces`. Rename `build`, for example to `compile`.
- The release tag is the `package.json` version, such as `v1.0.0`.

## Open a submission issue

Open a [submission issue](https://github.com/kubb-labs/registry/issues/new?template=submit-extension.yml) on kubb-labs/registry:

- In **Source**, paste the npm package name, optionally with a version such as `kubb-plugin-example@1.0.0`. Without a version, the registry pins npm `latest`. For a GitHub release, paste the repository URL, optionally with the tag: `https://github.com/acme/kubb-plugin-example/tree/v1.0.0`. Without a tag, the registry pins the latest release.
- In **Categories**, tick every category that fits. The first tick is the main one.

A workflow opens a review pull request with the [record](/docs/5.x/reference/registry#records) and comments the link on your issue. Your id is `<owner>/<slug>`, such as `acme/kubb-plugin-example`. See [Registry ids](/docs/5.x/reference/registry#registry-ids) for the rules. Until the review pull request exists, editing the issue starts the submission again.

## Review

A maintainer reviews the pull request against [`REVIEW.md`](https://github.com/kubb-labs/registry/blob/main/REVIEW.md). Validation reads `package.json`, `kubb-extension.json`, and the `docs/` folder from the npm tarball or the GitHub release, and never installs or runs your extension. When the package ships no `docs/overview.md`, the reviewer writes an overview in the registry.

After a maintainer merges the pull request, the registry lists it within minutes. Users install it with:

```shell [Terminal]
kubb add acme/kubb-plugin-example
```

## Release a new version

Publishing a new version does not change what `kubb add` installs. Every Monday, a workflow opens a pull request that moves each pin to the latest npm version or GitHub release. After a maintainer reviews and merges it, users get the new version with [`kubb update`](/docs/5.x/reference/commands/update).
