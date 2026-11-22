---
'@kubb/core': patch
---

Keep `KubbDriver.getResolver` as a deprecated method until v6, so published plugins that call `ctx.driver.getResolver(name)` keep working. It returns the resolver the plugin set with kit's `setResolver`, and throws `KUBB_MOVED_TO_KIT` when there is none. Use `ctx.getResolver(name)` from `kubb/kit` instead.
