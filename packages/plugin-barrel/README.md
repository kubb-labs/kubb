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
<a href="https://kubb.dev/extensions/kubb-labs/plugin-barrel" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/plugin-barrel

### Barrel-file plugin for Kubb

Generates `index.ts` re-export files for each plugin output directory, and a root `index.ts` when `output.barrel` is set on `defineConfig`.

## Installation

```bash
bun add @kubb/plugin-barrel
# or
pnpm add @kubb/plugin-barrel
# or
npm install @kubb/plugin-barrel
```

## Usage

`defineConfig` adds `pluginBarrel()` to `plugins` for you, so you do not add it yourself. Set `output.barrel` on `defineConfig` to write a root barrel and to give every plugin without its own `output.barrel` the same setting:

```typescript
import { defineConfig } from 'kubb'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './openapi.yaml',
  output: {
    path: './src/gen',
    barrel: { type: 'named' },
  },
  plugins: [pluginTs()],
})
```

## Options

`pluginBarrel()` takes no arguments. You configure it through `output.barrel`, on `defineConfig` or on a single plugin.

| Option                    | Type                                                                         | Default                   | Description                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `output.barrel`           | `{ type: 'all' \| 'named', nested?: boolean, namespace?: boolean } \| false` | `false` on `defineConfig` | Barrel settings. `false` on a plugin turns its barrel off and leaves its files out of the root one |
| `output.barrel.type`      | `'all' \| 'named'`                                                           | None                      | Export style for the generated barrel files                                                        |
| `output.barrel.nested`    | `boolean`                                                                    | `false`                   | Plugin only. Each barrel re-exports its own directory and the barrels below it                     |
| `output.barrel.namespace` | `boolean`                                                                    | `false`                   | Plugin only. Add named namespaces for immediate subdirectories and enable nested barrels           |

Set `output.barrel.namespace: true` on a grouped fetch plugin to import a named service such as `PetService`, alongside standalone functions. Leave `sdk` unset when using query plugins. See the [fetch + React Query example](https://kubb.dev/extensions/kubb-labs/plugin-barrel/options#namespace).

### Export types

| Value     | Output                                                                  |
| --------- | ----------------------------------------------------------------------- |
| `'all'`   | `export * from './...'` — wildcard re-exports                           |
| `'named'` | `export { ... } from './...'` — named re-exports, tree-shaking friendly |

## How it works

After every plugin finishes generating files, `@kubb/plugin-barrel` walks the output tree and creates an `index.ts` in each directory of every plugin output with a barrel enabled. When `output.barrel` is set on `defineConfig`, it also creates a root `index.ts` at the top of the output path that re-exports the files of every plugin that does not set `output.barrel: false`.

`@kubb/plugin-barrel` uses `enforce: 'post'` so it always runs after all regular plugins complete, giving it access to the full set of generated files.

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/plugin-barrel
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/plugin-barrel
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/plugin-barrel
