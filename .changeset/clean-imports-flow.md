---
'@kubb/core': minor
'@kubb/ast': minor
---

Add `output.imports` to plugin output options so every file a plugin generates can declare package imports. Kubb removes them from files that don't use the name. Allow `resolver.imports` to be overridden through `ResolverPatch` without a cast. Add `this.import(...)` to printer handlers and `printer.takeImports()` so a `printer.nodes` handler can declare the import its output needs.
