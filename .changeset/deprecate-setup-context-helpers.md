---
'@kubb/core': patch
---

Deprecate `addGenerator`, `setResolver`, `addMacro`, and `setMacros` on the plugin setup context. Call the composables of the same name from `@kubb/kit` in `setup` or `kubb:plugin:setup` instead. The context methods still work.
