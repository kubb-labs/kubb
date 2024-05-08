---
layout: doc

title: \@kubb/swagger-tanstack-query
outline: deep
---

# @kubb/swagger-tanstack-query <a href="https://paka.dev/npm/@kubb/swaggger-tanstack-query@latest/api">🦙</a>

::: tip
<img src="https://raw.githubusercontent.com/TanStack/query/main/media/repo-header.png" style="max-width: 30vw"/><br/>
Tanstack/query v5 is fully supported,
see [Migrating to TanStack Query v5](https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5).<br/>

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
bun add @kubb/swagger-tanstack-query @kubb/swagger-ts @kubb/swagger @kubb/swagger-client
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-tanstack-query @kubb/swagger-ts @kubb/swagger @kubb/swagger-client
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-tanstack-query @kubb/swagger-ts @kubb/swagger @kubb/swagger-client
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-tanstack-query @kubb/swagger-ts @kubb/swagger @kubb/swagger-client
```

:::

## Options

### output

#### output.path

Output to save the [Tanstack Query](https://tanstack.com/query) hooks.
::: info
Type: `string` <br/>
Default: `'hooks'`

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  output: {
    path: './hooks',
    exportType: 'barrel',
  },
})
```

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

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  group: { type: 'tag', output: './hooks/{{tag}}Hooks' },
})
```

:::

### client

#### client.importPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${client.importPath}'`.<br/>
It allows both relative and absolute paths. the path will be applied as is, so the relative path should be based on the
file being generated.

::: info
Type: `string` <br/>
Default: `'@kubb/swagger-client/client'`

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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

::: info

Type: `'data' | 'full'` <br/>
Default: `'data'`

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  dataReturnType: 'data',
})
```

:::

### parser

Which parser can be used before returning the data to `@tanstack/query`.

`'zod'` will use `@kubb/swagger-zod` to parse the data. <br/>

::: info TYPE

::: code-group

```typescript ['zod']
export function getPetByIdQueryOptions() {
  const queryKey = getPetByIdQueryKey(petId)
  return {
    queryKey,
    queryFn: async () => {
      const res = await client({
        method: 'get',
        url: `/pet/${ petId }`,
      })

      return getPetByIdQueryResponseSchema.parse(res.data)
    },
  }
}
```

:::

::: info

Type: `'zod'` <br/>

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  parser: 'zod',
})
```

:::

### framework

Framework to be generated for.

::: info

Type: `'react' | 'solid' | 'svelte' | 'vue'` <br/>
Default: `'react'`

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  framework: 'react',
})
```

:::

### infinite

When set, an 'infiniteQuery' hook will be added. <br/>
To disable infinite queries pass `false`.

::: info TYPE

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

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  infinite: {}
})
```

:::

#### infinite.queryParam

Specify the params key used for `pageParam`.<br/>
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery`.

::: info
Type: `string` <br/>
Default: `'id'`

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  infinite: {
    queryParam: 'next_page',
  }
})
```

:::

#### infinite.initialPageParam

Specify the initial page param value.<br/>
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery` and will only be needed for v5.

::: info
Type: `string` <br/>
Default: `'0'`

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  infinite: {
    queryParam: 'next_page',
    initialPageParam: 0,
  }
})
```

:::

#### infinite.cursorParam

Which field of the data will be used, set it to undefined when no cursor is known.<br/>
Used inside `useInfiniteQuery`, `createInfiniteQueries`, `createInfiniteQuery` and will only be needed for v5.

::: info
Type: `string | undefined` <br/>

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  infinite: {
    queryParam: 'next_page',
    cursorParam: 'nextCursor',
  }
})
```

:::

### query

Override some useQuery behaviours. <br/>
To disable queries pass `false`.

::: info TYPE

::: code-group

```typescript [Query]
type Query = {
  /**
   * Customize the queryKey, here you can specify a suffix.
   */
  queryKey?: (key: unknown[]) => unknown[]
  methods: Array<HttpMethod>
  importPath?: string
} | false
```

:::

::: info
Type: `Query` <br/>

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  query: {}
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

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  query: {
    queryKey: (key) => [ JSON.stringify('SUFFIX'), ...key ],
  }
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

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  query: {
    methods: [ 'get' ],
  }
})
```

:::

#### query.importPath

Path to the useQuery that will be used to do the useQuery functionality.
It will be used as `import { useQuery } from '${hook.importPath}'`.
It allows both relative and absolute path.
the path will be applied as is, so relative path should be based on the file being generated.

::: info
Type: `string` <br/>
Default: `'@tanstack/react-query'` if 'framework' is set to 'react'

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  query: {
    importPath: "@kubb/react-query"
  }
})
```

:::

### queryOptions

To disable queryOptions pass `false`.

::: info TYPE

::: code-group

```typescript [Query]
type QueryOptions = {} | false
```

:::

::: info
Type: `QueryOptions` <br/>

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  queryOptions: {}
})
```

:::

### suspense

When set, a suspenseQuery hook will be added. This will only work for v5 and react.

::: info TYPE

::: code-group

```typescript [Suspense]
type Suspense = {} | false
```

:::

::: info
Type: `Suspense` <br/>

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  suspense: {}
})
```
:::

### mutate

To disable mutations pass `false`.

::: info TYPE

::: code-group

```typescript [Mutate]
type Mutate = {
  variablesType: 'mutate' | 'hook'
  methods: Array<HttpMethod>
} | false
```

:::

#### variablesType

Define the way of passing through the queryParams, headerParams and data.

`'mutate'` will use the `mutate` or `mutateAsync` function. <br/>
`'hook'` will use the `useMutation` hook.

::: info TYPE

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

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  mutate: {
    variablesType: 'mutate',
    methods: [ 'post', 'put', 'delete' ],
  },
})
```

:::

#### methods

Define which HttpMethods can be used for mutations <br/>

::: info TYPE

::: info

Type: `'Array<HttpMethod>` <br/>
Default: `['post', 'put', 'delete']`

```typescript twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
  mutate: {
    variablesType: 'hook',
    methods: [ 'post', 'put', 'delete' ],
  },
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
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'

const plugin = pluginTanstackQuery({
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
import type { Mutation, Query, QueryOptions, QueryKey, QueryImports } from '@kubb/swagger-tanstack-query/components'

export type Templates = {
  mutation: typeof Mutation.templates | false
  query: typeof Query.templates | false
  queryOptions: typeof QueryOptions.templates | false
  queryKey: typeof QueryKey.templates | false
  queryImports: typeof QueryImports.templates | false
}
```

:::

::: info

Type: `Templates` <br/>

```tsx twoslash
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { Query } from '@kubb/swagger-tanstack-query/components'
import React from 'react'

export const templates = {
  ...Query.templates,
} as const

const plugin = pluginTanstackQuery({
  templates: {
    query: templates,
  },
})
```

:::

## Example

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginSwagger } from '@kubb/swagger'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginTs } from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginSwagger(),
    pluginTs(),
    pluginTanstackQuery({
      output: {
        path: './hooks',
      },
      group: {
        type: 'tag',
        output: './hooks/{{tag}}Hooks'
      },
      framework: 'react',
      dataReturnType: 'full',
      mutate: {
        variablesType: 'hook',
        methods: [ 'post', 'put', 'delete' ],
      },
      infinite: {
        queryParam: 'next_page',
        initialPageParam: 0,
        cursorParam: 'nextCursor',
      },
      query: {
        methods: [ 'get' ],
        importPath: "@tanstack/react-query"
      },
      suspense: {},
      parser: 'zod',
    }),
  ],
})
```

## Links

- [Tanstack Query](https://tanstack.com/query)
