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

# @kubb/kit

### Authoring toolkit for Kubb plugins

`@kubb/kit` gathers the helpers you call when you author a plugin, generator, adapter, resolver, or renderer: `definePlugin`, `defineGenerator`, `defineResolver`, `defineParser`, `createAdapter`, `createRenderer`, the `ast` namespace and `factory` node builders, and the option and hook types that go with them. It sits next to the `kubb` package, which is where end users configure and run builds. `kubb/kit` re-exports this package, so most consumers reach it through `kubb/kit` rather than installing `@kubb/kit` directly.

## Installation

Install `kubb` and import from the `kubb/kit` subpath, rather than depending on `@kubb/kit` directly.

```bash
bun add kubb
# or
pnpm add kubb
# or
npm install kubb
```

## Usage

```typescript
import { ast, definePlugin, defineGenerator } from 'kubb/kit'

export const pluginExample = definePlugin(() => {
  return {
    name: 'example',
    generators: [
      defineGenerator({
        schema({ schema }) {
          return ast.factory.createSchema(schema)
        },
      }),
    ],
  }
})
```

## What is in the box

`definePlugin`, `defineGenerator`, `defineResolver`, and `defineParser` wrap a plugin, a generator, a resolver, or a parser into the shape the build engine expects. `createAdapter`, `createRenderer`, and `createStorage` are the matching factories for a custom spec adapter, output renderer, or storage backend.

`ast` and `factory` are the node builders a generator calls to construct the file, schema, and operation nodes it returns. `Diagnostics` is the structured error a plugin throws to report a problem with a location and a fix suggestion, and `memoryStorage` and `fsStorage` are the built-in storage backends, useful in tests and custom configs.

Rounding out the package are the option and hook types every plugin, generator, adapter, resolver, and renderer author references, among them `PluginFactoryOptions`, `GeneratorContext`, `ResolverContext`, `AdapterFactoryOptions`, `RendererFactory`, and `KubbHooks`.

## Testing helpers

`kubb/kit/testing` holds the Vitest-backed test helpers (`createMockedPlugin`, `createMockedAdapter`, `renderGeneratorOperation`, `matchFiles`) used to unit test a plugin or generator without running a full build. It is a separate entry point so the main `kubb/kit` import never pulls in Vitest.

```typescript
import { createMockedPlugin, renderGeneratorSchema } from 'kubb/kit/testing'
```

## Why a separate package from `@kubb/core`

`@kubb/core` also runs the build engine: the plugin driver, the file manager, and the CLI reporters. None of that is part of authoring a plugin. `@kubb/kit` keeps the two apart, the same way the surrounding `kubb/ast` and `kubb/jsx` subpaths separate the AST layer and the JSX renderer from the engine that drives them.

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/kit.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/kit
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/kit.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/kit
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/kit.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/kit.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/kit
