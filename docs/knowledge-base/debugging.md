---
layout: doc

title: Debugging Kubb
outline: deep
---

# Debugging Kubb <a href="/plugins/react"><Badge type="info" text="@kubb/react-fabric" /></a>

## Log Levels

Kubb provides multiple log levels to control output verbosity. The logging system uses an event-based architecture with `@clack/prompts` for interactive progress bars and multiple logger adapters for different environments.

- **silent** - No output (suppresses all messages)
- **error** - Only critical errors
- **warn** - Errors and warnings
- **info** - Standard build information (default)
- **verbose** - Info + plugin performance metrics
- **debug** - Verbose + detailed execution traces + file persistence

## Logger Architecture

Kubb uses a flexible logger pattern with environment-specific adapters:

- **clackLogger** - Local development with interactive progress bars (@clack/prompts)
- **githubActionsLogger** - CI environment with collapsible groups (`::group::` annotations)
- **plainLogger** - Fallback console logger for non-TTY environments
- **fileSystemLogger** - Debug file persistence to `.kubb/kubb-{timestamp}.log`

The logger is automatically selected based on your environment:
- GitHub Actions: Uses githubActionsLogger
- TTY terminal: Uses clackLogger with progress bars
- Non-TTY: Uses plainLogger

All loggers follow the `defineLogger` pattern and return cleanup functions for proper resource management.

### Verbose Mode

Verbose mode adds plugin performance metrics to help identify bottlenecks, inspired by tools like Vite and NX.

```shell
kubb generate --verbose
# or
kubb generate --log-level verbose
```

**Output includes:**
- Plugin timing breakdown with visual bars
- Top 5 slowest plugins
- Performance metrics for optimization

Example:
```
Plugins:        5 successful, 5 total
Generated:      18 files in 1.286s
Plugin Timings:
  ████ plugin-oas: 392ms
  ████ plugin-react-query: 384ms
  ███ plugin-ts: 211ms
  ██ plugin-zod: 144ms
  ██ plugin-redoc: 120ms
Output:         .
```

### Debug Mode

Kubb provides comprehensive debug logging powered by an event-based architecture. Debug mode captures detailed execution traces and persists them to log files for later analysis.

### Using the --debug flag

To enable debug mode, use the `--debug` flag or set `--log-level debug`:

```shell
kubb generate --debug
```

Or alternatively:

```shell
kubb generate --log-level debug
```

### Event-Based Logging System

Kubb's logger uses an event-driven architecture with 29 documented events:

**Lifecycle Events:**
- `lifecycle:start` - Build process begins
- `lifecycle:end` - Build process completes

**Plugin Events:**
- `plugin:start` - Plugin execution starts (per-plugin)
- `plugin:end` - Plugin execution ends with timing
- `plugins:hook:progress:start` - Hook collection starts
- `plugins:hook:progress:end` - Hook collection ends
- `plugins:hook:processing:start` - Hook execution starts
- `plugins:hook:processing:end` - Hook execution ends

**File Events:**
- `files:processing:start` - File generation begins
- `files:processing:update` - File generation progress
- `files:processing:end` - File generation completes

**Log Events:**
- `info`, `warn`, `error` - Standard logging
- `debug` - Debug messages with category labels
- `verbose` - Verbose operation traces

All events support an optional `groupId` parameter for organizing logs in CI environments.

::: code-group
```typescript [Event Usage Example]
// Listen to events
context.on('plugin:start', ({ name }) => {
  console.log(`Starting plugin: ${name}`)
})

context.on('plugin:end', ({ name }, duration) => {
  console.log(`Completed plugin: ${name} in ${duration}ms`)
})

// Emit with group IDs for CI
context.emit('info', 'Processing schema', { groupId: 'schema-validation' })
```
:::

### What gets logged in debug mode

When debug mode is enabled, Kubb logs detailed information about:

#### Setup Phase
- Configuration details (name, root path, output path)
- Number of plugins being loaded
- Input file validation
- Directory cleaning operations
- Fabric initialization
- **Environment information** (Node version, platform, architecture, working directory)

#### Plugin Execution
- Plugin installation with timing information
- Hook execution for each plugin (start, duration, completion)
- Plugin key and metadata
- Schema parsing details for each schema
- **Detailed error context** including:
  - Error type and constructor name
  - Full error message
  - Complete stack trace
  - Hook parameters and context
  - Plugin-specific metadata

#### File Generation
- Total number of files to generate
- File paths (absolute and relative)
- Barrel file exports
- File writing progress

#### Formatting & Linting
- Formatter/linter execution (prettier, biome, eslint, oxlint)
- Success or failure status
- Error messages if tools are not found

#### CI/CD Integration

**GitHub Actions Support:**
- Automatic environment detection (`isGitHubActions()`)
- Long debug logs wrapped in collapsible groups (`::group::` / `::endgroup::`)
- Makes debug output more readable in CI environments
- Short logs (under 100 characters) remain inline
- Easy to expand/collapse detailed traces
- Supports custom group naming with `groupId` parameter

**Logger Adapters:**
- **githubActionsLogger**: Uses GitHub Actions workflow commands for warnings (`::warning::`), errors (`::error::`), and debug (`::debug::`)
- **clackLogger**: Interactive progress bars with Claude-inspired task status icons
- **plainLogger**: Simple console output for non-TTY environments
- **fileSystemLogger**: Captures all debug/verbose events to disk

::: code-group
```shell [GitHub Actions Example]
# GitHub Actions automatically detected
GITHUB_ACTIONS=true kubb generate --debug

# Output uses collapsible groups:
::group::Starting setup phase
Config name: petStore
Environment: Node v20.19.6, linux
::endgroup::

::group::plugin-oas
Plugin installation started
Plugin installed in 351ms
::endgroup::
```
:::

### Debug Log Files

> [!TIP]
> Debug mode creates log files in the `.kubb` directory:
> - `.kubb/kubb-{timestamp}.log` - Contains all debug messages with timestamps and categories
> 
> **Crash Recovery:**
> Process exit handlers (SIGINT, SIGTERM, exit) ensure logs are written even if the process crashes unexpectedly.

**File Persistence Features:**
- Auto-enabled when logLevel >= debug
- Timestamped entries for operation tracing
- Category labels for easy filtering (config, plugin, schema, files, etc.)
- Async cleanup writes all cached logs to disk
- Process exit handlers for best-effort crash recovery

Example debug log file content:
```
[2024-12-17T10:33:45.123Z] [config] Starting setup phase
Config name: petStore
Root: .
Output path: ./src/gen
Number of plugins: 5

[2024-12-17T10:33:45.234Z] [plugin] [plugin-oas] Installing plugin
Plugin key: ["plugin-oas",1]

[2024-12-17T10:33:45.585Z] [plugin] [plugin-oas] Plugin installed successfully in 351ms

[2024-12-17T10:33:45.750Z] [schema] [plugin-ts] Building schemas
Total schemas: 12
Content type: default
Includes: all
Generators: 1
```

Example debug output:
```
┌  Generation started

◇  Starting plugin-oas...
◒  ████████ Generating...
◇  plugin-oas completed in 487ms

◇  Starting plugin-ts...
◓  ████████ Generating...
◇  plugin-ts completed in 186ms

└  Build completed

Plugins:        2 successful, 2 total
Generated:      18 files in 0.673s
Plugin Timings:
  ████ plugin-oas: 487ms
  ███ plugin-ts: 186ms
Output:         .
```

**Claude-Inspired Features:**
- Task status icons (✓ success, ✗ error, ⚠ warning, ◐ in-progress, ℹ info)
- Real-time progress bars for plugin execution and file writing
- Contextual error messages with stack traces
- Error/warning counters in summary
- Human-readable durations (<1s: ms, >=1s: seconds)
- Single-level indentation respecting Clack constraints

### Performance Analysis

Debug mode includes timing information for:
- Plugin installation
- Hook execution
- Schema generation
- File writing

This helps identify performance bottlenecks in your generation pipeline.

### Troubleshooting with Debug Mode

Use debug mode to diagnose:
- Plugin loading issues
- Schema parsing problems
- File generation failures
- Hook execution order
- Performance issues

## React DevTools

Kubb supports React DevTools out-of-the-box. To enable integration with React DevTools, import the devtools package in your `kubb.config.ts` config file.

![React-DevTools](/screenshots/react-devtools.png)

> [!NOTE]
> Kubb will already run `npx react-devtools` as part of the `@kubb/react-fabric/devtools` import.

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

```typescript{1} twoslash
import '@kubb/react-fabric/devtools' // [!code ++]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
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

## Links

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Node debugging](https://www.youtube.com/watch?v=i9hOCvBDMMg)
