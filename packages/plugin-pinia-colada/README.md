# @kubb/plugin-pinia-colada

Generate Pinia Colada hooks from OpenAPI specifications.

## Installation

```bash
npm install @kubb/plugin-pinia-colada
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

## Options

### output

Specify the export location for the files and define the behavior of the output

```typescript
output: {
  path: './hooks',
  barrelType: 'named'
}
```

### client

Configure the HTTP client used for requests

```typescript
client: {
  client: 'axios', // or 'fetch'
  dataReturnType: 'data', // or 'full'
}
```

### query

Configure query options

```typescript
query: {
  methods: ['get'],
  importPath: '@pinia/colada',
}
```

### mutation

Configure mutation options

```typescript
mutation: {
  methods: ['post', 'put', 'patch', 'delete'],
  importPath: '@pinia/colada',
}
```

## Features

- Generate `useQuery` hooks for GET requests
- Generate `useMutation` hooks for POST, PUT, PATCH, DELETE requests
- Fully typed with TypeScript
- Supports Zod validation
- Compatible with Pinia Colada's API
