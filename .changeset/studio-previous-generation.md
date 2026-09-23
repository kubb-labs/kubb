---
'@kubb/studio': patch
---

Let Studio diff a run against the one before it.

`GenerateResult` gains an optional `hashes` map with a content fingerprint per file, so Studio can tell
added, changed and unchanged files apart without reading them. The agent keeps the previous run next to
the latest one, copying it into memory first when it was written to disk (up to 50 MB), and
`readFiles` takes `generation: 'previous'` to read it back. Paths are still checked against what that
run produced.
