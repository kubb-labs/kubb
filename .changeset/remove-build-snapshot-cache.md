---
'@kubb/core': major
'@kubb/cli': major
'kubb': major
---

Remove the incremental build cache.

The `cache` config option, the `createCache` factory, the `fsCache` backend, and the `Cache`, `CachedSnapshot`, and `FsCacheOptions` types are gone from `@kubb/core`. `defineConfig` no longer enables `fsCache()` by default, and the `kubb generate --no-cache` flag is removed from the CLI. Every run now regenerates straight from the spec.
