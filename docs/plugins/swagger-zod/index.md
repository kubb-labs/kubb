---
layout: doc

title: \@kubb/swagger-zod
outline: deep
---

# @kubb/swagger-zod <a href="https://paka.dev/npm/@kubb/swagger-zod@latest/api">🦙</a>

With the Swagger Zod plugin you can use [Zod](https://zod.dev/) to validate your schema's based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-zod @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-zod @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-zod @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-zod @kubb/swagger
```

:::

## Options

### output

Relative path to save the Zod schemas.
When output is a file it will save all models inside that file else it will create a file per schema item.

::: info
Type: `string` <br/>
Default: `'zod'`

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  output: {
    path: './zod',
  },
})
```

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  output: {
    path: './zod',
    exportAs: 'schemas',
  },
})
```
:::

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension

::: info
Type: `string` <br/>

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  output: {
    path: './zod',
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
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  output: {
    path: './zod',
    exportType: 'barrel',
  },
})
```

:::

### group

Group the Zod schemas based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output

::: v-pre
Relative path to save the grouped Zod schemas.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `zod/{{tag}}Controller` => `zod/PetController` <br/>
Default: `'${output}/{{tag}}Controller'`
:::

#### group.exportAs

::: v-pre
Name to be used for the `export * as {{exportAs}} from './`
:::

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Schemas'`
:::

::: info

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  group: { type: 'tag', output: './schemas/{{tag}}Schemas' },
})
```
:::

### typed

Use TypeScript(`@kubb/swagger-ts`) to add type annotation.

::: info

Type: `boolean` <br/>

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  typed: true,
})
```
:::

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.<br/>
See [datetimes](https://zod.dev/?id=datetimes).
::: info TYPE

::: code-group

```typescript [false]
z.string()
```

```typescript ['string']
z.string().datetime()
```

```typescript ['stringOffset']
z.string().datetime({ offset: true })
```

```typescript ['stringLocal']
z.string().datetime({ local: true })
```

```typescript ['date']
z.date()
```

:::

::: info

Type: `false | 'string' | 'stringOffset' | 'stringLocal' | 'date'` <br/>
Default: `'string'`

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  dateType: 'string',
})
```
:::

### unknownType

Which type to use when the Swagger/OpenAPI file is not providing more information.

::: info TYPE

::: code-group

```typescript ['any']
z.any()
```

```typescript ['unknown']
z.unknown()
```

:::

::: info
Type: `'any' | 'unknown'` <br/>
Default: `'any'`

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  unknownType: 'any',
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
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
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
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
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
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
  override: [
    {
      type: 'tag',
      pattern: 'pet',
      options: {
        dateType: 'stringOffset',
      },
    },
  ],
})
```
:::


### transformers

#### transformers.name

Override the name of the Zod schema that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

```typescript twoslash
import { pluginZod } from '@kubb/swagger-zod'

const plugin = pluginZod({
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
import type { Operations } from '@kubb/swagger-zod/components'

export type Templates = {
  operations: typeof Operations.templates | false
}
```

:::

::: info

Type: `Templates` <br/>

```tsx twoslash
import { pluginZod } from '@kubb/swagger-zod'
import { Parser, File, Function } from '@kubb/react'
import { Operations } from '@kubb/swagger-zod/components'
import React from 'react'

export const templates = {
  ...Operations.templates,
} as const

const plugin = pluginZod({
  templates: {
    operations: templates,
  },
})
```
:::


## Example
```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginSwagger } from '@kubb/swagger'
import { pluginZod } from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginSwagger(),
    pluginZod({
      output: {
        path: './zod',
      },
      group: { type: 'tag', output: './schemas/{{tag}}Schemas' },
      typed: true,
      dateType: 'stringOffset',
      unknownType: 'unknown',
    }),
  ],
})
```

## Links

- [Zod](https://zod.dev/)
