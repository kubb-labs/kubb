# @kubb/plugin-pinia-colada

Pinia Colada hooks generator plugin for Kubb, creating type-safe API client hooks from OpenAPI specifications for Vue.js applications using [Pinia Colada](https://pinia-colada.esm.dev/).

## Installation

```bash
npm install @kubb/plugin-pinia-colada
# or
pnpm add @kubb/plugin-pinia-colada
# or
yarn add @kubb/plugin-pinia-colada
# or
bun add @kubb/plugin-pinia-colada
```

## Usage

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginPiniaColada } from '@kubb/plugin-pinia-colada'
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
    pluginPiniaColada({
      output: {
        path: './hooks',
      },
    }),
  ],
})
```

## Features

- Generate `useQuery` hooks for GET operations
- Generate `useMutation` hooks for POST, PUT, PATCH, DELETE operations
- Full TypeScript support
- Supports Pinia Colada's `defineQuery` and `useMutation` patterns
- Compatible with Vue 3 and Pinia

## Documentation

For more information, see the [Kubb documentation](https://kubb.dev/).

## License

MIT
