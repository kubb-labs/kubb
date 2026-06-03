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

# @kubb/middleware-logger

### Logger middleware for Kubb

One consola-backed logger that handles every CLI output environment, with inline GitHub Actions workflow command annotations when the runner is detected.

## Installation

```bash
bun add @kubb/middleware-logger
# or
pnpm add @kubb/middleware-logger
# or
npm install @kubb/middleware-logger
```

## Usage

Install the default `middlewareLogger` on a run's event emitter:

```typescript
import { middlewareLogger } from '@kubb/middleware-logger'
import { AsyncEventEmitter } from '@internals/utils'
import { logLevel, type KubbHooks } from '@kubb/core'

const hooks = new AsyncEventEmitter<KubbHooks>()
const makeSink = await middlewareLogger.install(hooks, { logLevel: logLevel.info })
```

Or build a custom instance with `createLogger`:

```typescript
import { createLogger } from '@kubb/middleware-logger'

const logger = createLogger({ gha: true })
await logger.install(hooks, { logLevel: logLevel.verbose })
```

## How it works

Each `KubbHooks` event routes through consola for the human-readable line. When `isGitHubActions()` is true at install time the same handler also emits the matching workflow command (`::group::`, `::endgroup::`, `::warning::`, `::error::`, `::notice::`) so the CI annotations panel highlights problems and the log gets collapsible sections per config, plugin, and hook.

The package also exports the formatting helpers (`formatDiagnostic`, `diagnosticSymbol`, `diagnosticHeadline`, `diagnosticDetails`, `formatMessage`, `formatCommandWithArgs`) and the `HookSinkFactory` / `HookSinkOptions` types so other hosts can reuse them.

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

[npm-version-src]: https://img.shields.io/npm/v/@kubb/middleware-logger?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/middleware-logger
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/middleware-logger?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/middleware-logger
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/middleware-logger
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
