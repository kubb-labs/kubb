# Feature Implementation: useSuspenseInfiniteQuery Support

## Summary

This PR implements support for generating `useSuspenseInfiniteQuery` hooks in the `@kubb/plugin-react-query` package. This allows users to leverage React Suspense with infinite queries in TanStack Query v5.

## What was implemented

### New Components

1. **SuspenseInfiniteQueryOptions.tsx** - Component that generates the query options for suspense infinite queries
   - Location: `/packages/plugin-react-query/src/components/SuspenseInfiniteQueryOptions.tsx`
   - Generates `infiniteQueryOptions` configuration with pagination support
   - Supports both cursor-based and offset-based pagination

2. **SuspenseInfiniteQuery.tsx** - Component that generates the suspense infinite query hook
   - Location: `/packages/plugin-react-query/src/components/SuspenseInfiniteQuery.tsx`
   - Generates `useSuspenseInfiniteQuery` hook with proper TypeScript types
   - Includes support for custom query keys, page params, and error handling

### New Generator

3. **suspenseInfiniteQueryGenerator.tsx** - Generator that orchestrates the creation of suspense infinite query files
   - Location: `/packages/plugin-react-query/src/generators/suspenseInfiniteQueryGenerator.tsx`
   - Validates that both `suspense` and `infinite` options are enabled
   - Validates that the operation has the required query parameters for pagination
   - Generates complete files with imports, types, and hooks

### Tests

4. **suspenseInfiniteQueryGenerator.test.tsx** - Test suite for the new generator
   - Location: `/packages/plugin-react-query/src/generators/suspenseInfiniteQueryGenerator.test.tsx`
   - Tests both cursor-based and offset-based pagination scenarios
   - Uses the existing test infrastructure with mocked plugin manager

5. **Snapshot files** - Expected output for test cases
   - `findSuspenseInfiniteByTags.ts` - Offset-based pagination example
   - `findSuspenseInfiniteByTagsCursor.ts` - Cursor-based pagination example

### Updated Files

6. **plugin.ts** - Updated to include the new generator in the default generators list
7. **components/index.ts** - Added exports for the new components
8. **generators/index.ts** - Added export for the new generator

## How to use

To enable `useSuspenseInfiniteQuery` hook generation, configure the plugin with both `suspense` and `infinite` options:

```typescript
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
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
    pluginReactQuery({
      output: {
        path: './hooks',
      },
      // Enable suspense queries
      suspense: {},
      // Enable infinite queries with pagination config
      infinite: {
        queryParam: 'pageSize',      // Query param used for pagination
        initialPageParam: 0,          // Initial page value
        cursorParam: 'nextCursor',    // Optional: field in response for cursor
      },
    }),
  ],
})
```

## Generated Output

For an operation like `GET /pet/findByTags`, the generator will create:

1. **Query Key**: `findPetsByTagsSuspenseInfiniteQueryKey`
2. **Query Options Function**: `findPetsByTagsSuspenseInfiniteQueryOptions`
3. **Hook**: `useFindPetsByTagsSuspenseInfinite`

Example generated hook:

```typescript
export function useFindPetsByTagsSuspenseInfinite<
  TQueryFnData = FindPetsByTagsQueryResponse,
  TError = ResponseErrorConfig<FindPetsByTags400>,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = FindPetsByTagsSuspenseInfiniteQueryKey,
  TPageParam = NonNullable<FindPetsByTagsQueryParams['pageSize']>,
>(
  headers: FindPetsByTagsHeaderParams,
  params?: FindPetsByTagsQueryParams,
  options: {
    query?: Partial<UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>> & { client?: QueryClient }
    client?: Partial<RequestConfig> & { client?: typeof fetch }
  } = {},
) {
  // Implementation...
}
```

## Technical Details

### Generator Logic

The `suspenseInfiniteQueryGenerator` only generates hooks when:
1. The operation is a query (GET method by default)
2. The operation is not a mutation
3. The `suspense` option is enabled
4. The `infinite` option is enabled with proper configuration
5. The operation has the required query parameter for pagination
6. If a cursor param is specified, the response schema contains that field

### Type Safety

All generated hooks maintain full TypeScript type safety:
- Generic types for query data, error types, and transformed data
- Proper inference of page param types from query params
- Support for custom query keys and query clients

### Compatibility

This feature is compatible with:
- TanStack Query v5+ (which introduced `useSuspenseInfiniteQuery`)
- React 18+ (for Suspense support)
- All existing plugin options and configurations

## Files Changed

### New Files (6)
- `packages/plugin-react-query/src/components/SuspenseInfiniteQuery.tsx`
- `packages/plugin-react-query/src/components/SuspenseInfiniteQueryOptions.tsx`
- `packages/plugin-react-query/src/generators/suspenseInfiniteQueryGenerator.tsx`
- `packages/plugin-react-query/src/generators/suspenseInfiniteQueryGenerator.test.tsx`
- `packages/plugin-react-query/src/generators/__snapshots__/findSuspenseInfiniteByTags.ts`
- `packages/plugin-react-query/src/generators/__snapshots__/findSuspenseInfiniteByTagsCursor.ts`

### Modified Files (3)
- `packages/plugin-react-query/src/plugin.ts`
- `packages/plugin-react-query/src/components/index.ts`
- `packages/plugin-react-query/src/generators/index.ts`

## Testing

The implementation includes comprehensive tests that verify:
- Correct generation of suspense infinite query hooks
- Support for both offset and cursor-based pagination
- Proper integration with existing plugin infrastructure
- Snapshot testing to ensure consistent output

To run the tests:
```bash
cd packages/plugin-react-query
pnpm test suspenseInfiniteQueryGenerator
```

## Related Documentation

- [TanStack Query - useSuspenseInfiniteQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseInfiniteQuery)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Kubb Plugin React Query Documentation](https://kubb.dev/plugins/plugin-react-query/)
