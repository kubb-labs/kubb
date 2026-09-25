---
'@kubb/cli': patch
---

`kubb studio snapshot` compares a GitLab merge request with its target branch, the same as a GitHub pull request with its base branch. It sends the id the target branch's pipelines register under as `baseId`, and the result carries `branchChanges`.
