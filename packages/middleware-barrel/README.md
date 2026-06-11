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

> [!WARNING]
> `@kubb/middleware-barrel` is deprecated. Use [`@kubb/plugin-barrel`](../plugin-barrel) instead.
>
> ```typescript
> // Before
> import { middlewareBarrel } from '@kubb/middleware-barrel'
> defineConfig({ middleware: [middlewareBarrel()] })
>
> // After
> import { pluginBarrel } from '@kubb/plugin-barrel'
> defineConfig({ plugins: [pluginBarrel()] })
> ```

# @kubb/middleware-barrel

### Barrel-file plugin for Kubb (deprecated)

This package re-exports `pluginBarrel` from `@kubb/plugin-barrel` under the old `middlewareBarrel` name for backward compatibility. Migrate to `@kubb/plugin-barrel`.

## Migration

Replace `@kubb/middleware-barrel` with `@kubb/plugin-barrel`:

```bash
pnpm remove @kubb/middleware-barrel
pnpm add @kubb/plugin-barrel
```

Update your config:

```typescript
import { defineConfig } from 'kubb'
import { pluginBarrel } from '@kubb/plugin-barrel'

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginBarrel({
      type: 'named',
    }),
  ],
})
```

See [`@kubb/plugin-barrel`](../plugin-barrel) for the full option reference.

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/middleware-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/middleware-barrel
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/middleware-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/middleware-barrel
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/middleware-barrel.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/middleware-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/middleware-barrel
