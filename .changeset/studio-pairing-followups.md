---
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/studio': patch
---

`kubb studio` prints the agent ID once connected, and `kubb studio status` shows it, so an MCP client can pass it to `kubb_studio_generate` without reading the credentials file. A refused pairing code or a rejected agent token is reported as `KUBB_STUDIO_REFUSED` with what to do next, instead of `KUBB_UNKNOWN` with a stack trace. Without `--url`, `kubb studio` uses the Studio the project paired with.
