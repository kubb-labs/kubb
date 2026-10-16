---
layout: doc
title: GitHub Actions
description: Inputs, outputs, runtime selection, and snapshot comments for kubb-labs/action.
outline: [2, 3]
order: 8
navigation:
  title: GitHub Actions
  icon: i-simple-icons-githubactions
---

# GitHub Actions

The `kubb-labs/action@v0` action generates and publishes a Studio snapshot. See [Publish snapshots from CI](/docs/5.x/integrations/github-actions) for a workflow.

## Inputs

| Input               | Default               | Description                                                             |
| ------------------- | --------------------- | ----------------------------------------------------------------------- |
| `token`             |                       | Organization CI API key. Required.                                      |
| `github-token`      | <code v-pre>${{ github.token }}</code> | Token that opens the init pull request and writes the snapshot comment. |
| `working-directory` | `.`                   | Directory holding the Kubb config and the package.                      |
| `config`            | `kubb.config.ts`      | Path to the config file, relative to `working-directory`.               |

## Outputs

| Output            | Description                                  |
| ----------------- | -------------------------------------------- |
| `snapshot-id`     | ID Studio stored the snapshot under.         |
| `package-name`    | Name of the generated package.               |
| `package-version` | Version of the generated package.            |
| `tarball-url`     | URL of the generated tarball.                |
| `integrity`       | SHA-512 integrity of the tarball.            |
| `agent-url`       | Studio URL of the CI agent that holds the snapshot. |
| `files-added`, `files-changed`, `files-removed` | Generated files added, changed, and removed since the previous snapshot on the pull request. |

## Kubb version

The action runs `kubb studio snapshot` with the Kubb version installed in the repository, so the snapshot matches the version your config and plugins are built against. A local install must be Kubb 5.6.2 or later. Without one, the action uses the latest Kubb 5 release.

## Pull requests and branches

Each pull request reuses one CI agent and one comment. Each branch reuses one CI agent and gets no comment. The action also:

- Skips pull requests from forks, because GitHub hides secrets from them.
- Deletes the pull request's CI agent when the pull request closes.
- Opens a `kubb/init-*` pull request and stops when the config file is missing.

## What the comment shows

Below the install command, the comment lists which generated files changed:

| Section | Compared with |
| --- | --- |
| Changes against `main` | The latest snapshot of the base branch, from the `push` trigger. The heading links its commit. |
| Changes since the previous snapshot | The previous snapshot on the same pull request. The heading links its commit, or shows its date. |

A failed snapshot shows its error in the comment.

## Environment variables

| Variable          | Default               | Description                               |
| ----------------- | --------------------- | ----------------------------------------- |
| `KUBB_STUDIO_URL` | `https://kubb.studio` | Studio URL for a self-hosted deployment.  |
