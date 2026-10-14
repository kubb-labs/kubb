---
'@kubb/core': patch
---

Remove unused core surface so plugins build on a smaller API.

- Remove `Storage.existsItem`, `Reporter[Symbol.dispose]`, `FileManagerHooks` and `FileManager#hooks`. `FileManager.write()` now emits `kubb:files:processing:*` on the kubb hooks it receives.
- `createAdapter`, `defineParser` and `definePlugin` accept only the definition object. The factory-function form and the parser `setup` alias are gone. Use `defineExtension`.
- `Hookable` no longer wraps `EventEmitter`, and `setMaxListeners` is a no-op.
- Remove `applyConfigDefaults`. The `defineConfig` defaults live in `unplugin-kubb` as `applyDefaults`.
- Macros run through `@kubb/ast` `applyMacros` instead of a per-plugin transform cache. Output is unchanged.

```typescript
// Before
const plugin = definePlugin(() => ({ meta: { name: 'x' }, hooks: {} }))

// After
const plugin = defineExtension({ kind: 'plugin', meta: { name: 'x' }, setup() {} })
```
