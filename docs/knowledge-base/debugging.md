---
layout: doc

title: Debugging Kubb
outline: deep
---

# Debugging Kubb <a href="/plugins/react"><Badge type="info" text="@kubb/react-fabric" /></a>

## Log Levels

Kubb provides multiple log levels to control output verbosity:

- **silent** - No output (suppresses all messages)
- **error** - Only critical errors
- **warn** - Errors and warnings
- **info** - Standard build information (default)
- **verbose** - Info + plugin performance metrics
- **debug** - Verbose + detailed execution traces

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

Kubb provides comprehensive debug logging to help you understand what's happening during the code generation process.

### Using the --debug flag

To enable debug mode, use the `--debug` flag or set `--log-level debug`:

```shell
kubb generate --debug
```

Or alternatively:

```shell
kubb generate --log-level debug
```

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
- **GitHub Actions support**: Long debug logs are automatically wrapped in collapsible groups (`::group::` / `::endgroup::`)
- Makes debug output more readable in CI environments
- Short logs (under 100 characters) remain inline
- Easy to expand/collapse detailed traces

### Debug Log Files

> [!TIP]
> Debug mode creates log files in the `.kubb` directory:
> - `.kubb/kubb-{timestamp}.log` - Contains all debug messages with timestamps

Example debug output:
```
[log] [petStore] Starting setup phase
Config name: petStore
Root: .
Output path: ./src/gen
Number of plugins: 5

[log] [petStore] [plugin-oas] Installing plugin
Plugin key: ["plugin-oas",1]

[log] [petStore] [plugin-oas] Plugin installed successfully in 351ms

[log] [petStore] [plugin-ts] Building schemas
Total schemas: 12
Content type: default
Includes: all
Generators: 1

[log] [petStore] Barrel file generated with 356 exports

[log] [petStore] Starting file write process
Total files to write: 18

[log] [petStore] File write process completed
```

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
