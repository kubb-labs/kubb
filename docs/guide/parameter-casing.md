---
layout: doc

title: Parameter Casing - Transform API Parameter Names
description: Learn how to use paramsCasing to transform API parameter names to developer-friendly camelCase across all generated code in Kubb.
---

# Parameter Casing

Transform API parameter names to developer-friendly camelCase across all generated code while maintaining compatibility with your OpenAPI specification.

## Overview

The `paramsCasing` option allows you to transform parameter names for path parameters, query parameters, and header parameters from their original API format (e.g., `step_id`, `X-Custom-Header`) to camelCase (e.g., `stepId`, `xCustomHeader`).

## Supported Plugins

The following plugins support `paramsCasing`:

- `@kubb/plugin-ts` - Transforms TypeScript type property names
- `@kubb/plugin-client` - Transforms function parameters and adds mapping logic
- `@kubb/plugin-react-query` - Transforms React Query hook parameters
- `@kubb/plugin-swr` - Transforms SWR hook parameters
- `@kubb/plugin-solid-query` - Transforms Solid Query hook parameters
- `@kubb/plugin-svelte-query` - Transforms Svelte Query hook parameters
- `@kubb/plugin-vue-query` - Transforms Vue Query hook parameters
- `@kubb/plugin-faker` - Transforms mock data property names
- `@kubb/plugin-mcp` - Transforms MCP handler parameters

## Configuration

To enable parameter casing, add `paramsCasing: 'camelcase'` to each plugin that generates code with parameters:

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: { path: './types' },
      paramsCasing: 'camelcase', // Transform TypeScript types
    }),
    pluginClient({
      output: { path: './client' },
      paramsCasing: 'camelcase', // Transform client parameters
    }),
    pluginReactQuery({
      output: { path: './hooks' },
      paramsCasing: 'camelcase', // Transform hook parameters
      client: {
        paramsCasing: 'camelcase', // Also configure client options
      },
    }),
  ],
})
```

> [!IMPORTANT]
> **All plugins must use the same `paramsCasing` setting.** Mixing different casing settings will cause type errors.

## How It Works

### TypeScript Types

Plugin-ts transforms property names in parameter types:

::: code-group
```typescript [Before (Original API)]
// From OpenAPI: /pet/{step_id}
type FindPetsByStatusPathParams = {
  step_id: string
}

type CreatePetsQueryParams = {
  bool_param?: boolean
  offset?: number
}

type FindPetsByTagsHeaderParams = {
  'X-EXAMPLE'?: 'ONE' | 'TWO' | 'THREE'
}
```

```typescript [After (paramsCasing: 'camelcase')]
// Transformed to camelCase
type FindPetsByStatusPathParams = {
  stepId: string  // ✓
}

type CreatePetsQueryParams = {
  boolParam?: boolean  // ✓
  offset?: number
}

type FindPetsByTagsHeaderParams = {
  xExample?: 'ONE' | 'TWO' | 'THREE'  // ✓
}
```
:::

### Client Code

Plugin-client transforms function parameters and automatically maps them back to original API names:

::: code-group
```typescript [Before (Original API)]
export async function findPetsByStatus(
  step_id: FindPetsByStatusPathParams['step_id'],
  config: Partial<RequestConfig> = {}
) {
  return axios.get(`/pet/findByStatus/${step_id}`)
}
```

```typescript [After (paramsCasing: 'camelcase')]
export async function findPetsByStatus(
  stepId: FindPetsByStatusPathParams['stepId'],  // ✓ camelCase parameter
  config: Partial<RequestConfig> = {}
) {
  // Automatically maps back to original name
  const step_id = stepId

  return axios.get(`/pet/findByStatus/${step_id}`)  // Uses original API name
}
```
:::

### Query Hooks

React Query, SWR, and other query plugins also transform parameters:

::: code-group
```typescript [Before (Original API)]
export function useFindPetsByStatus(
  { step_id }: { step_id: FindPetsByStatusPathParams['step_id'] },
  options = {}
) {
  return useQuery({
    queryKey: [{ url: '/pet/findByStatus/:step_id', params: { step_id } }],
    queryFn: () => findPetsByStatus(step_id),
  })
}
```

```typescript [After (paramsCasing: 'camelcase')]
export function useFindPetsByStatus(
  { stepId }: { stepId: FindPetsByStatusPathParams['stepId'] },  // ✓
  options = {}
) {
  return useQuery({
    queryKey: [{ url: '/pet/findByStatus/:step_id', params: { stepId } }],  // ✓
    queryFn: () => findPetsByStatus(stepId),  // ✓
  })
}
```
:::

### Mock Data

Plugin-faker transforms property names in mock data objects:

::: code-group
```typescript [Before (Original API)]
export function createFindPetsByStatusPathParamsFaker(
  data?: Partial<FindPetsByStatusPathParams>
): FindPetsByStatusPathParams {
  return {
    ...{ step_id: faker.string.alpha() },
    ...(data || {}),
  }
}
```

```typescript [After (paramsCasing: 'camelcase')]
export function createFindPetsByStatusPathParamsFaker(
  data?: Partial<FindPetsByStatusPathParams>
): FindPetsByStatusPathParams {
  return {
    ...{ stepId: faker.string.alpha() },  // ✓
    ...(data || {}),
  }
}
```
:::

## Usage Example

Here's how your code looks when using `paramsCasing`:

```tsx
import { findPetsByStatus } from './gen/client'
import { useFindPetsByStatus } from './gen/hooks'
import { createFindPetsByStatusPathParamsFaker } from './gen/mocks'

// Client function - use camelCase
const pet = await findPetsByStatus('my-step-id')

// React Query hook - use camelCase
function PetStatus() {
  const { data } = useFindPetsByStatus({
    stepId: 'my-step-id'  // ✓ camelCase
  })

  return <div>{data?.name}</div>
}

// Mock data - camelCase properties
const mockParams = createFindPetsByStatusPathParamsFaker({
  stepId: 'test-id'  // ✓ camelCase
})
```

All HTTP requests still use the original parameter names from your OpenAPI specification, ensuring full compatibility with your API.

## What Gets Transformed

### ✅ Transformed
- **Path parameters** - e.g., `step_id` → `stepId`
- **Query parameters** - e.g., `bool_param` → `boolParam`
- **Header parameters** - e.g., `X-Custom-Header` → `xCustomHeader`

### ❌ Not Transformed
- **Request bodies** - Property names in request/response types remain unchanged
- **Response bodies** - Response data structure stays as defined in OpenAPI
- **Schema definitions** - Only parameter schemas are affected

## Troubleshooting

### Type Errors After Enabling

If you see type errors like `Property 'step_id' does not exist`, ensure all plugins have `paramsCasing` configured:

```typescript
// ❌ Wrong - only plugin-ts has paramsCasing
pluginTs({ paramsCasing: 'camelcase' }),
pluginClient({}),  // Missing paramsCasing

// ✓ Correct - all plugins configured
pluginTs({ paramsCasing: 'camelcase' }),
pluginClient({ paramsCasing: 'camelcase' }),
pluginReactQuery({
  paramsCasing: 'camelcase',
  client: { paramsCasing: 'camelcase' }
}),
```

## See Also

- [Plugin TypeScript](/plugins/plugin-ts) - TypeScript type generation
- [Plugin Client](/plugins/plugin-client) - API client generation
- [Plugin React Query](/plugins/plugin-react-query) - React Query hooks
- [Plugin Faker](/plugins/plugin-faker) - Mock data generation
