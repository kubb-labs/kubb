---
layout: doc

title: \@kubb/plugin-react-query
outline: deep
---

# @kubb/plugin-react-query

Create hooks based on an operation.

## Installation

::: code-group

```shell [bun]
bun add @kubb/plugin-react-query
```

```shell [pnpm]
pnpm add @kubb/plugin-react-query
```

```shell [npm]
npm install @kubb/plugin-react-query
```

```shell [yarn]
yarn add @kubb/plugin-react-query
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

|           |                             |
|----------:|:----------------------------|
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

#### output.footer
Add a footer text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |
## Installation

::: code-group

```shell [bun]
bun add @kubb/plugin-react-query
```

```shell [pnpm]
pnpm add @kubb/plugin-react-query
```

```shell [npm]
npm install @kubb/plugin-react-query
```

```shell [yarn]
yarn add @kubb/plugin-react-query
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

|           |                             |
|----------:|:----------------------------|
|     Type: | `'all' \| 'named' \| false` |
| Required: | `false`                     |
|  Default: | `'named'`                   |

<!--@include: ../core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

#### output.footer
Add a footer text in the beginning of every file.

|           |                                       |
|----------:|:--------------------------------------|
|     Type: | `string` |
| Required: | `false`                               |

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

### client.baseURL
<!--@include: ../plugin-client/baseURL.md-->

### paramsType
<!--@include: ../plugin-client/paramsType.md-->

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

### query

Override some useQuery behaviours. <br/>
To disable queries pass `false`.


|           |         |
|----------:|:--------|
|     Type: | `Query` |
| Required: | `false` |

```typescript [Query]
type Query = {
  /**
   * Customize the queryKey, here you can specify a suffix.
   */
  key?: (key: unknown[]) => unknown[]
  methods: Array<HttpMethod>
  importPath?: string
} | false
```

#### query.key

Customize the queryKey, here you can specify a suffix.

::: warning
When using a string you need to use `JSON.stringify`.
:::

|           |                      |
|----------:|:---------------------|
|     Type: | `(key: unknown[]) => unknown[]` |
| Required: | `false`              |

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

|           |                           |
|----------:|:--------------------------|
|     Type: | `string`                  |
| Required: | `false`                   |
|  Default: | `'@tanstack/react-query'` |

### suspense

When set, a suspenseQuery hook will be added. This will only work for v5 and react.

|           |                           |
|----------:|:--------------------------|
|     Type: | `object \| false`         |
| Required: | `false`                   |

### mutation

Override some useMutation behaviours. <br/>
To disable queries pass `false`.

|           |            |
|----------:|:-----------|
|     Type: | `Mutation` |
| Required: | `false`    |

```typescript [Query]
type Mutation = {
  /**
   * Customize the queryKey, here you can specify a suffix.
   */
  key?: (key: unknown[]) => unknown[]
  methods: Array<HttpMethod>
  importPath?: string
} | false
```

#### mutation.key

Customize the mutationQuery, here you can specify a suffix.

::: warning
When using a string you need to use `JSON.stringify`.
:::

|           |                      |
|----------:|:---------------------|
|     Type: | `(key: unknown[]) => unknown[]` |
| Required: | `false`              |

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

|           |                           |
|----------:|:--------------------------|
|     Type: | `string`                  |
| Required: | `false`                   |
|  Default: | `'@tanstack/react-query'` |


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
import { pluginReactQuery } from '@kubb/plugin-react-query'
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
    pluginReactQuery({
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
        key: (key)=> key,
        methods: [ 'post', 'put', 'delete' ],
      },
      infinite: {
        queryParam: 'next_page',
        initialPageParam: 0,
        cursorParam: 'nextCursor',
      },
      query: {
        key: (key)=> key,
        methods: [ 'get' ],
        importPath: "@tanstack/react-query"
      },
      suspense: {},
    }),
  ],
})
```

## Links

- [Tanstack Query](https://tanstack.com/query)
