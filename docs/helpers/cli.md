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
bun add @kubb/cli
```

```shell [pnpm]
pnpm add @kubb/cli
```

```shell [npm]
npm install @kubb/cli
```

```shell [yarn]
yarn add @kubb/cli
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

Use kubb <command> --help for more information about a command.
```

## Generate

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
> Debug mode will create 2 log files:
> - `.kubb/kubb-DATE_STRING.log`
> - `.kubb/kubb-files.log`


Alias for `kubb generate --log-level debug`
```shell [node]
kubb --debug
```

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
