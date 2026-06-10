---
'@kubb/cli': minor
'@kubb/core': patch
---

Add a `--no-cache` flag to `kubb generate` that turns off the incremental build cache for a single run, forcing a full regeneration without editing the config.

The flag overrides whatever cache the config resolved to (`fsCache()` by default), so it works for every config shape. `CLIOptions` now carries `noCache`, letting a `defineConfig` function read it too.
