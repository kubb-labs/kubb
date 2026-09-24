---
'@kubb/studio': patch
'@kubb/cli': patch
---

`kubb studio snapshot` compares a pull request with its base branch. A GitHub run on a branch now reuses one agent per branch (`gh:<repositoryId>:refs/heads/<branch>`) instead of a new one per run, a pull request passes that agent as `baseMachineToken`, and the result carries `branchChanges` next to `changes`. `--base-id` names the base agent when `--id` is custom. The commit sent for a pull request is its head commit, not the temporary merge commit, on GitHub and on GitLab merged results pipelines. With `--allow-read`, the result also carries `diskChanges`: what the run generated against the output directory on disk.
