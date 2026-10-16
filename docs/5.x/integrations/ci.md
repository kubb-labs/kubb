---
layout: doc
title: Publish snapshots from CI
description: Publish installable Kubb Studio snapshots from GitHub Actions,
  GitLab CI, or any other provider and review generated-file changes.
outline:
  - 2
  - 3
order: 2
navigation:
  title: CI snapshots
  icon: i-iconoir-git-merge
---

# Publish snapshots from CI

`kubb studio snapshot` generates a package on a CI runner, uploads it to [Studio](/docs/5.x/integrations/studio) in one request, and exits. Run it on pull or merge requests and on the default branch so reviewers can compare their output.

## Supported providers

| Provider | Agent identity | Guide |
| --- | --- | --- |
| GitHub Actions | Detected | [Publish snapshots with GitHub Actions](/docs/5.x/integrations/github-actions) |
| GitLab CI | Detected | [Publish snapshots with GitLab CI](/docs/5.x/integrations/gitlab) |
| Bitbucket Pipelines, CircleCI | Detected. Pass `--base-id` to compare with a branch | Run `kubb studio snapshot` with `KUBB_TOKEN` set |
| Other | Pass `--id` and `--base-id` | See below |

Every provider needs an organization CI API key stored as `KUBB_TOKEN`. Snapshot installation uses a separate `registry` API key. Create both in Studio under Settings › Developers › Tokens.

> [!NOTE]
> Snapshots expire after seven days. Schedule a default-branch run if it can go a week without a push.

## Other CI providers

For a provider without automatic agent identification, use a stable `--id` on the base branch and pass it as `--base-id` on pull request runs:

```shell [Terminal]
kubb studio snapshot --id jenkins:api:main                              # on main
kubb studio snapshot --id jenkins:api:pr-12 --base-id jenkins:api:main  # on a pull request
```

Use `kubb studio snapshot --json | jq -r '.url'` to pass the tarball URL to another step. See [CI agent identity](/docs/5.x/reference/commands/studio#ci-agent-identity) and [Snapshot output](/docs/5.x/reference/commands/studio#snapshot-output) for the result fields.

## Install the snapshot

Configure the registry API key, then run the install command from the snapshot result:

```ini [.npmrc]
//kubb.studio/:_authToken=${KUBB_REGISTRY_TOKEN}
```

```shell [Terminal]
npm i https://kubb.studio/packages/<agent>/<package>.tgz
```

pnpm and Yarn install the same URL with the same `.npmrc`. Yarn 1 also needs the registry for the package's scope, or the install fails with HTTP 403:

```ini [.npmrc]
@<scope>:registry=https://kubb.studio/
```
