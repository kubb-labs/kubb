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

# unplugin-kubb

### Universal build integration for Kubb

Integration of Kubb for Vite, webpack, Rollup, Rolldown, Rspack, esbuild, Farm, Nuxt, and Astro powered by [unplugin](https://github.com/unjs/unplugin).

Kubb generates once, when the first build starts. Watch rebuilds and later builds that share the plugin reuse that output, so restart the build after you change your spec. Vite, Nuxt, and Astro generate during builds only, not in their development servers. A missing `config` or a failed generation fails the build.

## Installation

```bash
bun add -D unplugin-kubb @kubb/core
# or
pnpm add -D unplugin-kubb @kubb/core
# or
npm install -D unplugin-kubb @kubb/core
```

```typescript
// vite.config.ts
import kubb from 'unplugin-kubb/vite'
import { defineConfig } from 'vite'
import config from './kubb.config'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

```typescript
// rollup.config.ts, rolldown.config.ts
import kubb from 'unplugin-kubb/rollup' // or 'unplugin-kubb/rolldown'
import config from './kubb.config'

export default {
  input: 'src/index.ts',
  plugins: [kubb({ config })],
}
```

```typescript
// webpack.config.ts, rspack.config.ts
import kubb from 'unplugin-kubb/webpack' // or 'unplugin-kubb/rspack'
import config from './kubb.config'

export default {
  plugins: [kubb({ config })],
}
```

```typescript
// build.ts
import { build } from 'esbuild'
import kubb from 'unplugin-kubb/esbuild'
import config from './kubb.config'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [kubb({ config })],
})
```

```typescript
// farm.config.ts
import { defineConfig } from '@farmfe/core'
import kubb from 'unplugin-kubb/farm'
import config from './kubb.config'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

```typescript
// nuxt.config.ts: works with the Vite, webpack, and Rspack builders
import config from './kubb.config'

export default defineNuxtConfig({
  modules: [['unplugin-kubb/nuxt', { config }]],
})
```

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import kubb from 'unplugin-kubb/astro'
import config from './kubb.config'

export default defineConfig({
  integrations: [kubb({ config })],
})
```

## Import a spec

Import a spec named `*.openapi.yaml` or `*.openapi.yml` to get the output of every plugin in `config` as one module, with no files written:

```ts
import { getPetById, petSchema } from './petStore.openapi.yaml'
```

`config`'s adapter and plugins run on the imported spec. Its `input` and `output` are not used, and a `config` without `input` only serves these imports. Spec imports also work in the Vite development server. For types in `tsc` and your editor, add the [`openapi-import`](https://github.com/kubb-labs/plugins/tree/main/packages/openapi-import) TypeScript content mapper.

## Options

### config

Define the options for Kubb. When you leave it out, the plugin loads `kubb.config.ts` (or another `kubb.config.*` or `.kubbrc.*`) the way the Kubb CLI finds it, from the current working directory up, so `kubb()` needs no arguments.

```typescript [Options]
type Options = {
  config?: UserConfig
}
```

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

[npm-version-src]: https://shieldcn.dev/npm/v/unplugin-kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/unplugin-kubb
[npm-downloads-src]: https://shieldcn.dev/npm/dm/unplugin-kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/unplugin-kubb
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/unplugin-kubb.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/unplugin-kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/unplugin-kubb
