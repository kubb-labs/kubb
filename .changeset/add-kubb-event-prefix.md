---
'@kubb/core': minor
'@kubb/cli': patch
'unplugin-kubb': patch
'@kubb/agent': patch
'@kubb/mcp': patch
---

Prefix all event names with `kubb:`.

All `KubbEvents` event names are now namespaced to avoid collisions:

```ts
// before
events.on('plugin:end', handler)
events.on('error', handler)

// after
events.on('kubb:plugin:end', handler)
events.on('kubb:error', handler)
```
