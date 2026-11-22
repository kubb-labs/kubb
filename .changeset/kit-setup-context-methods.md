---
'@kubb/kit': patch
---

Add `addGenerator`, `setResolver`, `addMacro`, `setMacros` and `setPrinter` as methods on kit's setup context, next to the composables.

- `setup(options, kubb) { kubb.addGenerator(generator) }` works, with `kubb` typed as `KitSetupContext`.
- A setup context that already has one of these methods, such as a test mock, keeps its own.
