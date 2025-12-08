How to generate the client code

|           |                         |
|----------:|:------------------------|
|     Type: | `'function' \| 'class'` |
| Required: | `false`                 |
|  Default: | `'function'`            |

- `'function'` will generate standalone functions for each operation.
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
      clientType: 'function',
    }),
  ],
})
```

```typescript [getPetById.ts]
import fetch from '@kubb/plugin-client/clients/fetch'
import type { GetPetByIdQueryResponse, GetPetByIdPathParams, GetPetById400, GetPetById404 } from '../../../models/ts/petController/GetPetById.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetById(
  { petId }: { petId: GetPetByIdPathParams['petId'] },
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    ...requestConfig,
  })
  return res.data
}
```
:::

- `'class'` will generate a class with methods for each operation.

::: warning
When using `clientType: 'class'`, it is not compatible with query plugins like `@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-solid-query`, `@kubb/plugin-svelte-query`, or `@kubb/plugin-swr`. These plugins are designed to work with function-based clients. If you need to use both class-based clients and query hooks, configure separate `pluginClient` instances: one with `clientType: 'class'` for your class-based needs, and another with `clientType: 'function'` (or omit it for the default) that the query plugins will reference.
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
      clientType: 'class',
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
  #client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.#client = config.client || fetch
  }

  /**
   * @description Returns a single pet
   * @summary Find pet by ID
   * {@link /pet/:petId}
   */
  async getPetById(
    { petId }: { petId: GetPetByIdPathParams['petId'] },
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
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
  async addPet(
    data: AddPetMutationRequest,
    config: Partial<RequestConfig<AddPetMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
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

const petClient = new Pet()

// Get a pet by ID
const pet = await petClient.getPetById({ petId: 1 })

// Add a new pet
const newPet = await petClient.addPet({
  name: 'Fluffy',
  status: 'available'
})
```
:::
