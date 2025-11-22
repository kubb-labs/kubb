---
'@kubb/plugin-client': minor
---

Add `classMode` option for class-based client generation

Introduce an opt-in `classMode` option that generates TypeScript classes instead of standalone functions. When enabled, all operations become methods of a class with centralized configuration, eliminating the need to pass client config to every function call.

**New Options:**
- `classMode`: Generate class-based clients (default: `false`)
- `className`: Customize the generated class name (default: `'ApiClient'` or `(ctx) => \`${ctx.group}Client\`` when grouped)

**Usage:**
```typescript
pluginClient({
  classMode: true,
  className: 'PetStoreClient',
})
```

**Generated code:**
```typescript
const client = new PetStoreClient({ 
  client: customAxiosInstance,
  baseURL: 'https://api.example.com'
})

// Use without passing config every time
const pet = await client.getPetById('123')
const newPet = await client.addPet({ name: 'Fluffy' })
```

This is especially useful for multi-tenant systems and queue-based integrations where you need multiple client instances with different configurations.
