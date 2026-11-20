---
'@kubb/core': patch
---

Deprecate `addGenerator`, `setResolver`, `addMacro`, and `setMacros` on the plugin setup context. Call the composables of the same name from `@kubb/kit` inside `setup` instead. The context methods keep working until the next major version.
