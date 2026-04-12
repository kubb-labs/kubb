---
'@kubb/core': minor
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-solid-query': patch
'@kubb/plugin-svelte-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-vue-query': patch
---

## Replace `pre`/`post` with `dependencies` on plugins

The `pre` and `post` ordering fields on plugins have been replaced by a single `dependencies` array.

`dependencies` declares which plugins the current plugin depends on (i.e. must run before it), which is equivalent to the old `pre` field but with a clearer name.

### Migration

```ts
// Before
pluginClient({
  pre: ['@kubb/plugin-ts', '@kubb/plugin-zod'],
})

// After
pluginClient({
  dependencies: ['@kubb/plugin-ts', '@kubb/plugin-zod'],
})
```

All built-in plugins have been updated automatically. If you were setting `pre` or `post` directly on a custom plugin, update them to use `dependencies` instead.
