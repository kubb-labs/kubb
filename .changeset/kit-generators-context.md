---
'@kubb/kit': patch
---

Run generators and the printer factory with the generator context, so composables such as `useConfig()` work in `match`, `schema`, `operation`, `operations` and `setPrinter`.

- `this`, `ctx` and `useKubb()` are the same object. `this` used to be the generator.
- The `kubb:generate:*` listeners get the generator context as `this`.
- `addGenerator`, `setResolver`, `addMacro`, `setMacros` and `setPrinter` report `KUBB_NO_CONTEXT` outside `setup` and `kubb:plugin:setup`.
