---
layout: doc

title: Debug Kubb Code Generation - Troubleshooting Guide
description: Debug Kubb with React DevTools and debug mode. Inspect code generation, find issues, and optimize performance.
outline: deep
---

# Debugging Kubb <a href="/plugins/react"><Badge type="info" text="@kubb/react-fabric" /></a>

## React DevTools

Kubb supports React DevTools out of the box. Enable integration by importing the devtools package in your `kubb.config.ts` file.

![React-DevTools](/screenshots/react-devtools.png)

> [!NOTE]
> Kubb runs `npx react-devtools` as part of the `@kubb/react-fabric` import.

### Installation
Before using React DevTools, install the React package.

> [!IMPORTANT]
> Requires Kubb version `v3.0.0-alpha.11` or higher.

::: code-group

```shell [bun]
bun add -d @kubb/react-fabric
```

```shell [pnpm]
pnpm add -D @kubb/react-fabric
```

```shell [npm]
npm install --save-dev @kubb/react-fabric
```

```shell [yarn]
yarn add -D @kubb/react-fabric
```
:::

### Update `kubb.config.ts`

```typescript [kubb.config.ts]
import { openDevtools } from '@kubb/react-fabric' // [!code ++]

import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  openDevtools() // [!code ++]

  return {
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [
      pluginOas(),
      pluginTs(),
    ],
  }
})
```

After startup, the component tree displays. Inspect all components.

> [!NOTE]
> Kubb filters out internal components:
>
> `KubbApp`, `KubbRoot`, `KubbErrorBoundary`, `kubb-text`, `kubb-file`, `kubb-source`, `kubb-import`, and `kubb-export`.

The system uses the internal components `kubb-text`, `kubb-file`, `kubb-source`, `kubb-import`, and `kubb-export` to convert the React tree into a file with proper imports, exports, and source code.

> [!IMPORTANT]
> Quit your CLI manually via `Ctrl+C` after testing.

![React-DevTools](/screenshots/react-devtools.gif)

## Node debugging

Use `NODE_OPTIONS='--inspect-brk' kubb` because Kubb is a CLI tool.

`--inspect-brk` stops the debugger immediately so you set breakpoints.

## Event-driven logging

Kubb uses event-driven architecture for logging and progress tracking. The CLI supports multiple logger implementations that adapt to different environments:

### Logger types

- **Clack Logger** (default) - Modern interactive CLI with progress bars using `@clack/prompts`
- **GitHub Actions Logger** - CI-optimized with collapsible sections using `::group::` annotations
- **Plain Logger** - Simple text output for basic terminals
- **File System Logger** - Writes logs to files

The system selects the logger automatically based on the environment, or use the `defineLogger` API for custom loggers.

### Custom logger implementation

Create custom loggers by listening to `KubbEvents`:

```typescript [kubb.logger.ts]
import { defineLogger, LogLevel } from '@kubb/core'

export const customLogger = defineLogger({
  name: 'custom',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info

    context.on('lifecycle:start', (version) => {
      console.log(`Starting Kubb ${version}`)
    })

    context.on('plugin:start', (plugin) => {
      console.log(`Generating ${plugin.name}`)
    })

    context.on('plugin:end', (plugin, { duration }) => {
      console.log(`${plugin.name} completed in ${duration}ms`)
    })

    context.on('error', (error) => {
      console.error(error.message)
    })
  },
})
```

See the [KubbEvents](/api/core/events) API documentation for a complete list of available events.

## See Also

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Node debugging](https://www.youtube.com/watch?v=i9hOCvBDMMg)
