---
'@kubb/core': minor
'@kubb/ast': minor
---

Add `this.import(...)` to printer handlers and `printer.drainImports()`, so a `printer.nodes` handler can declare the import its output needs. Allow `resolver.imports` to be overridden through `ResolverPatch` without a cast.
