---
'@kubb/core': major
---

Rename the hook system to match [unjs/hookable](https://github.com/unjs/hookable), the library Nuxt and Nitro use for their own hooks, and prefix every event name with `kubb:`.

`KubbEvents` is now `KubbHooks`, and `driver.hooks` is the primary emitter API (`events` stays as a deprecated alias). Its methods are renamed to match hookable's convention:

```diff
- hooks.on(name, handler)
+ hooks.hook(name, handler)

- hooks.emit(name, ...args)
+ hooks.callHook(name, ...args)

- hooks.off(name, handler)
+ hooks.removeHook(name, handler)

- hooks.removeAll()
+ hooks.removeAllHooks()
```

`listenerCount(name)` and `setMaxListeners(max)` keep their names. Every event name is now namespaced to avoid collisions with listeners from other tools sharing the same process:

```diff
- events.on('plugin:end', handler)
- events.on('error', handler)
+ events.on('kubb:plugin:end', handler)
+ events.on('kubb:error', handler)
```

This affects any code that calls these methods directly on the `hooks` option/property of `createKubb`/`KubbDriver`, or on a `LoggerContext` inside a custom `defineLogger` install callback. Behavior (sequential await, error wrapping, listener counting, the leak-warning ceiling) is unchanged.
