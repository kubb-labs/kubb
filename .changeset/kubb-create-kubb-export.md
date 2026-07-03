---
'@kubb/core': patch
'kubb': patch
---

Export `createKubb` from the `kubb` package so you can run a build programmatically without installing `@kubb/core`.

`kubb`'s `createKubb` fills in the same defaults as `defineConfig` (`adapterOas`, the default parsers, the built-in reporters, and `pluginBarrel`), so a script needs only `input`, `output`, and its plugins. The `@kubb/core` `createKubb` stays available for callers that wire the adapter and parsers themselves; its `CreateKubbOptions` type is now exported too.
