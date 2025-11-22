# Research: Class-Based Client Generation for `@kubb/plugin-client`

## Executive Summary

This document outlines the research and proposed implementation strategy for adding class-based client generation to `@kubb/plugin-client`. The feature would allow users to generate API clients as classes with centralized configuration, eliminating the need to pass a custom client to every function call.

## Problem Statement

Currently, `@kubb/plugin-client` generates function-based clients where each operation is an independent async function. Users working with queue-based mass integrations or multi-tenant systems need to:

1. Pass a custom client configuration to **every single function call**
2. Implement internal tests to ensure the config isn't forgotten
3. Risk integration failures if the config is missed anywhere

### Current Workaround

Users currently wrap Kubb's functions manually:

```typescript
export function createClient(config: AuthConfig): ApiClient {
  const axiosClient = createAxiosClient(config);
  const fetcher = createFetcher(axiosClient);

  return {
    updateProductById: (productId, data, config) => {
      config = { client: fetcher, ...config };
      return operations.updateProductById(productId, data, config);
    },
    createProduct: (data, config) => {
      config = { client: fetcher, ...config };
      return operations.createProduct(data, config);
    },
    // ... more operations
  };
}
```

## Current Architecture Analysis

### Key Components

1. **Plugin Entry Point** (`packages/plugin-client/src/plugin.ts`)
   - Defines plugin options and configuration
   - Manages generators: `clientGenerator`, `groupedClientGenerator`, `operationsGenerator`
   - Handles file generation and barrel exports

2. **Client Generator** (`packages/plugin-client/src/generators/clientGenerator.tsx`)
   - Generates individual operation functions
   - Uses React-based component system for code generation
   - Creates one file per operation (or grouped by tag)

3. **Client Component** (`packages/plugin-client/src/components/Client.tsx`)
   - Core component that generates the function code
   - Handles params, types, and return values
   - Supports both `inline` and `object` param types

4. **Grouped Client Generator** (`packages/plugin-client/src/generators/groupedClientGenerator.tsx`)
   - Groups operations by tag
   - Creates a function that returns an object with all operations
   - Already demonstrates a pattern similar to what we need

5. **Client Templates** (`packages/plugin-client/templates/clients/`)
   - `axios.ts`: Axios-based client with global config
   - `fetch.ts`: Fetch-based client with global config
   - Both support `getConfig()` and `setConfig()` for centralized configuration

### Current Generated Output

**Function-based (current):**
```typescript
export async function getPetById(
  petId: GetPetByIdPathParams['petId'], 
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

## Proposed Solution

### Option 1: Class-Based Generator (Recommended)

Add a new `classMode` option to `@kubb/plugin-client` that generates a class with methods instead of standalone functions.

#### Configuration

```typescript
// kubb.config.ts
export default defineConfig({
  plugins: [
    pluginClient({
      output: {
        path: './clients',
      },
      classMode: true, // NEW OPTION
      client: 'axios',
    }),
  ],
})
```

#### Generated Output

```typescript
export class PetClient {
  private client: typeof fetch
  
  constructor(config: Partial<RequestConfig> = {}) {
    this.client = config.client || fetch
  }
  
  /**
   * @description Returns a single pet
   * @summary Find pet by ID
   */
  async getPetById(
    petId: GetPetByIdPathParams['petId'],
    config: Partial<RequestConfig> = {}
  ): Promise<GetPetByIdQueryResponse> {
    const requestConfig = { ...config }
    const res = await this.client<GetPetByIdQueryResponse, ResponseErrorConfig<GetPetById400 | GetPetById404>, unknown>({
      method: 'GET',
      url: `/pet/${petId}`,
      ...requestConfig,
    })
    return res.data
  }
  
  async addPet(
    data: AddPetMutationRequest,
    config: Partial<RequestConfig> = {}
  ): Promise<AddPetMutationResponse> {
    const requestConfig = { ...config }
    const requestData = data
    const res = await this.client<AddPetMutationResponse, ResponseErrorConfig<AddPet405>, AddPetMutationRequest>({
      method: 'POST',
      url: '/pet',
      data: requestData,
      ...requestConfig,
    })
    return res.data
  }
  
  // ... more methods
}
```

#### Usage

```typescript
// Create a client instance with custom config
const client = new PetClient({ 
  client: customAxiosInstance,
  baseURL: 'https://api.example.com'
})

// Use the client - no need to pass config every time
const pet = await client.getPetById('123')
const newPet = await client.addPet({ name: 'Fluffy', status: 'available' })

// Can still override config per-call if needed
const petWithCustomTimeout = await client.getPetById('123', { 
  signal: AbortSignal.timeout(5000) 
})
```

### Option 2: Hybrid Approach

Generate both functions AND a class that wraps them:

```typescript
// Individual functions (existing)
export async function getPetById(...) { ... }
export async function addPet(...) { ... }

// Class wrapper (new)
export class PetClient {
  private config: Partial<RequestConfig>
  
  constructor(config: Partial<RequestConfig> = {}) {
    this.config = config
  }
  
  async getPetById(petId: string, config?: Partial<RequestConfig>) {
    return getPetById(petId, { ...this.config, ...config })
  }
  
  async addPet(data: AddPetMutationRequest, config?: Partial<RequestConfig>) {
    return addPet(data, { ...this.config, ...config })
  }
}
```

**Pros:**
- Backward compatible - existing function-based code continues to work
- Users can choose which pattern to use
- Smaller implementation effort

**Cons:**
- Generates more code
- Two ways to do the same thing might be confusing

### Option 3: Factory Function Pattern

Generate a factory function that returns an object with bound methods:

```typescript
export function createPetClient(config: Partial<RequestConfig> = {}) {
  const client = config.client || fetch
  
  return {
    async getPetById(petId: string, overrideConfig?: Partial<RequestConfig>) {
      const res = await client({
        method: 'GET',
        url: `/pet/${petId}`,
        ...config,
        ...overrideConfig,
      })
      return res.data
    },
    
    async addPet(data: AddPetMutationRequest, overrideConfig?: Partial<RequestConfig>) {
      const res = await client({
        method: 'POST',
        url: '/pet',
        data,
        ...config,
        ...overrideConfig,
      })
      return res.data
    },
  }
}
```

**Pros:**
- More functional approach (aligns with current function-based style)
- No `this` context issues
- Tree-shakeable

**Cons:**
- Not a true class (might not meet user expectations)
- Less familiar pattern for OOP developers

## Implementation Plan

### Phase 1: Add Configuration Option

1. **Update Types** (`packages/plugin-client/src/types.ts`)
   ```typescript
   export type Options = {
     // ... existing options
     
     /**
      * Generate a class-based client instead of standalone functions
      * @default false
      */
     classMode?: boolean
     
     /**
      * Name of the generated class (only used when classMode is true)
      * @default (ctx) => `${ctx.group}Client` or 'ApiClient'
      */
     className?: string | ((context: { group?: string }) => string)
   }
   ```

2. **Update Plugin** (`packages/plugin-client/src/plugin.ts`)
   ```typescript
   export const pluginClient = definePlugin<PluginClient>((options) => {
     const {
       // ... existing options
       classMode = false,
       className,
       generators = [
         classMode ? classClientGenerator : clientGenerator,
         group && !classMode ? groupedClientGenerator : undefined,
         operations ? operationsGenerator : undefined
       ].filter(Boolean),
     } = options
     
     // ... rest of plugin
   })
   ```

### Phase 2: Create Class Generator

1. **Create New Generator** (`packages/plugin-client/src/generators/classClientGenerator.tsx`)
   ```typescript
   import { createReactGenerator } from '@kubb/plugin-oas/generators'
   import { ClassClient } from '../components/ClassClient'
   
   export const classClientGenerator = createReactGenerator<PluginClient>({
     name: 'classClient',
     Operations({ operations, generator, plugin }) {
       // Group all operations into a single class
       // Similar to groupedClientGenerator but generates a class
       
       const className = typeof plugin.options.className === 'function'
         ? plugin.options.className({ group: getGroup(operations[0]) })
         : plugin.options.className || 'ApiClient'
       
       return (
         <File baseName={className} path={...}>
           <ClassClient 
             name={className}
             operations={operations}
             options={plugin.options}
           />
         </File>
       )
     },
   })
   ```

2. **Create Class Component** (`packages/plugin-client/src/components/ClassClient.tsx`)
   ```typescript
   import { File, Class, Function } from '@kubb/react-fabric'
   
   export function ClassClient({ name, operations, options }) {
     return (
       <File.Source name={name} isExportable isIndexable>
         <Class name={name} export>
           {/* Constructor */}
           <Function 
             name="constructor"
             params="config: Partial<RequestConfig> = {}"
           >
             this.client = config.client || fetch
           </Function>
           
           {/* Generate method for each operation */}
           {operations.map(operation => (
             <ClassMethod
               key={operation.getOperationId()}
               operation={operation}
               options={options}
             />
           ))}
         </Class>
       </File.Source>
     )
   }
   ```

### Phase 3: Update React Fabric (if needed)

The `@kubb/react-fabric` package may need a `Class` component if it doesn't exist:

```typescript
// packages/react-fabric/src/components/Class.tsx
export function Class({ name, export: isExport, children }) {
  return (
    <>
      {isExport && 'export '}class {name} {'{'}
      {children}
      {'}'}
    </>
  )
}
```

### Phase 4: Handle Grouping

When `classMode` is enabled with `group` option:

```typescript
// Generate one class per tag/group
export class PetServiceClient { ... }
export class UserServiceClient { ... }
export class StoreServiceClient { ... }
```

### Phase 5: Documentation

1. Update `docs/plugins/plugin-client/index.md`
2. Add examples showing class-based usage
3. Add migration guide for users wanting to switch

## Technical Considerations

### 1. Backward Compatibility

- Default behavior remains unchanged (`classMode: false`)
- Existing configurations continue to work
- No breaking changes

### 2. Type Safety

- Class methods maintain full type safety
- Constructor accepts typed config
- Methods have proper return types and parameter types

### 3. Config Merging

```typescript
class ApiClient {
  private baseConfig: Partial<RequestConfig>
  
  constructor(config: Partial<RequestConfig> = {}) {
    this.baseConfig = config
  }
  
  async operation(params, config?: Partial<RequestConfig>) {
    // Merge: base config < method config < global config
    const mergedConfig = {
      ...this.baseConfig,
      ...config,
      headers: {
        ...this.baseConfig.headers,
        ...config?.headers,
      }
    }
    // Use mergedConfig
  }
}
```

### 4. Parser Support

Both `parser: 'client'` and `parser: 'zod'` should work with class mode:

```typescript
async getPetById(petId: string) {
  const res = await this.client<GetPetByIdQueryResponse, ...>({ ... })
  
  // With zod parser
  return GetPetByIdQueryResponseSchema.parse(res.data)
  
  // With client parser
  return res.data
}
```

### 5. Data Return Type

Support both `dataReturnType: 'data'` and `dataReturnType: 'full'`:

```typescript
// dataReturnType: 'data'
async getPetById(petId: string): Promise<GetPetByIdQueryResponse> {
  const res = await this.client({ ... })
  return res.data
}

// dataReturnType: 'full'
async getPetById(petId: string): Promise<ResponseConfig<GetPetByIdQueryResponse>> {
  const res = await this.client({ ... })
  return res
}
```

### 6. Bundle Support

When `bundle: true`, the class should import from the bundled client:

```typescript
import { fetch } from '../.kubb/fetch'
import type { RequestConfig, ResponseErrorConfig } from '../.kubb/fetch'

export class ApiClient {
  private client: typeof fetch
  // ...
}
```

## Alternative Approaches Considered

### 1. Separate Plugin

Create `@kubb/plugin-client-class` as a separate plugin.

**Pros:**
- Cleaner separation of concerns
- Users opt-in explicitly

**Cons:**
- More maintenance overhead
- Code duplication with `@kubb/plugin-client`
- Harder to keep in sync

### 2. Post-Processing Transform

Generate functions, then transform them into a class.

**Cons:**
- Complex AST manipulation
- Harder to maintain
- Less efficient

## Testing Strategy

1. **Unit Tests**
   - Test class generation with various options
   - Test method generation
   - Test config merging logic

2. **Integration Tests**
   - Generate class-based clients from real OpenAPI specs
   - Test with both axios and fetch clients
   - Test with zod parser
   - Test with grouping

3. **E2E Tests**
   - Add example project using class-based client
   - Test actual API calls with generated class

## Migration Path

For users wanting to migrate from function-based to class-based:

### Before (Function-based)
```typescript
import { getPetById, addPet } from './gen/clients'

const pet = await getPetById('123', { client: customClient })
const newPet = await addPet(data, { client: customClient })
```

### After (Class-based)
```typescript
import { ApiClient } from './gen/clients'

const client = new ApiClient({ client: customClient })
const pet = await client.getPetById('123')
const newPet = await client.addPet(data)
```

## Recommendation

**Implement Option 1 (Class-Based Generator)** with the following approach:

1. Add `classMode` boolean option (default: `false`)
2. Add optional `className` option for customization
3. Create new `classClientGenerator` that generates a single class with all operations as methods
4. When `group` is enabled with `classMode`, generate one class per group
5. Maintain full backward compatibility
6. Support all existing features (parser, dataReturnType, paramsType, etc.)

This approach:
- ✅ Solves the user's problem directly
- ✅ Maintains backward compatibility
- ✅ Follows existing patterns in the codebase
- ✅ Integrates cleanly with the generator architecture
- ✅ Supports all existing plugin features
- ✅ Provides a clear, intuitive API

## Next Steps

1. Get feedback on this research document
2. Create detailed implementation tasks
3. Implement Phase 1 (configuration)
4. Implement Phase 2 (class generator)
5. Add tests
6. Update documentation
7. Create example project
8. Release as minor version (non-breaking)

## References

- [Original Discussion #1886](https://github.com/kubb-labs/kubb/discussions/1886)
- Current implementation: `packages/plugin-client/`
- Similar pattern: `packages/plugin-client/src/generators/groupedClientGenerator.tsx`
- Client templates: `packages/plugin-client/templates/clients/`
