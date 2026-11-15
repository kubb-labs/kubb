---
layout: doc
title: Publish Kubb snapshots with GitLab CI
description: Add a GitLab CI job that runs kubb studio snapshot on each merge request and compares the generated files with the target branch and the previous pipeline.
order: 4
navigation:
  title: GitLab CI
  icon: i-simple-icons-gitlab
---

# Publish Kubb snapshots with GitLab CI

A GitLab job runs `kubb studio snapshot` on each merge request and on the default branch. Meet the [prerequisites](/docs/5.x/integrations/ci#prerequisites) first: Kubb 5.6.2 or later, `tsdown`, and a CI key stored as `KUBB_TOKEN`.

## Add the job

Store `KUBB_TOKEN` as a masked and **Protected** CI/CD variable, so only pipelines for protected branches get it. Commit your npm lockfile, so `npm ci` is the only setup:

```yaml [.gitlab-ci.yml]
snapshot:
  stage: build
  image: node:22
  script:
    - npm ci
    - '[ -z "$KUBB_TOKEN" ] || npx kubb studio snapshot'
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

The `rules` run the job on merge requests and on the default branch, so a merge request has a target branch snapshot to compare with. A pipeline without the key, such as one for an unprotected branch, skips the snapshot.

To post the result as a merge request note, save the `--json` output and run the script below. It updates one note per merge request and needs only Node:

```yaml [.gitlab-ci.yml]
  script:
    - npm ci
    - '[ -z "$KUBB_TOKEN" ] || npx kubb studio snapshot --json > snapshot.json'
    - '[ -z "$CI_MERGE_REQUEST_IID" ] || [ ! -f snapshot.json ] || [ -z "$GITLAB_API_TOKEN" ] || node scripts/kubb-note.mjs'
```

> [!IMPORTANT]
> Writing a note needs a project access token with the `api` scope, stored as `GITLAB_API_TOKEN`. `CI_JOB_TOKEN` does not carry that scope.
>
> Masking only hides the value in job logs: any code the job runs can read it, including install scripts that `npm ci` runs. Mark `GITLAB_API_TOKEN` as **Protected** too, like `KUBB_TOKEN` ([merge request pipelines have extra conditions](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/)). The script lines above skip the snapshot and the note when a token is missing. Give the token the lowest role that can comment on merge requests, such as Reporter, and an expiry date.

::code-collapse{name="scripts/kubb-note.mjs"}

```js [scripts/kubb-note.mjs]
import { readFileSync } from 'node:fs'

const snapshot = JSON.parse(readFileSync('snapshot.json', 'utf8'))
const marker = '<!-- kubb-snapshot -->'
const counts = (c) => `${c.added.length} added · ${c.changed.length} changed · ${c.removed.length} removed`
const lines = [marker, `Kubb snapshot: \`npm i ${snapshot.url}\``]

const { branchChanges: branch, changes } = snapshot
if (branch) {
  if (branch.base) lines.push(`Changes against \`${branch.branch}\`: ${counts(branch)}`)
  else if (branch.baseFound) lines.push(`No snapshot of \`${branch.branch}\` for this package yet`)
  else lines.push(`No snapshot of \`${branch.branch}\` to compare with`)
}
if (changes?.base) lines.push(`Changes since ${changes.base.commit?.slice(0, 7) ?? changes.base.createdAt}: ${counts(changes)}`)

const { CI_API_V4_URL, CI_PROJECT_ID, CI_MERGE_REQUEST_IID, GITLAB_API_TOKEN } = process.env
const notes = `${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes`
const headers = { 'PRIVATE-TOKEN': GITLAB_API_TOKEN, 'Content-Type': 'application/json' }
const existing = (await (await fetch(`${notes}?per_page=100`, { headers })).json()).find((note) => note.body.startsWith(marker))
const response = await fetch(existing ? `${notes}/${existing.id}` : notes, {
  method: existing ? 'PUT' : 'POST',
  headers,
  body: JSON.stringify({ body: lines.join('\n\n') }),
})
if (!response.ok) throw new Error(`GitLab answered ${response.status}`)
```

::

To install a snapshot or read it in Studio, see [Review the snapshot](/docs/5.x/integrations/ci#review-the-snapshot) and [Install the snapshot](/docs/5.x/integrations/ci#install-the-snapshot).
