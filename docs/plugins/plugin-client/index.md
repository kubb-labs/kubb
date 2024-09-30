---
layout: doc

title: \@kubb/plugin-client
outline: deep
---

# @kubb/plugin-client

The Client plugin enables you to generate [Axios](https://axios-http.com/docs/intro) API controllers, simplifying the process of handling API requests and improving integration between frontend and backend services.

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

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  output: {
    path: './axios',
    barrelType: 'named',
    banner: '/* eslint-disable no-alert, no-console */',
    footer: ''
  },
})
```

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


```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  group: {
    type: 'tag',
    name: (ctx) => `${ctx.group}Controller`
  },
})
```

### importPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${client.importPath}'`.<br/>
It allows both relative and absolute path but be aware that we will not change the path.

> [!TIP]
> Use of default exports as `export default client = ()=>{}`

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

ReturnType that will be used when calling the client.

|           |                    |
|----------:|:-------------------|
|     Type: | `'data' \| 'full'` |
| Required: | `false`            |
|  Default: | `'data'`           |


- `'data'` will return ResponseConfig[data]. <br/>
- `'full'` will return ResponseConfig.

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

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  dataReturnType: 'data'
})
```

### pathParamsType

How to pass your pathParams.

|           |                        |
|----------:|:-----------------------|
|     Type: | `'object' \| 'inline'` |
| Required: | `false`                |
|  Default: | `'data'`                |


- `'object'` will return the pathParams as an object. <br/>
- `'inline'` will return the pathParams as comma separated params.

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

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  pathParamsType: 'object',
})
```

### parser
Which parser can be used before returning the data.

|           |                     |
|----------:|:--------------------|
|     Type: | `'client' \| 'zod'` |
| Required: | `false`             |
|  Default: | `'client'`          |

- `'zod'` will use `@kubb/plugin-zod` to parse the data.

```typescript
import { pluginClient } from '@kubb/plugin-client'

const plugin = pluginClient({
  parser: 'zod'
})
```

### include
<!--@include: ../core/include.md-->

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
<!--@include: ../core/exclude.md-->

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
<!--@include: ../core/override.md-->

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
        name: ({ group }) => `${group}Service`,
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
