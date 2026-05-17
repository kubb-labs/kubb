---
'@kubb/cli': patch
'@kubb/core': patch
---

Fix multiple configs in `defineConfig` array stopping after the first failure.

Two bugs caused only one schema to be processed when using `defineConfig` with an array of configs:

1. **`@kubb/cli`**: `process.exit(1)` was called immediately when any config failed, killing the process before remaining configs could run. Each config is now processed independently; the process exits with code 1 after all configs complete if any failed.

2. **`@kubb/core`**: Middleware hooks registered during `setup()` were never removed from the shared `hooks` instance between config runs, causing N middleware instances to fire for the N-th config and producing duplicate output. Middleware listeners are now tracked and removed via `SetupResult.dispose()` at the end of each build.
