---
layout: doc

title: \@kubb/plugin-client
outline: deep
---

# @kubb/plugin-client

With the Client plugin you can generate [Axios](https://axios-http.com/docs/intro) API controllers.

## Installation

::: code-group
```shell [bun]
bun add @kubb/plugin-client
```

```shell [pnpm]
pnpm add @kubb/plugin-client
```

```shell [npm]
npm install @kubb/plugin-client
```

```shell [yarn]
yarn add @kubb/plugin-client
```
:::

## Options

### output

#### output.path

Output to save the generated files.

|           |             |
|----------:|:------------|
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'clients'` |

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './axios',
  },
})
```

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`.

|           |                |
|----------:|:---------------|
|     Type: | `string`       |
| Required: | `false`        |

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './axios',
    exportAs: 'clients',
  },
})
```

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension.

|           |                    |
|----------:|:-------------------|
|     Type: | `KubbFile.Extname` |
| Required: | `false`            |

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './axios',
    extName: '.js',
  },
})
```

#### output.exportType

Define what needs to exported, here you can also disable the export of barrel files.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `'barrel' \| 'barrelNamed' \| false ` |
| Required: | `false`                               |
|  Default: | `'barrelNamed'`                       |

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './client',
    exportType: 'barrel',
  },
})
```

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './client',
    banner: '/* eslint-disable no-alert, no-console */'
  },
})
```

#### output.footer
Add a footer text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './client',
    footer: ''
  },
})
```

### group

Group the clients based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

#### group.output
> [!TIP]
> When defining a custom output path, you should also update `output.path` to contain the same root path.


::: v-pre
Relative path to save the grouped clients.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre

|           |                               |
|----------:|:------------------------------|
|     Type: | `string`                      |
| Required: | `false`                       |
|  Default: | `'${output}/{{tag}}Controller'` |

:::

#### group.exportAs

::: v-pre
Name to be used for the `export * as {{exportAs}} from './`
:::

::: v-pre

|           |                    |
|----------:|:-------------------|
|     Type: | `string`           |
| Required: | `false`            |
|  Default: | `'{{tag}}Service'` |

:::

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './clients/axios'
  },
  group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
})
```

### importPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${client.importPath}'`.<br/>
It allow both relative and absolute path. the path will be applied as is,
so relative path should be based on the file being generated.

|           |                                |
|----------:|:-------------------------------|
|     Type: | `string`                       |
| Required: | `false`                         |
|  Default: | `'@kubb/plugin-client/client'` |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  client: {
    importPath: '../../client.ts',
  },
})
```

### operations

Create `operations.ts` file with all operations grouped by methods.

|           |           |
|----------:|:----------|
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  operations: true
})
```

### dataReturnType

ReturnType that needs to be used when calling client().

`'data'` will return ResponseConfig[data]. <br/>
`'full'` will return ResponseConfig.

::: code-group

```typescript ['data']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>["data"]> {
  ...
}
```

```typescript ['full']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

:::

|           |                    |
|----------:|:-------------------|
|     Type: | `'data' \| 'full'` |
| Required: | `false`            |
|  Default: | `'data'`           |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  dataReturnType: 'data'
})
```

### pathParamsType

How to pass your pathParams.

`'object'` will return the pathParams as an object. <br/>
`'inline'` will return the pathParams as comma separated params.

::: code-group

```typescript ['object']
export async function getPetById<TData>(
  { petId }: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

```typescript ['inline']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

:::


|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'data'`                |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  pathParamsType: 'object',
})
```

### parser
Which parser can be used before returning the data.
`'zod'` will use `@kubb/plugin-zod` to parse the data.

|           |                     |
|----------:|:--------------------|
|     Type: | `'client' \| 'zod'` |
| Required: | `false`             |
|  Default: | `'client'`          |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  parser: 'zod'
})
```

### include

Array containing include parameters to include tags/operations/methods/paths.

```typescript [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```


|           |                  |
|----------:|:-----------------|
|     Type: | `Array<Include>` |
| Required: | `false`          |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  include: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```

### exclude

Array containing exclude parameters to exclude/skip tags/operations/methods/paths.

```typescript [Exclude]
export type Exclude = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

|           |                  |
|----------:|:-----------------|
|     Type: | `Array<Exclude>` |
| Required: | `false`          |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  exclude: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```

### override

Array containing override parameters to override `options` based on tags/operations/methods/paths.


```typescript [Override]
export type Override = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
  options: PluginOptions
}
```

|           |                   |
|----------:|:------------------|
|     Type: | `Array<Override>` |
| Required: | `false`           |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  override: [
    {
      type: 'tag',
      pattern: 'pet',
      options: {
        dataReturnType: "full"
      },
    },
  ],
})
```

### transformers

#### transformers.name
Customize the names based on the type that is provided by the plugin.


|           |                                                                     |
|----------:|:--------------------------------------------------------------------|
|     Type: | `(name: string, type?: "function"  \| "type" \| "file" ) => string` |
| Required: | `false`                                                             |


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  transformers: {
    name: (name) => {
      return `${name}Client`
    },
  },
})
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
      },
      group: {
        type: 'tag',
        output: './clients/axios/{{tag}}Service',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      pathParamsType: "object",
      dataReturnType: 'full',
    }),
  ],
})
```

## Links

- [Axios](https://axios-http.com/docs/intro)
