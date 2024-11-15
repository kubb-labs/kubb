---
layout: doc

title: \@kubb/plugin-oas
outline: deep
---

# @kubb/plugin-oas


## Installation
::: code-group

```shell [bun]
bun add @kubb/plugin-oas
```

```shell [pnpm]
pnpm add @kubb/plugin-oas
```

```shell [npm]
npm install @kubb/plugin-oas
```

```shell [yarn]
yarn add @kubb/plugin-oas
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
|  Default: | `'schemas'` |

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
|     Type: | `string` |
| Required: | `false`                               |

#### output.footer
Add a footer text at the end of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

### validate

Validate your [`input`](/getting-started/configure#input) based on `@readme/openapi-parser`.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `true`    |

### serverIndex

Which server to use from the array of `servers.url[serverIndex]`

> [!TIP]
> Defining the server here will make it possible to use that endpoint as `baseURL` in other plugins.

|           |          |
|----------:|:---------|
|     Type: | `number` |
| Required: | `false`  |

- `0` will return `http://petstore.swagger.io/api`
- `1` will return `http://localhost:3000`

::: code-group

```yaml [OpenAPI]
openapi: 3.0.3
info:
  title: Swagger Example
  description:
  license:
    name: Apache 2.0
    url: http://www.apache.org/licenses/LICENSE-2.0.html
  version: 1.0.0
servers:
- url: http://petstore.swagger.io/api
- url: http://localhost:3000
```

```typescript [serverIndex 0]
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({ serverIndex: 0 })
```

```typescript [serverIndex 1]
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({ serverIndex: 1 })
```
:::

### contentType

Define which contentType should be used.
By default, this is set based on the contentType being found.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `'application/json' \| (string & {})` |
| Required: | `false`                               |


### oasClass <img src="/icons/experimental.svg"/>
Override some behaviour of the Oas class instance, see `@kubb/oas`.

|           |                                |
|----------:|:-------------------------------|
|     Type: | `typeof Oas`                             |
| Required: | `false`                        |


### generators <img src="/icons/experimental.svg"/>
Define some generators to create files based on the operation and/or schema. All plugin are using generators to create files based on the OperationGenerator and SchemaGenerators. An empty array will result in no schema's being generated, in v2 of Kubb we used `output: false`.

See [Generators](/knowledge-base/generators) for more information on how to use generators.

::: info

```typescript
import { pluginOas, createGenerator, PluginOas } from '@kubb/plugin-oas'
import { jsonGenerator } from '@kubb/plugin-oas/generators';

export const customGenerator = createGenerator<PluginOas>({
  name: 'plugin-oas',
  async schema({ schema, name, instance }) {
    return []
  }
})

const plugin = pluginOas({
  generators: [jsonGenerator,  customGenerator]
})
```
:::

## Example

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas({
      validate: true,
      output: {
        path: './json',
      },
      serverIndex: 0,
      contentType: 'application/json',
    }),
  ],
})
```

## Links

- [Oas](https://github.com/readmeio/oas)
