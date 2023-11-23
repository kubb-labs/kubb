---
layout: doc

title: Config
outline: deep
---

# CLI

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/cli
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/cli
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/cli
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/cli
```

:::

## Usage

```sh
kubb --config kubb.config.js
```

```mdx
kubb/2.0.0

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

## Generate

::: tip
`kubb generate` and `kubb` are the same.
:::

```mdx
kubb/2.0.0

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

::: info
Path to the Kubb config.

```sh
kubb --config kubb.config.ts
```

:::

#### --log-level (-l)

::: info
Type of the logging(overrides the one in `kubb.config.js`).

`silent` will hide all information that is not relevant

`info` will show all information possible(not related to the PluginManager)

`debug` will show all information possible(related to the PluginManager), handy for seeing logs

```sh
kubb --log-level info
```

:::

#### --watch (-w)

Watch mode based on the input file.
::: info

```sh
kubb --watch
```

:::

#### --version (-v)

Output the version number.
::: info

```sh
kubb --version
```

:::

#### --help (-h)

Display the help.
::: info

```sh
kubb --help
```

:::
