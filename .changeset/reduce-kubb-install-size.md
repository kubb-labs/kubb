---
"@kubb/cli": patch
"kubb": patch
---

Move `@kubb/agent` to an optional `peerDependency` to reduce the default install size. The CLI never imports it at runtime, since it exposes its own agent entry point. Install it explicitly when needed:

```bash
npm i @kubb/agent   # for the HTTP agent
```
