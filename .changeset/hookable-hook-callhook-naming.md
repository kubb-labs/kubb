---
'@kubb/core': major
---

Rename `Hookable`'s `on`/`emit`/`off`/`removeAll` to `hook`/`callHook`/`removeHook`/`removeAllHooks`, matching the naming convention used by [unjs/hookable](https://github.com/unjs/hookable) (the library Nuxt and Nitro use for their own hook systems).

- `hooks.on(name, handler)` → `hooks.hook(name, handler)`
- `hooks.emit(name, ...args)` → `hooks.callHook(name, ...args)`
- `hooks.off(name, handler)` → `hooks.removeHook(name, handler)`
- `hooks.removeAll()` → `hooks.removeAllHooks()`
- `hooks.listenerCount(name)` and `hooks.setMaxListeners(max)` are unchanged.

This affects any code that calls these methods directly on the `hooks` option/property of
`createKubb`/`KubbDriver`, or on a `LoggerContext` inside a custom `defineLogger` install
callback. Update the four call names above; behavior (sequential await, error wrapping,
listener counting, the leak-warning ceiling) is unchanged.
