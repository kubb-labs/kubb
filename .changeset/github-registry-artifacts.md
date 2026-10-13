---
'@kubb/core': patch
'@kubb/cli': patch
---

Registry entries can pin a GitHub release. `RegistryArtifact` adds `{ kind: 'github', package, version, owner, repo, tag, commit }`, and `isRegistryEntry` accepts it. `kubb add` and `kubb update` install it as `github:<owner>/<repo>#<commit>`.
