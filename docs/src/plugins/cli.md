---
layout: doc

title: \@kubb/cli
outline: deep
---
# @kubb/cli

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

```sh
kubb --config kubb.config.js
```

```mdx
kubb/1.2.1

Usage:
  $ kubb [input]

Commands:
  [input]           Path of the input file(overrides the one in `kubb.config.js`)
  generate [input]  Path of the input file(overrides the one in `kubb.config.js`)
  init              Init Kubb

For more info, run any command with the `--help` flag:
  $ kubb --help
  $ kubb generate --help
  $ kubb init --help

Options:
  -h, --help     Display this message
  -v, --version  Display version number
```

## Generate(alias `generate`)

! `kubb generate` and `kubb` is the same

```mdx
kubb/1.2.1

Usage:
  $ kubb generate [input]

Options:
  -c, --config <path>     Path to the Kubb config
  -l, --log-level <type>  Info, silent or debug
  -w, --watch             Watch mode based on the input file
  -h, --help              Display this message
```

Path of the input file(overrides the one in `kubb.config.js`)

```sh
kubb petStore.yaml
```

### Options

#### --config (-c)

Path to the Kubb config.

```sh
kubb -c kubb.config.ts
```

#### --log-level (-l)

Type of the logging(overrides the one in `kubb.config.js`)

`silent` will hide all information that is not relevant

`info` will show all information possible(not related to the PluginManager)

`debug` will show all information possible(related to the PluginManager), handy for seeing logs
 

```sh
kubb --log-level info
```

#### --watch (-w)

Watch mode based on the input file.

```sh
kubb -w
```

#### --version (-v)

Output the version number

```sh
kubb -v
```

#### --help (-h)

Display help for command

```sh
kubb -h
```


## Init
Create a starting `package.json` with dependencies needed to get started with generating files.

```mdx
kubb/1.2.1

Usage:
  $ kubb init

Options:
  -h, --help  Display this message
```

## Depended

- [`@kubb/core`](/plugins/core/)

See [getting-started](/introduction) on how to configure Kubb.
