---
'@kubb/kit': patch
---

Run generators and the printer factory through `withContext`. In a generator's `match`, `schema`, `operation` and `operations`, and in a `setPrinter` factory, `this`, `ctx` and `useKubb()` are now the same context, so composables such as `useConfig()` work there. `this` in a generator method used to be the generator object. The `kubb:generate:schema`, `kubb:generate:operation` and `kubb:generate:operations` listeners also get the generator context as `this`. `addGenerator`, `setResolver`, `addMacro`, `setMacros` and `setPrinter` now report `KUBB_NO_CONTEXT` outside `setup` and `kubb:plugin:setup`, instead of registering in the middle of the walk.
