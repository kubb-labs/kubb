---
layout: doc

title: \@kubb/plugin-swr
outline: deep
---

# @kubb/plugin-swr <a href="https://paka.dev/npm/@kubb/plugin-swr@latest/api">🦙</a>

With the SWR plugin you can create [SWR hooks](https://swr.vercel.app/) based on an operation in the Swagger
file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/plugin-swr
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/plugin-swr
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/plugin-swr
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/plugin-swr
```

:::

## Options

### output

#### output.path

Output to save the SWR hooks.

::: info

Type: `string` <br/>
Default: `'hooks'`

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  output: {
    path: './hooks',
  },
})
```

:::

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  output: {
    path: './hooks',
    exportAs: 'hooks',
  },
})
```

:::

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  output: {
    path: './hooks',
    extName: '.js',
  },
})
```

:::

#### output.exportType

Define what needs to exported, here you can also disable the export of barrel files

::: info
Type: `'barrel' | 'barrelNamed' | false` <br/>

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  output: {
    path: './hooks',
    exportType: 'barrel',
  },
})
```

:::

### group

Group the SWR hooks based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output
::: tip
When defining a custom output path, you should also update `output.path` to contain the same root path.
:::

::: v-pre
Relative path to save the grouped SWR hooks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `hooks/{{tag}}Controller` => `hooks/PetController` <br/>
Default: `'${output}/{{tag}}Controller'`
:::

#### group.exportAs

::: v-pre
Name to be used for the `export * as {{exportAs}} from './`
:::

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}SWRHooks'`
:::

::: info

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  output: {
    path: './hooks'
  },
  group: { type: 'tag', output: './hooks/{{tag}}Controller' },
})
```

:::

### client

#### client.importPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${client.importPath}'`.<br/>
It allow both relative and absolute path. the path will be applied as is,
so relative path shoule be based on the file being generated.

::: info

Type: `string` <br/>
Default: `'@kubb/plugin/client'`

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  client: {
    importPath: '../../client.ts',
  },
})
```

:::

### dataReturnType

ReturnType that needs to be used when calling client().

`'data'` will return ResponseConfig[data]. <br/>
`'full'` will return ResponseConfig.

::: info TYPE

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

Type: `'data' | 'full'` <br/>
Default: `'data'`

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  dataReturnType: 'data',
})
```

:::

### include

Array containing include parameters to include tags/operations/methods/paths.

::: info TYPE

```typescript [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Include>` <br/>

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  include: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```

:::

### exclude

Array containing exclude parameters to exclude/skip tags/operations/methods/paths.

::: info TYPE

```typescript [Exclude]
export type Exclude = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Exclude>` <br/>

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  exclude: [
    {
      type: 'tag',
      pattern: 'store',
    },
  ],
})
```

:::

### override

Array containing override parameters to override `options` based on tags/operations/methods/paths.

::: info TYPE

```typescript [Override]
export type Override = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
  options: PluginOptions
}
```

:::

::: info

Type: `Array<Override>` <br/>

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  override: [
    {
      type: 'tag',
      pattern: 'pet',
      options: {
        dataReturnType: 'full',
      },
    },
  ],
})
```

:::

### transformers

#### transformers.name

Override the name of the hook that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

```typescript twoslash
import { pluginSwr } from '@kubb/plugin-swr'

const plugin = pluginSwr({
  transformers: {
    name: (name) => {
      return `${ name }Hook`
    },
  },
})
```

:::

### templates

Make it possible to override one of the templates. <br/>

::: tip
See [templates](/reference/templates) for more information about creating templates.<br/>
Set `false` to disable a template.
:::

::: info TYPE

```typescript [Templates]
import type { Mutation, Query, QueryOptions } from '@kubb/plugin-swr/components'

export type Templates = {
  mutation: typeof Mutation.templates | false
  query: typeof Query.templates | false
  queryOptions: typeof QueryOptions.templates | false
}
```

:::

::: info

Type: `Templates` <br/>

```tsx twoslash
import { pluginSwr } from '@kubb/plugin-swr'
import { Query } from '@kubb/plugin-swr/components'
import React from 'react'

export const templates = {
  ...Query.templates,
} as const

const plugin = pluginSwr({
  templates: {
    query: templates,
  },
})
```

:::

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
        output: './hooks/{{tag}}Hooks'
      },
      dataReturnType: 'full',
      parser: 'zod',
    }),
  ],
})
```

## Links

- [SWR](https://swr.vercel.app/)
