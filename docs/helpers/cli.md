---
layout: doc

title: \@kubb/cli
outline: deep
---

# @kubb/cli

The Kubb CLI allows you to generate files based on the `kubb.config.ts` configuration file.
Upon startup, Kubb displays the progress of the plugin execution, the file writing, and the results of each hook once the generation process is complete.

![React-DevTools](/screenshots/cli.gif)

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
kubb --config kubb.config.js
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
  -l, --logLevel=<silent|info|debug>    Info, silent or debug
                         -w, --watch    Watch mode based on the input file
                         -d, --debug    Override logLevel to debug
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
- `silent` will suppresses all log messages, warnings, and errors, minimizing console output.
- `info` will log all warnings, errors and info messages.
- `debug` will show all message from `info` and all details about what is being executed.

```shell [node]
kubb --log-level info
```

#### --debug
> [!TIP]
> Debug mode creates detailed log files in the `.kubb` directory:
> - `.kubb/kubb-{timestamp}.log` - Contains all debug messages with timestamps

Debug mode provides comprehensive logging including:
- Setup phase details (configuration, plugins, paths)
- Plugin installation and execution timing
- Hook execution with duration measurements
- Schema parsing information
- File generation progress with paths
- Formatter/linter execution details
- Error messages with full stack traces

This is extremely useful for:
- Troubleshooting generation issues
- Understanding plugin execution flow
- Performance analysis
- Debugging schema parsing problems

Alias for `kubb generate --log-level debug`
```shell [node]
kubb --debug
```

See the [Debugging Guide](/knowledge-base/debugging) for more details on using debug mode.

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
The command will check for syntax and structural errors in your Swagger/OpenAPI file, and provide clear feedback (errors/warnings).

Useful for CI pipelines, pre-commit hooks, and early feedback in development

> [!IMPORTANT]
> `@kubb/oas` should be installed


> [!TIP]
> Behind the scenes we are using `oas-normalize` to validate your Swagger/OpenAPI file.

```mdx
USAGE kubb validate [OPTIONS]

OPTIONS

  -i, --input    Path to Swagger/OpenAPI file
   -h, --help    Show help
```

### Options

#### --input (-i)

Path to your Swagger/OpenAPI file
```shell [node]
kubb generate --input
```

## `kubb mcp`
Start a MCP server to make Kubb work together with a LLM like Claude.

> [!IMPORTANT]
> `@kubb/mcp` should be installed
