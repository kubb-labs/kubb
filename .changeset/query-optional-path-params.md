---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-svelte-query': patch
'@kubb/plugin-solid-query': patch
---

Fix TypeScript contradiction where required path params in `queryOptions`/`queryKey` signatures prevented callers from passing `undefined` to conditionally disable a query.

**Issue**: Generated functions included `enabled: !!(petId)` to guard against missing path params, but the function signature kept those params as required — making it impossible to call the function with `undefined`.

**Fixed**: Path params in query function signatures (`queryOptions`, `queryKey`, `useQuery`/`createQuery`, `useInfiniteQuery`) now accept `undefined` (`petId: GetPetByIdPathParams['petId']`), matching the runtime behavior of the `enabled` guard. A `!` non-null assertion is added where the param is passed to the underlying client call, since the `enabled` guard guarantees the value is non-null at that point.

```typescript
// Before
export function getPetByIdQueryOptions(petId: GetPetByIdPathParams['petId']) {
  return queryOptions({
    enabled: !!petId, // contradiction: petId is required but guard implies it can be absent
    queryFn: async ({ signal }) => getPetById(petId, config),
  })
}

// After
export function getPetByIdQueryOptions(petId: GetPetByIdPathParams['petId'] | undefined) {
  return queryOptions({
    enabled: !!petId,
    queryFn: async ({ signal }) => getPetById(petId!, config), // non-null asserted
  })
}
```

Fixes [#3022](https://github.com/kubb-labs/kubb/issues/3022).
