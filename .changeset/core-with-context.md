---
'@kubb/core': patch
'@kubb/kit': patch
---

Add `withContext(ctx, fn)`, which runs `fn` with `ctx` as its `this`, its argument and the value of `useKubb()`.

- `setup` and `kubb:plugin:setup` run through it, and `defineExtension` types `this` there with no annotation.
- `useKubb()` and `tryUseKubb()` take the context type as their type argument, such as `useKubb<KubbPluginSetupContext<MyPlugin>>()`.
- `setOptions()`, `useOptions()` and `injectFile()` report `KUBB_NO_CONTEXT` outside setup.
