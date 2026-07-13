---
'@kubb/cli': patch
'kubb': patch
---

Accept the spec as a positional argument on `kubb validate`, matching `kubb generate`.

`kubb validate` took the spec through the `--input`/`-i` flag, while `kubb generate` already read it as a positional argument. The two commands now share the same shape, so `kubb validate ./openapi.yaml` replaces `kubb validate --input ./openapi.yaml`. The argument stays required, and both local paths and URLs still work.
