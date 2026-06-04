<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/cache

### Incremental build cache for Kubb

Makes a second run near-instant when nothing changed. Kubb fingerprints the inputs that shape generated code, and on a match restores the previous output instead of regenerating it, the same idea behind Nx's computation cache and Turborepo's remote cache.

## Installation

```bash
bun add @kubb/cache
# or
pnpm add @kubb/cache
# or
npm install @kubb/cache
```

## Usage

Set the `cache` option in your `kubb.config.ts`. It is opt-in, so without it Kubb always regenerates.

```typescript
import { defineConfig } from 'kubb'
import { fsCache } from '@kubb/cache'

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
  },
  cache: fsCache(),
})
```

## Backends

| Backend        | Where snapshots live                                      |
| -------------- | --------------------------------------------------------- |
| `fsCache`      | Local disk under `node_modules/.cache/kubb`               |
| `turboCache`   | A Turborepo Remote Cache server or Vercel Remote Cache    |
| `tieredCache`  | A list of backends, fastest first                         |
| `memoryCache`  | The current process only (tests and watch sessions)       |

### Shared local and remote cache

`tieredCache` reads the fastest backend first and falls back to the next, back-filling the faster ones on a remote hit. Writes go to every backend. Local runs hit the on-disk cache while CI shares results through the remote one.

```typescript
import { defineConfig } from 'kubb'
import { fsCache, tieredCache, turboCache } from '@kubb/cache'

export default defineConfig({
  input: { path: './openapi.yaml' },
  output: { path: './src/gen' },
  cache: tieredCache([fsCache(), turboCache()]),
})
```

`turboCache` speaks the Turborepo Remote Cache HTTP API, so a self-hosted Turborepo cache server or Vercel Remote Cache works without changes. It reads its credentials from `TURBO_API`, `TURBO_TOKEN`, `TURBO_TEAM`, and `TURBO_REMOTE_CACHE_SIGNATURE_KEY`, so no secrets live in the config. A failed download is treated as a miss and a failed upload logs a warning, so a flaky remote never fails the build.

## How it works

The cache key is a SHA-256 hash of everything that affects the output: the spec content, the resolved config, every plugin's name and options, the running Kubb version, and a cache-format version. Paths in the key and the stored snapshot are relative, so a snapshot persisted in CI restores on a developer machine with a different checkout root.

On a hit, Kubb writes the cached sources straight to the output and skips generation entirely. On a miss it builds as usual and stores the result for next time. Only successful builds are stored.

The fingerprint covers the spec and config. Plugins that read files or environment outside the spec, or that produce non-deterministic output such as timestamps, break the cache contract and should not be cached. Caching is also disabled automatically for remote URL inputs.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/cache.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/cache
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/cache.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/cache
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/cache.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/cache.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/cache
