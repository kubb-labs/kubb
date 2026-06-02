---
'@kubb/core': minor
---

Add a typed `HookRegistry` that wraps `AsyncEventEmitter` and declares each `KubbHooks` event's dispatch kind (`sequential` today, `firstResult` reserved for future Rollup-style short-circuit hooks). The driver now tracks plugin, middleware, and generator listeners in one place, so a single `dispose()` clears every listener the driver added while listeners attached directly via `hooks.on(...)` survive. Internal refactor: every `(...args: Array<never>)` cast inside `KubbDriver` is gone, the public `definePlugin`, `KubbHooks`, and `kubb.hooks` surfaces are unchanged, and `HookRegistry`, `HookKind`, `HookSource`, `HookListener`, `kubbHookKinds`, and `KubbHookKinds` are exported for plugin authors who want to target the protocol.
