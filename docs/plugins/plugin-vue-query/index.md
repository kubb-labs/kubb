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

#### client.clientType

Specify whether to use function-based or class-based clients.

|           |                         |
|----------:|:------------------------|
|     Type: | `'function' \| 'class'` |
| Required: | `false`                 |
|  Default: | `'function'`            |

::: warning
This plugin is only compatible with `clientType: 'function'` (the default). If `clientType: 'class'` is detected, the plugin will automatically generate its own inline function-based client instead of importing from `@kubb/plugin-client`.
:::

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
   * @deprecated Use `nextParam` and `previousParam` instead for more flexible pagination handling.
   */
  cursorParam?: string | undefined
  /**
   * Which field of the data will be used to get the cursor for the next page.
   * Supports dot notation (e.g. 'pagination.next.id') or array path (e.g. ['pagination', 'next', 'id']) to access nested fields.
   */
  nextParam?: string | string[] | undefined
  /**
   * Which field of the data will be used to get the cursor for the previous page.
   * Supports dot notation (e.g. 'pagination.prev.id') or array path (e.g. ['pagination', 'prev', 'id']) to access nested fields.
   */
  previousParam?: string | string[] | undefined
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

> [!WARNING]
> `cursorParam` is deprecated. Use `nextParam` and `previousParam` instead for more flexible pagination handling.

|           |                      |
|----------:|:---------------------|
|     Type: | `string \| undefined` |
| Required: | `false`              |

#### infinite.nextParam

Which field of the data will be used to get the cursor for the next page. <br/>
Supports dot notation (e.g. 'pagination.next.id') or array path (e.g. ['pagination', 'next', 'id']) to access nested fields.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `string \| string[] \| undefined` |
| Required: | `false`                         |

#### infinite.previousParam

Which field of the data will be used to get the cursor for the previous page. <br/>
Supports dot notation (e.g. 'pagination.prev.id') or array path (e.g. ['pagination', 'prev', 'id']) to access nested fields.

|           |                                 |
|----------:|:--------------------------------|
|     Type: | `string \| string[] \| undefined` |
| Required: | `false`                         |

### queryKey

Customize the queryKey that will be used for the query.

The function receives an object with:
- `operation`: The OpenAPI operation object with methods like `getTags()`, `getOperationId()`, etc.
- `schemas`: An object containing operation schemas including `pathParams`, `queryParams`, `request`, `response`, etc.

::: warning
When using a string you need to use `JSON.stringify`.
:::

|           |                                                                             |
|----------:|:----------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas }) => unknown[]` |
| Required: | `false`                                                                     |

#### Examples

**Using tags and path parameters**

Generate a queryKey with operation tags and path parameters:

```typescript
import { defineConfig } from '@kubb/core'
import { pluginVueQuery } from '@kubb/plugin-vue-query'

export default defineConfig({
  // ...
  plugins: [
    pluginVueQuery({
      queryKey: ({ operation, schemas }) => {
        const tags = operation.getTags().map(tag => JSON.stringify(tag.name))
        const pathParams = schemas.pathParams?.keys || []
        return [...tags, ...pathParams]
      },
    }),
  ],
})
```

For a GET operation with tags `["user"]` and path parameter `username`, this generates:
```typescript
export const getUserByNameQueryKey = ({ username }: { username: GetUserByNamePathParams["username"] }) => 
  ["user", username] as const
```

**Using the default transformer**

You can extend the default queryKey transformer:

```typescript
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { QueryKey } from '@kubb/plugin-vue-query/components'

export default defineConfig({
  // ...
  plugins: [
    pluginVueQuery({
      queryKey: (props) => {
        const defaultKeys = QueryKey.getTransformer(props)
        return [JSON.stringify('v5'), ...defaultKeys]
      },
    }),
  ],
})
```

This prepends a version to the default queryKey:
```typescript
export const findPetsByTagsQueryKey = (params?: FindPetsByTagsQueryParams) => 
  ["v5", { url: '/pet/findByTags' }, ...(params ? [params] : [])] as const
```

**Using operation ID**

Create a simple queryKey using the operation ID:

```typescript
import { pluginVueQuery } from '@kubb/plugin-vue-query'

export default defineConfig({
  // ...
  plugins: [
    pluginVueQuery({
      queryKey: ({ operation }) => {
        return [JSON.stringify(operation.getOperationId())]
      },
    }),
  ],
})
```

**Conditional keys based on parameters**

Include query parameters when they exist:

```typescript
import { pluginVueQuery } from '@kubb/plugin-vue-query'

export default defineConfig({
  // ...
  plugins: [
    pluginVueQuery({
      queryKey: ({ operation, schemas }) => {
        const keys = [JSON.stringify(operation.getOperationId())]
        
        // Add path parameter values (without quotes, so they reference the variables)
        if (schemas.pathParams?.keys) {
          keys.push(...schemas.pathParams.keys)
        }
        
        // Add query params conditionally (the string gets embedded as code)
        if (schemas.queryParams?.name) {
          keys.push('...(params ? [params] : [])')
        }
        
        return keys
      },
    }),
  ],
})
```

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

### mutationKey

Customize the mutationKey.

::: warning
When using a string you need to use `JSON.stringify`.
:::

|           |                                                                             |
|----------:|:----------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas }) => unknown[]` |
| Required: | `false`                                                                     |

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
