---
'@kubb/cli': patch
---

Remove `KUBB_AGENT_TOKEN` from `kubb studio`. The CLI now connects only through a paired machine, and in CI you run `kubb studio snapshot` with `KUBB_TOKEN` instead.
