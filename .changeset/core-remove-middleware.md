---
'@kubb/core': major
'@kubb/plugin-barrel': minor
'kubb': major
'unplugin-kubb': patch
---

Replace `middleware` with post-enforced plugins.

`defineMiddleware` and the `Middleware` type are removed from `@kubb/core`. Use `definePlugin` with `enforce: 'post'` instead — a post-enforced plugin registers after all normal plugins and fires in that order, giving the same guarantee.

`Config.middleware` and `UserConfig.middleware` are removed. Barrel generation now runs through the new `@kubb/plugin-barrel` package, which is a standard plugin with `enforce: 'post'`. It is added to `plugins` automatically by `defineConfig` when no barrel plugin is already present.

`@kubb/middleware-barrel` is removed. Migrate to `@kubb/plugin-barrel`.
