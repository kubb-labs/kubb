How to generate the client code

|           |                         |
|----------:|:------------------------|
|     Type: | `'function' \| 'class'` |
| Required: | `false`                 |
|  Default: | `'function'`            |

- `'function'` will generate standalone functions for each operation.
- `'class'` will generate a class with methods for each operation.

## Function-based (default)

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginClient({
      output: {
        path: './clients',
      },
      clientType: 'function',
    }),
  ],
})
```

This will generate standalone functions like:

```typescript
export async function getPetById({ petId }: { petId: number }) {
  // ...
}
```

## Class-based

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
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

This will generate classes like:

```typescript
export class Pet {
  private client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.client = config.client || fetch
  }

  async getPetById({ petId }: { petId: number }) {
    // ...
  }

  async addPet(data: AddPetMutationRequest) {
    // ...
  }
}
```

Usage:

```typescript
import { Pet } from './gen/clients/Pet'

const petClient = new Pet()
const pet = await petClient.getPetById({ petId: 1 })
```
