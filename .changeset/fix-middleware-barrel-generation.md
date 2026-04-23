---
"@kubb/middleware-barrel": patch
"@kubb/core": patch
---

Fix barrel file generation in `@kubb/middleware-barrel`.

**Bug 1 — Wrong per-plugin output path**: `generatePerPluginBarrel` was resolving the plugin output directory as `resolve(config.root, plugin.output.path)`, but plugin paths are relative to `config.output.path`. Fixed to `resolve(config.root, config.output.path, plugin.output.path)`.

**Bug 2 — Root barrel generated after file writing**: The root barrel was generated inside `kubb:build:end`, which fires after `fileProcessor.run()` has already written files to disk — so the barrel was never persisted. A new `kubb:plugins:end` lifecycle hook now fires after all plugins have run but before files are written, and the root barrel is generated there.
