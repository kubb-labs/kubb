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

# @kubb/renderer-jsx

### JSX-based renderer for Kubb

Provides a custom React runtime, reconciler, and built-in components (`File`, `Function`, `Type`, `Const`) for component-based, type-safe code generation inside Kubb plugins.

## Installation

```bash
bun add @kubb/renderer-jsx
# or
pnpm add @kubb/renderer-jsx
# or
npm install @kubb/renderer-jsx
```

## Usage

Use the built-in components inside a Kubb plugin to emit generated files:

```tsx
import { createRenderer } from '@kubb/renderer-jsx'
import { File, Function, Type } from '@kubb/renderer-jsx'

const renderer = createRenderer()

await renderer.render(
  <File baseName="petStore.ts" path="src/gen/petStore.ts">
    <File.Source>
      <Type name="Pet">{'{ id: number; name: string }'}</Type>
      <Function name="getPet" async>
        {"return fetch('/pets')"}
      </Function>
    </File.Source>
  </File>,
)

const files = renderer.files
renderer.unmount()
```

## Built-in Components

| Component       | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `<File>`        | Declares a generated output file with its path and optional imports/exports |
| `<File.Source>` | The source content block inside a `<File>`                                  |
| `<Function>`    | Generates a TypeScript function declaration                                 |
| `<Type>`        | Generates a TypeScript type alias                                           |
| `<Const>`       | Generates a `const` variable declaration                                    |
| `<Jsx>`         | Renders JSX expressions inside generated output                             |
| `<Root>`        | Root container for the renderer tree                                        |

## API

### `createRenderer(options?)`

Creates a new renderer instance.

```typescript
const renderer = createRenderer({ debug: false })
await renderer.render(<MyComponent />)
const files = renderer.files  // FileNode[]
renderer.unmount()
```

### `jsxRenderer`

Pre-built renderer instance for use directly in Kubb plugins as the `jsxRenderer` plugin option.

## JSX Runtime

`@kubb/renderer-jsx` ships its own JSX runtime (`jsx-runtime` and `jsx-dev-runtime`). Configure your `tsconfig.json` to use it:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@kubb/renderer-jsx"
  }
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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/renderer-jsx.svg?variant=secondary&size=sm&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/renderer-jsx
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/renderer-jsx.svg?variant=secondary&size=sm&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/renderer-jsx
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=sm&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/renderer-jsx.svg?variant=secondary&size=sm&theme=zinc&mode=dark
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/renderer-jsx.svg?variant=secondary&size=sm&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/renderer-jsx
