---
"@kubb/core": patch
---

Add a `kubb:plugins:end` lifecycle hook for barrel generation.

The root barrel was generated inside `kubb:build:end`, which fires after `fileProcessor.run()` has already written files to disk, so the barrel was never persisted. A new `kubb:plugins:end` lifecycle hook now fires after all plugins have run but before files are written, giving post-enforced plugins a place to emit aggregate files like the root barrel.
