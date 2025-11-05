---
layout: doc

title: \@kubb/plugin-client
outline: deep
---

# @kubb/plugin-client

The Client plugin enables you to generate API controllers, simplifying the process of handling API requests and improving integration between frontend and backend services.

By default, we are using [Axios](https://axios-http.com/docs/intro) but you can also add your own client, see [Use of Fetch](/knowledge-base/fetch).

## Installation

::: code-group
```shell [bun]
bun add -d @kubb/plugin-client
```

```shell [pnpm]
pnpm add -D @kubb/plugin-client
```

```shell [npm]
npm install --save-dev @kubb/plugin-client
```

```shell [yarn]
yarn add -D @kubb/plugin-client
```
:::

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'clients'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

#### output.footer
Add a footer text at the end of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

### contentType
<!--@include: ../core/contentType.md-->

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

### importPath
<!--@include: ../plugin-client/importPath.md-->

### operations
Create `operations.ts` file with all operations grouped by methods.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dataReturnType
<!--@include: ../plugin-client/dataReturnType.md-->

### urlType
Export urls that are used by operation x

|           |                     |
|----------:|:--------------------|
|     Type: | `'export' \| false` |
| Required: | `false`             |
|  Default: | `false`             |

- `'export'` will make them part of your barrel file
- `false` will not make them exportable

```typescript
export function getGetPetByIdUrl(petId: GetPetByIdPathParams['petId']) {
  return `/pet/${petId}` as const
}
```

### paramsType
<!--@include: ../plugin-client/paramsType.md-->

### paramsCasing
<!--@include: ../plugin-client/paramsCasing.md-->

### pathParamsType
<!--@include: ../plugin-client/pathParamsType.md-->

### parser
<!--@include: ../plugin-client/parser.md-->

### client
<!--@include: ../plugin-client/client.md-->

### bundle

Control whether the HTTP client runtime is copied into the generated `.kubb` directory.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

- `true` will add a `.kubb/fetcher.ts` file containing the selected client template (fetch or axios) so the generated clients stay self-contained.
- `false` keeps the generated clients slim by importing the shared runtime from `@kubb/plugin-client/clients/{client}`.
- You can still override the behaviour by providing a custom `client.importPath`.

### baseURL
<!--@include: ../plugin-client/baseURL.md-->

### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                                                                              |
|----------:|:-----------------------------------------------------------------------------|
|     Type: | `Array<Generator<PluginClient>>`                                             |
| Required: | `false`                                                                      |


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

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

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
    pluginClient({
      output: {
        path: './clients/axios',
        barrelType: 'named',
        banner: '/* eslint-disable no-alert, no-console */',
        footer: ''
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Service`,
      },
      transformers: {
        name: (name, type) => {
          return `${name}Client`
        },
      },
      operations: true,
      parser: 'client',
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      pathParamsType: "object",
      dataReturnType: 'full',
      client: 'axios'
    }),
  ],
})
```

## Links

- [Axios](https://axios-http.com/docs/intro)
