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

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod(
      {
        output: {
          path: './zod',
        },
      },
    ),
  ],
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

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod(
      {
        output: {
          path: './schemas',
        },
        group: { type: 'tag', output: './schemas/{{tag}}Schemas' },
      },
    ),
  ],
})
```

:::

### include

Array containing include parameters to include tags/operations/methods/paths.

::: info type

```typescript [Include]
export type Include = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Include>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod(
      {
        include: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
      },
    ),
  ],
})
```

:::

### exclude

Array containing exclude parameters to exclude/skip tags/operations/methods/paths.

::: info type

```typescript [Exclude]
export type Exclude = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<Exclude>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod(
      {
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
      },
    ),
  ],
})
```

:::

### override

Array containing override parameters to override `options` based on tags/operations/methods/paths.

::: info type

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

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerZod(
      {
        override: [
          {
            type: 'tag',
            pattern: 'pet',
            options: {
              output: {
                path: './custom',
              },
            },
          },
        ],
      },
    ),
  ],
})
```

:::

### typed

Use TypeScript(`@kubb/swagger-ts`) to add type annotation.

::: info

Type: `boolean` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'
import createSwaggerTs from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod(
      {
        typed: true,
      },
    ),
    createSwaggerTs(
      {},
    ),
  ],
})
```

:::

### dateType

Choose to use `date` or `datetime` as JavaScript `Date` instead of `string`.

::: info type

::: code-group

```typescript ['string']
date: string
```

```typescript ['date']
date: Date
```

:::

::: info

Type: `'string' | 'date'` <br/>
Default: `'string'`

```typescript ['string']
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod({
      dateType: 'string',
    }),
  ],
})
```

```typescript ['date']
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod({
      dateType: 'date',
    }),
  ],
})
```


:::

### transformers

#### transformers.name

Override the name of the Zod schema that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerZod from '@kubb/swagger-zod'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerZod(
      {
        transformers: {
          name: (name) => {
            return `${name}Client`
          },
        },
      },
    ),
  ],
})
```

:::

## Depended

- [`@kubb/swagger`](/plugins/swagger/)

## Links

- [Zod](https://zod.dev/)
