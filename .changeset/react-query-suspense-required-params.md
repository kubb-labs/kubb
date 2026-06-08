---
"@kubb/plugin-react-query": patch
---

Keep generated suspense hooks free of `enabled` guards and optional path params.

`useSuspenseQuery`/`useSuspenseInfiniteQuery` always run, and TanStack Query types `UseSuspenseQueryOptions` as `Omit<UseQueryOptions, 'enabled' | ...>`, so an `enabled` option is invalid for suspense hooks. The suspense generators reused the regular query-options logic, so `<op>SuspenseQueryOptions`/`<op>SuspenseInfiniteQueryOptions` and the hooks themselves widened required path params to `| undefined`, emitted an `enabled: !!(petId)` guard, and called the client with a non-null assertion (`petId!`).

Suspense options and hooks now keep required path params required, omit `enabled`, and drop the `!` assertion. Regular `useQuery`/`useInfiniteQuery` output is unchanged.

```ts
// before: petId was widened to `| undefined`, forcing a non-null assertion at every call site
// after: petId stays required and the hook type-checks as-is
useGetPetByIdSuspense(petId)
```
