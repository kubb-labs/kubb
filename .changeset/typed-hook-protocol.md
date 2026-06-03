---
'@kubb/core': minor
---

Collapse the driver's two listener trackers (`#hookListeners` and `#middlewareListeners`) into one typed `HookRegistry` that wraps `AsyncEventEmitter`. Listeners attached directly via `kubb.hooks.on(...)` survive `dispose()`. Only listeners the driver itself registered are removed. Internal refactor: every `(...args: Array<never>)` cast inside `KubbDriver` is gone, and the public `definePlugin`, `KubbHooks`, and `kubb.hooks` surfaces are unchanged.
