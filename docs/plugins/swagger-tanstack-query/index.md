---
layout: doc

title: \@kubb/swagger-tanstack-query
outline: deep
---

# @kubb/swagger-tanstack-query <a href="https://paka.dev/npm/@kubb/swaggger-tanstack-query@latest/api">🦙</a>

::: tip
<img src="https://raw.githubusercontent.com/TanStack/query/main/media/repo-header.png" style="max-width: 30vw"/><br/>
Tanstack/query v5 is fully supported, see [Migrating to TanStack Query v5](https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5).<br/>

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
bun add @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb/swagger @kubb/swagger-client
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb/swagger @kubb/swagger-client
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb/swagger @kubb/swagger-client
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-tanstack-query @kubb/swagger-ts  @kubb/swagger @kubb/swagger-client
```

:::

## Options

### output

#### output.path

Output to save the [Tanstack Query](https://tanstack.com/query) hooks.
::: info
Type: `string` <br/>
Default: `'hooks'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
      output: {
        path: './hooks',
      },
    }),
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
      output: {
        exportAs: 'hooks',
      },
    }),
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
      output: {
        extName: '.js',
      },
    }),
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

Group the [Tanstack Query](https://tanstack.com/query) hooks based on the provided name.

#### group.type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### group.output

::: v-pre
Relative path to save the grouped [Tanstack Query](https://tanstack.com/query) hooks.
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
Default: `'{{tag}}Hooks'`
:::

::: info

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
        output: {
          path: './hooks',
        },
        group: { type: 'tag', output: './hooks/{{tag}}Hooks' },
      },
    ),
  ],
})
```

:::

### client

#### client.importPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${client.importPath}'`.<br/>
It allows both relative and absolute paths. the path will be applied as is, so the relative path should be based on the file being generated.

::: info
Type: `string` <br/>
Default: `'@kubb/swagger-client/client'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
        client: {
          importPath: '../../client.ts',
        },
      },
    ),
  ],
})
```

:::

### dataReturnType

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
import { defineConfig } from '@kubb/core'
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
import { defineConfig } from '@kubb/core'
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

### mutate

To disable mutations pass `false`.

::: info type

::: code-group

```typescript [Suspense]
type QueryOptions = {} |
```

:::

#### variablesType

Define the way of passing through the queryParams, headerParams and data.

`'mutate'` will use the `mutate` or `mutateAsync` function. <br/>
`'hook'` will use the `useMutation` hook.

::: info type

::: code-group

```typescript ['mutate']
const { mutate } = useDeletePet()

mutate({
  petId: 1,
})
```

```typescript ['hook']
const { mutate } = useDeletePet(1)

mutate()
```

:::

::: info

Type: `'mutate' | 'hook'` <br/>
Default: `'hook'`

::: code-group

```typescript ['mutate']
import { defineConfig } from '@kubb/core'
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
        mutate: {
          variablesType: 'mutate',
        },
      },
    ),
  ],
})
```

```typescript ['hook']
import { defineConfig } from '@kubb/core'
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
        mutate: {
          variablesType: 'hook',
        },
      },
    ),
  ],
})
```

:::

#### methods

Define which HttpMethods can be used for mutations <br/>

::: info type

::: info

Type: `'Array<HttpMethod>` <br/>
Default: `['post', 'put', 'delete']`

::: code-group

```typescript
import { defineConfig } from '@kubb/core'
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
        mutate: {
          methods: ['post', 'put', 'delete'],
        },
      },
    ),
  ],
})
```

:::

### parser

Which parser can be used before returning the data to `@tanstack/query`.

`'zod'` will use `@kubb/swagger-zod` to parse the data. <br/>

::: info type

::: code-group

```typescript ['zod']
export function getPetByIdQueryOptions() {
  const queryKey = getPetByIdQueryKey(petId)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client({
        method: 'get',
        url: `/pet/${petId}`,
      })

      return getPetByIdQueryResponseSchema.parse(res.data)
    },
  }
}
```

:::

::: info

Type: `'zod'` <br/>

::: code-group

```typescript ['zod']
import { defineConfig } from '@kubb/core'
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
        parser: 'zod',
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
import { defineConfig } from '@kubb/core'
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

When set, an 'infiniteQuery' hook will be added. <br/>
To disable infinite queries pass `false`.

::: info type

::: code-group

```typescript [Infinite]
type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
   * Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`
   * @default `'id'`
   */
  queryParam: string
  /**
   * Which field of the data will be used, set it to undefined when no cursor is known.
   */
  cursorParam: string | undefined
  /**
   * The initial value, the value of the first page.
   * @default `0`
   */
  initialPageParam: unknown
} | false
```

:::

::: info
Type: `Infinite` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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

#### infinite.queryParam

Specify the params key used for `pageParam`.<br/>
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`.

::: info
Type: `string` <br/>
Default: `'id'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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

#### infinite.initialPageParam

Specify the initial page param value.<br/>
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery` and will only be needed for v5.

::: info
Type: `string` <br/>
Default: `'0'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
        queryParam: 'id',
        initialPageParam: 0,
      },
    }),
  ],
})
```

:::

#### infinite.cursorParam

Which field of the data will be used, set it to undefined when no cursor is known.<br/>
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery` and will only be needed for v5.

::: info
Type: `string | undefined` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
        queryParam: 'id',
        cursorParam: 'nextCursor',
      },
    }),
  ],
})
```

:::

### query

Override some useQuery behaviours. <br/>
To disable queries pass `false`.

::: info type

::: code-group

```typescript [Query]
type Query = {
  /**
   * Customize the queryKey, here you can specify a suffix.
   */
  queryKey?: (key: unknown[]) => unknown[]
  methods: Array<HttpMethod>
} | false
```

:::

::: info
Type: `Query` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
    createSwaggerTanstackQuery({ query: {} }),
  ],
})
```

:::

#### query.queryKey

Customize the queryKey, here you can specify a suffix.

::: warning
When using a string you need to use `JSON.stringify`.
:::

::: info
Type: `(key: unknown[]) => unknown[]` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
      query: {
        queryKey: (key: string[]) => [JSON.stringify('SUFFIX'), ...key],
      },
    }),
  ],
})
```

:::

#### query.methods

Define which HttpMethods can be used for queries

::: warning
When using a string you need to use `JSON.stringify`.
:::

::: info
Type: `Array<HttpMethod>` <br/>
Default: `['get']` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
      query: {
        methods: ['get'],
      },
    }),
  ],
})
```

:::

### queryOptions

To disable queryOptions pass `false`.

::: info type

::: code-group

```typescript [Query]
type QueryOptions = {} | false
```

:::

::: info
Type: `QueryOptions` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
    createSwaggerTanstackQuery({ queryOptions: {} }),
  ],
})
```

:::

### suspense

When set, a suspenseQuery hook will be added. This will only work for v5 and react.

::: info type

::: code-group

```typescript [Suspense]
type Suspense = {} | false
```

:::

::: info
Type: `Suspense` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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
    createSwaggerTanstackQuery({ suspense: {} }),
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

Override the name of the hook that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string, type?: "function" | "type" | "file" ) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
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

### templates

Make it possible to override one of the templates. <br/>

::: tip
See [templates](/reference/templates) for more information about creating templates.<br/>
Set `false` to disable a template.
:::

::: info type

```typescript [Templates]
import type { Mutation, Query, QueryOptions, QueryKey } from '@kubb/swagger-tanstack-query/components'

export type Templates = {
  mutation: typeof Mutation.templates | false
  query: typeof Query.templates | false
  queryOptions: typeof QueryOptions.templates | false
  queryKey: typeof QueryKey.templates | false
}
```

:::

::: info

Type: `Templates` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
import createSwaggerTS from '@kubb/swagger-ts'

import { templates } from './CustomTemplate'

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
- [`@kubb/swagger-client`](/plugins/swagger-client/)

## Links

- [Tanstack Query](https://tanstack.com/query)
