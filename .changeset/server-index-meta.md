---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

Add `serverIndex` to `InputMeta`. `adapterOas` sets it to `server.index` when you pass one, so a plugin can pick an operation's or a path's own server without reading the adapter's options.
