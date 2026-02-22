Generate a wrapper class that composes all tag-based client classes into a single entry point.

#### wrapper.className

Name of the generated wrapper class.

|           |          |
|----------:|:---------|
|     Type: | `string` |
| Required: | `true`   |

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
      wrapper: {
        className: 'PetStoreClient',
      },
    }),
  ],
})
```

```typescript [PetStoreClient.ts]
import type { Client, RequestConfig } from './.kubb/fetch.js'
import { Pet } from './petController/Pet.js'
import { Store } from './storeController/Store.js'
import { User } from './userController/User.js'

export class PetStoreClient {
  readonly pet: Pet
  readonly store: Store
  readonly user: User

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.pet = new Pet(config)
    this.store = new Store(config)
    this.user = new User(config)
  }
}
```

```typescript [usage.ts]
import { PetStoreClient } from './gen/clients/PetStoreClient'

const client = new PetStoreClient({ baseURL: 'https://petstore.swagger.io/v2' })

// Access operations through tag-based properties
const pets = await client.pet.findPetsByTags({ tags: ['available'] })
const user = await client.user.getUserByName({ username: 'john' })
```
:::
