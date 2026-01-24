---
layout: doc

title: \@kubb/cli
outline: deep
---

# @kubb/cli

Generate files based on a `kubb.config.ts` configuration file using the Kubb CLI.
The CLI displays progress updates including plugin execution status, file counts, and timing information during generation.

![React-DevTools](../public/screenshots/cli.gif)

## Installation

::: code-group
```shell [bun]
bun add -d @kubb/cli
```

```shell [pnpm]
pnpm add -D @kubb/cli
```

```shell [npm]
npm install --save-dev @kubb/cli
```

```shell [yarn]
yarn add -D @kubb/cli
```
:::

## Usage

```shell [node]
kubb --config kubb.config.ts
```

```mdx
USAGE kubb generate

COMMANDS
  generate    [input] Generate files based on a 'kubb.config.ts' file
  validate    Validate a Swagger/OpenAPI file
  mcp         Start the server to enable the MCP client to interact with the LLM.

Use kubb <command> --help for more information about a command.
```

## `kubb generate`
Generate files based on a `kubb.config.ts` file

> [!TIP]
> `kubb generate` and `kubb` will call the same generate functionality.

```mdx
USAGE kubb generate [OPTIONS]

OPTIONS

                        -c, --config    Path to the Kubb config
  -l, --logLevel=<silent|info|verbose|debug>    Log level control
                         -w, --watch    Watch mode based on the input file
                         -v, --verbose  Override logLevel to verbose (shows plugin timings)
                         -s, --silent   Override logLevel to silent (shows plugin timings)
                         -d, --debug    Override logLevel to debug (shows all details)
                          -h, --help    Show help
```

Path of the input file(overrides the one in `kubb.config.js`)

```shell [node]
kubb petStore.yaml
```

### Options

#### --config (-c)

Path to the Kubb config.

```shell [node]
kubb --config kubb.config.ts
```

#### --log-level (-l)
- `silent`: suppresses all log messages, warnings, and errors
- `info`: logs warnings, errors, and informational messages (default)
- `verbose`: adds plugin timing breakdown and performance metrics
- `debug`: shows all messages from `verbose` plus detailed execution traces

```shell [node]
kubb --log-level verbose
```

#### --verbose (-v)

Enables verbose logging with plugin performance metrics. The summary shows plugin execution times and performance breakdown.

Output includes:
- Plugin timing breakdown with visual bars
- Performance metrics for slowest plugins
- All info-level messages

```shell [node]
kubb --verbose
```

#### --debug
> [!TIP]
> Debug mode creates detailed log files in the `.kubb` directory:
> - `.kubb/kubb-{name}-{timestamp}.log` - Contains all debug messages with timestamps
>
> After each generation completes, the CLI will display the exact location of the debug log file.

Debug mode provides comprehensive logging including:
- Setup phase details (configuration, plugins, paths)
- Plugin installation and execution timing
- Hook execution with duration measurements
- Schema parsing information
- File generation progress with paths
- Formatter/linter execution details
- Error messages with full stack traces

Use debug mode for:
- Troubleshooting generation issues
- Understanding plugin execution flow
- Performance analysis
- Debugging schema parsing problems

Alias for `kubb generate --log-level debug`
```shell [node]
kubb --debug
```

See the [Debugging Guide](/guide/debugging) for more details on using debug mode.

#### --watch (-w)

Watch mode based on the input file.
```shell [node]
kubb --watch
```

#### --version (-v)

Output the version number.

```shell [node]
kubb --version
```

#### --help (-h)
Display the help.

```shell [node]
kubb --help
```

## `kubb validate`

Check syntax and structural errors in Swagger/OpenAPI files. The command provides feedback as errors or warnings.

Use in CI pipelines, pre-commit hooks, and development for early error detection.

> [!IMPORTANT]
> `@kubb/oas` should be installed


> [!TIP]
> The validation uses `oas-normalize` to validate Swagger/OpenAPI files.

```mdx
USAGE kubb validate [OPTIONS]

OPTIONS

  -i, --input    Path to Swagger/OpenAPI file
   -h, --help    Show help
```

### Options

#### --input (-i)

Path to the Swagger/OpenAPI file.

```shell [node]
kubb validate --input petstore.yaml
```

## `kubb mcp`

Start a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes Kubb's code generation to AI assistants like [Claude](https://claude.ai), [Cursor](https://cursor.sh), and other MCP-compatible tools.

The MCP server allows AI assistants to generate code from OpenAPI specifications using conversational commands.

> [!IMPORTANT]
> `@kubb/mcp` should be installed to use this command.

::: code-group
```shell [bun]
bun add -d @kubb/mcp
```

```shell [pnpm]
pnpm add -D @kubb/mcp
```

```shell [npm]
npm install --save-dev @kubb/mcp
```

```shell [yarn]
yarn add -D @kubb/mcp
```
:::

### Usage

```shell [node]
npx kubb mcp
```

This starts an MCP server that communicates via stdio (standard input/output). MCP clients like [Claude Desktop](https://claude.ai/download) and [Cursor](https://cursor.sh) can connect to this server.

For more information about configuring MCP for Kubb, see [using Kubb MCP](./mcp.md).
