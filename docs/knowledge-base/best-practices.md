---
layout: doc

title: Best Practices
outline: deep
---

# Best Practices

This guide covers recommended practices for using Kubb effectively in your projects, from small APIs to large-scale applications.

::: tip
For best practices on structuring your OpenAPI specification itself, see [OpenAPI/Swagger Best Practices](/knowledge-base/oas/#best-practices).
:::

## How to Scale

### Project Structure

For large projects with many endpoints, organize your generated code strategically:

**1. Group by Feature or Tag**

Use tags from your OpenAPI specification to organize generated code by feature:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: './types',
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Types`,
      },
    }),
    pluginClient({
      output: {
        path: './clients',
      },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Client`,
      },
    }),
  ],
})
```

This creates organized directories:
```
src/gen/
├── types/
│   ├── petsTypes.ts
│   ├── usersTypes.ts
│   └── ordersTypes.ts
└── clients/
    ├── petsClient.ts
    ├── usersClient.ts
    └── ordersClient.ts
```

**2. Use Selective Generation**

For very large APIs, generate only what you need using `include` and `exclude`:

```typescript twoslash [kubb.config.ts]
pluginTs({
  include: [
    {
      type: 'tag',
      pattern: 'pets',
    },
    {
      type: 'tag',
      pattern: 'users',
    },
  ],
  exclude: [
    {
      type: 'tag',
      pattern: 'admin', // Exclude admin endpoints
    },
  ],
})
```

**3. Split Large OpenAPI Files**

For massive OpenAPI specifications (1000+ endpoints), consider:

- Splitting your OpenAPI file by domain or microservice
- Creating multiple Kubb configurations for different parts of your API
- Using the `include` option to generate subsets incrementally

```typescript twoslash [kubb.config.pets.ts]
export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen/pets',
    clean: true,
  },
  plugins: [
    pluginOas(),
    pluginTs({
      include: [{ type: 'tag', pattern: 'pets' }],
    }),
  ],
})
```

### Performance Optimization

**1. Use Barrel Files Strategically**

Control barrel file generation to improve build performance:

```typescript twoslash [kubb.config.ts]
export default defineConfig({
  output: {
    path: './src/gen',
    barrelType: 'named', // or 'all', false
  },
})
```

- `false`: No barrel files (faster generation, manual imports)
- `'named'`: Named exports only (recommended for tree-shaking)
- `'all'`: Both named and default exports

**2. Incremental Generation**

During development, use watch mode for faster iterations:

```shell
kubb generate --watch
```

Or integrate with your build tool using `unplugin-kubb`:

```typescript twoslash [vite.config.ts]
import kubb from 'unplugin-kubb/vite'

export default {
  plugins: [
    kubb({
      config: './kubb.config.ts',
    }),
  ],
}
```

**3. Optimize Dependencies**

Only install plugins you actually use. Each plugin adds processing time:

```json [package.json]
{
  "devDependencies": {
    "@kubb/core": "latest",
    "@kubb/plugin-oas": "latest",
    "@kubb/plugin-ts": "latest",
    "@kubb/plugin-client": "latest"
    // Only add what you need
  }
}
```

### Managing Generated Code in Version Control

**Option 1: Commit Generated Code** (Recommended for libraries)

Pros:
- Consumers don't need to run Kubb
- Works with CI/CD immediately
- Easier to review changes

Cons:
- Larger repository size
- More merge conflicts

```gitignore
# Don't ignore generated code
# src/gen/
```

**Option 2: Ignore Generated Code** (Recommended for applications)

Pros:
- Smaller repository
- Fewer merge conflicts
- Forces fresh generation

Cons:
- Requires generation step in CI/CD
- Longer build times

```gitignore
# Ignore generated code
src/gen/
.kubb/
```

Add to your CI/CD:
```yaml [.github/workflows/ci.yml]
- name: Generate API code
  run: pnpm kubb generate
```

## How to Navigate Generated Code

### Understanding the Generated Structure

Kubb generates predictable, organized code. Here's what to expect:

**1. File Naming Conventions**

```
Generated files follow patterns based on your OpenAPI spec:

Operation ID: getPetById
├── Type file: getPetById.ts (TypeScript types)
├── Client file: getPetById.ts (API client function)
├── Hook file: useGetPetById.ts (React Query hook)
└── Schema file: getPetById.ts (Zod schemas)
```

**2. Use Your IDE Effectively**

Modern IDEs make navigation easy:

- **Go to Definition** (F12): Jump from usage to generated type
- **Find All References** (Shift+F12): See where generated code is used
- **Autocomplete**: Let your IDE suggest available endpoints
- **Search by Symbol** (Ctrl+T / Cmd+T): Quickly find generated functions

**3. Barrel Files for Easy Imports**

Generated barrel files (`index.ts`) provide convenient re-exports:

```typescript
// Import everything you need from one place
import { getPetById, createPet, type Pet, type CreatePetRequest } from './gen'

// Or from specific modules
import { getPetById } from './gen/pets'
import type { Pet } from './gen/types'
```

**4. Consistent Naming Patterns**

Kubb uses your OpenAPI `operationId` to generate predictable names:

| OpenAPI operationId | Generated Function | Generated Hook | Generated Type |
|---------------------|-------------------|----------------|----------------|
| `getPets` | `getPets()` | `useGetPets()` | `GetPetsResponse` |
| `createPet` | `createPet()` | `useCreatePet()` | `CreatePetRequest` |
| `updatePetById` | `updatePetById()` | `useUpdatePetById()` | `UpdatePetByIdRequest` |

> [!TIP]
> Use consistent `operationId` naming in your OpenAPI spec for predictable generated names.

### Using Generated Code Effectively

**1. Start with Types**

Generated TypeScript types are your API documentation:

```typescript
import type { Pet, CreatePetRequest } from './gen'

// Types tell you exactly what the API expects
const newPet: CreatePetRequest = {
  name: 'Fluffy',
  status: 'available',
  // IDE will suggest all required fields
}
```

**2. Leverage Query Hooks**

For React applications, use generated hooks for optimal UX:

```typescript
import { useGetPets, useCreatePet } from './gen'

function PetsList() {
  // Automatic loading states, caching, and refetching
  const { data: pets, isLoading, error } = useGetPets()
  const createPet = useCreatePet()

  // Handle loading and error states
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {pets?.map(pet => (
        <div key={pet.id}>{pet.name}</div>
      ))}
    </div>
  )
}
```

**3. Customize Client Configuration**

Set up your API client once, use everywhere:

```typescript twoslash [src/api/client.ts]
import { client } from './gen/client'

// Configure base URL and auth
client.setConfig({
  baseURL: import.meta.env.VITE_API_URL,
})

// Add interceptors
client.instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Debugging Generated Code

When things don't work as expected:

**1. Enable Debug Mode**

```shell
kubb generate --debug
```

This creates log files in `.kubb/`:
- `kubb-<date>.log` - Main execution log
- `kubb-files.log` - Generated files log

**2. Validate Your OpenAPI Spec**

Most issues stem from OpenAPI specification problems:

```typescript twoslash [kubb.config.ts]
pluginOas({
  validate: true, // Enable OpenAPI validation
})
```

Or use external validators:
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Spec Validator](https://apitools.dev/swagger-parser/online/)

**3. Check Generated Files**

The generated code is readable TypeScript - inspect it directly:

```typescript
// Generated files are in your output directory
// Read them to understand what Kubb created
import { getPetById } from './gen/pets/getPetById'

// Most issues are visible in the generated code
```

## When NOT to Use Kubb

While Kubb is powerful, it's not always the right choice:

### ❌ Don't Use Kubb If:

**1. You Don't Have an OpenAPI Specification**

Kubb requires a valid OpenAPI/Swagger file. If you're working with a REST API that doesn't have one, you'll need to create one first.

See [Creating OpenAPI Specifications](/knowledge-base/oas/#creating-openapi-specifications) for tools and approaches to generate specs from existing APIs or code.

> [!NOTE]
> **Alternative**: Consider [tRPC](https://trpc.io/) for end-to-end typesafety without OpenAPI.

**2. Your API Changes Constantly**

If your API has breaking changes multiple times per day during active development:
- Constant regeneration can be disruptive
- Git conflicts in generated code become frequent
- Manual coding might be faster initially

> [!TIP]
> **Better approach**: Wait until your API stabilizes, or use feature flags to control when to regenerate.

**3. You Need Full Control Over Generated Code**

Kubb generates opinionated code. If you need:
- Very specific code patterns
- Custom business logic in API clients
- Non-standard error handling throughout

Then manual coding or creating custom generators might be better.

**4. Your Team Isn't Familiar with TypeScript**

Kubb generates TypeScript code. If your team:
- Exclusively uses JavaScript
- Has no plans to adopt TypeScript
- Prefers runtime validation only

Consider whether the learning curve is worth it.

**5. Simple APIs with Few Endpoints**

For tiny APIs (5-10 endpoints), manual coding might be faster:
- Less tooling setup
- Simpler project structure
- Easier for beginners

> [!NOTE]
> **Rule of thumb**: If you can write all API clients in under an hour, Kubb might be overkill.

### ✅ DO Use Kubb When:

**1. You Have a Well-Defined OpenAPI Specification**

Ideal scenario:
- Complete OpenAPI 3.x specification
- Stable API contracts
- Multiple consumers need the same types

**2. Working with Large APIs**

Kubb shines with:
- 50+ endpoints
- Complex nested types
- Multiple API versions
- Microservices architecture

**3. You Need Multiple Output Formats**

When you want:
- TypeScript types
- API clients (Axios, Fetch)
- React Query hooks
- Zod schemas for validation
- MSW mocks for testing
- All in sync with your API

**4. Type Safety Is Critical**

Perfect for:
- Production applications
- Financial or healthcare systems
- Apps with compliance requirements
- Teams that value compile-time safety

**5. Multiple Teams/Projects Share the Same API**

Kubb excels when:
- Frontend and mobile teams need the same types
- Multiple services consume the same API
- You publish SDKs for your API
- Consistency across projects is important

### Hybrid Approach

You can use Kubb selectively:

```typescript twoslash [kubb.config.ts]
// Generate only for stable parts of your API
export default defineConfig({
  plugins: [
    pluginOas(),
    pluginTs({
      include: [
        { type: 'tag', pattern: 'stable-api' },
      ],
      exclude: [
        { type: 'tag', pattern: 'experimental' },
      ],
    }),
  ],
})
```

This lets you:
- Use Kubb for stable, production APIs
- Write manual code for experimental features
- Gradually adopt Kubb as your API matures

## Common Patterns and Tips

### Working with Multiple APIs

Use an array in `defineConfig` to handle multiple API specifications in a single configuration file:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig([
  {
    name: 'petStore',
    input: {
      path: './specs/petStore.yaml',
    },
    output: {
      path: './src/gen/petStore',
      clean: true,
    },
    plugins: [
      pluginOas(),
      pluginTs(),
      pluginClient(),
    ],
  },
  {
    name: 'userService',
    input: {
      path: './specs/users-api.yaml',
    },
    output: {
      path: './src/gen/users',
      clean: true,
    },
    plugins: [
      pluginOas(),
      pluginTs(),
      pluginClient(),
    ],
  },
])
```

You can also dynamically generate configs from a list of schemas:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

const schemas = [
  { name: 'petStore', path: './specs/petStore.yaml' },
  { name: 'inventory', path: './specs/inventory.json' },
  { name: 'payments', path: 'https://api.example.com/openapi.json' },
]

export default defineConfig(() => {
  return schemas.map(({ name, path }) => ({
    name,
    input: { path },
    output: {
      path: `./src/gen/${name}`,
      clean: true,
    },
    plugins: [
      pluginOas(),
      pluginTs(),
    ],
  }))
})
```

Run once to generate all APIs:
```shell
kubb generate
```

### Extending Generated Types

Sometimes you need to add properties to generated types:

```typescript
import type { Pet as GeneratedPet } from './gen'

// Extend with local-only properties
export interface Pet extends GeneratedPet {
  // Client-side only properties
  isSelected?: boolean
  localId?: string
}
```

### Custom Transformers

Customize how names are generated:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  plugins: [
    pluginTs({
      transformers: {
        name: (name, type) => {
          // Add custom suffixes
          if (type === 'type') return `${name}Type`
          return name
        },
      },
    }),
  ],
})
```

### Handling Authentication

Set up authentication in a central location:

```typescript twoslash [src/lib/api.ts]
import { client } from './gen/client'

// Configure once, use everywhere
export function setupAuth(token: string) {
  client.setConfig({
    baseURL: 'https://api.example.com',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
```

## Related Resources

- [Troubleshooting](/getting-started/troubleshooting/) - Common issues and solutions
- [Configure](/getting-started/configure/) - Configuration options
- [Filter and Sort](/knowledge-base/filter-and-sort/) - Advanced filtering
- [Debugging](/knowledge-base/debugging/) - Debug Kubb generation
- [Custom Generators](/knowledge-base/generators/) - Create custom output
