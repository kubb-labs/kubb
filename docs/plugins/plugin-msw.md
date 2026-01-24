---
layout: doc

title: \@kubb/plugin-msw
outline: deep
---

# @kubb/plugin-msw

Generate [MSW](https://mswjs.io/) API mock handlers from your OpenAPI schema.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/plugin-msw
```

```shell [pnpm]
pnpm add -D @kubb/plugin-msw
```

```shell [npm]
npm install --save-dev @kubb/plugin-msw
```

```shell [yarn]
yarn add -D @kubb/plugin-msw
```

:::

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that contains the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'handlers'` |

#### output.barrelType

Specify what to export and optionally disable barrel file generation.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ./core/barrelTypes.md-->

#### output.banner
Add a banner comment at the top of every generated file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

#### output.footer
Add a footer comment at the end of every generated file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

### handlers
Create `handlers.ts` file with all handlers grouped by methods.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

#### output.override
<!--@include: ./core/outputOverride.md-->

### contentType
<!--@include: ./core/contentType.md-->

### baseURL
<!--@include: ../plugin-client/baseURL.md-->

### group
<!--@include: ./core/group.md-->

#### group.type
Specify the property to group files by.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ./core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### parser
Which parser should be used before returning the data to the `Response` of MSW.

|           |                     |
|----------:|:--------------------|
|     Type: | `'data' \| 'faker'` |
| Required: | `false`             |
|  Default: | `'data'`            |

- `'faker'` will use `@kubb/plugin-faker` to generate the data for the response.
- `'data'` will use your custom data to generate the data for the response.

### include
<!--@include: ./core/include.md-->

### exclude
<!--@include: ./core/exclude.md-->

### override
<!--@include: ./core/override.md-->

### generators <img src="../public/icons/experimental.svg"/>
<!--@include: ./core/generators.md-->

|           |                               |
|----------:|:------------------------------|
|     Type: | `Array<Generator<PluginMsw>>` |
| Required: | `false`                       |


### transformers
<!--@include: ./core/transformers.md-->

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
import { pluginMsw} from '@kubb/plugin-msw'
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
    pluginMsw({
      output: {
        path: './mocks',
        barrelType: 'named',
        banner: '/* eslint-disable no-alert, no-console */',
        footer: ''
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Service`,
      },
      handlers: true
    }),
  ],
})
```
## See Also

- [MSW](https://mswjs.io/)
