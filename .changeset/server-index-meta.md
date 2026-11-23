---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
---

Add `serverIndex` to `InputMeta`, the position in `meta.servers` of the server `baseURL` comes from. `adapterOas` sets it from `server.index`, counting only servers that have a `url`, so a plugin can pick an operation's or a path's own server without reading the adapter's options.
