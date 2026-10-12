---
'@kubb/core': minor
'@kubb/kit': minor
---

Add composables to `kubb/kit`, so plugins can call `addGenerator()` and the other setup helpers inside `kubb:plugin:setup` without passing `ctx` around.

- `addGenerator()`, `setResolver()`, `addMacro()`, `setMacros()`, `setOptions()`, and `injectFile()` each call the `ctx` method with that name.
- `usePlugin(name)` returns another plugin from the config, typed through `Kubb.PluginRegistry`. It fails with `KUBB_PLUGIN_NOT_FOUND` like `ctx.requirePlugin`.
- `useOptions()` and `useConfig()` return `ctx.options` and `ctx.config`.
- `useKubb()` returns the setup context. `tryUseKubb()` returns `undefined` outside setup.

The context survives an `await` in setup and is scoped to one plugin at a time. Calling a composable outside setup fails with the new `KUBB_NO_CONTEXT` diagnostic.

```ts
import { addGenerator, definePlugin, setResolver } from 'kubb/kit'

export const pluginExample = definePlugin(() => ({
  name: 'plugin-example',
  hooks: {
    async 'kubb:plugin:setup'() {
      await loadTemplates()
      setResolver(resolverExample)
      addGenerator(exampleGenerator)
    },
  },
}))
```
