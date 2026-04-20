---
layout: doc

title: Debug Kubb Code Generation - Troubleshooting Guide
description: Debug Kubb with debug mode. Inspect code generation, find issues, and optimize performance.
outline: deep
---

# Debugging Kubb

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

The system selects the logger automatically based on the environment, or use the `createLogger` API for custom loggers.

### Custom logger implementation

Create custom loggers by listening to `KubbHooks`:

```typescript [kubb.logger.ts]
import { createLogger, LogLevel } from '@kubb/core'

export const customLogger = createLogger({
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

See the [KubbHooks](/api/core/events) API documentation for a complete list of available events.

## See Also

- [Node debugging](https://www.youtube.com/watch?v=i9hOCvBDMMg)
