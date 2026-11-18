---
layout: doc
title: Publish Kubb snapshots with GitHub Actions
description: Add the kubb-labs/action workflow to publish a Kubb Studio snapshot on each pull request and compare generated files with the base branch and the previous run.
order: 3
navigation:
  title: GitHub Actions
  icon: i-simple-icons-githubactions
---

# Publish Kubb snapshots with GitHub Actions

The [kubb-labs/action](https://github.com/kubb-labs/action) publishes a Studio snapshot on each pull request. Its comment lists the generated files that changed against the base branch and the previous run. Meet the [prerequisites](/docs/5.x/integrations/ci#prerequisites) first: Kubb 5.6.2 or later, `tsdown`, and a CI key stored as `KUBB_TOKEN`.

## Add the workflow

Store `KUBB_TOKEN` as an Actions repository secret, then add this workflow:

```yaml [.github/workflows/kubb.yml]
name: Kubb snapshot

on:
  pull_request:
    # `closed` deletes the pull request's Studio agent. GitHub leaves it out by default.
    types: [opened, synchronize, reopened, closed]
  # Each pull request compares with a snapshot of its base branch, so list every branch pull requests target.
  push:
    branches: [main, 'release/**']

permissions:
  contents: write
  pull-requests: write

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: kubb-labs/action@v0
        with:
          token: ${{ secrets.KUBB_TOKEN }}
```

> [!NOTE]
> GitHub does not give secrets to workflows from fork pull requests, so the action skips the snapshot on those and logs why. Pull requests from branches in the repository get a snapshot.

| Permission | Lets the action |
| --- | --- |
| `pull-requests: write` | Post and update the snapshot comment. |
| `contents: write` | Open an initialization pull request when the repository has no Kubb config. Also turn on **Allow GitHub Actions to create and approve pull requests** under **Settings › Actions › General**. |

The [GitHub Action reference](/docs/5.x/reference/github-actions) lists inputs, outputs such as `tarball-url`, and runtime behavior.

To install a snapshot or read it in Studio, see [Review the snapshot](/docs/5.x/integrations/ci#review-the-snapshot) and [Install the snapshot](/docs/5.x/integrations/ci#install-the-snapshot).
