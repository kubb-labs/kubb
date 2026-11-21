---
'@kubb/kit': patch
---

Add `addGenerator`, `setResolver`, `addMacro`, `setMacros` and `setPrinter` as methods on the setup context of a plugin defined with kit's `defineExtension`, so `setup(options, kubb) { kubb.addGenerator(generator) }` works next to the composables. `kubb` is typed as the new exported `KitSetupContext`.
