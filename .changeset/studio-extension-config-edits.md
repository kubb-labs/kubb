---
'@kubb/studio': patch
---

A `set` or `remove` config edit can name the config's `adapter` or one of its `parsers` through `kind`, and `readConfig` reports their factory calls next to the plugins, so Studio can save adapter and parser options to `kubb.config.ts`.
