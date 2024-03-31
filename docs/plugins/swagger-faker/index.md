---
layout: doc

title: \@kubb/swagger-faker
outline: deep
---

# @kubb/swagger-faker <a href="https://paka.dev/npm/@kubb/swagger-faker@latest/api">🦙</a>

With the Swagger Faker plugin, you can use [Faker](https://fakerjs.dev/) to create mocks based on a Swagger file.

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

#### output.path

Relative path to save the Faker mocks.
When output is a file it will save all models inside that file else it will create a file per schema item.

::: info
Type: `string` <br/>
Default: `'mocks'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        output: {
          path: './mocks',
        },
      },
    ),
  ],
})
```

:::

#### output.exportAs

Name to be used for the `export * as {{exportAs}} from './'`

::: info
Type: `string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        output: {
          exportAs: 'mocks',
        },
      },
    ),
  ],
})
```

:::

#### output.extName

Add an extension to the generated imports and exports, default it will not use an extension

::: info
Type: `string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        output: {
          extName: '.js',
        },
      },
    ),
  ],
})
```

:::

#### output.exportType

Define what needs to be exported, you can also disable the export of barrel files

::: info
Type: `'barrel' | 'barrelNamed' | false` <br/>

:::

### group

Group the Faker mocks based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output

::: v-pre
Relative path to save the grouped Faker mocks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `mocks/{{tag}}Controller` => `mocks/PetController` <br/>
Default: `${output}/{{tag}}Controller`
:::

#### group.exportAs

Name to be used for the `export * as {{exportAs}} from './`

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Mocks'`
:::

::: info

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        output: {
          path: './mocks',
        },
        group: {
          type: 'tag',
          output: './mocks/{{tag}}Mocks',
        },
      },
    ),
  ],
})
```

:::

### include

An array containing include parameters to include tags/operations/methods/paths.

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
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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

An array containing exclude parameters to exclude/skip tags/operations/methods/paths.

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
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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

An array containing override parameters to override `options` based on tags/operations/methods/paths.

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
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        override: [
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

#### transformers.name

Override the name of the faker data that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        output: {
          path: './mocks',
        },
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
faker.string.alpha
```

```typescript ['date']
faker.date.anytime()
```

:::

::: info
Type: `'string' | 'date'` <br/>
Default: `'string'`

:::

::: code-group

```typescript ['string']
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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

### unknownType

Which type to use when the Swagger/OpenAPI file is not providing more information.

::: info type

::: code-group

```typescript ['any']
any
```

```typescript ['unknown']
unknown
```

:::

::: info
Type: `'any' | 'unknown'` <br/>
Default: `'any'`

:::

::: code-group

```typescript ['any']
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        unknownType: 'any',
      },
    ),
  ],
})
```

```typescript ['unknown']
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        unknownType: 'unknown',
      },
    ),
  ],
})
```

:::

### seed

The use of Seed is intended to allow for consistent values in a test.

::: info
Type: `'number' | 'number[]'` <br/>

:::

::: code-group

```typescript
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
        seed: [222],
      },
    ),
  ],
})
```

:::

## Depended

- [`@kubb/swagger`](/plugins/swagger/)
- [`@kubb/swagger-ts`](/plugins/swagger-ts/)

## Links

- [Faker](https://fakerjs.dev/)
