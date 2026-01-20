---
layout: doc

title: \@kubb/plugin-client
outline: deep
---

# @kubb/plugin-client

The Client plugin enables you to generate API controllers, simplifying the process of handling API requests and improving integration between frontend and backend services.

By default, we are using [Axios](https://axios-http.com/docs/intro) but you can also add your own client, see [Use of Fetch](/knowledge-base/fetch).

## Installation

::: code-group
```shell [bun]
bun add -d @kubb/plugin-client
```

```shell [pnpm]
pnpm add -D @kubb/plugin-client
```

```shell [npm]
npm install --save-dev @kubb/plugin-client
```

```shell [yarn]
yarn add -D @kubb/plugin-client
```
:::

## Options

### output
Specify the export location for the files and define the behavior of the output.

#### output.path

Path to the output folder or file that will contain the generated code.

> [!TIP]
> if `output.path` is a file, `group` cannot be used.

|           |             |
| --------: | :---------- |
|     Type: | `string`    |
| Required: | `true`      |
|  Default: | `'clients'` |

#### output.barrelType

Define what needs to be exported, here you can also disable the export of barrel files.

> [!TIP]
> Using propagate will prevent a plugin from creating a barrel file, but it will still propagate, allowing [`output.barrelType`](/getting-started/configure#output-barreltype) to export the specific function or type.

|           |                                            |
| --------: | :----------------------------------------- |
|     Type: | `'all' \| 'named' \| 'propagate' \| false` |
| Required: | `false`                                    |
|  Default: | `'named'`                                  |

<!--@include: ./core/barrelTypes.md-->

#### output.banner
Add a banner text in the beginning of every file.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

#### output.footer
Add a footer text at the end of every file.

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `string \| (oas: Oas) => string` |
| Required: | `false`                          |

#### output.override
<!--@include: ./core/outputOverride.md-->

### contentType
<!--@include: ./core/contentType.md-->

### group
<!--@include: ./core/group.md-->

#### group.type
Define a type where to group the files on.

|           |         |
| --------: | :------ |
|     Type: | `'tag'` |
| Required: | `true`  |

<!--@include: ./core/groupTypes.md-->

#### group.name

Return the name of a group based on the group name, this will be used for the file and name generation.

|           |                                     |
| --------: | :---------------------------------- |
|     Type: | `(context: GroupContext) => string` |
| Required: | `false`                             |
|  Default: | `(ctx) => '${ctx.group}Controller'` |

### importPath
<!--@include: ./plugin-client/importPath.md-->

### operations
Create `operations.ts` file with all operations grouped by methods.

|           |           |
| --------: | :-------- |
|     Type: | `boolean` |
| Required: | `false`   |
|  Default: | `false`   |

### dataReturnType
<!--@include: ./plugin-client/dataReturnType.md-->

### urlType
Export urls that are used by operation x

|           |                     |
| --------: | :------------------ |
|     Type: | `'export' \| false` |
| Required: | `false`             |
|  Default: | `false`             |

- `'export'` will make them part of your barrel file
- `false` will not make them exportable

```typescript
export function getGetPetByIdUrl(petId: GetPetByIdPathParams['petId']) {
  return `/pet/${petId}` as const
}
```

### paramsType
<!--@include: ./plugin-client/paramsType.md-->

### paramsCasing
<!--@include: ./plugin-client/paramsCasing.md-->

### pathParamsType
<!--@include: ./plugin-client/pathParamsType.md-->

### parser
<!--@include: ./plugin-client/parser.md-->

### client
<!--@include: ./plugin-client/client.md-->

### clientType <span class="new">new in 4.18.0</span>

How to generate the client code

|           |                                              |
| --------: | :------------------------------------------- |
|     Type: | `'function'` \| `'class'` \| `'staticClass'` |
| Required: | `false`                                      |
|  Default: | `'function'`                                 |

* `'function'` will generate standalone functions for each operation.
* `'class'` will generate a class with instance methods for each operation.
* `'staticClass'` will generate a class with static methods for each operation. This allows usage like `Pet.getPetById(...)` without instantiating the class.

::: warning
When using `clientType: 'class'` or `clientType: 'staticClass'`, these are not compatible with query plugins like `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-solid-query`, `@kubb/plugin-svelte-query`, or `@kubb/plugin-swr`. These plugins are designed to work with function-based clients. If you need to use both class-based or static-class clients and query hooks, configure separate `pluginClient` instances: one with `clientType: 'class'` or `clientType: 'staticClass'` for your needs, and another with `clientType: 'function'` (or omit it for the default) that the query plugins will reference.
:::

::: code-group
```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
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
    pluginClient({
      output: {
        path: './clients',
      },
      clientType: 'staticClass',
      group: {
        type: 'tag',
      },
    }),
  ],
})
```

```typescript [Pet.ts]
import fetch from '@kubb/plugin-client/clients/fetch'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.js'
import type { AddPetMutationRequest, AddPetMutationResponse, AddPet405 } from '../../../models/ts/petController/AddPet.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export class Pet {
  static #client: typeof fetch = fetch

  /**
   * @description Returns a single pet
   * @summary Find pet by ID
   * {@link /pet/:petId}
   */
  static async getPetById(
    { petId }: { petId: GetPetByIdPathParams['petId'] },
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const request = this.#client || fetch
    const { client: _request = this.#client, ...requestConfig } = config
    const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
      method: 'GET',
      url: `/pet/${petId}`,
      ...requestConfig,
    })
    return res.data
  }

  /**
   * @description Add a new pet to the store
   * @summary Add a new pet to the store
   * {@link /pet}
   */
  static async addPet(
    data: AddPetMutationRequest,
    config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const request = this.#client || fetch
    const { client: _request = this.#client, ...requestConfig } = config
    const requestData = data
    const res = await request<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
      method: 'POST',
      url: '/pet',
      data: requestData,
      ...requestConfig,
    })
    return res.data
  }
}
```

```typescript [usage.ts]
import { Pet } from './gen/clients/Pet'

// Get a pet by ID
const pet = await Pet.getPetById({ petId: 1 })

// Add a new pet
const newPet = await Pet.addPet({
  name: 'Fluffy',
  status: 'available'
})
```
:::

### bundle
<!--@include: ./plugin-client/bundle.md-->

### baseURL
<!--@include: ./plugin-client/baseURL.md-->

### include
<!--@include: ./core/include.md-->

### exclude
<!--@include: ./core/exclude.md-->

### override
<!--@include: ./core/override.md-->

### generators <img src="../public/icons/experimental.svg"/>
<!--@include: ./core/generators.md-->

|           |                                  |
| --------: | :------------------------------- |
|     Type: | `Array<Generator<PluginClient>>` |
| Required: | `false`                          |


### transformers
<!--@include: ./core/transformers.md-->

#### transformers.name
Customize the names based on the type that is provided by the plugin.

|           |                                                |
| --------: | :--------------------------------------------- |
|     Type: | `(name: string, type?: ResolveType) => string` |
| Required: | `false`                                        |

```typescript
type ResolveType = 'file' | 'function' | 'type' | 'const'
```

## Example

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

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
    pluginClient({
      output: {
        path: './clients/axios',
        barrelType: 'named',
        banner: '/* eslint-disable no-alert, no-console */',
        footer: ''
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Service`,
      },
      transformers: {
        name: (name, type) => {
          return `${name}Client`
        },
      },
      operations: true,
      parser: 'client',
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      pathParamsType: "object",
      dataReturnType: 'full',
      client: 'axios'
    }),
  ],
})
```

## Links

- [Axios](https://axios-http.com/docs/intro)
