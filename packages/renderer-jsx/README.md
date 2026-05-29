<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

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

[npm-version-src]: https://img.shields.io/npm/v/@kubb/renderer-jsx?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/renderer-jsx
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/renderer-jsx?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/renderer-jsx
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/renderer-jsx
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
