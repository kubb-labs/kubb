---
layout: doc

title: Debugging Kubb
outline: deep
---

# Debugging Kubb <a href="/plugins/react"><Badge type="info" text="@kubb/react-fabric" /></a>

## React DevTools

Kubb supports React DevTools out-of-the-box. To enable integration with React DevTools, import the devtools package in your `kubb.config.ts` config file.

![React-DevTools](/screenshots/react-devtools.png)

> [!NOTE]
> Kubb will already run `npx react-devtools` as part of the `@kubb/react-fabric` import.

### Installation
Before you can use the React DevTools, install the React package.

> [!IMPORTANT]
> Minimal Kubb version of `v3.0.0-alpha.11`.

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

### Update `kubb.config.ts`
:::

```typescript{1}
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

After it starts up, you should see the component tree of your CLI. You can even inspect all components.
> [!NOTE]
> Kubb will already filter out some internal components like:
>
> `KubbApp`, `KubbRoot`, `KubbErrorBoundary`, `kubb-text`, `kubb-file`, `kubb-source`, `kubb-import` and `kubb-export`.

The internal components `kubb-text`, `kubb-file`, `kubb-source`, `kubb-import`, and `kubb-export` are utilized to convert the React tree into a file that accurately includes the necessary imports, exports, and source code.

> [!IMPORTANT]
> You must manually quit your CLI via `Ctrl+C` after you're done testing.

![React-DevTools](/screenshots/react-devtools.gif)

## Node debugging

Because Kubb is a cli tool you need to use `NODE_OPTIONS='--inspect-brk' kubb`.

`--inspect-brk` will make sure the debugger already stops so you can set and use breakpoints.

## Event-driven logging

Kubb uses an event-driven architecture for logging and progress tracking. The CLI supports multiple logger implementations that adapt to different environments:

### Logger types

- **Clack Logger** (default) - Modern interactive CLI with progress bars using `@clack/prompts`
- **GitHub Actions Logger** - CI-optimized with collapsible sections using `::group::` annotations
- **Plain Logger** - Simple text output for basic terminals
- **File System Logger** - Writes logs to files

The logger is automatically selected based on the environment, or you can implement custom loggers using the `defineLogger` API.

### Custom logger implementation

You can create custom loggers by listening to `KubbEvents`:

```typescript
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

## Links

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Node debugging](https://www.youtube.com/watch?v=i9hOCvBDMMg)
