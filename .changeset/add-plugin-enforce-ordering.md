---
'@kubb/core': minor
---

Add `enforce: 'pre' | 'post'` plugin ordering.

Plugins can now declare their execution order relative to all others using the `enforce` field (matching Vite's convention). Plugins with `enforce: 'pre'` run before normal plugins; `enforce: 'post'` run after.

```ts
export const pluginBarrel = definePlugin<PluginBarrel>((options) => ({
  name: 'plugin-barrel',
  enforce: 'post', // always runs after all normal plugins
  hooks: { /* ... */ },
}))
```

Execution order: `pre → normal → post`. Existing `dependencies` constraints still take precedence within each group.
