---
'@kubb/core': patch
'@kubb/studio': patch
---

`checkoutGitInput` takes an `env` option with `GIT_CONFIG_*` variables for the git child process, and `GenerateInput` gains an optional `gitAuth` field that carries them. Studio uses it to send a short-lived `Authorization` header for a private repository to a managed agent, so no credential sits in the input URL or the container. Keys outside `GIT_CONFIG_*` are dropped, and an agent that predates the field ignores it.
