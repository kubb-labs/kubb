---
'@kubb/plugin-react-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-solid-query': patch
'@kubb/plugin-svelte-query': patch
'@kubb/plugin-swr': patch
---

Fix `mutation: false` option being ignored in query plugins

When `mutation: false` was set in plugin configuration, mutation hooks were still being generated. This has been fixed by:

- Adding explicit `mutation === false` check in plugin initialization before setting defaults
- Adding `options.mutation !== false` guard to `isMutation` condition in mutation generators
- Fixing vitest configs to support `#mocks` import alias via `tsconfigPaths` plugin

Example:
```typescript
pluginReactQuery({
  mutation: false, // Now properly prevents mutation hook generation
  query: true,     // Only generates queryOptions
})
```
