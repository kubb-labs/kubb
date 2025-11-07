---
layout: doc

title: \@kubb/plugin-vue-query
outline: deep
---

# @kubb/plugin-vue-query


Create hooks based on an operation.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/plugin-vue-query
```

```shell [pnpm]
pnpm add -D @kubb/plugin-vue-query
```

```shell [npm]
npm install --save-dev @kubb/plugin-vue-query
```

```shell [yarn]
yarn add -D @kubb/plugin-vue-query
```

:::

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |           |
|----------:|:----------|
|     Type: | `string`  |
| Required: | `true`    |
|  Default: | `'hooks'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                         |
|  Default: | `'named'`                       |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

#### output.footer
Add a footer text at the end of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                               |

### contentType
<!--@include: ../core/contentType.md-->

### group
<!--@include: ../core/group.md-->

#### group.type
Define a type where to group the files on.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ../core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
|----------:|:------------------------------------|
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'`  |

### client

#### client.importPath
<!--@include: ../plugin-client/importPath.md-->

#### client.dataReturnType
<!--@include: ../plugin-client/dataReturnType.md-->

#### client.baseURL
<!--@include: ../plugin-client/baseURL.md-->

#### client.bundle
<!--@include: ../plugin-client/bundle.md-->

### paramsType
<!--@include: ../plugin-client/paramsType.md-->

### paramsCasing
<!--@include: ../plugin-client/paramsCasing.md-->

### pathParamsType
<!--@include: ../plugin-client/pathParamsType.md-->

### parser
<!--@include: ../plugin-client/parser.md-->

### infinite

When set, an 'infiniteQuery' hook will be added. <br/>
To disable infinite queries pass `false`.

|           |                     |
|----------:|:--------------------|
|     Type: | `Infinite \| false` |
| Required: | `false`             |
|  Default: | `false`             |

```typescript [Infinite]
type Infinite = {
  /**
   * Specify the params key used for `pageParam`.
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

#### infinite.queryParam

Specify the params key used for `pageParam`.
|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `false`  |
|  Default: | `'id'`   |


#### infinite.initialPageParam

Specify the initial page param value.

|           |           |
|----------:|:----------|
|     Type: | `unknown` |
| Required: | `false`   |
|  Default: | `0`       |


#### infinite.cursorParam

Which field of the data will be used, set it to undefined when no cursor is known.

|           |                      |
|----------:|:---------------------|
|     Type: | `string \| undefined` |
| Required: | `false`              |

#### queryKey

Customize the queryKey.

::: warning
When using a string you need to use `JSON.stringify`.
:::

|           |                                                                             |
|----------:|:----------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas }) => unknown[]` |
| Required: | `false`                                                                     |

### query

Override some useQuery behaviours. <br/>
To disable the creation of hooks pass `false`, this will result in only creating `queryOptions`.

|           |         |
|----------:|:--------|
|     Type: | `Query` |
| Required: | `false` |

```typescript [Query]
type Query = {
  methods: Array<HttpMethod>
  importPath?: string
} | false
```

#### query.methods

Define which HttpMethods can be used for queries

|           |                     |
|----------:|:--------------------|
|     Type: | `Array<HttpMethod>` |
| Required: | `['get']`           |


#### query.importPath

Path to the useQuery that will be used to do the useQuery functionality.
It will be used as `import { useQuery } from '${hook.importPath}'`.
It allows both relative and absolute path.
the path will be applied as is, so relative path should be based on the file being generated.

|           |                         |
|----------:|:------------------------|
|     Type: | `string`                |
| Required: | `false`                 |
|  Default: | `'@tanstack/vue-query'` |


#### mutationKey

Customize the mutationKey.

::: warning
When using a string you need to use `JSON.stringify`.
:::

|           |                                                                             |
|----------:|:----------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas }) => unknown[]` |
| Required: | `false`                                                                     |


### mutation

Override some useMutation behaviours. <br/>
To disable queries pass `false`.

|           |            |
|----------:|:-----------|
|     Type: | `Mutation` |
| Required: | `false`    |

```typescript [Query]
type Mutation = {
  methods: Array<HttpMethod>
  importPath?: string
} | false
```

#### mutation.methods

Define which HttpMethods can be used for mutations

|           |                     |
|----------:|:--------------------|
|     Type: | `Array<HttpMethod>` |
| Required: | `['get']`           |


#### mutation.importPath

Path to the useQuery that will be used to do the useQuery functionality.
It will be used as `import { useMutation } from '${hook.importPath}'`.
It allows both relative and absolute path.
the path will be applied as is, so relative path should be based on the file being generated.

|           |                         |
|----------:|:------------------------|
|     Type: | `string`                |
| Required: | `false`                 |
|  Default: | `'@tanstack/vue-query'` |

### include
<!--@include: ../core/include.md-->

### exclude
<!--@include: ../core/exclude.md-->

### override
<!--@include: ../core/override.md-->

### generators <img src="/icons/experimental.svg"/>
<!--@include: ../core/generators.md-->

|           |                                      |
|----------:|:-------------------------------------|
|     Type: | `Array<Generator<PluginReactQuery>>` |
| Required: | `false`                              |


### transformers
<!--@include: ../core/transformers.md-->

#### transformers.name
Customize the names based on the type that is provided by the plugin.

|           |                                                                               |
|----------:|:------------------------------------------------------------------------------|
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                                                       |

```typescript
type ResolveType = 'file' | 'function' | 'type' | 'const'
```

## Example

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
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
    pluginVueQuery({
      output: {
        path: './hooks',
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Hooks`,
      },
      client: {
        dataReturnType: 'full',
      },
      mutation: {
        methods: [ 'post', 'put', 'delete' ],
      },
      infinite: {
        queryParam: 'next_page',
        initialPageParam: 0,
        cursorParam: 'nextCursor',
      },
      query: {
        methods: [ 'get' ],
        importPath: "@tanstack/vue-query"
      },
    }),
  ],
})
```

## Links

- [Tanstack Query](https://tanstack.com/query)
