---
'@kubb/core': patch
---

Reject the v4 `input: { path }` / `input: { data }` wrapper with a `KUBB_LEGACY_INPUT` error.

v5 takes the `input` value directly, so the v4 wrapper matched the "already-parsed document" branch and Kubb read `{ path: './petStore.yaml' }` as the spec itself. The run then generated nothing but still reported success and exited `0`, which let a stale config pass CI with an empty client. The wrapper now fails with a message pointing at the unwrapped form.
