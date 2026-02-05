---
"@kubb/plugin-ts": minor
"@kubb/plugin-client": minor
"@kubb/plugin-react-query": minor
"@kubb/plugin-swr": minor
"@kubb/plugin-solid-query": minor
"@kubb/plugin-svelte-query": minor
"@kubb/plugin-vue-query": minor
"@kubb/plugin-faker": minor
"@kubb/plugin-mcp": minor
"@kubb/plugin-oas": patch
---

Add `paramsCasing` support to transform parameter names to camelCase across all generated code.

**New Feature: Parameter Casing**

You can now transform API parameter names (path, query, and header parameters) to developer-friendly camelCase while maintaining full compatibility with your OpenAPI specification.

**What's Changed:**

- Added `paramsCasing: 'camelcase'` option to transform parameter names
- Supported in: `@kubb/plugin-ts`, `@kubb/plugin-client`, all query plugins (`react-query`, `swr`, `solid-query`, `svelte-query`, `vue-query`), `@kubb/plugin-faker`, and `@kubb/plugin-mcp`
- Client plugins automatically map camelCase names back to original API parameter names in HTTP requests
- Only affects pathParams, queryParams, and headerParams (request/response bodies remain unchanged)

**Usage:**

```typescript
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  plugins: [
    pluginTs({
      paramsCasing: 'camelcase', // Transform types
    }),
    pluginClient({
      paramsCasing: 'camelcase', // Transform client code
    }),
  ],
})
```

**Example:**

```typescript
// Before (original API naming)
export async function findPet(pet_id: string) { ... }

// After (with paramsCasing: 'camelcase')
export async function findPet(petId: string) { 
  const pet_id = petId // Automatically mapped
  ...
}
```

See the [Parameter Casing guide](/guide/parameter-casing) for detailed documentation.
