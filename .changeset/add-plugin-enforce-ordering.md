---
'@kubb/core': minor
---

Add `enforce: 'pre' | 'post'` plugin ordering to core.

The `Plugin` type now supports an `enforce` field (matching Vite's plugin convention) to control execution order: `'pre'` plugins run first, `'post'` plugins run last, and plugins without `enforce` run in the middle.

```ts
definePlugin({
  name: 'my-post-plugin',
  enforce: 'post',
  hooks: {
    // ...
  },
})
```

`FileManager.files` now sorts `index.ts` barrel files last within the same path-depth bucket so source files are always processed before their barrel.

`KubbBuildStartContext.files` is now a lazy `readonly` property instead of a callable function.
