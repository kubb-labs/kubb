---
"@kubb/core": minor
---

Add `Middleware` type, `defineMiddleware` factory, and `middleware` array to `Config`.

New extension interfaces `Kubb.ConfigOptionsRegistry` and `Kubb.PluginOptionsRegistry` allow middleware and plugin packages to augment `Config['output']` and plugin `Output` without modifying core types.
