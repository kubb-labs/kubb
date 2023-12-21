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
bun add @kubb/swagger-msw @kubb/swagger-ts @kubb/swagger-faker @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-msw @kubb/swagger-ts @kubb/swagger-faker @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-msw @kubb/swagger-ts @kubb/swagger-faker @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-msw @kubb/swagger-ts @kubb/swagger-faker @kubb/swagger
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

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
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
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
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
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
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

Define what needs to exported, here you can also disable the export of barrel files

::: info
Type: `'barrel' | 'barrelNamed' | false` <br/>

:::

### group

Group the MSW mocks based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output

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

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
      {
        output: {
          path: './mocks',
        },
        group: { type: 'tag', output: './mocks/{{tag}}Handlers' },
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
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
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
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
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
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
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

### transformers

#### transformers.name

Override the name of the MSW data that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
      {
        output: {
          path: './mocks',
        },
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

### templates

Make it possible to override one of the templates. <br/>

::: tip
See [templates](/reference/templates) for more information about creating templates.<br/>
Set `false` to disable a template.
:::

::: info type

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

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

import { templates } from './CustomTemplate'

import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
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
    createSwaggerFaker({}),
    createSwaggerMsw(
      {
        output: {
          path: './mocks',
        },
        templates,
      },
    ),
  ],
})
```

:::

## Depended

- [`@kubb/swagger`](/plugins/swagger/)
- [`@kubb/swagger-ts`](/plugins/swagger-ts/)
- [`@kubb/swagger-faker`](/plugins/swagger-faker/)

## Links

- [MSW](https://mswjs.io/)
