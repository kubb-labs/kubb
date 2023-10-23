---
layout: doc

title: \@kubb/swagger-tanstack-query
outline: deep
---

# @kubb/swagger-tanstack-query <a href="https://paka.dev/npm/@kubb/swaggger-tanstack-query@latest/api">🦙</a>

::: tip
<img src="https://raw.githubusercontent.com/TanStack/query/main/media/repo-header.png" style="max-width: 30vw"/><br/>
Tanstack v5 is fully supported, see [Migrating to TanStack Query v5](https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5). <br/>

Just install v5 in your project and `Kubb` will check the `package.json` to see if you are using v4 or v5.

:::

With the Swagger Tanstack Query plugin you can create:

- [react-query](https://tanstack.com/query/latest/docs/react) hooks based on an operation in the Swagger file.
- [solid-query](https://tanstack.com/query/latest/docs/solid) primitives based on an operation in the Swagger file.
- [svelte-query](https://tanstack.com/query/latest/docs/svelte) primitives based on an operation in the Swagger file.
- [vue-query](https://tanstack.com/query/latest/docs/vue) hooks based on an operation in the Swagger file.


## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb swagger
```

:::

## Options

### output

Output to save the [Tanstack Query](https://tanstack.com/query) hooks.
::: info
Type: `string` <br/>
Default: `'hooks'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery({ output: './hooks' }),
  ],
})
```

:::

### groupBy

Group the [Tanstack Query](https://tanstack.com/query) hooks based on the provided name.

#### type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output

::: v-pre
Relative path to save the grouped [Tanstack Query](https://tanstack.com/query) hooks.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `hooks/{{tag}}Controller` => `hooks/PetController` <br/>
Default: `'${output}/{{tag}}Controller'`
:::

#### exportAs

::: v-pre
Name to be used for the `export * as {{exportAs}} from './`
:::

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Hooks'`
:::

::: info

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
      {
        output: './hooks',
        groupBy: { type: 'tag', output: './hooks/{{tag}}Hooks' },
      },
    ),
  ],
})
```

:::

### client <Badge type="danger" text="deprecated" />

Path to the client that will be used to do the API calls.
Relative to the root

::: info

Type: `string` <br/>
Default: `'@kubb/swagger-client/client'`

Deprecated. Use `clientImportPath` instead. It will be skipped if `clientImportPath` is provided.

:::

### clientImportPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${clientImportPath}'`.<br/>
It allow both relative and absolute path. the path will be applied as is,
so relative path shoule be based on the file being generated.

::: info
Type: `string` <br/>
Default: `'@kubb/swagger-client/client'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
      {
        clientImportPath: '../../client.ts',
      },
    ),
  ],
})
```

:::

### dataReturnType <Badge type="warning" text="experimental" />

ReturnType that needs to be used when calling client().

`'data'` will return ResponseConfig[data]. <br/>
`'full'` will return ResponseConfig.

::: info type

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

::: info

Type: `'data' | 'full'` <br/>
Default: `'data'`

::: code-group

```typescript ['data']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
      {
        dataReturnType: 'data',
      },
    ),
  ],
})
```

```typescript ['full']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
      {
        dataReturnType: 'full',
      },
    ),
  ],
})
```

:::

### framework

Framework to be generated for.

::: info

Type: `'react' | 'solid' | 'svelte' | 'vue'` <br/>
Default: `'react'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
      {
        framework: 'solid',
      },
    ),
  ],
})
```

:::

### infinite

When set, an infiniteQuery hooks will be added.

::: info type

::: code-group

```typescript [Infinite]
type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`
   * @default `'id'`
   */
  queryParam?: string
}
```

:::

::: info
Type: `Infinite` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery({ infinite: {} }),
  ],
})
```

:::

#### queryParam

Specify the params key used for `pageParam`.<br/>
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`.

::: info
Type: `string` <br/>
Default: `'id'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery({
      infinite: {
        queryParam: 'next_page',
      },
    }),
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
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
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
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
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

Override the name of the hook that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
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
    createSwaggerTanstackQuery(
      {
        transformers: {
          name: (name) => {
            return `${name}Hook`
          },
        },
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

- [Tanstack Query](https://tanstack.com/query)
