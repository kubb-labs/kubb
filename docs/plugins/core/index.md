---
layout: doc

title: \@kubb/core
outline: deep
---

# @kubb/core <a href="https://paka.dev/npm/@kubb/core@latest/api">🦙</a>

The core contains the building blocks for all plugins.

## Features

- Read and write to the file system(Windows, Mac and Linux support).
- Format code/source with [Prettier](https://prettier.io/).
- Types needed to create a plugin and the types needed for the lifecycle/pluginManager.
- Basic utilities such as `isPromise`, [`isURL`](https://github.com/kubb-project/kubb/blob/main/packages/core/src/utils/URLPath.ts), [`createJSDocBlockText`](https://github.com/kubb-project/kubb/blob/main/packages/core/src/transformers/createJSDocBlockText.ts), `cache`,...
- [`createPlugin`](https://github.com/kubb-project/kubb/blob/main/packages/core/src/plugin.ts) functionality to set up a plugin.
- [`defineConfig`](https://github.com/kubb-project/kubb/blob/main/packages/core/src/config.ts) functionality to set up the `kubb.config.js` file.
- Abstract classes for plugins
  - [`Generator`](https://github.com/kubb-project/kubb/blob/main/packages/core/src/Generator.ts) which contains the base with a getter for `options` and a `build` function.
- Managers classes as the base for all logic
  - [`FileManager`](https://github.com/kubb-project/kubb/blob/main/packages/core/src/FileManager.ts) which is used to store all files before those are saved to the file system.
  - [`PluginManager`](https://github.com/kubb-project/kubb/blob/main/packages/core/src/PluginManager.ts) which contains the logic of when which plugin can be triggered, see [pluginManager](/reference/pluginManager/).

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/core
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/core
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/core
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/core
```

:::

## Usage

### Simple example

```typescript
import { build } from '@kubb/core'
import type { File } from '@kubb/core'

const files: File[] = await build({ config })
```

### Advanced example

```typescript
import { build } from '@kubb/core'
import type { BuildOptions, File } from '@kubb/core'

const spinner = ora({
  color: 'blue',
  text: pc.blue('Generating files'),
}).start()

const logger: BuildOptions['logger'] = {
  log(message, logLevel) {
    if (logLevel === 'error') {
      spinner.fail(message)
    }
    spinner[logLevel](message)
  },
  spinner,
}

const files: File[] = await build({
  config: {
    ...config,
    root: config.root || process.cwd(),
  },
  mode: options.mode || 'development',
  logger,
})
```

Start the build process based on a defined config(see [UserConfig](https://github.com/kubb-project/kubb/blob/main/packages/core/src/config.ts) type).
This will trigger the different plugins and their created lifecycle methods.
