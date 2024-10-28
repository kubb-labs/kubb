---
layout: doc

title: \@kubb/plugin-swr
outline: deep
---

# @kubb/plugin-swr

With the SWR plugin you can create [SWR hooks](https://swr.vercel.app/) based on an operation.

## Installation

::: code-group

```shell [bun]
bun add @kubb/plugin-swr
```

```shell [pnpm]
pnpm add @kubb/plugin-swr
```

```shell [npm]
npm install @kubb/plugin-swr
```

```shell [yarn]
yarn add @kubb/plugin-swr
```

:::

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'hooks'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

|           |                             |
|----------:|:----------------------------|
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

#### output.footer
Add a footer text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

### group
<!--@include: ../core/group.md-->

#### group.type
Define a type where to group the files on.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### client

#### client.importPath
<!--@include: ../plugin-client/importPath.md-->

#### client.dataReturnType
<!--@include: ../plugin-client/dataReturnType.md-->

### paramsType
<!--@include: ../plugin-client/pathParamsType.md-->

### pathParamsType
<!--@include: ../plugin-client/pathParamsType.md-->

### parser
<!--@include: ../plugin-client/parser.md-->

### query

#### query.key
|           |                                 |
|----------:|:--------------------------------|
|     Type: | `(key: unknown[]) => unknown[]` |
| Required: | `true`                          |


#### query.methods
|           |                     |
|----------:|:--------------------|
|     Type: | `Array<HttpMethod>` |
| Required: | `false`             |


#### query.importPath
|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'swr'`  |


### mutation

#### mutation.key
|           |                                 |
|----------:|:--------------------------------|
|     Type: | `(key: unknown[]) => unknown[]` |
| Required: | `true`                          |


#### mutation.methods
|           |                     |
|----------:|:--------------------|
|     Type: | `Array<HttpMethod>` |
| Required: | `false`             |


#### mutation.importPath
|           |                           |
|----------:|:--------------------------|
|     Type: | `string`                  |
| Required: | `false`                   |
|  Default: | `'swr/mutation'` |


### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                               |
|----------:|:------------------------------|
|     Type: | `Array<Generator<PluginSwr>>` |
| Required: | `false`                       |


### transformers
<!--@include: ../core/transformers.md-->

#### transformers.name
Customize the names based on the type that is provided by the plugin.

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                                                       |

```typescript
type ResolveType = 'file' | 'function' | 'type' | 'const'
```

## Example

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginSwr } from '@kubb/plugin-swr'
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
    pluginSwr({
      output: {
        path: './hooks',
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Hooks`,
      },
      client: {
        dataReturnType: 'full',
      },
      parser: 'zod',
    }),
  ],
})
```

## Links

- [SWR](https://swr.vercel.app/)
