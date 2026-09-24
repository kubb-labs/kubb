---
'@kubb/studio': patch
'@kubb/cli': patch
---

`kubb studio snapshot` compares a GitHub pull request with its base branch. Branch runs reuse one agent per branch instead of one per run, a pull request passes that agent's id as `baseId`, and the result carries `branchChanges`. The commit sent for a pull request is its head commit, not the merge commit.
