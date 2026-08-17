---
'kubb': minor
'@kubb/core': patch
---

Move the plugins out of this repository into [kubb-labs/plugins](https://github.com/kubb-labs/plugins).

`@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-faker`, `@kubb/plugin-msw`, and the rest of the code generators now ship and version independently from the core engine, so a plugin release no longer waits on a `kubb` release and vice versa. `@kubb/plugin-barrel` is the one plugin that stays here, since barrel generation runs as a built-in post-enforced plugin. Install plugins from their own packages as before. Nothing changes in a `kubb.config.ts` beyond that.

`@kubb/core` no longer depends on `@kubb/oas`. `HttpMethod` is now imported from `@kubb/ast`.
