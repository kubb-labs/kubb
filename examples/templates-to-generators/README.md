# Templates to Generators Migration Example

This example demonstrates how to migrate from Kubb v2.x `templates` pattern to v4 `generators` pattern.

## What's Included

This example shows a complete conversion of a v2.x template that included:

- ✅ Performance timing with `timed()` function
- ✅ FormData handling for multipart uploads
- ✅ Custom headers support
- ✅ TanStack Query v4/v5 compatibility
- ✅ Infinite query support with custom pagination
- ✅ Zod parser integration
- ✅ Full/data return type support

## Files

- **`kubb.config.ts`** - Configuration showing both default plugins and custom generator
- **`src/generators/customQueryOptionsGenerator.tsx`** - Custom generator converted from v2.x template
- **`petStore.yaml`** - OpenAPI specification
- **`package.json`** - Dependencies

## Installation

```bash
# Install dependencies
pnpm install
```

## Usage

```bash
# Clean previous output
pnpm clean

# Generate code
pnpm generate

# Type check generated code
pnpm typecheck
```

## Generated Output

The generator will create files in `./src/gen/`:

```
src/gen/
├── types/          # TypeScript types
├── zod/            # Zod schemas
├── clients/        # API client functions
└── hooks/          # React Query hooks (with custom query options)
```

## Key Features

### Performance Timing

All queries automatically log execution time:

```typescript
console.log(`[perf] getPetById: 45.2ms`)
```

### FormData Support

Automatically handles multipart/form-data endpoints:

```typescript
const formData = new FormData()
if(data) {
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (typeof key === "string" && (typeof value === "string" || value instanceof Blob)) {
      formData.append(key, value);
    }
  })
}
```

### Custom Headers

Supports custom content types and headers:

```typescript
headers: {
  'Content-Type': 'multipart/form-data',
  ...headers,
  ...config.headers
}
```

### Infinite Queries

Automatic pagination support for list endpoints:

```typescript
infiniteQueryOptions({
  queryKey,
  queryFn: async ({ pageParam, signal }) => {
    // ... with pageParam handling
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextPage,
  getPreviousPageParam: (firstPage) => firstPage.prevPage,
})
```

## Migration from v2.x

If you had v2.x templates like:

```typescript
// v2.x approach (deprecated)
export const templates = {
  queryOptions: {
    ...QueryOptions.templates,
    react: ({ name, params, client, hook }) => {
      // custom logic
    }
  }
}

pluginTanstackQuery({ templates })
```

You now use:

```typescript
// v4 approach
export const customGenerator = createReactGenerator<PluginReactQuery>({
  name: 'custom-query-options',
  Operation({ operation, generator, plugin }) {
    // custom logic
    return <File>...</File>
  }
})

pluginOas({ generators: [customGenerator] })
```

## Documentation

For more details, see:
- [Templates to Generators Migration Guide](https://kubb.dev/knowledge-base/templates-to-generators/)
- [Complete v4 Generator Example](https://kubb.dev/knowledge-base/templates-to-generators-v4-example/)
- [Generators Documentation](https://kubb.dev/knowledge-base/generators/)

## Notes

- This example runs alongside the default `pluginReactQuery` generator
- The custom generator only processes GET operations
- Performance timing is automatically added to all queries
- FormData handling works for file upload endpoints
- Compatible with TanStack Query v4 and v5
