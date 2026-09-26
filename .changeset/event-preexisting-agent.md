---
'@kubb/studio': patch
'@kubb/cli': patch
---

Fix `kubb studio snapshot` saying "No snapshot of `main` to compare with" even when a CI agent for the base branch already exists and simply has no snapshot of this package yet, such as a package newly added in the pull request. `branchChanges` now carries `baseFound`, and the summary line tells the two cases apart: "No snapshot of `main` to compare with" (no agent has run there) versus "No snapshot of `main` for this package yet" (the agent exists, this package is new to it).
