# Class-Based Client Generation - Executive Summary

## Quick Overview

This research proposes adding a `classMode` option to `@kubb/plugin-client` that generates TypeScript classes instead of standalone functions for API operations.

## The Problem

Users working with multi-tenant systems or queue-based integrations currently need to pass a custom client configuration to **every single function call**:

```typescript
// Current approach - repetitive and error-prone
const pet1 = await getPetById('123', { client: customClient })
const pet2 = await addPet(data, { client: customClient })
const pet3 = await updatePet(data, { client: customClient })
// Easy to forget the config and break the integration!
```

## The Solution

Generate classes with centralized configuration:

```typescript
// Proposed approach - configure once, use everywhere
const client = new PetStoreClient({ client: customClient })

const pet1 = await client.getPetById('123')
const pet2 = await client.addPet(data)
const pet3 = await client.updatePet(data)
// Config is always applied, no risk of forgetting!
```

## Key Features

### 1. Simple Configuration

```typescript
// kubb.config.ts
export default defineConfig({
  plugins: [
    pluginClient({
      classMode: true, // Enable class-based generation
      className: 'ApiClient', // Optional: customize class name
      client: 'axios',
    }),
  ],
})
```

### 2. Generated Class Structure

```typescript
export class ApiClient {
  private client: typeof fetch
  private baseConfig: Partial<RequestConfig>

  constructor(config: Partial<RequestConfig> = {}) {
    this.client = config.client || fetch
    this.baseConfig = config
  }

  async getPetById(petId: string, config?: Partial<RequestConfig>) {
    const mergedConfig = this.mergeConfig(config)
    const res = await this.client({ method: 'GET', url: `/pet/${petId}`, ...mergedConfig })
    return res.data
  }

  // ... more methods for each operation

  private mergeConfig(config: Partial<RequestConfig>) {
    return { ...this.baseConfig, ...config, headers: { ...this.baseConfig.headers, ...config.headers } }
  }
}
```

### 3. Works with Grouping

When combined with `group` option, generates one class per tag:

```typescript
// Generated files:
// - PetClient.ts
// - UserClient.ts  
// - StoreClient.ts

const petClient = new PetClient({ baseURL: 'https://api.example.com' })
const userClient = new UserClient({ baseURL: 'https://api.example.com' })
```

### 4. Supports All Existing Features

- ✅ Zod parser (`parser: 'zod'`)
- ✅ Data return types (`dataReturnType: 'data' | 'full'`)
- ✅ Param types (`paramsType: 'inline' | 'object'`)
- ✅ Path param types (`pathParamsType: 'inline' | 'object'`)
- ✅ Custom base URLs (`baseURL: '...'`)
- ✅ Bundle mode (`bundle: true`)
- ✅ Both axios and fetch clients

## Implementation Approach

### Architecture

```
Plugin Options (classMode: true)
    ↓
Class Client Generator (new)
    ↓
ClassClient Component (new)
    ↓
Reuses existing Client component logic
    ↓
Generated TypeScript class files
```

### Key Changes Required

1. **Add options to types** (`src/types.ts`)
   - `classMode?: boolean`
   - `className?: string | ((context) => string)`

2. **Create class generator** (`src/generators/classClientGenerator.tsx`)
   - Similar to existing `groupedClientGenerator`
   - Groups all operations into a class

3. **Create ClassClient component** (`src/components/ClassClient.tsx`)
   - Generates class structure
   - Reuses existing `Client` component logic for method bodies

4. **Update plugin** (`src/plugin.ts`)
   - Select class generator when `classMode: true`
   - Default to existing function generator when `classMode: false`

### Backward Compatibility

- ✅ **No breaking changes** - default behavior unchanged
- ✅ **Opt-in feature** - users must explicitly set `classMode: true`
- ✅ **Existing configs work** - all current configurations continue to function

## Real-World Use Case

### Multi-Tenant SaaS Integration

```typescript
// Process integrations for multiple tenants in a queue
async function processIntegrationQueue(queue: IntegrationTask[]) {
  const clientsByTenant = new Map<string, PetStoreClient>()
  
  for (const task of queue) {
    // Get or create client for this tenant
    if (!clientsByTenant.has(task.tenantId)) {
      const axiosInstance = createAxiosInstance({
        tenantId: task.tenantId,
        apiKey: await getTenantApiKey(task.tenantId),
      })
      
      clientsByTenant.set(
        task.tenantId,
        new PetStoreClient({
          client: axiosInstance,
          baseURL: `https://${task.tenantId}.api.example.com`,
        })
      )
    }
    
    const client = clientsByTenant.get(task.tenantId)!
    
    // Execute task - no need to pass config every time!
    switch (task.operation) {
      case 'CREATE_PET':
        await client.addPet(task.data)
        break
      case 'UPDATE_PET':
        await client.updatePet(task.data)
        break
      case 'GET_PET':
        await client.getPetById(task.petId)
        break
    }
  }
}
```

## Benefits

### For Users

1. **Eliminates repetition** - Configure client once, use everywhere
2. **Reduces errors** - No risk of forgetting to pass config
3. **Better DX** - More intuitive API for OOP developers
4. **Easier testing** - Simple to mock and inject dependencies
5. **Multi-tenant friendly** - Easy to manage multiple client instances

### For Kubb

1. **Competitive feature** - Other code generators offer class-based clients
2. **Maintains flexibility** - Users can choose function or class style
3. **Leverages existing code** - Reuses current generator logic
4. **Non-breaking** - Backward compatible addition

## Comparison with Alternatives

### Option 1: Class-Based (Recommended) ⭐

```typescript
const client = new ApiClient({ client: customClient })
await client.getPetById('123')
```

**Pros:** Solves problem directly, familiar pattern, type-safe
**Cons:** Requires new generator

### Option 2: Factory Function

```typescript
const client = createApiClient({ client: customClient })
await client.getPetById('123')
```

**Pros:** More functional, no `this` context
**Cons:** Not a true class, less familiar to OOP developers

### Option 3: Wrapper Class (Manual)

```typescript
// User creates their own wrapper
class MyClient {
  constructor(config) { this.config = config }
  getPetById(id) { return getPetById(id, this.config) }
}
```

**Pros:** No changes to Kubb
**Cons:** Defeats purpose of code generation, lots of boilerplate

## Implementation Timeline

### Phase 1: Core Implementation (1-2 weeks)
- Add `classMode` and `className` options
- Create `classClientGenerator`
- Create `ClassClient` component
- Basic tests

### Phase 2: Feature Parity (1 week)
- Support all existing options (parser, dataReturnType, etc.)
- Support grouping
- Comprehensive tests

### Phase 3: Documentation & Examples (3-5 days)
- Update documentation
- Add example projects
- Migration guide

### Phase 4: Release (1 day)
- Release as minor version (non-breaking)
- Announce feature

**Total: ~3 weeks**

## Recommendation

✅ **Implement class-based client generation** with the following:

1. Add `classMode: boolean` option (default: `false`)
2. Add optional `className` customization
3. Create new `classClientGenerator`
4. Reuse existing `Client` component logic
5. Support all existing features
6. Maintain full backward compatibility
7. Release as minor version

This approach directly solves the user's problem while maintaining Kubb's flexibility and backward compatibility.

## Files to Review

For detailed information, see:

- **`RESEARCH_CLASS_BASED_CLIENT.md`** - Full research document with technical details
- **`IMPLEMENTATION_EXAMPLE.md`** - Concrete code examples and usage patterns

## Next Steps

1. ✅ Research completed
2. ⏳ Get feedback from maintainers
3. ⏳ Create implementation tasks
4. ⏳ Begin development
5. ⏳ Add tests
6. ⏳ Update documentation
7. ⏳ Release

---

**Questions or feedback?** Please comment on [Discussion #1886](https://github.com/kubb-labs/kubb/discussions/1886)
