---
layout: doc

title: \@kubb/swagger-faker
outline: deep
---

# @kubb/swagger-faker <a href="https://paka.dev/npm/@kubb/swagger-faker@latest/api">🦙</a>

With the Swagger Faker plugin you can use [Faker](https://fakerjs.dev/) to create mocks based on a Swagger file.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-faker @kubb/swagger-ts @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-faker @kubb/swagger-ts @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-faker @kubb/swagger-ts @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-faker @kubb/swagger-ts @kubb/swagger
```

:::

## Options

### output

Relative path to save the Faker mocks.
When output is a file it will save all models inside that file else it will create a file per schema item.

::: info
Type: `string` <br/>
Default: `'mocks'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
    createSwaggerFaker(
      {
        output: './mocks',
      },
    ),
  ],
})
```

:::

### groupBy

Group the Faker mocks based on the provided name.

#### type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output

::: v-pre
Relative path to save the grouped Faker mocks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `mocks/{{tag}}Controller` => `mocks/PetController` <br/>
Default: `${output}/{{tag}}Controller`
:::

#### exportAs

Name to be used for the `export * as {{exportAs}} from './`

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Mocks'`
:::

::: info

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
    createSwaggerFaker(
      {
        output: './mocks',
        groupBy: { type: 'tag', output: './mocks/{{tag}}Mocks' },
      },
    ),
  ],
})
```

:::

### skipBy

Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

::: info type

```typescript [SkipBy]
export type SkipBy = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<SkipBy>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
    createSwaggerFaker(
      {
        skipBy: [
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

### overrideBy

Array containing overrideBy paramaters to override `options` based on tags/operations/methods/paths.

::: info type

```typescript [OverrideBy]
export type OverrideBy = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
  options: PluginOptions
}
```

:::

::: info

Type: `Array<OverrideBy>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
    createSwaggerFaker(
      {
        overrideBy: [
          {
            type: 'tag',
            pattern: 'pet',
            options: {
              output: './custom',
            },
          },
        ],
      },
    ),
  ],
})
```

:::

### transformers

#### name

Override the name of the faker data that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
    createSwaggerFaker(
      {
        output: './mocks',
        transformers: {
          name: (name) => {
            return `${name}Mock`
          },
        },
      },
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

:::

::: code-group

```typescript ['string']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
    createSwaggerFaker(
      {
        dateType: 'string',
      },
    ),
  ],
})
```

```typescript ['date']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerTS from '@kubb/swagger-ts'

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
    createSwaggerFaker(
      {
        dateType: 'date',
      },
    ),
  ],
})
```

:::

## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-ts`](/plugins/swagger-ts)

## Links

- [Faker](https://fakerjs.dev/)
