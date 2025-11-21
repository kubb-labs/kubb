---
"@kubb/plugin-react-query": minor
---

Add support for `useSuspenseInfiniteQuery` hook generation

This release adds support for generating `useSuspenseInfiniteQuery` hooks, enabling React Suspense with infinite queries in TanStack Query v5+. 

**New Features:**
- Generate `useSuspenseInfiniteQuery` hooks when both `suspense` and `infinite` options are enabled
- Support for both cursor-based and offset-based pagination
- Full TypeScript type safety with proper generics
- Automatic validation of required query parameters and response fields

**Usage:**
```typescript
pluginReactQuery({
  suspense: {},
  infinite: {
    queryParam: 'pageSize',
    initialPageParam: 0,
    cursorParam: 'nextCursor', // optional
  },
})
```

This will generate hooks like `useFindPetsByTagsSuspenseInfinite` alongside the existing query hooks.
