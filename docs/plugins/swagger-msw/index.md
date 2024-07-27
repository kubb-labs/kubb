---
layout: doc

title: \@kubb/swagger-msw
outline: deep
---

# @kubb/swagger-msw <a href="https://paka.dev/npm/@kubb/swagger-mws@latest/api">🦙</a>

::: tip
<img src="https://pbs.twimg.com/media/F9HHE4jXkAA_zm7?format=jpg&name=medium" style="max-width: 30vw"/><br/>
MSW v2 is fully supported, see [Migrating to MSW 2.0.0](https://mswjs.io/docs/migrations/1.x-to-2.x).<br/>

Just install v2 in your project and `Kubb` will check the `package.json` to see if you are using v1 or v2.

:::

With the MSW plugin you can use [MSW](https://mswjs.io/) to create API mocks based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-msw @kubb/swagger-ts @kubb/plugin-faker @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-msw @kubb/swagger-ts @kubb/plugin-faker @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-msw @kubb/swagger-ts @kubb/plugin-faker @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-msw @kubb/swagger-ts @kubb/plugin-faker @kubb/swagger
```

:::

## Options

### output

#### output.path

Relative path to save the MSW mocks.
When output is a file it will save all models inside that file else it will create a file per schema item.

::: info

Type: `string` <br/>
Default: `'mocks'`

```typescript twoslash
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
  output: {
    path: './mocks',
  },
})
```
:::

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
  output: {
    path: './mocks',
    exportAs: 'mocks',
  },
})
```
:::

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
  output: {
    path: './mocks',
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
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
  output: {
    path: './mocks',
    exportType: 'barrel',
  },
})
```

:::

### group

Group the MSW mocks based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output
::: tip
When defining a custom output path, you should also update `output.path` to contain the same root path.
:::

::: v-pre
Relative path to save the grouped MSW mocks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `mocks/{{tag}}Controller` => `mocks/PetController` <br/>
Default: `'${output}/{{tag}}Controller'`
:::

#### group.exportAs

Name to be used for the `export * as {{exportAs}} from './`

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Handlers'`
:::

::: info

```typescript twoslash
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
  output: {
    path: './mocks'
  },
  group: { type: 'tag', output: './mocks/{{tag}}Handlers' },
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
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
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
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
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
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
  override: [
    {
      type: 'tag',
      pattern: 'pet',
      options: {

      },
    },
  ],
})
```
:::

### transformers

#### transformers.name

Override the name of the MSW data that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string) => string` <br/>

```typescript twoslash
import { pluginMsw } from '@kubb/swagger-msw'

const plugin = pluginMsw({
  transformers: {
    name: (name) => {
      return `${name}Client`
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
import type { Handlers, Mock } from '@kubb/swagger-msw/components'

export type Templates = {
  handlers?: typeof Handlers.templates | false
  mock?: typeof Mock.templates | false
}
```

:::

::: info

Type: `Templates` <br/>

```tsx twoslash
import { pluginMsw } from '@kubb/swagger-msw'
import { Parser, File, Function } from '@kubb/react'
import { Mock } from '@kubb/swagger-msw/components'
import React from 'react'

export const templates = {
  ...Mock.templates,
} as const

const plugin = pluginMsw({
  templates: {
    mock: templates,
  },
})
```
:::

## Example

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginFaker} from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/swagger-ts'

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
    pluginFaker({
      output: {
        path: './mocks',
      },
      group: {
        type: 'tag',
        output: './mocks/{{tag}}Mocks',
      },
      dateType: 'date',
      unknownType: 'unknown',
      seed: [100],
    }),
  ],
})
```
## Links

- [MSW](https://mswjs.io/)
