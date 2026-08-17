---
'@kubb/cli': patch
'@kubb/core': patch
---

Fix multiple configs in `defineConfig` array stopping after the first failure.

Two bugs caused only one schema to be processed when using `defineConfig` with an array of configs:

1. `@kubb/cli`: `process.exit(1)` was called immediately when any config failed, killing the process before remaining configs could run. Each config is now processed independently, and the process exits with code 1 after all configs complete if any failed.

2. `@kubb/core`: plugin hooks registered while wiring up the driver were never removed from the shared `hooks` instance between config runs, causing N plugin instances to fire for the N-th config and producing duplicate output. Plugin hook listeners are now tracked and removed via `KubbDriver.dispose()` at the end of each build.
