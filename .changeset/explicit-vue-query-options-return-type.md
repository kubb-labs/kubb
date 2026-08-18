---
'@kubb/plugin-vue-query': patch
---

Emit explicit return types on generated `*QueryOptions` and `*InfiniteQueryOptions` functions (`UndefinedInitialQueryOptions`/`UndefinedInitialDataInfiniteOptions` plus the `DataTag`-branded `queryKey`).
Without the annotation, consumers running `tsc` with declaration emit against `@tanstack/vue-query` >= 5.98.0 fail with TS2527/TS2883 because the inferred return type references non-exported unique symbols (see [TanStack/query#10904](https://github.com/TanStack/query/issues/10904)).
The referenced types are available in `@tanstack/vue-query` >= 5.81.5 (verified floor).
