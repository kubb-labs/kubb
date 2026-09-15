---
'@kubb/cli': patch
'@kubb/studio': patch
---

Add `kubb studio snapshot` to generate and publish a Kubb Studio snapshot from any CI, not only GitHub Actions.

- Registers or reuses a CI agent, connects it, queues a snapshot job, and polls until the tarball is ready.
- Reads the organization CI API key from `--token` or `KUBB_TOKEN`.
- Detects the calling CI (GitHub Actions, GitLab CI, Bitbucket Pipelines, CircleCI) to reuse one agent per pull or merge request, or takes an explicit `--id` on any other CI.
- Prints a summary, or one JSON object with `--json` for a script to read.
- `@kubb/studio` now also exports `createAgent` and `machineTokenFrom`, so a host can register a CI agent without hand-rolling the request.

```shell
KUBB_TOKEN=$KUBB_TOKEN kubb studio snapshot --json
```
