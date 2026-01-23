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
bun add -d @kubb/plugin-react-query
```

```shell [pnpm]
pnpm add -D @kubb/plugin-react-query
```

```shell [npm]
npm install --save-dev @kubb/plugin-react-query
```

```shell [yarn]
yarn add -D @kubb/plugin-react-query
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

<!--@include: ./core/barrelTypes.md-->

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

#### output.override
<!--@include: ./core/outputOverride.md-->

### contentType
<!--@include: ./core/contentType.md-->

### group
<!--@include: ./core/group.md-->

#### group.type
Define a type where to group the files on.

|           |         |
|----------:|:--------|
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ./core/groupTypes.md-->

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
The `@kubb/plugin-react-query` plugin is only compatible with `clientType: 'function'` (the default). If `clientType: 'class'` is detected, the plugin will automatically generate its own inline function-based client instead of importing from `@kubb/plugin-client`.
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

### query

Override some useQuery behaviors. <br/>
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

|           |                           |
|----------:|:--------------------------|
|     Type: | `string`                  |
| Required: | `false`                   |
|  Default: | `'@tanstack/react-query'` |

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
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  // ...
  plugins: [
    pluginReactQuery({
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
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { QueryKey } from '@kubb/plugin-react-query/components'

export default defineConfig({
  // ...
  plugins: [
    pluginReactQuery({
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
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  // ...
  plugins: [
    pluginReactQuery({
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
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  // ...
  plugins: [
    pluginReactQuery({
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

### suspense

When set, a suspenseQuery hook will be added. This will only work for v5 and react.

|           |                           |
|----------:|:--------------------------|
|     Type: | `object \| false`         |
| Required: | `false`                   |

### mutation

Override some useMutation behaviors. <br/>
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

|           |                           |
|----------:|:--------------------------|
|     Type: | `string`                  |
| Required: | `false`                   |
|  Default: | `'@tanstack/react-query'` |

### mutationKey

Customize the mutationKey.

::: warning
When using a string you need to use `JSON.stringify`.
:::

|           |                                                                             |
|----------:|:----------------------------------------------------------------------------|
|     Type: | `(props: { operation: Operation; schemas: OperationSchemas }) => unknown[]` |
| Required: | `false`                                                                     |


### customOptions

When set, a custom hook will be used to customize the options of the generated hooks.
It will also generate a `HookOptions` type that can be used to type the custom options of each hook for type-safety.

|           |                 |
|----------:|:----------------|
|     Type: | `CustomOptions` |
| Required: | `false`         |

```typescript [CustomOptions]
type CustomOptions = {
  importPath: string
  name?: string
}
```

#### importPath

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `true`   |

Path to the hook that will be used to customize the hook options.
It will be used as `import ${customOptions.name} from '${customOptions.importPath}'`.
It allows both relative and absolute paths.
However, the path will be applied as is, so relative paths should be based on the file being generated.

#### name

|           |                        |
|----------:|:-----------------------|
|     Type: | `string`               |
| Required: | `false`                |
|  Default: | `useCustomHookOptions` |

Name of the exported hook that will be used to customize the hook options.
It will be used as `import ${customOptions.name} from '${customOptions.importPath}'`.
If not provided, it defaults to `useCustomHookOptions`.

#### Examples

**Add custom hook options to invalidate queries**

```typescript [useCustomHookOptions.ts]
function getCustomHookOptions({ queryClient }: { queryClient: QueryClient }): Partial<HookOptions> {
  return {
    useUpdatePetHook: {
      onSuccess: () => {
        // Invalidate queries using a constant
        void queryClient.invalidateQueries({ queryKey: ['pet'] })
      },
    },
    useDeletePetHook: {
      onSuccess: (_data, variables, _onMutateResult, _context) => {
        // Invalidate queries using the provided variables
        void queryClient.invalidateQueries({ queryKey: ['pet', variables.pet_id] })
      },
    },
    useUpdateUserHook: {
      onSuccess: (_data, variables, _onMutateResult, _context) => {
        // Invalidate queries using the provided query key generator function
        void queryClient.invalidateQueries({ queryKey: getUserByNameQueryKey({ username: variables.username }) })
      },
    },
    // Add more custom hook options here...
  }
}

export function useCustomHookOptions<T extends keyof HookOptions>({ hookName, operationId }: { hookName: T; operationId: string }): HookOptions[T] {
  const queryClient = useQueryClient()
  const customOptions = getCustomHookOptions({ queryClient })
  return customOptions[hookName] ?? {}
}
```

**Add custom hook options to implement custom error handling**

```typescript [useCustomHookOptions.ts]
function getCustomHookOptions({queryClient}: { queryClient: QueryClient }): Partial<HookOptions> {
  return {
    useUpdatePetHook: {
      onError: (error, _variables, _onMutateResult, _context) => {
        // Log the error
        console.error(`Failed to update pet:`, error);
      },
    },
    useDeletePetHook: {
      onError: (_error, variables, _onMutateResult, _context) => {
        // Show a toast notification
        toast.error(`Failed to delete pet with id '${variables.pet_id}'`);
      },
    },
    useUpdateUserHook: {
      onError: (_error, variables, _onMutateResult, _context) => {
        // Post the error to a custom analytics service
        postEvent("user_updated_failed", { username: variables.username, message: error.message, date: Date.now() })
      },
    },
    // Add more custom hook options here...
  }
}

export function useCustomHookOptions<T extends keyof HookOptions>({ hookName, operationId }: { hookName: T; operationId: string }): HookOptions[T] {
  const queryClient = useQueryClient()
  const customOptions = getCustomHookOptions({queryClient})
  return customOptions[hookName] ?? {}
}
```

### include
<!--@include: ./core/include.md-->

### exclude
<!--@include: ./core/exclude.md-->

### override
<!--@include: ./core/override.md-->

### generators <img src="../public/icons/experimental.svg"/>
<!--@include: ./core/generators.md-->

|           |                                      |
|----------:|:-------------------------------------|
|     Type: | `Array<Generator<PluginReactQuery>>` |
| Required: | `false`                              |


### transformers
<!--@include: ./core/transformers.md-->

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
        methods: [ 'post', 'put', 'delete' ],
      },
      infinite: {
        queryParam: 'next_page',
        initialPageParam: 0,
        nextParam: 'pagination.next.cursor',
        previousParam: ['pagination', 'prev', 'cursor'],
      },
      query: {
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
