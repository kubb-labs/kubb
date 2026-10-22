---
'@kubb/core': patch
'@kubb/studio': patch
---

`checkoutGitInput` takes an `authorization` option, a one-line header value that git sends to the input's origin for that fetch only, through `GIT_CONFIG_*` variables added after the host's own. `GenerateInput` gains an optional `gitAuth: { authorization }` field that carries it. Studio uses it to send a short-lived header for a private repository to a managed agent, so no credential sits in the input URL or the container. A failed git checkout on a managed agent now keeps the `KUBB_GIT_INPUT_FAILED` code, so Studio can tell it apart from a failed generation, and an agent that predates the field ignores it.
